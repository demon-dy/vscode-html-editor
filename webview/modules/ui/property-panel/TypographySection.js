/**
 * 排版设置区域
 * 主要用于当前元素内字体的排版，包括字体样式、字体粗细、字号、行高、字体间距、字体对齐方式等
 */
window.WVE = window.WVE || {};
window.WVE.TypographySection = class TypographySection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '排版 Typography',
      collapsed: false,
      className: 'typography-section',
      icon: '📝',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
  }

  createElement() {
    const element = super.createElement();
    this.injectStyles();
    return element;
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 字体选择和样式
    this.createFontSection(container);

    // 字体大小和行高
    this.createSizeSection(container);

    // 字符和行间距
    this.createSpacingSection(container);

    // 对齐方式
    this.createAlignmentSection(container);
  }

  createFontSection(container) {
    const section = this.createSection('字体 Font', container);

    // 字体选择器和样式行
    const fontRow = document.createElement('div');
    fontRow.className = 'typography-row';

    // 字体选择
    const fontSelect = document.createElement('select');
    fontSelect.className = 'font-family-select';

    const fonts = [
      { value: 'Inter', label: 'Inter' },
      { value: 'Arial', label: 'Arial' },
      { value: 'Helvetica', label: 'Helvetica' },
      { value: 'Times New Roman', label: 'Times New Roman' },
      { value: 'Georgia', label: 'Georgia' },
      { value: 'Courier New', label: 'Courier New' },
      { value: 'Verdana', label: 'Verdana' },
      { value: 'system-ui', label: 'System UI' }
    ];

    fonts.forEach(font => {
      const option = document.createElement('option');
      option.value = font.value;
      option.textContent = font.label;
      fontSelect.appendChild(option);
    });

    fontSelect.addEventListener('change', (e) => {
      this.updateStyle('fontFamily', e.target.value);
    });

    // 字体样式（Regular, Bold等）
    const styleSelect = document.createElement('select');
    styleSelect.className = 'font-style-select';

    const styles = [
      { value: 'normal', weight: '400', label: 'Regular' },
      { value: 'normal', weight: '500', label: 'Medium' },
      { value: 'normal', weight: '600', label: 'Semi Bold' },
      { value: 'normal', weight: '700', label: 'Bold' },
      { value: 'italic', weight: '400', label: 'Italic' },
      { value: 'italic', weight: '700', label: 'Bold Italic' }
    ];

    styles.forEach(style => {
      const option = document.createElement('option');
      option.value = `${style.style}|${style.weight}`;
      option.textContent = style.label;
      styleSelect.appendChild(option);
    });

    styleSelect.addEventListener('change', (e) => {
      const [fontStyle, fontWeight] = e.target.value.split('|');
      this.updateStyle('fontStyle', fontStyle);
      this.updateStyle('fontWeight', fontWeight);
    });

    this.controls.fontFamily = fontSelect;
    this.controls.fontStyle = styleSelect;

    fontRow.appendChild(fontSelect);
    fontRow.appendChild(styleSelect);
    section.appendChild(fontRow);
  }

  createSizeSection(container) {
    const section = this.createSection('大小 Size', container);

    const sizeRow = document.createElement('div');
    sizeRow.className = 'typography-row';

    // 字体大小
    const fontSizeContainer = this.createInputContainer('字号');
    const fontSizeInput = document.createElement('input');
    fontSizeInput.type = 'number';
    fontSizeInput.className = 'typography-number-input';
    fontSizeInput.value = '12';
    fontSizeInput.min = '1';

    const fontSizeUnit = document.createElement('select');
    fontSizeUnit.className = 'typography-unit-select';
    ['px', 'em', 'rem', '%'].forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      fontSizeUnit.appendChild(option);
    });

    fontSizeInput.addEventListener('input', () => {
      this.updateFontSize();
    });

    fontSizeUnit.addEventListener('change', () => {
      this.updateFontSize();
    });

    fontSizeContainer.appendChild(fontSizeInput);
    fontSizeContainer.appendChild(fontSizeUnit);

    // 行高
    const lineHeightContainer = this.createInputContainer('行高');
    const lineHeightSelect = document.createElement('select');
    lineHeightSelect.className = 'line-height-select';

    const lineHeights = [
      { value: '1', label: '100%' },
      { value: '1.2', label: '120%' },
      { value: '1.5', label: '150%' },
      { value: 'normal', label: 'Auto' }
    ];

    lineHeights.forEach(lh => {
      const option = document.createElement('option');
      option.value = lh.value;
      option.textContent = lh.label;
      lineHeightSelect.appendChild(option);
    });

    lineHeightSelect.addEventListener('change', (e) => {
      this.updateStyle('lineHeight', e.target.value);
    });

    lineHeightContainer.appendChild(lineHeightSelect);

    this.controls.fontSize = fontSizeInput;
    this.controls.fontSizeUnit = fontSizeUnit;
    this.controls.lineHeight = lineHeightSelect;

    sizeRow.appendChild(fontSizeContainer);
    sizeRow.appendChild(lineHeightContainer);
    section.appendChild(sizeRow);
  }

  createSpacingSection(container) {
    const section = this.createSection('间距 Spacing', container);

    const spacingRow = document.createElement('div');
    spacingRow.className = 'typography-row';

    // 字符间距
    const letterSpacingContainer = this.createInputContainer('字符间距');
    const letterSpacingInput = document.createElement('input');
    letterSpacingInput.type = 'number';
    letterSpacingInput.className = 'typography-number-input';
    letterSpacingInput.value = '0';
    letterSpacingInput.step = '0.1';

    const letterSpacingDisplay = document.createElement('span');
    letterSpacingDisplay.className = 'spacing-display';
    letterSpacingDisplay.textContent = '0%';

    letterSpacingInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) || 0;
      letterSpacingDisplay.textContent = value + '%';
      this.updateStyle('letterSpacing', value + 'px');
    });

    letterSpacingContainer.appendChild(letterSpacingInput);
    letterSpacingContainer.appendChild(letterSpacingDisplay);

    this.controls.letterSpacing = letterSpacingInput;

    spacingRow.appendChild(letterSpacingContainer);
    section.appendChild(spacingRow);
  }

  createAlignmentSection(container) {
    const section = this.createSection('对齐 Alignment', container);

    // 水平对齐
    const horizontalRow = document.createElement('div');
    horizontalRow.className = 'typography-row alignment-row';

    const horizontalButtons = this.createAlignmentButtons([
      { value: 'left', icon: '≡', label: '左对齐' },
      { value: 'center', icon: '≣', label: '居中' },
      { value: 'right', icon: '≡', label: '右对齐' },
      { value: 'justify', icon: '≫', label: '两端对齐' }
    ], 'textAlign');

    horizontalRow.appendChild(horizontalButtons);

    // 垂直对齐
    const verticalRow = document.createElement('div');
    verticalRow.className = 'typography-row alignment-row';

    const verticalButtons = this.createAlignmentButtons([
      { value: 'flex-start', icon: '⤴', label: '顶部对齐' },
      { value: 'center', icon: '↕', label: '垂直居中' },
      { value: 'flex-end', icon: '⤵', label: '底部对齐' },
      { value: 'stretch', icon: '⇕', label: '拉伸' }
    ], 'alignItems');

    verticalRow.appendChild(verticalButtons);

    this.controls.textAlign = horizontalButtons;
    this.controls.alignItems = verticalButtons;

    section.appendChild(horizontalRow);
    section.appendChild(verticalRow);
  }

  createSection(title, parent) {
    const section = document.createElement('div');
    section.className = 'typography-section-group';

    const header = document.createElement('div');
    header.className = 'typography-section-header';

    const titleElement = document.createElement('h4');
    titleElement.className = 'typography-section-title';
    titleElement.textContent = title;

    const gridIcon = document.createElement('div');
    gridIcon.className = 'grid-icon';
    gridIcon.innerHTML = '⊞';

    header.appendChild(gridIcon);
    header.appendChild(titleElement);

    const content = document.createElement('div');
    content.className = 'typography-section-content';

    section.appendChild(header);
    section.appendChild(content);
    parent.appendChild(section);

    return content;
  }

  createInputContainer(label) {
    const container = document.createElement('div');
    container.className = 'typography-input-container';

    const labelElement = document.createElement('label');
    labelElement.className = 'typography-input-label';
    labelElement.textContent = label;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'typography-input-wrapper';

    container.appendChild(labelElement);
    container.appendChild(inputWrapper);

    return inputWrapper;
  }

  createAlignmentButtons(alignments, property) {
    const container = document.createElement('div');
    container.className = 'alignment-buttons';

    alignments.forEach(align => {
      const button = document.createElement('button');
      button.className = 'alignment-button';
      button.innerHTML = align.icon;
      button.title = align.label;
      button.dataset.value = align.value;

      button.addEventListener('click', () => {
        this.updateStyle(property, align.value);
        this.updateButtonGroup(container, align.value);

        // 如果是垂直对齐，需要设置display为flex
        if (property === 'alignItems') {
          this.updateStyle('display', 'flex');
          this.updateStyle('flexDirection', 'column');
        }
      });

      container.appendChild(button);
    });

    return container;
  }

  updateFontSize() {
    const size = this.controls.fontSize.value || '12';
    const unit = this.controls.fontSizeUnit.value || 'px';
    this.updateStyle('fontSize', size + unit);
  }

  updateButtonGroup(group, activeValue) {
    const buttons = group.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.dataset.value === activeValue) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  updateStyle(property, value) {
    if (!this.currentElement) return;

    this.currentElement.style[property] = value;
    this.notifyChange(property, value);
  }

  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 更新字体族
    if (this.controls.fontFamily) {
      this.controls.fontFamily.value = style.fontFamily.split(',')[0].replace(/['"]/g, '') || 'Inter';
    }

    // 更新字体样式和粗细
    if (this.controls.fontStyle) {
      const fontStyle = style.fontStyle || 'normal';
      const fontWeight = style.fontWeight || '400';
      this.controls.fontStyle.value = `${fontStyle}|${fontWeight}`;
    }

    // 更新字体大小
    if (this.controls.fontSize) {
      const fontSize = parseInt(style.fontSize) || 12;
      this.controls.fontSize.value = fontSize;
    }

    // 更新行高
    if (this.controls.lineHeight) {
      const lineHeight = style.lineHeight;
      if (lineHeight === 'normal') {
        this.controls.lineHeight.value = 'normal';
      } else {
        const numericLineHeight = parseFloat(lineHeight);
        if (!isNaN(numericLineHeight)) {
          this.controls.lineHeight.value = numericLineHeight.toString();
        }
      }
    }

    // 更新字符间距
    if (this.controls.letterSpacing) {
      const letterSpacing = parseFloat(style.letterSpacing) || 0;
      this.controls.letterSpacing.value = letterSpacing;
      const display = this.controls.letterSpacing.parentNode.querySelector('.spacing-display');
      if (display) {
        display.textContent = letterSpacing + '%';
      }
    }

    // 更新文本对齐
    if (this.controls.textAlign) {
      this.updateButtonGroup(this.controls.textAlign, style.textAlign || 'left');
    }

    // 更新垂直对齐
    if (this.controls.alignItems) {
      this.updateButtonGroup(this.controls.alignItems, style.alignItems || 'flex-start');
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
        source: 'TypographySection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (this.element && this.element.querySelector('#typography-section-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'typography-section-styles';
    style.textContent = `
      .typography-section {
      }

      .typography-section-group {
        margin-bottom: 20px;
        background: #2d2d2d;
        border-radius: 8px;
        border: 1px solid #404040;
      }

      .typography-section-group:last-child {
        margin-bottom: 0;
      }

      .typography-section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-bottom: 1px solid #404040;
      }

      .grid-icon {
        font-size: 14px;
        color: #999999;
      }

      .typography-section-title {
        margin: 0;
        font-size: 12px;
        font-weight: 600;
        color: #ffffff;
      }

      .typography-section-content {
        padding: 16px;
      }

      .typography-row {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }

      .typography-row:last-child {
        margin-bottom: 0;
      }

      .font-family-select,
      .font-style-select {
        flex: 1;
        height: 32px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 6px;
        color: #ffffff;
        font-size: 12px;
        padding: 0 12px;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .font-family-select:focus,
      .font-style-select:focus {
        border-color: #0078d4;
      }

      .typography-input-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .typography-input-label {
        font-size: 10px;
        color: #999999;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .typography-input-wrapper {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 4px 8px;
        transition: border-color 0.2s ease;
      }

      .typography-input-wrapper:focus-within {
        border-color: #0078d4;
      }

      .typography-number-input {
        flex: 1;
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 12px;
        outline: none;
        text-align: center;
      }

      .typography-unit-select {
        background: transparent;
        border: none;
        color: #999999;
        font-size: 11px;
        outline: none;
        cursor: pointer;
      }

      .line-height-select {
        width: 100%;
        height: 32px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 6px;
        color: #ffffff;
        font-size: 12px;
        padding: 0 12px;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .line-height-select:focus {
        border-color: #0078d4;
      }

      .spacing-display {
        font-size: 11px;
        color: #999999;
        min-width: 30px;
        text-align: right;
      }

      .alignment-row {
        justify-content: center;
      }

      .alignment-buttons {
        display: flex;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 6px;
        overflow: hidden;
      }

      .alignment-button {
        width: 40px;
        height: 32px;
        background: transparent;
        border: none;
        color: #cccccc;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        border-right: 1px solid #404040;
      }

      .alignment-button:last-child {
        border-right: none;
      }

      .alignment-button:hover {
        background: #363636;
        color: #ffffff;
      }

      .alignment-button.active {
        background: #0078d4;
        color: #ffffff;
      }

      /* 响应式调整 */
      @media (max-width: 300px) {
        .typography-row {
          flex-direction: column;
          gap: 8px;
        }

        .alignment-buttons {
          width: 100%;
        }

        .alignment-button {
          flex: 1;
        }
      }
    `;

    if (this.element) {
      this.element.appendChild(style);
    } else {
      document.head.appendChild(style);
    }
  }
};