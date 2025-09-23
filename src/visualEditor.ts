import * as vscode from 'vscode';

import { JSDOM } from 'jsdom';
import he from 'he';
import path from 'path';

export class VisualEditorProvider implements vscode.CustomTextEditorProvider {

  public activeCode: vscode.TextDocument | null = null;

  private editorOptions = { insertSpaces: true, indentSize: 2, indentChar: ' ', indentUnit: '  ' };
  private readonly codes = new Map<vscode.TextDocument, Set<vscode.WebviewPanel>>();
  private readonly editedBy = new Set<vscode.WebviewPanel>();
  private readonly resources = new Map<string, Set<vscode.TextDocument>>();
  private readonly editQueues = new Map<string, Promise<void>>();

  constructor(private readonly context: vscode.ExtensionContext) {
    // Get and update indentation setting
    const editorConfig = vscode.workspace.getConfiguration('editor', { languageId: 'html' });
    const insertSpaces = editorConfig.get<boolean>('insertSpaces');
    const indentSize = editorConfig.get<number>('tabSize')!;
    Object.assign(this.editorOptions, {
      insertSpaces,
      indentSize,
      indentChar: insertSpaces ? ' ' : '\t',
      indentUnit: insertSpaces ? ' '.repeat(indentSize) : '\t'
    });
    vscode.window.onDidChangeVisibleTextEditors(editors => {
      const htmlEditor = editors.find(e => e.document.languageId === 'html');
      if (!htmlEditor) { return; }
      const options = htmlEditor.options;
      Object.assign(this.editorOptions, {
        insertSpaces: options.insertSpaces,
        indentSize: options.indentSize
      });
    });
    // Process when file save
    vscode.workspace.onDidSaveTextDocument(document => {
      this.resources.get(document.uri.fsPath)?.forEach(code => {
        this.codes.get(code)!.forEach(({ webview }) => {
          this.updateWebview(webview, code);
        });
      });
    });
    // Process when source code changes
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.contentChanges.length === 0) { return; }
      const code = event.document;
      this.codes.get(code)?.forEach(panel => {
        if (this.editedBy.delete(panel)) {
          this.postCodeRanges(code, panel);
          return;
        }
        this.updateWebview(panel.webview, code);
      });
    });
    // Process when text selection is changed
    vscode.window.onDidChangeTextEditorSelection(event => {
      const code = event.textEditor.document;
      if (!this.codes.has(code) || (
        event.kind && (
          event.kind !== vscode.TextEditorSelectionChangeKind.Keyboard
          && event.kind !== vscode.TextEditorSelectionChangeKind.Mouse
        )
      )) {
        return;
      }
      const positions = event.selections.filter(
        s => !s.isEmpty
      ).map(
        s => ({ start: code.offsetAt(s.start), end: code.offsetAt(s.end) })
      );
      if (positions.length === 0) { return; }
      this.codes.get(code)?.forEach(panel => {
        panel.webview.postMessage({
          type: 'select',
          data: positions
        });
      });
    });
  }

  private postCodeRanges(code: vscode.TextDocument, panel: vscode.WebviewPanel) {
    const dom = new JSDOM(code.getText(), { includeNodeLocations: true });
    const elements = Array.from(dom.window.document.querySelectorAll('body *, body'));
    const data = elements
      .map(element => ({ element, range: dom.nodeLocation(element) }))
      .filter(item => item.range)
      .map(({ element, range }) => ({
        element: this.shortName(element as Element),
        start: (range as any).startOffset,
        end: (range as any).endOffset
      }));
    panel.webview.postMessage({ type: 'codeRanges', data });
  }

  public async resolveCustomTextEditor(
    code: vscode.TextDocument,
    panel: vscode.WebviewPanel,
    _: vscode.CancellationToken
  ): Promise<void> {
    // Manage webview panels
    if (this.codes.has(code)) {
      this.codes.get(code)?.add(panel);
    } else {
      const panels = new Set<vscode.WebviewPanel>();
      panels.add(panel);
      this.codes.set(code, panels);
    }
    panel.onDidChangeViewState(event => {
      if (event.webviewPanel.visible) { this.activeCode = code; }
    });
    // Initialize WebView
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'webview')),
        vscode.Uri.file(path.dirname(code.uri.fsPath))
      ]
    };
    panel.onDidDispose(() => {
      this.codes.get(code)?.delete(panel);
      this.editedBy.delete(panel);
      if (this.codes.get(code)?.size === 0) {
        this.codes.delete(code);
      }
    });
    // Message from WebView
    panel.webview.onDidReceiveMessage(async event => {
      switch (event.type) {
        case 'state':
          this.codes.get(code)?.forEach(p => {
            if (p === panel) { return; }
            p.webview.postMessage(event);
          });
          break;
        case 'refresh':
          this.updateWebview(panel.webview, code);
          break;
        case 'styleChange':
          await this.handleStyleChange(code, event.data);
          break;
        case 'tailwindStyleChange':
          await this.handleTailwindStyleChange(code, panel, event.data);
          break;
        case 'cssToTailwindRequest':
          await this.handleCSSToTailwindRequest(panel, event);
          break;
        case 'select':
          this.selectElements(code, event);
          break;
        case 'edit':
          this.enqueueEditOperation(code, panel, event.data);
          break;
        case 'delete':
          // Mark as source to suppress webview refresh triggered by this edit
          this.editedBy.add(panel);
          await this.deleteElements(code, this.getNiceRanges(code, event.data));
          break;
        case 'copy':
          this.copyElements(code, this.getNiceRanges(code, event.data));
          break;
        case 'cut':
          {
            const niceRanges = this.getNiceRanges(code, event.data);
            this.copyElements(code, niceRanges);
            // Mark as source and await deletion to keep state consistent
            this.editedBy.add(panel);
            await this.deleteElements(code, niceRanges);
          }
          break;
        case 'paste':
          // Ensure both insert and format edits are attributed to this panel
          await this.pasteToElement(code, event, panel);
          break;
      }
    });
    // Update webview
    this.updateWebview(panel.webview, code);
    this.activeCode = code;
  }

  private enqueueEditOperation(code: vscode.TextDocument, panel: vscode.WebviewPanel, edits: any[]) {
    const key = code.uri.toString();
    const previous = this.editQueues.get(key) ?? Promise.resolve();
    const run = async () => {
      // Mark this panel as the source right before applying edits
      this.editedBy.add(panel);
      try {
        await this.editElements(code, edits);
      } catch (error) {
        // Ensure the flag is cleared if the edit fails so future updates aren't skipped
        this.editedBy.delete(panel);
        throw error;
      }
    };

    const next = previous.then(run, run);
    const cleanup = next.finally(() => {
      if (this.editQueues.get(key) === cleanup) {
        this.editQueues.delete(key);
      }
    });

    this.editQueues.set(key, cleanup);
    next.catch(error => console.error('Failed to process edit operation queue', error));
  }

  // Select code range of selected element
  private selectElements(code: vscode.TextDocument, event: any) {
    const selections = this.getNiceRanges(code, event.data).map(range => {
      return new vscode.Selection(range.start, range.end);
    });
    vscode.window.visibleTextEditors.forEach(editor => {
      if (editor.document !== code) { return; }
      editor.selections = selections;
      if (selections.length > 0) {
        editor.revealRange(selections.at(-1)!, vscode.TextEditorRevealType.InCenter);
      }
    });
  }

  // Reflect edits on WebView to source code
  private async editElements(code: vscode.TextDocument, edits: any[]) {
    // 逐条处理，编辑前尽量在最新文档上解析位置，减少并发与偏移问题
    for (const codeEdit of edits) {
      await this.applyElementEditWithRetry(code, codeEdit);
    }
  }

  private createFragmentFromRange(
    code: vscode.TextDocument,
    range: vscode.Range,
    originalRange: { start: number, end: number }
  ): Element {
    const text = code.getText(range);
    const fragment = JSDOM.fragment(text).firstElementChild;
    if (fragment === null) {
      throw Error(
        'Failed to create virtual DOM from code fragment of '
        + `${code.fileName}(${originalRange.start}, ${originalRange.end})\n`
        + text
      );
    }
    return fragment;
  }

  private applyOperationsToFragment(fragment: Element, operations: any[]) {
    for (const operation of operations) {
      if (operation.type === 'tailwindStyle') {
        // 处理 Tailwind 类名操作
        if (operation.tailwindClasses) {
          fragment.setAttribute('class', operation.tailwindClasses);
        } else {
          fragment.removeAttribute('class');
        }
        // 同时处理内联样式（如果有的话）
        if (operation.style === null) {
          fragment.removeAttribute('style');
        } else if (operation.style) {
          fragment.setAttribute('style', operation.style);
        }
      } else if (operation.type === 'style' || !operation.type) {
        // 处理传统的内联样式操作（向后兼容）
        if (operation.style === null) {
          fragment.removeAttribute('style');
        } else {
          fragment.setAttribute('style', operation.style);
        }
      }
    }
  }

  private isDocumentChangedError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('has changed in the meantime');
  }

  private async applyElementEditWithRetry(code: vscode.TextDocument, codeEdit: any) {
    const maxAttempts = 5; // 增加重试次数
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const versionBefore = code.version;
      const range = this.resolveCurrentRange(code, codeEdit);
      if (!range) { return; }
      const fragment = this.createFragmentFromRange(code, range, codeEdit.codeRange ?? { start: 0, end: 0 });
      this.applyOperationsToFragment(fragment, codeEdit.operations);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(code.uri, range, fragment.outerHTML, {
        needsConfirmation: false, label: 'Edit on WebView'
      });

      try {
        const applied = await vscode.workspace.applyEdit(edit);
        if (applied) {
          console.log(`Style edit applied successfully on attempt ${attempt + 1}`);
          return;
        }
        console.warn(`Style edit not applied on attempt ${attempt + 1}, will retry`);
      } catch (error) {
        lastError = error;
        if (!this.isDocumentChangedError(error)) {
          throw error;
        }
        console.warn(`Document changed error on attempt ${attempt + 1}, retrying...`);
      }

      if (code.version === versionBefore) {
        // 文档版本未更新，说明失败不是由于外部修改导致，避免死循环
        console.warn('Document version unchanged, stopping retry to avoid infinite loop');
        break;
      }

      // 增加指数退避延迟，减少冲突概率
      const backoffDelay = Math.min(100 * Math.pow(2, attempt), 1000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }

    // 所有重试都失败后，记录详细错误信息
    console.error(`Failed to apply style edit after ${maxAttempts} attempts. Last error:`, lastError);
  }

  private resolveCurrentRange(code: vscode.TextDocument, codeEdit: any): vscode.Range | null {
    try {
      const html = code.getText();
      const dom = new JSDOM(html, { includeNodeLocations: true });
      const document = dom.window.document;
      let target: Element | null = null;
      if (codeEdit.domPath) {
        try {
          target = document.querySelector(codeEdit.domPath);
        } catch { /* invalid selector fallback below */ }
      }
      if (!target) {
        // 退化为短名 + 旧范围附近匹配
        const { start, end } = codeEdit.codeRange ?? { start: 0, end: 0 };
        const elements = Array.from(document.querySelectorAll('body *, body')) as Element[];
        // 优先选择覆盖旧范围的元素，且 shortName 相同
        let best: { el: Element, dist: number } | null = null;
        for (const el of elements) {
          const loc = dom.nodeLocation(el);
          if (!loc) {
            continue;
          }
          const covers = loc.startOffset <= start && end <= loc.endOffset;
          const name = this.shortName(el);
          if (covers && name === codeEdit.element) {
            const dist = (start - loc.startOffset) + (loc.endOffset - end);
            if (!best || dist < best.dist) {
              best = { el: el, dist };
            }
          }
        }
        target = best?.el ?? null;
      }
      if (!target) {
        return null;
      }
      const location = dom.nodeLocation(target);
      if (!location) {
        return null;
      }
      return new vscode.Range(
        code.positionAt(location.startOffset),
        code.positionAt(location.endOffset)
      );
    } catch {
      return null;
    }
  }

  private async deleteElements(code: vscode.TextDocument, ranges: vscode.Range[]) {
    const edit = new vscode.WorkspaceEdit();
    ranges.forEach((range: vscode.Range) => edit.delete(code.uri, range));
    await vscode.workspace.applyEdit(edit);
  }

  // Copy process on WebView
  private copyElements(code: vscode.TextDocument, ranges: vscode.Range[]) {
    const textToCopy = ranges.map((range: vscode.Range) => {
      const indent = code.lineAt(range.start.line).text.match(/^\s+/);
      const text = code.getText(range);
      return indent === null ? text : text.replace(new RegExp(`^${indent}`, 'gm'), '');
    }).join('\n');
    vscode.env.clipboard.writeText(textToCopy);
  }

  // Paste process on WebView
  private async pasteToElement(code: vscode.TextDocument, event: any, panel: vscode.WebviewPanel) {
    const clipboard = (await vscode.env.clipboard.readText()).trim() + '\n';
    if (clipboard.length === 0) { return; }
    const { start, end } = event.data.codeRange;
    const destPos = code.positionAt(
      start + code.getText(
        new vscode.Range(code.positionAt(start), code.positionAt(end))
      ).lastIndexOf('</')
    );
    const text = event.data.isHtml ? clipboard : he.escape(clipboard);
    {
      const edit = new vscode.WorkspaceEdit();
      edit.insert(code.uri, destPos, text, { needsConfirmation: false, label: 'Paste on WebView' });
      // Attribute this edit to the panel to avoid unnecessary refresh
      this.editedBy.add(panel);
      await vscode.workspace.applyEdit(edit);
    }
    {
      const formatEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
        'vscode.executeFormatRangeProvider',
        code.uri,
        new vscode.Range(code.positionAt(start), code.positionAt(end + text.length)),
        {
          tabSize: this.editorOptions.indentSize,
          insertSpaces: this.editorOptions.insertSpaces
        }
      );
      const edit = new vscode.WorkspaceEdit();
      for (const f of formatEdits) {
        edit.replace(code.uri, f.range, f.newText, { needsConfirmation: false, label: 'Paste on WebView' });
      }
      // Re-mark as source for the second batch of edits (formatting)
      this.editedBy.add(panel);
      await vscode.workspace.applyEdit(edit);
    }
    vscode.window.visibleTextEditors.forEach(editor => {
      if (editor.document !== code) { return; }
      editor.revealRange(
        new vscode.Range(destPos, destPos), vscode.TextEditorRevealType.InCenter
      );
    });
  }

  // Reflect content of source code to WebView
  private updateWebview(webview: vscode.Webview, code: vscode.TextDocument) {
    const config = vscode.workspace.getConfiguration('webVisualEditor');
    const dom = new JSDOM(code.getText(), { includeNodeLocations: true });
    const document = dom.window.document;
    if (!config.get<boolean>('allowScript')) {
      // Disable scripts in code
      document.querySelectorAll('script').forEach(el => { el.remove(); });
      document.querySelectorAll('body *, body').forEach(el => {
        // Remove event attributes
        el.removeAttribute('disabled');
        const nameToRemove = [];
        for (const attr of el.attributes) {
          if (attr.name.startsWith('on')) {
            nameToRemove.push(attr.name);
          }
        }
        nameToRemove.forEach(name => el.removeAttribute(name));
      });
    }
    document.querySelectorAll('body *, body').forEach(el => {
      // Add source code location information to all elements in body
      const location = dom.nodeLocation(el);
      if (!location) {
        // NOTE `location` can be null if the element is implicitly inserted
        // according to the HTML specification (e.g., `table > tbody`).
        return;
      }
      el.setAttribute('data-wve-code-start', location.startOffset.toString());
      el.setAttribute('data-wve-code-end', location.endOffset.toString());
    });
    // Disable links and file selection inputs
    document.body.querySelectorAll('a[href]').forEach(
      el => el.setAttribute('onclick', 'event.preventDefault(), event.stopPropagation()')
    );
    document.body.querySelectorAll('input[type=file]').forEach(el => el.setAttribute('disabled', ''));
    // - Replace URIs (mainly for CSS files) to be handled in sandbox of WebView
    // - Save resource path to update WebView when it changes
    ['href', 'src'].forEach(attr => {
      document.querySelectorAll(`[${attr}]`).forEach(el => {
        if (el.tagName === 'A') { return; }
        const uri = el.getAttribute(attr)!;
        if (!this.isRelativePath(uri)) { return; }
        this.addToResources(code, uri);
        const safeUri = webview.asWebviewUri(
          vscode.Uri.file(path.join(path.dirname(code.uri.fsPath), uri))
        ).toString();
        el.setAttribute(attr, safeUri);
      });
    });
    // Add code id
    const embeddedScript = document.createElement('script');
    embeddedScript.textContent = `const wve = ${JSON.stringify({
      codeId: code.uri.toString(), config
    })}`;
    document.head.appendChild(embeddedScript);
    // Default style
    const defaultStyle = document.createElement('style');
    defaultStyle.textContent = 'html, body { background-color: white; }';
    document.head.prepend(defaultStyle);
    // Incorporate CSS files into layer and lower their priority
    const style = document.createElement('style');
    document.querySelectorAll('link[href][rel=stylesheet]').forEach(el => {
      style.append(`@import url('${el.getAttribute('href')}') layer(user-style);\n`);
      el.remove();
    });
    style.id = 'wve-user-css-imports';
    document.head.appendChild(style);

    // Load all scripts in dependency order
    this.loadModularScripts(webview, document);
    // Add timestamp to ensure update WebView
    // NOTE WebView has HTML cache, and if the same string is set consecutively,
    // it will not reflect it even if actual HTML on the WebView has been updated.
    const timestamp = document.createElement('meta');
    timestamp.setAttribute('name', 'wve-timestamp');
    timestamp.setAttribute('value', (new Date()).toISOString());
    document.head.appendChild(timestamp);
    webview.html = dom.serialize();
  }

  /**
   * 统一加载所有脚本资源
   */
  private loadModularScripts(webview: vscode.Webview, document: any) {
    // 脚本配置 - 按严格的依赖顺序
    interface ScriptConfig {
      path: string;
      description: string;
      required: boolean;
    }

    const scriptConfigs: ScriptConfig[] = [
      // 第三方库 - 必须最先加载（Tailwind 放在最前，便于后续样式采集）
      { path: 'lib/tailwind@3.4.17.min.js', description: 'Tailwind CDN Runtime', required: true },
      { path: 'lib/lucide@0.544.0.min.js', description: 'Lucide 图标库', required: true },

      // 工具模块 - 基础工具，被其他模块依赖
      { path: 'modules/utils/Logger.js', description: '统一日志系统', required: true },
      { path: 'modules/utils/DOMUtils.js', description: 'DOM操作工具', required: true },
      { path: 'modules/utils/LucideIcons.js', description: '图标管理', required: true },

      // 核心模块 - 基础功能
      { path: 'modules/core/StateManager.js', description: '状态管理', required: true },
      { path: 'modules/core/EventManager.js', description: '事件管理', required: true },

      // 布局模块
      { path: 'modules/layout/LayoutMappings.js', description: '布局映射规则', required: true },
      { path: 'modules/layout/LayoutAdapter.js', description: '智能布局适配器', required: true },
      { path: 'modules/layout/MovableManager.js', description: '可移动元素管理', required: true },

      // UI模块
      { path: 'modules/ui/EditorStyleManager.js', description: '编辑器样式管理', required: true },
      { path: 'modules/ui/UIManager.js', description: 'UI管理器', required: true },
      { path: 'modules/ui/FloatingToolbar.js', description: '悬浮工具栏', required: true },
      { path: 'modules/ui/ToolbarDragHandler.js', description: '工具栏拖拽', required: true },

      // 交互模块
      { path: 'modules/interaction/SelectionManager.js', description: '选择管理', required: true },
      { path: 'modules/interaction/KeyboardHandler.js', description: '键盘交互', required: true },
      { path: 'modules/interaction/MouseHandler.js', description: '鼠标交互', required: true },

      // 主模块 - 最后加载
      { path: 'modules/core/WebVisualEditor.js', description: '主编辑器类', required: true },
      { path: 'webview.js', description: '入口文件', required: true }
    ];

    // 加载所有必需的脚本
    scriptConfigs
      .filter(config => config.required)
      .forEach((config, index) => {
        this.createScriptElement(webview, document, config, index + 1);
      });

    // 加载可选功能脚本（为将来扩展预留）
    this.loadOptionalFeatures(webview, document, scriptConfigs.length);

    // 在所有脚本加载后添加 Tailwind 相关配置
    this.addTailwindConfiguration(document);

    // 添加插件样式修复以覆盖 Tailwind 的表单样式
    this.addPluginStyleOverrides(document);
  }

  /**
   * 添加 Tailwind 相关脚本（警告抑制等）
   */
  private addTailwindConfiguration(document: any) {
    // 禁用 Tailwind CDN 生产环境警告
    const silenceScript = document.createElement('script');
    silenceScript.textContent = [
      '// 临时屏蔽 Tailwind CDN 生产环境警告',
      '(function() {',
      '  const originalWarn = console.warn;',
      '  console.warn = function(...args) {',
      '    const message = args.join(" ");',
      '    if (message.includes("cdn.tailwindcss.com should not be used in production")) {',
      '      return; // 忽略此警告',
      '    }',
      '    originalWarn.apply(console, args);',
      '  };',
      '})();'
    ].join('\n');
    document.head.appendChild(silenceScript);
  }

  /**
   * 添加插件样式覆盖以修复 Tailwind CSS 冲突
   */
  private addPluginStyleOverrides(document: any) {
    const overrideStyle = document.createElement('style');
    overrideStyle.id = 'wve-style-overrides';
    overrideStyle.textContent = `
      /* 插件样式覆盖 - 使用最高优先级层 */
      @layer wve-overrides {
        /* 修复 Tailwind 表单样式冲突 */
        .property-input,
        .property-input[type='text'],
        .property-input[type='number'],
        .property-input[type='email'],
        .property-input[type='url'],
        .property-input[type='password'] {
          height: 24px !important;
          background: #1e1e1e !important;
          border: 1px solid #404040 !important;
          border-radius: 4px !important;
          padding: 0 8px !important;
          color: #ffffff !important;
          font-size: 11px !important;
          width: 100% !important;
          transition: border-color 0.2s !important;
          appearance: none !important;
          -webkit-appearance: none !important;
        }

        .property-input:focus {
          border-color: #0078d4 !important;
          outline: none !important;
        }

        /* 修复按钮样式 */
        .icon-button {
          background: #2c2c2c !important;
          border: 1px solid #404040 !important;
          border-radius: 3px !important;
          color: #ffffff !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s !important;
        }

        .icon-button:hover {
          background: #404040 !important;
        }

        /* 修复下拉菜单样式 */
        .figma-dropdown {
          background: #2c2c2c !important;
          border: 1px solid #404040 !important;
          border-radius: 4px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }

        .dropdown-item {
          color: #ffffff !important;
          cursor: pointer !important;
        }

        /* 修复属性面板样式 */
        .property-section {
          border-bottom: 1px solid #404040 !important;
          background: #2c2c2c !important;
        }

        .section-header {
          background: #383838 !important;
          color: #ffffff !important;
        }

        .section-content {
          background: #2c2c2c !important;
        }

        /* 确保插件的输入框不受 Tailwind 表单重置影响 */
        .wve-container input,
        .wve-container textarea,
        .wve-container select {
          all: revert !important;
        }

        .wve-container .property-input {
          height: 24px !important;
          background: #1e1e1e !important;
          border: 1px solid #404040 !important;
          border-radius: 4px !important;
          padding: 0 8px !important;
          color: #ffffff !important;
          font-size: 11px !important;
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(overrideStyle);
  }

  /**
   * 配置 Tailwind（在脚本加载完成后调用）
   */
  private configureTailwind(document: any) {
    const configScript = document.createElement('script');
    configScript.textContent = [
      '// Tailwind configuration - executed after script loads',
      '(function() {',
      '  if (typeof window.tailwind !== "undefined") {',
      '    try {',
      '      window.tailwind.config = {',
      '        corePlugins: {',
      '          preflight: false // 禁用 Tailwind 的表单重置样式',
      '        },',
      '        layers: {',
      '          order: ["base", "components", "utilities", "wve-overrides"]',
      '        },',
      '        safelist: [',
      '          "flex", "flex-col", "grid", "items-center", "justify-center",',
      '          "fixed", "absolute", "relative", "z-10", "z-20", "z-50",',
      '          "w-full", "h-full", "p-1", "p-2", "p-4", "m-1", "m-2", "m-4",',
      '          "rounded", "border", "bg-white", "bg-gray-100", "bg-blue-500",',
      '          "text-white", "text-gray-600", "text-sm", "font-medium",',
      '          "cursor-pointer", "select-none", "shadow", "transition"',
      '        ],',
      '        content: [{ raw: "", extension: "html" }]',
      '      };',
      '      window.tailwind.scanShadowRoots = true;',
      '      console.log("Tailwind CDN 配置成功");',
      '    } catch (error) {',
      '      console.warn("Tailwind 配置失败:", error);',
      '    }',
      '  } else {',
      '    console.error("Tailwind 对象仍然未定义");',
      '  }',
      '})();'
    ].join('\n');
    document.head.appendChild(configScript);
  }

  /**
   * 创建脚本元素
   */
  private createScriptElement(webview: vscode.Webview, document: any, config: any, order: number) {
    const script = document.createElement('script');
    // Ensure execution order preserved for dynamically inserted scripts
    script.async = false;
    script.setAttribute('src',
      webview.asWebviewUri(
        vscode.Uri.file(path.join(this.context.extensionPath, 'webview', config.path))
      ).toString()
    );

    // 为调试添加标识
    script.setAttribute('data-wve-script', `${order}-${config.path.split('/').pop()}`);
    script.setAttribute('data-wve-description', config.description);

    // 如果是 Tailwind 脚本，添加加载完成后的配置
    if (config.path.includes('tailwind')) {
      script.onload = () => {
        console.log('Tailwind 脚本加载完成，开始配置');
        // 延迟一点确保脚本完全初始化
        setTimeout(() => {
          this.configureTailwind(document);
        }, 100);
      };
      script.onerror = () => {
        console.error('Tailwind 脚本加载失败');
      };
    }

    document.head.appendChild(script);
  }

  /**
   * 加载可选功能脚本（为将来的功能扩展预留）
   */
  private loadOptionalFeatures(webview: vscode.Webview, document: any, baseOrder: number) {
    // 获取扩展配置
    const config = vscode.workspace.getConfiguration('webVisualEditor');

    // 可选功能配置
    const optionalFeatures = {
      propertyPanel: {
        enabled: config.get<boolean>('features.propertyPanel', true),
        scripts: [
          // 新布局模式优先的属性面板架构
          { path: 'modules/ui/property-panel/PropertyControls.js', description: '通用属性控件库' },
          { path: 'modules/ui/property-panel/PropertySectionBase.js', description: '属性区域基础类' },

          // 定位设置区域（第一优先级）
          { path: 'modules/ui/property-panel/PositionSection.js', description: '定位设置区域' },

          // 布局模式选择器（核心组件，包含完整布局管理功能）
          { path: 'modules/ui/property-panel/LayoutModeSection.js', description: '综合布局管理区域' },
          // 样式属性组件
          { path: 'modules/ui/property-panel/AppearanceSection.js', description: '外观设置区域' },
          { path: 'modules/ui/property-panel/FillSection.js', description: '填充设置区域' },
          { path: 'modules/ui/property-panel/StrokeSection.js', description: '边框设置区域' },
          { path: 'modules/ui/property-panel/EffectsSection.js', description: '特效设置区域' },
          { path: 'modules/ui/property-panel/TypographySection.js', description: '排版设置区域' },


          // 主面板管理器（必须最后加载）
          { path: 'modules/ui/property-panel/PropertyPanel.js', description: '新属性面板主类' },
        ]
      },
      dragDrop: {
        enabled: config.get<boolean>('features.dragDrop', false),
        scripts: [
          { path: 'modules/interaction/DragDropManager.js', description: '拖拽重排功能' },
          { path: 'modules/ui/DragPreview.js', description: '拖拽预览效果' }
        ]
      },
      layoutModes: {
        enabled: config.get<boolean>('features.layoutModes', false),
        scripts: [
          { path: 'modules/layout/FlexLayoutMode.js', description: 'Flex布局模式' },
          { path: 'modules/layout/AbsoluteLayoutMode.js', description: '绝对定位模式' },
          { path: 'modules/layout/FlowLayoutMode.js', description: '流布局模式' }
        ]
      }
    };

    let scriptOrder = baseOrder + 1;

    // 加载启用的可选功能
    Object.entries(optionalFeatures).forEach(([, feature]) => {
      if (feature.enabled) {
        feature.scripts.forEach(scriptConfig => {
          this.createScriptElement(webview, document, scriptConfig, scriptOrder++);
        });
      }
    });
  }

  private getNiceRanges(code: vscode.TextDocument, ranges: any): vscode.Range[] {
    return ranges.map((range: any) => {
      let start = code.positionAt(range.codeRange.start);
      const lineStart = code.lineAt(start.line);
      if (start.character === lineStart.firstNonWhitespaceCharacterIndex) {
        start = lineStart.range.start;
      }
      let end = code.positionAt(range.codeRange.end);
      const lineEnd = code.lineAt(end.line);
      if (end.isEqual(lineEnd.range.end)) {
        end = lineEnd.rangeIncludingLineBreak.end;
      }
      return new vscode.Range(start, end);
    });
  }

  private addToResources(code: vscode.TextDocument, uri: string) {
    const filepath = path.join(path.dirname(code.uri.fsPath), uri);
    if (this.resources.has(filepath)) {
      this.resources.get(filepath)?.add(code);
    } else {
      this.resources.set(filepath, new Set([code]));
    }
  }

  private isRelativePath(path: string) {
    try {
      new URL(path);
      return false;
    } catch (e) {
      return !path.startsWith('/');
    }
  }

  private shortName(el: Element) {
    return (
      el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
      + Array.from(el.classList).map(c => `.${c}`).join('')
    );
  }

  /**
   * 根据选择器查找元素
   */
  private findElementBySelector(document: any, elementInfo: any): Element | null {
    try {
      // 如果有多种选择器策略，按优先级尝试
      if (elementInfo.strategies && Array.isArray(elementInfo.strategies)) {
        for (const strategy of elementInfo.strategies) {
          try {
            const element = document.querySelector(strategy.selector);
            if (element) {
              console.log(`Found element using ${strategy.type} selector:`, strategy.selector);
              return element;
            }
          } catch (selectorError) {
            console.warn(`Invalid selector (${strategy.type}):`, strategy.selector, String(selectorError));
          }
        }
      }

      // 回退到传统方法
      // 首先尝试使用data-wve-id
      if (elementInfo.wveId) {
        const element = document.querySelector(`[data-wve-id="${elementInfo.wveId}"]`);
        if (element) {
          return element;
        }
      }

      // 然后尝试使用ID
      if (elementInfo.id) {
        const element = document.getElementById(elementInfo.id);
        if (element) {
          return element;
        }
      }

      // 最后尝试使用标签名
      if (elementInfo.tagName) {
        // 简单的标签名选择器，不包含复杂的类名
        const elements = document.querySelectorAll(elementInfo.tagName);

        // 如果只有一个匹配元素，直接返回
        if (elements.length === 1) {
          return elements[0];
        }

        // 尝试通过类名进一步过滤（但要排除有问题的Tailwind类）
        if (elementInfo.className && elements.length > 1) {
          const simpleClasses = elementInfo.className.trim().split(/\s+/)
            .filter((cls: string) =>
              !cls.startsWith('wve-') && // 排除扩展添加的类
              !cls.includes(':') &&     // 排除包含冒号的Tailwind类
              cls.length < 20           // 排除过长的类名
            );

          if (simpleClasses.length > 0) {
            const selector = `${elementInfo.tagName}.${simpleClasses[0]}`;
            try {
              const element = document.querySelector(selector);
              if (element) {
                return element;
              }
            } catch (error) {
              console.warn('Simple class selector failed:', selector);
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding element by selector:', error);
      return null;
    }
  }

  /**
   * 创建样式编辑
   */
  private createStyleEdit(textDocument: vscode.TextDocument, _element: Element, property: string, value: string, location: any): vscode.TextEdit | null {
    try {
      // 获取元素的开始标签位置
      const startOffset = location.startOffset;
      const startTagEndOffset = location.startTag?.endOffset || location.endOffset;

      // 获取开始标签的HTML内容
      const startTagHtml = textDocument.getText(new vscode.Range(
        textDocument.positionAt(startOffset),
        textDocument.positionAt(startTagEndOffset)
      ));

      // 检查元素是否已有style属性
      const styleRegex = /\s+style\s*=\s*["']([^"']*?)["']/i;
      const styleMatch = startTagHtml.match(styleRegex);

      let newStartTagHtml: string;

      if (styleMatch) {
        // 更新现有的style属性
        const existingStyles = styleMatch[1];
        const newStyles = this.updateStyleProperty(existingStyles, property, value);
        newStartTagHtml = startTagHtml.replace(styleRegex, ` style="${newStyles}"`);
      } else {
        // 添加新的style属性
        const tagMatch = startTagHtml.match(/^(<[^>]+?)(\s*\/?>)$/);
        if (tagMatch) {
          const newStyles = this.updateStyleProperty('', property, value);
          newStartTagHtml = `${tagMatch[1]} style="${newStyles}"${tagMatch[2]}`;
        } else {
          console.warn('Could not parse start tag:', startTagHtml);
          return null;
        }
      }

      return vscode.TextEdit.replace(
        new vscode.Range(
          textDocument.positionAt(startOffset),
          textDocument.positionAt(startTagEndOffset)
        ),
        newStartTagHtml
      );
    } catch (error) {
      console.error('Error creating style edit:', error);
      return null;
    }
  }

  /**
   * 将JavaScript CSS属性名转换为CSS属性名
   */
  private convertPropertyName(jsPropertyName: string): string {
    const propertyMap: { [key: string]: string } = {
      'backgroundColor': 'background-color',
      'backgroundImage': 'background-image',
      'borderRadius': 'border-radius',
      'fontSize': 'font-size',
      'fontWeight': 'font-weight',
      'fontColor': 'color', // 特殊映射
      'textAlign': 'text-align'
    };

    return propertyMap[jsPropertyName] || jsPropertyName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 更新样式属性
   */
  private updateStyleProperty(existingStyles: string, property: string, value: string): string {
    const styles = existingStyles.split(';').filter(s => s.trim());
    const styleMap = new Map<string, string>();

    // 解析现有样式
    styles.forEach(style => {
      const [prop, val] = style.split(':').map(s => s.trim());
      if (prop && val) {
        styleMap.set(prop, val);
      }
    });

    // 转换属性名为CSS格式
    const cssPropertyName = this.convertPropertyName(property);

    // 更新或添加新属性
    styleMap.set(cssPropertyName, value);

    // 重新构建样式字符串
    return Array.from(styleMap.entries())
      .map(([prop, val]) => `${prop}: ${val}`)
      .join('; ');
  }

  /**
   * 处理样式变更事件
   */
  private async handleStyleChange(code: vscode.TextDocument, data: any): Promise<void> {
    try {
      // 使用传入的文档，确保我们操作的是正确的文档
      const textDocument = code;

      if (!data.changes || !Array.isArray(data.changes)) {
        console.warn('Invalid style change data format');
        return;
      }

      // 解析原始HTML文档
      const dom = new JSDOM(textDocument.getText(), { includeNodeLocations: true });
      const document = dom.window.document;

      const edits: vscode.TextEdit[] = [];

      // 处理每个样式变更
      for (const change of data.changes) {
        const { element: elementInfo, property, value } = change;

        // 根据选择器查找元素
        const targetElement = this.findElementBySelector(document, elementInfo);

        if (targetElement) {
          // 更新元素的样式
          const location = dom.nodeLocation(targetElement);
          if (location) {
            const edit = this.createStyleEdit(textDocument, targetElement, property, value, location);
            if (edit) {
              edits.push(edit);
            }
          }
        } else {
          console.warn('Could not find element for selector:', elementInfo);
        }
      }

      if (edits.length > 0) {
        // 创建工作区编辑
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(textDocument.uri, edits);

        // 应用编辑
        const success = await vscode.workspace.applyEdit(workspaceEdit);

        if (success) {
          console.log(`Applied ${edits.length} style changes to document:`, textDocument.fileName);
        } else {
          console.error('Failed to apply style changes to document:', textDocument.fileName);
        }
      }
    } catch (error) {
      console.error('Error handling style change:', error);
    }
  }

  /**
   * 处理CSS到Tailwind转换请求
   */
  private async handleCSSToTailwindRequest(panel: vscode.WebviewPanel, event: any): Promise<void> {
    try {
      console.log('Received cssToTailwindRequest event:', event);

      const data = event.data || event;
      const { requestId, cssStyles } = data;

      if (!requestId || !cssStyles) {
        console.warn('Invalid CSS to Tailwind request data:', data);
        return;
      }

      // 动态导入css-to-tailwind-translator库
      const { CssToTailwindTranslator } = require('css-to-tailwind-translator');

      // 将CSS样式对象转换为完整的CSS规则
      const cssProperties = Object.entries(cssStyles)
        .map(([property, value]) => `${this.camelToKebab(property)}: ${value};`)
        .join(' ');
      const cssRule = `.temp { ${cssProperties} }`;

      console.log('Converting CSS rule:', cssRule);

      // 调用转换库
      const result = CssToTailwindTranslator(cssRule);
      console.log('Conversion result:', result);

      let tailwindClasses = '';
      if (result.code === 'OK' && result.data && result.data.length > 0) {
        tailwindClasses = result.data[0].resultVal;
      }

      // 发送回应消息
      panel.webview.postMessage({
        type: 'cssToTailwindResponse',
        requestId: requestId,
        tailwindClasses: tailwindClasses
      });

      console.log('CSS to Tailwind conversion successful:', cssRule, '=>', tailwindClasses);
    } catch (error) {
      console.error('CSS to Tailwind conversion failed:', error);

      // 发送失败回应
      const data = event.data || event;
      panel.webview.postMessage({
        type: 'cssToTailwindResponse',
        requestId: data.requestId || '',
        tailwindClasses: ''
      });
    }
  }

  /**
   * 使用重试机制应用Tailwind样式编辑
   */
  private async applyTailwindEditsWithRetry(textDocument: vscode.TextDocument, edits: vscode.TextEdit[]): Promise<void> {
    const maxAttempts = 5;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const versionBefore = textDocument.version;

      try {
        // 创建工作区编辑
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(textDocument.uri, edits);

        // 应用编辑
        const success = await vscode.workspace.applyEdit(workspaceEdit);

        if (success) {
          console.log(`Applied ${edits.length} Tailwind style changes to document on attempt ${attempt + 1}:`, textDocument.fileName);
          return;
        }
        console.warn(`Tailwind style changes not applied on attempt ${attempt + 1}, will retry:`, textDocument.fileName);
      } catch (error) {
        lastError = error;
        if (!this.isDocumentChangedError(error)) {
          throw error;
        }
        console.warn(`Document changed error on Tailwind edit attempt ${attempt + 1}, retrying...`);
      }

      if (textDocument.version === versionBefore) {
        console.warn('Document version unchanged for Tailwind edit, stopping retry to avoid infinite loop');
        break;
      }

      // 增加指数退避延迟
      const backoffDelay = Math.min(150 * Math.pow(2, attempt), 1500);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }

    console.error(`Failed to apply Tailwind style changes after ${maxAttempts} attempts. Last error:`, lastError);
  }

  /**
   * 将驼峰命名转换为短横线命名
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 处理Tailwind样式变更事件
   */
  private async handleTailwindStyleChange(code: vscode.TextDocument, panel: vscode.WebviewPanel, data: any): Promise<void> {
    try {
      const textDocument = code;

      if (!data.changes || !Array.isArray(data.changes)) {
        console.warn('Invalid tailwind style change data format');
        return;
      }

      // 解析原始HTML文档
      const dom = new JSDOM(textDocument.getText(), { includeNodeLocations: true });
      const document = dom.window.document;

      const edits: vscode.TextEdit[] = [];

      // 处理每个Tailwind样式变更
      for (const change of data.changes) {
        const { element: elementInfo, tailwindClasses, cssStyles } = change;

        // 根据选择器查找元素
        const targetElement = this.findElementBySelector(document, elementInfo);

        if (targetElement && tailwindClasses) {
          // 使用Tailwind类名更新元素
          const location = dom.nodeLocation(targetElement);
          if (location) {
            const edit = this.createTailwindClassEdit(textDocument, targetElement, tailwindClasses, location);
            if (edit) {
              edits.push(edit);
            }
          }
        } else if (targetElement && cssStyles) {
          // 降级处理：如果没有Tailwind类名，使用CSS样式
          console.warn('No Tailwind classes available, falling back to CSS styles for:', elementInfo);
          const location = dom.nodeLocation(targetElement);
          if (location) {
            Object.entries(cssStyles).forEach(([property, value]) => {
              const edit = this.createStyleEdit(textDocument, targetElement, property, value as string, location);
              if (edit) {
                edits.push(edit);
              }
            });
          }
        } else {
          console.warn('Could not find element for selector:', elementInfo);
        }
      }

      if (edits.length > 0) {
        // 标记为编辑源，防止触发WebView重新加载
        this.editedBy.add(panel);

        // 使用重试机制应用Tailwind样式编辑
        await this.applyTailwindEditsWithRetry(textDocument, edits);

        // 发送完成通知到WebView，触发选择状态恢复
        this.codes.get(code)?.forEach(panel => {
          panel.webview.postMessage({
            type: 'documentChanged',
            timestamp: Date.now()
          });
        });
      }
    } catch (error) {
      console.error('Error handling Tailwind style change:', error);
    }
  }

  /**
   * 创建Tailwind类名编辑
   */
  private createTailwindClassEdit(textDocument: vscode.TextDocument, _element: Element, tailwindClasses: string, location: any): vscode.TextEdit | null {
    try {
      // 获取元素的开始标签位置
      const startOffset = location.startOffset;
      const startTagEndOffset = location.startTag?.endOffset || location.endOffset;

      // 获取开始标签的HTML内容
      const startTagHtml = textDocument.getText(new vscode.Range(
        textDocument.positionAt(startOffset),
        textDocument.positionAt(startTagEndOffset)
      ));

      // 检查元素是否已有class属性
      const classRegex = /\s+class\s*=\s*["']([^"']*?)["']/i;
      const classMatch = startTagHtml.match(classRegex);

      let newStartTagHtml: string;

      if (classMatch) {
        // 更新现有的class属性
        newStartTagHtml = startTagHtml.replace(classRegex, ` class="${tailwindClasses}"`);
      } else {
        // 添加新的class属性
        const tagMatch = startTagHtml.match(/^(<[^>]+?)(\s*\/?>)$/);
        if (tagMatch) {
          newStartTagHtml = `${tagMatch[1]} class="${tailwindClasses}"${tagMatch[2]}`;
        } else {
          console.warn('Could not parse start tag:', startTagHtml);
          return null;
        }
      }

      // 清除可能存在的内联style属性（因为我们现在使用Tailwind类名）
      newStartTagHtml = newStartTagHtml.replace(/\s+style\s*=\s*["'][^"']*["']/i, '');

      return vscode.TextEdit.replace(
        new vscode.Range(
          textDocument.positionAt(startOffset),
          textDocument.positionAt(startTagEndOffset)
        ),
        newStartTagHtml
      );
    } catch (error) {
      console.error('Error creating Tailwind class edit:', error);
      return null;
    }
  }

}
