/**
 * Appearance 属性区域 - 1:1 复刻 Figma 外观面板
 */
window.WVE = window.WVE || {};
window.WVE.AppearanceSection = class AppearanceSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: 'Appearance',
      collapsed: false,
      className: 'appearance-section',
      actions: [
        {
          icon: 'eye',
          title: '切换可见性',
          onClick: () => this.toggleVisibility()
        },
        {
          icon: 'droplet',
          title: '混合模式',
          onClick: () => this.openBlendModes()
        }
      ],
      ...options
    });

    this.currentElement = null;
    this.opacityControl = null;
    this.cornerRadiusControls = {
      topLeft: null,
      topRight: null,
      bottomRight: null,
      bottomLeft: null,
      uniform: true
    };
    this.fillControls = [];
    this.strokeControls = [];
  }

  /**
   * 创建区域内容
   */
  createContentElements(container) {
    // 透明度和圆角
    this.createBasicsSection(container);

    // 填充 (Fill)
    this.createFillSection(container);

    // 描边 (Stroke)
    this.createStrokeSection(container);
  }

  /**
   * 创建基础设置区域
   */
  createBasicsSection(container) {
    const basicsRow = document.createElement('div');
    basicsRow.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    `;

    // 透明度控制
    const opacityContainer = document.createElement('div');
    const opacityLabel = document.createElement('div');
    opacityLabel.textContent = 'Opacity';
    opacityLabel.style.cssText = `
      font-size: 10px;
      color: #999999;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;

    const opacityControl = this.createOpacityControl();
    opacityContainer.appendChild(opacityLabel);
    opacityContainer.appendChild(opacityControl);

    // 圆角控制
    const cornerContainer = document.createElement('div');
    const cornerLabel = document.createElement('div');
    cornerLabel.textContent = 'Corner radius';
    cornerLabel.style.cssText = `
      font-size: 10px;
      color: #999999;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;

    const cornerControl = this.createCornerRadiusControl();
    cornerContainer.appendChild(cornerLabel);
    cornerContainer.appendChild(cornerControl);

    basicsRow.appendChild(opacityContainer);
    basicsRow.appendChild(cornerContainer);
    container.appendChild(basicsRow);
  }

  /**
   * 创建透明度控制
   */
  createOpacityControl() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // 透明度图标
    const opacityIcon = document.createElement('input');
    opacityIcon.type = 'checkbox';
    opacityIcon.style.cssText = `
      width: 14px;
      height: 14px;
      accent-color: #0078d4;
    `;

    // 透明度输入
    const opacityInput = this.createNumberInput('100', {
      onChange: (value) => this.handleOpacityChange(value),
      suffix: '%',
      width: '50px'
    });

    wrapper.appendChild(opacityIcon);
    wrapper.appendChild(opacityInput);

    this.opacityControl = opacityInput.querySelector('input');
    return wrapper;
  }

  /**
   * 创建圆角控制
   */
  createCornerRadiusControl() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // 圆角图标
    const cornerIcon = this.controls.createIconButton({
      icon: 'corner-up-left',
      title: '圆角',
      size: 16
    });
    cornerIcon.style.background = 'transparent';
    cornerIcon.style.border = 'none';
    cornerIcon.style.cursor = 'default';

    // 圆角输入
    const cornerInput = this.createNumberInput('0', {
      onChange: (value) => this.handleCornerRadiusChange('all', value),
      width: '40px'
    });

    // 独立控制按钮
    const expandButton = this.controls.createIconButton({
      icon: 'expand',
      title: '独立设置各角圆角',
      size: 16,
      onClick: () => this.toggleCornerExpansion()
    });

    wrapper.appendChild(cornerIcon);
    wrapper.appendChild(cornerInput);
    wrapper.appendChild(expandButton);

    this.cornerRadiusControls.uniform = cornerInput.querySelector('input');

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(wrapper);
    }, 0);

    return wrapper;
  }

  /**
   * 创建填充区域
   */
  createFillSection(container) {
    const section = this.createExpandableSection('Fill', container, [
      {
        icon: 'grid-3x3',
        title: '填充样式',
        onClick: () => this.openFillStyles()
      },
      {
        icon: 'plus',
        title: '添加填充',
        onClick: () => this.addFill()
      }
    ]);

    // 默认填充控件
    const defaultFill = this.createFillControl({
      color: '#000000',
      opacity: 100,
      visible: true
    });

    section.appendChild(defaultFill);
    this.fillControls.push(defaultFill);
  }

  /**
   * 创建描边区域
   */
  createStrokeSection(container) {
    const section = this.createExpandableSection('Stroke', container, [
      {
        icon: 'grid-3x3',
        title: '描边样式',
        onClick: () => this.openStrokeStyles()
      },
      {
        icon: 'plus',
        title: '添加描边',
        onClick: () => this.addStroke()
      }
    ]);

    // 默认描边控件
    const defaultStroke = this.createStrokeControl({
      color: '#000000',
      opacity: 100,
      visible: true,
      width: 1,
      position: 'inside'
    });

    section.appendChild(defaultStroke);

    // 描边位置和粗细控制
    const strokeSettings = this.createStrokeSettings();
    section.appendChild(strokeSettings);

    this.strokeControls.push(defaultStroke);
  }

  /**
   * 创建可展开区域
   */
  createExpandableSection(title, container, actions = []) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'subsection-header';
    sectionHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 4px 0;
    `;

    const sectionTitle = document.createElement('div');
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: #ffffff;
    `;

    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = `
      display: flex;
      gap: 4px;
    `;

    actions.forEach(action => {
      const button = this.controls.createIconButton({
        icon: action.icon,
        title: action.title,
        size: 16,
        onClick: action.onClick
      });
      actionsContainer.appendChild(button);
    });

    sectionHeader.appendChild(sectionTitle);
    sectionHeader.appendChild(actionsContainer);

    const sectionContent = document.createElement('div');
    sectionContent.className = 'subsection-content';
    sectionContent.style.cssText = `
      margin-bottom: 16px;
    `;

    container.appendChild(sectionHeader);
    container.appendChild(sectionContent);

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(sectionHeader);
    }, 0);

    return sectionContent;
  }

  /**
   * 创建填充控件
   */
  createFillControl(options = {}) {
    const {
      color = '#000000',
      opacity = 100,
      visible = true
    } = options;

    const control = this.controls.createCompoundControl({
      color,
      percentage: opacity,
      visible,
      onColorChange: (newColor) => this.handleFillColorChange(control, newColor),
      onPercentageChange: (newOpacity) => this.handleFillOpacityChange(control, newOpacity),
      onVisibilityToggle: (newVisible) => this.handleFillVisibilityChange(control, newVisible),
      onDelete: () => this.deleteFill(control)
    });

    return control;
  }

  /**
   * 创建描边控件
   */
  createStrokeControl(options = {}) {
    const {
      color = '#000000',
      opacity = 100,
      visible = true,
      width = 1,
      position = 'inside'
    } = options;

    const control = this.controls.createCompoundControl({
      color,
      percentage: opacity,
      visible,
      onColorChange: (newColor) => this.handleStrokeColorChange(control, newColor),
      onPercentageChange: (newOpacity) => this.handleStrokeOpacityChange(control, newOpacity),
      onVisibilityToggle: (newVisible) => this.handleStrokeVisibilityChange(control, newVisible),
      onDelete: () => this.deleteStroke(control)
    });

    return control;
  }

  /**
   * 创建描边设置
   */
  createStrokeSettings() {
    const settings = document.createElement('div');
    settings.className = 'stroke-settings';
    settings.style.cssText = `
      display: grid;
      grid-template-columns: 1fr auto 1fr auto auto;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
    `;

    // 位置选择
    const positionLabel = document.createElement('div');
    positionLabel.textContent = 'Position';
    positionLabel.style.cssText = `
      font-size: 10px;
      color: #999999;
    `;

    const positionSelect = this.controls.createInputWithDropdown({
      value: 'Inside',
      dropdownOptions: [
        { text: 'Inside', value: 'inside', selected: true },
        { text: 'Center', value: 'center' },
        { text: 'Outside', value: 'outside' }
      ],
      onDropdownSelect: (option) => this.handleStrokePositionChange(option.value),
      width: '80px'
    });

    // 粗细控制
    const weightLabel = document.createElement('div');
    weightLabel.textContent = 'Weight';
    weightLabel.style.cssText = `
      font-size: 10px;
      color: #999999;
    `;

    const weightInput = this.createNumberInput('1', {
      onChange: (value) => this.handleStrokeWeightChange(value),
      width: '40px'
    });

    // 对齐控制
    const alignButton = this.controls.createIconButton({
      icon: 'align-center',
      title: '对齐',
      size: 16,
      onClick: () => this.alignStroke()
    });

    // 更多选项
    const moreButton = this.controls.createIconButton({
      icon: 'more-horizontal',
      title: '更多选项',
      size: 16,
      onClick: () => this.openStrokeOptions()
    });

    settings.appendChild(positionLabel);
    settings.appendChild(positionSelect);
    settings.appendChild(weightLabel);
    settings.appendChild(weightInput);
    settings.appendChild(alignButton);
    settings.appendChild(moreButton);

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(settings);
    }, 0);

    return settings;
  }

  /**
   * 处理透明度变更
   */
  handleOpacityChange(value) {
    if (!this.currentElement) return;

    const opacity = Math.min(100, Math.max(0, parseFloat(value) || 0)) / 100;
    this.currentElement.style.opacity = opacity.toString();

    this.notifyChange('opacity', opacity);
  }

  /**
   * 处理圆角变更
   */
  handleCornerRadiusChange(corner, value) {
    if (!this.currentElement) return;

    const radius = parseFloat(value) || 0;

    if (corner === 'all') {
      this.currentElement.style.borderRadius = `${radius}px`;
    } else {
      // 处理单独角的圆角设置
      const properties = {
        'top-left': 'borderTopLeftRadius',
        'top-right': 'borderTopRightRadius',
        'bottom-right': 'borderBottomRightRadius',
        'bottom-left': 'borderBottomLeftRadius'
      };

      if (properties[corner]) {
        this.currentElement.style[properties[corner]] = `${radius}px`;
      }
    }

    this.notifyChange('borderRadius', { [corner]: `${radius}px` });
  }

  /**
   * 切换圆角独立控制
   */
  toggleCornerExpansion() {
    this.logger.info('Toggle corner expansion');
    // 实现独立圆角控制展开/折叠
  }

  /**
   * 处理填充颜色变更
   */
  handleFillColorChange(control, color) {
    if (!this.currentElement) return;

    this.currentElement.style.backgroundColor = color;
    this.notifyChange('backgroundColor', color);
  }

  /**
   * 处理填充透明度变更
   */
  handleFillOpacityChange(control, opacity) {
    this.logger.info('Fill opacity changed:', opacity);
    // 实现填充透明度变更
  }

  /**
   * 处理填充可见性变更
   */
  handleFillVisibilityChange(control, visible) {
    this.logger.info('Fill visibility changed:', visible);
    // 实现填充可见性切换
  }

  /**
   * 处理描边颜色变更
   */
  handleStrokeColorChange(control, color) {
    if (!this.currentElement) return;

    this.currentElement.style.borderColor = color;
    this.notifyChange('borderColor', color);
  }

  /**
   * 处理描边透明度变更
   */
  handleStrokeOpacityChange(control, opacity) {
    this.logger.info('Stroke opacity changed:', opacity);
    // 实现描边透明度变更
  }

  /**
   * 处理描边可见性变更
   */
  handleStrokeVisibilityChange(control, visible) {
    this.logger.info('Stroke visibility changed:', visible);
    // 实现描边可见性切换
  }

  /**
   * 处理描边位置变更
   */
  handleStrokePositionChange(position) {
    this.logger.info('Stroke position changed:', position);
    this.notifyChange('strokePosition', position);
  }

  /**
   * 处理描边粗细变更
   */
  handleStrokeWeightChange(weight) {
    if (!this.currentElement) return;

    const borderWidth = parseFloat(weight) || 0;
    this.currentElement.style.borderWidth = `${borderWidth}px`;
    this.currentElement.style.borderStyle = borderWidth > 0 ? 'solid' : 'none';

    this.notifyChange('borderWidth', `${borderWidth}px`);
  }

  /**
   * 添加填充
   */
  addFill() {
    const newFill = this.createFillControl();
    const fillSection = this.element.querySelector('.subsection-content');
    if (fillSection) {
      fillSection.appendChild(newFill);
      this.fillControls.push(newFill);
    }
  }

  /**
   * 删除填充
   */
  deleteFill(control) {
    const index = this.fillControls.indexOf(control);
    if (index > -1) {
      this.fillControls.splice(index, 1);
      control.remove();
    }
  }

  /**
   * 添加描边
   */
  addStroke() {
    const newStroke = this.createStrokeControl();
    const strokeSection = this.element.querySelectorAll('.subsection-content')[1];
    if (strokeSection) {
      strokeSection.insertBefore(newStroke, strokeSection.lastElementChild);
      this.strokeControls.push(newStroke);
    }
  }

  /**
   * 删除描边
   */
  deleteStroke(control) {
    const index = this.strokeControls.indexOf(control);
    if (index > -1) {
      this.strokeControls.splice(index, 1);
      control.remove();
    }
  }

  /**
   * 切换可见性
   */
  toggleVisibility() {
    if (!this.currentElement) return;

    const isVisible = this.currentElement.style.visibility !== 'hidden';
    this.currentElement.style.visibility = isVisible ? 'hidden' : 'visible';

    this.notifyChange('visibility', isVisible ? 'hidden' : 'visible');
  }

  /**
   * 打开混合模式
   */
  openBlendModes() {
    this.logger.info('Opening blend modes');
    // 实现混合模式面板
  }

  /**
   * 打开填充样式
   */
  openFillStyles() {
    this.logger.info('Opening fill styles');
    // 实现填充样式库
  }

  /**
   * 打开描边样式
   */
  openStrokeStyles() {
    this.logger.info('Opening stroke styles');
    // 实现描边样式库
  }

  /**
   * 对齐描边
   */
  alignStroke() {
    this.logger.info('Aligning stroke');
    // 实现描边对齐
  }

  /**
   * 打开描边选项
   */
  openStrokeOptions() {
    this.logger.info('Opening stroke options');
    // 实现描边详细选项面板
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

    // 更新透明度
    if (this.opacityControl) {
      const opacity = parseFloat(styles.opacity || '1') * 100;
      this.opacityControl.value = Math.round(opacity).toString();
    }

    // 更新圆角
    if (this.cornerRadiusControls.uniform) {
      const borderRadius = styles.borderRadius || '0px';
      this.cornerRadiusControls.uniform.value = this.formatPixelValue(borderRadius);
    }
  }

  /**
   * 清空所有值
   */
  clearValues() {
    if (this.opacityControl) this.opacityControl.value = '100';
    if (this.cornerRadiusControls.uniform) this.cornerRadiusControls.uniform.value = '0';
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