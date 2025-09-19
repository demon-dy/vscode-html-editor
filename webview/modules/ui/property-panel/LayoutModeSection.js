/**
 * 布局模式选择器 - 新属性面板的核心组件
 * 实现"布局模式优先"的设计理念
 */
window.WVE = window.WVE || {};
window.WVE.LayoutModeSection = class LayoutModeSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '布局模式 Layout Mode',
      collapsed: false,
      className: 'layout-mode-section',
      ...options
    });

    this.currentElement = null;
    this.currentMode = 'none'; // none, absolute, flex, grid

    // 模式定义
    this.modes = {
      none: {
        name: '无布局',
        icon: 'file-text',
        description: '默认文档流，适用于简单文本和基础布局',
        cssClass: 'mode-none'
      },
      absolute: {
        name: '绝对布局',
        icon: 'move',
        description: '精确定位，适用于覆盖层和特殊位置需求',
        cssClass: 'mode-absolute'
      },
      flex: {
        name: '响应式布局',
        icon: 'split-square-horizontal',
        description: '现代响应式设计 (Flexbox)',
        cssClass: 'mode-flex'
      },
      grid: {
        name: '网格布局',
        icon: 'grid-3x3',
        description: '复杂的二维布局 (Grid)',
        cssClass: 'mode-grid'
      }
    };

    this.onModeChange = null; // 模式变更回调
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 创建模式选择器
    this.createModeSelector(container);

    // 创建当前模式说明
    this.createModeDescription(container);

    // 应用样式
    this.injectStyles();

    // 初始化 Lucide 图标，传入容器（延迟执行确保DOM完全构建）
    setTimeout(() => this.initializeLucideIcons(container), 0);
  }

  createModeSelector(container) {
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'mode-selector-container';

    // 创建4个模式按钮 - 使用 Tailwind 类
    const modesContainer = document.createElement('div');
    modesContainer.className = 'flex bg-[#2c2c2c] rounded gap-1 p-1 border border-[#3d3d3d]';

    Object.entries(this.modes).forEach(([key, mode]) => {
      const button = this.createModeButton(key, mode);
      modesContainer.appendChild(button);
    });

    selectorContainer.appendChild(modesContainer);
    container.appendChild(selectorContainer);
  }

  createModeButton(modeKey, mode) {
    const button = document.createElement('div');
    button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
    button.dataset.mode = modeKey;
    button.title = mode.name;

    // 图标 - 使用 Lucide 图标
    const icon = document.createElement('i');
    icon.className = 'w-4 h-4';
    icon.setAttribute('data-lucide', mode.icon);

    button.appendChild(icon);

    // 点击事件
    button.addEventListener('click', () => {
      this.selectMode(modeKey);
    });

    return button;
  }

  createModeDescription(container) {
    const descContainer = document.createElement('div');
    descContainer.className = 'mode-description-container';

    // 当前选择说明
    this.currentModeDesc = document.createElement('div');
    this.currentModeDesc.className = 'current-mode-desc';
    this.updateModeDescription();

    descContainer.appendChild(this.currentModeDesc);
    container.appendChild(descContainer);
  }

  updateModeDescription() {
    if (!this.currentModeDesc) {
      return;
    }

    const mode = this.modes[this.currentMode];
    if (mode) {
      this.currentModeDesc.innerHTML = `
        <div class="mode-desc-label">※ 当前选择：</div>
        <div class="mode-desc-text">${mode.name} (${mode.description})</div>
      `;
    }
  }

  /**
   * 选择布局模式
   */
  selectMode(modeKey) {
    if (this.currentMode === modeKey) {
      return;
    }

    const prevMode = this.currentMode;
    this.currentMode = modeKey;

    // 更新UI状态
    this.updateModeButtons();
    this.updateModeDescription();

    // 应用CSS样式到当前元素
    if (this.currentElement) {
      this.applyModeToElement(modeKey, prevMode);
    }

    // 触发模式变更事件
    if (this.onModeChange) {
      this.onModeChange(modeKey, prevMode, this.currentElement);
    }

    // 通知外部系统
    this.dispatchModeChangeEvent(modeKey, prevMode);
  }

  updateModeButtons() {
    const buttons = this.element.querySelectorAll('[data-mode]');
    buttons.forEach(button => {
      if (button.dataset.mode === this.currentMode) {
        // 激活状态 - 使用白色背景，黑色图标
        button.className = 'flex items-center justify-center w-8 h-8 rounded bg-white text-black cursor-pointer';
      } else {
        // 非激活状态
        button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
      }
    });
  }

  /**
   * 将布局模式应用到元素
   */
  applyModeToElement(newMode, prevMode) {
    if (!this.currentElement) {
      return;
    }

    const element = this.currentElement;

    // 清除前一个模式的样式
    this.clearModeStyles(element, prevMode);

    // 应用新模式的样式
    switch (newMode) {
      case 'none':
        this.applyNoneMode(element);
        break;
      case 'absolute':
        this.applyAbsoluteMode(element);
        break;
      case 'flex':
        this.applyFlexMode(element);
        break;
      case 'grid':
        this.applyGridMode(element);
        break;
    }

    // 通知样式变更
    this.notifyStyleChange('layoutMode', newMode);
  }

  clearModeStyles(element, mode) {
    const style = element.style;

    switch (mode) {
      case 'absolute':
        style.removeProperty('position');
        style.removeProperty('top');
        style.removeProperty('left');
        style.removeProperty('right');
        style.removeProperty('bottom');
        style.removeProperty('z-index');
        break;
      case 'flex':
        style.removeProperty('display');
        style.removeProperty('flex-direction');
        style.removeProperty('flex-wrap');
        style.removeProperty('justify-content');
        style.removeProperty('align-items');
        style.removeProperty('align-content');
        style.removeProperty('gap');
        break;
      case 'grid':
        style.removeProperty('display');
        style.removeProperty('grid-template-columns');
        style.removeProperty('grid-template-rows');
        style.removeProperty('grid-gap');
        style.removeProperty('gap');
        style.removeProperty('justify-items');
        style.removeProperty('align-items');
        break;
    }
  }

  applyNoneMode(element) {
    // 确保没有特殊的display值
    const currentDisplay = window.getComputedStyle(element).display;
    if (['flex', 'grid', 'inline-flex', 'inline-grid'].includes(currentDisplay)) {
      element.style.display = 'block';
    }
  }

  applyAbsoluteMode(element) {
    element.style.position = 'absolute';
    // 如果没有设置位置，使用当前位置
    if (!element.style.top && !element.style.left) {
      const rect = element.getBoundingClientRect();
      element.style.top = rect.top + 'px';
      element.style.left = rect.left + 'px';
    }
  }

  applyFlexMode(element) {
    element.style.display = 'flex';
    // 设置默认的flex属性
    if (!element.style.flexDirection) {
      element.style.flexDirection = 'row';
    }
    if (!element.style.alignItems) {
      element.style.alignItems = 'stretch';
    }
  }

  applyGridMode(element) {
    element.style.display = 'grid';
    // 设置默认的grid属性
    if (!element.style.gridTemplateColumns) {
      element.style.gridTemplateColumns = '1fr';
    }
    if (!element.style.gridTemplateRows) {
      element.style.gridTemplateRows = 'auto';
    }
  }

  /**
   * 从元素检测当前布局模式
   */
  detectModeFromElement(element) {
    if (!element) {
      return 'none';
    }

    const style = window.getComputedStyle(element);

    // 检测position
    if (style.position === 'absolute' || style.position === 'fixed') {
      return 'absolute';
    }

    // 检测display
    if (style.display === 'flex' || style.display === 'inline-flex') {
      return 'flex';
    }

    if (style.display === 'grid' || style.display === 'inline-grid') {
      return 'grid';
    }

    return 'none';
  }

  /**
   * 更新组件以匹配当前元素
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    if (element) {
      // 检测元素的当前布局模式
      const detectedMode = this.detectModeFromElement(element);

      // 只有当检测到的模式与当前模式不同时才更新
      if (detectedMode !== this.currentMode) {
        this.currentMode = detectedMode;
        this.updateModeButtons();
        this.updateModeDescription();
      }
    }
  }

  /**
   * 通知样式变更
   */
  notifyStyleChange(property, value) {
    const event = new CustomEvent('wveStyleChange', {
      detail: {
        element: this.currentElement,
        property: property,
        value: value,
        source: 'LayoutModeSection'
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 派发模式变更事件
   */
  dispatchModeChangeEvent(newMode, prevMode) {
    const event = new CustomEvent('wveLayoutModeChange', {
      detail: {
        element: this.currentElement,
        newMode: newMode,
        prevMode: prevMode,
        modes: this.modes
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 获取当前模式
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * 以编程方式设置模式
   */
  setMode(mode) {
    if (this.modes[mode]) {
      this.selectMode(mode);
    }
  }

  /**
   * 初始化 Lucide 图标
   */
  initializeLucideIcons(container) {
    // 确保 LucideIcons 可用
    if (typeof window.WVE !== 'undefined' && window.WVE.LucideIcons) {
      // 使用传入的容器或者this.element查找Lucide图标
      const targetElement = container || this.element;
      if (targetElement) {
        // 使用 replaceInRoot 方法来初始化图标
        window.WVE.LucideIcons.replaceInRoot(targetElement);
      }
    } else {
      // 如果 LucideIcons 还未加载，延迟初始化
      setTimeout(() => this.initializeLucideIcons(container), 100);
    }
  }

  injectStyles() {
    if (document.getElementById('layout-mode-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'layout-mode-styles';
    style.textContent = `
      .layout-mode-section .section-content {
        padding: 12px;
      }

      .mode-selector-container {
        margin-bottom: 12px;
      }

      .mode-description-container {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
      }

      .mode-desc-label {
        font-size: 10px;
        color: #999999;
        margin-bottom: 4px;
      }

      .mode-desc-text {
        font-size: 11px;
        color: #cccccc;
        line-height: 1.3;
      }
    `;

    document.head.appendChild(style);
  }
};