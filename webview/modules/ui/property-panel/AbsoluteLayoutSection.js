/**
 * 绝对布局模式属性区域
 * 对应新设计中的"绝对布局 (Absolute Position)"模式
 */
window.WVE = window.WVE || {};
window.WVE.AbsoluteLayoutSection = class AbsoluteLayoutSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '📌 绝对布局 (Absolute Position)',
      collapsed: false,
      className: 'absolute-layout-section',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 定位类型选择
    this.createPositionTypeSection(container);

    // 位置设置
    this.createPositionSection(container);

    // 层级顺序
    this.createZIndexSection(container);

    // 变换设置
    this.createTransformSection(container);

    this.injectStyles();
  }

  createPositionTypeSection(container) {
    const section = document.createElement('div');
    section.className = 'position-type-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '定位类型';

    // 单选按钮组
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';

    const positionTypes = [
      { value: 'relative', label: '相对定位 (relative)' },
      { value: 'absolute', label: '绝对定位 (absolute)' },
      { value: 'fixed', label: '固定定位 (fixed)' },
      { value: 'sticky', label: '粘性定位 (sticky)' }
    ];

    positionTypes.forEach(type => {
      const radio = this.createRadioOption(type.value, type.label, 'position');
      radioGroup.appendChild(radio);
    });

    this.controls.positionGroup = radioGroup;

    section.appendChild(title);
    section.appendChild(radioGroup);
    container.appendChild(section);
  }

  createPositionSection(container) {
    const section = document.createElement('div');
    section.className = 'position-settings-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '位置设置';

    // 位置可视化面板
    const positionPanel = this.createPositionVisualPanel();

    section.appendChild(title);
    section.appendChild(positionPanel);
    container.appendChild(section);
  }

  createPositionVisualPanel() {
    const panel = document.createElement('div');
    panel.className = 'position-visual-panel';

    // Top 输入
    const topInput = this.createPositionInput('top', 'Top');
    topInput.className = 'position-input position-top';

    // Left 输入
    const leftInput = this.createPositionInput('left', 'Left');
    leftInput.className = 'position-input position-left';

    // Right 输入
    const rightInput = this.createPositionInput('right', 'Right');
    rightInput.className = 'position-input position-right';

    // Bottom 输入
    const bottomInput = this.createPositionInput('bottom', 'Bottom');
    bottomInput.className = 'position-input position-bottom';

    // 中心可视化区域
    const centerBox = document.createElement('div');
    centerBox.className = 'position-center-box';
    centerBox.innerHTML = '<span>⊞</span>';

    panel.appendChild(topInput);
    panel.appendChild(leftInput);
    panel.appendChild(centerBox);
    panel.appendChild(rightInput);
    panel.appendChild(bottomInput);

    return panel;
  }

  createPositionInput(property, label) {
    const container = document.createElement('div');
    container.className = 'position-input-container';

    const labelEl = document.createElement('span');
    labelEl.className = 'position-label';
    labelEl.textContent = label;

    const input = window.WVE.PropertyControls.createInputWithDropdown({
      type: 'number',
      placeholder: 'auto',
      options: ['px', '%', 'em', 'rem', 'auto'],
      defaultUnit: 'px',
      onChange: (value, unit) => this.updatePosition(property, value, unit)
    });

    this.controls[property + 'Input'] = input;

    container.appendChild(labelEl);
    container.appendChild(input);

    return container;
  }

  createZIndexSection(container) {
    const section = document.createElement('div');
    section.className = 'z-index-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '层级顺序';

    // Z-index 控制
    const zIndexControl = document.createElement('div');
    zIndexControl.className = 'z-index-control';

    const label = document.createElement('span');
    label.textContent = 'Z-index:';

    const input = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '0',
      placeholder: '0',
      className: 'z-index-input',
      onChange: (value) => this.updateZIndex(value)
    });

    const upBtn = window.WVE.PropertyControls.createIconButton({
      icon: '↑',
      size: 'small',
      onClick: () => this.adjustZIndex(1)
    });

    const downBtn = window.WVE.PropertyControls.createIconButton({
      icon: '↓',
      size: 'small',
      onClick: () => this.adjustZIndex(-1)
    });

    this.controls.zIndexInput = input;

    zIndexControl.appendChild(label);
    zIndexControl.appendChild(input);
    zIndexControl.appendChild(upBtn);
    zIndexControl.appendChild(downBtn);

    section.appendChild(title);
    section.appendChild(zIndexControl);
    container.appendChild(section);
  }

  createTransformSection(container) {
    const section = document.createElement('div');
    section.className = 'transform-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '变换';

    // 平移控制
    const translateRow = this.createTransformRow('平移', [
      { label: 'X:', property: 'translateX', unit: 'px' },
      { label: 'Y:', property: 'translateY', unit: 'px' }
    ]);

    // 旋转控制
    const rotateRow = this.createTransformRow('旋转', [
      { label: '', property: 'rotate', unit: '°', single: true }
    ]);

    // 缩放控制
    const scaleRow = this.createTransformRow('缩放', [
      { label: 'X:', property: 'scaleX', unit: '', defaultValue: '1' },
      { label: 'Y:', property: 'scaleY', unit: '', defaultValue: '1' }
    ]);

    // 倾斜控制
    const skewRow = this.createTransformRow('倾斜', [
      { label: '', property: 'skew', unit: '°', single: true }
    ]);

    section.appendChild(title);
    section.appendChild(translateRow);
    section.appendChild(rotateRow);
    section.appendChild(scaleRow);
    section.appendChild(skewRow);
    container.appendChild(section);
  }

  createTransformRow(title, controls) {
    const row = document.createElement('div');
    row.className = 'transform-row';

    const label = document.createElement('span');
    label.className = 'transform-label';
    label.textContent = title;

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'transform-controls';

    controls.forEach(control => {
      if (control.single) {
        // 单个控件
        const input = window.WVE.PropertyControls.createInput({
          type: 'number',
          placeholder: '0',
          value: control.defaultValue || '0',
          className: 'transform-input',
          onChange: (value) => this.updateTransform(control.property, value, control.unit)
        });

        this.controls[control.property + 'Input'] = input;

        if (control.unit) {
          const group = document.createElement('div');
          group.className = 'input-with-unit';
          group.appendChild(input);

          const unit = document.createElement('span');
          unit.className = 'unit-label';
          unit.textContent = control.unit;
          group.appendChild(unit);

          controlsContainer.appendChild(group);
        } else {
          controlsContainer.appendChild(input);
        }
      } else {
        // 带标签的控件
        const group = document.createElement('div');
        group.className = 'labeled-input';

        const subLabel = document.createElement('span');
        subLabel.textContent = control.label;
        group.appendChild(subLabel);

        const input = window.WVE.PropertyControls.createInput({
          type: 'number',
          placeholder: '0',
          value: control.defaultValue || '0',
          className: 'transform-input',
          onChange: (value) => this.updateTransform(control.property, value, control.unit)
        });

        this.controls[control.property + 'Input'] = input;
        group.appendChild(input);

        if (control.unit) {
          const unit = document.createElement('span');
          unit.className = 'unit-label';
          unit.textContent = control.unit;
          group.appendChild(unit);
        }

        controlsContainer.appendChild(group);
      }
    });

    row.appendChild(label);
    row.appendChild(controlsContainer);

    return row;
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
        this.setPositionType(value);
      }
    });

    container.appendChild(radio);
    container.appendChild(labelEl);

    return container;
  }

  /**
   * 设置定位类型
   */
  setPositionType(type) {
    if (!this.currentElement) return;

    this.currentElement.style.position = type;

    // 如果是绝对定位类型，且没有设置位置，使用当前位置
    if (['absolute', 'fixed'].includes(type)) {
      this.ensurePositionValues();
    }

    this.notifyChange('position', type);
  }

  /**
   * 确保位置值已设置
   */
  ensurePositionValues() {
    if (!this.currentElement) return;

    const style = this.currentElement.style;
    if (!style.top && !style.left && !style.right && !style.bottom) {
      const rect = this.currentElement.getBoundingClientRect();
      style.top = rect.top + 'px';
      style.left = rect.left + 'px';
    }
  }

  /**
   * 更新位置
   */
  updatePosition(property, value, unit) {
    if (!this.currentElement) return;

    if (value === '' || value === 'auto') {
      this.currentElement.style[property] = 'auto';
    } else {
      this.currentElement.style[property] = value + unit;
    }

    this.notifyChange(property, { value, unit });
  }

  /**
   * 更新Z-index
   */
  updateZIndex(value) {
    if (!this.currentElement) return;

    const zIndex = parseInt(value) || 0;
    this.currentElement.style.zIndex = zIndex.toString();
    this.notifyChange('zIndex', zIndex);
  }

  /**
   * 调整Z-index
   */
  adjustZIndex(delta) {
    const input = this.controls.zIndexInput;
    const currentValue = parseInt(input.value) || 0;
    const newValue = currentValue + delta;

    input.value = newValue;
    this.updateZIndex(newValue);
  }

  /**
   * 更新变换
   */
  updateTransform(property, value, unit) {
    if (!this.currentElement) return;

    // 获取当前的transform值并解析
    const currentTransform = this.currentElement.style.transform || '';
    const transforms = this.parseTransform(currentTransform);

    // 更新指定属性
    transforms[property] = value + unit;

    // 重建transform字符串
    const newTransform = this.buildTransformString(transforms);
    this.currentElement.style.transform = newTransform;

    this.notifyChange('transform', { property, value, unit });
  }

  /**
   * 解析transform字符串
   */
  parseTransform(transformString) {
    const transforms = {
      translateX: '0px',
      translateY: '0px',
      rotate: '0deg',
      scaleX: '1',
      scaleY: '1',
      skew: '0deg'
    };

    if (!transformString) return transforms;

    // 简单的正则解析，可以根据需要扩展
    const patterns = {
      translateX: /translateX\(([^)]+)\)/,
      translateY: /translateY\(([^)]+)\)/,
      rotate: /rotate\(([^)]+)\)/,
      scaleX: /scaleX\(([^)]+)\)/,
      scaleY: /scaleY\(([^)]+)\)/,
      skew: /skew\(([^)]+)\)/
    };

    Object.keys(patterns).forEach(key => {
      const match = transformString.match(patterns[key]);
      if (match) {
        transforms[key] = match[1];
      }
    });

    return transforms;
  }

  /**
   * 构建transform字符串
   */
  buildTransformString(transforms) {
    const parts = [];

    if (transforms.translateX !== '0px' || transforms.translateY !== '0px') {
      parts.push(`translate(${transforms.translateX}, ${transforms.translateY})`);
    }

    if (transforms.rotate !== '0deg') {
      parts.push(`rotate(${transforms.rotate})`);
    }

    if (transforms.scaleX !== '1' || transforms.scaleY !== '1') {
      parts.push(`scale(${transforms.scaleX}, ${transforms.scaleY})`);
    }

    if (transforms.skew !== '0deg') {
      parts.push(`skew(${transforms.skew})`);
    }

    return parts.join(' ');
  }

  /**
   * 从元素更新控件值
   */
  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 更新定位类型
    this.updatePositionType(style.position);

    // 更新位置值
    this.updatePositionValues(style);

    // 更新Z-index
    this.updateZIndexValue(style.zIndex);

    // 更新变换值
    this.updateTransformValues(style.transform);
  }

  updatePositionType(position) {
    const radios = this.controls.positionGroup.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.checked = radio.value === position;
    });
  }

  updatePositionValues(style) {
    const positions = ['top', 'left', 'right', 'bottom'];
    positions.forEach(pos => {
      const input = this.controls[pos + 'Input'];
      if (input) {
        const value = style[pos];
        if (value && value !== 'auto') {
          const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
          if (match) {
            const inputElement = input.querySelector('input');
            if (inputElement) {
              inputElement.value = match[1];
            }
          }
        } else {
          const inputElement = input.querySelector('input');
          if (inputElement) {
            inputElement.value = '';
          }
        }
      }
    });
  }

  updateZIndexValue(zIndex) {
    if (this.controls.zIndexInput) {
      this.controls.zIndexInput.value = zIndex === 'auto' ? '0' : zIndex;
    }
  }

  updateTransformValues(transform) {
    if (!transform || transform === 'none') return;

    const transforms = this.parseTransform(transform);

    // 更新变换输入框
    Object.keys(transforms).forEach(key => {
      const input = this.controls[key + 'Input'];
      if (input) {
        const value = transforms[key];
        const numMatch = value.match(/^(-?\d*\.?\d+)/);
        if (numMatch) {
          input.value = numMatch[1];
        }
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
        source: 'AbsoluteLayoutSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (document.getElementById('absolute-layout-styles')) return;

    const style = document.createElement('style');
    style.id = 'absolute-layout-styles';
    style.textContent = `
      .absolute-layout-section .section-content {
        padding: 12px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      /* 定位类型样式 */
      .position-type-section {
        margin-bottom: 16px;
      }

      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
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

      /* 位置可视化面板 */
      .position-visual-panel {
        position: relative;
        width: 200px;
        height: 120px;
        background: #363636;
        border: 1px solid #404040;
        border-radius: 6px;
        margin: 8px auto;
      }

      .position-center-box {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 40px;
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #999999;
      }

      .position-input-container {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .position-top {
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
      }

      .position-bottom {
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
      }

      .position-left {
        left: -10px;
        top: 50%;
        transform: translateY(-50%);
      }

      .position-right {
        right: -10px;
        top: 50%;
        transform: translateY(-50%);
      }

      .position-label {
        font-size: 9px;
        color: #999999;
        white-space: nowrap;
      }

      /* Z-index 控制 */
      .z-index-section {
        margin-bottom: 16px;
      }

      .z-index-control {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .z-index-control span {
        font-size: 11px;
        color: #cccccc;
        min-width: 50px;
      }

      .z-index-input {
        width: 60px;
        height: 24px;
        padding: 2px 6px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 11px;
        text-align: center;
      }

      /* 变换控制 */
      .transform-section {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
      }

      .transform-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .transform-row:last-child {
        margin-bottom: 0;
      }

      .transform-label {
        font-size: 10px;
        color: #cccccc;
        min-width: 40px;
      }

      .transform-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .labeled-input {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .labeled-input span {
        font-size: 9px;
        color: #999999;
      }

      .transform-input {
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

      .input-with-unit {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .unit-label {
        font-size: 9px;
        color: #999999;
      }

      .position-settings-section {
        margin-bottom: 16px;
      }
    `;

    document.head.appendChild(style);
  }
};