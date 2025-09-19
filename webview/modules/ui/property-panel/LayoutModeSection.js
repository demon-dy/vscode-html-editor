/**
 * 布局模式选择器 - 定位类型 + 布局方式分离设计
 * 顶部：定位类型选择（相对|绝对|固定|粘性）
 * 下方：布局方式选择（无布局|自动布局|网格布局）
 */
window.WVE = window.WVE || {};
window.WVE.LayoutModeSection = class LayoutModeSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '布局设置 Layout Settings',
      collapsed: false,
      className: 'layout-mode-section',
      ...options
    });

    this.currentElement = null;
    this.currentPosition = 'static'; // static, relative, absolute, fixed, sticky
    this.currentLayout = 'none'; // none, flex, grid

    // 初始化 LayoutAdapter
    this.layoutAdapter = new window.WVE.LayoutAdapter();

    // 定位类型定义
    this.positionTypes = {
      static: {
        name: '静态',
        icon: 'file-text',
        description: '默认定位，跟随文档流'
      },
      relative: {
        name: '相对',
        icon: 'move-3d',
        description: '相对于自身位置定位'
      },
      absolute: {
        name: '绝对',
        icon: 'move',
        description: '相对于最近定位祖先元素定位'
      },
      fixed: {
        name: '固定',
        icon: 'pin',
        description: '相对于视口固定定位'
      },
      sticky: {
        name: '粘性',
        icon: 'sticky-note',
        description: '粘性定位，结合相对和固定'
      }
    };

    // 布局方式定义
    this.layoutTypes = {
      none: {
        name: '无布局',
        icon: 'file-text',
        description: '默认文档流，block/inline元素'
      },
      flex: {
        name: '自动布局',
        icon: 'split-square-horizontal',
        description: '现代响应式设计 (Flexbox)'
      },
      grid: {
        name: '网格布局',
        icon: 'grid-3x3',
        description: '复杂的二维布局 (Grid)'
      }
    };

    this.onPositionChange = null; // 定位变更回调
    this.onLayoutChange = null; // 布局变更回调
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 创建定位类型选择器
    this.createPositionSelector(container);

    // 创建分隔线
    this.createDivider(container);

    // 创建布局方式选择器
    this.createLayoutSelector(container);

    // 创建当前设置说明
    this.createSettingsDescription(container);

    // 应用样式
    this.injectStyles();

    // 初始化 Lucide 图标
    setTimeout(() => this.initializeLucideIcons(container), 0);
  }

  createPositionSelector(container) {
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'position-selector-container';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '定位类型 Position';

    // 定位类型按钮组
    const positionsContainer = document.createElement('div');
    positionsContainer.className = 'flex bg-[#2c2c2c] rounded gap-1 p-1 border border-[#3d3d3d] mb-2';

    Object.entries(this.positionTypes).forEach(([key, position]) => {
      const button = this.createPositionButton(key, position);
      positionsContainer.appendChild(button);
    });

    sectionContainer.appendChild(title);
    sectionContainer.appendChild(positionsContainer);
    container.appendChild(sectionContainer);
  }

  createLayoutSelector(container) {
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'layout-selector-container';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '布局方式 Layout';

    // 布局方式按钮组
    const layoutsContainer = document.createElement('div');
    layoutsContainer.className = 'flex bg-[#2c2c2c] rounded gap-1 p-1 border border-[#3d3d3d] mb-2';

    Object.entries(this.layoutTypes).forEach(([key, layout]) => {
      const button = this.createLayoutButton(key, layout);
      layoutsContainer.appendChild(button);
    });

    sectionContainer.appendChild(title);
    sectionContainer.appendChild(layoutsContainer);
    container.appendChild(sectionContainer);
  }

  createDivider(container) {
    const divider = document.createElement('div');
    divider.className = 'divider';
    container.appendChild(divider);
  }

  createPositionButton(positionKey, position) {
    const button = document.createElement('div');
    button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
    button.dataset.position = positionKey;
    button.title = `${position.name} - ${position.description}`;

    // 图标 - 使用 Lucide 图标
    const icon = document.createElement('i');
    icon.className = 'w-4 h-4';
    icon.setAttribute('data-lucide', position.icon);

    button.appendChild(icon);

    // 点击事件
    button.addEventListener('click', () => {
      this.selectPosition(positionKey);
    });

    return button;
  }

  createLayoutButton(layoutKey, layout) {
    const button = document.createElement('div');
    button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
    button.dataset.layout = layoutKey;
    button.title = `${layout.name} - ${layout.description}`;

    // 图标 - 使用 Lucide 图标
    const icon = document.createElement('i');
    icon.className = 'w-4 h-4';
    icon.setAttribute('data-lucide', layout.icon);

    button.appendChild(icon);

    // 点击事件
    button.addEventListener('click', () => {
      this.selectLayout(layoutKey);
    });

    return button;
  }

  createSettingsDescription(container) {
    const descContainer = document.createElement('div');
    descContainer.className = 'settings-description-container';

    // 当前选择说明
    this.currentSettingsDesc = document.createElement('div');
    this.currentSettingsDesc.className = 'current-settings-desc';
    this.updateSettingsDescription();

    descContainer.appendChild(this.currentSettingsDesc);
    container.appendChild(descContainer);
  }

  updateSettingsDescription() {
    if (!this.currentSettingsDesc) {
      return;
    }

    const position = this.positionTypes[this.currentPosition];
    const layout = this.layoutTypes[this.currentLayout];

    if (position && layout) {
      this.currentSettingsDesc.innerHTML = `
        <div class="settings-desc-row">
          <span class="settings-desc-label">定位:</span>
          <span class="settings-desc-value">${position.name}</span>
        </div>
        <div class="settings-desc-row">
          <span class="settings-desc-label">布局:</span>
          <span class="settings-desc-value">${layout.name}</span>
        </div>
      `;
    }
  }

  /**
   * 选择定位类型
   */
  selectPosition(positionKey) {
    if (this.currentPosition === positionKey) {
      return;
    }

    const prevPosition = this.currentPosition;
    this.currentPosition = positionKey;

    console.log(`[LayoutModeSection] Switching position from ${prevPosition} to ${positionKey}`);

    // 更新UI状态
    this.updatePositionButtons();
    this.updateSettingsDescription();

    // 应用定位类型到当前元素
    if (this.currentElement) {
      console.log(`[LayoutModeSection] Applying ${positionKey} position to element`);
      this.applyPositionToElement(positionKey, prevPosition);
    }

    // 触发定位变更事件
    if (this.onPositionChange) {
      this.onPositionChange(positionKey, prevPosition, this.currentElement);
    }

    // 通知外部系统
    this.dispatchPositionChangeEvent(positionKey, prevPosition);
  }

  /**
   * 选择布局方式
   */
  selectLayout(layoutKey) {
    if (this.currentLayout === layoutKey) {
      return;
    }

    const prevLayout = this.currentLayout;
    this.currentLayout = layoutKey;

    console.log(`[LayoutModeSection] Switching layout from ${prevLayout} to ${layoutKey}`);

    // 更新UI状态
    this.updateLayoutButtons();
    this.updateSettingsDescription();

    // 应用布局方式到当前元素
    if (this.currentElement) {
      console.log(`[LayoutModeSection] Applying ${layoutKey} layout to element`);
      this.applyLayoutToElement(layoutKey, prevLayout);
    }

    // 触发布局变更事件
    if (this.onLayoutChange) {
      this.onLayoutChange(layoutKey, prevLayout, this.currentElement);
    }

    // 通知外部系统
    this.dispatchLayoutChangeEvent(layoutKey, prevLayout);
  }

  updatePositionButtons() {
    const buttons = this.element.querySelectorAll('[data-position]');
    buttons.forEach(button => {
      if (button.dataset.position === this.currentPosition) {
        // 激活状态 - 使用白色背景，黑色图标
        button.className = 'flex items-center justify-center w-8 h-8 rounded bg-white text-black cursor-pointer';
      } else {
        // 非激活状态
        button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
      }
    });
  }

  updateLayoutButtons() {
    const buttons = this.element.querySelectorAll('[data-layout]');
    buttons.forEach(button => {
      if (button.dataset.layout === this.currentLayout) {
        // 激活状态 - 使用白色背景，黑色图标
        button.className = 'flex items-center justify-center w-8 h-8 rounded bg-white text-black cursor-pointer';
      } else {
        // 非激活状态
        button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
      }
    });
  }

  /**
   * 将定位类型应用到元素
   */
  applyPositionToElement(newPosition, prevPosition) {
    if (!this.currentElement) {
      return;
    }

    const element = this.currentElement;

    // 清除前一个定位类型的样式
    this.clearPositionStyles(element, prevPosition);

    // 应用新定位类型的样式
    let appliedClasses = [];
    if (newPosition !== 'static') {
      appliedClasses = [newPosition];
      this.layoutAdapter.applyClasses(element, appliedClasses);
    }

    // 获取应用后的完整class属性值
    const finalClasses = element.className;

    // 同步到 HTML 文件
    this.syncToHTMLFile(element, finalClasses, 'position');

    console.log(`[LayoutModeSection] Position ${newPosition} applied`);
  }

  /**
   * 将布局方式应用到元素
   */
  applyLayoutToElement(newLayout, prevLayout) {
    if (!this.currentElement) {
      return;
    }

    const element = this.currentElement;

    // 清除前一个布局方式的样式
    this.clearLayoutStyles(element, prevLayout);

    // 应用新布局方式的样式
    let appliedClasses = [];
    switch (newLayout) {
      case 'none':
        appliedClasses = ['block'];
        break;
      case 'flex':
        appliedClasses = ['flex'];
        break;
      case 'grid':
        appliedClasses = ['grid'];
        break;
    }

    if (appliedClasses.length > 0) {
      this.layoutAdapter.applyClasses(element, appliedClasses);
    }

    // 获取应用后的完整class属性值
    const finalClasses = element.className;

    // 同步到 HTML 文件
    this.syncToHTMLFile(element, finalClasses, 'layout');

    console.log(`[LayoutModeSection] Layout ${newLayout} applied`);
  }

  clearPositionStyles(element, position) {
    console.log(`[LayoutModeSection] Clearing ${position} position styles from element:`, element);

    // 移除所有定位相关的类名
    const positionClasses = ['static', 'relative', 'absolute', 'fixed', 'sticky'];
    positionClasses.forEach(className => {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    });

    console.log(`[LayoutModeSection] Cleared ${position} position styles`);
  }

  clearLayoutStyles(element, layout) {
    console.log(`[LayoutModeSection] Clearing ${layout} layout styles from element:`, element);

    // 移除所有布局相关的类名
    const layoutClasses = ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid'];
    layoutClasses.forEach(className => {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    });

    console.log(`[LayoutModeSection] Cleared ${layout} layout styles`);
  }

  /**
   * 从元素检测当前定位类型
   */
  detectPositionFromElement(element) {
    if (!element) {
      return 'static';
    }

    // 首先检查 Tailwind 类名
    const classList = Array.from(element.classList);

    // 检测定位类名
    for (const cls of classList) {
      if (['static', 'relative', 'absolute', 'fixed', 'sticky'].includes(cls)) {
        return cls;
      }
    }

    // 回退到计算样式检测
    const style = window.getComputedStyle(element);
    return style.position || 'static';
  }

  /**
   * 从元素检测当前布局方式
   */
  detectLayoutFromElement(element) {
    if (!element) {
      return 'none';
    }

    // 首先检查 Tailwind 类名
    const classList = Array.from(element.classList);

    // 检测 flex 类名
    if (classList.some(cls => ['flex', 'inline-flex'].includes(cls))) {
      return 'flex';
    }

    // 检测 grid 类名
    if (classList.some(cls => ['grid', 'inline-grid'].includes(cls))) {
      return 'grid';
    }

    // 回退到计算样式检测
    const style = window.getComputedStyle(element);

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

    console.log(`[LayoutModeSection] Update called with element:`, element);

    if (element) {
      // 检测元素的当前定位类型和布局方式
      const detectedPosition = this.detectPositionFromElement(element);
      const detectedLayout = this.detectLayoutFromElement(element);

      console.log(`[LayoutModeSection] Detected position: ${detectedPosition}, layout: ${detectedLayout}`);

      let updated = false;

      // 更新定位类型
      if (detectedPosition !== this.currentPosition) {
        this.currentPosition = detectedPosition;
        this.updatePositionButtons();
        updated = true;
      }

      // 更新布局方式
      if (detectedLayout !== this.currentLayout) {
        this.currentLayout = detectedLayout;
        this.updateLayoutButtons();
        updated = true;
      }

      if (updated) {
        this.updateSettingsDescription();
      }
    } else {
      console.log(`[LayoutModeSection] No element provided to update`);
    }
  }

  /**
   * 同步变更到 HTML 文件
   */
  syncToHTMLFile(element, finalClasses, changeType) {
    console.log(`[LayoutModeSection] Syncing ${changeType} change to HTML file`);
    console.log(`[LayoutModeSection] Element:`, element);
    console.log(`[LayoutModeSection] Final classes:`, finalClasses);

    try {
      // 构造 Tailwind 样式变更数据
      const changeData = {
        changes: [{
          element: {
            tagName: element.tagName.toLowerCase(),
            id: element.id || null,
            className: element.className,
            wveId: element.dataset.wveId || null,
            strategies: this.generateSelectorStrategies(element)
          },
          tailwindClasses: finalClasses,
          cssStyles: null // 只使用 Tailwind 类名，不使用内联样式
        }]
      };

      console.log(`[LayoutModeSection] Sending tailwindStyleChange message:`, changeData);

      // 发送到扩展进行同步
      if (typeof vscode !== 'undefined' && vscode.postMessage) {
        vscode.postMessage({
          type: 'tailwindStyleChange',
          data: changeData
        });
        console.log(`[LayoutModeSection] Message sent successfully`);
      } else {
        console.error(`[LayoutModeSection] vscode.postMessage not available`);
      }
    } catch (error) {
      console.error(`[LayoutModeSection] Error syncing to HTML file:`, error);
    }
  }

  /**
   * 生成元素选择器策略
   */
  generateSelectorStrategies(element) {
    const strategies = [];

    // 策略1: 使用 data-wve-id（如果存在）
    if (element.dataset.wveId) {
      strategies.push({
        type: 'wve-id',
        selector: `[data-wve-id="${element.dataset.wveId}"]`
      });
    }

    // 策略2: 使用 ID（如果存在）
    if (element.id) {
      strategies.push({
        type: 'id',
        selector: `#${element.id}`
      });
    }

    // 策略3: 使用标签名 + 类名（简化版，避免过于复杂的选择器）
    if (element.className) {
      const simpleClasses = element.className.trim().split(/\s+/)
        .filter(cls =>
          !cls.startsWith('wve-') && // 排除扩展添加的类
          !cls.includes(':') &&     // 排除包含冒号的Tailwind类
          cls.length < 20           // 排除过长的类名
        );

      if (simpleClasses.length > 0) {
        strategies.push({
          type: 'tag-class',
          selector: `${element.tagName.toLowerCase()}.${simpleClasses[0]}`
        });
      }
    }

    // 策略4: 只使用标签名（最后的回退）
    strategies.push({
      type: 'tag',
      selector: element.tagName.toLowerCase()
    });

    return strategies;
  }

  /**
   * 派发定位变更事件
   */
  dispatchPositionChangeEvent(newPosition, prevPosition) {
    const event = new CustomEvent('wvePositionChange', {
      detail: {
        element: this.currentElement,
        newPosition: newPosition,
        prevPosition: prevPosition,
        positionTypes: this.positionTypes
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 派发布局变更事件
   */
  dispatchLayoutChangeEvent(newLayout, prevLayout) {
    const event = new CustomEvent('wveLayoutChange', {
      detail: {
        element: this.currentElement,
        newLayout: newLayout,
        prevLayout: prevLayout,
        layoutTypes: this.layoutTypes
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 获取当前定位类型
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * 获取当前布局方式
   */
  getCurrentLayout() {
    return this.currentLayout;
  }

  /**
   * 以编程方式设置定位类型
   */
  setPosition(position) {
    if (this.positionTypes[position]) {
      this.selectPosition(position);
    }
  }

  /**
   * 以编程方式设置布局方式
   */
  setLayout(layout) {
    if (this.layoutTypes[layout]) {
      this.selectLayout(layout);
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

      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      .position-selector-container,
      .layout-selector-container {
        margin-bottom: 12px;
      }

      .divider {
        height: 1px;
        background: #404040;
        margin: 16px 0;
      }

      .settings-description-container {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
      }

      .settings-desc-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .settings-desc-row:last-child {
        margin-bottom: 0;
      }

      .settings-desc-label {
        font-size: 10px;
        color: #999999;
      }

      .settings-desc-value {
        font-size: 10px;
        color: #cccccc;
        font-weight: 500;
      }
    `;

    document.head.appendChild(style);
  }
};