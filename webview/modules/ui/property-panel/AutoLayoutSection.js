/**
 * Auto Layout 属性区域 - 1:1 复刻 Figma 自动布局面板
 */
window.WVE = window.WVE || {};
window.WVE.AutoLayoutSection = class AutoLayoutSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: 'Auto layout',
      collapsed: false,
      className: 'auto-layout-section',
      actions: [
        {
          icon: 'eye',
          title: '切换可见性',
          onClick: () => this.toggleAutoLayout()
        }
      ],
      ...options
    });

    this.currentElement = null;
    this.autoLayoutEnabled = false;
    this.flowButtons = null;
    this.dimensionInputs = {
      width: null,
      height: null
    };
    this.alignmentGrid = null;
    this.gapInput = null;
    this.paddingInputs = {
      top: null,
      right: null,
      bottom: null,
      left: null
    };
  }

  /**
   * 创建区域内容
   */
  createContentElements(container) {
    // Flow 控制
    this.createFlowSection(container);

    // 尺寸控制
    this.createDimensionsSection(container);

    // 对齐控制
    this.createAlignmentSection(container);

    // 间距控制
    this.createPaddingSection(container);

    // Clip content 选项
    this.createClipContentSection(container);
  }

  /**
   * 创建 Flow 控制区域
   */
  createFlowSection(container) {
    const group = this.createGroup('Flow');

    // Flow 方向按钮组
    const flowButtons = [
      { icon: 'square-dashed-bottom-code', title: '垂直堆叠', action: 'vertical' },
      { icon: 'square-dashed-bottom-code', title: '水平堆叠', action: 'horizontal' },
      { icon: 'wrap-text', title: '环绕', action: 'wrap' },
      { icon: 'grid-3x3', title: '网格', action: 'grid' }
    ];

    const { group: buttonGroup } = this.controls.createButtonGroup(
      flowButtons.map(button => ({
        ...button,
        size: 28,
        onClick: (e, index) => this.handleFlowDirection(button.action)
      })),
      { multiSelect: false, gap: 2 }
    );

    group.appendChild(buttonGroup);
    container.appendChild(group);

    this.flowButtons = buttonGroup;
  }

  /**
   * 创建尺寸控制区域
   */
  createDimensionsSection(container) {
    const group = this.createGroup('Dimensions');

    // 宽度和高度输入，带下拉菜单
    const widthControl = this.controls.createLabelControl(
      'W',
      this.controls.createInputWithDropdown({
        value: 'Auto',
        dropdownOptions: [
          { icon: '✓', text: 'Fixed width (240)', value: 'fixed', selected: true },
          { icon: '✗', text: 'Hug contents', value: 'hug' },
          { type: 'divider' },
          { icon: '→←', text: 'Add min width...', value: 'min-width' },
          { icon: '←→', text: 'Add max width...', value: 'max-width' },
          { type: 'divider' },
          { icon: '⚪', text: 'Apply variable...', value: 'variable' }
        ],
        onValueChange: (value) => this.handleDimensionChange('width', value),
        onDropdownSelect: (option) => this.handleDimensionMode('width', option.value),
        width: '90px'
      }),
      { labelWidth: '12px' }
    );

    const heightControl = this.controls.createLabelControl(
      'H',
      this.controls.createInputWithDropdown({
        value: 'Auto',
        dropdownOptions: [
          { icon: '✓', text: 'Fixed height (120)', value: 'fixed', selected: true },
          { icon: '✗', text: 'Hug contents', value: 'hug' },
          { type: 'divider' },
          { icon: '↑↓', text: 'Add min height...', value: 'min-height' },
          { icon: '↓↑', text: 'Add max height...', value: 'max-height' },
          { type: 'divider' },
          { icon: '⚪', text: 'Apply variable...', value: 'variable' }
        ],
        onValueChange: (value) => this.handleDimensionChange('height', value),
        onDropdownSelect: (option) => this.handleDimensionMode('height', option.value),
        width: '90px'
      }),
      { labelWidth: '12px' }
    );

    // 链接按钮（比例锁定）
    const linkButton = this.controls.createIconButton({
      icon: 'link',
      title: '锁定长宽比',
      size: 20,
      onClick: () => this.toggleAspectRatioLock()
    });

    // 尺寸行布局
    const dimensionsRow = document.createElement('div');
    dimensionsRow.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr 24px;
      gap: 8px;
      align-items: center;
    `;

    dimensionsRow.appendChild(widthControl);
    dimensionsRow.appendChild(heightControl);
    dimensionsRow.appendChild(linkButton);

    group.appendChild(dimensionsRow);
    container.appendChild(group);

    this.dimensionInputs.width = widthControl.querySelector('input');
    this.dimensionInputs.height = heightControl.querySelector('input');

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(group);
    }, 0);
  }

  /**
   * 创建对齐控制区域
   */
  createAlignmentSection(container) {
    const group = this.createGroup();

    const sectionRow = document.createElement('div');
    sectionRow.style.cssText = `
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 12px;
      align-items: center;
      margin-bottom: 8px;
    `;

    // 左侧：对齐控制
    const alignmentContainer = document.createElement('div');
    const alignmentLabel = document.createElement('div');
    alignmentLabel.textContent = 'Alignment';
    alignmentLabel.style.cssText = `
      font-size: 10px;
      color: #999999;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;

    // 对齐网格 - 3x3 布局
    const alignmentGrid = this.createAlignmentGrid();
    alignmentContainer.appendChild(alignmentLabel);
    alignmentContainer.appendChild(alignmentGrid);

    // 中间：分隔
    const separator = document.createElement('div');
    separator.style.cssText = `
      width: 1px;
      height: 40px;
      background: #404040;
    `;

    // 右侧：间距控制
    const gapContainer = document.createElement('div');
    const gapLabel = document.createElement('div');
    gapLabel.textContent = 'Gap';
    gapLabel.style.cssText = `
      font-size: 10px;
      color: #999999;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;

    const gapControl = this.createGapControl();
    gapContainer.appendChild(gapLabel);
    gapContainer.appendChild(gapControl);

    sectionRow.appendChild(alignmentContainer);
    sectionRow.appendChild(separator);
    sectionRow.appendChild(gapContainer);

    group.appendChild(sectionRow);
    container.appendChild(group);

    this.alignmentGrid = alignmentGrid;
  }

  /**
   * 创建对齐网格
   */
  createAlignmentGrid() {
    const grid = document.createElement('div');
    grid.className = 'alignment-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 16px);
      grid-template-rows: repeat(3, 16px);
      gap: 2px;
    `;

    // 9个对齐点
    const alignments = [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'middle-center', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ];

    alignments.forEach((alignment, index) => {
      const dot = document.createElement('div');
      dot.className = `alignment-dot alignment-${alignment}`;
      dot.style.cssText = `
        width: 16px;
        height: 16px;
        background: #404040;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      `;

      const innerDot = document.createElement('div');
      innerDot.style.cssText = `
        width: 4px;
        height: 4px;
        background: #ffffff;
        border-radius: 50%;
      `;

      dot.appendChild(innerDot);

      dot.addEventListener('click', () => {
        // 清除其他选中状态
        grid.querySelectorAll('.alignment-dot').forEach(d => {
          d.style.backgroundColor = '#404040';
        });
        // 设置当前选中
        dot.style.backgroundColor = '#0078d4';
        this.handleAlignmentChange(alignment);
      });

      grid.appendChild(dot);
    });

    return grid;
  }

  /**
   * 创建间距控制
   */
  createGapControl() {
    const gapRow = document.createElement('div');
    gapRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // 间距图标
    const gapIcon = this.controls.createIconButton({
      icon: 'space-between-horizontal',
      title: '间距',
      size: 16
    });
    gapIcon.style.background = 'transparent';
    gapIcon.style.border = 'none';
    gapIcon.style.cursor = 'default';

    // 间距输入
    const gapInput = this.createNumberInput('0', {
      onChange: (value) => this.handleGapChange(value),
      width: '40px'
    });

    // 间距控制按钮
    const gapControls = this.controls.createIconButton({
      icon: 'sliders-horizontal',
      title: '间距设置',
      size: 16,
      onClick: () => this.openGapSettings()
    });

    gapRow.appendChild(gapIcon);
    gapRow.appendChild(gapInput);
    gapRow.appendChild(gapControls);

    this.gapInput = gapInput.querySelector('input');

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(gapRow);
    }, 0);

    return gapRow;
  }

  /**
   * 创建 Padding 控制区域
   */
  createPaddingSection(container) {
    const group = this.createGroup('Padding');

    // Padding 可视化控件
    const paddingWidget = this.createPaddingWidget();
    group.appendChild(paddingWidget);

    container.appendChild(group);
  }

  /**
   * 创建 Padding 可视化控件
   */
  createPaddingWidget() {
    const widget = document.createElement('div');
    widget.className = 'padding-widget';
    widget.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      height: 60px;
      background: #1e1e1e;
      border: 1px solid #404040;
      border-radius: 4px;
      margin-bottom: 8px;
    `;

    // 中心矩形
    const innerRect = document.createElement('div');
    innerRect.style.cssText = `
      width: 40px;
      height: 24px;
      background: #666666;
      border-radius: 2px;
    `;

    // Padding 输入框 - 四个方向
    const positions = [
      { name: 'top', x: '50%', y: '8px', transform: 'translateX(-50%)' },
      { name: 'right', x: 'calc(100% - 28px)', y: '50%', transform: 'translateY(-50%)' },
      { name: 'bottom', x: '50%', y: 'calc(100% - 28px)', transform: 'translateX(-50%)' },
      { name: 'left', x: '8px', y: '50%', transform: 'translateY(-50%)' }
    ];

    positions.forEach(pos => {
      const input = this.controls.createInput({
        type: 'number',
        value: '0',
        min: 0,
        onChange: (value) => this.handlePaddingChange(pos.name, value)
      });

      input.style.cssText += `
        position: absolute;
        top: ${pos.y};
        left: ${pos.x};
        transform: ${pos.transform};
        width: 36px;
        height: 20px;
        font-size: 10px;
        text-align: center;
        padding: 0 4px;
      `;

      widget.appendChild(input);
      this.paddingInputs[pos.name] = input;
    });

    // 链接按钮（中心）
    const linkButton = this.controls.createIconButton({
      icon: 'link',
      title: '统一设置所有边距',
      size: 12,
      onClick: () => this.togglePaddingLink()
    });

    linkButton.style.cssText += `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #404040;
    `;

    widget.appendChild(innerRect);
    widget.appendChild(linkButton);

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(widget);
    }, 0);

    return widget;
  }

  /**
   * 创建 Clip Content 选项
   */
  createClipContentSection(container) {
    const clipContainer = document.createElement('div');
    clipContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'clip-content';
    checkbox.style.cssText = `
      width: 14px;
      height: 14px;
      accent-color: #0078d4;
    `;

    const label = document.createElement('label');
    label.htmlFor = 'clip-content';
    label.textContent = 'Clip content';
    label.style.cssText = `
      font-size: 11px;
      color: #ffffff;
      cursor: pointer;
      user-select: none;
    `;

    checkbox.addEventListener('change', () => {
      this.handleClipContentChange(checkbox.checked);
    });

    clipContainer.appendChild(checkbox);
    clipContainer.appendChild(label);
    container.appendChild(clipContainer);
  }

  /**
   * 切换自动布局
   */
  toggleAutoLayout() {
    this.autoLayoutEnabled = !this.autoLayoutEnabled;
    this.logger.info('Auto layout toggled:', this.autoLayoutEnabled);

    // 更新显示状态
    this.element.classList.toggle('auto-layout-enabled', this.autoLayoutEnabled);

    if (this.currentElement) {
      if (this.autoLayoutEnabled) {
        this.currentElement.style.display = 'flex';
      } else {
        this.currentElement.style.display = '';
      }
    }

    this.notifyChange('autoLayout', this.autoLayoutEnabled);
  }

  /**
   * 处理流向变更
   */
  handleFlowDirection(direction) {
    if (!this.currentElement) return;

    this.logger.info('Flow direction changed:', direction);

    switch (direction) {
      case 'vertical':
        this.currentElement.style.flexDirection = 'column';
        break;
      case 'horizontal':
        this.currentElement.style.flexDirection = 'row';
        break;
      case 'wrap':
        this.currentElement.style.flexWrap = 'wrap';
        break;
    }

    this.notifyChange('flowDirection', direction);
  }

  /**
   * 处理尺寸变更
   */
  handleDimensionChange(dimension, value) {
    if (!this.currentElement) return;

    const numValue = parseFloat(value) || 0;
    this.currentElement.style[dimension] = `${numValue}px`;

    this.notifyChange('dimension', { [dimension]: `${numValue}px` });
  }

  /**
   * 处理尺寸模式变更
   */
  handleDimensionMode(dimension, mode) {
    this.logger.info('Dimension mode changed:', dimension, mode);

    if (!this.currentElement) return;

    switch (mode) {
      case 'hug':
        if (dimension === 'width') {
          this.currentElement.style.width = 'fit-content';
        } else {
          this.currentElement.style.height = 'fit-content';
        }
        break;
      case 'fixed':
        // 保持当前固定值
        break;
    }

    this.notifyChange('dimensionMode', { [dimension]: mode });
  }

  /**
   * 切换长宽比锁定
   */
  toggleAspectRatioLock() {
    this.logger.info('Aspect ratio lock toggled');
    // 实现长宽比锁定逻辑
  }

  /**
   * 处理对齐变更
   */
  handleAlignmentChange(alignment) {
    if (!this.currentElement) return;

    this.logger.info('Alignment changed:', alignment);

    // 解析对齐方式
    const [vertical, horizontal] = alignment.split('-');

    // 设置 justify-content
    switch (horizontal) {
      case 'left':
        this.currentElement.style.justifyContent = 'flex-start';
        break;
      case 'center':
        this.currentElement.style.justifyContent = 'center';
        break;
      case 'right':
        this.currentElement.style.justifyContent = 'flex-end';
        break;
    }

    // 设置 align-items
    switch (vertical) {
      case 'top':
        this.currentElement.style.alignItems = 'flex-start';
        break;
      case 'middle':
        this.currentElement.style.alignItems = 'center';
        break;
      case 'bottom':
        this.currentElement.style.alignItems = 'flex-end';
        break;
    }

    this.notifyChange('alignment', alignment);
  }

  /**
   * 处理间距变更
   */
  handleGapChange(value) {
    if (!this.currentElement) return;

    const gap = parseFloat(value) || 0;
    this.currentElement.style.gap = `${gap}px`;

    this.notifyChange('gap', `${gap}px`);
  }

  /**
   * 处理内边距变更
   */
  handlePaddingChange(side, value) {
    if (!this.currentElement) return;

    const padding = parseFloat(value) || 0;
    this.currentElement.style[`padding${side.charAt(0).toUpperCase() + side.slice(1)}`] = `${padding}px`;

    this.notifyChange('padding', { [side]: `${padding}px` });
  }

  /**
   * 切换内边距链接
   */
  togglePaddingLink() {
    this.logger.info('Padding link toggled');
    // 实现统一设置内边距逻辑
  }

  /**
   * 处理内容剪裁变更
   */
  handleClipContentChange(enabled) {
    if (!this.currentElement) return;

    this.currentElement.style.overflow = enabled ? 'hidden' : 'visible';
    this.notifyChange('clipContent', enabled);
  }

  /**
   * 打开间距设置
   */
  openGapSettings() {
    this.logger.info('Opening gap settings');
    // 实现间距详细设置面板
  }

  /**
   * 更新区域内容
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    if (!element) {
      this.clearValues();
      return;
    }

    const styles = this.getElementStyles(element);
    const rect = element.getBoundingClientRect();

    // 检测是否启用了自动布局
    this.autoLayoutEnabled = styles.display === 'flex' || styles.display === 'inline-flex';
    this.element.classList.toggle('auto-layout-enabled', this.autoLayoutEnabled);

    // 更新尺寸值
    if (this.dimensionInputs.width) {
      this.dimensionInputs.width.value = this.formatPixelValue(rect.width);
    }
    if (this.dimensionInputs.height) {
      this.dimensionInputs.height.value = this.formatPixelValue(rect.height);
    }

    // 更新间距值
    if (this.gapInput) {
      this.gapInput.value = this.formatPixelValue(styles.gap || '0');
    }

    // 更新内边距值
    ['top', 'right', 'bottom', 'left'].forEach(side => {
      if (this.paddingInputs[side]) {
        const paddingValue = styles.getPropertyValue(`padding-${side}`);
        this.paddingInputs[side].value = this.formatPixelValue(paddingValue);
      }
    });
  }

  /**
   * 清空所有值
   */
  clearValues() {
    if (this.dimensionInputs.width) this.dimensionInputs.width.value = '0';
    if (this.dimensionInputs.height) this.dimensionInputs.height.value = '0';
    if (this.gapInput) this.gapInput.value = '0';

    Object.values(this.paddingInputs).forEach(input => {
      if (input) input.value = '0';
    });
  }

  /**
   * 通知变更
   */
  notifyChange(type, value) {
    const event = new CustomEvent('wveStyleChange', {
      detail: {
        element: this.currentElement,
        property: type,
        value: value
      }
    });
    document.dispatchEvent(event);
  }
};