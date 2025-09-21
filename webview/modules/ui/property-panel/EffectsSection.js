/**
 * 特效设置区域
 * 支持特效的管理，可以添加、删除各种特效，如阴影、模糊等
 */
window.WVE = window.WVE || {};
window.WVE.EffectsSection = class EffectsSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '特效 Effects',
      collapsed: false,
      className: 'effects-section',
      icon: '✨',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
    this.effects = []; // 特效列表
    this.availableEffects = {
      'drop-shadow': {
        name: 'Drop shadow',
        icon: '🌓',
        defaultProps: {
          x: 0,
          y: 4,
          blur: 8,
          spread: 0,
          color: '#000000',
          opacity: 25
        }
      },
      'inner-shadow': {
        name: 'Inner shadow',
        icon: '🌗',
        defaultProps: {
          x: 0,
          y: 2,
          blur: 4,
          spread: 0,
          color: '#000000',
          opacity: 25
        }
      },
      'blur': {
        name: 'Layer blur',
        icon: '🌫️',
        defaultProps: {
          radius: 4
        }
      },
      'background-blur': {
        name: 'Background blur',
        icon: '🌪️',
        defaultProps: {
          radius: 10
        }
      }
    };
  }

  createElement() {
    const element = super.createElement();
    this.injectStyles();
    return element;
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 特效列表
    this.createEffectsList(container);

    // 添加特效按钮
    this.createAddEffectButton(container);
  }

  createEffectsList(container) {
    const listContainer = document.createElement('div');
    listContainer.className = 'effects-list-container';

    const header = document.createElement('div');
    header.className = 'effects-list-header';

    const title = document.createElement('span');
    title.textContent = '特效';
    title.className = 'effects-list-title';

    const gridIcon = document.createElement('div');
    gridIcon.className = 'grid-icon';
    gridIcon.innerHTML = '⊞';

    header.appendChild(gridIcon);
    header.appendChild(title);

    const effectsList = document.createElement('div');
    effectsList.className = 'effects-list';

    // 默认添加一个阴影特效
    this.addDefaultEffect(effectsList);

    listContainer.appendChild(header);
    listContainer.appendChild(effectsList);
    container.appendChild(listContainer);

    this.effectsListElement = effectsList;
  }

  addDefaultEffect(container) {
    const effectData = {
      type: 'drop-shadow',
      enabled: false,
      ...this.availableEffects['drop-shadow'].defaultProps
    };

    const effectItem = this.createEffectItem(effectData);
    container.appendChild(effectItem);

    effectData.element = effectItem;
    this.effects.push(effectData);
  }

  createEffectItem(effectData) {
    const item = document.createElement('div');
    item.className = 'effect-item';

    // 左侧图标和类型
    const typeContainer = document.createElement('div');
    typeContainer.className = 'effect-type-container';

    const icon = document.createElement('div');
    icon.className = 'effect-icon';
    icon.innerHTML = this.availableEffects[effectData.type].icon;

    const name = document.createElement('div');
    name.className = 'effect-name';
    name.textContent = this.availableEffects[effectData.type].name;

    typeContainer.appendChild(icon);
    typeContainer.appendChild(name);

    // 右侧控制按钮
    const controls = document.createElement('div');
    controls.className = 'effect-controls';

    // 可见性切换按钮
    const visibilityButton = document.createElement('button');
    visibilityButton.className = 'effect-visibility-btn';
    visibilityButton.innerHTML = effectData.enabled ? '👁️' : '🚫';
    visibilityButton.title = effectData.enabled ? '隐藏特效' : '显示特效';

    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.className = 'effect-delete-btn';
    deleteButton.innerHTML = '—';
    deleteButton.title = '删除特效';

    // 事件监听
    item.addEventListener('click', () => {
      this.selectEffect(item, effectData);
    });

    visibilityButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleEffectVisibility(effectData, visibilityButton);
    });

    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteEffect(item, effectData);
    });

    controls.appendChild(visibilityButton);
    controls.appendChild(deleteButton);

    item.appendChild(typeContainer);
    item.appendChild(controls);

    // 创建详细设置面板
    const detailPanel = this.createEffectDetailPanel(effectData);
    item.appendChild(detailPanel);

    return item;
  }

  createEffectDetailPanel(effectData) {
    const panel = document.createElement('div');
    panel.className = 'effect-detail-panel';
    panel.style.display = 'none';

    switch (effectData.type) {
      case 'drop-shadow':
      case 'inner-shadow':
        this.createShadowControls(panel, effectData);
        break;
      case 'blur':
      case 'background-blur':
        this.createBlurControls(panel, effectData);
        break;
    }

    return panel;
  }

  createShadowControls(container, effectData) {
    // X偏移
    const xGroup = this.createControlGroup('X', container);
    const xInput = this.createNumberInput({
      value: effectData.x || 0,
      onChange: (value) => {
        effectData.x = value;
        this.applyEffectsToElement();
      }
    });
    xGroup.appendChild(xInput);

    // Y偏移
    const yGroup = this.createControlGroup('Y', container);
    const yInput = this.createNumberInput({
      value: effectData.y || 0,
      onChange: (value) => {
        effectData.y = value;
        this.applyEffectsToElement();
      }
    });
    yGroup.appendChild(yInput);

    // 模糊半径
    const blurGroup = this.createControlGroup('Blur', container);
    const blurInput = this.createNumberInput({
      value: effectData.blur || 0,
      min: 0,
      onChange: (value) => {
        effectData.blur = value;
        this.applyEffectsToElement();
      }
    });
    blurGroup.appendChild(blurInput);

    // 扩散（仅投影有此选项）
    if (effectData.type === 'drop-shadow') {
      const spreadGroup = this.createControlGroup('Spread', container);
      const spreadInput = this.createNumberInput({
        value: effectData.spread || 0,
        onChange: (value) => {
          effectData.spread = value;
          this.applyEffectsToElement();
        }
      });
      spreadGroup.appendChild(spreadInput);
    }

    // 颜色选择
    const colorGroup = this.createControlGroup('Color', container);
    const colorContainer = document.createElement('div');
    colorContainer.className = 'color-opacity-container';

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = effectData.color || '#000000';
    colorPicker.className = 'effect-color-picker';

    const opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = '0';
    opacitySlider.max = '100';
    opacitySlider.value = effectData.opacity || 100;
    opacitySlider.className = 'effect-opacity-slider';

    const opacityValue = document.createElement('span');
    opacityValue.className = 'effect-opacity-value';
    opacityValue.textContent = (effectData.opacity || 100) + '%';

    colorPicker.addEventListener('change', (e) => {
      effectData.color = e.target.value;
      this.applyEffectsToElement();
    });

    opacitySlider.addEventListener('input', (e) => {
      const opacity = parseInt(e.target.value);
      effectData.opacity = opacity;
      opacityValue.textContent = opacity + '%';
      this.applyEffectsToElement();
    });

    colorContainer.appendChild(colorPicker);
    colorContainer.appendChild(opacitySlider);
    colorContainer.appendChild(opacityValue);
    colorGroup.appendChild(colorContainer);
  }

  createBlurControls(container, effectData) {
    // 模糊半径
    const radiusGroup = this.createControlGroup('Radius', container);
    const radiusInput = this.createNumberInput({
      value: effectData.radius || 0,
      min: 0,
      step: 0.5,
      onChange: (value) => {
        effectData.radius = value;
        this.applyEffectsToElement();
      }
    });
    radiusGroup.appendChild(radiusInput);
  }

  createControlGroup(label, parent) {
    const group = document.createElement('div');
    group.className = 'effect-control-group';

    const labelElement = document.createElement('label');
    labelElement.className = 'effect-control-label';
    labelElement.textContent = label;

    const content = document.createElement('div');
    content.className = 'effect-control-content';

    group.appendChild(labelElement);
    group.appendChild(content);
    parent.appendChild(group);

    return content;
  }

  createNumberInput(options = {}) {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = options.value || 0;
    input.min = options.min !== undefined ? options.min : '';
    input.max = options.max !== undefined ? options.max : '';
    input.step = options.step || 1;
    input.className = 'effect-number-input';

    input.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) || 0;
      if (options.onChange) {
        options.onChange(value);
      }
    });

    return input;
  }

  createAddEffectButton(container) {
    const addButton = document.createElement('button');
    addButton.className = 'add-effect-button';
    addButton.innerHTML = '✚';
    addButton.title = '添加特效';

    addButton.addEventListener('click', () => {
      this.showAddEffectMenu(addButton);
    });

    container.appendChild(addButton);
  }

  showAddEffectMenu(button) {
    const menu = document.createElement('div');
    menu.className = 'add-effect-menu';

    Object.entries(this.availableEffects).forEach(([key, effect]) => {
      const option = document.createElement('button');
      option.className = 'add-effect-option';
      option.innerHTML = `<span class="effect-option-icon">${effect.icon}</span><span class="effect-option-name">${effect.name}</span>`;

      option.addEventListener('click', () => {
        this.addEffect(key);
        menu.remove();
      });

      menu.appendChild(option);
    });

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

  addEffect(type) {
    const effectData = {
      type: type,
      enabled: true,
      ...this.availableEffects[type].defaultProps
    };

    const effectItem = this.createEffectItem(effectData);
    this.effectsListElement.appendChild(effectItem);

    effectData.element = effectItem;
    this.effects.push(effectData);

    // 自动选中新添加的特效
    this.selectEffect(effectItem, effectData);

    // 立即应用特效
    this.applyEffectsToElement();
  }

  selectEffect(element, effectData) {
    // 取消其他选中状态
    this.effectsListElement.querySelectorAll('.effect-item').forEach(item => {
      item.classList.remove('selected');
      item.querySelector('.effect-detail-panel').style.display = 'none';
    });

    // 选中当前项
    element.classList.add('selected');
    element.querySelector('.effect-detail-panel').style.display = 'block';
  }

  toggleEffectVisibility(effectData, button) {
    effectData.enabled = !effectData.enabled;
    button.innerHTML = effectData.enabled ? '👁️' : '🚫';
    button.title = effectData.enabled ? '隐藏特效' : '显示特效';

    this.applyEffectsToElement();
  }

  deleteEffect(element, effectData) {
    const index = this.effects.indexOf(effectData);
    if (index > -1) {
      this.effects.splice(index, 1);
    }

    element.remove();
    this.applyEffectsToElement();
  }

  applyEffectsToElement() {
    if (!this.currentElement) return;

    // 重置现有效果
    this.currentElement.style.boxShadow = '';
    this.currentElement.style.filter = '';

    // 获取启用的特效
    const enabledEffects = this.effects.filter(effect => effect.enabled);

    if (enabledEffects.length === 0) {
      return;
    }

    // 分类处理不同类型的特效
    const shadows = [];
    const filters = [];

    enabledEffects.forEach(effect => {
      switch (effect.type) {
        case 'drop-shadow':
          const alpha = (effect.opacity || 100) / 100;
          const rgb = this.hexToRgb(effect.color || '#000000');
          const shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          shadows.push(`${effect.x || 0}px ${effect.y || 0}px ${effect.blur || 0}px ${effect.spread || 0}px ${shadowColor}`);
          break;

        case 'inner-shadow':
          const innerAlpha = (effect.opacity || 100) / 100;
          const innerRgb = this.hexToRgb(effect.color || '#000000');
          const innerShadowColor = `rgba(${innerRgb.r}, ${innerRgb.g}, ${innerRgb.b}, ${innerAlpha})`;
          shadows.push(`inset ${effect.x || 0}px ${effect.y || 0}px ${effect.blur || 0}px ${effect.spread || 0}px ${innerShadowColor}`);
          break;

        case 'blur':
          filters.push(`blur(${effect.radius || 0}px)`);
          break;

        case 'background-blur':
          filters.push(`backdrop-filter: blur(${effect.radius || 0}px)`);
          break;
      }
    });

    // 应用阴影
    if (shadows.length > 0) {
      this.currentElement.style.boxShadow = shadows.join(', ');
    }

    // 应用过滤器
    if (filters.length > 0) {
      const regularFilters = filters.filter(f => !f.startsWith('backdrop-filter'));
      const backdropFilters = filters.filter(f => f.startsWith('backdrop-filter'));

      if (regularFilters.length > 0) {
        this.currentElement.style.filter = regularFilters.join(' ');
      }

      if (backdropFilters.length > 0) {
        this.currentElement.style.backdropFilter = backdropFilters.map(f => f.split(': ')[1]).join(' ');
      }
    }

    this.notifyChange('effects', {
      boxShadow: this.currentElement.style.boxShadow,
      filter: this.currentElement.style.filter,
      backdropFilter: this.currentElement.style.backdropFilter
    });
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 解析现有的阴影和滤镜
    // 这里可以添加更复杂的解析逻辑，将现有样式转换为特效配置
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
        source: 'EffectsSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (this.element && this.element.querySelector('#effects-section-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'effects-section-styles';
    style.textContent = `
      .effects-section {
      }

      .effects-list-container {
        margin-bottom: 12px;
      }

      .effects-list-header {
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

      .effects-list-title {
        font-size: 12px;
        font-weight: 600;
        color: #ffffff;
      }

      .effects-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .effect-item {
        background: #2d2d2d;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .effect-item:hover {
        border-color: #505050;
      }

      .effect-item.selected {
        border-color: #0078d4;
        background: #363636;
      }

      .effect-item > div:first-child {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .effect-type-container {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .effect-icon {
        font-size: 18px;
      }

      .effect-name {
        font-size: 12px;
        font-weight: 600;
        color: #ffffff;
      }

      .effect-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .effect-visibility-btn,
      .effect-delete-btn {
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

      .effect-visibility-btn:hover,
      .effect-delete-btn:hover {
        background: #404040;
        border-color: #505050;
      }

      .effect-detail-panel {
        display: none;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #404040;
      }

      .effect-control-group {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .effect-control-group:last-child {
        margin-bottom: 0;
      }

      .effect-control-label {
        font-size: 11px;
        color: #cccccc;
        min-width: 50px;
        font-weight: 500;
      }

      .effect-control-content {
        flex: 1;
      }

      .effect-number-input {
        width: 100%;
        height: 28px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 4px;
        color: #ffffff;
        font-size: 12px;
        padding: 0 8px;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .effect-number-input:focus {
        border-color: #0078d4;
      }

      .color-opacity-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .effect-color-picker {
        width: 32px;
        height: 28px;
        border: 1px solid #404040;
        border-radius: 4px;
        background: none;
        cursor: pointer;
      }

      .effect-opacity-slider {
        flex: 1;
        height: 4px;
        background: #404040;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
        cursor: pointer;
      }

      .effect-opacity-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #ffffff;
        border: 2px solid #0078d4;
        border-radius: 50%;
        cursor: pointer;
      }

      .effect-opacity-value {
        font-size: 11px;
        color: #cccccc;
        min-width: 35px;
        text-align: right;
      }

      .add-effect-button {
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

      .add-effect-button:hover {
        background: #404040;
        border-color: #606060;
        color: #cccccc;
      }

      .add-effect-menu {
        background: #2d2d2d;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        min-width: 160px;
      }

      .add-effect-option {
        width: 100%;
        height: 36px;
        background: transparent;
        border: none;
        color: #ffffff;
        cursor: pointer;
        font-size: 12px;
        text-align: left;
        padding: 0 12px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .add-effect-option:hover {
        background: #404040;
      }

      .effect-option-icon {
        font-size: 16px;
      }

      .effect-option-name {
        flex: 1;
      }
    `;

    if (this.element) {
      this.element.appendChild(style);
    } else {
      document.head.appendChild(style);
    }
  }
};