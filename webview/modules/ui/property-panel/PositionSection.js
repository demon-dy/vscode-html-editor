/**
 * Position 属性区域 - 1:1 复刻 Figma 位置面板
 */
window.WVE = window.WVE || {};
window.WVE.PositionSection = class PositionSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: 'Position',
      collapsed: false,
      className: 'position-section',
      ...options
    });

    this.currentElement = null;
    this.alignmentButtons = null;
    this.positionInputs = {
      x: null,
      y: null
    };
    this.constraintsControls = {
      left: null,
      right: null,
      top: null,
      bottom: null
    };
    this.rotationInput = null;
  }

  /**
   * 创建区域内容
   */
  createContentElements(container) {
    // 对齐按钮组
    this.createAlignmentSection(container);

    // 位置输入
    this.createPositionSection(container);

    // 约束设置
    this.createConstraintsSection(container);

    // 旋转设置
    this.createRotationSection(container);
  }

  /**
   * 创建对齐按钮组
   */
  createAlignmentSection(container) {
    const group = this.createGroup('Alignment');

    // 对齐按钮 - 7个按钮横向排列
    const alignmentButtons = [
      { icon: 'align-left', title: '左对齐', action: 'align-left' },
      { icon: 'align-center', title: '水平居中', action: 'align-center-horizontal' },
      { icon: 'align-right', title: '右对齐', action: 'align-right' },
      { icon: 'align-top', title: '顶部对齐', action: 'align-top' },
      { icon: 'align-middle', title: '垂直居中', action: 'align-center-vertical' },
      { icon: 'align-bottom', title: '底部对齐', action: 'align-bottom' },
      { icon: 'move', title: '分布', action: 'distribute' }
    ];

    const { group: buttonGroup } = this.controls.createButtonGroup(
      alignmentButtons.map(button => ({
        ...button,
        onClick: (e, index) => this.handleAlignment(button.action)
      })),
      { multiSelect: false, gap: 2 }
    );

    group.appendChild(buttonGroup);
    container.appendChild(group);

    this.alignmentButtons = buttonGroup;
  }

  /**
   * 创建位置输入区域
   */
  createPositionSection(container) {
    const group = this.createGroup('Position');

    // X Y 输入框 - 两列布局
    const xInput = this.controls.createLabelControl(
      'X',
      this.createNumberInput('0', {
        onChange: (value) => this.handlePositionChange('left', value),
        width: '80px'
      }),
      { labelWidth: '12px' }
    );

    const yInput = this.controls.createLabelControl(
      'Y',
      this.createNumberInput('0', {
        onChange: (value) => this.handlePositionChange('top', value),
        width: '80px'
      }),
      { labelWidth: '12px' }
    );

    const positionRow = this.controls.createTwoColumnLayout(xInput, yInput);
    group.appendChild(positionRow);

    container.appendChild(group);

    this.positionInputs.x = xInput.querySelector('input');
    this.positionInputs.y = yInput.querySelector('input');
  }

  /**
   * 创建约束设置区域
   */
  createConstraintsSection(container) {
    const group = this.createGroup('Constraints');

    // 约束可视化控件
    const constraintsWidget = this.createConstraintsWidget();
    group.appendChild(constraintsWidget);

    container.appendChild(group);
  }

  /**
   * 创建约束可视化控件
   */
  createConstraintsWidget() {
    const widget = document.createElement('div');
    widget.className = 'constraints-widget';
    widget.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    `;

    // 左侧下拉选择
    const leftSelect = this.controls.createInputWithDropdown({
      value: 'Left',
      dropdownOptions: [
        { text: 'Left', value: 'left', selected: true },
        { text: 'Right', value: 'right' },
        { text: 'Center', value: 'center' },
        { text: 'Left & Right', value: 'left-right' },
        { text: 'Scale', value: 'scale' }
      ],
      onDropdownSelect: (option) => this.handleConstraintChange('horizontal', option.value),
      width: '120px'
    });

    // 中间约束可视化图标
    const constraintViz = document.createElement('div');
    constraintViz.className = 'constraint-visualization';
    constraintViz.style.cssText = `
      width: 40px;
      height: 30px;
      background: #1e1e1e;
      border: 1px solid #404040;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `;

    // 添加约束线条和控制点
    this.createConstraintVisualization(constraintViz);

    // 右侧下拉选择
    const topSelect = this.controls.createInputWithDropdown({
      value: 'Top',
      dropdownOptions: [
        { text: 'Top', value: 'top', selected: true },
        { text: 'Bottom', value: 'bottom' },
        { text: 'Center', value: 'center' },
        { text: 'Top & Bottom', value: 'top-bottom' },
        { text: 'Scale', value: 'scale' }
      ],
      onDropdownSelect: (option) => this.handleConstraintChange('vertical', option.value),
      width: '120px'
    });

    widget.appendChild(leftSelect);
    widget.appendChild(constraintViz);
    widget.appendChild(topSelect);

    this.constraintsControls.widget = constraintViz;
    this.constraintsControls.left = leftSelect;
    this.constraintsControls.top = topSelect;

    return widget;
  }

  /**
   * 创建约束可视化
   */
  createConstraintVisualization(container) {
    // 中心矩形
    const rect = document.createElement('div');
    rect.style.cssText = `
      width: 12px;
      height: 8px;
      background: #666666;
      position: absolute;
    `;

    // 约束线条
    const lines = {
      top: this.createConstraintLine('horizontal', '-8px', '0', '12px'),
      bottom: this.createConstraintLine('horizontal', '16px', '0', '12px'),
      left: this.createConstraintLine('vertical', '0', '-12px', '8px'),
      right: this.createConstraintLine('vertical', '0', '18px', '8px')
    };

    container.appendChild(rect);
    Object.values(lines).forEach(line => container.appendChild(line));

    // 添加交互式控制点
    this.addConstraintControls(container, lines);

    return { rect, lines };
  }

  /**
   * 创建约束线条
   */
  createConstraintLine(type, top, left, size) {
    const line = document.createElement('div');
    line.className = `constraint-line constraint-${type}`;
    line.style.cssText = `
      position: absolute;
      top: ${top};
      left: ${left};
      background: #0078d4;
      ${type === 'horizontal' ? `width: ${size}; height: 1px;` : `width: 1px; height: ${size};`}
    `;
    return line;
  }

  /**
   * 添加约束控制点
   */
  addConstraintControls(container, lines) {
    const positions = [
      { name: 'top', x: 6, y: -4, line: lines.top },
      { name: 'bottom', x: 6, y: 20, line: lines.bottom },
      { name: 'left', x: -8, y: 4, line: lines.left },
      { name: 'right', x: 22, y: 4, line: lines.right }
    ];

    positions.forEach(pos => {
      const control = document.createElement('div');
      control.className = `constraint-control constraint-${pos.name}`;
      control.style.cssText = `
        position: absolute;
        top: ${pos.y}px;
        left: ${pos.x}px;
        width: 8px;
        height: 8px;
        background: #0078d4;
        border: 1px solid #ffffff;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // 内部点
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 4px;
        height: 4px;
        background: #ffffff;
        border-radius: 50%;
      `;
      control.appendChild(dot);

      control.addEventListener('click', () => {
        this.toggleConstraint(pos.name);
      });

      container.appendChild(control);
    });
  }

  /**
   * 创建旋转设置区域
   */
  createRotationSection(container) {
    const group = this.createGroup('Rotation');

    // 旋转输入和控制按钮
    const rotationRow = document.createElement('div');
    rotationRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // 旋转图标
    const rotationIcon = document.createElement('i');
    rotationIcon.className = 'wve-icon';
    rotationIcon.setAttribute('data-lucide', 'rotate-ccw');
    rotationIcon.style.cssText = `
      width: 16px;
      height: 16px;
      color: #cccccc;
    `;

    // 角度输入
    const angleInput = this.createNumberInput('0', {
      onChange: (value) => this.handleRotationChange(value),
      suffix: '°',
      width: '60px'
    });

    // 旋转操作按钮
    const rotationButtons = [
      { icon: 'rotate-ccw', title: '逆时针旋转90°', action: 'rotate-left' },
      { icon: 'rotate-cw', title: '顺时针旋转90°', action: 'rotate-right' },
      { icon: 'flip-horizontal', title: '水平翻转', action: 'flip-horizontal' }
    ];

    const { group: buttonGroup } = this.controls.createButtonGroup(
      rotationButtons.map(button => ({
        ...button,
        size: 20,
        onClick: () => this.handleRotationAction(button.action)
      })),
      { multiSelect: false, gap: 2 }
    );

    rotationRow.appendChild(rotationIcon);
    rotationRow.appendChild(angleInput);
    rotationRow.appendChild(buttonGroup);

    group.appendChild(rotationRow);
    container.appendChild(group);

    this.rotationInput = angleInput.querySelector('input');

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(group);
    }, 0);
  }

  /**
   * 处理对齐操作
   */
  handleAlignment(action) {
    if (!this.currentElement) return;

    this.logger.info('Applying alignment:', action);

    // 这里实现具体的对齐逻辑
    switch (action) {
      case 'align-left':
        this.currentElement.style.textAlign = 'left';
        break;
      case 'align-center-horizontal':
        this.currentElement.style.textAlign = 'center';
        break;
      case 'align-right':
        this.currentElement.style.textAlign = 'right';
        break;
      case 'align-top':
        this.currentElement.style.verticalAlign = 'top';
        break;
      case 'align-center-vertical':
        this.currentElement.style.verticalAlign = 'middle';
        break;
      case 'align-bottom':
        this.currentElement.style.verticalAlign = 'bottom';
        break;
    }

    this.notifyChange('alignment', action);
  }

  /**
   * 处理位置变更
   */
  handlePositionChange(property, value) {
    if (!this.currentElement) return;

    const numValue = parseFloat(value) || 0;
    this.currentElement.style[property] = `${numValue}px`;

    this.notifyChange('position', { [property]: `${numValue}px` });
  }

  /**
   * 处理约束变更
   */
  handleConstraintChange(direction, constraint) {
    this.logger.info('Constraint changed:', direction, constraint);
    this.notifyChange('constraint', { direction, constraint });
  }

  /**
   * 切换约束状态
   */
  toggleConstraint(constraint) {
    this.logger.info('Toggle constraint:', constraint);
    // 实现约束切换逻辑
  }

  /**
   * 处理旋转变更
   */
  handleRotationChange(value) {
    if (!this.currentElement) return;

    const angle = parseFloat(value) || 0;
    this.currentElement.style.transform = `rotate(${angle}deg)`;

    this.notifyChange('rotation', angle);
  }

  /**
   * 处理旋转操作
   */
  handleRotationAction(action) {
    if (!this.currentElement) return;

    const currentTransform = this.currentElement.style.transform || '';
    const currentRotation = this.extractRotationFromTransform(currentTransform);

    let newRotation = currentRotation;

    switch (action) {
      case 'rotate-left':
        newRotation -= 90;
        break;
      case 'rotate-right':
        newRotation += 90;
        break;
      case 'flip-horizontal':
        // 实现水平翻转
        break;
    }

    this.currentElement.style.transform = `rotate(${newRotation}deg)`;
    if (this.rotationInput) {
      this.rotationInput.value = newRotation.toString();
    }

    this.notifyChange('rotation', newRotation);
  }

  /**
   * 从 transform 中提取旋转角度
   */
  extractRotationFromTransform(transform) {
    const match = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
    return match ? parseFloat(match[1]) : 0;
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

    const rect = element.getBoundingClientRect();
    const styles = this.getElementStyles(element);

    // 更新位置值
    if (this.positionInputs.x) {
      this.positionInputs.x.value = this.formatPixelValue(rect.left);
    }
    if (this.positionInputs.y) {
      this.positionInputs.y.value = this.formatPixelValue(rect.top);
    }

    // 更新旋转值
    if (this.rotationInput) {
      const rotation = this.extractRotationFromTransform(styles.transform || '');
      this.rotationInput.value = rotation.toString();
    }
  }

  /**
   * 清空所有值
   */
  clearValues() {
    if (this.positionInputs.x) this.positionInputs.x.value = '0';
    if (this.positionInputs.y) this.positionInputs.y.value = '0';
    if (this.rotationInput) this.rotationInput.value = '0';
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