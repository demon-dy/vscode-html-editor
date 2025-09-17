/**
 * Effects 属性区域 - 1:1 复刻 Figma 效果面板
 */
window.WVE = window.WVE || {};
window.WVE.EffectsSection = class EffectsSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: 'Effects',
      collapsed: false,
      className: 'effects-section',
      actions: [
        {
          icon: 'grid-3x3',
          title: '效果样式',
          onClick: () => this.openEffectStyles()
        },
        {
          icon: 'plus',
          title: '添加效果',
          onClick: () => this.addEffect()
        }
      ],
      ...options
    });

    this.currentElement = null;
    this.effects = [];
    this.availableEffects = [
      { name: 'Drop shadow', type: 'drop-shadow' },
      { name: 'Inner shadow', type: 'inner-shadow' },
      { name: 'Layer blur', type: 'blur' },
      { name: 'Background blur', type: 'background-blur' }
    ];
  }

  /**
   * 创建区域内容
   */
  createContentElements(container) {
    // 默认阴影效果
    this.createDefaultEffect(container);
  }

  /**
   * 创建默认效果
   */
  createDefaultEffect(container) {
    const defaultEffect = this.createEffectControl({
      type: 'drop-shadow',
      enabled: false,
      x: 0,
      y: 4,
      blur: 8,
      spread: 0,
      color: '#000000',
      opacity: 25
    });

    container.appendChild(defaultEffect);
    this.effects.push(defaultEffect);
  }

  /**
   * 创建效果控件
   */
  createEffectControl(options = {}) {
    const {
      type = 'drop-shadow',
      enabled = false,
      x = 0,
      y = 4,
      blur = 8,
      spread = 0,
      color = '#000000',
      opacity = 25
    } = options;

    const wrapper = document.createElement('div');
    wrapper.className = 'effect-control';
    wrapper.style.cssText = `
      margin-bottom: 12px;
      padding: 8px;
      border-radius: 4px;
      background: ${enabled ? 'rgba(0, 120, 212, 0.1)' : 'transparent'};
      border: 1px solid ${enabled ? 'rgba(0, 120, 212, 0.3)' : 'transparent'};
    `;

    // 效果主控制行
    const mainControl = this.createEffectMainControl(type, enabled, color, opacity);
    wrapper.appendChild(mainControl);

    // 效果详细设置（展开时显示）
    const detailsControl = this.createEffectDetailsControl(type, x, y, blur, spread);
    detailsControl.style.display = enabled ? 'block' : 'none';
    wrapper.appendChild(detailsControl);

    // 存储效果数据
    wrapper._effectData = {
      type, enabled, x, y, blur, spread, color, opacity
    };

    return wrapper;
  }

  /**
   * 创建效果主控制行
   */
  createEffectMainControl(type, enabled, color, opacity) {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // 启用复选框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabled;
    checkbox.style.cssText = `
      width: 14px;
      height: 14px;
      accent-color: #0078d4;
    `;

    // 效果类型下拉
    const typeSelect = this.controls.createInputWithDropdown({
      value: this.getEffectDisplayName(type),
      dropdownOptions: this.availableEffects.map(effect => ({
        text: effect.name,
        value: effect.type,
        selected: effect.type === type
      })),
      onDropdownSelect: (option) => this.handleEffectTypeChange(row.parentElement, option.value),
      width: '100px'
    });

    // 颜色和透明度控制
    const colorControl = this.controls.createCompoundControl({
      color: color,
      percentage: opacity,
      visible: enabled,
      onColorChange: (newColor) => this.handleEffectColorChange(row.parentElement, newColor),
      onPercentageChange: (newOpacity) => this.handleEffectOpacityChange(row.parentElement, newOpacity),
      onVisibilityToggle: (newVisible) => this.handleEffectVisibilityChange(row.parentElement, newVisible),
      onDelete: () => this.deleteEffect(row.parentElement)
    });

    // 事件绑定
    checkbox.addEventListener('change', () => {
      this.handleEffectToggle(row.parentElement, checkbox.checked);
    });

    row.appendChild(checkbox);
    row.appendChild(typeSelect);
    row.appendChild(colorControl);

    return row;
  }

  /**
   * 创建效果详细设置
   */
  createEffectDetailsControl(type, x, y, blur, spread) {
    const details = document.createElement('div');
    details.className = 'effect-details';
    details.style.cssText = `
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #404040;
    `;

    if (type === 'drop-shadow' || type === 'inner-shadow') {
      details.appendChild(this.createShadowDetails(x, y, blur, spread));
    } else if (type === 'blur' || type === 'background-blur') {
      details.appendChild(this.createBlurDetails(blur));
    }

    return details;
  }

  /**
   * 创建阴影详细设置
   */
  createShadowDetails(x, y, blur, spread) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    `;

    // X偏移
    const xControl = this.controls.createLabelControl(
      'X',
      this.createNumberInput(x.toString(), {
        onChange: (value) => {
          const effectElement = document.activeElement?.closest('.effect-control');
          if (effectElement) {
            effectElement._effectData.x = parseFloat(value) || 0;
            this.applyEffect(effectElement);
          }
        },
        width: '60px'
      }),
      { labelWidth: '12px' }
    );

    // Y偏移
    const yControl = this.controls.createLabelControl(
      'Y',
      this.createNumberInput(y.toString(), {
        onChange: (value) => {
          const effectElement = document.activeElement?.closest('.effect-control');
          if (effectElement) {
            effectElement._effectData.y = parseFloat(value) || 0;
            this.applyEffect(effectElement);
          }
        },
        width: '60px'
      }),
      { labelWidth: '12px' }
    );

    // 模糊半径
    const blurControl = this.controls.createLabelControl(
      'Blur',
      this.createNumberInput(blur.toString(), {
        onChange: (value) => {
          const effectElement = document.activeElement?.closest('.effect-control');
          if (effectElement) {
            effectElement._effectData.blur = parseFloat(value) || 0;
            this.applyEffect(effectElement);
          }
        },
        width: '60px'
      }),
      { labelWidth: '20px' }
    );

    // 扩散半径
    const spreadControl = this.controls.createLabelControl(
      'Spread',
      this.createNumberInput(spread.toString(), {
        onChange: (value) => {
          const effectElement = document.activeElement?.closest('.effect-control');
          if (effectElement) {
            effectElement._effectData.spread = parseFloat(value) || 0;
            this.applyEffect(effectElement);
          }
        },
        width: '60px'
      }),
      { labelWidth: '35px' }
    );

    container.appendChild(xControl);
    container.appendChild(yControl);
    container.appendChild(blurControl);
    container.appendChild(spreadControl);

    return container;
  }

  /**
   * 创建模糊详细设置
   */
  createBlurDetails(blur) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const blurControl = this.controls.createLabelControl(
      'Blur',
      this.createNumberInput(blur.toString(), {
        onChange: (value) => {
          const effectElement = document.activeElement?.closest('.effect-control');
          if (effectElement) {
            effectElement._effectData.blur = parseFloat(value) || 0;
            this.applyEffect(effectElement);
          }
        },
        width: '60px'
      }),
      { labelWidth: '30px' }
    );

    container.appendChild(blurControl);
    return container;
  }

  /**
   * 获取效果显示名称
   */
  getEffectDisplayName(type) {
    const effect = this.availableEffects.find(e => e.type === type);
    return effect ? effect.name : type;
  }

  /**
   * 处理效果类型变更
   */
  handleEffectTypeChange(effectElement, newType) {
    const effectData = effectElement._effectData;
    effectData.type = newType;

    // 重新创建详细设置
    const detailsElement = effectElement.querySelector('.effect-details');
    if (detailsElement) {
      detailsElement.innerHTML = '';
      let newDetails;
      if (newType === 'drop-shadow' || newType === 'inner-shadow') {
        newDetails = this.createShadowDetails(effectData.x, effectData.y, effectData.blur, effectData.spread);
      } else {
        newDetails = this.createBlurDetails(effectData.blur);
      }
      detailsElement.appendChild(newDetails);
    }

    this.applyEffect(effectElement);
  }

  /**
   * 处理效果开关
   */
  handleEffectToggle(effectElement, enabled) {
    const effectData = effectElement._effectData;
    effectData.enabled = enabled;

    // 更新UI状态
    effectElement.style.background = enabled ? 'rgba(0, 120, 212, 0.1)' : 'transparent';
    effectElement.style.borderColor = enabled ? 'rgba(0, 120, 212, 0.3)' : 'transparent';

    const detailsElement = effectElement.querySelector('.effect-details');
    if (detailsElement) {
      detailsElement.style.display = enabled ? 'block' : 'none';
    }

    this.applyEffect(effectElement);
  }

  /**
   * 处理效果颜色变更
   */
  handleEffectColorChange(effectElement, color) {
    const effectData = effectElement._effectData;
    effectData.color = color;
    this.applyEffect(effectElement);
  }

  /**
   * 处理效果透明度变更
   */
  handleEffectOpacityChange(effectElement, opacity) {
    const effectData = effectElement._effectData;
    effectData.opacity = parseFloat(opacity) || 0;
    this.applyEffect(effectElement);
  }

  /**
   * 处理效果可见性变更
   */
  handleEffectVisibilityChange(effectElement, visible) {
    this.handleEffectToggle(effectElement, visible);
  }

  /**
   * 处理阴影参数变更
   */
  handleShadowParamChange(param, value) {
    // 需要通过事件冒泡找到当前正在编辑的效果元素
    // 这个方法应该通过事件处理器调用，而不是直接调用
    this.logger.debug('Shadow parameter changed:', param, value);
  }

  /**
   * 处理模糊参数变更
   */
  handleBlurParamChange(param, value) {
    // 需要通过事件冒泡找到当前正在编辑的效果元素
    // 这个方法应该通过事件处理器调用，而不是直接调用
    this.logger.debug('Blur parameter changed:', param, value);
  }

  /**
   * 应用效果到元素
   */
  applyEffect(effectElement) {
    if (!this.currentElement || !effectElement) return;

    const effectData = effectElement._effectData;

    if (!effectData.enabled) {
      // 禁用时清除效果
      this.clearEffects();
      return;
    }

    let filterValue = '';
    let boxShadowValue = '';

    switch (effectData.type) {
      case 'drop-shadow':
        boxShadowValue = `${effectData.x}px ${effectData.y}px ${effectData.blur}px ${effectData.spread}px ${this.createColorWithOpacity(effectData.color, effectData.opacity)}`;
        this.currentElement.style.boxShadow = boxShadowValue;
        break;

      case 'inner-shadow':
        boxShadowValue = `inset ${effectData.x}px ${effectData.y}px ${effectData.blur}px ${effectData.spread}px ${this.createColorWithOpacity(effectData.color, effectData.opacity)}`;
        this.currentElement.style.boxShadow = boxShadowValue;
        break;

      case 'blur':
        filterValue = `blur(${effectData.blur}px)`;
        this.currentElement.style.filter = filterValue;
        break;

      case 'background-blur':
        filterValue = `backdrop-filter: blur(${effectData.blur}px)`;
        this.currentElement.style.backdropFilter = `blur(${effectData.blur}px)`;
        break;
    }

    this.notifyChange('effect', {
      type: effectData.type,
      value: filterValue || boxShadowValue
    });
  }

  /**
   * 创建带透明度的颜色值
   */
  createColorWithOpacity(color, opacity) {
    const alpha = (opacity / 100).toFixed(2);

    if (color.startsWith('#')) {
      // 转换十六进制为 rgba
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    if (color.startsWith('rgb')) {
      // 替换现有 alpha 值或添加 alpha 值
      return color.replace(/rgba?\((.*?)\)/, (match, values) => {
        const parts = values.split(',').map(v => v.trim());
        if (parts.length === 3) {
          return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
        } else {
          parts[3] = alpha;
          return `rgba(${parts.join(', ')})`;
        }
      });
    }

    return color; // 其他格式保持原样
  }

  /**
   * 清除所有效果
   */
  clearEffects() {
    if (!this.currentElement) return;

    this.currentElement.style.boxShadow = '';
    this.currentElement.style.filter = '';
    this.currentElement.style.backdropFilter = '';
  }

  /**
   * 添加新效果
   */
  addEffect() {
    const newEffect = this.createEffectControl({
      type: 'drop-shadow',
      enabled: true,
      x: 0,
      y: 4,
      blur: 8,
      spread: 0,
      color: '#000000',
      opacity: 25
    });

    this.content.appendChild(newEffect);
    this.effects.push(newEffect);

    this.logger.info('Added new effect');
  }

  /**
   * 删除效果
   */
  deleteEffect(effectElement) {
    const index = this.effects.indexOf(effectElement);
    if (index > -1) {
      this.effects.splice(index, 1);
      effectElement.remove();

      // 如果删除的是当前应用的效果，清除样式
      if (effectElement._effectData.enabled) {
        this.clearEffects();
      }

      this.logger.info('Deleted effect');
    }
  }

  /**
   * 打开效果样式库
   */
  openEffectStyles() {
    this.logger.info('Opening effect styles');
    // 实现效果样式库面板
  }

  /**
   * 更新区域内容
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    if (!element) {
      return;
    }

    const styles = this.getElementStyles(element);

    // 分析现有效果
    this.analyzeExistingEffects(styles);
  }

  /**
   * 分析元素现有效果
   */
  analyzeExistingEffects(styles) {
    // 分析 box-shadow
    if (styles.boxShadow && styles.boxShadow !== 'none') {
      this.parseBoxShadow(styles.boxShadow);
    }

    // 分析 filter
    if (styles.filter && styles.filter !== 'none') {
      this.parseFilter(styles.filter);
    }

    // 分析 backdrop-filter
    if (styles.backdropFilter && styles.backdropFilter !== 'none') {
      this.parseBackdropFilter(styles.backdropFilter);
    }
  }

  /**
   * 解析 box-shadow 值
   */
  parseBoxShadow(boxShadowValue) {
    this.logger.debug('Parsing box-shadow:', boxShadowValue);
    // 实现 box-shadow 解析逻辑，更新对应效果控件
  }

  /**
   * 解析 filter 值
   */
  parseFilter(filterValue) {
    this.logger.debug('Parsing filter:', filterValue);
    // 实现 filter 解析逻辑，更新对应效果控件
  }

  /**
   * 解析 backdrop-filter 值
   */
  parseBackdropFilter(backdropFilterValue) {
    this.logger.debug('Parsing backdrop-filter:', backdropFilterValue);
    // 实现 backdrop-filter 解析逻辑，更新对应效果控件
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