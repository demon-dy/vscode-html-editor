/**
 * 填充设置区域
 * 支持颜色填充、图片填充，包括颜色选择器和图片填充属性设置
 */
window.WVE = window.WVE || {};
window.WVE.FillSection = class FillSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '填充 Fill',
      collapsed: false,
      className: 'fill-section',
      icon: '🎨',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
    this.fillType = 'color'; // 'color' | 'image'
    this.fills = []; // 支持多个填充
  }

  createElement() {
    const element = super.createElement();
    this.injectStyles();
    return element;
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 填充列表
    this.createFillList(container);

    // 添加填充按钮
    this.createAddFillButton(container);
  }

  createFillList(container) {
    const listContainer = document.createElement('div');
    listContainer.className = 'fill-list-container';

    const header = document.createElement('div');
    header.className = 'fill-list-header';

    const title = document.createElement('span');
    title.textContent = '填充';
    title.className = 'fill-list-title';

    const gridIcon = document.createElement('div');
    gridIcon.className = 'grid-icon';
    gridIcon.innerHTML = '⊞';

    header.appendChild(gridIcon);
    header.appendChild(title);

    const fillList = document.createElement('div');
    fillList.className = 'fill-list';

    // 默认添加一个颜色填充
    this.addDefaultFill(fillList);

    listContainer.appendChild(header);
    listContainer.appendChild(fillList);
    container.appendChild(listContainer);

    this.fillListElement = fillList;
  }

  addDefaultFill(container) {
    const fillItem = this.createFillItem({
      type: 'color',
      color: '#A69B9B',
      opacity: 100,
      enabled: true
    });

    container.appendChild(fillItem);
    this.fills.push({
      type: 'color',
      color: '#A69B9B',
      opacity: 100,
      enabled: true,
      element: fillItem
    });
  }

  createFillItem(fillData) {
    const item = document.createElement('div');
    item.className = 'fill-item';

    // 左侧颜色预览或图片预览
    const preview = document.createElement('div');
    preview.className = 'fill-preview';

    if (fillData.type === 'color') {
      preview.style.background = fillData.color;
    } else if (fillData.type === 'image') {
      preview.style.backgroundImage = `url(${fillData.image})`;
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
    }

    // 中间信息区域
    const info = document.createElement('div');
    info.className = 'fill-info';

    const colorDisplay = document.createElement('div');
    colorDisplay.className = 'fill-color-display';
    colorDisplay.textContent = fillData.type === 'color' ? fillData.color.toUpperCase() : 'Image';

    const opacityDisplay = document.createElement('div');
    opacityDisplay.className = 'fill-opacity-display';
    opacityDisplay.textContent = fillData.opacity + ' %';

    info.appendChild(colorDisplay);
    info.appendChild(opacityDisplay);

    // 右侧控制按钮
    const controls = document.createElement('div');
    controls.className = 'fill-controls';

    // 可见性切换按钮
    const visibilityButton = document.createElement('button');
    visibilityButton.className = 'fill-visibility-btn';
    visibilityButton.innerHTML = fillData.enabled ? '👁️' : '🚫';
    visibilityButton.title = fillData.enabled ? '隐藏填充' : '显示填充';

    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.className = 'fill-delete-btn';
    deleteButton.innerHTML = '—';
    deleteButton.title = '删除填充';

    // 事件监听
    item.addEventListener('click', () => {
      this.selectFill(item, fillData);
    });

    visibilityButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFillVisibility(fillData, visibilityButton);
    });

    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteFill(item, fillData);
    });

    controls.appendChild(visibilityButton);
    controls.appendChild(deleteButton);

    item.appendChild(preview);
    item.appendChild(info);
    item.appendChild(controls);

    // 创建详细设置面板
    const detailPanel = this.createFillDetailPanel(fillData);
    item.appendChild(detailPanel);

    return item;
  }

  createFillDetailPanel(fillData) {
    const panel = document.createElement('div');
    panel.className = 'fill-detail-panel';
    panel.style.display = 'none';

    if (fillData.type === 'color') {
      this.createColorFillControls(panel, fillData);
    } else if (fillData.type === 'image') {
      this.createImageFillControls(panel, fillData);
    }

    return panel;
  }

  createColorFillControls(container, fillData) {
    // 颜色选择器
    const colorGroup = document.createElement('div');
    colorGroup.className = 'fill-control-group';

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = fillData.color;
    colorPicker.className = 'fill-color-picker';

    const colorInput = document.createElement('input');
    colorInput.type = 'text';
    colorInput.value = fillData.color.toUpperCase();
    colorInput.className = 'fill-color-input';
    colorInput.placeholder = '#000000';

    colorPicker.addEventListener('change', (e) => {
      const color = e.target.value;
      colorInput.value = color.toUpperCase();
      fillData.color = color;
      this.updateFillPreview(fillData);
      this.applyFillToElement();
    });

    colorInput.addEventListener('input', (e) => {
      const color = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        colorPicker.value = color;
        fillData.color = color;
        this.updateFillPreview(fillData);
        this.applyFillToElement();
      }
    });

    colorGroup.appendChild(colorPicker);
    colorGroup.appendChild(colorInput);

    // 透明度控制
    const opacityGroup = document.createElement('div');
    opacityGroup.className = 'fill-control-group opacity-group';

    const opacityLabel = document.createElement('span');
    opacityLabel.textContent = '透明度';
    opacityLabel.className = 'opacity-label';

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = fillData.opacity.toString();
    opacitySlider.className = 'opacity-slider';

    const opacityValue = document.createElement('span');
    opacityValue.textContent = fillData.opacity + '%';
    opacityValue.className = 'opacity-value';

    opacitySlider.addEventListener('input', (e) => {
      const opacity = parseInt(e.target.value);
      fillData.opacity = opacity;
      opacityValue.textContent = opacity + '%';
      this.updateFillPreview(fillData);
      this.applyFillToElement();
    });

    opacityGroup.appendChild(opacityLabel);
    opacityGroup.appendChild(opacitySlider);
    opacityGroup.appendChild(opacityValue);

    container.appendChild(colorGroup);
    container.appendChild(opacityGroup);
  }

  createImageFillControls(container, fillData) {
    // 图片选择
    const imageGroup = document.createElement('div');
    imageGroup.className = 'fill-control-group';

    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.className = 'fill-image-input';
    imageInput.style.display = 'none';

    const imageButton = document.createElement('button');
    imageButton.className = 'fill-image-button';
    imageButton.textContent = '选择图片';

    const imageUrl = document.createElement('input');
    imageUrl.type = 'text';
    imageUrl.placeholder = '或输入图片URL';
    imageUrl.className = 'fill-image-url';

    imageButton.addEventListener('click', () => {
      imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fillData.image = e.target.result;
          this.updateFillPreview(fillData);
          this.applyFillToElement();
        };
        reader.readAsDataURL(file);
      }
    });

    imageUrl.addEventListener('input', (e) => {
      fillData.image = e.target.value;
      this.updateFillPreview(fillData);
      this.applyFillToElement();
    });

    imageGroup.appendChild(imageInput);
    imageGroup.appendChild(imageButton);
    imageGroup.appendChild(imageUrl);

    // 图片填充属性
    const propsGroup = document.createElement('div');
    propsGroup.className = 'fill-control-group image-props-group';

    // 填充方式
    const fillModeSelect = document.createElement('select');
    fillModeSelect.className = 'fill-mode-select';
    const fillModes = [
      { value: 'cover', label: '覆盖' },
      { value: 'contain', label: '包含' },
      { value: 'repeat', label: '重复' },
      { value: 'no-repeat', label: '不重复' }
    ];

    fillModes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.value;
      option.textContent = mode.label;
      fillModeSelect.appendChild(option);
    });

    fillModeSelect.addEventListener('change', (e) => {
      fillData.backgroundSize = e.target.value;
      this.applyFillToElement();
    });

    propsGroup.appendChild(fillModeSelect);

    container.appendChild(imageGroup);
    container.appendChild(propsGroup);
  }

  createAddFillButton(container) {
    const addButton = document.createElement('button');
    addButton.className = 'add-fill-button';
    addButton.innerHTML = '✚';
    addButton.title = '添加填充';

    addButton.addEventListener('click', () => {
      this.showAddFillMenu(addButton);
    });

    container.appendChild(addButton);
  }

  showAddFillMenu(button) {
    const menu = document.createElement('div');
    menu.className = 'add-fill-menu';

    const colorOption = document.createElement('button');
    colorOption.className = 'add-fill-option';
    colorOption.textContent = '颜色填充';
    colorOption.addEventListener('click', () => {
      this.addFill('color');
      menu.remove();
    });

    const imageOption = document.createElement('button');
    imageOption.className = 'add-fill-option';
    imageOption.textContent = '图片填充';
    imageOption.addEventListener('click', () => {
      this.addFill('image');
      menu.remove();
    });

    menu.appendChild(colorOption);
    menu.appendChild(imageOption);

    // 定位菜单
    const rect = button.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = rect.top - menu.offsetHeight + 'px';
    menu.style.left = rect.left + 'px';

    document.body.appendChild(menu);

    // 点击外部关闭菜单
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  addFill(type) {
    const fillData = {
      type: type,
      color: type === 'color' ? '#000000' : undefined,
      image: type === 'image' ? '' : undefined,
      opacity: 100,
      enabled: true
    };

    const fillItem = this.createFillItem(fillData);
    this.fillListElement.appendChild(fillItem);

    fillData.element = fillItem;
    this.fills.push(fillData);

    // 自动选中新添加的填充
    this.selectFill(fillItem, fillData);
  }

  selectFill(element, fillData) {
    // 取消其他选中状态
    this.fillListElement.querySelectorAll('.fill-item').forEach(item => {
      item.classList.remove('selected');
      item.querySelector('.fill-detail-panel').style.display = 'none';
    });

    // 选中当前项
    element.classList.add('selected');
    element.querySelector('.fill-detail-panel').style.display = 'block';
  }

  toggleFillVisibility(fillData, button) {
    fillData.enabled = !fillData.enabled;
    button.innerHTML = fillData.enabled ? '👁️' : '🚫';
    button.title = fillData.enabled ? '隐藏填充' : '显示填充';

    this.updateFillPreview(fillData);
    this.applyFillToElement();
  }

  deleteFill(element, fillData) {
    if (this.fills.length <= 1) {
      // 至少保留一个填充
      return;
    }

    const index = this.fills.indexOf(fillData);
    if (index > -1) {
      this.fills.splice(index, 1);
    }

    element.remove();
    this.applyFillToElement();
  }

  updateFillPreview(fillData) {
    const preview = fillData.element.querySelector('.fill-preview');
    const colorDisplay = fillData.element.querySelector('.fill-color-display');
    const opacityDisplay = fillData.element.querySelector('.fill-opacity-display');

    if (fillData.type === 'color') {
      preview.style.background = fillData.color;
      preview.style.opacity = fillData.enabled ? (fillData.opacity / 100) : 0.3;
      colorDisplay.textContent = fillData.color.toUpperCase();
    } else if (fillData.type === 'image' && fillData.image) {
      preview.style.backgroundImage = `url(${fillData.image})`;
      preview.style.opacity = fillData.enabled ? (fillData.opacity / 100) : 0.3;
      colorDisplay.textContent = 'Image';
    }

    opacityDisplay.textContent = fillData.opacity + ' %';
  }

  applyFillToElement() {
    if (!this.currentElement) return;

    // 获取启用的填充
    const enabledFills = this.fills.filter(fill => fill.enabled);

    if (enabledFills.length === 0) {
      this.currentElement.style.background = 'transparent';
    } else if (enabledFills.length === 1) {
      const fill = enabledFills[0];
      if (fill.type === 'color') {
        const alpha = fill.opacity / 100;
        const rgb = this.hexToRgb(fill.color);
        this.currentElement.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      } else if (fill.type === 'image' && fill.image) {
        this.currentElement.style.backgroundImage = `url(${fill.image})`;
        this.currentElement.style.backgroundSize = fill.backgroundSize || 'cover';
        this.currentElement.style.backgroundPosition = 'center';
        this.currentElement.style.backgroundRepeat = 'no-repeat';
      }
    } else {
      // 多个填充，使用linear-gradient组合
      const gradients = enabledFills.map(fill => {
        if (fill.type === 'color') {
          const alpha = fill.opacity / 100;
          const rgb = this.hexToRgb(fill.color);
          return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        }
        return 'transparent';
      });
      this.currentElement.style.background = `linear-gradient(${gradients.join(', ')})`;
    }

    this.notifyChange('background', this.currentElement.style.background);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 简单解析背景色
    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      // 更新第一个填充为当前背景色
      if (this.fills.length > 0 && this.fills[0].type === 'color') {
        const color = this.rgbToHex(style.backgroundColor);
        if (color) {
          this.fills[0].color = color;
          this.updateFillPreview(this.fills[0]);
        }
      }
    }
  }

  rgbToHex(rgb) {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    return null;
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
        source: 'FillSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (this.element && this.element.querySelector('#fill-section-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'fill-section-styles';
    style.textContent = `
      .fill-section {
      }

      .fill-list-container {
        margin-bottom: 12px;
      }

      .fill-list-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding: 8px 0;
      }

      .grid-icon {
        font-size: 14px;
        color: #999999;
      }

      .fill-list-title {
        font-size: 12px;
        font-weight: 600;
        color: #ffffff;
      }

      .fill-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .fill-item {
        background: #2d2d2d;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .fill-item:hover {
        border-color: #505050;
      }

      .fill-item.selected {
        border-color: #0078d4;
        background: #363636;
      }

      .fill-item > div:first-child {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .fill-preview {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 1px solid #404040;
        background-color: #ffffff;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
      }

      .fill-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .fill-color-display {
        font-size: 12px;
        font-weight: 600;
        color: #ffffff;
      }

      .fill-opacity-display {
        font-size: 10px;
        color: #999999;
      }

      .fill-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .fill-visibility-btn,
      .fill-delete-btn {
        width: 24px;
        height: 24px;
        background: transparent;
        border: 1px solid #404040;
        border-radius: 4px;
        color: #cccccc;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        transition: all 0.2s ease;
      }

      .fill-visibility-btn:hover,
      .fill-delete-btn:hover {
        background: #404040;
        border-color: #505050;
      }

      .fill-detail-panel {
        display: none;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #404040;
      }

      .fill-control-group {
        margin-bottom: 12px;
      }

      .fill-control-group:last-child {
        margin-bottom: 0;
      }

      .fill-control-group:first-child {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .fill-color-picker {
        width: 40px;
        height: 32px;
        border: 1px solid #404040;
        border-radius: 4px;
        background: none;
        cursor: pointer;
      }

      .fill-color-input {
        flex: 1;
        height: 32px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 4px;
        color: #ffffff;
        font-size: 12px;
        padding: 0 12px;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .fill-color-input:focus {
        border-color: #0078d4;
      }

      .opacity-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .opacity-label {
        font-size: 11px;
        color: #cccccc;
        min-width: 50px;
      }

      .opacity-slider {
        flex: 1;
        height: 4px;
        background: #404040;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
        cursor: pointer;
      }

      .opacity-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #ffffff;
        border: 2px solid #0078d4;
        border-radius: 50%;
        cursor: pointer;
      }

      .opacity-value {
        font-size: 11px;
        color: #cccccc;
        min-width: 35px;
        text-align: right;
      }

      .fill-image-button {
        width: 100%;
        height: 32px;
        background: #363636;
        border: 1px solid #404040;
        border-radius: 4px;
        color: #ffffff;
        cursor: pointer;
        font-size: 12px;
        margin-bottom: 8px;
        transition: all 0.2s ease;
      }

      .fill-image-button:hover {
        background: #404040;
      }

      .fill-image-url {
        width: 100%;
        height: 32px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 4px;
        color: #ffffff;
        font-size: 12px;
        padding: 0 12px;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .fill-image-url:focus {
        border-color: #0078d4;
      }

      .fill-mode-select {
        width: 100%;
        height: 32px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 4px;
        color: #ffffff;
        font-size: 12px;
        padding: 0 12px;
        outline: none;
      }

      .add-fill-button {
        width: 100%;
        height: 40px;
        background: #363636;
        border: 1px dashed #505050;
        border-radius: 6px;
        color: #999999;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
      }

      .add-fill-button:hover {
        background: #404040;
        border-color: #606060;
        color: #cccccc;
      }

      .add-fill-menu {
        background: #2d2d2d;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
      }

      .add-fill-option {
        width: 120px;
        height: 32px;
        background: transparent;
        border: none;
        color: #ffffff;
        cursor: pointer;
        font-size: 12px;
        text-align: left;
        padding: 0 12px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .add-fill-option:hover {
        background: #404040;
      }
    `;

    if (this.element) {
      this.element.appendChild(style);
    } else {
      document.head.appendChild(style);
    }
  }
};