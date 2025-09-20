/**
 * 布局模式选择器 - 整合所有布局相关设置的综合面板
 * 包含：布局方式选择、尺寸设置、布局参数、内外边距等
 */
window.WVE = window.WVE || {};
window.WVE.LayoutModeSection = class LayoutModeSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '布局设置 Layout Settings',
      collapsed: false,
      className: 'layout-mode-section',
      ...options
    });

    this.currentElement = null;
    this.currentLayout = 'none'; // none, flex, grid

    // 防抖同步机制
    this.syncDebounceTimer = null;
    this.syncDebounceDelay = 300; // 300ms 防抖延迟

    // 初始化 LayoutAdapter
    this.layoutAdapter = new window.WVE.LayoutAdapter();

    // 布局方式定义
    this.layoutTypes = {
      none: {
        name: '无布局',
        icon: 'file-text',
        description: '默认文档流，block/inline元素'
      },
      flex: {
        name: '自动布局',
        icon: 'split-square-horizontal',
        description: '现代响应式设计 (Flexbox)'
      },
      grid: {
        name: '网格布局',
        icon: 'grid-3x3',
        description: '复杂的二维布局 (Grid)'
      }
    };

    // 尺寸设置状态
    this.dimensions = {
      width: '',
      height: '',
      minWidth: '',
      minHeight: '',
      maxWidth: '',
      maxHeight: ''
    };

    // 内外边距状态
    this.spacing = {
      margin: { top: '', right: '', bottom: '', left: '', unified: true },
      padding: { top: '', right: '', bottom: '', left: '', unified: true }
    };

    // 布局特定参数
    this.layoutParams = {
      flex: {
        direction: 'row',
        wrap: 'nowrap',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        gap: ''
      },
      grid: {
        templateColumns: '',
        templateRows: '',
        gap: '',
        justifyItems: 'stretch',
        alignItems: 'stretch'
      }
    };

    // UI状态
    this.uiState = {
      dimensionsExpanded: false,
      spacingExpanded: false,
      clipContent: false,
      clipExpanded: false
    };

    // 裁剪选项
    this.clipOptions = {
      mode: 'none', // 'none', 'all', 'horizontal', 'vertical'
      horizontal: false,
      vertical: false
    };

    this.onLayoutChange = null; // 布局变更回调
  }

  /**
   * 重写 createElement 方法以注入样式到 Shadow DOM
   */
  createElement() {
    const element = super.createElement();

    // 在元素创建完成后注入样式到 Shadow DOM
    // 使用 setTimeout 确保元素完全初始化后再注入样式
    setTimeout(() => {
      this.injectStyles();
    }, 0);

    return element;
  }

  /**
   * 注入样式到 Shadow DOM
   */
  injectStyles() {
    // 避免重复注入样式
    if (this.element && this.element.querySelector('#layout-mode-section-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'layout-mode-section-styles';
    style.textContent = `
      .layout-mode-section .section-content {
        padding: 12px;
      }

      /* 尺寸输入框样式，参考 PositionSection */
      .dimension-input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .dimension-input-label {
        font-size: 10px;
        color: #cccccc;
        font-weight: 500;
      }

      .dimension-input-container {
        display: flex;
        align-items: center;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        overflow: hidden;
        height: 22px;
      }

      .dimension-input {
        flex: 1;
        height: 100%;
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 10px;
        padding: 0 6px;
        outline: none;
        min-width: 0;
      }

      .dimension-input::placeholder {
        color: #666666;
      }

      .dimension-unit-select {
        height: 100%;
        background: #2c2c2c;
        border: none;
        border-left: 1px solid #404040;
        color: #cccccc;
        font-size: 9px;
        padding: 0 6px;
        outline: none;
        cursor: pointer;
        flex-shrink: 0;
        min-width: 40px;
      }

      .dimension-auto-btn {
        height: 100%;
        background: #2c2c2c;
        border: none;
        border-left: 1px solid #404040;
        color: #666666;
        padding: 0 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        min-width: 28px;
      }

      .dimension-auto-btn:hover {
        color: #ffffff;
        background: #3c3c3c;
      }

      /* 通用样式 */
      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 8px;
      }
    `;

    // 注入到当前元素内部，确保样式能够生效
    if (this.element) {
      this.element.appendChild(style);
    } else {
      // 如果还没有元素，添加到 head
      document.head.appendChild(style);
    }
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 1. 布局方式选择器
    this.createLayoutSelector(container);

    // 2. 尺寸设置区域
    this.createDimensionsSection(container);

    // 3. 布局特定参数区域
    this.createLayoutParamsSection(container);

    // 4. 内外边距设置区域
    this.createSpacingSection(container);

    // 初始化 Lucide 图标
    setTimeout(() => this.initializeLucideIcons(container), 0);
  }

  createLayoutSelector(container) {
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'layout-selector-container';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '布局方式 Layout';

    // 布局方式按钮组
    const layoutsContainer = document.createElement('div');
    layoutsContainer.className = 'flex bg-[#2c2c2c] rounded gap-1 p-1 border border-[#3d3d3d] mb-3';

    Object.entries(this.layoutTypes).forEach(([key, layout]) => {
      const button = this.createLayoutButton(key, layout);
      layoutsContainer.appendChild(button);
    });

    sectionContainer.appendChild(title);
    sectionContainer.appendChild(layoutsContainer);
    container.appendChild(sectionContainer);
  }

  createDimensionsSection(container) {
    const section = document.createElement('div');
    section.className = 'dimensions-section mb-4';

    // 标题行
    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center justify-between mb-2';

    const title = document.createElement('div');
    title.className = 'section-title mb-0';
    title.textContent = '尺寸设置 Resizing';

    const moreBtn = document.createElement('button');
    moreBtn.className = 'text-xs text-gray-400 hover:text-white transition-colors';
    moreBtn.textContent = this.uiState.dimensionsExpanded ? '收起' : '更多';
    moreBtn.onclick = () => this.toggleDimensionsExpanded();

    titleRow.appendChild(title);
    titleRow.appendChild(moreBtn);

    // 基础尺寸设置
    const basicDimensions = document.createElement('div');
    basicDimensions.className = 'basic-dimensions grid grid-cols-2 gap-2 mb-2';

    // 宽度设置
    const widthGroup = this.createDimensionInput('width', '宽度', 'auto');
    basicDimensions.appendChild(widthGroup);

    // 高度设置
    const heightGroup = this.createDimensionInput('height', '高度', 'auto');
    basicDimensions.appendChild(heightGroup);

    // 扩展尺寸设置（最大最小值）
    const extendedDimensions = document.createElement('div');
    extendedDimensions.className = 'extended-dimensions';
    extendedDimensions.style.display = this.uiState.dimensionsExpanded ? 'block' : 'none';

    // 最小尺寸
    // const minTitle = document.createElement('div');
    // minTitle.className = 'text-xs text-gray-400 mb-1 mt-2';
    // minTitle.textContent = '最小尺寸';
    // extendedDimensions.appendChild(minTitle);

    const minDimensions = document.createElement('div');
    minDimensions.className = 'grid grid-cols-2 gap-2 mb-2';

    const minWidthGroup = this.createDimensionInput('minWidth', '最小宽度', 'Min W');
    const minHeightGroup = this.createDimensionInput('minHeight', '最小高度', 'Min H');
    minDimensions.appendChild(minWidthGroup);
    minDimensions.appendChild(minHeightGroup);
    extendedDimensions.appendChild(minDimensions);

    // 最大尺寸
    // const maxTitle = document.createElement('div');
    // maxTitle.className = 'text-xs text-gray-400 mb-1';
    // maxTitle.textContent = '最大尺寸';
    // extendedDimensions.appendChild(maxTitle);

    const maxDimensions = document.createElement('div');
    maxDimensions.className = 'grid grid-cols-2 gap-2';

    const maxWidthGroup = this.createDimensionInput('maxWidth', '最大宽度', 'Max W');
    const maxHeightGroup = this.createDimensionInput('maxHeight', '最大高度', 'Max H');
    maxDimensions.appendChild(maxWidthGroup);
    maxDimensions.appendChild(maxHeightGroup);
    extendedDimensions.appendChild(maxDimensions);

    section.appendChild(titleRow);
    section.appendChild(basicDimensions);
    section.appendChild(extendedDimensions);
    container.appendChild(section);

    // 保存引用
    this.dimensionsMoreBtn = moreBtn;
    this.extendedDimensionsContainer = extendedDimensions;
  }

  createLayoutParamsSection(container) {
    this.layoutParamsContainer = document.createElement('div');
    this.layoutParamsContainer.className = 'layout-params-section mb-4';

    container.appendChild(this.layoutParamsContainer);

    // 初始化时根据当前布局显示对应参数
    this.updateLayoutParams();
  }

  createSpacingSection(container) {
    const section = document.createElement('div');
    section.className = 'spacing-section mb-4';

    // 标题行
    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center justify-between mb-2';

    const title = document.createElement('div');
    title.className = 'section-title mb-0';
    title.textContent = '内外边距 Spacing';

    const moreBtn = document.createElement('button');
    moreBtn.className = 'text-xs text-gray-400 hover:text-white transition-colors';
    moreBtn.textContent = this.uiState.spacingExpanded ? '收起' : '更多';
    moreBtn.onclick = () => this.toggleSpacingExpanded();

    titleRow.appendChild(title);
    titleRow.appendChild(moreBtn);

    // 基础间距设置（统一设置）
    const basicSpacing = document.createElement('div');
    basicSpacing.className = 'basic-spacing grid grid-cols-2 gap-2 mb-2';

    // 外边距
    const marginGroup = this.createSpacingInput('margin', '外边距', 'M');
    basicSpacing.appendChild(marginGroup);

    // 内边距
    const paddingGroup = this.createSpacingInput('padding', '内边距', 'P');
    basicSpacing.appendChild(paddingGroup);

    // 扩展间距设置（单独设置每个方向）
    const extendedSpacing = document.createElement('div');
    extendedSpacing.className = 'extended-spacing';
    extendedSpacing.style.display = this.uiState.spacingExpanded ? 'block' : 'none';

    // 详细外边距设置
    extendedSpacing.appendChild(this.createDetailedSpacingSection('margin', '外边距详细设置'));

    // 详细内边距设置
    extendedSpacing.appendChild(this.createDetailedSpacingSection('padding', '内边距详细设置'));

    // 溢出裁剪设置
    const clipSection = document.createElement('div');
    clipSection.className = 'clip-section mt-3 pt-2 border-t border-gray-600';

    // 标题行（带更多按钮）
    const clipTitleRow = document.createElement('div');
    clipTitleRow.className = 'flex items-center justify-between mb-2';

    const clipCheckbox = document.createElement('label');
    clipCheckbox.className = 'flex items-center gap-2 text-xs text-gray-300 cursor-pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'w-3 h-3';
    checkbox.checked = this.uiState.clipContent;
    checkbox.addEventListener('change', (e) => this.toggleClipContent(e.target.checked));

    const checkText = document.createElement('span');
    checkText.textContent = '裁剪溢出内容';

    clipCheckbox.appendChild(checkbox);
    clipCheckbox.appendChild(checkText);

    const clipMoreBtn = document.createElement('button');
    clipMoreBtn.className = 'text-xs text-gray-400 hover:text-white transition-colors';
    clipMoreBtn.textContent = this.uiState.clipExpanded ? '收起' : '更多';
    clipMoreBtn.addEventListener('click', () => this.toggleClipExpanded());

    clipTitleRow.appendChild(clipCheckbox);
    clipTitleRow.appendChild(clipMoreBtn);

    // 扩展裁剪选项
    const extendedClip = document.createElement('div');
    extendedClip.className = 'extended-clip';
    extendedClip.style.display = this.uiState.clipExpanded ? 'block' : 'none';

    // 裁剪模式选择
    const clipModeGroup = document.createElement('div');
    clipModeGroup.className = 'clip-mode-group mt-2';

    const clipModeTitle = document.createElement('div');
    clipModeTitle.className = 'text-xs text-gray-400 mb-2';
    clipModeTitle.textContent = '裁剪模式';

    const clipModeOptions = document.createElement('div');
    clipModeOptions.className = 'grid grid-cols-2 gap-2';

    const clipModes = [
      { key: 'all', label: '全裁剪', value: 'hidden' },
      { key: 'horizontal', label: '横向裁剪', value: 'hidden auto' },
      { key: 'vertical', label: '纵向裁剪', value: 'auto hidden' },
      { key: 'none', label: '不裁剪', value: 'visible' }
    ];

    clipModes.forEach(mode => {
      const modeBtn = document.createElement('button');
      modeBtn.className = this.clipOptions.mode === mode.key
        ? 'clip-mode-btn active text-xs px-2 py-1 bg-blue-600 text-white rounded'
        : 'clip-mode-btn text-xs px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors';
      modeBtn.textContent = mode.label;
      modeBtn.setAttribute('data-clip-mode', mode.key);
      modeBtn.addEventListener('click', () => this.setClipMode(mode.key, mode.value));
      clipModeOptions.appendChild(modeBtn);
    });

    clipModeGroup.appendChild(clipModeTitle);
    clipModeGroup.appendChild(clipModeOptions);
    extendedClip.appendChild(clipModeGroup);

    clipSection.appendChild(clipTitleRow);
    clipSection.appendChild(extendedClip);

    section.appendChild(titleRow);
    section.appendChild(basicSpacing);
    section.appendChild(extendedSpacing);
    section.appendChild(clipSection);
    container.appendChild(section);

    // 保存引用
    this.spacingMoreBtn = moreBtn;
    this.extendedSpacingContainer = extendedSpacing;
    this.clipCheckbox = checkbox;
    this.clipMoreBtn = clipMoreBtn;
    this.extendedClipContainer = extendedClip;
  }

  createDimensionInput(type, label, placeholder) {
    const group = document.createElement('div');
    group.className = 'flex flex-col gap-1';
    group.style.maxWidth = '100%';
    group.style.minWidth = '0';

    const labelEl = document.createElement('div');
    labelEl.className = 'text-xs text-gray-400 font-medium';
    labelEl.textContent = label;

    const inputContainer = document.createElement('div');
    inputContainer.className = 'position-input-container';

    const input = document.createElement('input');
    input.type = 'text';
    // input.className = 'flex-1 bg-transparent border-0 text-white text-xs outline-0';
    input.className = 'position-input';
    input.placeholder = placeholder;
    input.value = this.dimensions[type] || '';
    input.setAttribute('data-dimension', type); // 添加 data 属性用于查找
    input.addEventListener('change', (e) => this.updateDimension(type, e.target.value));

    const unitSelect = document.createElement('select');
    unitSelect.className = 'position-unit-select';
    unitSelect.setAttribute('data-dimension-unit', type); // 添加 data 属性用于查找

    const units = ['px', '%', 'em', 'rem', 'vw', 'vh', 'auto'];
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      unitSelect.appendChild(option);
    });

    unitSelect.addEventListener('change', (e) => this.updateDimensionUnit(type, input.value, e.target.value));

    inputContainer.appendChild(input);
    inputContainer.appendChild(unitSelect);

    // 自适应按钮（对于支持的属性）
    if (this.supportsAutoWidth(type)) {
      const autoBtn = document.createElement('button');
      autoBtn.className = 'bg-[#2c2c2c] border-0 text-[#666666] hover:text-white hover:bg-[#3c3c3c] cursor-pointer flex items-center justify-center transition-colors';
      autoBtn.style.height = '100%';
      autoBtn.style.borderLeft = '1px solid #404040';
      autoBtn.style.padding = '0 6px';
      autoBtn.style.flexShrink = '0';
      autoBtn.style.minWidth = '28px';
      autoBtn.innerHTML = '<i data-lucide="maximize-2" class="w-3 h-3"></i>';
      autoBtn.title = '自适应';
      autoBtn.addEventListener('click', () => this.setDimensionAuto(type));
      inputContainer.appendChild(autoBtn);
    }

    group.appendChild(labelEl);
    group.appendChild(inputContainer);

    return group;
  }

  createSpacingInput(type, label, placeholder) {
    const group = document.createElement('div');
    group.className = 'flex flex-col gap-1';
    group.style.maxWidth = '100%';
    group.style.minWidth = '0';

    const labelEl = document.createElement('div');
    labelEl.className = 'text-xs text-gray-400 font-medium';
    labelEl.textContent = label;

    const inputContainer = document.createElement('div');
    inputContainer.className = 'position-input-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'position-input';
    input.placeholder = placeholder;
    input.setAttribute('data-spacing', type); // 添加 data 属性用于查找
    input.addEventListener('change', (e) => this.updateSpacing(type, e.target.value, true));

    const unitSelect = document.createElement('select');
    unitSelect.className = 'position-unit-select';
    unitSelect.setAttribute('data-spacing-unit', type); // 添加 data 属性用于查找

    const units = ['px', 'em', 'rem', '%', 'vw', 'vh'];
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      unitSelect.appendChild(option);
    });

    unitSelect.addEventListener('change', (e) => this.updateSpacingUnit(type, input.value, e.target.value));

    inputContainer.appendChild(input);
    inputContainer.appendChild(unitSelect);

    group.appendChild(labelEl);
    group.appendChild(inputContainer);

    return group;
  }

  createDetailedSpacingSection(type, title) {
    const section = document.createElement('div');
    section.className = 'detailed-spacing-section mt-3';

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'text-xs text-gray-400 mb-2';
    sectionTitle.textContent = title;

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-2';

    const directions = [
      { key: 'top', label: '上' },
      { key: 'right', label: '右' },
      { key: 'bottom', label: '下' },
      { key: 'left', label: '左' }
    ];

    directions.forEach(direction => {
      const input = this.createDirectionalSpacingInput(type, direction.key, direction.label);
      grid.appendChild(input);
    });

    section.appendChild(sectionTitle);
    section.appendChild(grid);

    return section;
  }

  createDirectionalSpacingInput(type, direction, label) {
    const group = document.createElement('div');
    group.className = 'flex flex-col gap-1';
    group.style.maxWidth = '100%';
    group.style.minWidth = '0';

    const labelEl = document.createElement('div');
    labelEl.className = 'text-xs text-gray-400 font-medium';
    labelEl.textContent = label;

    const inputContainer = document.createElement('div');
    inputContainer.className = 'flex items-center bg-[#1e1e1e] overflow-hidden';
    inputContainer.style.height = '22px';
    inputContainer.style.width = '100%';
    inputContainer.style.maxWidth = '100%';
    inputContainer.style.border = '1px solid #404040';
    inputContainer.style.borderRadius = '3px';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'flex-1 bg-transparent border-0 text-white text-xs outline-0';
    input.style.height = '100%';
    input.style.padding = '0 6px';
    input.style.minWidth = '0';
    input.placeholder = '0';
    input.value = this.spacing[type][direction] || '';
    input.setAttribute('data-directional-spacing', `${type}-${direction}`); // 添加 data 属性用于查找
    input.addEventListener('change', (e) => this.updateDirectionalSpacing(type, direction, e.target.value));

    const unitSelect = document.createElement('select');
    unitSelect.className = 'bg-[#2c2c2c] border-0 text-[#cccccc] text-xs outline-0 cursor-pointer';
    unitSelect.style.height = '100%';
    unitSelect.style.borderLeft = '1px solid #404040';
    unitSelect.style.padding = '0 6px';
    unitSelect.style.flexShrink = '0';
    unitSelect.style.minWidth = '40px';
    unitSelect.setAttribute('data-directional-spacing-unit', `${type}-${direction}`); // 添加 data 属性用于查找

    const units = ['px', 'em', 'rem', '%', 'vw', 'vh'];
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      unitSelect.appendChild(option);
    });

    unitSelect.addEventListener('change', (e) => this.updateDirectionalSpacingUnit(type, direction, input.value, e.target.value));

    inputContainer.appendChild(input);
    inputContainer.appendChild(unitSelect);

    group.appendChild(labelEl);
    group.appendChild(inputContainer);

    return group;
  }

  createLayoutButton(layoutKey, layout) {
    const button = document.createElement('div');
    button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
    button.dataset.layout = layoutKey;
    button.title = `${layout.name} - ${layout.description}`;

    // 图标 - 使用 Lucide 图标
    const icon = document.createElement('i');
    icon.className = 'w-4 h-4';
    icon.setAttribute('data-lucide', layout.icon);

    button.appendChild(icon);

    // 点击事件
    button.addEventListener('click', () => {
      this.selectLayout(layoutKey);
    });

    return button;
  }

  // 布局特定参数UI创建方法
  createFlexParams() {
    const container = document.createElement('div');
    container.className = 'flex-params-container';

    const title = document.createElement('div');
    title.className = 'section-title mb-2';
    title.textContent = 'Flex 布局参数';

    // 方向选择
    const directionGroup = this.createParamGroup('方向', [
      { value: 'row', label: '水平', icon: 'arrow-right' },
      { value: 'column', label: '垂直', icon: 'arrow-down' }
    ], this.layoutParams.flex.direction, (value) => this.updateFlexParam('direction', value));

    // 主轴对齐
    const justifyGroup = this.createParamGroup('主轴对齐', [
      { value: 'flex-start', label: '开始', icon: 'align-left' },
      { value: 'center', label: '居中', icon: 'align-center' },
      { value: 'flex-end', label: '结束', icon: 'align-right' },
      { value: 'space-between', label: '两端', icon: 'space-between-horizontal' }
    ], this.layoutParams.flex.justifyContent, (value) => this.updateFlexParam('justifyContent', value));

    // 交叉轴对齐
    const alignGroup = this.createParamGroup('交叉轴对齐', [
      { value: 'stretch', label: '拉伸', icon: 'maximize' },
      { value: 'flex-start', label: '开始', icon: 'align-start-vertical' },
      { value: 'center', label: '居中', icon: 'align-center-vertical' },
      { value: 'flex-end', label: '结束', icon: 'align-end-vertical' }
    ], this.layoutParams.flex.alignItems, (value) => this.updateFlexParam('alignItems', value));

    // 间距设置
    const gapInput = this.createGapInput('gap', '间距', this.layoutParams.flex.gap, (value) => this.updateFlexParam('gap', value));

    container.appendChild(title);
    container.appendChild(directionGroup);
    container.appendChild(justifyGroup);
    container.appendChild(alignGroup);
    container.appendChild(gapInput);

    return container;
  }

  createGridParams() {
    const container = document.createElement('div');
    container.className = 'grid-params-container';

    const title = document.createElement('div');
    title.className = 'section-title mb-2';
    title.textContent = 'Grid 布局参数';

    // 网格模板
    const templatesGroup = document.createElement('div');
    templatesGroup.className = 'grid grid-cols-1 gap-2 mb-3';

    const columnsInput = this.createTemplateInput('列模板', 'repeat(3, 1fr)', this.layoutParams.grid.templateColumns, (value) => this.updateGridParam('templateColumns', value));
    const rowsInput = this.createTemplateInput('行模板', 'auto', this.layoutParams.grid.templateRows, (value) => this.updateGridParam('templateRows', value));

    templatesGroup.appendChild(columnsInput);
    templatesGroup.appendChild(rowsInput);

    // 间距设置
    const gapInput = this.createGapInput('gap', '网格间距', this.layoutParams.grid.gap, (value) => this.updateGridParam('gap', value));

    container.appendChild(title);
    container.appendChild(templatesGroup);
    container.appendChild(gapInput);

    return container;
  }

  createNoneParams() {
    const container = document.createElement('div');
    container.className = 'none-params-container';

    const title = document.createElement('div');
    title.className = 'section-title mb-2';
    title.textContent = '文档流布局';

    const description = document.createElement('div');
    description.className = 'text-xs text-gray-400';
    description.textContent = '元素按照标准文档流排列，无特殊布局参数。';

    container.appendChild(title);
    container.appendChild(description);

    return container;
  }

  createParamGroup(label, options, currentValue, onChange) {
    const group = document.createElement('div');
    group.className = 'param-group mb-3';

    const labelEl = document.createElement('div');
    labelEl.className = 'text-xs text-gray-400 mb-1';
    labelEl.textContent = label;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex bg-[#2c2c2c] rounded gap-1 p-1 border border-[#3d3d3d]';

    options.forEach(option => {
      const button = document.createElement('div');
      button.className = `flex items-center justify-center px-2 py-1 rounded text-xs cursor-pointer transition-all duration-200 ${
        currentValue === option.value
          ? 'bg-white text-black'
          : 'text-gray-400 hover:text-white hover:bg-[#3d3d3d]'
      }`;
      button.textContent = option.label;
      button.onclick = () => onChange(option.value);
      buttonsContainer.appendChild(button);
    });

    group.appendChild(labelEl);
    group.appendChild(buttonsContainer);

    return group;
  }

  createGapInput(type, label, currentValue, onChange) {
    const group = document.createElement('div');
    group.className = 'gap-input-group mb-2';

    const labelEl = document.createElement('div');
    labelEl.className = 'text-xs text-gray-400 mb-1';
    labelEl.textContent = label;

    const inputContainer = document.createElement('div');
    inputContainer.className = 'flex items-center bg-[#1e1e1e] border border-[#404040] rounded';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'flex-1 bg-transparent text-white text-xs px-2 py-1 outline-none';
    input.placeholder = '0';
    input.value = currentValue || '';
    input.onchange = (e) => onChange(e.target.value);

    const unitSelect = document.createElement('select');
    unitSelect.className = 'bg-[#2c2c2c] text-white text-xs border-l border-[#404040] px-1 py-1 outline-none';

    ['px', 'em', 'rem', '%'].forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      unitSelect.appendChild(option);
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(unitSelect);

    group.appendChild(labelEl);
    group.appendChild(inputContainer);

    return group;
  }

  createTemplateInput(label, placeholder, currentValue, onChange) {
    const group = document.createElement('div');
    group.className = 'template-input-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'text-xs text-gray-400 mb-1';
    labelEl.textContent = label;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'w-full bg-[#1e1e1e] text-white text-xs px-2 py-1 border border-[#404040] rounded outline-none';
    input.placeholder = placeholder;
    input.value = currentValue || '';
    input.onchange = (e) => onChange(e.target.value);

    group.appendChild(labelEl);
    group.appendChild(input);

    return group;
  }

  // 状态更新方法
  toggleDimensionsExpanded() {
    this.uiState.dimensionsExpanded = !this.uiState.dimensionsExpanded;
    this.dimensionsMoreBtn.textContent = this.uiState.dimensionsExpanded ? '收起' : '更多';
    this.extendedDimensionsContainer.style.display = this.uiState.dimensionsExpanded ? 'block' : 'none';
  }

  toggleSpacingExpanded() {
    this.uiState.spacingExpanded = !this.uiState.spacingExpanded;
    this.spacingMoreBtn.textContent = this.uiState.spacingExpanded ? '收起' : '更多';
    this.extendedSpacingContainer.style.display = this.uiState.spacingExpanded ? 'block' : 'none';
  }

  toggleClipContent(checked) {
    this.uiState.clipContent = checked;
    if (checked) {
      // 启用裁剪时，默认设置为全裁剪
      this.setClipMode('all', 'hidden');
    } else {
      // 禁用裁剪时，设置为不裁剪
      this.setClipMode('none', 'visible');
    }
  }

  toggleClipExpanded() {
    this.uiState.clipExpanded = !this.uiState.clipExpanded;
    this.clipMoreBtn.textContent = this.uiState.clipExpanded ? '收起' : '更多';
    this.extendedClipContainer.style.display = this.uiState.clipExpanded ? 'block' : 'none';
  }

  setClipMode(mode, overflowValue) {
    this.clipOptions.mode = mode;

    // 更新UI状态
    this.uiState.clipContent = mode !== 'none';
    if (this.clipCheckbox) {
      this.clipCheckbox.checked = this.uiState.clipContent;
    }

    // 更新按钮状态
    const clipModeButtons = this.extendedClipContainer.querySelectorAll('.clip-mode-btn');
    clipModeButtons.forEach(btn => {
      if (btn.getAttribute('data-clip-mode') === mode) {
        btn.className = 'clip-mode-btn active text-xs px-2 py-1 bg-blue-600 text-white rounded';
      } else {
        btn.className = 'clip-mode-btn text-xs px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors';
      }
    });

    // 应用裁剪样式
    this.applyClipMode(overflowValue);
  }

  applyClipMode(overflowValue) {
    if (!this.currentElement) return;

    const element = this.currentElement;

    // 应用 overflow 样式
    element.style.overflow = overflowValue;

    // 同步到 HTML 文件
    this.syncToHTMLFile(element, element.className, 'overflow');
  }

  supportsAutoWidth(type) {
    // 判断是否支持自适应功能
    return ['width', 'height'].includes(type) && this.currentLayout === 'flex';
  }

  setDimensionAuto(type) {
    this.dimensions[type] = 'auto';
    this.updateDimension(type, 'auto');
  }

  updateDimension(type, value) {
    // 如果输入的是纯数字，需要加上当前选择的单位
    if (value && /^\d+$/.test(value)) {
      // 获取当前选择的单位
      const unitSelect = this.element.querySelector(`select[data-dimension-unit="${type}"]`);
      const currentUnit = unitSelect ? unitSelect.value : 'px'; // 默认使用 px
      this.dimensions[type] = value + currentUnit;
    } else {
      this.dimensions[type] = value;
    }
    this.applyDimensions();
  }

  updateDimensionUnit(type, value, unit) {
    if (value && value !== 'auto') {
      // 移除现有单位，然后添加新单位
      const numericValue = value.replace(/[a-zA-Z%]+$/, '');
      this.dimensions[type] = numericValue + unit;
    } else {
      this.dimensions[type] = value;
    }
    this.applyDimensions();
  }

  updateSpacing(type, value, unified = false) {
    // 如果输入的是纯数字，需要加上当前选择的单位
    let finalValue = value;
    if (value && /^\d+$/.test(value)) {
      // 获取当前选择的单位
      const unitSelect = this.element.querySelector(`select[data-spacing-unit="${type}"]`);
      const currentUnit = unitSelect ? unitSelect.value : 'px'; // 默认使用 px
      finalValue = value + currentUnit;
    }

    if (unified) {
      // 统一设置所有方向
      ['top', 'right', 'bottom', 'left'].forEach(direction => {
        this.spacing[type][direction] = finalValue;
      });
    }
    this.applySpacing();
  }

  updateSpacingUnit(type, value, unit) {
    if (value && value !== 'auto') {
      // 移除现有单位，然后添加新单位
      const numericValue = value.replace(/[a-zA-Z%]+$/, '');
      const finalValue = numericValue + unit;
      // 统一设置所有方向
      ['top', 'right', 'bottom', 'left'].forEach(direction => {
        this.spacing[type][direction] = finalValue;
      });
    } else {
      // 统一设置所有方向
      ['top', 'right', 'bottom', 'left'].forEach(direction => {
        this.spacing[type][direction] = value;
      });
    }
    this.applySpacing();
  }

  updateDirectionalSpacing(type, direction, value) {
    // 如果输入的是纯数字，需要加上当前选择的单位
    let finalValue = value;
    if (value && /^\d+$/.test(value)) {
      // 获取当前选择的单位
      const unitSelect = this.element.querySelector(`select[data-directional-spacing-unit="${type}-${direction}"]`);
      const currentUnit = unitSelect ? unitSelect.value : 'px'; // 默认使用 px
      finalValue = value + currentUnit;
    }

    this.spacing[type][direction] = finalValue;
    this.spacing[type].unified = false;
    this.applySpacing();
  }

  updateDirectionalSpacingUnit(type, direction, value, unit) {
    if (value && value !== 'auto') {
      // 移除现有单位，然后添加新单位
      const numericValue = value.replace(/[a-zA-Z%]+$/, '');
      this.spacing[type][direction] = numericValue + unit;
    } else {
      this.spacing[type][direction] = value;
    }
    this.spacing[type].unified = false;
    this.applySpacing();
  }

  updateFlexParam(param, value) {
    this.layoutParams.flex[param] = value;
    this.applyLayoutParams();
  }

  updateGridParam(param, value) {
    this.layoutParams.grid[param] = value;
    this.applyLayoutParams();
  }

  /**
   * 选择布局方式
   */
  selectLayout(layoutKey) {
    if (this.currentLayout === layoutKey) {
      return;
    }

    const prevLayout = this.currentLayout;
    this.currentLayout = layoutKey;

    console.log(`[LayoutModeSection] Switching layout from ${prevLayout} to ${layoutKey}`);

    // 更新UI状态
    this.updateLayoutButtons();
    this.updateLayoutParams();

    // 应用布局方式到当前元素
    if (this.currentElement) {
      console.log(`[LayoutModeSection] Applying ${layoutKey} layout to element`);
      this.applyLayoutToElement(layoutKey, prevLayout);
    }

    // 触发布局变更事件
    if (this.onLayoutChange) {
      this.onLayoutChange(layoutKey, prevLayout, this.currentElement);
    }

    // 通知外部系统
    this.dispatchLayoutChangeEvent(layoutKey, prevLayout);
  }

  updateLayoutButtons() {
    const buttons = this.element.querySelectorAll('[data-layout]');
    buttons.forEach(button => {
      if (button.dataset.layout === this.currentLayout) {
        // 激活状态 - 使用白色背景，黑色图标
        button.className = 'flex items-center justify-center w-8 h-8 rounded bg-white text-black cursor-pointer';
      } else {
        // 非激活状态
        button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
      }
    });
  }

  updateLayoutParams() {
    if (!this.layoutParamsContainer) return;

    // 清空容器
    this.layoutParamsContainer.innerHTML = '';

    // 根据当前布局模式显示对应参数
    // 文档流布局（none）时隐藏整个参数区域以节省空间
    if (this.currentLayout === 'none') {
      this.layoutParamsContainer.style.display = 'none';
      return;
    }

    // 显示参数区域并创建对应的参数控件
    this.layoutParamsContainer.style.display = 'block';

    let paramsElement;
    switch (this.currentLayout) {
      case 'flex':
        paramsElement = this.createFlexParams();
        break;
      case 'grid':
        paramsElement = this.createGridParams();
        break;
    }

    if (paramsElement) {
      this.layoutParamsContainer.appendChild(paramsElement);
      // 重新初始化图标
      setTimeout(() => this.initializeLucideIcons(paramsElement), 0);
    }
  }

  // 应用样式到元素的方法
  applyLayoutToElement(newLayout, prevLayout) {
    if (!this.currentElement) {
      return;
    }

    const element = this.currentElement;

    // 清除前一个布局方式的样式
    this.clearLayoutStyles(element, prevLayout);

    // 应用新布局方式的样式
    let appliedClasses = [];
    switch (newLayout) {
      case 'none':
        appliedClasses = ['block'];
        break;
      case 'flex':
        appliedClasses = ['flex'];
        break;
      case 'grid':
        appliedClasses = ['grid'];
        break;
    }

    if (appliedClasses.length > 0) {
      this.layoutAdapter.applyClasses(element, appliedClasses);
    }

    // 获取应用后的完整class属性值
    const finalClasses = element.className;

    // 同步到 HTML 文件
    this.syncToHTMLFile(element, finalClasses, 'layout');

    console.log(`[LayoutModeSection] Layout ${newLayout} applied`);
  }

  applyDimensions() {
    if (!this.currentElement) return;

    const element = this.currentElement;
    const classes = [];

    // 先移除所有现有的尺寸类，然后重新应用
    this.clearExistingDimensionClasses(element);

    // 构建尺寸相关的 Tailwind 类
    Object.entries(this.dimensions).forEach(([prop, value]) => {
      if (value) {
        const tailwindClass = this.convertToTailwindDimensionClass(prop, value);
        if (tailwindClass) {
          classes.push(tailwindClass);
        }
      }
    });

    // 应用类名
    if (classes.length > 0) {
      this.layoutAdapter.applyClasses(element, classes);
    }

    this.syncToHTMLFile(element, element.className, 'dimensions');
  }

  applySpacing() {
    if (!this.currentElement) return;

    const element = this.currentElement;
    const classes = [];

    // 构建内外边距相关的 Tailwind 类
    ['margin', 'padding'].forEach(type => {
      const prefix = type === 'margin' ? 'm' : 'p';
      const spacing = this.spacing[type];

      if (spacing.unified && spacing.top) {
        // 统一设置
        classes.push(`${prefix}-[${spacing.top}]`);
      } else {
        // 分方向设置
        ['top', 'right', 'bottom', 'left'].forEach(direction => {
          const directionPrefix = {
            top: 't',
            right: 'r',
            bottom: 'b',
            left: 'l'
          }[direction];

          if (spacing[direction]) {
            classes.push(`${prefix}${directionPrefix}-[${spacing[direction]}]`);
          }
        });
      }
    });

    if (classes.length > 0) {
      this.layoutAdapter.applyClasses(element, classes);
    }

    this.syncToHTMLFile(element, element.className, 'spacing');
  }

  applyLayoutParams() {
    if (!this.currentElement) return;

    const element = this.currentElement;
    const classes = [];

    // 根据布局类型应用参数
    switch (this.currentLayout) {
      case 'flex':
        const flexParams = this.layoutParams.flex;
        if (flexParams.direction !== 'row') classes.push(`flex-${flexParams.direction}`);
        if (flexParams.justifyContent !== 'flex-start') classes.push(`justify-${flexParams.justifyContent}`);
        if (flexParams.alignItems !== 'stretch') classes.push(`items-${flexParams.alignItems}`);
        if (flexParams.gap) classes.push(`gap-[${flexParams.gap}]`);
        break;
      case 'grid':
        const gridParams = this.layoutParams.grid;
        if (gridParams.templateColumns) classes.push(`grid-cols-[${gridParams.templateColumns}]`);
        if (gridParams.templateRows) classes.push(`grid-rows-[${gridParams.templateRows}]`);
        if (gridParams.gap) classes.push(`gap-[${gridParams.gap}]`);
        break;
    }

    if (classes.length > 0) {
      this.layoutAdapter.applyClasses(element, classes);
    }

    this.syncToHTMLFile(element, element.className, 'layout-params');
  }

  applyClipContent() {
    if (!this.currentElement) return;

    const element = this.currentElement;
    const classes = this.uiState.clipContent ? ['overflow-hidden'] : [];

    if (classes.length > 0) {
      this.layoutAdapter.applyClasses(element, classes);
    } else {
      // 移除overflow相关类名
      element.classList.remove('overflow-hidden', 'overflow-visible', 'overflow-auto', 'overflow-scroll');
    }

    this.syncToHTMLFile(element, element.className, 'overflow');
  }

  convertToTailwindDimensionClass(prop, value) {
    const prefixMap = {
      width: 'w',
      height: 'h',
      minWidth: 'min-w',
      minHeight: 'min-h',
      maxWidth: 'max-w',
      maxHeight: 'max-h'
    };

    const prefix = prefixMap[prop];
    if (!prefix) return null;

    if (value === 'auto') {
      return `${prefix}-auto`;
    }

    // 对于带单位的值或其他值，使用任意值语法
    // 确保值包含单位，如果没有单位则添加 px
    let finalValue = value;
    if (/^\d+$/.test(value)) {
      // 纯数字，添加默认单位 px
      finalValue = value + 'px';
    } else if (!/^(auto|inherit|initial|unset)$/.test(value) && !/\d+(px|%|em|rem|vw|vh|fr)$/.test(value)) {
      // 如果值不包含单位且不是关键字，添加默认单位 px
      finalValue = value + 'px';
    }

    return `${prefix}-[${finalValue}]`;
  }

  clearLayoutStyles(element, layout) {
    console.log(`[LayoutModeSection] Clearing ${layout} layout styles from element:`, element);

    // 移除所有布局相关的类名
    const layoutClasses = ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid'];
    layoutClasses.forEach(className => {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    });

    console.log(`[LayoutModeSection] Cleared ${layout} layout styles`);
  }

  /**
   * 从元素检测当前布局方式
   */
  detectLayoutFromElement(element) {
    if (!element) {
      return 'none';
    }

    // 首先检查 Tailwind 类名
    const classList = Array.from(element.classList);

    // 检测 flex 类名
    if (classList.some(cls => ['flex', 'inline-flex'].includes(cls))) {
      return 'flex';
    }

    // 检测 grid 类名
    if (classList.some(cls => ['grid', 'inline-grid'].includes(cls))) {
      return 'grid';
    }

    // 回退到计算样式检测
    const style = window.getComputedStyle(element);

    if (style.display === 'flex' || style.display === 'inline-flex') {
      return 'flex';
    }

    if (style.display === 'grid' || style.display === 'inline-grid') {
      return 'grid';
    }

    return 'none';
  }

  /**
   * 更新组件以匹配当前元素
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    console.log(`[LayoutModeSection] Update called with element:`, element);

    if (element) {
      // 检测元素的当前布局方式
      const detectedLayout = this.detectLayoutFromElement(element);

      console.log(`[LayoutModeSection] Detected layout: ${detectedLayout}`);

      // 更新布局方式
      if (detectedLayout !== this.currentLayout) {
        this.currentLayout = detectedLayout;
        this.updateLayoutButtons();
        this.updateLayoutParams();
      }

      // 检测和更新尺寸信息
      this.detectDimensionsFromElement(element);

      // 检测和更新间距信息
      this.detectSpacingFromElement(element);

      // 检测溢出设置
      this.detectOverflowFromElement(element);
    } else {
      console.log(`[LayoutModeSection] No element provided to update`);
    }
  }

  detectDimensionsFromElement(element) {
    // 从元素检测尺寸信息并更新UI
    const classList = Array.from(element.classList);

    // 重置 dimensions 对象
    this.dimensions = {
      width: '',
      height: '',
      minWidth: '',
      minHeight: '',
      maxWidth: '',
      maxHeight: ''
    };

    // 解析 Tailwind 尺寸类
    const dimensionPatterns = {
      width: /^w-(.+)$/,
      height: /^h-(.+)$/,
      minWidth: /^min-w-(.+)$/,
      minHeight: /^min-h-(.+)$/,
      maxWidth: /^max-w-(.+)$/,
      maxHeight: /^max-h-(.+)$/
    };

    classList.forEach(className => {
      Object.entries(dimensionPatterns).forEach(([prop, pattern]) => {
        const match = className.match(pattern);
        if (match) {
          const value = match[1];

          // 处理不同类型的值
          if (value === 'auto') {
            this.dimensions[prop] = 'auto';
          } else if (value.startsWith('[') && value.endsWith(']')) {
            // 任意值语法 w-[30px]
            this.dimensions[prop] = value.slice(1, -1);
          } else if (/^\d+$/.test(value)) {
            // 标准 Tailwind 数值 w-20 -> 转换为像素值
            // Tailwind 的数值单位是 0.25rem，即 4px
            const pixelValue = parseInt(value) * 4;
            this.dimensions[prop] = pixelValue + 'px';
          } else {
            // 其他预设值
            this.dimensions[prop] = value;
          }
        }
      });
    });

    // 更新 UI 输入框
    this.updateDimensionInputs();
  }

  updateDimensionInputs() {
    // 更新所有尺寸输入框的值
    Object.entries(this.dimensions).forEach(([type, value]) => {
      const input = this.element.querySelector(`input[data-dimension="${type}"]`);
      if (input) {
        // 如果值包含单位，提取数值部分显示在输入框中
        if (value && value !== 'auto') {
          const numericValue = value.replace(/[a-zA-Z%]+$/, '');
          input.value = numericValue || '';
        } else {
          input.value = value || '';
        }
      }

      // 更新单位选择器
      const unitSelect = this.element.querySelector(`select[data-dimension-unit="${type}"]`);
      if (unitSelect && value && value !== 'auto') {
        // 提取单位
        const unitMatch = value.match(/[a-zA-Z%]+$/);
        if (unitMatch) {
          unitSelect.value = unitMatch[0];
        } else {
          // 没有单位的数值，默认设为 'px'
          unitSelect.value = 'px';
        }
      }
    });
  }

  detectSpacingFromElement(element) {
    // 从元素检测间距信息并更新UI
    const style = window.getComputedStyle(element);

    // 检测是否有overflow hidden
    this.uiState.clipContent = style.overflow === 'hidden';
    if (this.clipCheckbox) {
      this.clipCheckbox.checked = this.uiState.clipContent;
    }
  }

  detectOverflowFromElement(element) {
    const style = window.getComputedStyle(element);
    const overflow = style.overflow;
    const overflowX = style.overflowX;
    const overflowY = style.overflowY;

    // 检测裁剪模式
    if (overflow === 'hidden' || (overflowX === 'hidden' && overflowY === 'hidden')) {
      this.clipOptions.mode = 'all';
      this.uiState.clipContent = true;
    } else if (overflow === 'hidden auto' || (overflowX === 'hidden' && overflowY === 'auto')) {
      this.clipOptions.mode = 'horizontal';
      this.uiState.clipContent = true;
    } else if (overflow === 'auto hidden' || (overflowX === 'auto' && overflowY === 'hidden')) {
      this.clipOptions.mode = 'vertical';
      this.uiState.clipContent = true;
    } else {
      this.clipOptions.mode = 'none';
      this.uiState.clipContent = false;
    }

    // 更新复选框状态
    if (this.clipCheckbox) {
      this.clipCheckbox.checked = this.uiState.clipContent;
    }

    // 更新按钮状态（如果扩展面板存在）
    if (this.extendedClipContainer) {
      const clipModeButtons = this.extendedClipContainer.querySelectorAll('.clip-mode-btn');
      clipModeButtons.forEach(btn => {
        if (btn.getAttribute('data-clip-mode') === this.clipOptions.mode) {
          btn.className = 'clip-mode-btn active text-xs px-2 py-1 bg-blue-600 text-white rounded';
        } else {
          btn.className = 'clip-mode-btn text-xs px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors';
        }
      });
    }
  }

  /**
   * 同步变更到 HTML 文件
   */
  syncToHTMLFile(element, finalClasses, changeType) {
    console.log(`[LayoutModeSection] Syncing ${changeType} change to HTML file`);
    console.log(`[LayoutModeSection] Element:`, element);
    console.log(`[LayoutModeSection] Final classes:`, finalClasses);

    try {
      // 使用 Tailwind 样式变更数据
      const changeData = {
        changes: [{
          element: {
            tagName: element.tagName.toLowerCase(),
            id: element.id || null,
            className: element.className,
            wveId: element.dataset.wveId || null,
            strategies: this.generateSelectorStrategies(element)
          },
          tailwindClasses: finalClasses,
          cssStyles: null // 只使用 Tailwind 类名，不使用内联样式
        }]
      };

      console.log(`[LayoutModeSection] Sending tailwindStyleChange message:`, changeData);

      // 发送到扩展进行同步
      if (typeof vscode !== 'undefined' && vscode.postMessage) {
        vscode.postMessage({
          type: 'tailwindStyleChange',
          data: changeData
        });
        console.log(`[LayoutModeSection] Message sent successfully`);

        // 检查是否启用了自动刷新模式，如果是则触发事件
        const app = window.WVE?.app?.();
        const floatingToolbar = app?.getFloatingToolbar?.();
        if (floatingToolbar && floatingToolbar.autoRefreshState === 'auto') {
          document.dispatchEvent(new CustomEvent('wve:styleChange', {
            detail: {
              type: 'tailwindStyleChange',
              data: changeData
            }
          }));
          console.log(`[LayoutModeSection] Auto refresh event dispatched (auto mode enabled)`);
        } else {
          console.log(`[LayoutModeSection] Auto refresh skipped (manual mode or toolbar unavailable)`);
        }
      } else {
        console.error(`[LayoutModeSection] vscode.postMessage not available`);
      }
    } catch (error) {
      console.error(`[LayoutModeSection] Error syncing to HTML file:`, error);
    }
  }

  /**
   * 生成元素选择器策略
   */
  generateSelectorStrategies(element) {
    const strategies = [];

    // 策略1: 使用 data-wve-id（如果存在）
    if (element.dataset.wveId) {
      strategies.push({
        type: 'wve-id',
        selector: `[data-wve-id="${element.dataset.wveId}"]`
      });
    }

    // 策略2: 使用 ID（如果存在）
    if (element.id) {
      strategies.push({
        type: 'id',
        selector: `#${element.id}`
      });
    }

    // 策略3: 使用 nth-child 和父元素路径（精确定位）
    const nthChildSelector = this.generateNthChildSelector(element);
    if (nthChildSelector) {
      strategies.push({
        type: 'nth-child',
        selector: nthChildSelector
      });
    }

    return strategies;
  }

  /**
   * 生成基于 nth-child 的精确选择器
   */
  generateNthChildSelector(element) {
    try {
      const path = [];
      let current = element;

      // 向上遍历到body或html，构建路径
      while (current && current.tagName && current.tagName !== 'BODY' && current.tagName !== 'HTML') {
        const parent = current.parentElement;
        if (!parent) {
          break;
        }

        // 计算当前元素在同类型兄弟元素中的位置
        const siblings = Array.from(parent.children).filter(child =>
          child.tagName === current.tagName
        );

        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          path.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
        } else {
          path.unshift(current.tagName.toLowerCase());
        }

        current = parent;

        // 限制路径深度，避免过于复杂的选择器
        if (path.length >= 3) {
          break;
        }
      }

      return path.length > 0 ? path.join(' > ') : null;
    } catch (error) {
      console.warn('[LayoutModeSection] Error generating nth-child selector:', error);
      return null;
    }
  }

  /**
   * 派发布局变更事件
   */
  dispatchLayoutChangeEvent(newLayout, prevLayout) {
    const event = new CustomEvent('wveLayoutChange', {
      detail: {
        element: this.currentElement,
        newLayout: newLayout,
        prevLayout: prevLayout,
        layoutTypes: this.layoutTypes
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 获取当前布局方式
   */
  getCurrentLayout() {
    return this.currentLayout;
  }

  /**
   * 以编程方式设置布局方式
   */
  setLayout(layout) {
    if (this.layoutTypes[layout]) {
      this.selectLayout(layout);
    }
  }

  /**
   * 初始化 Lucide 图标
   */
  initializeLucideIcons(container) {
    // 确保 LucideIcons 可用
    if (typeof window.WVE !== 'undefined' && window.WVE.LucideIcons) {
      // 使用传入的容器或者this.element查找Lucide图标
      const targetElement = container || this.element;
      if (targetElement) {
        // 使用 replaceInRoot 方法来初始化图标
        window.WVE.LucideIcons.replaceInRoot(targetElement);
      }
    } else {
      // 如果 LucideIcons 还未加载，延迟初始化
      setTimeout(() => this.initializeLucideIcons(container), 100);
    }
  }

  injectStyles() {
    // 在 Shadow DOM 中，需要将样式注入到元素容器中而不是 document.head
    if (this.element && this.element.querySelector('#layout-mode-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'layout-mode-styles';
    style.textContent = `
      .layout-mode-section .section-content {
        padding: 12px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      .layout-selector-container {
        margin-bottom: 16px;
      }

      .dimensions-section,
      .layout-params-section,
      .spacing-section {
        padding-bottom: 8px;
        border-bottom: 1px solid #404040;
        margin-bottom: 16px;
      }

      .dimensions-section:last-child,
      .layout-params-section:last-child,
      .spacing-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      /* 自定义滚动条 */
      .layout-mode-section ::-webkit-scrollbar {
        width: 4px;
      }

      .layout-mode-section ::-webkit-scrollbar-track {
        background: #1e1e1e;
      }

      .layout-mode-section ::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 2px;
      }

      .layout-mode-section ::-webkit-scrollbar-thumb:hover {
        background: #505050;
      }
    `;

    // 将样式添加到组件元素中以支持 Shadow DOM
    if (this.element) {
      this.element.appendChild(style);
    } else {
      // 回退到 document.head（非 Shadow DOM 环境）
      document.head.appendChild(style);
    }
  }

  /**
   * 清除元素上现有的尺寸类
   */
  clearExistingDimensionClasses(element) {
    if (!element) {
      return;
    }

    // 定义所有尺寸相关的类前缀
    const dimensionPrefixes = [
      'w-', 'h-', 'min-w-', 'min-h-', 'max-w-', 'max-h-'
    ];

    // 获取当前所有类名
    const classList = Array.from(element.classList);

    // 找出所有需要移除的尺寸类
    const classesToRemove = classList.filter(className => {
      return dimensionPrefixes.some(prefix => className.startsWith(prefix));
    });

    // 移除找到的尺寸类
    if (classesToRemove.length > 0) {
      console.log(`[LayoutModeSection] Clearing existing dimension classes:`, classesToRemove);
      classesToRemove.forEach(className => {
        element.classList.remove(className);
      });
    }
  }

  /**
   * 清理资源，包括定时器和事件监听器
   */
  destroy() {
    // 清理防抖定时器
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }

    // 清理保存的选择状态
    this.currentElement = null;

    console.log(`[LayoutModeSection] Resources cleaned up`);
  }
};