/**
 * 响应式布局模式属性区域 (Flexbox)
 * 对应新设计中的"响应式布局 (Flexbox)"模式
 */
window.WVE = window.WVE || {};
window.WVE.FlexLayoutSection = class FlexLayoutSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '↔️ 响应式布局 (Flexbox)',
      collapsed: false,
      className: 'flex-layout-section',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 容器设置
    this.createContainerSection(container);

    // 对齐设置
    this.createAlignmentSection(container);

    // 间距设置
    this.createGapSection(container);

    // 内外边距设置
    this.createSpacingSection(container);

    // 子元素控制（如果当前元素在flex容器中）
    this.createFlexItemSection(container);

    this.injectStyles();
  }

  createContainerSection(container) {
    const section = document.createElement('div');
    section.className = 'flex-container-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '容器设置';

    const containerPanel = document.createElement('div');
    containerPanel.className = 'container-panel';

    // 方向设置
    const directionGroup = this.createDirectionGroup();

    // 换行设置
    const wrapGroup = this.createWrapGroup();

    containerPanel.appendChild(directionGroup);
    containerPanel.appendChild(wrapGroup);

    section.appendChild(title);
    section.appendChild(containerPanel);
    container.appendChild(section);
  }

  createDirectionGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '方向 Direction';

    const radioContainer = document.createElement('div');
    radioContainer.className = 'radio-grid';

    const directions = [
      { value: 'row', label: '水平 (row)' },
      { value: 'row-reverse', label: '水平反向 (row-r)' },
      { value: 'column', label: '垂直 (column)' },
      { value: 'column-reverse', label: '垂直反向 (col-r)' }
    ];

    directions.forEach(dir => {
      const radio = this.createRadioOption(dir.value, dir.label, 'flex-direction');
      radioContainer.appendChild(radio);
    });

    this.controls.directionGroup = radioContainer;

    group.appendChild(label);
    group.appendChild(radioContainer);

    return group;
  }

  createWrapGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '换行 Wrap';

    const radioContainer = document.createElement('div');
    radioContainer.className = 'radio-grid';

    const wrapOptions = [
      { value: 'nowrap', label: '不换行 (nowrap)' },
      { value: 'wrap', label: '换行 (wrap)' },
      { value: 'wrap-reverse', label: '反向换行 (wrap-reverse)' }
    ];

    wrapOptions.forEach(wrap => {
      const radio = this.createRadioOption(wrap.value, wrap.label, 'flex-wrap');
      radioContainer.appendChild(radio);
    });

    this.controls.wrapGroup = radioContainer;

    group.appendChild(label);
    group.appendChild(radioContainer);

    return group;
  }

  createAlignmentSection(container) {
    const section = document.createElement('div');
    section.className = 'flex-alignment-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '对齐设置';

    const alignmentPanel = document.createElement('div');
    alignmentPanel.className = 'alignment-panel';

    // 主轴对齐
    const justifyGroup = this.createJustifyContentGroup();

    // 交叉轴对齐
    const alignItemsGroup = this.createAlignItemsGroup();

    // 内容对齐（多行时）
    const alignContentGroup = this.createAlignContentGroup();

    alignmentPanel.appendChild(justifyGroup);
    alignmentPanel.appendChild(alignItemsGroup);
    alignmentPanel.appendChild(alignContentGroup);

    section.appendChild(title);
    section.appendChild(alignmentPanel);
    container.appendChild(section);
  }

  createJustifyContentGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '主轴对齐 (justify-content)';

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'icon-button-group';

    const justifyOptions = [
      { value: 'flex-start', icon: '≡', label: '起始' },
      { value: 'center', icon: '⊞', label: '居中' },
      { value: 'flex-end', icon: '≣', label: '末尾' },
      { value: 'space-between', icon: '↔', label: '间距' },
      { value: 'space-around', icon: '≋', label: '环绕' },
      { value: 'space-evenly', icon: '≈', label: '均匀' }
    ];

    justifyOptions.forEach(option => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: option.icon,
        tooltip: option.label,
        onClick: () => this.setJustifyContent(option.value)
      });
      button.dataset.value = option.value;
      buttonGroup.appendChild(button);
    });

    this.controls.justifyGroup = buttonGroup;

    group.appendChild(label);
    group.appendChild(buttonGroup);

    return group;
  }

  createAlignItemsGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '交叉轴对齐 (align-items)';

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'icon-button-group';

    const alignOptions = [
      { value: 'flex-start', icon: '⬆', label: '起始' },
      { value: 'center', icon: '⊞', label: '居中' },
      { value: 'flex-end', icon: '⬇', label: '末尾' },
      { value: 'stretch', icon: '↕', label: '拉伸' },
      { value: 'baseline', icon: '〰', label: '基线' }
    ];

    alignOptions.forEach(option => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: option.icon,
        tooltip: option.label,
        onClick: () => this.setAlignItems(option.value)
      });
      button.dataset.value = option.value;
      buttonGroup.appendChild(button);
    });

    this.controls.alignItemsGroup = buttonGroup;

    group.appendChild(label);
    group.appendChild(buttonGroup);

    return group;
  }

  createAlignContentGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '内容对齐 (align-content) - 多行时';

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'icon-button-group';

    const contentOptions = [
      { value: 'flex-start', icon: '≡', label: '起始' },
      { value: 'center', icon: '⊞', label: '居中' },
      { value: 'flex-end', icon: '≣', label: '末尾' },
      { value: 'space-between', icon: '↔', label: '间距' },
      { value: 'space-around', icon: '≋', label: '环绕' },
      { value: 'stretch', icon: '↕', label: '拉伸' }
    ];

    contentOptions.forEach(option => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: option.icon,
        tooltip: option.label,
        onClick: () => this.setAlignContent(option.value)
      });
      button.dataset.value = option.value;
      buttonGroup.appendChild(button);
    });

    this.controls.alignContentGroup = buttonGroup;

    group.appendChild(label);
    group.appendChild(buttonGroup);

    return group;
  }

  createGapSection(container) {
    const section = document.createElement('div');
    section.className = 'flex-gap-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '间距设置';

    const gapPanel = document.createElement('div');
    gapPanel.className = 'gap-panel';

    const gapLabel = document.createElement('div');
    gapLabel.className = 'control-label';
    gapLabel.textContent = '子元素间距 Gap';

    const gapControls = document.createElement('div');
    gapControls.className = 'gap-controls';

    // X轴间距
    const xGapGroup = document.createElement('div');
    xGapGroup.className = 'input-with-label';

    const xLabel = document.createElement('span');
    xLabel.textContent = 'X轴:';

    const xInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'gap-input',
      onChange: (value) => this.updateGap('column', value)
    });

    const xUnit = document.createElement('span');
    xUnit.textContent = 'px';
    xUnit.className = 'unit-label';

    xGapGroup.appendChild(xLabel);
    xGapGroup.appendChild(xInput);
    xGapGroup.appendChild(xUnit);

    // Y轴间距
    const yGapGroup = document.createElement('div');
    yGapGroup.className = 'input-with-label';

    const yLabel = document.createElement('span');
    yLabel.textContent = 'Y轴:';

    const yInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'gap-input',
      onChange: (value) => this.updateGap('row', value)
    });

    const yUnit = document.createElement('span');
    yUnit.textContent = 'px';
    yUnit.className = 'unit-label';

    yGapGroup.appendChild(yLabel);
    yGapGroup.appendChild(yInput);
    yGapGroup.appendChild(yUnit);

    // 链接按钮
    const linkBtn = window.WVE.PropertyControls.createIconButton({
      icon: '🔗',
      size: 'small',
      toggle: true,
      onClick: (active) => this.toggleGapLink(active)
    });

    this.controls.gapXInput = xInput;
    this.controls.gapYInput = yInput;
    this.controls.gapLinkBtn = linkBtn;

    gapControls.appendChild(xGapGroup);
    gapControls.appendChild(yGapGroup);
    gapControls.appendChild(linkBtn);

    gapPanel.appendChild(gapLabel);
    gapPanel.appendChild(gapControls);

    section.appendChild(title);
    section.appendChild(gapPanel);
    container.appendChild(section);
  }

  createSpacingSection(container) {
    const section = document.createElement('div');
    section.className = 'flex-spacing-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '内外边距';

    const spacingPanel = document.createElement('div');
    spacingPanel.className = 'spacing-panel';

    // 外边距控制
    const marginControl = this.createSpacingControl('Margin', 'margin');
    this.controls.marginControl = marginControl;

    // 内边距控制
    const paddingControl = this.createSpacingControl('Padding', 'padding');
    this.controls.paddingControl = paddingControl;

    spacingPanel.appendChild(marginControl);
    spacingPanel.appendChild(paddingControl);

    section.appendChild(title);
    section.appendChild(spacingPanel);
    container.appendChild(section);
  }

  createSpacingControl(label, type) {
    const container = document.createElement('div');
    container.className = 'spacing-control-container';

    const controlRow = document.createElement('div');
    controlRow.className = 'spacing-control-row';

    // 标签
    const labelEl = document.createElement('span');
    labelEl.className = 'control-label-inline';
    labelEl.textContent = label;

    // X轴输入
    const xInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'spacing-input',
      onChange: (value) => this.updateSpacing(type, 'x', value)
    });

    // Y轴输入
    const yInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'spacing-input',
      onChange: (value) => this.updateSpacing(type, 'y', value)
    });

    // 详细设置按钮
    const detailBtn = window.WVE.PropertyControls.createIconButton({
      icon: '📐',
      size: 'small',
      onClick: () => this.showDetailSpacing(type)
    });

    // 链接按钮
    const linkBtn = window.WVE.PropertyControls.createIconButton({
      icon: '🔗',
      size: 'small',
      toggle: true,
      onClick: (active) => this.toggleSpacingLink(type, active)
    });

    controlRow.appendChild(labelEl);

    const inputGroup = document.createElement('div');
    inputGroup.className = 'spacing-input-group';

    const xGroup = document.createElement('div');
    xGroup.className = 'input-with-label';
    const xLabel = document.createElement('span');
    xLabel.textContent = 'X:';
    xGroup.appendChild(xLabel);
    xGroup.appendChild(xInput);

    const yGroup = document.createElement('div');
    yGroup.className = 'input-with-label';
    const yLabel = document.createElement('span');
    yLabel.textContent = 'Y:';
    yGroup.appendChild(yLabel);
    yGroup.appendChild(yInput);

    inputGroup.appendChild(xGroup);
    inputGroup.appendChild(yGroup);
    inputGroup.appendChild(detailBtn);
    inputGroup.appendChild(linkBtn);

    controlRow.appendChild(inputGroup);
    container.appendChild(controlRow);

    // 存储控件引用
    container.xInput = xInput;
    container.yInput = yInput;
    container.linkBtn = linkBtn;

    return container;
  }

  createFlexItemSection(container) {
    const section = document.createElement('div');
    section.className = 'flex-item-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '子元素控制 (当前选中元素在flex容器中)';

    const itemPanel = document.createElement('div');
    itemPanel.className = 'flex-item-panel';

    // 自身对齐
    const alignSelfGroup = this.createAlignSelfGroup();

    // 弹性设置
    const flexGroup = this.createFlexGroup();

    // 顺序
    const orderGroup = this.createOrderGroup();

    itemPanel.appendChild(alignSelfGroup);
    itemPanel.appendChild(flexGroup);
    itemPanel.appendChild(orderGroup);

    section.appendChild(title);
    section.appendChild(itemPanel);
    container.appendChild(section);

    this.controls.flexItemSection = section;
  }

  createAlignSelfGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '自身对齐 (align-self)';

    const radioContainer = document.createElement('div');
    radioContainer.className = 'radio-inline-group';

    const alignOptions = [
      { value: 'auto', label: '自动' },
      { value: 'flex-start', label: '起始' },
      { value: 'center', label: '居中' },
      { value: 'flex-end', label: '末尾' },
      { value: 'stretch', label: '拉伸' }
    ];

    alignOptions.forEach(option => {
      const radio = this.createRadioOption(option.value, option.label, 'align-self');
      radioContainer.appendChild(radio);
    });

    this.controls.alignSelfGroup = radioContainer;

    group.appendChild(label);
    group.appendChild(radioContainer);

    return group;
  }

  createFlexGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '弹性设置 (flex)';

    const flexControls = document.createElement('div');
    flexControls.className = 'flex-controls';

    // 增长
    const growGroup = document.createElement('div');
    growGroup.className = 'input-with-label';
    const growLabel = document.createElement('span');
    growLabel.textContent = '增长:';
    const growInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '0',
      min: '0',
      className: 'flex-input',
      onChange: (value) => this.updateFlexProperty('flex-grow', value)
    });
    growGroup.appendChild(growLabel);
    growGroup.appendChild(growInput);

    // 收缩
    const shrinkGroup = document.createElement('div');
    shrinkGroup.className = 'input-with-label';
    const shrinkLabel = document.createElement('span');
    shrinkLabel.textContent = '收缩:';
    const shrinkInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '1',
      min: '0',
      className: 'flex-input',
      onChange: (value) => this.updateFlexProperty('flex-shrink', value)
    });
    shrinkGroup.appendChild(shrinkLabel);
    shrinkGroup.appendChild(shrinkInput);

    // 基准
    const basisGroup = document.createElement('div');
    basisGroup.className = 'input-with-label';
    const basisLabel = document.createElement('span');
    basisLabel.textContent = '基准:';
    const basisInput = window.WVE.PropertyControls.createInput({
      type: 'text',
      value: 'auto',
      className: 'flex-input',
      onChange: (value) => this.updateFlexProperty('flex-basis', value)
    });
    basisGroup.appendChild(basisLabel);
    basisGroup.appendChild(basisInput);

    flexControls.appendChild(growGroup);
    flexControls.appendChild(shrinkGroup);
    flexControls.appendChild(basisGroup);

    // 快捷设置
    const quickButtons = document.createElement('div');
    quickButtons.className = 'flex-quick-buttons';

    const quickOptions = [
      { label: '固定', flex: '0 0 auto' },
      { label: '填充', flex: '1 1 0%' },
      { label: '自适应', flex: '1 1 auto' }
    ];

    quickOptions.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.label;
      button.className = 'quick-button';
      button.onclick = () => this.setFlexQuick(option.flex);
      quickButtons.appendChild(button);
    });

    this.controls.flexGrowInput = growInput;
    this.controls.flexShrinkInput = shrinkInput;
    this.controls.flexBasisInput = basisInput;

    group.appendChild(label);
    group.appendChild(flexControls);
    group.appendChild(quickButtons);

    return group;
  }

  createOrderGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '顺序 (order)';

    const orderControls = document.createElement('div');
    orderControls.className = 'order-controls';

    const orderInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '0',
      className: 'order-input',
      onChange: (value) => this.updateOrder(value)
    });

    const leftBtn = window.WVE.PropertyControls.createIconButton({
      icon: '⬅',
      size: 'small',
      onClick: () => this.adjustOrder(-1)
    });

    const rightBtn = window.WVE.PropertyControls.createIconButton({
      icon: '➡',
      size: 'small',
      onClick: () => this.adjustOrder(1)
    });

    this.controls.orderInput = orderInput;

    orderControls.appendChild(orderInput);
    orderControls.appendChild(leftBtn);
    orderControls.appendChild(rightBtn);

    group.appendChild(label);
    group.appendChild(orderControls);

    return group;
  }

  createRadioOption(value, label, name) {
    const container = document.createElement('div');
    container.className = 'radio-option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = name;
    radio.value = value;
    radio.id = `${name}-${value}`;

    const labelEl = document.createElement('label');
    labelEl.htmlFor = radio.id;
    labelEl.textContent = label;

    radio.addEventListener('change', () => {
      if (radio.checked) {
        this.setFlexProperty(name, value);
      }
    });

    container.appendChild(radio);
    container.appendChild(labelEl);

    return container;
  }

  /**
   * 设置flex属性
   */
  setFlexProperty(property, value) {
    if (!this.currentElement) return;

    // 确保元素是flex容器
    if (property === 'flex-direction' || property === 'flex-wrap') {
      if (this.currentElement.style.display !== 'flex') {
        this.currentElement.style.display = 'flex';
      }
    }

    this.currentElement.style[property] = value;
    this.notifyChange(property, value);
  }

  /**
   * 设置主轴对齐
   */
  setJustifyContent(value) {
    this.setFlexProperty('justify-content', value);
    this.updateButtonGroup(this.controls.justifyGroup, value);
  }

  /**
   * 设置交叉轴对齐
   */
  setAlignItems(value) {
    this.setFlexProperty('align-items', value);
    this.updateButtonGroup(this.controls.alignItemsGroup, value);
  }

  /**
   * 设置内容对齐
   */
  setAlignContent(value) {
    this.setFlexProperty('align-content', value);
    this.updateButtonGroup(this.controls.alignContentGroup, value);
  }

  updateButtonGroup(group, activeValue) {
    const buttons = group.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.dataset.value === activeValue) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * 更新间距
   */
  updateGap(axis, value) {
    if (!this.currentElement) return;

    const numValue = parseInt(value) || 0;
    const unit = 'px';

    // 使用gap属性（现代浏览器支持）
    const currentGap = this.parseGap(this.currentElement.style.gap);

    if (axis === 'row') {
      currentGap.row = numValue + unit;
    } else {
      currentGap.column = numValue + unit;
    }

    const newGap = `${currentGap.row} ${currentGap.column}`;
    this.currentElement.style.gap = newGap;

    // 如果链接是激活的，同步另一个轴
    if (this.controls.gapLinkBtn.classList.contains('active')) {
      const otherInput = axis === 'row' ? this.controls.gapXInput : this.controls.gapYInput;
      otherInput.value = value;
      this.updateGap(axis === 'row' ? 'column' : 'row', value);
    }

    this.notifyChange('gap', newGap);
  }

  parseGap(gapValue) {
    if (!gapValue) return { row: '0px', column: '0px' };

    const parts = gapValue.split(' ');
    if (parts.length === 1) {
      return { row: parts[0], column: parts[0] };
    } else {
      return { row: parts[0], column: parts[1] };
    }
  }

  /**
   * 切换间距链接
   */
  toggleGapLink(active) {
    if (active) {
      const xValue = this.controls.gapXInput.value;
      if (xValue) {
        this.controls.gapYInput.value = xValue;
        this.updateGap('row', xValue);
      }
    }
  }

  /**
   * 更新间距（外边距/内边距）
   */
  updateSpacing(type, axis, value) {
    if (!this.currentElement) return;

    const numValue = parseInt(value) || 0;
    const unit = 'px';

    if (type === 'margin') {
      if (axis === 'x') {
        this.currentElement.style.marginLeft = numValue + unit;
        this.currentElement.style.marginRight = numValue + unit;
      } else {
        this.currentElement.style.marginTop = numValue + unit;
        this.currentElement.style.marginBottom = numValue + unit;
      }
    } else if (type === 'padding') {
      if (axis === 'x') {
        this.currentElement.style.paddingLeft = numValue + unit;
        this.currentElement.style.paddingRight = numValue + unit;
      } else {
        this.currentElement.style.paddingTop = numValue + unit;
        this.currentElement.style.paddingBottom = numValue + unit;
      }
    }

    // 如果链接是激活的，同步另一个轴
    const control = this.controls[type + 'Control'];
    if (control && control.linkBtn.classList.contains('active')) {
      const otherAxis = axis === 'x' ? 'y' : 'x';
      const otherInput = axis === 'x' ? control.yInput : control.xInput;
      otherInput.value = value;
      this.updateSpacing(type, otherAxis, value);
    }

    this.notifyChange(type, { axis, value: numValue });
  }

  /**
   * 切换间距链接
   */
  toggleSpacingLink(type, active) {
    if (active) {
      const control = this.controls[type + 'Control'];
      if (control) {
        const xValue = control.xInput.value;
        if (xValue) {
          control.yInput.value = xValue;
          this.updateSpacing(type, 'y', xValue);
        }
      }
    }
  }

  /**
   * 显示详细间距设置
   */
  showDetailSpacing(type) {
    // TODO: 实现详细的四方向间距设置弹窗
    console.log(`Show detail spacing for ${type}`);
  }

  /**
   * 更新flex属性（针对子元素）
   */
  updateFlexProperty(property, value) {
    if (!this.currentElement) return;

    this.currentElement.style[property] = value;
    this.notifyChange(property, value);
  }

  /**
   * 设置flex快捷值
   */
  setFlexQuick(flexValue) {
    if (!this.currentElement) return;

    this.currentElement.style.flex = flexValue;

    // 更新单独的输入框
    this.updateFlexInputs(flexValue);

    this.notifyChange('flex', flexValue);
  }

  updateFlexInputs(flexValue) {
    const parts = flexValue.split(' ');
    if (parts.length >= 3) {
      this.controls.flexGrowInput.value = parts[0];
      this.controls.flexShrinkInput.value = parts[1];
      this.controls.flexBasisInput.value = parts[2];
    }
  }

  /**
   * 更新顺序
   */
  updateOrder(value) {
    if (!this.currentElement) return;

    const orderValue = parseInt(value) || 0;
    this.currentElement.style.order = orderValue.toString();
    this.notifyChange('order', orderValue);
  }

  /**
   * 调整顺序
   */
  adjustOrder(delta) {
    const input = this.controls.orderInput;
    const currentValue = parseInt(input.value) || 0;
    const newValue = currentValue + delta;

    input.value = newValue;
    this.updateOrder(newValue);
  }

  /**
   * 从元素更新控件值
   */
  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 更新容器属性
    this.updateFlexDirection(style.flexDirection);
    this.updateFlexWrap(style.flexWrap);

    // 更新对齐属性
    this.updateJustifyContentUI(style.justifyContent);
    this.updateAlignItemsUI(style.alignItems);
    this.updateAlignContentUI(style.alignContent);

    // 更新间距
    this.updateGapValues(style.gap);
    this.updateSpacingValues(element, style);

    // 更新flex item属性（如果元素在flex容器中）
    this.updateFlexItemValues(element, style);

    // 显示/隐藏flex item控制
    this.updateFlexItemVisibility(element);
  }

  updateFlexDirection(direction) {
    const radios = this.controls.directionGroup.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.checked = radio.value === direction;
    });
  }

  updateFlexWrap(wrap) {
    const radios = this.controls.wrapGroup.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.checked = radio.value === wrap;
    });
  }

  updateJustifyContentUI(justifyContent) {
    this.updateButtonGroup(this.controls.justifyGroup, justifyContent);
  }

  updateAlignItemsUI(alignItems) {
    this.updateButtonGroup(this.controls.alignItemsGroup, alignItems);
  }

  updateAlignContentUI(alignContent) {
    this.updateButtonGroup(this.controls.alignContentGroup, alignContent);
  }

  updateGapValues(gap) {
    const gapValues = this.parseGap(gap);

    this.controls.gapYInput.value = parseInt(gapValues.row) || 0;
    this.controls.gapXInput.value = parseInt(gapValues.column) || 0;
  }

  updateSpacingValues(element, style) {
    // 更新外边距
    this.updateSpacingControl('margin', {
      x: parseInt(style.marginLeft) || 0,
      y: parseInt(style.marginTop) || 0
    });

    // 更新内边距
    this.updateSpacingControl('padding', {
      x: parseInt(style.paddingLeft) || 0,
      y: parseInt(style.paddingTop) || 0
    });
  }

  updateSpacingControl(type, values) {
    const control = this.controls[type + 'Control'];
    if (control) {
      control.xInput.value = values.x;
      control.yInput.value = values.y;
    }
  }

  updateFlexItemValues(element, style) {
    // 更新align-self
    const alignSelfRadios = this.controls.alignSelfGroup.querySelectorAll('input[type="radio"]');
    alignSelfRadios.forEach(radio => {
      radio.checked = radio.value === style.alignSelf;
    });

    // 更新flex属性
    this.controls.flexGrowInput.value = style.flexGrow || '0';
    this.controls.flexShrinkInput.value = style.flexShrink || '1';
    this.controls.flexBasisInput.value = style.flexBasis || 'auto';

    // 更新order
    this.controls.orderInput.value = style.order || '0';
  }

  updateFlexItemVisibility(element) {
    const parent = element.parentElement;
    const isInFlexContainer = parent && window.getComputedStyle(parent).display === 'flex';

    if (this.controls.flexItemSection) {
      if (isInFlexContainer) {
        this.controls.flexItemSection.style.display = 'block';
      } else {
        this.controls.flexItemSection.style.display = 'none';
      }
    }
  }

  /**
   * 更新组件以匹配当前元素
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    if (element) {
      this.updateFromElement(element);
    }
  }

  /**
   * 通知样式变更
   */
  notifyChange(property, value) {
    const event = new CustomEvent('wveStyleChange', {
      detail: {
        element: this.currentElement,
        property: property,
        value: value,
        source: 'FlexLayoutSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (document.getElementById('flex-layout-styles')) return;

    const style = document.createElement('style');
    style.id = 'flex-layout-styles';
    style.textContent = `
      .flex-layout-section .section-content {
        padding: 12px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      /* 容器设置 */
      .container-panel {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
        margin-bottom: 16px;
      }

      .control-group {
        margin-bottom: 12px;
      }

      .control-group:last-child {
        margin-bottom: 0;
      }

      .control-label {
        font-size: 10px;
        font-weight: 500;
        color: #cccccc;
        margin-bottom: 6px;
        display: block;
      }

      .control-label-inline {
        font-size: 10px;
        color: #cccccc;
        min-width: 50px;
      }

      /* 单选按钮样式 */
      .radio-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }

      .radio-inline-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .radio-option {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .radio-option input[type="radio"] {
        width: 10px;
        height: 10px;
        accent-color: #0078d4;
      }

      .radio-option label {
        font-size: 9px;
        color: #cccccc;
        cursor: pointer;
        white-space: nowrap;
      }

      /* 图标按钮组 */
      .icon-button-group {
        display: flex;
        gap: 2px;
      }

      .icon-button-group button {
        width: 24px;
        height: 20px;
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #cccccc;
        font-size: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-button-group button:hover {
        background: #404040;
        border-color: #505050;
      }

      .icon-button-group button.active {
        background: #0078d4;
        border-color: #106ebe;
        color: #ffffff;
      }

      /* 对齐设置 */
      .alignment-panel {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
        margin-bottom: 16px;
      }

      /* 间距设置 */
      .gap-panel, .spacing-panel {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
        margin-bottom: 16px;
      }

      .gap-controls, .spacing-input-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .input-with-label {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .input-with-label span {
        font-size: 9px;
        color: #999999;
      }

      .gap-input, .spacing-input {
        width: 40px;
        height: 20px;
        padding: 2px 4px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        text-align: center;
      }

      .gap-input:focus, .spacing-input:focus {
        border-color: #0078d4;
        outline: none;
      }

      .unit-label {
        font-size: 9px;
        color: #999999;
      }

      /* 间距控制行 */
      .spacing-control-container {
        margin-bottom: 6px;
      }

      .spacing-control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      /* Flex item 控制 */
      .flex-item-panel {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
      }

      .flex-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .flex-input {
        width: 50px;
        height: 20px;
        padding: 2px 4px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        text-align: center;
      }

      .flex-quick-buttons {
        display: flex;
        gap: 4px;
      }

      .quick-button {
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #cccccc;
        font-size: 9px;
        padding: 4px 8px;
        cursor: pointer;
      }

      .quick-button:hover {
        background: #404040;
        border-color: #505050;
      }

      /* 顺序控制 */
      .order-controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .order-input {
        width: 40px;
        height: 20px;
        padding: 2px 4px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        text-align: center;
      }

      /* 区域间距 */
      .flex-container-section,
      .flex-alignment-section,
      .flex-gap-section,
      .flex-spacing-section,
      .flex-item-section {
        margin-bottom: 16px;
      }

      .flex-item-section:last-child {
        margin-bottom: 0;
      }
    `;

    document.head.appendChild(style);
  }
};