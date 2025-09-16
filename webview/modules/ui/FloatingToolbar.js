/**
 * 悬浮工具栏模块
 */
window.WVE = window.WVE || {};
window.WVE.FloatingToolbar = class FloatingToolbar {
  constructor(uiManager, stateManager, eventManager) {
    this.logger = new window.WVE.Logger('FloatingToolbar');
    this.uiManager = uiManager;
    this.stateManager = stateManager;
    this.eventManager = eventManager;

    this.toolbar = null;
    this.controls = {};

    this.logger.info('Initializing FloatingToolbar');
  }

  /**
   * 初始化底部悬浮工具栏
   */
  init() {
    this.logger.info('Creating floating toolbar');

    // 确保 UI 容器已初始化
    this.uiManager.initUIRoot();

    const fragment = new DocumentFragment();
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'wve-floating-toolbar';
    this.toolbar.className = 'fixed bottom-5 z-50 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-lg backdrop-blur-sm';

    // 手动设置居中定位，确保兼容性
    this.toolbar.style.left = '50%';
    this.toolbar.style.transform = 'translateX(-50%)';
    fragment.appendChild(this.toolbar);

    // 定义控件ID
    this.controls = {
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

    // 创建工具栏HTML
    this.createToolbarHTML();

    // 渲染到 Shadow DOM 中
    this.uiManager.getUIRoot().appendChild(fragment);

    // 保存控件引用
    this.bindControls();

    // 绑定事件处理器
    this.bindEvents();

    // 初始化图标
    this.initIcons();

    this.logger.info('Floating toolbar created successfully');
  }

  /**
   * 创建工具栏HTML结构
   */
  createToolbarHTML() {
    const c = this.controls;

    this.toolbar.innerHTML = `
      <div class="flex items-center cursor-grab hover:bg-gray-100 rounded p-1 transition-colors" id="${c.toolbarDragHandle}" title="拖拽移动工具栏">
        <i data-lucide="grip-vertical" class="w-3 h-3 text-gray-500"></i>
      </div>
      <div class="flex items-center gap-1">
        <button id="${c.toolbarEditMode}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="编辑模式">
          <i data-lucide="edit-3" class="w-4 h-4"></i>
        </button>
        <button id="${c.toolbarPreviewMode}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="预览模式">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </button>
        <button id="${c.toolbarLinkCode}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="关联代码">
          <i data-lucide="link" class="w-4 h-4"></i>
        </button>
        <button id="${c.toolbarRefresh}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="刷新视图">
          <i data-lucide="refresh-cw" class="w-4 h-4"></i>
        </button>
        <button id="${c.toolbarZoomIn}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="放大视图">
          <i data-lucide="zoom-in" class="w-4 h-4"></i>
        </button>
        <span id="${c.toolbarZoomValue}" class="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">100%</span>
        <button id="${c.toolbarZoomOut}" type="button" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors" title="缩小视图">
          <i data-lucide="zoom-out" class="w-4 h-4"></i>
        </button>
        <select id="${c.toolbarDeviceSelector}" class="px-2 py-1 text-xs font-medium bg-gray-100 border-0 rounded cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" title="设备预览">
          <option value="desktop">1440×900 桌面</option>
          <option value="laptop">1024×768 笔记本</option>
          <option value="tablet">768×1024 平板</option>
          <option value="mobile-large">414×896 大屏手机</option>
          <option value="mobile-medium">375×667 中屏手机</option>
          <option value="mobile-small">320×568 小屏手机</option>
        </select>
      </div>
    `;

    this.logger.debug('Toolbar HTML created');
  }

  /**
   * 绑定控件引用
   */
  bindControls() {
    const uiRoot = this.uiManager.getUIRoot();

    Object.entries(this.controls).forEach(([key, id]) => {
      this[key] = uiRoot.getElementById ? uiRoot.getElementById(id) : uiRoot.querySelector('#' + id);
    });

    this.logger.debug('Controls bound to toolbar');
  }

  /**
   * 绑定事件处理器
   */
  bindEvents() {
    this.logger.debug('Binding toolbar events');

    // 编辑模式切换
    this.toolbarEditMode?.addEventListener('click', () => {
      this.logger.debug('Edit mode button clicked');
      this.toggleEditMode();
    });

    // 预览模式切换
    this.toolbarPreviewMode?.addEventListener('click', () => {
      this.logger.debug('Preview mode button clicked');
      this.togglePreviewMode();
    });

    // 关联代码切换
    this.toolbarLinkCode?.addEventListener('click', () => {
      this.logger.debug('Link code button clicked');
      this.stateManager.toggleLinkCode();
      this.updateLinkCodeButton();
    });

    // 刷新视图
    this.toolbarRefresh?.addEventListener('click', () => {
      this.logger.debug('Refresh button clicked');
      this.eventManager.emitRefresh();
    });

    // 缩放控制
    this.toolbarZoomIn?.addEventListener('click', () => {
      this.logger.debug('Zoom in button clicked');
      this.updateZoom(1);
    });

    this.toolbarZoomOut?.addEventListener('click', () => {
      this.logger.debug('Zoom out button clicked');
      this.updateZoom(-1);
    });

    // 设备选择器
    this.toolbarDeviceSelector?.addEventListener('change', (event) => {
      this.logger.debug('Device selector changed:', event.target.value);
      this.switchDevice(event.target.value);
    });

    this.logger.debug('Toolbar events bound successfully');
  }

  /**
   * 初始化图标
   */
  initIcons() {
    this.logger.debug('Initializing toolbar icons');
    window.WVE.LucideIcons.initialize();
    window.WVE.LucideIcons.replaceInRoot(this.uiManager.getUIRoot());
  }

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    this.stateManager.toggleEditMode();

    if (this.stateManager.editMode) {
      document.body.classList.add('wve-edit-mode');
      this.toolbarEditMode.classList.add('active');
      this.toolbarPreviewMode.classList.remove('active');
    } else {
      document.body.classList.remove('wve-edit-mode');
      this.toolbarEditMode.classList.remove('active');
    }

    this.logger.info('Edit mode toggled:', this.stateManager.editMode);
  }

  /**
   * 切换预览模式
   */
  togglePreviewMode() {
    this.stateManager.togglePreviewMode();

    if (this.stateManager.previewMode) {
      document.body.classList.add('wve-preview-mode');
      this.toolbarPreviewMode.classList.add('active');
      this.toolbarEditMode.classList.remove('active');
    } else {
      document.body.classList.remove('wve-preview-mode');
      this.toolbarPreviewMode.classList.remove('active');
    }

    this.logger.info('Preview mode toggled:', this.stateManager.previewMode);
  }

  /**
   * 更新缩放
   */
  updateZoom(sign) {
    const steps = ['0.5', '0.67', '0.8', '0.9', '1', '1.1', '1.25', '1.5', '2'];

    if (sign) {
      const currentIndex = steps.indexOf(this.stateManager.zoom);
      const newIndex = currentIndex + sign;

      if (newIndex >= 0 && newIndex < steps.length) {
        this.stateManager.setZoom(steps[newIndex]);
      }
    }

    // 设置CSS变量，只影响用户内容
    document.documentElement.style.setProperty('--wve-zoom', this.stateManager.zoom);

    // 更新工具栏显示
    if (this.toolbarZoomValue) {
      this.toolbarZoomValue.textContent = (
        this.stateManager.zoom.replace(/^0/, ' ').replace('.', '').padEnd(3, '0') + '%'
      );
    }

    // 更新按钮状态
    const stepIndex = steps.indexOf(this.stateManager.zoom);
    if (stepIndex >= 0) {
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

    this.logger.debug('Zoom updated:', this.stateManager.zoom);
  }

  /**
   * 更新关联代码按钮状态
   */
  updateLinkCodeButton() {
    if (this.stateManager.linkCode) {
      this.toolbarLinkCode.classList.add('active');
      this.toolbarLinkCode.title = '关联代码 (已启用)';
    } else {
      this.toolbarLinkCode.classList.remove('active');
      this.toolbarLinkCode.title = '关联代码 (已禁用)';
    }

    this.logger.debug('Link code button updated:', this.stateManager.linkCode);
  }

  /**
   * 设备预览切换
   */
  switchDevice(deviceType) {
    this.logger.info('Switching device:', deviceType);

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
   * 获取工具栏元素
   */
  getToolbar() {
    return this.toolbar;
  }

  /**
   * 获取拖拽手柄
   */
  getDragHandle() {
    return this.toolbarDragHandle;
  }
};