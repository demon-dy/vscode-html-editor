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
      z-index: 2147483648;
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
    if (!element) {
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