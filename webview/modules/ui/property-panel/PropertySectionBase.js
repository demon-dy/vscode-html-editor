/**
 * 属性面板区域基础类 - Figma 风格折叠区域
 */
window.WVE = window.WVE || {};
window.WVE.PropertySectionBase = class PropertySectionBase {
  constructor(options = {}) {
    this.title = options.title || '';
    this.collapsed = options.collapsed || false;
    this.showToggle = options.showToggle !== false; // 默认显示折叠切换
    this.className = options.className || '';
    this.actions = options.actions || []; // 标题栏右侧操作按钮

    this.element = null;
    this.header = null;
    this.content = null;
    this.toggleButton = null;

    this.logger = new window.WVE.Logger(this.constructor.name);
    this.controls = window.WVE.PropertyControls;
  }

  /**
   * 创建区域元素
   */
  createElement() {
    const section = document.createElement('div');
    section.className = `property-section ${this.className}`;
    section.style.cssText = `
      border-bottom: 1px solid #404040;
      background: #2c2c2c;
    `;

    // 创建标题栏
    this.createHeader(section);

    // 创建内容区域
    this.createContent(section);

    this.element = section;
    this.applyCollapsedState();

    return section;
  }

  /**
   * 创建标题栏
   */
  createHeader(parent) {
    const header = document.createElement('div');
    header.className = 'section-header';
    header.style.cssText = `
      height: 32px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #383838;
      cursor: ${this.showToggle ? 'pointer' : 'default'};
      user-select: none;
    `;

    // 左侧：标题和折叠按钮
    const leftGroup = document.createElement('div');
    leftGroup.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    if (this.showToggle) {
      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = 'section-toggle';
      toggleButton.style.cssText = `
        background: transparent;
        border: none;
        color: #cccccc;
        font-size: 10px;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        transition: transform 0.2s;
        transform: ${this.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
      `;
      toggleButton.innerHTML = '▼';
      this.toggleButton = toggleButton;

      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      leftGroup.appendChild(toggleButton);
    }

    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = this.title;
    title.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: #ffffff;
    `;

    leftGroup.appendChild(title);

    // 右侧：操作按钮
    const rightGroup = document.createElement('div');
    rightGroup.className = 'section-actions';
    rightGroup.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    this.actions.forEach(action => {
      const button = this.controls.createIconButton({
        icon: action.icon,
        title: action.title,
        size: 16,
        onClick: action.onClick
      });
      rightGroup.appendChild(button);
    });

    header.appendChild(leftGroup);
    header.appendChild(rightGroup);

    // 点击标题栏切换折叠状态
    if (this.showToggle) {
      header.addEventListener('click', () => {
        this.toggle();
      });
    }

    parent.appendChild(header);
    this.header = header;

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(header);
    }, 0);
  }

  /**
   * 创建内容区域
   */
  createContent(parent) {
    const content = document.createElement('div');
    content.className = 'section-content';
    content.style.cssText = `
      padding: 12px;
      background: #2c2c2c;
    `;

    parent.appendChild(content);
    this.content = content;

    // 调用子类实现的内容创建方法
    this.createContentElements(content);
  }

  /**
   * 子类需要重写此方法来创建具体内容
   */
  createContentElements(container) {
    // 子类实现
    const placeholder = document.createElement('div');
    placeholder.textContent = '子类需要实现 createContentElements 方法';
    placeholder.style.color = '#999';
    container.appendChild(placeholder);
  }

  /**
   * 切换折叠状态
   */
  toggle() {
    if (!this.showToggle) return;

    this.collapsed = !this.collapsed;
    this.applyCollapsedState();
    this.onToggle(this.collapsed);
  }

  /**
   * 设置折叠状态
   */
  setCollapsed(collapsed) {
    if (!this.showToggle) return;

    this.collapsed = collapsed;
    this.applyCollapsedState();
    this.onToggle(this.collapsed);
  }

  /**
   * 应用折叠状态
   */
  applyCollapsedState() {
    if (!this.content || !this.toggleButton) return;

    // 瞬时显示/隐藏，无动画效果（Figma风格）
    this.content.style.display = this.collapsed ? 'none' : 'block';

    if (this.toggleButton) {
      this.toggleButton.style.transform = this.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    }

    if (this.element) {
      this.element.classList.toggle('collapsed', this.collapsed);
    }
  }

  /**
   * 折叠状态改变回调 - 子类可重写
   */
  onToggle(collapsed) {
    this.logger.debug(`Section ${this.title} ${collapsed ? 'collapsed' : 'expanded'}`);
  }

  /**
   * 更新内容 - 子类可重写
   */
  update(element) {
    this.logger.debug(`Updating section ${this.title} for element:`, element);
  }

  /**
   * 显示区域
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  /**
   * 隐藏区域
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * 销毁区域
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.header = null;
    this.content = null;
    this.toggleButton = null;
  }

  /**
   * 添加子区域或控件
   */
  appendChild(child) {
    if (this.content) {
      this.content.appendChild(child);
    }
  }

  /**
   * 创建分组容器
   */
  createGroup(title = '') {
    const group = document.createElement('div');
    group.className = 'control-group';
    group.style.cssText = `
      margin-bottom: 12px;
    `;

    if (title) {
      const groupTitle = document.createElement('div');
      groupTitle.className = 'group-title';
      groupTitle.textContent = title;
      groupTitle.style.cssText = `
        font-size: 10px;
        color: #999999;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      group.appendChild(groupTitle);
    }

    return group;
  }

  /**
   * 获取元素的计算样式
   */
  getElementStyles(element) {
    if (!element) return null;
    return window.getComputedStyle(element);
  }

  /**
   * 格式化像素值
   */
  formatPixelValue(value) {
    const num = parseFloat(value);
    return isNaN(num) ? '0' : Math.round(num).toString();
  }

  /**
   * 格式化百分比值
   */
  formatPercentValue(value) {
    const num = parseFloat(value);
    return isNaN(num) ? '0' : Math.round(num * 100).toString();
  }

  /**
   * 解析颜色值
   */
  parseColor(color) {
    if (!color || color === 'transparent') {
      return { hex: 'transparent', rgb: 'transparent' };
    }

    // RGB/RGBA 转换为十六进制
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
    if (match) {
      const [, r, g, b, a = 1] = match;
      const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
      return {
        hex: hex.toUpperCase(),
        rgb: `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
        alpha: parseFloat(a)
      };
    }

    return { hex: color, rgb: color };
  }

  /**
   * 创建数值输入控件
   */
  createNumberInput(value, options = {}) {
    const {
      min = 0,
      max = 9999,
      suffix = 'px',
      onChange = null,
      width = '60px'
    } = options;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      width: ${width};
    `;

    const input = this.controls.createInput({
      type: 'number',
      value: value || '0',
      min,
      max,
      onChange
    });

    if (suffix) {
      const suffixElement = document.createElement('span');
      suffixElement.textContent = suffix;
      suffixElement.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #999999;
        pointer-events: none;
      `;
      input.style.paddingRight = '25px';
      wrapper.appendChild(input);
      wrapper.appendChild(suffixElement);
    } else {
      wrapper.appendChild(input);
    }

    return wrapper;
  }
};