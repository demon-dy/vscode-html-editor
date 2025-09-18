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

    // 布局适配器相关
    this.layoutAdapter = null;
    this.uiManager = options.uiManager || null;
  }

  /**
   * 创建区域内容
   */
  createContentElements(container) {
    // 对齐按钮组
    this.createAlignmentSection(container);

    // 位置输入（包含约束设置）
    this.createPositionSection(container);

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
      { icon: 'align-center-horizontal', title: '水平居中', action: 'align-center-horizontal' },
      { icon: 'align-right', title: '右对齐', action: 'align-right' },
      { icon: 'align-top', title: '顶部对齐', action: 'align-top' },
      { icon: 'align-center-vertical', title: '垂直居中', action: 'align-center-vertical' },
      { icon: 'align-bottom', title: '底部对齐', action: 'align-bottom' },
      { icon: 'move-3d', title: '移动/分布', action: 'distribute' }
    ];

    const { group: buttonGroup } = this.controls.createButtonGroup(
      alignmentButtons.map(button => ({
        ...button,
        size: 16,
        onClick: () => this.handleAlignment(button.action)
      })),
      { multiSelect: false, gap: 1 }
    );

    // 设置按钮组样式
    buttonGroup.style.cssText = `
      display: flex;
      gap: 1px;
      background: #1e1e1e;
      border: 1px solid #404040;
      border-radius: 3px;
      padding: 2px;
    `;

    group.appendChild(buttonGroup);
    container.appendChild(group);

    this.alignmentButtons = buttonGroup;

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(buttonGroup);
    }, 0);
  }

  /**
   * 创建位置输入区域
   */
  createPositionSection(container) {
    const group = this.createGroup('Position');

    // 位置输入行容器
    const positionRow = document.createElement('div');
    positionRow.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    `;

    // X Y 输入框
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

    // 约束图标按钮
    const constraintButton = document.createElement('button');
    constraintButton.className = 'constraint-toggle-btn';
    constraintButton.style.cssText = `
      width: 16px;
      height: 16px;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #cccccc;
    `;

    const constraintIcon = document.createElement('i');
    constraintIcon.className = 'wve-icon';
    constraintIcon.setAttribute('data-lucide', 'link');
    constraintIcon.style.cssText = `
      width: 14px;
      height: 14px;
    `;

    constraintButton.appendChild(constraintIcon);

    // 约束展开状态
    this.constraintsExpanded = false;
    constraintButton.addEventListener('click', () => {
      this.toggleConstraintsVisibility();
    });

    positionRow.appendChild(xInput);
    positionRow.appendChild(yInput);
    positionRow.appendChild(constraintButton);

    group.appendChild(positionRow);

    // 约束设置区域（初始隐藏）
    this.constraintsContainer = document.createElement('div');
    this.constraintsContainer.style.cssText = `
      display: none;
      margin-top: 8px;
    `;
    this.createConstraintsContent(this.constraintsContainer);
    group.appendChild(this.constraintsContainer);

    container.appendChild(group);

    this.positionInputs.x = xInput.querySelector('input');
    this.positionInputs.y = yInput.querySelector('input');
    this.constraintToggleBtn = constraintButton;

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(constraintButton);
    }, 0);
  }

  /**
   * 创建约束设置区域
   */
  createConstraintsSection() {
    // 这个方法现在被 createConstraintsContent 替代
    // 约束设置已经整合到位置区域中
  }

  /**
   * 创建约束内容
   */
  createConstraintsContent(container) {
    // 约束可视化控件
    const constraintsWidget = this.createConstraintsWidget();
    container.appendChild(constraintsWidget);
  }

  /**
   * 切换约束区域显示隐藏
   */
  toggleConstraintsVisibility() {
    this.constraintsExpanded = !this.constraintsExpanded;

    if (this.constraintsContainer) {
      this.constraintsContainer.style.display = this.constraintsExpanded ? 'block' : 'none';
    }

    // 更新按钮状态
    if (this.constraintToggleBtn) {
      this.constraintToggleBtn.style.background = this.constraintsExpanded ? '#0078d4' : '#2d2d2d';
    }
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
      gap: 8px;
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
      width: '80px'
    });

    // 中间约束可视化图标
    const constraintViz = document.createElement('div');
    constraintViz.className = 'constraint-visualization';
    constraintViz.style.cssText = `
      width: 60px;
      height: 40px;
      background: #1e1e1e;
      border: 1px solid #404040;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
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
      width: '80px'
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
      width: 16px;
      height: 12px;
      background: #666666;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;

    // 约束线条
    const lines = {
      top: this.createConstraintLine('horizontal', '8px', '22px', '16px'),
      bottom: this.createConstraintLine('horizontal', '24px', '22px', '16px'),
      left: this.createConstraintLine('vertical', '14px', '8px', '12px'),
      right: this.createConstraintLine('vertical', '14px', '40px', '12px')
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
      { name: 'top', x: 30, y: 4, line: lines.top },
      { name: 'bottom', x: 30, y: 28, line: lines.bottom },
      { name: 'left', x: 4, y: 20, line: lines.left },
      { name: 'right', x: 44, y: 20, line: lines.right }
    ];

    positions.forEach(pos => {
      const control = document.createElement('div');
      control.className = `constraint-control constraint-${pos.name}`;
      control.style.cssText = `
        position: absolute;
        top: ${pos.y}px;
        left: ${pos.x}px;
        width: 10px;
        height: 10px;
        background: #0078d4;
        border: 2px solid #ffffff;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -50%);
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

    // 旋转图标容器
    const rotationIconContainer = document.createElement('div');
    rotationIconContainer.style.cssText = `
      width: 16px;
      height: 16px;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #cccccc;
      flex-shrink: 0;
    `;

    const rotationIcon = document.createElement('i');
    rotationIcon.className = 'wve-icon';
    rotationIcon.setAttribute('data-lucide', 'rotate-ccw');
    rotationIcon.style.cssText = `
      width: 18px;
      height: 18px;
    `;

    rotationIconContainer.appendChild(rotationIcon);

    // 角度输入
    const angleInput = this.createNumberInput('0', {
      onChange: (value) => this.handleRotationChange(value),
      suffix: '°',
      width: '60px'
    });

    // 旋转操作按钮
    const rotationButtons = [
      { icon: 'rotate-cw', title: '顺时针旋转90°', action: 'rotate-right' },
      { icon: 'flip-horizontal', title: '水平翻转', action: 'flip-horizontal' },
      { icon: 'flip-vertical', title: '垂直翻转', action: 'flip-vertical' }
    ];

    const { group: buttonGroup } = this.controls.createButtonGroup(
      rotationButtons.map(button => ({
        ...button,
        size: 16,
        onClick: () => this.handleRotationAction(button.action)
      })),
      { multiSelect: false, gap: 1 }
    );

    // 设置按钮组样式
    buttonGroup.style.cssText = `
      display: flex;
      gap: 1px;
      background: #1e1e1e;
      border: 1px solid #404040;
      border-radius: 3px;
      padding: 2px;
    `;

    rotationRow.appendChild(rotationIconContainer);
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
   * 处理对齐操作 - 使用智能布局适配器
   */
  handleAlignment(action) {
    if (!this.currentElement) {
      return;
    }

    this.logger.info('Applying alignment:', action);

    // 初始化布局适配器（如果还没有）
    if (!this.layoutAdapter) {
      // 调试：检查LayoutAdapter是否存在
      if (!window.WVE.LayoutAdapter) {
        this.logger.error('LayoutAdapter not found, available classes:', Object.keys(window.WVE || {}));
        throw new Error('LayoutAdapter class not loaded');
      }

      this.layoutAdapter = new window.WVE.LayoutAdapter(this.uiManager);
      this.logger.info('LayoutAdapter initialized successfully');
    }

    // 使用智能布局适配器处理对齐
    try {
      // 映射操作名称到布局适配器的方法
      const alignmentMap = {
        'align-left': 'left',
        'align-center-horizontal': 'center-horizontal',
        'align-right': 'right',
        'align-top': 'top',
        'align-center-vertical': 'center-vertical',
        'align-bottom': 'bottom',
        'distribute': 'distribute'
      };

      const alignmentType = alignmentMap[action];
      if (alignmentType) {
        if (alignmentType === 'distribute') {
          // 分布对齐需要特殊处理
          this.handleDistributeAlignment();
        } else {
          this.layoutAdapter.applyAlignment(this.currentElement, alignmentType);
        }
      }

      // 获取并显示布局建议
      this.showLayoutSuggestions();

    } catch (error) {
      this.logger.error('Failed to apply alignment:', error);
      // 回退到原始实现
      this.handleAlignmentFallback(action);
    }

    this.notifyChange('alignment', action);
  }

  /**
   * 处理分布对齐
   */
  handleDistributeAlignment() {
    if (!this.currentElement || !this.currentElement.parentElement) {
      return;
    }

    const parent = this.currentElement.parentElement;

    // 确保父容器是flex容器
    if (!parent.classList.contains('flex')) {
      parent.classList.add('flex');
    }

    // 移除冲突的对齐类
    const conflictingClasses = ['justify-start', 'justify-center', 'justify-end'];
    conflictingClasses.forEach(cls => parent.classList.remove(cls));

    // 添加分布对齐
    parent.classList.add('justify-between');

    this.logger.info('Applied distribute alignment to parent container');
  }

  /**
   * 显示布局建议
   */
  showLayoutSuggestions() {
    if (!this.layoutAdapter || !this.currentElement) {
      return;
    }

    const suggestions = this.layoutAdapter.suggestLayoutStrategy(this.currentElement);

    if (suggestions.length > 0) {
      this.logger.info('Layout suggestions:', suggestions);

      // 可以在UI中显示建议（暂时只记录）
      suggestions.forEach(suggestion => {
        this.logger.info(`Suggestion: ${suggestion.description}`);
      });
    }
  }

  /**
   * 回退到原始对齐实现
   */
  handleAlignmentFallback(action) {
    this.logger.info('Using fallback alignment implementation');

    // 移除之前的对齐类
    this.removeAlignmentClasses();

    // 根据对齐方式添加对应的 Tailwind 类
    switch (action) {
      case 'align-left':
        this.addAlignmentClass('justify-start');
        break;
      case 'align-center-horizontal':
        this.addAlignmentClass('justify-center');
        break;
      case 'align-right':
        this.addAlignmentClass('justify-end');
        break;
      case 'align-top':
        this.addAlignmentClass('items-start');
        break;
      case 'align-center-vertical':
        this.addAlignmentClass('items-center');
        break;
      case 'align-bottom':
        this.addAlignmentClass('items-end');
        break;
      case 'distribute':
        this.addAlignmentClass('justify-between');
        break;
    }

    // 确保父容器具有 flex 布局
    this.ensureFlexContainer();
  }

  /**
   * 移除所有对齐相关的类
   */
  removeAlignmentClasses() {
    const alignmentClasses = [
      'justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly',
      'items-start', 'items-center', 'items-end', 'items-stretch', 'items-baseline',
      'text-left', 'text-center', 'text-right'
    ];

    alignmentClasses.forEach(className => {
      this.currentElement.classList.remove(className);

      // 如果是父容器对齐，也需要处理父容器
      if (this.currentElement.parentElement) {
        this.currentElement.parentElement.classList.remove(className);
      }
    });
  }

  /**
   * 添加对齐类
   */
  addAlignmentClass(className) {
    // 对于水平对齐（justify-*），需要确保父容器有 flex 类
    if (className.startsWith('justify-')) {
      const parent = this.currentElement.parentElement;
      if (parent && !parent.classList.contains('flex')) {
        parent.classList.add('flex');
      }
      if (parent) {
        parent.classList.add(className);
      }
    }
    // 对于垂直对齐（items-*），也需要确保父容器有 flex 类
    else if (className.startsWith('items-')) {
      const parent = this.currentElement.parentElement;
      if (parent && !parent.classList.contains('flex')) {
        parent.classList.add('flex');
      }
      if (parent) {
        parent.classList.add(className);
      }
    }
    // 其他情况直接添加到元素本身
    else {
      this.currentElement.classList.add(className);
    }
  }

  /**
   * 确保容器具有 flex 布局
   */
  ensureFlexContainer() {
    const parent = this.currentElement.parentElement;
    if (parent && !parent.classList.contains('flex')) {
      parent.classList.add('flex');
    }
  }

  /**
   * 处理位置变更
   */
  handlePositionChange(property, value) {
    if (!this.currentElement) {
      return;
    }

    const numValue = parseFloat(value) || 0;

    // 移除之前的位置类
    this.removePositionClasses(property);

    // 根据属性类型添加对应的 Tailwind 类
    if (property === 'left') {
      this.addPositionClass('left', numValue);
    } else if (property === 'top') {
      this.addPositionClass('top', numValue);
    } else if (property === 'right') {
      this.addPositionClass('right', numValue);
    } else if (property === 'bottom') {
      this.addPositionClass('bottom', numValue);
    }

    // 确保元素有定位类
    this.ensurePositioning();

    this.notifyChange('position', { [property]: `${numValue}px` });
  }

  /**
   * 移除位置相关的类
   */
  removePositionClasses(property) {
    const positionClasses = this.getPositionClassesForProperty(property);
    positionClasses.forEach(className => {
      this.currentElement.classList.remove(className);
    });
  }

  /**
   * 获取特定属性的所有可能的位置类
   */
  getPositionClassesForProperty(property) {
    const commonValues = [
      '0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32', '40', '48', '56', '64',
      'px', '0.5', '1.5', '2.5', '3.5'
    ];

    const classes = [];
    commonValues.forEach(value => {
      classes.push(`${property}-${value}`);
      classes.push(`-${property}-${value}`); // 负值
    });

    return classes;
  }

  /**
   * 添加位置类
   */
  addPositionClass(property, value) {
    // 将像素值转换为最接近的 Tailwind 值
    const tailwindValue = this.convertToTailwindValue(value);

    if (tailwindValue !== null) {
      const className = value >= 0 ? `${property}-${tailwindValue}` : `-${property}-${Math.abs(tailwindValue)}`;
      this.currentElement.classList.add(className);
    } else {
      // 如果没有对应的 Tailwind 类，使用自定义 CSS 变量
      this.currentElement.style.setProperty(`--${property}`, `${value}px`);
      this.currentElement.classList.add(`position-custom-${property}`);

      // 添加自定义样式规则
      this.addCustomPositionStyle(property);
    }
  }

  /**
   * 将像素值转换为 Tailwind 值
   */
  convertToTailwindValue(pixels) {
    const tailwindMap = {
      0: '0',
      1: 'px',
      2: '0.5',
      4: '1',
      6: '1.5',
      8: '2',
      10: '2.5',
      12: '3',
      14: '3.5',
      16: '4',
      20: '5',
      24: '6',
      28: '7',
      32: '8',
      36: '9',
      40: '10',
      44: '11',
      48: '12',
      56: '14',
      64: '16',
      80: '20',
      96: '24',
      112: '28',
      128: '32'
    };

    return tailwindMap[Math.abs(pixels)] || null;
  }

  /**
   * 添加自定义位置样式
   */
  addCustomPositionStyle(property) {
    const styleId = `custom-position-${property}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `.position-custom-${property} { ${property}: var(--${property}) !important; }`;
      document.head.appendChild(style);
    }
  }

  /**
   * 确保元素有定位属性
   */
  ensurePositioning() {
    const positionClasses = ['relative', 'absolute', 'fixed', 'sticky'];
    const hasPosition = positionClasses.some(cls => this.currentElement.classList.contains(cls));

    if (!hasPosition) {
      this.currentElement.classList.add('relative');
    }
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
    if (!this.currentElement) {
      return;
    }

    const angle = parseFloat(value) || 0;

    // 移除之前的旋转类
    this.removeRotationClasses();

    // 添加新的旋转类
    this.addRotationClass(angle);

    this.notifyChange('rotation', angle);
  }

  /**
   * 处理旋转操作
   */
  handleRotationAction(action) {
    if (!this.currentElement) {
      return;
    }

    const currentRotation = this.extractCurrentRotation();

    switch (action) {
      case 'rotate-left':
        const newLeftRotation = currentRotation - 90;
        this.removeRotationClasses();
        this.addRotationClass(newLeftRotation);
        if (this.rotationInput) {
          this.rotationInput.value = newLeftRotation.toString();
        }
        this.notifyChange('rotation', newLeftRotation);
        break;

      case 'rotate-right':
        const newRightRotation = currentRotation + 90;
        this.removeRotationClasses();
        this.addRotationClass(newRightRotation);
        if (this.rotationInput) {
          this.rotationInput.value = newRightRotation.toString();
        }
        this.notifyChange('rotation', newRightRotation);
        break;

      case 'flip-horizontal':
        this.toggleFlipClass('scale-x-[-1]');
        this.notifyChange('rotation', 'flip-horizontal');
        break;

      case 'flip-vertical':
        this.toggleFlipClass('scale-y-[-1]');
        this.notifyChange('rotation', 'flip-vertical');
        break;
    }
  }

  /**
   * 移除旋转相关的类
   */
  removeRotationClasses() {
    const rotationClasses = [
      'rotate-0', 'rotate-1', 'rotate-2', 'rotate-3', 'rotate-6', 'rotate-12', 'rotate-45', 'rotate-90', 'rotate-180',
      '-rotate-1', '-rotate-2', '-rotate-3', '-rotate-6', '-rotate-12', '-rotate-45', '-rotate-90', '-rotate-180',
      'transform'
    ];

    // 移除自定义旋转类
    const customRotationClasses = Array.from(this.currentElement.classList).filter(cls =>
      cls.startsWith('rotate-custom-') || cls === 'transform'
    );

    [...rotationClasses, ...customRotationClasses].forEach(className => {
      this.currentElement.classList.remove(className);
    });
  }

  /**
   * 添加旋转类
   */
  addRotationClass(angle) {
    // 确保有 transform 基础类
    this.currentElement.classList.add('transform');

    // 将角度标准化到 0-359 范围
    const normalizedAngle = ((angle % 360) + 360) % 360;

    // 映射到 Tailwind 的预定义旋转类
    const tailwindRotations = {
      0: 'rotate-0',
      1: 'rotate-1',
      2: 'rotate-2',
      3: 'rotate-3',
      6: 'rotate-6',
      12: 'rotate-12',
      45: 'rotate-45',
      90: 'rotate-90',
      180: 'rotate-180'
    };

    if (tailwindRotations[normalizedAngle]) {
      this.currentElement.classList.add(tailwindRotations[normalizedAngle]);
    } else {
      // 对于非标准角度，使用自定义 CSS 变量
      this.currentElement.style.setProperty('--rotate-angle', `${normalizedAngle}deg`);
      this.currentElement.classList.add('rotate-custom');

      // 添加自定义样式规则
      this.addCustomRotationStyle();
    }
  }

  /**
   * 切换翻转类
   */
  toggleFlipClass(flipClass) {
    this.currentElement.classList.add('transform');

    if (this.currentElement.classList.contains(flipClass)) {
      this.currentElement.classList.remove(flipClass);
    } else {
      this.currentElement.classList.add(flipClass);
    }
  }

  /**
   * 添加自定义旋转样式
   */
  addCustomRotationStyle() {
    const styleId = 'custom-rotation-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `.rotate-custom { transform: rotate(var(--rotate-angle)) !important; }`;
      document.head.appendChild(style);
    }
  }

  /**
   * 提取当前旋转角度
   */
  extractCurrentRotation() {
    // 首先检查 Tailwind 类
    const classList = Array.from(this.currentElement.classList);

    for (const className of classList) {
      if (className.startsWith('rotate-')) {
        const angle = this.getTailwindRotationAngle(className);
        if (angle !== null) {
          return angle;
        }
      }
    }

    // 检查自定义 CSS 变量
    const customAngle = this.currentElement.style.getPropertyValue('--rotate-angle');
    if (customAngle) {
      return parseFloat(customAngle) || 0;
    }

    // 最后检查内联样式（向后兼容）
    const transform = this.currentElement.style.transform || '';
    return this.extractRotationFromTransform(transform);
  }

  /**
   * 获取 Tailwind 旋转类对应的角度
   */
  getTailwindRotationAngle(className) {
    const angleMap = {
      'rotate-0': 0,
      'rotate-1': 1,
      'rotate-2': 2,
      'rotate-3': 3,
      'rotate-6': 6,
      'rotate-12': 12,
      'rotate-45': 45,
      'rotate-90': 90,
      'rotate-180': 180,
      '-rotate-1': -1,
      '-rotate-2': -2,
      '-rotate-3': -3,
      '-rotate-6': -6,
      '-rotate-12': -12,
      '-rotate-45': -45,
      '-rotate-90': -90,
      '-rotate-180': -180
    };

    return angleMap[className] || null;
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

    const styles = this.getElementStyles(element);

    // 更新位置值 - 从计算样式或类中获取
    if (this.positionInputs.x) {
      const leftValue = this.extractPositionValue('left', element, styles);
      this.positionInputs.x.value = leftValue.toString();
    }
    if (this.positionInputs.y) {
      const topValue = this.extractPositionValue('top', element, styles);
      this.positionInputs.y.value = topValue.toString();
    }

    // 更新旋转值 - 从类或样式中获取
    if (this.rotationInput) {
      const rotation = this.extractCurrentRotation();
      this.rotationInput.value = rotation.toString();
    }
  }

  /**
   * 从元素中提取位置值
   */
  extractPositionValue(property, element, styles) {
    // 首先检查 Tailwind 类
    const classList = Array.from(element.classList);
    for (const className of classList) {
      if (className.startsWith(`${property}-`) || className.startsWith(`-${property}-`)) {
        const value = this.parseTailwindPositionClass(className);
        if (value !== null) {
          return value;
        }
      }
    }

    // 检查自定义 CSS 变量
    const customValue = element.style.getPropertyValue(`--${property}`);
    if (customValue) {
      return parseFloat(customValue) || 0;
    }

    // 最后检查计算样式
    const computedValue = styles[property];
    if (computedValue && computedValue !== 'auto') {
      return parseFloat(computedValue) || 0;
    }

    return 0;
  }

  /**
   * 解析 Tailwind 位置类获取像素值
   */
  parseTailwindPositionClass(className) {
    // 处理负值
    const isNegative = className.startsWith('-');
    const cleanClassName = isNegative ? className.substring(1) : className;

    // 提取数值部分
    const match = cleanClassName.match(/^(left|right|top|bottom)-(.+)$/);
    if (!match) {
      return null;
    }

    const [, , value] = match;

    // 将 Tailwind 值转换为像素
    const pixelValue = this.convertTailwindValueToPixels(value);
    return pixelValue !== null ? (isNegative ? -pixelValue : pixelValue) : null;
  }

  /**
   * 将 Tailwind 值转换为像素
   */
  convertTailwindValueToPixels(value) {
    const pixelMap = {
      '0': 0,
      'px': 1,
      '0.5': 2,
      '1': 4,
      '1.5': 6,
      '2': 8,
      '2.5': 10,
      '3': 12,
      '3.5': 14,
      '4': 16,
      '5': 20,
      '6': 24,
      '7': 28,
      '8': 32,
      '9': 36,
      '10': 40,
      '11': 44,
      '12': 48,
      '14': 56,
      '16': 64,
      '20': 80,
      '24': 96,
      '28': 112,
      '32': 128
    };

    return pixelMap[value] || null;
  }

  /**
   * 清空所有值
   */
  clearValues() {
    if (this.positionInputs.x) {
      this.positionInputs.x.value = '0';
    }
    if (this.positionInputs.y) {
      this.positionInputs.y.value = '0';
    }
    if (this.rotationInput) {
      this.rotationInput.value = '0';
    }
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