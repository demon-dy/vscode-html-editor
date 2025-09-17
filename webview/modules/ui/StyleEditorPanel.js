/**
 * 样式编辑面板 - 处理复杂样式编辑（颜色、盒模型等）
 */
window.WVE = window.WVE || {};
window.WVE.StyleEditorPanel = class StyleEditorPanel {
  constructor(uiManager, tailwindManager) {
    this.logger = new window.WVE.Logger('StyleEditorPanel');
    this.uiManager = uiManager;
    this.tailwindManager = tailwindManager;

    this.root = null;
    this.panel = null;
    this.overlay = null;
    this.isOpen = false;
    this.currentField = null;
    this.currentElement = null;
    this.currentPanelType = null;
  }

  init() {
    this.logger.info('Initializing StyleEditorPanel');
    this.uiManager.initUIRoot();
    this.root = this.uiManager.getUIRoot();
    this.createPanel();
  }

  createPanel() {
    // 创建轻量级浮窗面板（类似overflow menu的设计）
    this.panel = document.createElement('div');
    this.panel.id = 'wve-style-editor-panel';
    this.panel.style.cssText = `
      position: fixed;
      background: rgba(18, 18, 18, 0.95);
      color: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(16px);
      display: none;
      z-index: 100000;
      font-family: var(--vscode-font-family, "Inter", "SF Pro Text", system-ui, -apple-system, "Segoe UI", sans-serif);
      min-width: 200px;
      max-width: 280px;
      padding: 12px;
    `;

    // 绑定全局点击关闭事件
    this.handleOutsideClick = this.handleOutsideClick.bind(this);

    this.root.appendChild(this.panel);
  }

  /**
   * 打开样式面板
   */
  open(panelType, fieldId, element, triggerElement) {
    this.logger.info('StyleEditorPanel.open called with:', {
      panelType: panelType,
      fieldId: fieldId,
      element: element,
      triggerElement: triggerElement
    });

    if (!element) {
      this.logger.warn('No element provided to StyleEditorPanel.open');
      return;
    }

    this.currentPanelType = panelType;
    this.currentField = fieldId;
    this.currentElement = element;

    // 清空面板内容
    this.panel.innerHTML = '';

    // 创建面板内容
    this.createPanelContent();

    // 定位面板（在触发元素附近）
    this.positionPanel(triggerElement);

    // 显示面板
    this.panel.style.display = 'block';
    this.isOpen = true;

    // 绑定全局点击事件
    setTimeout(() => {
      document.addEventListener('mousedown', this.handleOutsideClick, true);
    }, 0);

    // 替换图标
    window.WVE.LucideIcons?.replaceInRoot?.(this.panel);

    this.logger.debug(`Opened ${panelType} panel for ${fieldId}`);
  }

  /**
   * 关闭样式面板
   */
  close() {
    this.panel.style.display = 'none';
    this.isOpen = false;
    this.currentField = null;
    this.currentElement = null;
    this.currentPanelType = null;

    // 清理防抖定时器
    if (this.borderRadiusDebounceTimer) {
      clearTimeout(this.borderRadiusDebounceTimer);
      this.borderRadiusDebounceTimer = null;
    }

    // 移除全局点击事件
    document.removeEventListener('mousedown', this.handleOutsideClick, true);
  }

  /**
   * 创建面板内容
   */
  createPanelContent() {
    const content = this.createContent();
    this.panel.appendChild(content);
  }


  /**
   * 创建面板内容
   */
  createContent() {
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 0;
    `;

    switch (this.currentPanelType) {
      case 'color':
        content.appendChild(this.createColorEditor());
        break;
      case 'box-model':
        content.appendChild(this.createBoxModelEditor());
        break;
      case 'border':
        content.appendChild(this.createBorderEditor());
        break;
      case 'border-radius':
        content.appendChild(this.createBorderRadiusEditor());
        break;
      case 'display':
        content.appendChild(this.createDisplayEditor());
        break;
      case 'position':
        content.appendChild(this.createPositionEditor());
        break;
      case 'flex-direction':
        content.appendChild(this.createFlexDirectionEditor());
        break;
      case 'justify-content':
        content.appendChild(this.createJustifyContentEditor());
        break;
      case 'align-items':
        content.appendChild(this.createAlignItemsEditor());
        break;
      case 'gap':
        content.appendChild(this.createGapEditor());
        break;
      default:
        content.appendChild(this.createDefaultEditor());
    }

    return content;
  }

  /**
   * 创建颜色编辑器（轻量级设计）
   */
  createColorEditor() {
    const container = document.createElement('div');

    // 获取当前值
    const styles = this.tailwindManager.extractStyles(this.currentElement);
    const currentValue = this.getCurrentColorValue(styles);

    // 颜色选择器
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = this.normalizeColorForInput(currentValue);
    colorInput.style.cssText = `
      width: 100%;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      margin-bottom: 12px;
    `;

    // 常用颜色面板
    const presetColors = document.createElement('div');
    presetColors.style.cssText = `
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    `;

    const colors = [
      '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#dc2626'
    ];

    colors.forEach(color => {
      const preset = document.createElement('button');
      preset.type = 'button';
      preset.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: ${color};
        cursor: pointer;
        transition: transform 0.1s ease;
      `;
      preset.addEventListener('click', () => {
        colorInput.value = color;
        this.applyColorChange(color);
      });
      preset.addEventListener('mouseenter', () => {
        preset.style.transform = 'scale(1.1)';
      });
      preset.addEventListener('mouseleave', () => {
        preset.style.transform = 'scale(1)';
      });
      presetColors.appendChild(preset);
    });

    // HEX输入框
    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.value = this.normalizeColorForInput(currentValue);
    hexInput.placeholder = '#000000';
    hexInput.style.cssText = `
      width: 100%;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: inherit;
      font-size: 12px;
      text-align: center;
      font-family: monospace;
    `;

    // 事件绑定
    colorInput.addEventListener('input', () => {
      hexInput.value = colorInput.value;
      this.applyColorChange(colorInput.value);
    });

    hexInput.addEventListener('input', () => {
      if (this.isValidHex(hexInput.value)) {
        colorInput.value = hexInput.value;
        this.applyColorChange(hexInput.value);
      }
    });

    container.appendChild(colorInput);
    container.appendChild(presetColors);
    container.appendChild(hexInput);

    return container;
  }

  /**
   * 创建盒模型编辑器
   */
  createBoxModelEditor() {
    const container = document.createElement('div');

    // 获取当前值
    const styles = this.tailwindManager.extractStyles(this.currentElement);
    const currentValues = this.getCurrentBoxModelValues(styles);

    // 创建四个方向的输入
    const directions = [
      { key: 'top', label: '上' },
      { key: 'right', label: '右' },
      { key: 'bottom', label: '下' },
      { key: 'left', label: '左' }
    ];

    directions.forEach((direction) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      `;

      const label = document.createElement('label');
      label.textContent = `${direction.label}边距`;
      label.style.cssText = `
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        min-width: 60px;
      `;

      const input = document.createElement('input');
      input.type = 'number';
      input.value = currentValues[direction.key] || 0;
      input.style.cssText = `
        width: 80px;
        padding: 6px 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: inherit;
        font-size: 14px;
        text-align: center;
      `;

      const suffix = document.createElement('span');
      suffix.textContent = 'px';
      suffix.style.cssText = `
        margin-left: 8px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
      `;

      input.addEventListener('input', () => {
        this.applyBoxModelChange(direction.key, input.value);
      });

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(suffix);
      container.appendChild(row);
    });

    return container;
  }

  /**
   * 创建边框编辑器
   */
  createBorderEditor() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 20px;">
        <i class="wve-icon" data-lucide="construction" style="width: 32px; height: 32px; margin-bottom: 12px;"></i>
        <p>边框编辑器开发中...</p>
      </div>
    `;
    return container;
  }

  /**
   * 创建圆角编辑器
   */
  createBorderRadiusEditor() {
    const container = document.createElement('div');
    container.style.cssText = `
      padding: 8px;
    `;

    // 获取当前圆角值
    const currentValues = this.getCurrentBorderRadiusValues();

    // 防抖定时器
    this.borderRadiusDebounceTimer = null;

    // 创建标题
    const title = document.createElement('div');
    title.textContent = '圆角设置';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      color: rgba(255, 255, 255, 0.9);
    `;
    container.appendChild(title);

    // 创建四角输入控件
    const corners = [
      { key: 'TopLeft', label: '左上角', position: 'top-left' },
      { key: 'TopRight', label: '右上角', position: 'top-right' },
      { key: 'BottomRight', label: '右下角', position: 'bottom-right' },
      { key: 'BottomLeft', label: '左下角', position: 'bottom-left' }
    ];

    // 创建可视化圆角预览
    const preview = document.createElement('div');
    preview.style.cssText = `
      width: 80px;
      height: 80px;
      background: rgba(59, 130, 246, 0.3);
      border: 2px solid rgba(59, 130, 246, 0.8);
      margin: 12px auto;
      transition: border-radius 0.2s ease;
      border-radius: ${currentValues.topLeft}px ${currentValues.topRight}px ${currentValues.bottomRight}px ${currentValues.bottomLeft}px;
    `;
    container.appendChild(preview);

    // 统一设置按钮
    const unifiedContainer = document.createElement('div');
    unifiedContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    `;

    const unifiedInput = document.createElement('input');
    unifiedInput.type = 'number';
    unifiedInput.min = '0';
    unifiedInput.max = '100';
    unifiedInput.placeholder = '统一';
    unifiedInput.style.cssText = `
      flex: 1;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: inherit;
      padding: 6px 8px;
      font-size: 13px;
    `;

    const unifiedLabel = document.createElement('span');
    unifiedLabel.textContent = '统一设置';
    unifiedLabel.style.cssText = `
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      min-width: 60px;
    `;

    unifiedContainer.appendChild(unifiedLabel);
    unifiedContainer.appendChild(unifiedInput);
    container.appendChild(unifiedContainer);

    // 分别设置每个角
    const cornersContainer = document.createElement('div');
    cornersContainer.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    `;

    const inputs = {};

    corners.forEach(corner => {
      const cornerContainer = document.createElement('div');
      cornerContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      `;

      const label = document.createElement('span');
      label.textContent = corner.label;
      label.style.cssText = `
        min-width: 40px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
      `;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '100';
      input.value = currentValues[corner.key.charAt(0).toLowerCase() + corner.key.slice(1)];
      input.style.cssText = `
        flex: 1;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        color: inherit;
        padding: 4px 6px;
        font-size: 12px;
        width: 50px;
      `;

      inputs[corner.key] = input;

      // 实时更新预览和应用样式（带防抖）
      input.addEventListener('input', () => {
        // 立即更新预览
        this.updateBorderRadiusPreview(preview, inputs);

        // 防抖应用样式变更
        this.debouncedApplyBorderRadiusChange(corner.key, input.value);
      });

      cornerContainer.appendChild(label);
      cornerContainer.appendChild(input);
      cornersContainer.appendChild(cornerContainer);
    });

    container.appendChild(cornersContainer);

    // 统一设置事件（带防抖）
    unifiedInput.addEventListener('input', () => {
      const value = unifiedInput.value;
      Object.keys(inputs).forEach(key => {
        inputs[key].value = value;
      });

      // 立即更新预览
      this.updateBorderRadiusPreview(preview, inputs);

      // 防抖应用所有圆角变更
      this.debouncedApplyAllBorderRadiusChanges(inputs);
    });

    return container;
  }

  /**
   * 获取当前圆角值
   */
  getCurrentBorderRadiusValues() {
    const styles = this.tailwindManager.extractStyles(this.currentElement);
    const computed = window.getComputedStyle(this.currentElement);

    const getValue = (property) => {
      const value = computed.getPropertyValue(property);
      return this.extractNumericValue(value) || 0;
    };

    return {
      topLeft: getValue('border-top-left-radius'),
      topRight: getValue('border-top-right-radius'),
      bottomRight: getValue('border-bottom-right-radius'),
      bottomLeft: getValue('border-bottom-left-radius')
    };
  }

  /**
   * 提取数值
   */
  extractNumericValue(value) {
    if (!value) return 0;
    const match = value.toString().match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * 更新圆角预览
   */
  updateBorderRadiusPreview(preview, inputs) {
    const tl = inputs.TopLeft.value || 0;
    const tr = inputs.TopRight.value || 0;
    const br = inputs.BottomRight.value || 0;
    const bl = inputs.BottomLeft.value || 0;

    preview.style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
  }

  /**
   * 防抖应用单个圆角变更
   */
  debouncedApplyBorderRadiusChange(corner, value) {
    // 清除之前的定时器
    if (this.borderRadiusDebounceTimer) {
      clearTimeout(this.borderRadiusDebounceTimer);
    }

    // 设置新的防抖定时器
    this.borderRadiusDebounceTimer = setTimeout(() => {
      this.applyBorderRadiusChange(corner, value);
    }, 300); // 300ms 防抖延迟
  }

  /**
   * 防抖应用所有圆角变更
   */
  debouncedApplyAllBorderRadiusChanges(inputs) {
    // 清除之前的定时器
    if (this.borderRadiusDebounceTimer) {
      clearTimeout(this.borderRadiusDebounceTimer);
    }

    // 设置新的防抖定时器
    this.borderRadiusDebounceTimer = setTimeout(() => {
      this.applyAllBorderRadiusChanges(inputs);
    }, 300); // 300ms 防抖延迟
  }

  /**
   * 应用所有圆角变更
   */
  async applyAllBorderRadiusChanges(inputs) {
    const cssStyles = {};

    Object.keys(inputs).forEach(key => {
      const value = inputs[key].value;
      if (value) {
        const property = `border${key}Radius`;
        cssStyles[property] = parseFloat(value) + 'px';
      }
    });

    // 如果有变更，应用样式
    if (Object.keys(cssStyles).length > 0) {
      await this.applyCombinedBorderRadiusStyles(cssStyles);
    }
  }

  /**
   * 应用组合的圆角样式（减少请求次数）
   */
  async applyCombinedBorderRadiusStyles(cssStyles) {
    // 防止重复刷新
    if (document.documentElement.style.getPropertyValue('--wve-suppress-refresh') !== 'true') {
      document.documentElement.style.setProperty('--wve-suppress-refresh', 'true');
      setTimeout(() => {
        document.documentElement.style.removeProperty('--wve-suppress-refresh');
      }, 100);
    }

    try {
      await this.tailwindManager.saveStyleChanges(this.currentElement, cssStyles);
      this.logger.info('Applied combined border radius changes:', cssStyles);
    } catch (error) {
      this.logger.error('Failed to apply combined border radius changes:', error);

      // 降级到内联样式
      Object.keys(cssStyles).forEach(property => {
        this.currentElement.style[property] = cssStyles[property];
      });

      if (this.tailwindManager) {
        this.tailwindManager.sendInlineStyleOperation(this.currentElement);
      }
    }

    // 不触发额外的样式变更事件，避免重复处理
    // 样式应用已经通过 TailwindManager 处理
  }

  /**
   * 应用圆角变更
   */
  async applyBorderRadiusChange(corner, value) {
    const property = `border${corner}Radius`;
    const cssValue = parseFloat(value) + 'px';

    // 防止重复刷新
    if (document.documentElement.style.getPropertyValue('--wve-suppress-refresh') !== 'true') {
      document.documentElement.style.setProperty('--wve-suppress-refresh', 'true');
      setTimeout(() => {
        document.documentElement.style.removeProperty('--wve-suppress-refresh');
      }, 100);
    }

    try {
      const cssStyles = {};
      cssStyles[property] = cssValue;

      await this.tailwindManager.saveStyleChanges(this.currentElement, cssStyles);
      this.logger.info('Applied border radius change:', property, cssValue);
    } catch (error) {
      this.logger.error('Failed to apply border radius change:', error);

      // 降级到内联样式
      this.currentElement.style[property] = cssValue;

      if (this.tailwindManager) {
        this.tailwindManager.sendInlineStyleOperation(this.currentElement);
      }
    }

    // 不触发额外的样式变更事件，避免重复处理
    // 样式应用已经通过 TailwindManager 处理
  }

  /**
   * 创建默认编辑器
   */
  createDefaultEditor() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="text-align: center; color: rgba(255, 255, 255, 0.6); padding: 20px;">
        <i class="wve-icon" data-lucide="settings" style="width: 32px; height: 32px; margin-bottom: 12px;"></i>
        <p>该编辑器正在开发中...</p>
      </div>
    `;
    return container;
  }

  /**
   * 创建底部按钮
   */
  createFooter() {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px 24px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = '取消';
    cancelButton.style.cssText = `
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: inherit;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.15s ease;
    `;
    cancelButton.addEventListener('click', () => this.close());
    cancelButton.addEventListener('mouseenter', () => {
      cancelButton.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    cancelButton.addEventListener('mouseleave', () => {
      cancelButton.style.background = 'rgba(255, 255, 255, 0.05)';
    });

    footer.appendChild(cancelButton);
    return footer;
  }

  /**
   * 获取面板标题
   */
  getPanelTitle() {
    const titles = {
      color: '颜色设置',
      'box-model': '边距设置',
      border: '边框设置',
      display: '布局设置',
      image: '背景图片'
    };
    return titles[this.currentPanelType] || '样式设置';
  }

  /**
   * 获取当前颜色值
   */
  getCurrentColorValue(styles) {
    const property = this.currentField === 'backgroundColor' ? 'backgroundColor' : 'color';
    return styles.computed[property] || '#000000';
  }

  /**
   * 获取当前盒模型值
   */
  getCurrentBoxModelValues(styles) {
    const property = this.currentField; // padding 或 margin
    return {
      top: parseFloat(styles.computed[property + 'Top']) || 0,
      right: parseFloat(styles.computed[property + 'Right']) || 0,
      bottom: parseFloat(styles.computed[property + 'Bottom']) || 0,
      left: parseFloat(styles.computed[property + 'Left']) || 0
    };
  }

  /**
   * 将驼峰命名转换为短横线命名
   */
  camelToKebab(camelCase) {
    return camelCase.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 标准化颜色值用于输入框
   */
  normalizeColorForInput(color) {
    if (!color || color === 'transparent') {
      return '#000000';
    }

    // RGB to HEX conversion
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      const hex = '#' + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
      return hex;
    }

    if (color.startsWith('#')) {
      return color;
    }
    return '#000000';
  }

  /**
   * 验证十六进制颜色
   */
  isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex);
  }

  /**
   * 应用颜色变更 - 使用转换库进行样式处理
   */
  async applyColorChange(color) {
    if (!this.currentElement || !this.tailwindManager) {
      return;
    }

    try {
      // 创建CSS样式对象
      const cssStyles = {};
      const cssProperty = this.currentField === 'backgroundColor' ? 'backgroundColor' : 'color';
      cssStyles[cssProperty] = color;

      // 使用转换库将CSS转换为Tailwind类名并应用
      const tailwindClasses = await this.tailwindManager.saveStyleChanges(this.currentElement, cssStyles);

      this.logger.info('Applied color change:', color, 'as Tailwind:', tailwindClasses);
    } catch (error) {
      this.logger.error('Failed to apply color change:', error);

      // 降级到内联样式
      const property = this.currentField === 'backgroundColor' ? 'backgroundColor' : 'color';
      this.currentElement.style.setProperty(this.camelToKebab(property), color);

      // 直接发送内联样式操作，避免重复处理
      if (this.tailwindManager) {
        this.tailwindManager.sendInlineStyleOperation(this.currentElement);
      }
    }
  }

  /**
   * 应用盒模型变更 - 使用转换库进行样式处理
   */
  async applyBoxModelChange(direction, value) {
    if (!this.currentElement || !this.tailwindManager) {
      return;
    }

    try {
      const property = `${this.currentField}${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
      const cssValue = parseFloat(value) + 'px';

      // 创建CSS样式对象
      const cssStyles = {};
      cssStyles[property] = cssValue;

      // 使用转换库将CSS转换为Tailwind类名并应用
      const tailwindClasses = await this.tailwindManager.saveStyleChanges(this.currentElement, cssStyles);

      this.logger.info('Applied box model change:', property, cssValue, 'as Tailwind:', tailwindClasses);
    } catch (error) {
      this.logger.error('Failed to apply box model change:', error);

      // 降级到内联样式
      const property = `${this.currentField}${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
      const cssValue = parseFloat(value) + 'px';

      this.currentElement.style[property] = cssValue;

      // 直接发送内联样式操作，避免重复处理
      if (this.tailwindManager) {
        this.tailwindManager.sendInlineStyleOperation(this.currentElement);
      }
    }
  }

  /**
   * 处理外部点击
   */
  handleOutsideClick(event) {
    if (!this.isOpen) {
      return;
    }

    const path = event.composedPath ? event.composedPath() : [];
    if (path.includes(this.panel)) {
      return;
    }

    this.close();
  }

  /**
   * 创建显示类型编辑器
   */
  createDisplayEditor() {
    const container = document.createElement('div');
    container.style.cssText = `padding: 8px;`;

    // 获取当前值
    const currentValue = this.getCurrentLayoutValue('display');

    // 创建标题
    const title = document.createElement('div');
    title.textContent = '显示类型';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      color: rgba(255, 255, 255, 0.9);
    `;
    container.appendChild(title);

    // 显示类型选项
    const displayOptions = [
      { value: 'block', label: '块级', icon: 'square' },
      { value: 'inline', label: '内联', icon: 'minus' },
      { value: 'inline-block', label: '内联块', icon: 'rectangle-horizontal' },
      { value: 'flex', label: 'Flex', icon: 'layout-grid' },
      { value: 'grid', label: 'Grid', icon: 'grid-3x3' },
      { value: 'none', label: '隐藏', icon: 'eye-off' }
    ];

    const optionsGrid = document.createElement('div');
    optionsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    `;

    displayOptions.forEach(option => {
      const button = this.createOptionButton(option, currentValue, (value) => {
        this.applyLayoutChange('display', value);
      });
      optionsGrid.appendChild(button);
    });

    container.appendChild(optionsGrid);
    return container;
  }

  /**
   * 创建定位编辑器
   */
  createPositionEditor() {
    const container = document.createElement('div');
    container.style.cssText = `padding: 8px;`;

    const currentValue = this.getCurrentLayoutValue('position');

    const title = document.createElement('div');
    title.textContent = '定位方式';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      color: rgba(255, 255, 255, 0.9);
    `;
    container.appendChild(title);

    const positionOptions = [
      { value: 'static', label: '静态', icon: 'square' },
      { value: 'relative', label: '相对', icon: 'move' },
      { value: 'absolute', label: '绝对', icon: 'navigation' },
      { value: 'fixed', label: '固定', icon: 'pin' },
      { value: 'sticky', label: '粘性', icon: 'map-pin' }
    ];

    const optionsGrid = document.createElement('div');
    optionsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    `;

    positionOptions.forEach(option => {
      const button = this.createOptionButton(option, currentValue, (value) => {
        this.applyLayoutChange('position', value);
      });
      optionsGrid.appendChild(button);
    });

    container.appendChild(optionsGrid);
    return container;
  }

  /**
   * 创建Flex方向编辑器
   */
  createFlexDirectionEditor() {
    const container = document.createElement('div');
    container.style.cssText = `padding: 8px;`;

    const currentValue = this.getCurrentLayoutValue('flexDirection');

    const title = document.createElement('div');
    title.textContent = 'Flex方向';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      color: rgba(255, 255, 255, 0.9);
    `;
    container.appendChild(title);

    const flexOptions = [
      { value: 'row', label: '横向', icon: 'arrow-right' },
      { value: 'row-reverse', label: '横向反转', icon: 'arrow-left' },
      { value: 'column', label: '纵向', icon: 'arrow-down' },
      { value: 'column-reverse', label: '纵向反转', icon: 'arrow-up' }
    ];

    const optionsGrid = document.createElement('div');
    optionsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    `;

    flexOptions.forEach(option => {
      const button = this.createOptionButton(option, currentValue, (value) => {
        this.applyLayoutChange('flexDirection', value);
      });
      optionsGrid.appendChild(button);
    });

    container.appendChild(optionsGrid);
    return container;
  }

  /**
   * 创建主轴对齐编辑器
   */
  createJustifyContentEditor() {
    const container = document.createElement('div');
    container.style.cssText = `padding: 8px;`;

    const currentValue = this.getCurrentLayoutValue('justifyContent');

    const title = document.createElement('div');
    title.textContent = '主轴对齐';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      color: rgba(255, 255, 255, 0.9);
    `;
    container.appendChild(title);

    const justifyOptions = [
      { value: 'flex-start', label: '开始', icon: 'align-start-horizontal' },
      { value: 'center', label: '居中', icon: 'align-center-horizontal' },
      { value: 'flex-end', label: '结束', icon: 'align-end-horizontal' },
      { value: 'space-between', label: '两端', icon: 'align-horizontal-space-between' },
      { value: 'space-around', label: '环绕', icon: 'align-horizontal-space-around' },
      { value: 'space-evenly', label: '均匀', icon: 'align-horizontal-distribute-center' }
    ];

    const optionsGrid = document.createElement('div');
    optionsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
    `;

    justifyOptions.forEach(option => {
      const button = this.createOptionButton(option, currentValue, (value) => {
        this.applyLayoutChange('justifyContent', value);
      });
      optionsGrid.appendChild(button);
    });

    container.appendChild(optionsGrid);
    return container;
  }

  /**
   * 创建交叉轴对齐编辑器
   */
  createAlignItemsEditor() {
    const container = document.createElement('div');
    container.style.cssText = `padding: 8px;`;

    const currentValue = this.getCurrentLayoutValue('alignItems');

    const title = document.createElement('div');
    title.textContent = '交叉轴对齐';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      color: rgba(255, 255, 255, 0.9);
    `;
    container.appendChild(title);

    const alignOptions = [
      { value: 'flex-start', label: '开始', icon: 'align-start-vertical' },
      { value: 'center', label: '居中', icon: 'align-center-vertical' },
      { value: 'flex-end', label: '结束', icon: 'align-end-vertical' },
      { value: 'stretch', label: '拉伸', icon: 'expand-y' },
      { value: 'baseline', label: '基线', icon: 'baseline' }
    ];

    const optionsGrid = document.createElement('div');
    optionsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
    `;

    alignOptions.forEach(option => {
      const button = this.createOptionButton(option, currentValue, (value) => {
        this.applyLayoutChange('alignItems', value);
      });
      optionsGrid.appendChild(button);
    });

    container.appendChild(optionsGrid);
    return container;
  }

  /**
   * 创建间距编辑器
   */
  createGapEditor() {
    const container = document.createElement('div');
    container.style.cssText = `padding: 8px;`;

    const currentValue = this.getCurrentLayoutValue('gap');

    const title = document.createElement('div');
    title.textContent = '元素间距';
    title.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      color: rgba(255, 255, 255, 0.9);
    `;
    container.appendChild(title);

    // 数值输入
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    `;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '100';
    input.value = this.extractNumericValue(currentValue) || 0;
    input.style.cssText = `
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: inherit;
      padding: 6px 8px;
      font-size: 14px;
    `;

    const unit = document.createElement('span');
    unit.textContent = 'px';
    unit.style.cssText = `
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
    `;

    input.addEventListener('input', () => {
      this.applyLayoutChange('gap', input.value + 'px');
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(unit);
    container.appendChild(inputContainer);

    // 预设值
    const presetContainer = document.createElement('div');
    presetContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    `;

    const presets = [0, 4, 8, 12, 16, 20, 24, 32];
    presets.forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = preset;
      button.style.cssText = `
        padding: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        color: inherit;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.15s ease;
      `;

      const currentNum = this.extractNumericValue(currentValue) || 0;
      if (currentNum === preset) {
        button.style.background = 'rgba(59, 130, 246, 0.3)';
        button.style.borderColor = 'rgba(59, 130, 246, 0.6)';
      }

      button.addEventListener('click', () => {
        input.value = preset;
        this.applyLayoutChange('gap', preset + 'px');
      });

      presetContainer.appendChild(button);
    });

    container.appendChild(presetContainer);
    return container;
  }

  /**
   * 创建选项按钮
   */
  createOptionButton(option, currentValue, onSelect) {
    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 4px;
      padding: 12px 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: inherit;
      cursor: pointer;
      transition: background 0.15s ease;
      min-height: 60px;
    `;

    // 检查是否为当前选中的值
    if (currentValue === option.value) {
      button.style.background = 'rgba(59, 130, 246, 0.3)';
      button.style.borderColor = 'rgba(59, 130, 246, 0.6)';
    }

    const icon = document.createElement('i');
    icon.className = 'wve-icon';
    icon.setAttribute('data-lucide', option.icon);
    icon.style.cssText = `width: 16px; height: 16px;`;

    const label = document.createElement('span');
    label.textContent = option.label;
    label.style.cssText = `font-size: 11px; text-align: center;`;

    button.appendChild(icon);
    button.appendChild(label);

    button.addEventListener('click', () => {
      onSelect(option.value);
    });

    button.addEventListener('mouseenter', () => {
      if (currentValue !== option.value) {
        button.style.background = 'rgba(255, 255, 255, 0.1)';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (currentValue !== option.value) {
        button.style.background = 'rgba(255, 255, 255, 0.05)';
      }
    });

    return button;
  }

  /**
   * 获取当前布局值
   */
  getCurrentLayoutValue(property) {
    const styles = this.tailwindManager.extractStyles(this.currentElement);
    return styles.computed[property] || '';
  }

  /**
   * 应用布局变更
   */
  async applyLayoutChange(property, value) {
    if (!this.currentElement || !this.tailwindManager) {
      return;
    }

    // 设置刷新抑制标志
    this.suppressRefresh = true;

    try {
      // 创建CSS样式对象
      const cssStyles = {};
      cssStyles[property] = value;

      // 使用转换库将CSS转换为Tailwind类名并应用
      await this.tailwindManager.saveStyleChanges(this.currentElement, cssStyles);

      this.logger.info('Applied layout change:', property, value);

      // 抑制刷新，避免重复操作
      this.suppressRefresh = true;

      // 延迟刷新面板显示，避免与 Tailwind 转换冲突
      setTimeout(() => {
        this.refreshPanelContent();
        this.suppressRefresh = false;
      }, 300);

      // 不触发额外的样式变更事件，避免重复处理
      // 样式应用已经通过 TailwindManager 处理

    } catch (error) {
      this.logger.error('Failed to apply layout change:', error);

      // 降级到内联样式
      this.currentElement.style[property] = value;

      // 立即刷新面板显示
      this.refreshPanelContent();

      // 直接发送内联样式操作
      if (this.tailwindManager) {
        this.tailwindManager.sendInlineStyleOperation(this.currentElement);
      }
    } finally {
      // 延迟清除刷新抑制标志
      setTimeout(() => {
        this.suppressRefresh = false;
      }, 100);
    }
  }

  /**
   * 刷新面板内容
   */
  refreshPanelContent() {
    if (!this.isOpen || !this.currentPanelType) {
      return;
    }

    // 清空当前内容
    this.panel.innerHTML = '';

    // 重新创建内容
    this.createPanelContent();

    // 重新替换图标
    window.WVE.LucideIcons?.replaceInRoot?.(this.panel);

    this.logger.debug('Panel content refreshed for type:', this.currentPanelType);
  }

  /**
   * 定位面板
   */
  positionPanel(triggerElement) {
    if (!triggerElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const panelWidth = 240;
    const panelHeight = 200; // 估算高度
    const margin = 8;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = triggerRect.left;
    let top = triggerRect.bottom + margin;

    // 水平边界检查
    if (left + panelWidth > viewportWidth - margin) {
      left = triggerRect.right - panelWidth;
    }
    if (left < margin) {
      left = margin;
    }

    // 垂直边界检查，空间不够则在上方弹出
    if (top + panelHeight > viewportHeight - margin) {
      top = triggerRect.top - panelHeight - margin;
    }

    this.panel.style.left = left + 'px';
    this.panel.style.top = top + 'px';
  }
};