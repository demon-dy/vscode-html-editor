/**
 * 边框设置区域
 * 支持设置描边border的相关属性，包括边框样式、宽度、颜色、位置等
 */
window.WVE = window.WVE || {};
window.WVE.StrokeSection = class StrokeSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '边框 Stroke',
      collapsed: false,
      className: 'stroke-section',
      icon: '⬜',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
    this.strokes = []; // 支持多个边框
  }

  createElement() {
    const element = super.createElement();
    this.injectStyles();
    return element;
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 边框列表
    this.createStrokeList(container);

    // 添加边框按钮
    this.createAddStrokeButton(container);
  }

  createStrokeList(container) {
    const listContainer = document.createElement('div');
    listContainer.className = 'stroke-list-container';

    const header = document.createElement('div');
    header.className = 'stroke-list-header';

    const title = document.createElement('span');
    title.textContent = '边框';
    title.className = 'stroke-list-title';

    const gridIcon = document.createElement('div');
    gridIcon.className = 'grid-icon';
    gridIcon.innerHTML = '⊞';

    header.appendChild(gridIcon);
    header.appendChild(title);

    const strokeList = document.createElement('div');
    strokeList.className = 'stroke-list';

    // 默认添加一个边框
    this.addDefaultStroke(strokeList);

    listContainer.appendChild(header);
    listContainer.appendChild(strokeList);
    container.appendChild(listContainer);

    this.strokeListElement = strokeList;
  }

  addDefaultStroke(container) {
    const strokeItem = this.createStrokeItem({
      color: '#000000',
      width: 1,
      style: 'solid',
      position: 'Inside',
      opacity: 100,
      enabled: true
    });

    container.appendChild(strokeItem);
    this.strokes.push({
      color: '#000000',
      width: 1,
      style: 'solid',
      position: 'Inside',
      opacity: 100,
      enabled: true,
      element: strokeItem
    });
  }

  createStrokeItem(strokeData) {
    const item = document.createElement('div');
    item.className = 'stroke-item';

    // 左侧颜色预览
    const preview = document.createElement('div');
    preview.className = 'stroke-preview';
    preview.style.backgroundColor = strokeData.color;
    preview.style.opacity = strokeData.enabled ? (strokeData.opacity / 100) : 0.3;

    // 中间信息区域
    const info = document.createElement('div');
    info.className = 'stroke-info';

    const colorDisplay = document.createElement('div');
    colorDisplay.className = 'stroke-color-display';
    colorDisplay.textContent = strokeData.color.toUpperCase();

    const propsDisplay = document.createElement('div');
    propsDisplay.className = 'stroke-props-display';
    propsDisplay.textContent = `${strokeData.width}px ${strokeData.style} • ${strokeData.opacity}%`;

    info.appendChild(colorDisplay);
    info.appendChild(propsDisplay);

    // 右侧控制按钮
    const controls = document.createElement('div');
    controls.className = 'stroke-controls';

    // 可见性切换按钮
    const visibilityButton = document.createElement('button');
    visibilityButton.className = 'stroke-visibility-btn';
    visibilityButton.innerHTML = strokeData.enabled ? '👁️' : '🚫';
    visibilityButton.title = strokeData.enabled ? '隐藏边框' : '显示边框';

    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.className = 'stroke-delete-btn';
    deleteButton.innerHTML = '—';
    deleteButton.title = '删除边框';

    // 事件监听
    item.addEventListener('click', () => {
      this.selectStroke(item, strokeData);
    });

    visibilityButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleStrokeVisibility(strokeData, visibilityButton);
    });

    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteStroke(item, strokeData);
    });

    controls.appendChild(visibilityButton);
    controls.appendChild(deleteButton);

    item.appendChild(preview);
    item.appendChild(info);
    item.appendChild(controls);

    // 创建详细设置面板
    const detailPanel = this.createStrokeDetailPanel(strokeData);
    item.appendChild(detailPanel);

    return item;
  }

  createStrokeDetailPanel(strokeData) {
    const panel = document.createElement('div');
    panel.className = 'stroke-detail-panel';
    panel.style.display = 'none';

    // 颜色选择器
    const colorGroup = document.createElement('div');
    colorGroup.className = 'stroke-control-group';

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = strokeData.color;
    colorPicker.className = 'stroke-color-picker';

    const colorInput = document.createElement('input');
    colorInput.type = 'text';
    colorInput.value = strokeData.color.toUpperCase();
    colorInput.className = 'stroke-color-input';
    colorInput.placeholder = '#000000';

    colorPicker.addEventListener('change', (e) => {
      const color = e.target.value;
      colorInput.value = color.toUpperCase();
      strokeData.color = color;
      this.updateStrokePreview(strokeData);
      this.applyStrokeToElement();
    });

    colorInput.addEventListener('input', (e) => {
      const color = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        colorPicker.value = color;
        strokeData.color = color;
        this.updateStrokePreview(strokeData);
        this.applyStrokeToElement();
      }
    });

    colorGroup.appendChild(colorPicker);
    colorGroup.appendChild(colorInput);

    // 透明度控制
    const opacityGroup = document.createElement('div');
    opacityGroup.className = 'stroke-control-group opacity-group';

    const opacityLabel = document.createElement('span');
    opacityLabel.textContent = '透明度';
    opacityLabel.className = 'opacity-label';

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = strokeData.opacity.toString();
    opacitySlider.className = 'opacity-slider';

    const opacityValue = document.createElement('span');
    opacityValue.textContent = strokeData.opacity + '%';
    opacityValue.className = 'opacity-value';

    opacitySlider.addEventListener('input', (e) => {
      const opacity = parseInt(e.target.value);
      strokeData.opacity = opacity;
      opacityValue.textContent = opacity + '%';
      this.updateStrokePreview(strokeData);
      this.applyStrokeToElement();
    });

    opacityGroup.appendChild(opacityLabel);
    opacityGroup.appendChild(opacitySlider);
    opacityGroup.appendChild(opacityValue);

    // 位置和粗细控制
    const positionWeightGroup = document.createElement('div');
    positionWeightGroup.className = 'stroke-control-group position-weight-group';

    // 位置选择
    const positionSelect = document.createElement('select');
    positionSelect.className = 'stroke-position-select';
    const positions = [
      { value: 'Inside', label: 'Inside' },
      { value: 'Center', label: 'Center' },
      { value: 'Outside', label: 'Outside' }
    ];

    positions.forEach(pos => {
      const option = document.createElement('option');
      option.value = pos.value;
      option.textContent = pos.label;
      if (pos.value === strokeData.position) {
        option.selected = true;
      }
      positionSelect.appendChild(option);
    });

    positionSelect.addEventListener('change', (e) => {
      strokeData.position = e.target.value;
      this.updateStrokePreview(strokeData);
      this.applyStrokeToElement();
    });

    // 粗细控制
    const weightContainer = document.createElement('div');
    weightContainer.className = 'weight-container';

    const weightIcon = document.createElement('div');
    weightIcon.className = 'weight-icon';
    weightIcon.innerHTML = '═';

    const weightInput = document.createElement('input');
    weightInput.type = 'number';
    weightInput.min = '0';
    weightInput.step = '0.5';
    weightInput.value = strokeData.width;
    weightInput.className = 'stroke-weight-input';

    const expandButton = document.createElement('button');
    expandButton.className = 'expand-weight-button';
    expandButton.innerHTML = '⚙️';
    expandButton.title = '更多选项';

    weightInput.addEventListener('input', (e) => {
      strokeData.width = parseFloat(e.target.value) || 0;
      this.updateStrokePreview(strokeData);
      this.applyStrokeToElement();
    });

    weightContainer.appendChild(weightIcon);
    weightContainer.appendChild(weightInput);
    weightContainer.appendChild(expandButton);

    positionWeightGroup.appendChild(positionSelect);
    positionWeightGroup.appendChild(weightContainer);

    // 边框样式控制
    const styleGroup = document.createElement('div');
    styleGroup.className = 'stroke-control-group style-group';

    const styleSelect = document.createElement('select');
    styleSelect.className = 'stroke-style-select';
    const styles = [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
      { value: 'double', label: 'Double' }
    ];

    styles.forEach(style => {
      const option = document.createElement('option');
      option.value = style.value;
      option.textContent = style.label;
      if (style.value === strokeData.style) {
        option.selected = true;
      }
      styleSelect.appendChild(option);
    });

    styleSelect.addEventListener('change', (e) => {
      strokeData.style = e.target.value;
      this.updateStrokePreview(strokeData);
      this.applyStrokeToElement();
    });

    styleGroup.appendChild(styleSelect);

    panel.appendChild(colorGroup);
    panel.appendChild(opacityGroup);
    panel.appendChild(positionWeightGroup);
    panel.appendChild(styleGroup);

    return panel;
  }

  createAddStrokeButton(container) {
    const addButton = document.createElement('button');
    addButton.className = 'add-stroke-button';
    addButton.innerHTML = '✚';
    addButton.title = '添加边框';

    addButton.addEventListener('click', () => {
      this.addStroke();
    });

    container.appendChild(addButton);
  }

  addStroke() {
    const strokeData = {
      color: '#000000',
      width: 1,
      style: 'solid',
      position: 'Inside',
      opacity: 100,
      enabled: true
    };

    const strokeItem = this.createStrokeItem(strokeData);
    this.strokeListElement.appendChild(strokeItem);

    strokeData.element = strokeItem;
    this.strokes.push(strokeData);

    // 自动选中新添加的边框
    this.selectStroke(strokeItem, strokeData);
  }

  selectStroke(element, strokeData) {
    // 取消其他选中状态
    this.strokeListElement.querySelectorAll('.stroke-item').forEach(item => {
      item.classList.remove('selected');
      item.querySelector('.stroke-detail-panel').style.display = 'none';
    });

    // 选中当前项
    element.classList.add('selected');
    element.querySelector('.stroke-detail-panel').style.display = 'block';
  }

  toggleStrokeVisibility(strokeData, button) {
    strokeData.enabled = !strokeData.enabled;
    button.innerHTML = strokeData.enabled ? '👁️' : '🚫';
    button.title = strokeData.enabled ? '隐藏边框' : '显示边框';

    this.updateStrokePreview(strokeData);
    this.applyStrokeToElement();
  }

  deleteStroke(element, strokeData) {
    if (this.strokes.length <= 1) {
      // 至少保留一个边框
      return;
    }

    const index = this.strokes.indexOf(strokeData);
    if (index > -1) {
      this.strokes.splice(index, 1);
    }

    element.remove();
    this.applyStrokeToElement();
  }

  updateStrokePreview(strokeData) {
    const preview = strokeData.element.querySelector('.stroke-preview');
    const colorDisplay = strokeData.element.querySelector('.stroke-color-display');
    const propsDisplay = strokeData.element.querySelector('.stroke-props-display');

    preview.style.backgroundColor = strokeData.color;
    preview.style.opacity = strokeData.enabled ? (strokeData.opacity / 100) : 0.3;

    colorDisplay.textContent = strokeData.color.toUpperCase();
    propsDisplay.textContent = `${strokeData.width}px ${strokeData.style} • ${strokeData.opacity}%`;
  }

  applyStrokeToElement() {
    if (!this.currentElement) return;

    // 获取启用的边框
    const enabledStrokes = this.strokes.filter(stroke => stroke.enabled);

    if (enabledStrokes.length === 0) {
      this.currentElement.style.border = 'none';
      this.currentElement.style.outline = 'none';
    } else {
      // 应用第一个边框为主边框
      const mainStroke = enabledStrokes[0];
      const alpha = mainStroke.opacity / 100;
      const rgb = this.hexToRgb(mainStroke.color);
      const borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

      if (mainStroke.position === 'Inside') {
        this.currentElement.style.border = `${mainStroke.width}px ${mainStroke.style} ${borderColor}`;
        this.currentElement.style.outline = 'none';
      } else if (mainStroke.position === 'Outside') {
        this.currentElement.style.border = 'none';
        this.currentElement.style.outline = `${mainStroke.width}px ${mainStroke.style} ${borderColor}`;
        this.currentElement.style.outlineOffset = '0px';
      } else {
        // Center - 使用box-shadow模拟
        this.currentElement.style.border = 'none';
        this.currentElement.style.outline = 'none';
        this.currentElement.style.boxShadow = `inset 0 0 0 ${mainStroke.width}px ${borderColor}`;
      }

      // 如果有多个边框，可以通过box-shadow叠加
      if (enabledStrokes.length > 1) {
        const shadows = enabledStrokes.map((stroke, index) => {
          const alpha = stroke.opacity / 100;
          const rgb = this.hexToRgb(stroke.color);
          const color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          const offset = enabledStrokes.slice(0, index + 1).reduce((sum, s) => sum + s.width, 0);
          return `inset 0 0 0 ${offset}px ${color}`;
        });
        this.currentElement.style.boxShadow = shadows.join(', ');
      }
    }

    this.notifyChange('border', this.currentElement.style.border);
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

    // 简单解析边框
    if (style.borderWidth && style.borderWidth !== '0px') {
      const width = parseInt(style.borderWidth) || 0;
      const color = this.rgbToHex(style.borderColor) || '#000000';
      const borderStyle = style.borderStyle || 'solid';

      if (this.strokes.length > 0) {
        this.strokes[0].width = width;
        this.strokes[0].color = color;
        this.strokes[0].style = borderStyle;
        this.updateStrokePreview(this.strokes[0]);
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
        source: 'StrokeSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (this.element && this.element.querySelector('#stroke-section-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'stroke-section-styles';
    style.textContent = `
      .stroke-section {
      }

      .stroke-list-container {
        margin-bottom: 12px;
      }

      .stroke-list-header {
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

      .stroke-list-title {
        font-size: 12px;
        font-weight: 600;
        color: #ffffff;
      }

      .stroke-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stroke-item {
        background: #2d2d2d;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .stroke-item:hover {
        border-color: #505050;
      }

      .stroke-item.selected {
        border-color: #0078d4;
        background: #363636;
      }

      .stroke-item > div:first-child {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }

      .stroke-preview {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 1px solid #404040;
        background-color: #000000;
      }

      .stroke-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .stroke-color-display {
        font-size: 12px;
        font-weight: 600;
        color: #ffffff;
      }

      .stroke-props-display {
        font-size: 10px;
        color: #999999;
      }

      .stroke-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .stroke-visibility-btn,
      .stroke-delete-btn {
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

      .stroke-visibility-btn:hover,
      .stroke-delete-btn:hover {
        background: #404040;
        border-color: #505050;
      }

      .stroke-detail-panel {
        display: none;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #404040;
      }

      .stroke-control-group {
        margin-bottom: 12px;
      }

      .stroke-control-group:last-child {
        margin-bottom: 0;
      }

      .stroke-control-group:first-child {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .stroke-color-picker {
        width: 40px;
        height: 32px;
        border: 1px solid #404040;
        border-radius: 4px;
        background: none;
        cursor: pointer;
      }

      .stroke-color-input {
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

      .stroke-color-input:focus {
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

      .position-weight-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .stroke-position-select {
        flex: 1;
        height: 32px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 4px;
        color: #ffffff;
        font-size: 12px;
        padding: 0 12px;
        outline: none;
      }

      .weight-container {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 4px 8px;
      }

      .weight-icon {
        font-size: 14px;
        color: #999999;
      }

      .stroke-weight-input {
        width: 40px;
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 12px;
        text-align: center;
        outline: none;
      }

      .expand-weight-button {
        background: transparent;
        border: none;
        color: #999999;
        cursor: pointer;
        font-size: 12px;
        padding: 2px;
        transition: color 0.2s ease;
      }

      .expand-weight-button:hover {
        color: #cccccc;
      }

      .stroke-style-select {
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

      .add-stroke-button {
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

      .add-stroke-button:hover {
        background: #404040;
        border-color: #606060;
        color: #cccccc;
      }
    `;

    if (this.element) {
      this.element.appendChild(style);
    } else {
      document.head.appendChild(style);
    }
  }
};