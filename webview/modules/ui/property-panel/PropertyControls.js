/**
 * 通用属性控件库 - Figma 风格
 * 提供各种输入控件、按钮组、颜色选择器等
 */
window.WVE = window.WVE || {};
window.WVE.PropertyControls = {

  /**
   * 创建输入框
   */
  createInput(options = {}) {
    const {
      type = 'text',
      value = '',
      placeholder = '',
      min = undefined,
      max = undefined,
      disabled = false,
      className = '',
      onChange = null
    } = options;

    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.placeholder = placeholder;
    input.disabled = disabled;
    input.className = `property-input ${className}`;

    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;

    input.style.cssText = `
      height: 24px;
      background: #1e1e1e;
      border: 1px solid #404040;
      border-radius: 4px;
      padding: 0 8px;
      color: #ffffff;
      font-size: 11px;
      width: 100%;
      transition: border-color 0.2s;
    `;

    input.addEventListener('focus', () => {
      input.style.borderColor = '#0078d4';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = '#404040';
    });

    if (onChange) {
      input.addEventListener('input', (e) => onChange(e.target.value));
    }

    return input;
  },

  /**
   * 创建带下拉菜单的数值输入框
   */
  createInputWithDropdown(options = {}) {
    const {
      value = '',
      dropdownOptions = [],
      onValueChange = null,
      onDropdownSelect = null,
      width = '60px'
    } = options;

    const wrapper = document.createElement('div');
    wrapper.className = 'input-dropdown-wrapper';
    wrapper.style.cssText = `
      position: relative;
      display: flex;
      align-items: center;
      width: ${width};
    `;

    const input = this.createInput({
      value,
      type: 'text',
      onChange: onValueChange,
      className: 'input-with-dropdown'
    });

    input.style.paddingRight = '20px';

    const dropdownButton = document.createElement('button');
    dropdownButton.className = 'dropdown-button';
    dropdownButton.innerHTML = '▼';
    dropdownButton.style.cssText = `
      position: absolute;
      right: 4px;
      width: 16px;
      height: 16px;
      background: transparent;
      border: none;
      color: #cccccc;
      font-size: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const dropdown = this.createDropdownMenu(dropdownOptions, onDropdownSelect);

    dropdownButton.addEventListener('click', () => {
      this.toggleDropdown(dropdown, wrapper);
    });

    wrapper.appendChild(input);
    wrapper.appendChild(dropdownButton);
    wrapper.appendChild(dropdown);

    return wrapper;
  },

  /**
   * 创建下拉菜单
   */
  createDropdownMenu(options = [], onSelect = null) {
    const dropdown = document.createElement('div');
    dropdown.className = 'figma-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #2c2c2c;
      border: 1px solid #404040;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 1000;
      display: none;
      max-height: 200px;
      overflow-y: auto;
    `;

    options.forEach(option => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.style.cssText = `
        padding: 8px 12px;
        font-size: 11px;
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      if (option.type === 'divider') {
        item.style.cssText = `
          height: 1px;
          background: #404040;
          margin: 4px 0;
          padding: 0;
        `;
        dropdown.appendChild(item);
        return;
      }

      // 添加图标或标记
      if (option.icon) {
        const icon = document.createElement('span');
        icon.textContent = option.icon;
        icon.style.color = '#cccccc';
        item.appendChild(icon);
      }

      const text = document.createElement('span');
      text.textContent = option.text || option.value;
      item.appendChild(text);

      if (option.selected) {
        item.style.backgroundColor = '#0078d4';
      }

      item.addEventListener('mouseenter', () => {
        if (!option.selected) {
          item.style.backgroundColor = '#404040';
        }
      });

      item.addEventListener('mouseleave', () => {
        if (!option.selected) {
          item.style.backgroundColor = 'transparent';
        }
      });

      item.addEventListener('click', () => {
        if (onSelect) onSelect(option);
        dropdown.style.display = 'none';
      });

      dropdown.appendChild(item);
    });

    return dropdown;
  },

  /**
   * 切换下拉菜单显示状态
   */
  toggleDropdown(dropdown, container) {
    const isVisible = dropdown.style.display !== 'none';

    // 隐藏其他所有下拉菜单
    document.querySelectorAll('.figma-dropdown').forEach(dd => {
      if (dd !== dropdown) {
        dd.style.display = 'none';
      }
    });

    dropdown.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      // 点击外部关闭
      const closeOnOutsideClick = (e) => {
        if (!container.contains(e.target)) {
          dropdown.style.display = 'none';
          document.removeEventListener('mousedown', closeOnOutsideClick);
        }
      };
      setTimeout(() => {
        document.addEventListener('mousedown', closeOnOutsideClick);
      }, 0);
    }
  },

  /**
   * 创建图标按钮
   */
  createIconButton(options = {}) {
    const {
      icon = '',
      title = '',
      active = false,
      size = 24,
      onClick = null,
      className = ''
    } = options;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `icon-button ${className}`;
    button.title = title;
    button.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${active ? '#0078d4' : '#2c2c2c'};
      border: 1px solid ${active ? '#0078d4' : '#404040'};
      border-radius: 3px;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `;

    // 创建图标
    const iconElement = document.createElement('i');
    iconElement.className = 'wve-icon';
    iconElement.setAttribute('data-lucide', icon);
    iconElement.style.cssText = `width: ${size - 8}px; height: ${size - 8}px;`;

    button.appendChild(iconElement);

    button.addEventListener('mouseenter', () => {
      if (!active) {
        button.style.backgroundColor = '#404040';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (!active) {
        button.style.backgroundColor = '#2c2c2c';
      }
    });

    if (onClick) {
      button.addEventListener('click', onClick);
    }

    return button;
  },

  /**
   * 创建按钮组
   */
  createButtonGroup(buttons = [], options = {}) {
    const {
      gap = 2,
      multiSelect = false,
      className = ''
    } = options;

    const group = document.createElement('div');
    group.className = `button-group ${className}`;
    group.style.cssText = `
      display: flex;
      gap: ${gap}px;
    `;

    let activeButtons = new Set();

    buttons.forEach((buttonOptions, index) => {
      const button = this.createIconButton({
        ...buttonOptions,
        onClick: (e) => {
          if (multiSelect) {
            // 多选模式
            if (activeButtons.has(index)) {
              activeButtons.delete(index);
              button.style.backgroundColor = '#2c2c2c';
              button.style.borderColor = '#404040';
            } else {
              activeButtons.add(index);
              button.style.backgroundColor = '#0078d4';
              button.style.borderColor = '#0078d4';
            }
          } else {
            // 单选模式 - 清除其他按钮的激活状态
            group.querySelectorAll('.icon-button').forEach(btn => {
              btn.style.backgroundColor = '#2c2c2c';
              btn.style.borderColor = '#404040';
            });
            activeButtons.clear();
            activeButtons.add(index);
            button.style.backgroundColor = '#0078d4';
            button.style.borderColor = '#0078d4';
          }

          if (buttonOptions.onClick) {
            buttonOptions.onClick(e, index, Array.from(activeButtons));
          }
        }
      });

      if (buttonOptions.active) {
        activeButtons.add(index);
      }

      group.appendChild(button);
    });

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(group);
    }, 0);

    return { group, getActiveButtons: () => Array.from(activeButtons) };
  },

  /**
   * 创建颜色选择器
   */
  createColorPicker(options = {}) {
    const {
      value = '#000000',
      onChange = null,
      showAlpha = true
    } = options;

    const wrapper = document.createElement('div');
    wrapper.className = 'color-picker-wrapper';
    wrapper.style.cssText = `
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // 颜色显示块
    const colorChip = document.createElement('div');
    colorChip.className = 'color-chip';
    colorChip.style.cssText = `
      width: 16px;
      height: 16px;
      border-radius: 3px;
      border: 1px solid #404040;
      background: ${value};
      cursor: pointer;
    `;

    // 颜色值输入
    const input = this.createInput({
      value: value,
      placeholder: '#000000',
      onChange: (newValue) => {
        colorChip.style.background = newValue;
        if (onChange) onChange(newValue);
      }
    });
    input.style.width = '70px';

    wrapper.appendChild(colorChip);
    wrapper.appendChild(input);

    // 点击颜色块打开颜色选择面板（简化版）
    colorChip.addEventListener('click', () => {
      // 这里可以后续扩展为完整的颜色选择面板
      const color = prompt('请输入颜色值:', value);
      if (color) {
        colorChip.style.background = color;
        input.value = color;
        if (onChange) onChange(color);
      }
    });

    return wrapper;
  },

  /**
   * 创建复合控件（颜色 + 百分比 + 可见性 + 删除）
   */
  createCompoundControl(options = {}) {
    const {
      color = '#000000',
      percentage = 100,
      visible = true,
      onColorChange = null,
      onPercentageChange = null,
      onVisibilityToggle = null,
      onDelete = null
    } = options;

    const wrapper = document.createElement('div');
    wrapper.className = 'compound-control';
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    `;

    // 颜色选择器
    const colorPicker = this.createColorPicker({
      value: color,
      onChange: onColorChange
    });

    // 百分比控件
    const percentageWrapper = document.createElement('div');
    percentageWrapper.style.cssText = `
      position: relative;
      width: 50px;
    `;

    const percentageInput = this.createInput({
      value: percentage.toString(),
      type: 'number',
      min: 0,
      max: 100,
      onChange: onPercentageChange
    });
    percentageInput.style.width = '100%';
    percentageInput.style.paddingRight = '15px';

    const percentageIcon = document.createElement('span');
    percentageIcon.textContent = '%';
    percentageIcon.style.cssText = `
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      color: #cccccc;
      pointer-events: none;
    `;

    percentageWrapper.appendChild(percentageInput);
    percentageWrapper.appendChild(percentageIcon);

    // 可见性切换
    const visibilityButton = this.createIconButton({
      icon: visible ? 'eye' : 'eye-off',
      title: visible ? '隐藏' : '显示',
      size: 20,
      onClick: () => {
        const newVisible = !visible;
        visibilityButton.querySelector('i').setAttribute('data-lucide', newVisible ? 'eye' : 'eye-off');
        visibilityButton.title = newVisible ? '隐藏' : '显示';
        window.WVE.LucideIcons?.replaceInRoot?.(visibilityButton);
        if (onVisibilityToggle) onVisibilityToggle(newVisible);
      }
    });

    // 删除按钮
    const deleteButton = this.createIconButton({
      icon: 'minus',
      title: '删除',
      size: 20,
      onClick: onDelete
    });

    wrapper.appendChild(colorPicker);
    wrapper.appendChild(percentageWrapper);
    wrapper.appendChild(visibilityButton);
    wrapper.appendChild(deleteButton);

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(wrapper);
    }, 0);

    return wrapper;
  },

  /**
   * 创建标签-控件组合
   */
  createLabelControl(label, control, options = {}) {
    const {
      labelWidth = '60px',
      gap = '8px',
      className = ''
    } = options;

    const wrapper = document.createElement('div');
    wrapper.className = `label-control ${className}`;
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${gap};
      margin-bottom: 8px;
    `;

    const labelElement = document.createElement('div');
    labelElement.className = 'control-label';
    labelElement.textContent = label;
    labelElement.style.cssText = `
      min-width: ${labelWidth};
      font-size: 11px;
      color: #cccccc;
      flex-shrink: 0;
    `;

    const controlWrapper = document.createElement('div');
    controlWrapper.className = 'control-wrapper';
    controlWrapper.style.cssText = 'flex: 1;';
    controlWrapper.appendChild(control);

    wrapper.appendChild(labelElement);
    wrapper.appendChild(controlWrapper);

    return wrapper;
  },

  /**
   * 创建两列布局
   */
  createTwoColumnLayout(leftControl, rightControl, options = {}) {
    const { gap = '8px', className = '' } = options;

    const wrapper = document.createElement('div');
    wrapper.className = `two-column ${className}`;
    wrapper.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: ${gap};
      margin-bottom: 8px;
    `;

    wrapper.appendChild(leftControl);
    wrapper.appendChild(rightControl);

    return wrapper;
  }
};