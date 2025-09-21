/**
 * 外观设置区域
 * 支持透明度设置、圆角设置（包括全部圆角和四个角度的单独设置）
 */
window.WVE = window.WVE || {};
window.WVE.AppearanceSection = class AppearanceSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '外观 Appearance',
      collapsed: false,
      className: 'appearance-section',
      icon: '👁️',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
    this.showAdvancedRadius = false; // 是否显示四个角度的单独设置
  }

  createElement() {
    const element = super.createElement();
    this.injectStyles();
    return element;
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 透明度设置
    this.createOpacityControl(container);

    // 圆角设置
    this.createCornerRadiusControl(container);
  }

  createOpacityControl(container) {
    const section = document.createElement('div');
    section.className = 'mb-4';

    // 标题行
    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center justify-between mb-2';

    const titleWithIcon = document.createElement('div');
    titleWithIcon.className = 'flex items-center gap-2';

    const icon = document.createElement('div');
    icon.className = 'text-sm';
    icon.innerHTML = '👁️';

    const title = document.createElement('div');
    title.className = 'text-xs font-semibold text-gray-300';
    title.textContent = 'Opacity';

    titleWithIcon.appendChild(icon);
    titleWithIcon.appendChild(title);
    titleRow.appendChild(titleWithIcon);

    // 透明度值显示
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'text-xs text-gray-400 font-medium';
    valueDisplay.textContent = '100%';
    titleRow.appendChild(valueDisplay);

    // 滑块容器
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'flex items-center gap-3';

    // 左侧图标
    const leftIcon = document.createElement('div');
    leftIcon.className = 'text-sm opacity-100';
    leftIcon.innerHTML = '👁️';

    // 滑块
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = '100';
    slider.className = 'flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer opacity-slider';

    // 右侧图标
    const rightIcon = document.createElement('div');
    rightIcon.className = 'text-sm opacity-100';
    rightIcon.innerHTML = '💧';

    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.updateStyle('opacity', (value / 100).toString());
      valueDisplay.textContent = value + '%';

      // 更新图标透明度
      const opacity = value / 100;
      leftIcon.style.opacity = opacity;
      rightIcon.style.opacity = opacity;
    });

    this.controls.opacity = slider;
    this.controls.opacityValue = valueDisplay;

    sliderContainer.appendChild(leftIcon);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(rightIcon);

    section.appendChild(titleRow);
    section.appendChild(sliderContainer);
    container.appendChild(section);
  }

  createCornerRadiusControl(container) {
    const section = document.createElement('div');
    section.className = 'mb-4';

    // 标题行
    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center justify-between mb-2';

    const titleWithIcon = document.createElement('div');
    titleWithIcon.className = 'flex items-center gap-2';

    const icon = document.createElement('div');
    icon.className = 'text-sm';
    icon.innerHTML = '⬜';

    const title = document.createElement('div');
    title.className = 'text-xs font-semibold text-gray-300';
    title.textContent = 'Corner radius';

    titleWithIcon.appendChild(icon);
    titleWithIcon.appendChild(title);
    titleRow.appendChild(titleWithIcon);

    // 主输入行
    const inputRow = document.createElement('div');
    inputRow.className = 'flex items-center gap-2';

    // 圆角输入框
    const radiusInput = document.createElement('input');
    radiusInput.type = 'number';
    radiusInput.min = '0';
    radiusInput.value = '0';
    radiusInput.className = 'flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none';
    radiusInput.placeholder = '0';

    // 展开按钮
    const expandButton = document.createElement('button');
    expandButton.className = 'w-6 h-6 flex items-center justify-center bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 hover:bg-gray-600 transition-colors';
    expandButton.innerHTML = '🔗';
    expandButton.title = '更多圆角选项';

    radiusInput.addEventListener('input', (e) => {
      const value = e.target.value || '0';
      this.updateStyle('borderRadius', value + 'px');

      // 如果在高级模式下，同步更新所有角度
      if (this.showAdvancedRadius) {
        this.syncAllRadiusInputs(value);
      }
    });

    expandButton.addEventListener('click', () => {
      this.toggleAdvancedRadius();
    });

    this.controls.borderRadius = radiusInput;
    this.controls.expandButton = expandButton;

    inputRow.appendChild(radiusInput);
    inputRow.appendChild(expandButton);

    // 高级圆角设置面板
    const advancedPanel = document.createElement('div');
    advancedPanel.className = 'mt-2 p-2 bg-gray-800 border border-gray-600 rounded';
    advancedPanel.style.display = 'none';

    this.createAdvancedRadiusControls(advancedPanel);

    section.appendChild(titleRow);
    section.appendChild(inputRow);
    section.appendChild(advancedPanel);
    container.appendChild(section);

    this.advancedPanel = advancedPanel;
  }

  createAdvancedRadiusControls(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-2';

    // 四个角度的配置
    const corners = [
      { key: 'topLeft', label: '左上', property: 'borderTopLeftRadius' },
      { key: 'topRight', label: '右上', property: 'borderTopRightRadius' },
      { key: 'bottomLeft', label: '左下', property: 'borderBottomLeftRadius' },
      { key: 'bottomRight', label: '右下', property: 'borderBottomRightRadius' }
    ];

    corners.forEach(corner => {
      const item = document.createElement('div');
      item.className = 'flex flex-col gap-1';

      const label = document.createElement('label');
      label.textContent = corner.label;
      label.className = 'text-xs text-gray-400 font-medium';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = '0';
      input.className = 'px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none';
      input.placeholder = '0';

      input.addEventListener('input', (e) => {
        const value = e.target.value || '0';
        this.updateStyle(corner.property, value + 'px');
      });

      this.controls[corner.key] = input;

      item.appendChild(label);
      item.appendChild(input);
      grid.appendChild(item);
    });

    container.appendChild(grid);
  }

  toggleAdvancedRadius() {
    this.showAdvancedRadius = !this.showAdvancedRadius;

    if (this.showAdvancedRadius) {
      this.advancedPanel.style.display = 'block';
      this.controls.expandButton.innerHTML = '🔓';
      this.controls.expandButton.title = '简化圆角选项';

      // 同步当前值到所有角度
      const currentValue = this.controls.borderRadius.value || '0';
      this.syncAllRadiusInputs(currentValue);
    } else {
      this.advancedPanel.style.display = 'none';
      this.controls.expandButton.innerHTML = '🔗';
      this.controls.expandButton.title = '更多圆角选项';
    }
  }

  syncAllRadiusInputs(value) {
    if (this.controls.topLeft) this.controls.topLeft.value = value;
    if (this.controls.topRight) this.controls.topRight.value = value;
    if (this.controls.bottomLeft) this.controls.bottomLeft.value = value;
    if (this.controls.bottomRight) this.controls.bottomRight.value = value;
  }

  createControlGroup(title, parent) {
    const group = document.createElement('div');
    group.className = 'control-group';

    const header = document.createElement('div');
    header.className = 'control-group-header';

    const titleElement = document.createElement('h4');
    titleElement.className = 'control-group-title';
    titleElement.textContent = title;

    header.appendChild(titleElement);

    const content = document.createElement('div');
    content.className = 'control-group-content';

    group.appendChild(header);
    group.appendChild(content);
    parent.appendChild(group);

    return content;
  }

  updateStyle(property, value) {
    if (!this.currentElement) return;

    this.currentElement.style[property] = value;
    this.notifyChange(property, value);
  }

  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 更新透明度
    if (this.controls.opacity) {
      const opacity = parseFloat(style.opacity) || 1;
      this.controls.opacity.value = Math.round(opacity * 100);
      this.controls.opacityValue.textContent = Math.round(opacity * 100) + '%';

      // 更新图标透明度
      const visibilityIcon = this.element.querySelector('.visibility-icon');
      const opacityIcon = this.element.querySelector('.opacity-icon');
      if (visibilityIcon) visibilityIcon.style.opacity = opacity;
      if (opacityIcon) opacityIcon.style.opacity = opacity;
    }

    // 更新圆角
    if (this.controls.borderRadius) {
      const borderRadius = parseInt(style.borderRadius) || 0;
      this.controls.borderRadius.value = borderRadius;
    }

    // 如果显示高级模式，更新各个角度
    if (this.showAdvancedRadius) {
      const corners = [
        { control: 'topLeft', property: 'borderTopLeftRadius' },
        { control: 'topRight', property: 'borderTopRightRadius' },
        { control: 'bottomLeft', property: 'borderBottomLeftRadius' },
        { control: 'bottomRight', property: 'borderBottomRightRadius' }
      ];

      corners.forEach(corner => {
        if (this.controls[corner.control]) {
          const value = parseInt(style[corner.property]) || 0;
          this.controls[corner.control].value = value;
        }
      });
    }
  }

  update(element) {
    super.update(element);
    this.currentElement = element;

    if (element) {
      this.updateFromElement(element);
    }
  }

  notifyChange(property, value) {
    const event = new CustomEvent('wveStyleChange', {
      detail: {
        element: this.currentElement,
        property: property,
        value: value,
        source: 'AppearanceSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    // 在组件内部注入样式，而不是全局document.head
    if (this.element && this.element.querySelector('#appearance-section-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'appearance-section-styles';
    style.textContent = `
      .appearance-section .section-content {
        padding: 12px;
      }

      /* 自定义滑块样式 */
      .opacity-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #ffffff;
        border: 2px solid #3b82f6;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .opacity-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #ffffff;
        border: 2px solid #3b82f6;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        border: none;
      }

      .opacity-slider::-moz-range-track {
        background: #4b5563;
        height: 4px;
        border-radius: 2px;
      }
    `;

    if (this.element) {
      this.element.appendChild(style);
    } else {
      document.head.appendChild(style);
    }
  }
};