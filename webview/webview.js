class WebVisualEditor {
  codeEdits = [];
  operation = '';
  keyboard = {
    // Combined state
    arrow: false,
    // Single key
    Shift: false,
    Control: false,
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
  };
  mouse = {
    start: {
      viewportX: 0,
      viewportY: 0,
      pageX: 0,
      pageY: 0,
    },
    current: {
      viewportX: 0,
      viewportY: 0,
      pageX: 0,
      pageY: 0,
    }
  };
  toolbar = null;
  zoom = null;
  linkCode = null;
  userElements = Array.from(document.querySelectorAll('body *, body'));
  selector = null;
  movables = [];
  selected = new Set();
  movers = new Set();
  moversBeforeEdit = null;
  htmlParser = null;
  // Shadow DOM 宿主与根，用于样式隔离扩展 UI
  uiHost = null;
  uiRoot = null;

  constructor() {
    const state = JSON.parse(sessionStorage.getItem(wve.codeId) ?? '{}');
    this.zoom = state.zoom ?? '1';
    this.linkCode = state.linkCode ?? true;
    this.editMode = state.editMode ?? true;
    this.previewMode = state.previewMode ?? false;
  }

  initMovables() {
    // 某些 VS Code 内置 Chromium 版本不支持 CSS Typed OM（computedStyleMap）
    if (typeof Element !== 'undefined' && !('computedStyleMap' in Element.prototype)) {
      // 跳过可移动元素能力，避免初始化报错导致后续 UI（含工具栏、图标）不渲染
      return;
    }
    this.userElements.forEach(el => {
      const styles = el.computedStyleMap();
      const position = styles.get('position').value;
      if (position === 'static' || position === 'sticky') { return; }
      const props = {
        left: styles.get('left'), right: styles.get('right'),
        top: styles.get('top'), bottom: styles.get('bottom')
      };
      // Ignore if both left & right, top & bottom are specified
      if ((props.left.value !== 'auto' && props.right.value !== 'auto')
        || (props.top.value !== 'auto' && props.bottom.value !== 'auto')) {
        return;
      }
      // Default to left, top if not specified
      const propX = props.left.value !== 'auto' ? 'left' : props.right.value !== 'auto' ? 'right' : 'left';
      const propY = props.top.value !== 'auto' ? 'top' : props.bottom.value !== 'auto' ? 'bottom' : 'top';
      const x = props[propX];
      const y = props[propY];
      // Ignore units except for px
      if ((x.value !== 'auto' && x.unit !== 'px') || (y.value !== 'auto' && y.unit !== 'px')) {
        return;
      }
      el.setAttribute('wve-movable', '');
      el.setAttribute('draggable', 'false');
      el.dataset.wvePropX = propX;
      el.dataset.wvePropY = propY;
      if (x.value !== 'auto') { el.style[propX] = x.toString(); }
      if (y.value !== 'auto') { el.style[propY] = y.toString(); }
      this.movables.push(el);
    });
  }
  initSelector() {
    this.selector = document.createElement('div');
    this.selector.id = 'wve-selector';
    this.selector.style.display = 'none';
    document.body.appendChild(this.selector);
  }
  /**
   * 初始化 Shadow DOM 宿主，扩展自身 UI 在此渲染，避免污染用户页面样式
   */
  initUIRoot() {
    if (this.uiRoot) return;
    this.uiHost = document.createElement('div');
    this.uiHost.id = 'wve-host';
    // 将宿主作为 body 直接子元素，确保定位与 z-index 正常
    document.body.appendChild(this.uiHost);
    this.uiRoot = this.uiHost.attachShadow({ mode: 'open' });

    // 注入 Tailwind CSS 到 Shadow DOM
    const tailwindStyle = document.createElement('style');
    tailwindStyle.textContent = `
      /* Tailwind CSS Reset and Utilities for Shadow DOM */
      *, ::before, ::after {
        box-sizing: border-box;
        border-width: 0;
        border-style: solid;
        border-color: #e5e7eb;
      }

      /* Utility Classes */
      .fixed { position: fixed; }
      .bottom-5 { bottom: 1.25rem; }
      .z-50 { z-index: 50; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .gap-1 { gap: 0.25rem; }
      .gap-2 { gap: 0.5rem; }
      .gap-8 { gap: 2rem; }
      .rounded { border-radius: 0.25rem; }
      .rounded-md { border-radius: 0.375rem; }
      .rounded-full { border-radius: 9999px; }
      .rounded-12 { border-radius: 0.75rem; }
      .bg-white { background-color: rgb(255 255 255); }
      .bg-gray-100 { background-color: rgb(243 244 246); }
      .bg-gray-200 { background-color: rgb(229 231 235); }
      .border { border-width: 1px; }
      .border-0 { border-width: 0px; }
      .border-gray-200 { border-color: rgb(229 231 235); }
      .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
      .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
      .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .p-1 { padding: 0.25rem; }
      .w-3 { width: 0.75rem; }
      .w-4 { width: 1rem; }
      .w-5 { width: 1.25rem; }
      .w-8 { width: 2rem; }
      .h-3 { height: 0.75rem; }
      .h-4 { height: 1rem; }
      .h-5 { height: 1.25rem; }
      .h-8 { height: 2rem; }
      .text-xs { font-size: 0.75rem; line-height: 1rem; }
      .text-gray-500 { color: rgb(107 114 128); }
      .text-gray-600 { color: rgb(75 85 99); }
      .text-gray-800 { color: rgb(31 41 55); }
      .font-medium { font-weight: 500; }
      .cursor-pointer { cursor: pointer; }
      .cursor-grab { cursor: grab; }
      .cursor-grabbing { cursor: grabbing; }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
      .backdrop-blur-sm { backdrop-filter: blur(4px); }
      .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .hover\\:bg-gray-100:hover { background-color: rgb(243 244 246); }
      .hover\\:bg-gray-200:hover { background-color: rgb(229 231 235); }
      .hover\\:text-gray-800:hover { color: rgb(31 41 55); }
      .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
      .focus\\:ring-2:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
      .focus\\:ring-blue-500:focus { --tw-ring-color: rgb(59 130 246); }

      /* Component Styles */
      :host {
        all: initial;
        zoom: 1 !important; /* 确保 Shadow DOM 内容不受缩放影响 */
      }
      #wve-floating-toolbar {
        font-family: var(--vscode-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial);
        font-size: 12px;
        color: var(--vscode-foreground, #111);
        background: var(--vscode-editor-background, #fff);
        border-color: var(--vscode-widget-border, #e5e7eb);
        zoom: 1 !important; /* 确保工具栏不受缩放影响 */
      }
      #wve-floating-toolbar.dragging {
        cursor: grabbing !important;
        transform: none !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        scale: 1.05;
      }
      .active { background-color: rgb(59 130 246) !important; color: #fff !important; }
      [data-lucide], svg.lucide {
        display: inline-block;
        stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; fill: none;
      }
      #wve-icon-test-panel {
        position: fixed; top: 20px; right: 20px; z-index: 2147483647;
        background: var(--vscode-editor-background,#fff); color: var(--vscode-foreground,#111);
        border-color: var(--vscode-widget-border,#e5e7eb);
        font-family: var(--vscode-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial); font-size: 12px;
      }
      #wve-icon-test-panel [data-lucide], #wve-icon-test-panel svg.lucide {
        width: 20px; height: 20px; color: #111; stroke: #111;
      }

      /* Button and Input Styles */
      button {
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: inherit;
        margin: 0;
        padding: 0;
        background: none;
        border: none;
        outline: none;
      }
      select {
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: inherit;
        margin: 0;
        outline: none;
      }
    `;
    this.uiRoot.appendChild(tailwindStyle);
  }
  /**
   * 初始化底部悬浮工具栏
   * 根据 PRD 要求，将工具栏移到底部悬浮位置
   */
  initFloatingToolbar() {
    // 确保 UI 容器已初始化
    this.initUIRoot();
    const fragment = new DocumentFragment();
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'wve-floating-toolbar';
    this.toolbar.className = 'fixed bottom-5 z-50 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-lg backdrop-blur-sm';
    // 手动设置居中定位，确保兼容性
    this.toolbar.style.left = '50%';
    this.toolbar.style.transform = 'translateX(-50%)';
    fragment.appendChild(this.toolbar);

    const controls = {
      toolbarEditMode: 'wve-edit-mode',
      toolbarPreviewMode: 'wve-preview-mode',
      toolbarLinkCode: 'wve-link-code',
      toolbarRefresh: 'wve-refresh',
      toolbarZoomIn: 'wve-zoom-in',
      toolbarZoomOut: 'wve-zoom-out',
      toolbarZoomValue: 'wve-zoom-value',
      toolbarDeviceSelector: 'wve-device-selector',
      toolbarDragHandle: 'wve-drag-handle'
    };

    let toolbarHtml = `
      <div class="flex items-center cursor-grab hover:bg-gray-100 rounded p-1 transition-colors" id="${controls.toolbarDragHandle}" title="拖拽移动工具栏">
        <i data-lucide="grip-vertical" class="w-3 h-3 text-gray-500"></i>
      </div>
      <div class="flex items-center gap-1">
        <button id="${controls.toolbarEditMode}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="编辑模式">
          <i data-lucide="edit-3" class="w-4 h-4"></i>
        </button>
        <button id="${controls.toolbarPreviewMode}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="预览模式">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </button>
        <button id="${controls.toolbarLinkCode}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="关联代码">
          <i data-lucide="link" class="w-4 h-4"></i>
        </button>
        <button id="${controls.toolbarRefresh}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="刷新视图">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i>
        </button>
        <button id="${controls.toolbarZoomIn}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="放大视图">
          <i data-lucide="zoom-in" class="w-4 h-4"></i>
        </button>
        <span id="${controls.toolbarZoomValue}" class="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">100%</span>
        <button id="${controls.toolbarZoomOut}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="缩小视图">
          <i data-lucide="zoom-out" class="w-4 h-4"></i>
        </button>
        <select id="${controls.toolbarDeviceSelector}" class="px-2 py-1 text-xs font-medium bg-gray-100 border-0 rounded cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" title="设备预览">
          <option value="desktop">1440×900 桌面</option>
          <option value="laptop">1024×768 笔记本</option>
          <option value="tablet">768×1024 平板</option>
          <option value="mobile-large">414×896 大屏手机</option>
          <option value="mobile-medium">375×667 中屏手机</option>
          <option value="mobile-small">320×568 小屏手机</option>
        </select>
      </div>
    `;

    this.toolbar.innerHTML = toolbarHtml;

    // 先把 fragment 挂载到页面上，再查询控件，避免空引用
    // 渲染到 Shadow DOM 中
    this.uiRoot.appendChild(fragment);

    // 保存控件引用（基于已挂载的 toolbar 查询）
    Object.entries(controls).forEach(([key, id]) => {
      this[key] = this.uiRoot.getElementById ? this.uiRoot.getElementById(id) : this.uiRoot.querySelector('#' + id);
    });

    // 绑定事件处理器（容错处理，避免未找到元素导致报错）
    this.setupToolbarEventHandlers();

    // 初始化 Lucide 图标（全局）并替换 Shadow DOM 内的图标
    this.initializeLucideIcons();
    this.replaceLucideInRoot(this.uiRoot);
  }


  /**
   * 初始化 Lucide 图标
   */
  initializeLucideIcons() {
    // 等待 Lucide 库加载完成
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      try {
        // 显式传入内置图标表，避免某些打包环境下的默认导出解析问题
        if (lucide.icons) {
          lucide.createIcons({ icons: lucide.icons });
        } else {
          lucide.createIcons();
        }
        // 二次运行，确保动态插入的节点也被替换
        setTimeout(() => {
          try {
            if (lucide.icons) {
              lucide.createIcons({ icons: lucide.icons });
            } else {
              lucide.createIcons();
            }
          } catch (_) { /* no-op */ }
        }, 300);
      } catch (_) {
        // 轻量容错：稍后再试
        setTimeout(() => this.initializeLucideIcons(), 150);
      }
    } else {
      // 如果库还没加载，延迟初始化
      setTimeout(() => this.initializeLucideIcons(), 100);
    }
  }

  /**
   * 在指定根节点内替换 data-lucide 元素为 SVG（适配 Shadow DOM）
   */
  replaceLucideInRoot(root) {
    try {
      if (!root) return;
      const nodes = root.querySelectorAll('[data-lucide]');
      if (!nodes.length) return;
      const icons = (typeof lucide !== 'undefined' && lucide.icons) ? lucide.icons : null;
      if (!icons) return;
      const toPascal = (name) => name
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join('');
      const NS = 'http://www.w3.org/2000/svg';
      nodes.forEach(el => {
        const rawName = el.getAttribute('data-lucide');
        if (!rawName) return;
        const iconDef = icons[toPascal(rawName)];
        if (!iconDef) return;
        const svg = document.createElementNS(NS, 'svg');
        // 默认属性，与 lucide 保持一致
        svg.setAttribute('xmlns', NS);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('data-lucide', rawName);
        const cls = ['lucide', `lucide-${rawName}`].concat((el.getAttribute('class') || '').split(/\s+/).filter(Boolean));
        svg.setAttribute('class', cls.join(' '));
        // 构建子元素
        iconDef.forEach(([tag, attrs]) => {
          const child = document.createElementNS(NS, tag);
          Object.entries(attrs).forEach(([k, v]) => child.setAttribute(k, String(v)));
          svg.appendChild(child);
        });
        el.parentNode && el.parentNode.replaceChild(svg, el);
      });
    } catch (_) { /* no-op */ }
  }

  /**
   * 设置工具栏事件处理器
   */
  setupToolbarEventHandlers() {
    // 编辑模式切换
    this.toolbarEditMode?.addEventListener('click', () => {
      this.toggleEditMode();
    });

    // 预览模式切换
    this.toolbarPreviewMode?.addEventListener('click', () => {
      this.togglePreviewMode();
    });

    // 关联代码切换
    this.toolbarLinkCode?.addEventListener('click', () => {
      this.linkCode = !this.linkCode;
      this.updateLinkCodeButton();
      this.saveState();
    });

    // 刷新视图
    this.toolbarRefresh?.addEventListener('click', () => {
      vscode.postMessage({ type: 'refresh' });
    });

    // 缩放控制
    this.toolbarZoomIn?.addEventListener('click', () => {
      this.updateZoom(1);
    });

    this.toolbarZoomOut?.addEventListener('click', () => {
      this.updateZoom(-1);
    });

    // 设备选择器
    this.toolbarDeviceSelector?.addEventListener('change', (event) => {
      this.switchDevice(event.target.value);
    });

    // 拖拽手柄
    this.setupToolbarDragging();
  }

  shortNameOf(el) {
    return (
      el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
      + Array.from(el.classList).map(c => `.${c}`).join('')
    );
  }
  realPositionOf(event) {
    // 插件UI不受缩放影响，直接返回原始坐标
    const path = event.composedPath ? event.composedPath() : [];
    const isPluginUI = path.some(el =>
      el.id === 'wve-host' ||
      el.id === 'wve-selector' ||
      el.id === 'wve-floating-toolbar' ||
      el.id === 'wve-icon-test-panel'
    );

    if (isPluginUI) {
      return {
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY
      };
    }

    // 用户内容区域考虑缩放
    return Object.fromEntries(
      ['clientX', 'clientY', 'pageX', 'pageY'].map(
        key => [key, Math.round(event[key] / +this.zoom)]
      )
    );
  }
  moveElement(el, dx, dy) {
    if (dx === 0 && dy === 0) { return; }
    dx = Math.trunc(dx);
    dy = Math.trunc(dy);
    const styles = el.computedStyleMap();
    if (dx !== 0) {
      const propX = el.dataset.wvePropX;
      const valueX = styles.get(propX).value;
      const x = valueX === 'auto' ? 0 : valueX;
      el.style[propX] = x + (propX === 'left' ? dx : -dx) + 'px';
    }
    if (dy !== 0) {
      const propY = el.dataset.wvePropY;
      const valueY = styles.get(propY).value;
      const y = valueY === 'auto' ? 0 : valueY;
      el.style[propY] = y + (propY === 'top' ? dy : -dy) + 'px';
    }
  }

  saveState() {
    const state = Object.fromEntries(
      ['zoom', 'linkCode', 'editMode', 'previewMode'].map(key => [key, this[key]])
    );
    sessionStorage.setItem(wve.codeId, JSON.stringify(state));
    vscode.postMessage({ type: 'state', data: state });
  }

  updateZoom(sign) {
    const steps = ['0.5', '0.67', '0.8', '0.9', '1', '1.1', '1.25', '1.5', '2'];
    if (sign) {
      this.zoom = steps[steps.indexOf(this.zoom) + sign];
      this.saveState();
    }

    // 设置CSS变量，只影响用户内容
    document.documentElement.style.setProperty('--wve-zoom', this.zoom);

    // 更新工具栏显示
    if (this.toolbarZoomValue) {
      this.toolbarZoomValue.textContent = (
        this.zoom.replace(/^0/, ' ').replace('.', '').padEnd(3, '0') + '%'
      );
    }

    // 更新按钮状态
    const stepIndex = steps.indexOf(this.zoom);
    if (stepIndex < 0) { return; }

    if (this.toolbarZoomOut && this.toolbarZoomIn) {
      if (stepIndex === 0) {
        this.toolbarZoomOut.setAttribute('disabled', '');
        this.toolbarZoomIn.removeAttribute('disabled');
      } else if (stepIndex === steps.length - 1) {
        this.toolbarZoomIn.setAttribute('disabled', '');
        this.toolbarZoomOut.removeAttribute('disabled');
      } else {
        this.toolbarZoomIn.removeAttribute('disabled');
        this.toolbarZoomOut.removeAttribute('disabled');
      }
    }
  }

  updateLinkCode() {
    // 更新关联代码按钮状态 - 底部悬浮工具栏版本
    if (this.toolbarLinkCode) {
      this.updateLinkCodeButton();
    }
  }

  /**
   * 更新关联代码按钮的视觉状态
   */
  updateLinkCodeButton() {
    if (this.linkCode) {
      this.toolbarLinkCode.classList.add('active');
      this.toolbarLinkCode.title = '关联代码 (已启用)';
    } else {
      this.toolbarLinkCode.classList.remove('active');
      this.toolbarLinkCode.title = '关联代码 (已禁用)';
    }
  }

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      document.body.classList.add('wve-edit-mode');
      this.toolbarEditMode.classList.add('active');
      this.toolbarPreviewMode.classList.remove('active');
    } else {
      document.body.classList.remove('wve-edit-mode');
      this.toolbarEditMode.classList.remove('active');
    }
  }

  /**
   * 切换预览模式
   */
  togglePreviewMode() {
    this.previewMode = !this.previewMode;
    if (this.previewMode) {
      document.body.classList.add('wve-preview-mode');
      this.toolbarPreviewMode.classList.add('active');
      this.toolbarEditMode.classList.remove('active');
      // 预览模式下禁用选择
      this.deselect();
    } else {
      document.body.classList.remove('wve-preview-mode');
      this.toolbarPreviewMode.classList.remove('active');
    }
  }

  /**
   * 设备预览切换
   */
  switchDevice(deviceType) {
    const devicePresets = {
      'mobile-small': { width: 320, height: 568 },
      'mobile-medium': { width: 375, height: 667 },
      'mobile-large': { width: 414, height: 896 },
      'tablet': { width: 768, height: 1024 },
      'laptop': { width: 1024, height: 768 },
      'desktop': { width: 1440, height: 900 }
    };

    const preset = devicePresets[deviceType];
    if (preset) {
      document.body.style.maxWidth = preset.width + 'px';
      document.body.style.minHeight = preset.height + 'px';
      document.body.setAttribute('data-device-type', deviceType);
    } else {
      // 重置为自适应
      document.body.style.maxWidth = '';
      document.body.style.minHeight = '';
      document.body.removeAttribute('data-device-type');
    }
  }

  /**
   * 设置工具栏拖拽功能
   * 修复瞬移问题的新实现
   */
  setupToolbarDragging() {
    let isDragging = false;
    let startMouseX, startMouseY;
    let startToolbarLeft, startToolbarBottom;
    let rafId = null;

    // 拖拽移动处理函数，使用 RAF 优化性能
    const handleDragMove = (e) => {
      if (!isDragging) return;

      // 取消之前的动画帧请求
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        // 计算鼠标移动的距离
        const deltaX = e.clientX - startMouseX;
        const deltaY = e.clientY - startMouseY;

        // 计算新位置
        let newLeft = startToolbarLeft + deltaX;
        let newBottom = startToolbarBottom - deltaY; // Y轴反转，因为bottom是从下往上计算

        // 边界检测
        const toolbarRect = this.toolbar.getBoundingClientRect();
        const maxLeft = window.innerWidth - toolbarRect.width - 20;
        const maxBottom = window.innerHeight - toolbarRect.height - 20;

        newLeft = Math.max(20, Math.min(newLeft, maxLeft));
        newBottom = Math.max(20, Math.min(newBottom, maxBottom));

        // 应用新位置
        this.toolbar.style.left = newLeft + 'px';
        this.toolbar.style.bottom = newBottom + 'px';
        this.toolbar.style.transform = 'none';
      });
    };

    this.toolbarDragHandle.addEventListener('mousedown', (e) => {
      // 记录拖拽开始时的鼠标位置
      startMouseX = e.clientX;
      startMouseY = e.clientY;

      // 获取当前工具栏的实际渲染位置
      const rect = this.toolbar.getBoundingClientRect();

      // 先设置为绝对定位，但保持当前显示位置不变
      startToolbarLeft = rect.left;
      startToolbarBottom = window.innerHeight - rect.bottom;

      // 立即应用位置，确保视觉上没有跳跃
      this.toolbar.style.left = startToolbarLeft + 'px';
      this.toolbar.style.bottom = startToolbarBottom + 'px';
      this.toolbar.style.transform = 'none';

      // 开始拖拽
      isDragging = true;
      this.toolbar.classList.add('dragging');

      // 阻止默认事件和冒泡
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', handleDragMove);

    const endDrag = () => {
      if (isDragging) {
        isDragging = false;
        this.toolbar.classList.remove('dragging');

        // 取消动画帧请求
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        // 保存工具栏位置
        this.saveToolbarPosition();
      }
    };
    document.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);
  }

  /**
   * 保存工具栏位置
   */
  saveToolbarPosition() {
    // 不再持久化工具栏位置，始终使用默认底部居中
    try { localStorage.removeItem('wve-toolbar-position'); } catch (_) { /* no-op */ }
  }

  /**
   * 恢复工具栏位置
   */
  restoreToolbarPosition() {
    // 忽略历史位置，始终恢复为底部水平居中
    if (this.toolbar) {
      this.toolbar.style.bottom = '20px';
      this.toolbar.style.left = '50%';
      this.toolbar.style.transform = 'translateX(-50%)';
    }
  }

  // Emit code edit event to extension
  emitCodeEdits() {
    if (this.codeEdits.length === 0) { return; }
    const data = this.codeEdits.map(edit => {
      const element = edit.element;
      return {
        element: this.shortNameOf(element),
        codeRange: {
          start: +element.dataset.wveCodeStart,
          end: +element.dataset.wveCodeEnd
        },
        operations: edit.operations
      };
    });
    vscode.postMessage({ type: 'edit', data });
    this.codeEdits = [];
    if (wve.config.enableMovingElements) {
      this.moversBeforeEdit.clear();
    }
  }

  emitSelectionChange() {
    if (this.linkCode) {
      vscode.postMessage({
        type: 'select',
        data: Array.from(this.selected).map(el => {
          return {
            codeRange: {
              start: el.dataset.wveCodeStart,
              end: el.dataset.wveCodeEnd
            }
          };
        })
      });
    }
  }

  // Select element
  select(element, emit = true) {
    if (this.selected.has(element)) { return; }
    if (this.selected.values().some(s => s.contains(element) || element.contains(s))) {
      return;
    }
    if (this.codeEdits.some(edit => (
      edit.element !== element && (edit.element.contains(element) || element.contains(edit.element))
    ))) {
      return;
    }
    this.selected.add(element);
    element.setAttribute('wve-selected', '');
    if (wve.config.enableMovingElements) {
      if (element.hasAttribute('wve-movable')) {
        this.movers.add(element);
      }
      if (this.movers.size > 1) { this.toolbarGroupAlign.removeAttribute('disabled'); }
    }
    if (emit) { this.emitSelectionChange(); }
  }
  // Deselect element
  deselect(element = null) {
    if (!element) {
      this.selected.values().forEach(el => { this.deselect(el); });
      return;
    }
    if (!this.selected.has(element)) { return; }
    if (this.codeEdits.some(edit => (
      edit.element !== element && (edit.element.contains(element) || element.contains(edit.element))
    ))) {
      return;
    }
    this.selected.delete(element);
    element.removeAttribute('wve-selected');
    if (wve.config.enableMovingElements) {
      this.movers.delete(element);
      if (this.movers.size < 2) { this.toolbarGroupAlign.setAttribute('disabled', ''); }
    }
    this.emitSelectionChange();
  }
  // Deselect if the element is selected, otherwise select it
  toggleSelection(el) {
    if (this.selected.has(el)) {
      this.deselect(el);
    } else {
      this.select(el);
    }
  }
  beginStyleEdit() {
    if (wve.config.enableMovingElements) {
      this.moversBeforeEdit = new Map(this.movers.values().map(el => [el, el.cloneNode(true)]));
    }
  }
  finishStyleEdit(type) {
    if (!wve.config.enableMovingElements) { return; }
    this.movers.forEach(element => {
      const style = element.getAttribute('style');
      if (style === this.moversBeforeEdit.get(element).getAttribute('style')) { return; }
      const operation = { type, style };
      const updated = this.codeEdits.some(edit => {
        if (edit.element === element) {
          edit.operations.push(operation);
          return true;
        }
      });
      if (!updated) {
        this.codeEdits.push({ element, operations: [operation] });
      }
    });
  }

  // Event handlers
  // NOTE Define as arrow functions so that `this` is correctly referenced

  // Draw a rectangle of the selection area
  drawSelector = () => {
    if (this.operation !== 'selecting') { return; }
    requestAnimationFrame(this.drawSelector);
    const [width, height] = [
      Math.abs(this.mouse.current.pageX - this.mouse.start.pageX),
      Math.abs(this.mouse.current.pageY - this.mouse.start.pageY)
    ];
    const selector = this.selector;
    selector.style.width = width + 'px';
    selector.style.height = height + 'px';
    selector.style.left = Math.min(this.mouse.start.pageX, this.mouse.current.pageX) + 'px';
    selector.style.top = Math.min(this.mouse.start.pageY, this.mouse.current.pageY) + 'px';
    selector.style.display = 'block';
  };

  // Keyboard events
  setStateKeyboardPress(key) {
    this.keyboard[key] = true;
  }
  setStateKeyboardRelease(key) {
    this.keyboard[key] = false;
  }
  updateKeyboardCombinedState() {
    const kbd = this.keyboard;
    kbd.arrow = kbd.ArrowUp !== kbd.ArrowDown || kbd.ArrowLeft !== kbd.ArrowRight;
  }
  onKeyDown = event => {
    const kbd = this.keyboard;
    const prev = { ...kbd };
    switch (event.key) {
      case 'Escape':
        this.deselect();
        this.emitCodeEdits();
        break;
      case 'Shift':
      case 'Control':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.setStateKeyboardPress(event.key);
        break;
    }
    this.updateKeyboardCombinedState();
    if (!prev.Control && kbd.Control) {
      document.body.classList.add('wve-adding-selection');
    }
    if (wve.config.enableMovingElements) {
      if (this.operation === '') {
        if (!kbd.arrow || this.movers.size === 0) { return; }
        if (!prev.arrow) { this.beginStyleEdit(); }
        const dx = kbd.ArrowRight ? 1 : kbd.ArrowLeft ? -1 : 0;
        const dy = kbd.ArrowDown ? 1 : kbd.ArrowUp ? -1 : 0;
        this.movers.forEach(el => { this.moveElement(el, dx, dy); });
        // Disable scroll
        event.preventDefault();
      }
    }
  };

  onKeyUp = event => {
    const prev = { ...this.keyboard };
    switch (event.key) {
      case 'Shift':
      case 'Control':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.setStateKeyboardRelease(event.key);
        break;
    }
    this.updateKeyboardCombinedState();
    if (prev.Control && !this.keyboard.Control) {
      document.body.classList.remove('wve-adding-selection');
    }
    if (wve.config.enableMovingElements && prev.arrow && !this.keyboard.arrow) {
      this.finishStyleEdit('move');
      this.emitCodeEdits();
    }
    if (event.key === 'Delete' && this.selected.size > 0) {
      vscode.postMessage({
        type: 'delete',
        data: Array.from(this.selected).map(el => {
          return {
            codeRange: {
              start: +el.dataset.wveCodeStart,
              end: +el.dataset.wveCodeEnd
            }
          };
        })
      });
    }
  };

  onMouseDown = event => {
    // 处理 shadow DOM 下事件重定向，使用 composedPath 判断是否点击在工具栏内
    const path = event.composedPath ? event.composedPath() : [];
    if (this.toolbar && (this.toolbar.contains(event.target) || path.includes(this.toolbar))) { return; }
    const pos = this.realPositionOf(event);
    this.mouse.start.viewportX = this.mouse.current.viewportX = pos.clientX;
    this.mouse.start.viewportY = this.mouse.current.viewportY = pos.clientY;
    this.mouse.start.pageX = this.mouse.current.pageX = pos.pageX;
    this.mouse.start.pageY = this.mouse.current.pageY = pos.pageY;
    // Determine whether to select or edit the element based on the click position
    const atMovers = this.movers.values().some(el => {
      const rect = el.getBoundingClientRect();
      return (
        rect.left <= this.mouse.current.viewportX && this.mouse.current.viewportX <= rect.right
        && rect.top <= this.mouse.current.viewportY && this.mouse.current.viewportY <= rect.bottom
      );
    });
    if (atMovers && !this.keyboard.Control) {
      this.operation = 'moving';
      this.beginStyleEdit();
    } else {
      this.operation = 'selecting';
      this.selector.style.display = 'block';
      if (!this.keyboard.Control) { this.deselect(); }
    }
    // Process at the start of selection
    if (this.operation === 'selecting') {
      this.drawSelector();
    }
    document.addEventListener('mouseup', this.onMouseUp, { once: true });
    document.addEventListener('mousemove', this.onMouseMove);
  };

  onMouseMove = event => {
    const pos = this.realPositionOf(event);
    const dx = pos.clientX - this.mouse.current.viewportX;
    const dy = pos.clientY - this.mouse.current.viewportY;
    this.mouse.current.viewportX += dx;
    this.mouse.current.viewportY += dy;
    this.mouse.current.pageX = pos.pageX;
    this.mouse.current.pageY = pos.pageY;
    if (this.operation !== 'moving') { return; }
    if (this.keyboard.Shift) {
      const absDx = Math.abs(pos.clientX - this.mouse.start.viewportX);
      const absDy = Math.abs(pos.clientY - this.mouse.start.viewportY);
      const horizontal = absDx > absDy;
      this.movers.forEach(el => {
        const propFixed = horizontal ? el.dataset.wvePropY : el.dataset.wvePropX;
        el.style[propFixed] = this.moversBeforeEdit.get(el).style[propFixed];
        if (horizontal) {
          this.moveElement(el, dx, 0);
        } else {
          this.moveElement(el, 0, dy);
        }
      });
    } else {
      this.movers.forEach(el => this.moveElement(el, dx, dy));
    }
  };

  onMouseUp = event => {
    document.removeEventListener('mousemove', this.onMouseMove);
    if (this.operation === 'selecting') {
      if (this.mouse.start.viewportX !== this.mouse.current.viewportX
        || this.mouse.start.viewportY !== this.mouse.current.viewportY) {
        const selectorRect = this.selector.getBoundingClientRect();
        const targets = this.userElements.filter(el => {
          const rect = el.getBoundingClientRect();
          return el !== document.body && !(
            selectorRect.right < rect.left ||
            rect.right < selectorRect.left ||
            selectorRect.bottom < rect.top ||
            rect.bottom < selectorRect.top
          ) && !(
            rect.left <= selectorRect.left &&
            selectorRect.right <= rect.right &&
            rect.top <= selectorRect.top &&
            selectorRect.bottom <= rect.bottom
          );
        });
        if (this.keyboard.Control) {
          targets.forEach(el => this.toggleSelection(el));
        } else {
          targets.forEach(el => this.select(el));
        }
      } else if (event.target !== document.body) {
        if (this.keyboard.Control) {
          this.toggleSelection(event.target);
        } else {
          this.select(event.target);
        }
      }
      this.selector.style.display = 'none';
    } else {
      if (this.mouse.start.viewportX !== this.mouse.current.viewportX
        || this.mouse.start.viewportY !== this.mouse.current.viewportY) {
        this.finishStyleEdit('move');
      }
    }
    this.operation = '';
    this.emitCodeEdits();
  };

  onCopyAndCut = event => {
    vscode.postMessage({
      type: event.type,
      data: Array.from(this.selected).map(el => {
        return {
          codeRange: {
            start: +el.dataset.wveCodeStart,
            end: +el.dataset.wveCodeEnd
          }
        };
      })
    });
  };
  onPaste = async event => {
    if (!this.htmlParser) { this.htmlParser = new DOMParser(); }
    // NOTE Wait next focus due to fail to read clipboard in case pasted by context menu.
    if (!document.hasFocus()) {
      await new Promise(resolve => {
        window.addEventListener('focus', resolve, { once: true });
      });
    }
    const isHtml = this.htmlParser.parseFromString(
      await navigator.clipboard.readText(), 'text/html'
    ).body.firstElementChild !== null;
    const dest = Array.from(this.selected).at(-1) ?? document.body;
    vscode.postMessage({
      type: 'paste',
      data: {
        isHtml,
        codeRange: {
          start: +dest.dataset.wveCodeStart,
          end: +dest.dataset.wveCodeEnd
        }
      }
    });
  };

  onClickGroupAlign = event => {
    const [direction, alignTo] = event.target.id.split('-').slice(1);
    if (this.operation !== '' || this.movers.size < 2
      || (alignTo === 'justify' && this.movers.size < 3)) {
      return;
    }
    this.beginStyleEdit();
    const movers = Array.from(this.movers);
    if (alignTo === 'justify') {
      const [elementStart, elementEnd] = movers.reduce(([start, end], curr) => {
        const rectStart = start.getBoundingClientRect();
        const rectEnd = end.getBoundingClientRect();
        const rectCurr = curr.getBoundingClientRect();
        if (direction === 'horizontal') {
          if (rectCurr.left < rectStart.left) { start = curr; }
          if (rectEnd.right < rectCurr.right) { end = curr; }
        } else {
          if (rectCurr.top < rectStart.top) { start = curr; }
          if (rectEnd.bottom < rectCurr.bottom) { end = curr; }
        }
        return [start, end];
      }, movers.slice(0, 2));
      const targets = movers.filter(
        el => el !== elementStart && el !== elementEnd
      ).sort((a, b) => {
        const prop = direction === 'horizontal' ? 'left' : 'top';
        return a.getBoundingClientRect()[prop] - b.getBoundingClientRect()[prop];
      });
      const startEdge = elementStart.getBoundingClientRect()[direction === 'horizontal' ? 'right' : 'bottom'];
      const gap = (
        elementEnd.getBoundingClientRect()[direction === 'horizontal' ? 'left' : 'top']
        - elementStart.getBoundingClientRect()[direction === 'horizontal' ? 'right' : 'bottom']
        - targets.reduce((total, el) => {
          return total + (direction === 'horizontal' ? el.offsetWidth : el.offsetHeight);
        }, 0)
      ) / (targets.length + 1);
      let currentPosition = startEdge + gap;
      targets.forEach(el => {
        if (direction === 'horizontal') {
          this.moveElement(el, currentPosition - el.getBoundingClientRect().left, 0);
          currentPosition += el.offsetWidth + gap;
        } else {
          this.moveElement(el, 0, currentPosition - el.getBoundingClientRect().top);
          currentPosition += el.offsetHeight + gap;
        }
      });
    } else {
      const anchors = movers.map(el => {
        const rect = el.getBoundingClientRect();
        if (alignTo === 'center') {
          if (direction === 'vertical') {
            return (rect.top + rect.bottom) / 2;
          } else {
            return (rect.left + rect.right) / 2;
          }
        } else {
          return rect[alignTo];
        }
      });
      const destination = (alignTo === 'center' ? anchors[0]
        : Math[{ left: 'min', right: 'max', top: 'min', bottom: 'max' }[alignTo]](...anchors)
      );
      movers.forEach((el, index) => {
        const dx = direction === 'vertical' ? 0 : destination - anchors[index];
        const dy = direction === 'horizontal' ? 0 : destination - anchors[index];
        this.moveElement(el, dx, dy);
      });
    }
    this.finishStyleEdit('move');
    this.emitCodeEdits();
  };
};

const vscode = acquireVsCodeApi();

// Initial display
document.addEventListener('DOMContentLoaded', async () => {
  const app = new WebVisualEditor();
  // Remove Visual Studio Code default styles
  document.getElementById('_defaultStyles')?.remove();
  // Incorporate styles into the user-layer
  // NOTE Implement here rather than Extension Host due to JSDOM's lack of @layer support
  document.querySelectorAll('style:not(#wve-user-css-imports)').forEach(el => {
    el.textContent = `\n@layer user-style {\n${el.textContent}\n}`;
  });
  if (wve.config.enableMovingElements) {
    app.initMovables();
  }
  app.initSelector();
  app.initFloatingToolbar();
  app.restoreToolbarPosition();

  // 确保 Lucide 图标正确初始化
  setTimeout(() => {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }, 500);
  app.updateZoom();
  app.updateLinkCode();
  document.addEventListener('mousedown', app.onMouseDown);
  document.addEventListener('keydown', app.onKeyDown);
  document.addEventListener('keyup', app.onKeyUp);
  document.addEventListener('copy', app.onCopyAndCut);
  document.addEventListener('cut', app.onCopyAndCut);
  document.addEventListener('paste', app.onPaste);
  // Message from extension host
  window.addEventListener('message', ({ data: { type, data } }) => {
    switch (type) {
      case 'state':
        Object.assign(app, data);
        app.updateZoom();
        app.updateLinkCode();
        break;
      case 'codeRanges':
        app.userElements.forEach((element, index) => {
          const { start, end } = data[index];
          element.setAttribute('data-wve-code-start', start);
          element.setAttribute('data-wve-code-end', end);
        });
        break;
      case 'select':
        if (!app.linkCode) { return; }
        const selecting = data.reduce((collected, position) => {
          const found = app.userElements.findLast(element => {
            const [start, end] = [+element.dataset.wveCodeStart, +element.dataset.wveCodeEnd];
            return start <= position.start && position.end <= end;
          });
          if (found) { collected.push(found); }
          return collected;
        }, []);
        if (selecting.length === 0) { return; }
        app.deselect();
        selecting.forEach(el => app.select(el, false));
        break;
    }
  });
});
