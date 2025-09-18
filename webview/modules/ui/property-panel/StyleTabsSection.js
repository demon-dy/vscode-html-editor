/**
 * 样式属性标签页区域
 * 对应新设计中的底部样式属性区域，包含外观、文字、效果、尺寸四个标签页
 */
window.WVE = window.WVE || {};
window.WVE.StyleTabsSection = class StyleTabsSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '样式属性 Style Properties',
      collapsed: false,
      className: 'style-tabs-section',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
    this.activeTab = 'appearance'; // 默认激活外观标签

    // 标签页定义
    this.tabs = {
      appearance: { name: '🎨 外观', icon: '🎨' },
      typography: { name: '📝 文字', icon: '📝' },
      effects: { name: '✨ 效果', icon: '✨' },
      size: { name: '📐 尺寸', icon: '📐' }
    };
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 创建标签页导航
    this.createTabNavigation(container);

    // 创建标签页内容区域
    this.createTabContent(container);

    // 初始化所有标签页内容
    this.initializeTabContents();

    this.injectStyles();

    // 延迟显示默认标签页，确保element已经设置
    setTimeout(() => {
      this.showTab(this.activeTab);
    }, 0);
  }

  createTabNavigation(container) {
    const tabNav = document.createElement('div');
    tabNav.className = 'style-tab-navigation';

    Object.entries(this.tabs).forEach(([key, tab]) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'style-tab-button';
      tabButton.dataset.tab = key;
      tabButton.innerHTML = `<span class="tab-icon">${tab.icon}</span><span class="tab-text">${tab.name.replace(/^[🎨📝✨📐]\s/, '')}</span>`;

      if (key === this.activeTab) {
        tabButton.classList.add('active');
      }

      tabButton.addEventListener('click', () => {
        this.showTab(key);
      });

      tabNav.appendChild(tabButton);
    });

    container.appendChild(tabNav);
  }

  createTabContent(container) {
    const tabContent = document.createElement('div');
    tabContent.className = 'style-tab-content';

    // 为每个标签页创建内容区域
    Object.keys(this.tabs).forEach(key => {
      const tabPanel = document.createElement('div');
      tabPanel.className = 'style-tab-panel';
      tabPanel.dataset.tab = key;
      tabPanel.style.display = key === this.activeTab ? 'block' : 'none';

      tabContent.appendChild(tabPanel);
    });

    container.appendChild(tabContent);
    this.tabContent = tabContent;
  }

  initializeTabContents() {
    // 初始化外观标签页
    this.initializeAppearanceTab();

    // 初始化文字标签页
    this.initializeTypographyTab();

    // 初始化效果标签页
    this.initializeEffectsTab();

    // 初始化尺寸标签页
    this.initializeSizeTab();
  }

  initializeAppearanceTab() {
    const panel = this.getTabPanel('appearance');

    // 背景色
    const backgroundGroup = this.createControlGroup('背景色', panel);
    const backgroundPicker = window.WVE.PropertyControls.createColorPicker({
      value: '#ffffff',
      onChange: (color) => this.updateStyle('backgroundColor', color)
    });
    backgroundGroup.appendChild(backgroundPicker);

    // 边框
    const borderGroup = this.createControlGroup('边框', panel);
    const borderControls = this.createBorderControls();
    borderGroup.appendChild(borderControls);

    // 圆角
    const radiusGroup = this.createControlGroup('圆角', panel);
    const radiusControls = this.createRadiusControls();
    radiusGroup.appendChild(radiusControls);

    // 透明度
    const opacityGroup = this.createControlGroup('透明度', panel);
    const opacitySlider = this.createOpacitySlider();
    opacityGroup.appendChild(opacitySlider);
  }

  initializeTypographyTab() {
    const panel = this.getTabPanel('typography');

    // 字体族
    const fontFamilyGroup = this.createControlGroup('字体', panel);
    const fontFamilySelect = this.createFontFamilySelect();
    fontFamilyGroup.appendChild(fontFamilySelect);

    // 字体大小
    const fontSizeGroup = this.createControlGroup('字体大小', panel);
    const fontSizeInput = window.WVE.PropertyControls.createInputWithDropdown({
      type: 'number',
      value: '16',
      options: ['px', 'em', 'rem', '%'],
      defaultUnit: 'px',
      onChange: (value, unit) => this.updateStyle('fontSize', value + unit)
    });
    fontSizeGroup.appendChild(fontSizeInput);

    // 字体颜色
    const colorGroup = this.createControlGroup('字体颜色', panel);
    const colorPicker = window.WVE.PropertyControls.createColorPicker({
      value: '#000000',
      onChange: (color) => this.updateStyle('color', color)
    });
    colorGroup.appendChild(colorPicker);

    // 字体粗细
    const weightGroup = this.createControlGroup('字体粗细', panel);
    const weightSelect = this.createFontWeightSelect();
    weightGroup.appendChild(weightSelect);

    // 行高
    const lineHeightGroup = this.createControlGroup('行高', panel);
    const lineHeightInput = window.WVE.PropertyControls.createInputWithDropdown({
      type: 'number',
      value: '1.5',
      options: ['', 'px', 'em', '%'],
      defaultUnit: '',
      onChange: (value, unit) => this.updateStyle('lineHeight', value + unit)
    });
    lineHeightGroup.appendChild(lineHeightInput);

    // 文本对齐
    const alignGroup = this.createControlGroup('文本对齐', panel);
    const alignButtons = this.createTextAlignButtons();
    alignGroup.appendChild(alignButtons);

    // 文本装饰
    const decorationGroup = this.createControlGroup('文本装饰', panel);
    const decorationButtons = this.createTextDecorationButtons();
    decorationGroup.appendChild(decorationButtons);
  }

  initializeEffectsTab() {
    const panel = this.getTabPanel('effects');

    // 盒阴影
    const shadowGroup = this.createControlGroup('盒阴影', panel);
    const shadowControls = this.createShadowControls();
    shadowGroup.appendChild(shadowControls);

    // 文字阴影
    const textShadowGroup = this.createControlGroup('文字阴影', panel);
    const textShadowControls = this.createTextShadowControls();
    textShadowGroup.appendChild(textShadowControls);

    // 过滤器
    const filterGroup = this.createControlGroup('过滤器', panel);
    const filterControls = this.createFilterControls();
    filterGroup.appendChild(filterControls);

    // 变换
    const transformGroup = this.createControlGroup('变换', panel);
    const transformControls = this.createTransformControls();
    transformGroup.appendChild(transformControls);
  }

  initializeSizeTab() {
    const panel = this.getTabPanel('size');

    // 宽度
    const widthGroup = this.createControlGroup('宽度', panel);
    const widthInput = window.WVE.PropertyControls.createInputWithDropdown({
      type: 'text',
      placeholder: 'auto',
      options: ['px', '%', 'em', 'rem', 'vw', 'auto'],
      defaultUnit: 'px',
      onChange: (value, unit) => this.updateStyle('width', value === 'auto' ? 'auto' : value + unit)
    });
    widthGroup.appendChild(widthInput);

    // 高度
    const heightGroup = this.createControlGroup('高度', panel);
    const heightInput = window.WVE.PropertyControls.createInputWithDropdown({
      type: 'text',
      placeholder: 'auto',
      options: ['px', '%', 'em', 'rem', 'vh', 'auto'],
      defaultUnit: 'px',
      onChange: (value, unit) => this.updateStyle('height', value === 'auto' ? 'auto' : value + unit)
    });
    heightGroup.appendChild(heightInput);

    // 最大宽度
    const maxWidthGroup = this.createControlGroup('最大宽度', panel);
    const maxWidthInput = window.WVE.PropertyControls.createInputWithDropdown({
      type: 'text',
      placeholder: 'none',
      options: ['px', '%', 'em', 'rem', 'vw', 'none'],
      defaultUnit: 'px',
      onChange: (value, unit) => this.updateStyle('maxWidth', value === 'none' ? 'none' : value + unit)
    });
    maxWidthGroup.appendChild(maxWidthInput);

    // 最小高度
    const minHeightGroup = this.createControlGroup('最小高度', panel);
    const minHeightInput = window.WVE.PropertyControls.createInputWithDropdown({
      type: 'text',
      placeholder: '0',
      options: ['px', '%', 'em', 'rem', 'vh'],
      defaultUnit: 'px',
      onChange: (value, unit) => this.updateStyle('minHeight', value + unit)
    });
    minHeightGroup.appendChild(minHeightInput);

    // 溢出处理
    const overflowGroup = this.createControlGroup('溢出', panel);
    const overflowSelect = this.createOverflowSelect();
    overflowGroup.appendChild(overflowSelect);
  }

  createControlGroup(title, parent) {
    const group = document.createElement('div');
    group.className = 'style-control-group';

    const label = document.createElement('div');
    label.className = 'control-group-label';
    label.textContent = title;

    const content = document.createElement('div');
    content.className = 'control-group-content';

    group.appendChild(label);
    group.appendChild(content);
    parent.appendChild(group);

    return content;
  }

  createBorderControls() {
    const container = document.createElement('div');
    container.className = 'border-controls';

    // 边框样式
    const styleSelect = document.createElement('select');
    styleSelect.className = 'border-style-select';
    const styles = ['none', 'solid', 'dashed', 'dotted', 'double'];
    styles.forEach(style => {
      const option = document.createElement('option');
      option.value = style;
      option.textContent = style;
      styleSelect.appendChild(option);
    });
    styleSelect.addEventListener('change', (e) => {
      this.updateStyle('borderStyle', e.target.value);
    });

    // 边框宽度
    const widthInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      min: '0',
      className: 'border-width-input',
      onChange: (value) => this.updateStyle('borderWidth', (value || 0) + 'px')
    });

    // 边框颜色
    const colorPicker = window.WVE.PropertyControls.createColorPicker({
      value: '#000000',
      onChange: (color) => this.updateStyle('borderColor', color)
    });

    this.controls.borderStyle = styleSelect;
    this.controls.borderWidth = widthInput;
    this.controls.borderColor = colorPicker;

    container.appendChild(styleSelect);
    container.appendChild(widthInput);
    container.appendChild(colorPicker);

    return container;
  }

  createRadiusControls() {
    const container = document.createElement('div');
    container.className = 'radius-controls';

    const radiusInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      min: '0',
      className: 'radius-input',
      onChange: (value) => this.updateStyle('borderRadius', (value || 0) + 'px')
    });

    this.controls.borderRadius = radiusInput;

    container.appendChild(radiusInput);

    const unitLabel = document.createElement('span');
    unitLabel.textContent = 'px';
    unitLabel.className = 'unit-label';
    container.appendChild(unitLabel);

    return container;
  }

  createOpacitySlider() {
    const container = document.createElement('div');
    container.className = 'opacity-controls';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = '1';
    slider.className = 'opacity-slider';

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'opacity-value';
    valueDisplay.textContent = '100%';

    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.updateStyle('opacity', value.toString());
      valueDisplay.textContent = Math.round(value * 100) + '%';
    });

    this.controls.opacity = slider;

    container.appendChild(slider);
    container.appendChild(valueDisplay);

    return container;
  }

  createFontFamilySelect() {
    const select = document.createElement('select');
    select.className = 'font-family-select';

    const fonts = [
      'inherit',
      'Arial, sans-serif',
      'Times New Roman, serif',
      'Courier New, monospace',
      'Helvetica, sans-serif',
      'Georgia, serif',
      'Verdana, sans-serif'
    ];

    fonts.forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font === 'inherit' ? '继承' : font.split(',')[0];
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.updateStyle('fontFamily', e.target.value);
    });

    this.controls.fontFamily = select;

    return select;
  }

  createFontWeightSelect() {
    const select = document.createElement('select');
    select.className = 'font-weight-select';

    const weights = [
      { value: 'normal', label: '正常' },
      { value: 'bold', label: '粗体' },
      { value: '100', label: '100 细体' },
      { value: '300', label: '300 轻体' },
      { value: '400', label: '400 正常' },
      { value: '500', label: '500 中等' },
      { value: '600', label: '600 半粗' },
      { value: '700', label: '700 粗体' },
      { value: '900', label: '900 黑体' }
    ];

    weights.forEach(weight => {
      const option = document.createElement('option');
      option.value = weight.value;
      option.textContent = weight.label;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.updateStyle('fontWeight', e.target.value);
    });

    this.controls.fontWeight = select;

    return select;
  }

  createTextAlignButtons() {
    const container = document.createElement('div');
    container.className = 'text-align-buttons';

    const alignments = [
      { value: 'left', icon: '≡', label: '左对齐' },
      { value: 'center', icon: '≣', label: '居中' },
      { value: 'right', icon: '≡', label: '右对齐' },
      { value: 'justify', icon: '≣', label: '两端对齐' }
    ];

    alignments.forEach(align => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: align.icon,
        tooltip: align.label,
        onClick: () => {
          this.updateStyle('textAlign', align.value);
          this.updateButtonGroup(container, align.value);
        }
      });
      button.dataset.value = align.value;
      container.appendChild(button);
    });

    this.controls.textAlign = container;

    return container;
  }

  createTextDecorationButtons() {
    const container = document.createElement('div');
    container.className = 'text-decoration-buttons';

    const decorations = [
      { value: 'none', label: '无' },
      { value: 'underline', label: '下划线' },
      { value: 'line-through', label: '删除线' },
      { value: 'overline', label: '上划线' }
    ];

    decorations.forEach(decoration => {
      const button = document.createElement('button');
      button.className = 'decoration-button';
      button.textContent = decoration.label;
      button.dataset.value = decoration.value;
      button.onclick = () => {
        this.updateStyle('textDecoration', decoration.value);
        this.updateButtonGroup(container, decoration.value);
      };
      container.appendChild(button);
    });

    this.controls.textDecoration = container;

    return container;
  }

  createShadowControls() {
    const container = document.createElement('div');
    container.className = 'shadow-controls';

    // X偏移
    const xInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'shadow-input',
      onChange: () => this.updateBoxShadow()
    });

    // Y偏移
    const yInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'shadow-input',
      onChange: () => this.updateBoxShadow()
    });

    // 模糊半径
    const blurInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      min: '0',
      className: 'shadow-input',
      onChange: () => this.updateBoxShadow()
    });

    // 阴影颜色
    const colorPicker = window.WVE.PropertyControls.createColorPicker({
      value: '#000000',
      onChange: () => this.updateBoxShadow()
    });

    this.controls.shadowX = xInput;
    this.controls.shadowY = yInput;
    this.controls.shadowBlur = blurInput;
    this.controls.shadowColor = colorPicker;

    const labels = ['X:', 'Y:', '模糊:', '颜色:'];
    const inputs = [xInput, yInput, blurInput, colorPicker];

    inputs.forEach((input, index) => {
      const group = document.createElement('div');
      group.className = 'shadow-input-group';

      const label = document.createElement('span');
      label.textContent = labels[index];
      label.className = 'shadow-label';

      group.appendChild(label);
      group.appendChild(input);
      container.appendChild(group);
    });

    return container;
  }

  createTextShadowControls() {
    // 类似盒阴影，但用于文字阴影
    const container = this.createShadowControls();
    container.className = 'text-shadow-controls';

    // 重新绑定事件处理器
    this.controls.textShadowX = this.controls.shadowX;
    this.controls.textShadowY = this.controls.shadowY;
    this.controls.textShadowBlur = this.controls.shadowBlur;
    this.controls.textShadowColor = this.controls.shadowColor;

    // 更新事件处理器
    [this.controls.textShadowX, this.controls.textShadowY, this.controls.textShadowBlur].forEach(input => {
      input.onchange = () => this.updateTextShadow();
    });
    this.controls.textShadowColor.onchange = () => this.updateTextShadow();

    return container;
  }

  createFilterControls() {
    const container = document.createElement('div');
    container.className = 'filter-controls';

    // 模糊
    const blurGroup = this.createFilterGroup('模糊', 'blur', 'px', 0);

    // 亮度
    const brightnessGroup = this.createFilterGroup('亮度', 'brightness', '%', 100);

    // 对比度
    const contrastGroup = this.createFilterGroup('对比度', 'contrast', '%', 100);

    container.appendChild(blurGroup);
    container.appendChild(brightnessGroup);
    container.appendChild(contrastGroup);

    return container;
  }

  createFilterGroup(label, filterName, unit, defaultValue) {
    const group = document.createElement('div');
    group.className = 'filter-group';

    const labelEl = document.createElement('span');
    labelEl.textContent = label + ':';
    labelEl.className = 'filter-label';

    const input = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: defaultValue.toString(),
      min: '0',
      className: 'filter-input',
      onChange: () => this.updateFilters()
    });

    const unitEl = document.createElement('span');
    unitEl.textContent = unit;
    unitEl.className = 'filter-unit';

    this.controls[filterName] = input;

    group.appendChild(labelEl);
    group.appendChild(input);
    group.appendChild(unitEl);

    return group;
  }

  createTransformControls() {
    const container = document.createElement('div');
    container.className = 'transform-controls';

    // 旋转
    const rotateGroup = document.createElement('div');
    rotateGroup.className = 'transform-group';

    const rotateLabel = document.createElement('span');
    rotateLabel.textContent = '旋转:';
    rotateLabel.className = 'transform-label';

    const rotateInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'transform-input',
      onChange: () => this.updateTransform()
    });

    const rotateUnit = document.createElement('span');
    rotateUnit.textContent = '°';
    rotateUnit.className = 'transform-unit';

    this.controls.rotate = rotateInput;

    rotateGroup.appendChild(rotateLabel);
    rotateGroup.appendChild(rotateInput);
    rotateGroup.appendChild(rotateUnit);

    // 缩放
    const scaleGroup = document.createElement('div');
    scaleGroup.className = 'transform-group';

    const scaleLabel = document.createElement('span');
    scaleLabel.textContent = '缩放:';
    scaleLabel.className = 'transform-label';

    const scaleInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '1',
      step: '0.1',
      min: '0',
      className: 'transform-input',
      onChange: () => this.updateTransform()
    });

    this.controls.scale = scaleInput;

    scaleGroup.appendChild(scaleLabel);
    scaleGroup.appendChild(scaleInput);

    container.appendChild(rotateGroup);
    container.appendChild(scaleGroup);

    return container;
  }

  createOverflowSelect() {
    const select = document.createElement('select');
    select.className = 'overflow-select';

    const options = [
      { value: 'visible', label: '可见' },
      { value: 'hidden', label: '隐藏' },
      { value: 'scroll', label: '滚动' },
      { value: 'auto', label: '自动' }
    ];

    options.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      select.appendChild(optionEl);
    });

    select.addEventListener('change', (e) => {
      this.updateStyle('overflow', e.target.value);
    });

    this.controls.overflow = select;

    return select;
  }

  /**
   * 显示指定标签页
   */
  showTab(tabKey) {
    // 如果element还没有创建，只更新activeTab状态
    if (!this.element) {
      this.activeTab = tabKey;
      return;
    }

    // 更新导航状态
    const navButtons = this.element.querySelectorAll('.style-tab-button');
    navButtons.forEach(btn => {
      if (btn.dataset.tab === tabKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 更新内容显示
    const panels = this.element.querySelectorAll('.style-tab-panel');
    panels.forEach(panel => {
      if (panel.dataset.tab === tabKey) {
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    });

    this.activeTab = tabKey;
  }

  getTabPanel(tabKey) {
    return this.tabContent.querySelector(`[data-tab="${tabKey}"]`);
  }

  /**
   * 更新样式
   */
  updateStyle(property, value) {
    if (!this.currentElement) return;

    this.currentElement.style[property] = value;
    this.notifyChange(property, value);
  }

  /**
   * 更新按钮组状态
   */
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

  /**
   * 更新盒阴影
   */
  updateBoxShadow() {
    const x = this.controls.shadowX.value || '0';
    const y = this.controls.shadowY.value || '0';
    const blur = this.controls.shadowBlur.value || '0';
    const color = this.controls.shadowColor.value || '#000000';

    const shadowValue = `${x}px ${y}px ${blur}px ${color}`;
    this.updateStyle('boxShadow', shadowValue);
  }

  /**
   * 更新文字阴影
   */
  updateTextShadow() {
    const x = this.controls.textShadowX.value || '0';
    const y = this.controls.textShadowY.value || '0';
    const blur = this.controls.textShadowBlur.value || '0';
    const color = this.controls.textShadowColor.value || '#000000';

    const shadowValue = `${x}px ${y}px ${blur}px ${color}`;
    this.updateStyle('textShadow', shadowValue);
  }

  /**
   * 更新过滤器
   */
  updateFilters() {
    const filters = [];

    if (this.controls.blur.value && this.controls.blur.value !== '0') {
      filters.push(`blur(${this.controls.blur.value}px)`);
    }

    if (this.controls.brightness.value && this.controls.brightness.value !== '100') {
      filters.push(`brightness(${this.controls.brightness.value}%)`);
    }

    if (this.controls.contrast.value && this.controls.contrast.value !== '100') {
      filters.push(`contrast(${this.controls.contrast.value}%)`);
    }

    const filterValue = filters.length > 0 ? filters.join(' ') : 'none';
    this.updateStyle('filter', filterValue);
  }

  /**
   * 更新变换
   */
  updateTransform() {
    const transforms = [];

    if (this.controls.rotate.value && this.controls.rotate.value !== '0') {
      transforms.push(`rotate(${this.controls.rotate.value}deg)`);
    }

    if (this.controls.scale.value && this.controls.scale.value !== '1') {
      transforms.push(`scale(${this.controls.scale.value})`);
    }

    const transformValue = transforms.length > 0 ? transforms.join(' ') : 'none';
    this.updateStyle('transform', transformValue);
  }

  /**
   * 从元素更新控件值
   */
  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 更新外观标签页
    this.updateAppearanceValues(style);

    // 更新文字标签页
    this.updateTypographyValues(style);

    // 更新效果标签页
    this.updateEffectsValues(style);

    // 更新尺寸标签页
    this.updateSizeValues(style);
  }

  updateAppearanceValues(style) {
    // 透明度
    if (this.controls.opacity) {
      this.controls.opacity.value = style.opacity || '1';
      const valueDisplay = this.controls.opacity.parentNode.querySelector('.opacity-value');
      if (valueDisplay) {
        valueDisplay.textContent = Math.round((parseFloat(style.opacity) || 1) * 100) + '%';
      }
    }

    // 边框
    if (this.controls.borderStyle) {
      this.controls.borderStyle.value = style.borderStyle || 'none';
    }
    if (this.controls.borderWidth) {
      this.controls.borderWidth.value = parseInt(style.borderWidth) || 0;
    }

    // 圆角
    if (this.controls.borderRadius) {
      this.controls.borderRadius.value = parseInt(style.borderRadius) || 0;
    }
  }

  updateTypographyValues(style) {
    // 字体族
    if (this.controls.fontFamily) {
      this.controls.fontFamily.value = style.fontFamily || 'inherit';
    }

    // 字体粗细
    if (this.controls.fontWeight) {
      this.controls.fontWeight.value = style.fontWeight || 'normal';
    }

    // 文本对齐
    if (this.controls.textAlign) {
      this.updateButtonGroup(this.controls.textAlign, style.textAlign || 'left');
    }

    // 文本装饰
    if (this.controls.textDecoration) {
      this.updateButtonGroup(this.controls.textDecoration, style.textDecoration || 'none');
    }
  }

  updateEffectsValues(style) {
    // 解析盒阴影
    if (style.boxShadow && style.boxShadow !== 'none') {
      const shadowMatch = style.boxShadow.match(/(-?\d+px)\s+(-?\d+px)\s+(-?\d+px)\s+(.*)/);
      if (shadowMatch && this.controls.shadowX) {
        this.controls.shadowX.value = parseInt(shadowMatch[1]) || 0;
        this.controls.shadowY.value = parseInt(shadowMatch[2]) || 0;
        this.controls.shadowBlur.value = parseInt(shadowMatch[3]) || 0;
      }
    }

    // 解析过滤器
    if (style.filter && style.filter !== 'none') {
      const blurMatch = style.filter.match(/blur\((\d+)px\)/);
      if (blurMatch && this.controls.blur) {
        this.controls.blur.value = blurMatch[1];
      }

      const brightnessMatch = style.filter.match(/brightness\((\d+)%\)/);
      if (brightnessMatch && this.controls.brightness) {
        this.controls.brightness.value = brightnessMatch[1];
      }

      const contrastMatch = style.filter.match(/contrast\((\d+)%\)/);
      if (contrastMatch && this.controls.contrast) {
        this.controls.contrast.value = contrastMatch[1];
      }
    }

    // 解析变换
    if (style.transform && style.transform !== 'none') {
      const rotateMatch = style.transform.match(/rotate\((-?\d+)deg\)/);
      if (rotateMatch && this.controls.rotate) {
        this.controls.rotate.value = rotateMatch[1];
      }

      const scaleMatch = style.transform.match(/scale\(([0-9.]+)\)/);
      if (scaleMatch && this.controls.scale) {
        this.controls.scale.value = scaleMatch[1];
      }
    }
  }

  updateSizeValues(style) {
    // 溢出
    if (this.controls.overflow) {
      this.controls.overflow.value = style.overflow || 'visible';
    }
  }

  /**
   * 更新组件以匹配当前元素
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    if (element) {
      this.updateFromElement(element);
    }
  }

  /**
   * 通知样式变更
   */
  notifyChange(property, value) {
    const event = new CustomEvent('wveStyleChange', {
      detail: {
        element: this.currentElement,
        property: property,
        value: value,
        source: 'StyleTabsSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (document.getElementById('style-tabs-styles')) return;

    const style = document.createElement('style');
    style.id = 'style-tabs-styles';
    style.textContent = `
      .style-tabs-section .section-content {
        padding: 0;
      }

      /* 标签页导航 */
      .style-tab-navigation {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border-bottom: 1px solid #404040;
        background: #2c2c2c;
      }

      .style-tab-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px 8px;
        background: transparent;
        border: none;
        color: #999999;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
      }

      .style-tab-button:hover {
        background: #363636;
        color: #cccccc;
      }

      .style-tab-button.active {
        background: #363636;
        color: #ffffff;
        border-bottom-color: #0078d4;
      }

      .tab-icon {
        font-size: 16px;
        line-height: 1;
      }

      .tab-text {
        font-size: 10px;
        font-weight: 500;
        line-height: 1;
      }

      /* 标签页内容 */
      .style-tab-content {
        max-height: 400px;
        overflow-y: auto;
        padding: 12px;
      }

      .style-tab-panel {
        display: none;
      }

      .style-tab-panel[data-tab="appearance"] {
        display: block;
      }

      /* 控件组 */
      .style-control-group {
        margin-bottom: 16px;
      }

      .control-group-label {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      .control-group-content {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
      }

      /* 边框控件 */
      .border-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .border-style-select {
        flex: 1;
        height: 24px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
      }

      .border-width-input {
        width: 50px;
        height: 24px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
        text-align: center;
      }

      /* 圆角控件 */
      .radius-controls {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .radius-input {
        width: 60px;
        height: 24px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
        text-align: center;
      }

      .unit-label {
        font-size: 10px;
        color: #999999;
      }

      /* 透明度控件 */
      .opacity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .opacity-slider {
        flex: 1;
        height: 4px;
        background: #404040;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
      }

      .opacity-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #0078d4;
        border-radius: 50%;
        cursor: pointer;
      }

      .opacity-value {
        font-size: 10px;
        color: #cccccc;
        min-width: 30px;
        text-align: right;
      }

      /* 字体选择器 */
      .font-family-select,
      .font-weight-select,
      .overflow-select {
        width: 100%;
        height: 24px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
      }

      /* 文本对齐按钮 */
      .text-align-buttons,
      .text-decoration-buttons {
        display: flex;
        gap: 4px;
      }

      .text-align-buttons button {
        width: 28px;
        height: 24px;
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #cccccc;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .text-align-buttons button:hover,
      .text-decoration-buttons button:hover {
        background: #404040;
        border-color: #505050;
      }

      .text-align-buttons button.active,
      .text-decoration-buttons button.active {
        background: #0078d4;
        border-color: #106ebe;
        color: #ffffff;
      }

      .decoration-button {
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #cccccc;
        font-size: 9px;
        padding: 4px 8px;
        cursor: pointer;
        white-space: nowrap;
      }

      /* 阴影控件 */
      .shadow-controls,
      .text-shadow-controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .shadow-input-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .shadow-label {
        font-size: 9px;
        color: #999999;
        min-width: 30px;
      }

      .shadow-input {
        flex: 1;
        height: 20px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
        text-align: center;
      }

      /* 过滤器控件 */
      .filter-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .filter-label {
        font-size: 9px;
        color: #999999;
        min-width: 40px;
      }

      .filter-input {
        width: 50px;
        height: 20px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
        text-align: center;
      }

      .filter-unit {
        font-size: 9px;
        color: #999999;
      }

      /* 变换控件 */
      .transform-controls {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .transform-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .transform-label {
        font-size: 9px;
        color: #999999;
        min-width: 40px;
      }

      .transform-input {
        width: 50px;
        height: 20px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
        text-align: center;
      }

      .transform-unit {
        font-size: 9px;
        color: #999999;
      }

      /* 滚动条样式 */
      .style-tab-content::-webkit-scrollbar {
        width: 6px;
      }

      .style-tab-content::-webkit-scrollbar-track {
        background: #2c2c2c;
      }

      .style-tab-content::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 3px;
      }

      .style-tab-content::-webkit-scrollbar-thumb:hover {
        background: #4a4a4a;
      }
    `;

    document.head.appendChild(style);
  }
};