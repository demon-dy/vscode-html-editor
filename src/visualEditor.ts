import * as vscode from 'vscode';

import { JSDOM } from 'jsdom';
import he from 'he';
import path from 'path';

export class VisualEditorProvider implements vscode.CustomTextEditorProvider {

  public activeCode: vscode.TextDocument | null = null;

  private editorOptions = { insertSpaces: true, indentSize: 2, indentChar: ' ', indentUnit: '  ' };
  private readonly context: vscode.ExtensionContext;
  private readonly codes = new Map<vscode.TextDocument, Set<vscode.WebviewPanel>>();
  private readonly editedBy = new Set<vscode.WebviewPanel>();
  private readonly resources = new Map<string, Set<vscode.TextDocument>>();
  private readonly editQueues = new Map<string, Promise<void>>();

  constructor(private readonly ec: vscode.ExtensionContext) {
    this.context = ec;
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
    panel.webview.options = { enableScripts: true };
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
      if (operation.style === null) {
        fragment.removeAttribute('style');
      } else {
        fragment.setAttribute('style', operation.style);
      }
    }
  }

  private isDocumentChangedError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('has changed in the meantime');
  }

  private async applyElementEditWithRetry(code: vscode.TextDocument, codeEdit: any) {
    const maxAttempts = 3;
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
          return;
        }
      } catch (error) {
        if (!this.isDocumentChangedError(error)) {
          throw error;
        }
      }

      if (code.version === versionBefore) {
        // 文档版本未更新，说明失败不是由于外部修改导致，避免死循环
        break;
      }
      // 等待下一轮循环基于最新文档重新计算位置
      await new Promise(resolve => setTimeout(resolve, 0));
    }
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
          if (!loc) continue;
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
      if (!target) return null;
      const location = dom.nodeLocation(target);
      if (!location) return null;
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

    // 配置 Tailwind CDN - 必须在 Tailwind 脚本加载前设置
    try {
      const configScript = document.createElement('script');
      configScript.textContent = `
        // 确保 tailwind 对象存在
        window.tailwind = window.tailwind || {};

        // 配置 Tailwind - 包含更完整的 safelist 和配置
        window.tailwind.config = {
          // 确保常用类总是可用
          safelist: [
            // 布局
            'flex','flex-col','grid','items-center','justify-center','justify-between',
            'gap-1','gap-2','gap-4','gap-8','space-x-1','space-x-2','space-y-1','space-y-2',

            // 定位和尺寸
            'fixed','absolute','relative','top-0','right-0','bottom-0','left-0',
            'z-10','z-20','z-50','z-auto',
            'w-3','w-4','w-5','w-8','w-12','w-14','w-16','w-full','w-auto',
            'h-3','h-4','h-5','h-8','h-12','h-14','h-16','h-full','h-auto',
            'min-w-0','max-w-none',

            // 边距和内距
            'p-0','p-1','p-2','p-3','p-4','px-1','px-2','px-3','px-4','py-1','py-2','py-3','py-4',
            'm-0','m-1','m-2','m-3','m-4','mx-1','mx-2','mx-3','mx-4','my-1','my-2','my-3','my-4',

            // 圆角和边框
            'rounded','rounded-md','rounded-lg','rounded-full','rounded-none',
            'border','border-0','border-2','border-gray-200','border-gray-300','border-blue-500',

            // 背景和颜色
            'bg-white','bg-gray-50','bg-gray-100','bg-gray-200','bg-gray-800','bg-gray-900',
            'bg-blue-500','bg-blue-600','bg-red-500','bg-green-500',
            'text-gray-400','text-gray-500','text-gray-600','text-gray-700','text-gray-800','text-gray-900',
            'text-white','text-blue-500','text-red-500','text-green-500',

            // 字体
            'text-xs','text-sm','text-base','text-lg','font-normal','font-medium','font-semibold','font-bold',

            // 交互
            'cursor-pointer','cursor-grab','cursor-grabbing','cursor-move','cursor-default',
            'select-none','pointer-events-none','pointer-events-auto',

            // 阴影和效果
            'shadow','shadow-sm','shadow-md','shadow-lg','shadow-xl',
            'backdrop-blur-sm','backdrop-blur',

            // 过渡和动画
            'transition','transition-all','transition-colors','transition-transform',
            'duration-150','duration-200','duration-300',
            'ease-in-out','ease-out',

            // 悬停和焦点状态
            'hover:bg-gray-50','hover:bg-gray-100','hover:bg-gray-200',
            'hover:text-gray-600','hover:text-gray-700','hover:text-gray-800',
            'hover:shadow-md','hover:scale-105',
            'focus:outline-none','focus:ring-1','focus:ring-2','focus:ring-blue-500',
            'focus:border-blue-500'
          ],

          // 启用所有变体
          variants: {
            extend: {
              backgroundColor: ['active'],
              textColor: ['active'],
              borderColor: ['active']
            }
          },

          // 扫描所有可能的位置
          content: [
            { raw: '', extension: 'html' }
          ]
        };

        // 设置 Tailwind 在 Shadow DOM 中工作的配置
        if (window.tailwind) {
          window.tailwind.scanShadowRoots = true;
        }
      `;
      document.head.appendChild(configScript);
    } catch { /* ignore */ }

    // 加载所有必需的脚本
    scriptConfigs
      .filter(config => config.required)
      .forEach((config, index) => {
        this.createScriptElement(webview, document, config, index + 1);
      });

    // 加载可选功能脚本（为将来扩展预留）
    this.loadOptionalFeatures(webview, document, scriptConfigs.length);
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
      elementPanel: {
        enabled: config.get<boolean>('features.elementPanel', true),
        scripts: [
          { path: 'modules/ui/PositioningEngine.js', description: '面板定位引擎' },
          { path: 'modules/ui/panel/TabManager.js', description: '面板标签管理' },
          { path: 'modules/ui/panel/StyleTab.js', description: '样式标签页' },
          { path: 'modules/ui/panel/LayoutTab.js', description: '布局标签页' },
          { path: 'modules/ui/panel/AttributeTab.js', description: '属性标签页' },
          { path: 'modules/ui/ElementPanel.js', description: 'Figma风格元素面板' },
          { path: 'modules/ui/PanelManager.js', description: '面板管理器' }
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
}
