/**
 * 无布局模式属性区域
 * 对应新设计中的"无布局 (Document Flow)"模式
 */
window.WVE = window.WVE || {};
window.WVE.NoneLayoutSection = class NoneLayoutSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '📄 无布局 (Document Flow)',
      collapsed: false,
      className: 'none-layout-section',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 显示模式设置
    this.createDisplayModeSection(container);

    // 内外边距设置
    this.createSpacingSection(container);

    // 文本对齐设置
    this.createTextAlignSection(container);

    this.injectStyles();
  }

  createDisplayModeSection(container) {
    const section = document.createElement('div');
    section.className = 'display-mode-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '显示模式';

    // 单选按钮组
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    const displayModes = [
      { value: 'block', label: '块级元素 (block)' },
      { value: 'inline', label: '内联元素 (inline)' },
      { value: 'inline-block', label: '内联块 (inline-block)' }
    ];

    displayModes.forEach(mode => {
      const radio = this.createRadioOption(mode.value, mode.label, 'display');
      radioGroup.appendChild(radio);
    });

    this.controls.displayGroup = radioGroup;

    section.appendChild(title);
    section.appendChild(radioGroup);
    container.appendChild(section);
  }

  createSpacingSection(container) {
    const section = document.createElement('div');
    section.className = 'spacing-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '内外边距';

    // 外边距控制 - 简化版本（X/Y轴）
    const marginControl = this.createSpacingControl('Margin', 'margin');
    this.controls.marginControl = marginControl;

    // 内边距控制 - 简化版本（X/Y轴）
    const paddingControl = this.createSpacingControl('Padding', 'padding');
    this.controls.paddingControl = paddingControl;

    section.appendChild(title);
    section.appendChild(marginControl);
    section.appendChild(paddingControl);
    container.appendChild(section);
  }

  createSpacingControl(label, type) {
    const container = document.createElement('div');
    container.className = 'spacing-control-container';

    const controlRow = document.createElement('div');
    controlRow.className = 'spacing-control-row';

    // 标签
    const labelEl = document.createElement('span');
    labelEl.className = 'control-label';
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
    inputGroup.className = 'input-group';

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

  createTextAlignSection(container) {
    const section = document.createElement('div');
    section.className = 'text-align-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '文本对齐';

    // 对齐按钮组
    const alignGroup = document.createElement('div');
    alignGroup.className = 'align-button-group';

    const alignOptions = [
      { value: 'left', icon: '≡', label: '左对齐' },
      { value: 'center', icon: '≣', label: '居中' },
      { value: 'right', icon: '≡', label: '右对齐' },
      { value: 'justify', icon: '≣', label: '两端对齐' }
    ];

    alignOptions.forEach(option => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: option.icon,
        tooltip: option.label,
        onClick: () => this.setTextAlign(option.value)
      });
      button.dataset.value = option.value;
      alignGroup.appendChild(button);
    });

    this.controls.alignGroup = alignGroup;

    section.appendChild(title);
    section.appendChild(alignGroup);
    container.appendChild(section);
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
        this.setDisplayMode(value);
      }
    });

    container.appendChild(radio);
    container.appendChild(labelEl);

    return container;
  }

  /**
   * 设置显示模式
   */
  setDisplayMode(mode) {
    if (!this.currentElement) return;

    this.currentElement.style.display = mode;
    this.notifyChange('display', mode);
  }

  /**
   * 更新间距
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
      // 同步X和Y轴的值
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
   * 设置文本对齐
   */
  setTextAlign(align) {
    if (!this.currentElement) return;

    this.currentElement.style.textAlign = align;

    // 更新按钮状态
    const buttons = this.controls.alignGroup.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.dataset.value === align) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.notifyChange('textAlign', align);
  }

  /**
   * 从元素获取当前值并更新控件
   */
  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 更新显示模式
    this.updateDisplayMode(style.display);

    // 更新间距值
    this.updateSpacingValues(element, style);

    // 更新文本对齐
    this.updateTextAlign(style.textAlign);
  }

  updateDisplayMode(display) {
    const radios = this.controls.displayGroup.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.checked = radio.value === display;
    });
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

  updateTextAlign(textAlign) {
    const buttons = this.controls.alignGroup.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.dataset.value === textAlign) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
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
        source: 'NoneLayoutSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (document.getElementById('none-layout-styles')) return;

    const style = document.createElement('style');
    style.id = 'none-layout-styles';
    style.textContent = `
      .none-layout-section .section-content {
        padding: 12px;
        space-y: 16px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      /* 单选按钮组样式 */
      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
      }

      .radio-option {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .radio-option input[type="radio"] {
        width: 12px;
        height: 12px;
        accent-color: #0078d4;
      }

      .radio-option label {
        font-size: 11px;
        color: #cccccc;
        cursor: pointer;
      }

      /* 间距控制样式 */
      .spacing-control-container {
        margin-bottom: 8px;
      }

      .spacing-control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .control-label {
        font-size: 10px;
        color: #cccccc;
        min-width: 50px;
      }

      .input-group {
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
        font-size: 10px;
        color: #999999;
      }

      .spacing-input {
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

      .spacing-input:focus {
        border-color: #0078d4;
        outline: none;
      }

      /* 文本对齐按钮组 */
      .align-button-group {
        display: flex;
        gap: 4px;
      }

      .align-button-group button {
        width: 28px;
        height: 24px;
        background: #363636;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #cccccc;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .align-button-group button:hover {
        background: #404040;
        border-color: #505050;
      }

      .align-button-group button.active {
        background: #0078d4;
        border-color: #106ebe;
        color: #ffffff;
      }

      /* 间距区域整体样式 */
      .spacing-section {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
        margin-bottom: 16px;
      }

      .text-align-section {
        margin-bottom: 16px;
      }

      .display-mode-section {
        margin-bottom: 16px;
      }
    `;

    document.head.appendChild(style);
  }
};