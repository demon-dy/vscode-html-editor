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
    this.dimensionsDisplay = null;
    this.dimensionsUpdateThrottle = null;

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
    this.toolbar.className = 'fixed bottom-5 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-lg backdrop-blur-sm';
    this.toolbar.style.zIndex = '50000'; // 确保在属性面板(40000)上方

    // 手动设置居中定位，确保兼容性
    this.toolbar.style.left = '50%';
    this.toolbar.style.transform = 'translateX(-50%)';
    fragment.appendChild(this.toolbar);

    // 定义控件ID
    this.controls = {
      toolbarEditMode: 'wve-edit-mode',
      toolbarPreviewMode: 'wve-preview-mode',
      toolbarEditModeLabel: 'wve-edit-mode-label',
      toolbarPreviewModeLabel: 'wve-preview-mode-label',
      toolbarEditModeButton: 'wve-edit-mode-button',
      toolbarPreviewModeButton: 'wve-preview-mode-button',
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

    // 创建尺寸显示组件
    this.createDimensionsDisplay(fragment);

    // 渲染到 Shadow DOM 中
    this.uiManager.getUIRoot().appendChild(fragment);

    // 保存控件引用
    this.bindControls();

    // 绑定事件处理器
    this.bindEvents();

    // 初始化图标
    this.initIcons();

    // 初始化时显示一次尺寸信息
    setTimeout(() => {
      this.updateDimensionsNow();
      this.showDimensions();
    }, 500);

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
        
        <div class="flex items-center gap-1" role="radiogroup" aria-label="模式切换">
          <label id="${c.toolbarEditModeLabel}" class="flex" role="radio" aria-checked="true" tabindex="0" title="编辑模式">
            <input id="${c.toolbarEditMode}" class="wve-mode-radio" type="radio" name="wve-mode" value="edit" checked>
            <span id="${c.toolbarEditModeButton}" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </span>
          </label>
          <label id="${c.toolbarPreviewModeLabel}" class="flex" role="radio" aria-checked="false" tabindex="-1" title="预览模式">
            <input id="${c.toolbarPreviewMode}" class="wve-mode-radio" type="radio" name="wve-mode" value="preview">
            <span id="${c.toolbarPreviewModeButton}" class="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </span>
          </label>
        </div>
    `;

    this.logger.debug('Toolbar HTML created');
  }

  /**
   * 创建尺寸显示组件
   */
  createDimensionsDisplay(fragment) {
    this.dimensionsDisplay = document.createElement('div');
    this.dimensionsDisplay.id = 'wve-dimensions-display';

    // 使用内联样式确保定位正确
    Object.assign(this.dimensionsDisplay.style, {
      position: 'fixed',
      // 位置将动态计算，基于工具栏位置
      top: '0px',
      left: '0px',
      padding: '8px 16px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      fontSize: '14px',
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      zIndex: '50001',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      whiteSpace: 'nowrap'
    });

    this.dimensionsDisplay.textContent = '0 × 0';

    fragment.appendChild(this.dimensionsDisplay);
    this.logger.debug('Dimensions display created with inline styles');
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
    this.toolbarEditMode?.addEventListener('change', (event) => {
      if (!event.target.checked) return;
      this.logger.debug('Edit mode selected');
      this.toggleEditMode();
    });

    // 预览模式切换
    this.toolbarPreviewMode?.addEventListener('change', (event) => {
      if (!event.target.checked) return;
      this.logger.debug('Preview mode selected');
      this.togglePreviewMode();
    });

    this.toolbarEditModeLabel?.addEventListener('keydown', (event) => {
      this.handleModeKeyboard(event, 'edit');
    });
    this.toolbarPreviewModeLabel?.addEventListener('keydown', (event) => {
      this.handleModeKeyboard(event, 'preview');
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

    // 初始化模式状态
    this.applyModeState();

    // 监听窗口大小变化（屏幕缩放等）
    window.addEventListener('resize', () => {
      this.showDimensions();
    });

    // 添加快捷键：按 D 键显示尺寸信息
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // 确保不在输入框中
        if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
          e.preventDefault();
          this.showDimensions();
          this.logger.debug('Dimensions display triggered by keyboard shortcut');
        }
      }
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
    this.stateManager.setMode('edit');
    this.applyModeState();
    this.logger.info('Mode set to edit');
  }

  /**
   * 切换预览模式
   */
  togglePreviewMode() {
    this.stateManager.setMode('preview');
    this.applyModeState();
    this.clearSelectionForPreview();
    this.logger.info('Mode set to preview');
  }

  /**
   * 根据状态更新模式相关的样式与控件
   */
  applyModeState() {
    const isEditMode = !!this.stateManager.editMode;
    const isPreviewMode = !!this.stateManager.previewMode;

    if (this.toolbarEditMode) {
      this.toolbarEditMode.checked = isEditMode;
    }
    if (this.toolbarPreviewMode) {
      this.toolbarPreviewMode.checked = isPreviewMode;
    }

    this.toolbarEditModeLabel?.setAttribute('aria-checked', String(isEditMode));
    this.toolbarPreviewModeLabel?.setAttribute('aria-checked', String(isPreviewMode));

    this.toolbarEditModeButton?.classList.toggle('active', isEditMode);
    this.toolbarPreviewModeButton?.classList.toggle('active', isPreviewMode);

    if (this.toolbarEditModeLabel) {
      this.toolbarEditModeLabel.setAttribute('tabindex', isEditMode ? '0' : '-1');
    }
    if (this.toolbarPreviewModeLabel) {
      this.toolbarPreviewModeLabel.setAttribute('tabindex', isPreviewMode ? '0' : '-1');
    }

    document.body.classList.toggle('wve-edit-mode', isEditMode);
    document.body.classList.toggle('wve-preview-mode', isPreviewMode);
  }

  /**
   * 预览模式下清空选择，避免误操作
   */
  clearSelectionForPreview() {
    if (!this.stateManager.previewMode) return;

    try {
      const app = window.WVE?.app?.();
      const selectionManager = app?.getSelectionManager?.();
      selectionManager?.clearSelection?.();

      const selector = this.uiManager.getSelector?.();
      if (selector) {
        selector.style.display = 'none';
      }
    } catch (error) {
      this.logger.warn('Failed to clear selection for preview mode', error);
    }
  }

  /**
   * 响应模式标签的键盘交互
   */
  handleModeKeyboard(event, mode) {
    if (event.key === ' ' || event.key === 'Space' || event.key === 'Spacebar' || event.key === 'Enter') {
      event.preventDefault();
      if (mode === 'edit') {
        if (!this.toolbarEditMode?.checked) {
          this.toolbarEditMode.checked = true;
        }
        this.toggleEditMode();
      } else {
        if (!this.toolbarPreviewMode?.checked) {
          this.toolbarPreviewMode.checked = true;
        }
        this.togglePreviewMode();
      }
    }
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

    // 显示尺寸信息
    this.showDimensions();

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

    // 显示尺寸信息
    setTimeout(() => this.showDimensions(), 100); // 延迟一点让DOM更新完成
  }

  /**
   * 获取工具栏元素
   */
  getToolbar() {
    return this.toolbar;
  }

  /**
   * 更新尺寸显示位置（基于工具栏位置）
   */
  updateDimensionsPosition() {
    if (!this.dimensionsDisplay || !this.toolbar) {
      return;
    }

    const toolbarRect = this.toolbar.getBoundingClientRect();
    const displayRect = this.dimensionsDisplay.getBoundingClientRect();

    // 计算位置：工具栏上方16px，水平居中对齐工具栏
    const top = toolbarRect.top - displayRect.height - 16;
    const left = toolbarRect.left + (toolbarRect.width - displayRect.width) / 2;

    // 确保不超出屏幕边界
    const finalTop = Math.max(10, top); // 距离顶部至少10px
    const finalLeft = Math.max(10, Math.min(window.innerWidth - displayRect.width - 10, left));

    this.dimensionsDisplay.style.top = finalTop + 'px';
    this.dimensionsDisplay.style.left = finalLeft + 'px';
  }

  /**
   * 显示尺寸信息
   */
  showDimensions() {
    if (!this.dimensionsDisplay) {
      this.logger.warn('Dimensions display not found');
      return;
    }

    this.updateDimensions();
    this.updateDimensionsPosition(); // 更新位置
    this.dimensionsDisplay.style.opacity = '1';

    // 调试信息
    const rect = this.dimensionsDisplay.getBoundingClientRect();
    this.logger.debug('Dimensions display shown:', {
      content: this.dimensionsDisplay.textContent,
      position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      toolbarPosition: this.toolbar ? this.toolbar.getBoundingClientRect() : null
    });

    // 3秒后自动隐藏
    clearTimeout(this.dimensionsHideTimeout);
    this.dimensionsHideTimeout = setTimeout(() => {
      this.hideDimensions();
    }, 3000);
  }

  /**
   * 隐藏尺寸信息
   */
  hideDimensions() {
    if (!this.dimensionsDisplay) {
      return;
    }
    this.dimensionsDisplay.style.opacity = '0';
  }

  /**
   * 更新尺寸信息（带节流）
   */
  updateDimensions() {
    if (this.dimensionsUpdateThrottle) {
      clearTimeout(this.dimensionsUpdateThrottle);
    }

    this.dimensionsUpdateThrottle = setTimeout(() => {
      this.updateDimensionsNow();
    }, 150); // 150ms节流，平衡性能和响应性
  }

  /**
   * 立即更新尺寸信息
   */
  updateDimensionsNow() {
    if (!this.dimensionsDisplay) {
      return;
    }

    const body = document.body;
    const rect = body.getBoundingClientRect();
    const zoom = this.stateManager.zoom;

    // 计算实际渲染尺寸（考虑缩放）
    const actualWidth = Math.round(rect.width / zoom);
    const actualHeight = Math.round(rect.height / zoom);

    this.dimensionsDisplay.textContent = `${actualWidth} × ${actualHeight} (${Math.round(zoom * 100)}%)`;
    this.logger.debug(`Dimensions updated: ${actualWidth}×${actualHeight} at ${Math.round(zoom * 100)}%`);
  }

  /**
   * 获取拖拽手柄
   */
  getDragHandle() {
    return this.toolbarDragHandle;
  }
};
