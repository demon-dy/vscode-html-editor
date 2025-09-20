/**
 * 定位设置区域 - 处理元素的定位类型和位置值
 */
window.WVE = window.WVE || {};
window.WVE.PositionSection = class PositionSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '定位设置 Position Settings',
      collapsed: false,
      className: 'position-section',
      ...options
    });

    this.currentElement = null;
    this.currentPosition = 'static'; // static, relative, absolute, fixed, sticky

    // 位置值状态
    this.positionValues = {
      top: '',
      right: '',
      bottom: '',
      left: ''
    };

    // 防抖同步机制
    this.syncDebounceTimer = null;
    this.syncDebounceDelay = 300; // 300ms 防抖延迟

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

    this.onPositionChange = null; // 定位变更回调

    // 选择状态保护相关
    this.preservedSelection = null; // 保存的选择状态
    this.restoreAttemptTimers = []; // 恢复尝试的定时器数组
    this.selectionRestoreListener = null; // 选择恢复监听器
    this.domObserver = null; // DOM变化观察器
    this.continuousMonitorInterval = null; // 持续监控间隔器
  }

  /**
   * 重写 createElement 方法以注入样式到 Shadow DOM
   */
  createElement() {
    const element = super.createElement();

    // 在元素创建完成后注入样式到 Shadow DOM
    this.injectStyles();

    return element;
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 创建定位类型选择器
    this.createPositionSelector(container);

    // 创建位置设置控件
    this.createPositionValues(container);

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

  createPositionValues(container) {
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'position-values-container';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '位置设置 Position Values';

    // 位置控件网格容器
    const valuesGrid = document.createElement('div');
    valuesGrid.className = 'position-values-grid';

    // 创建四个方向的输入控件
    const directions = [
      { key: 'top', label: '上', icon: 'arrow-up' },
      { key: 'right', label: '右', icon: 'arrow-right' },
      { key: 'bottom', label: '下', icon: 'arrow-down' },
      { key: 'left', label: '左', icon: 'arrow-left' }
    ];

    directions.forEach(direction => {
      const inputGroup = this.createPositionInput(direction);
      valuesGrid.appendChild(inputGroup);
    });

    // 快捷值按钮
    const quickValues = document.createElement('div');
    quickValues.className = 'position-quick-values';

    const quickButtons = [
      { label: 'Auto', value: 'auto' },
      { label: '0', value: '0px' },
      { label: '50%', value: '50%' },
      { label: 'Clear', value: '' }
    ];

    quickButtons.forEach(btn => {
      const button = document.createElement('button');
      button.className = 'quick-value-btn';
      button.textContent = btn.label;
      button.onclick = () => this.applyQuickValue(btn.value);
      quickValues.appendChild(button);
    });

    sectionContainer.appendChild(title);
    sectionContainer.appendChild(valuesGrid);
    sectionContainer.appendChild(quickValues);
    container.appendChild(sectionContainer);

    // 保存容器引用用于显示/隐藏
    this.positionValuesContainer = sectionContainer;

    // 初始状态：static 时隐藏
    this.updatePositionValuesVisibility();
  }

  createPositionInput(direction) {
    const group = document.createElement('div');
    group.className = 'position-input-group';

    // 图标和标签
    const label = document.createElement('div');
    label.className = 'position-input-label';
    label.innerHTML = `
      <i data-lucide="${direction.icon}" class="position-icon w-4 h-4"></i>
      <span class="position-label-text">${direction.label}</span>
    `;

    // 输入控件容器
    const inputContainer = document.createElement('div');
    inputContainer.className = 'position-input-container';

    // 数值输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'position-input';
    input.placeholder = 'auto';
    input.dataset.direction = direction.key;
    input.addEventListener('change', (e) => {
      this.updatePositionValue(direction.key, e.target.value);
    });

    // 单位选择器
    const unitSelect = document.createElement('select');
    unitSelect.className = 'position-unit-select';
    const units = ['px', '%', 'em', 'rem', 'vw', 'vh'];
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      unitSelect.appendChild(option);
    });
    unitSelect.addEventListener('change', (e) => {
      this.updatePositionValue(direction.key, input.value, e.target.value);
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(unitSelect);

    group.appendChild(label);
    group.appendChild(inputContainer);

    // 保存输入控件引用
    if (!this.positionInputs) {
      this.positionInputs = {};
    }
    this.positionInputs[direction.key] = { input, unitSelect };

    return group;
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

  /**
   * 更新位置值显示/隐藏状态
   */
  updatePositionValuesVisibility() {
    if (!this.positionValuesContainer) {
      return;
    }

    // static 定位时隐藏位置设置
    if (this.currentPosition === 'static') {
      this.positionValuesContainer.style.display = 'none';
    } else {
      this.positionValuesContainer.style.display = 'block';
    }
  }

  /**
   * 更新位置值
   */
  updatePositionValue(direction, value, unit = null) {
    if (!this.currentElement) {
      return;
    }

    // 处理数值和单位
    let finalValue = value;

    // 如果值为空字符串，直接设为空（用于清除）
    if (value === '') {
      finalValue = '';
    } else if (value && value !== 'auto') {
      // 如果没有指定单位，使用选择的单位
      if (unit) {
        finalValue = value + unit;
      } else if (!/^(auto|inherit|initial|unset)$/.test(value) && !/\d+(px|%|em|rem|vw|vh)$/.test(value)) {
        // 如果值不包含单位且不是关键字，添加默认单位 px
        const unitSelect = this.positionInputs[direction]?.unitSelect;
        const defaultUnit = unitSelect?.value || 'px';
        finalValue = value + defaultUnit;
      }
    }

    // 更新状态
    this.positionValues[direction] = finalValue;

    // 应用到元素
    console.log(`[PositionSection] Applying ${direction}: ${finalValue} to element`);
    this.applyPositionToElement();
  }

  /**
   * 应用快捷值到所有方向
   */
  applyQuickValue(value) {
    if (!this.positionInputs) {
      return;
    }

    Object.keys(this.positionInputs).forEach(direction => {
      const input = this.positionInputs[direction].input;
      input.value = value;
      this.updatePositionValue(direction, value);
    });
  }

  /**
   * 应用位置值到元素
   */
  applyPositionToElement() {
    if (!this.currentElement) {
      return;
    }

    const element = this.currentElement;

    // 清除前一个位置样式
    this.clearPositionValueStyles(element);

    // 构建新的 Tailwind 位置类
    const appliedClasses = this.buildPositionTailwindClasses();

    console.log(`[PositionSection] Applying position value classes:`, appliedClasses);

    // 应用新的位置类
    if (appliedClasses.length > 0) {
      this.layoutAdapter.applyClasses(element, appliedClasses);
    }

    // 获取应用后的完整class属性值
    const finalClasses = element.className;

    // 使用防抖机制同步到 HTML 文件
    this.debouncedSyncToHTMLFile(element, finalClasses, 'position-values');

    console.log(`[PositionSection] Position values applied with final classes:`, finalClasses);
  }

  /**
   * 构建位置值的 Tailwind 类
   */
  buildPositionTailwindClasses() {
    const classes = [];

    Object.entries(this.positionValues).forEach(([direction, value]) => {
      if (value && value !== '') {
        const tailwindClass = this.convertToTailwindPositionClass(direction, value);
        if (tailwindClass) {
          classes.push(tailwindClass);
        }
      }
    });

    return classes;
  }

  /**
   * 将位置值转换为 Tailwind 类
   */
  convertToTailwindPositionClass(direction, value) {
    // 处理不同的值格式
    if (value === 'auto') {
      return `${direction}-auto`;
    }

    // 处理数值+单位的情况
    const match = value.match(/^(.+?)(px|%|em|rem|vw|vh)$/);
    if (match) {
      const num = match[1];
      const unit = match[2];

      // 处理像素值
      if (unit === 'px') {
        const pixels = parseFloat(num);

        // 常用的像素值映射到 Tailwind spacing scale
        const pixelMap = {
          '0': '0',
          '1': '0.5',
          '2': '0.5',
          '4': '1',
          '6': '1.5',
          '8': '2',
          '10': '2.5',
          '12': '3',
          '16': '4',
          '20': '5',
          '24': '6',
          '28': '7',
          '32': '8',
          '36': '9',
          '40': '10',
          '44': '11',
          '48': '12',
          '56': '14',
          '64': '16',
          '80': '20',
          '96': '24',
          '112': '28',
          '128': '32'
        };

        if (pixelMap[pixels]) {
          return `${direction}-${pixelMap[pixels]}`;
        } else {
          // 对于不在标准 spacing scale 中的值，使用任意值语法
          return `${direction}-[${value}]`;
        }
      }

      // 处理百分比值
      if (unit === '%') {
        const percent = parseFloat(num);
        const percentMap = {
          '0': '0',
          '25': '1/4',
          '50': '1/2',
          '75': '3/4',
          '100': 'full'
        };

        if (percentMap[percent]) {
          return `${direction}-${percentMap[percent]}`;
        } else {
          return `${direction}-[${value}]`;
        }
      }

      // 其他单位使用任意值语法
      return `${direction}-[${value}]`;
    }

    // 处理纯数字（添加px单位）
    if (/^\d+$/.test(value)) {
      return this.convertToTailwindPositionClass(direction, value + 'px');
    }

    // 处理其他关键字或无法识别的值
    return `${direction}-[${value}]`;
  }

  /**
   * 清除位置值相关的样式
   */
  clearPositionValueStyles(element) {
    console.log(`[PositionSection] Clearing position value styles from element:`, element);

    // 获取所有位置相关的类名模式
    const positionClassPatterns = [
      /^(top|right|bottom|left)-.+$/,
      /^-?(top|right|bottom|left)-.+$/
    ];

    const classesToRemove = [];
    element.classList.forEach(className => {
      if (positionClassPatterns.some(pattern => pattern.test(className))) {
        classesToRemove.push(className);
      }
    });

    classesToRemove.forEach(className => {
      element.classList.remove(className);
    });

    console.log(`[PositionSection] Removed position classes:`, classesToRemove);
  }

  /**
   * 防抖同步到 HTML 文件
   */
  debouncedSyncToHTMLFile(element, finalClasses, changeType) {
    // 清除之前的定时器
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    // 设置新的防抖定时器
    this.syncDebounceTimer = setTimeout(() => {
      this.syncToHTMLFile(element, finalClasses, changeType);
      this.syncDebounceTimer = null;
    }, this.syncDebounceDelay);

    console.log(`[PositionSection] Debounced sync scheduled for ${this.syncDebounceDelay}ms`);
  }

  /**
   * 从元素检测位置值
   */
  detectPositionValuesFromElement(element) {
    if (!element) {
      return { top: '', right: '', bottom: '', left: '' };
    }

    const values = { top: '', right: '', bottom: '', left: '' };
    const directions = ['top', 'right', 'bottom', 'left'];

    // 首先从 Tailwind 类名中检测
    directions.forEach(direction => {
      const detectedValue = this.detectPositionValueFromClasses(element, direction);
      if (detectedValue) {
        values[direction] = detectedValue;
      }
    });

    // 如果没有找到 Tailwind 类，回退到计算样式检测
    directions.forEach(direction => {
      if (!values[direction]) {
        const style = window.getComputedStyle(element);
        const value = style[direction];
        if (value && value !== 'auto' && value !== '0px') {
          values[direction] = value;
        }
      }
    });

    return values;
  }

  /**
   * 从元素的类名中检测位置值
   */
  detectPositionValueFromClasses(element, direction) {
    const classList = Array.from(element.classList);

    // 查找位置相关的类名
    for (const className of classList) {
      const positionValue = this.parsePositionClassToValue(className, direction);
      if (positionValue) {
        return positionValue;
      }
    }

    return null;
  }

  /**
   * 解析位置类名为具体值
   */
  parsePositionClassToValue(className, direction) {
    // 匹配标准格式：top-4, right-1/2, left-auto 等
    const standardPattern = new RegExp(`^${direction}-(.+)$`);
    const match = className.match(standardPattern);

    if (!match) {
      return null;
    }

    const suffix = match[1];

    // 处理 auto
    if (suffix === 'auto') {
      return 'auto';
    }

    // 处理任意值：top-[20px], right-[10%] 等
    const arbitraryMatch = suffix.match(/^\[(.+)\]$/);
    if (arbitraryMatch) {
      return arbitraryMatch[1];
    }

    // 处理分数值
    const fractionMap = {
      '0': '0px',
      '1/4': '25%',
      '1/2': '50%',
      '3/4': '75%',
      'full': '100%'
    };

    if (fractionMap[suffix]) {
      return fractionMap[suffix];
    }

    // 处理 spacing scale（转换为像素值）
    const spacingMap = {
      '0': '0px',
      '0.5': '2px',
      '1': '4px',
      '1.5': '6px',
      '2': '8px',
      '2.5': '10px',
      '3': '12px',
      '4': '16px',
      '5': '20px',
      '6': '24px',
      '7': '28px',
      '8': '32px',
      '9': '36px',
      '10': '40px',
      '11': '44px',
      '12': '48px',
      '14': '56px',
      '16': '64px',
      '20': '80px',
      '24': '96px',
      '28': '112px',
      '32': '128px'
    };

    if (spacingMap[suffix]) {
      return spacingMap[suffix];
    }

    // 其他无法识别的后缀，返回null
    return null;
  }

  /**
   * 更新位置输入控件的值
   */
  updatePositionInputs() {
    if (!this.positionInputs) {
      return;
    }

    Object.entries(this.positionValues).forEach(([direction, value]) => {
      const controls = this.positionInputs[direction];
      if (!controls) {
        return;
      }

      const { input, unitSelect } = controls;

      if (value && value !== '') {
        // 解析值和单位
        const match = value.match(/^(.+?)(px|%|em|rem|vw|vh)$/);
        if (match) {
          input.value = match[1];
          unitSelect.value = match[2];
        } else {
          input.value = value;
        }
      } else {
        input.value = '';
      }
    });
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

    console.log(`[PositionSection] Switching position from ${prevPosition} to ${positionKey}`);

    // 更新UI状态
    this.updatePositionButtons();
    this.updatePositionValuesVisibility();

    // 应用定位类型到当前元素
    if (this.currentElement) {
      console.log(`[PositionSection] Applying ${positionKey} position to element`);
      this.applyPositionTypeToElement(positionKey, prevPosition);
    }

    // 触发定位变更事件
    if (this.onPositionChange) {
      this.onPositionChange(positionKey, prevPosition, this.currentElement);
    }

    // 通知外部系统
    this.dispatchPositionChangeEvent(positionKey, prevPosition);
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

  /**
   * 将定位类型应用到元素
   */
  applyPositionTypeToElement(newPosition, prevPosition) {
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

    console.log(`[PositionSection] Position ${newPosition} applied`);
  }

  clearPositionStyles(element, position) {
    console.log(`[PositionSection] Clearing ${position} position styles from element:`, element);

    // 移除所有定位相关的类名
    const positionClasses = ['static', 'relative', 'absolute', 'fixed', 'sticky'];
    positionClasses.forEach(className => {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    });

    console.log(`[PositionSection] Cleared ${position} position styles`);
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
   * 更新组件以匹配当前元素
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    console.log(`[PositionSection] Update called with element:`, element);

    if (element) {
      // 检测元素的当前定位类型
      const detectedPosition = this.detectPositionFromElement(element);

      console.log(`[PositionSection] Detected position: ${detectedPosition}`);

      let updated = false;

      // 更新定位类型
      if (detectedPosition !== this.currentPosition) {
        this.currentPosition = detectedPosition;
        this.updatePositionButtons();
        this.updatePositionValuesVisibility();
        updated = true;
      }

      // 更新位置值
      const detectedPositionValues = this.detectPositionValuesFromElement(element);
      this.positionValues = detectedPositionValues;
      this.updatePositionInputs();
    } else {
      console.log(`[PositionSection] No element provided to update`);
    }
  }

  /**
   * 同步变更到 HTML 文件
   */
  syncToHTMLFile(element, finalClasses, changeType) {
    console.log(`[PositionSection] Syncing ${changeType} change to HTML file`);
    console.log(`[PositionSection] Element:`, element);
    console.log(`[PositionSection] Final classes:`, finalClasses);

    try {
      // 使用 Tailwind 样式变更数据
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

      console.log(`[PositionSection] Sending tailwindStyleChange message:`, changeData);

      // 发送到扩展进行同步
      if (typeof vscode !== 'undefined' && vscode.postMessage) {
        vscode.postMessage({
          type: 'tailwindStyleChange',
          data: changeData
        });
        console.log(`[PositionSection] Message sent successfully`);

        // 检查是否启用了自动刷新模式，如果是则触发事件
        const app = window.WVE?.app?.();
        const floatingToolbar = app?.getFloatingToolbar?.();
        if (floatingToolbar && floatingToolbar.autoRefreshState === 'auto') {
          document.dispatchEvent(new CustomEvent('wve:styleChange', {
            detail: {
              type: 'tailwindStyleChange',
              data: changeData
            }
          }));
          console.log(`[PositionSection] Auto refresh event dispatched (auto mode enabled)`);
        } else {
          console.log(`[PositionSection] Auto refresh skipped (manual mode or toolbar unavailable)`);
        }
      } else {
        console.error(`[PositionSection] vscode.postMessage not available`);
      }
    } catch (error) {
      console.error(`[PositionSection] Error syncing to HTML file:`, error);
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

    // 策略3: 使用 nth-child 和父元素路径（精确定位）
    const nthChildSelector = this.generateNthChildSelector(element);
    if (nthChildSelector) {
      strategies.push({
        type: 'nth-child',
        selector: nthChildSelector
      });
    }

    return strategies;
  }

  /**
   * 生成基于 nth-child 的精确选择器
   */
  generateNthChildSelector(element) {
    try {
      const path = [];
      let current = element;

      // 向上遍历到body或html，构建路径
      while (current && current.tagName && current.tagName !== 'BODY' && current.tagName !== 'HTML') {
        const parent = current.parentElement;
        if (!parent) {
          break;
        }

        // 计算当前元素在同类型兄弟元素中的位置
        const siblings = Array.from(parent.children).filter(child =>
          child.tagName === current.tagName
        );

        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          path.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
        } else {
          path.unshift(current.tagName.toLowerCase());
        }

        current = parent;

        // 限制路径深度，避免过于复杂的选择器
        if (path.length >= 3) {
          break;
        }
      }

      return path.length > 0 ? path.join(' > ') : null;
    } catch (error) {
      console.warn('[PositionSection] Error generating nth-child selector:', error);
      return null;
    }
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
   * 获取当前定位类型
   */
  getCurrentPosition() {
    return this.currentPosition;
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
    // 在 Shadow DOM 中，需要将样式注入到元素容器中而不是 document.head
    if (this.element && this.element.querySelector('#position-section-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'position-section-styles';
    style.textContent = `
      .position-section .section-content {
        padding: 12px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      .position-selector-container {
        margin-bottom: 12px;
      }

      /* 位置设置控件样式 */
      .position-values-container {
        margin-bottom: 12px;
      }

      .position-values-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .position-input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .position-input-label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: #cccccc;
      }

      .position-icon {
        color: #999999;
      }

      .position-label-text {
        font-weight: 500;
      }

      .position-input-container {
        display: flex;
        align-items: center;
        gap: 0;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        overflow: hidden;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      .position-input {
        height: 22px;
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
        outline: none;
        width: 45px;
        box-sizing: border-box;
      }

      .position-input::placeholder {
        color: #666666;
      }

      .position-unit-select {
        height: 22px;
        background: #2c2c2c;
        border: none;
        border-left: 1px solid #404040;
        color: #cccccc;
        font-size: 9px;
        padding: 0 2px;
        outline: none;
        cursor: pointer;
        flex-shrink: 0;
        width: 42px;
        min-width: 32px;
        box-sizing: border-box;
      }

      .position-unit-select:hover {
        background: #363636;
      }

      /* 快捷值按钮 */
      .position-quick-values {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
      }

      .quick-value-btn {
        height: 20px;
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #cccccc;
        font-size: 9px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .quick-value-btn:hover {
        background: #363636;
        border-color: #505050;
        color: #ffffff;
      }

      .quick-value-btn:active {
        background: #1e1e1e;
        transform: translateY(1px);
      }
    `;

    // 将样式添加到组件元素中以支持 Shadow DOM
    if (this.element) {
      this.element.appendChild(style);
    } else {
      // 回退到 document.head（非 Shadow DOM 环境）
      document.head.appendChild(style);
    }
  }

  /**
   * 清理资源，包括定时器和事件监听器
   */
  destroy() {
    // 清理防抖定时器
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }

    // 清理保存的选择状态
    this.currentElement = null;

    console.log(`[PositionSection] Resources cleaned up`);
  }
};