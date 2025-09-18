/**
 * 网格布局模式属性区域 (CSS Grid)
 * 对应新设计中的"网格布局 (CSS Grid)"模式
 */
window.WVE = window.WVE || {};
window.WVE.GridLayoutSection = class GridLayoutSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '⊞ 网格布局 (CSS Grid)',
      collapsed: false,
      className: 'grid-layout-section',
      ...options
    });

    this.currentElement = null;
    this.controls = {};
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 网格定义
    this.createGridDefinitionSection(container);

    // 间距设置
    this.createGapSection(container);

    // 内外边距设置
    this.createSpacingSection(container);

    // 对齐设置
    this.createAlignmentSection(container);

    // 子元素控制（如果当前元素在grid容器中）
    this.createGridItemSection(container);

    this.injectStyles();
  }

  createGridDefinitionSection(container) {
    const section = document.createElement('div');
    section.className = 'grid-definition-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '网格定义';

    const definitionPanel = document.createElement('div');
    definitionPanel.className = 'grid-definition-panel';

    // 列模板
    const columnsGroup = this.createTemplateGroup('列模板', 'grid-template-columns', 'columns');

    // 行模板
    const rowsGroup = this.createTemplateGroup('行模板', 'grid-template-rows', 'rows');

    // 快捷模板
    const quickTemplates = this.createQuickTemplates();

    definitionPanel.appendChild(columnsGroup);
    definitionPanel.appendChild(rowsGroup);
    definitionPanel.appendChild(quickTemplates);

    section.appendChild(title);
    section.appendChild(definitionPanel);
    container.appendChild(section);
  }

  createTemplateGroup(label, cssProperty, type) {
    const group = document.createElement('div');
    group.className = 'template-group';

    const labelEl = document.createElement('div');
    labelEl.className = 'control-label';
    labelEl.textContent = label + ' ' + cssProperty;

    const templateContainer = document.createElement('div');
    templateContainer.className = 'template-container';

    // 模板输入列表
    const templateList = document.createElement('div');
    templateList.className = 'template-list';

    // 默认添加一个输入框
    this.addTemplateInput(templateList, type, '1fr');

    // 添加按钮
    const addBtn = window.WVE.PropertyControls.createIconButton({
      icon: '+',
      size: 'small',
      onClick: () => this.addTemplateInput(templateList, type, 'auto')
    });

    // 可视化按钮
    const visualBtn = window.WVE.PropertyControls.createIconButton({
      icon: '⊞',
      size: 'small',
      title: '可视化编辑',
      onClick: () => this.showGridVisualizer(type)
    });

    templateContainer.appendChild(templateList);

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'template-buttons';
    buttonGroup.appendChild(addBtn);
    buttonGroup.appendChild(visualBtn);
    templateContainer.appendChild(buttonGroup);

    this.controls[type + 'List'] = templateList;

    group.appendChild(labelEl);
    group.appendChild(templateContainer);

    return group;
  }

  addTemplateInput(container, type, value = 'auto') {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'template-input-group';

    const input = window.WVE.PropertyControls.createInputWithDropdown({
      type: 'text',
      value: value,
      options: ['fr', 'px', '%', 'em', 'rem', 'auto', 'min-content', 'max-content'],
      defaultUnit: 'fr',
      onChange: (val, unit) => this.updateGridTemplate(type, val + unit)
    });

    const removeBtn = window.WVE.PropertyControls.createIconButton({
      icon: '×',
      size: 'small',
      className: 'remove-btn',
      onClick: () => {
        inputGroup.remove();
        this.updateGridTemplate(type);
      }
    });

    inputGroup.appendChild(input);
    inputGroup.appendChild(removeBtn);
    container.appendChild(inputGroup);

    // 隐藏删除按钮如果只有一个输入框
    this.updateRemoveButtons(container);

    return inputGroup;
  }

  updateRemoveButtons(container) {
    const removeButtons = container.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
      btn.style.display = removeButtons.length > 1 ? 'block' : 'none';
    });
  }

  updateGridTemplate(type) {
    if (!this.currentElement) return;

    const container = this.controls[type + 'List'];
    const inputs = container.querySelectorAll('input');
    const values = Array.from(inputs)
      .map(input => input.value.trim())
      .filter(val => val);

    const templateValue = values.join(' ') || 'none';
    const cssProperty = type === 'columns' ? 'grid-template-columns' : 'grid-template-rows';

    this.currentElement.style[cssProperty] = templateValue;
    this.notifyChange(cssProperty, templateValue);
  }

  createQuickTemplates() {
    const group = document.createElement('div');
    group.className = 'quick-templates-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '快捷模板:';

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'quick-template-buttons';

    const templates = [
      { label: '2列等宽', columns: '1fr 1fr', rows: 'auto' },
      { label: '3列等宽', columns: '1fr 1fr 1fr', rows: 'auto' },
      { label: '左固定右自适应', columns: '200px 1fr', rows: 'auto' },
      { label: '头部内容尾部', columns: '1fr', rows: 'auto 1fr auto' }
    ];

    templates.forEach(template => {
      const button = document.createElement('button');
      button.className = 'quick-template-btn';
      button.textContent = template.label;
      button.onclick = () => this.applyQuickTemplate(template);
      buttonContainer.appendChild(button);
    });

    group.appendChild(label);
    group.appendChild(buttonContainer);

    return group;
  }

  applyQuickTemplate(template) {
    if (!this.currentElement) return;

    // 应用列模板
    this.currentElement.style.gridTemplateColumns = template.columns;
    this.currentElement.style.gridTemplateRows = template.rows;

    // 更新UI
    this.updateTemplateInputs('columns', template.columns);
    this.updateTemplateInputs('rows', template.rows);

    this.notifyChange('grid-template', template);
  }

  updateTemplateInputs(type, templateValue) {
    const container = this.controls[type + 'List'];
    container.innerHTML = '';

    const values = templateValue.split(' ');
    values.forEach(value => {
      this.addTemplateInput(container, type, value);
    });
  }

  createGapSection(container) {
    const section = document.createElement('div');
    section.className = 'grid-gap-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '间距设置';

    const gapPanel = document.createElement('div');
    gapPanel.className = 'gap-panel';

    const gapLabel = document.createElement('div');
    gapLabel.className = 'control-label';
    gapLabel.textContent = '网格间距 Gap';

    const gapControls = document.createElement('div');
    gapControls.className = 'gap-controls';

    // X轴间距
    const xGapGroup = document.createElement('div');
    xGapGroup.className = 'input-with-label';

    const xLabel = document.createElement('span');
    xLabel.textContent = 'X轴:';

    const xInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'gap-input',
      onChange: (value) => this.updateGap('column', value)
    });

    const xUnit = document.createElement('span');
    xUnit.textContent = 'px';
    xUnit.className = 'unit-label';

    xGapGroup.appendChild(xLabel);
    xGapGroup.appendChild(xInput);
    xGapGroup.appendChild(xUnit);

    // Y轴间距
    const yGapGroup = document.createElement('div');
    yGapGroup.className = 'input-with-label';

    const yLabel = document.createElement('span');
    yLabel.textContent = 'Y轴:';

    const yInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'gap-input',
      onChange: (value) => this.updateGap('row', value)
    });

    const yUnit = document.createElement('span');
    yUnit.textContent = 'px';
    yUnit.className = 'unit-label';

    yGapGroup.appendChild(yLabel);
    yGapGroup.appendChild(yInput);
    yGapGroup.appendChild(yUnit);

    // 链接按钮
    const linkBtn = window.WVE.PropertyControls.createIconButton({
      icon: '🔗',
      size: 'small',
      toggle: true,
      onClick: (active) => this.toggleGapLink(active)
    });

    this.controls.gapXInput = xInput;
    this.controls.gapYInput = yInput;
    this.controls.gapLinkBtn = linkBtn;

    gapControls.appendChild(xGapGroup);
    gapControls.appendChild(yGapGroup);
    gapControls.appendChild(linkBtn);

    gapPanel.appendChild(gapLabel);
    gapPanel.appendChild(gapControls);

    section.appendChild(title);
    section.appendChild(gapPanel);
    container.appendChild(section);
  }

  createSpacingSection(container) {
    const section = document.createElement('div');
    section.className = 'grid-spacing-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '内外边距';

    const spacingPanel = document.createElement('div');
    spacingPanel.className = 'spacing-panel';

    // 外边距控制
    const marginControl = this.createSpacingControl('Margin', 'margin');
    this.controls.marginControl = marginControl;

    // 内边距控制
    const paddingControl = this.createSpacingControl('Padding', 'padding');
    this.controls.paddingControl = paddingControl;

    spacingPanel.appendChild(marginControl);
    spacingPanel.appendChild(paddingControl);

    section.appendChild(title);
    section.appendChild(spacingPanel);
    container.appendChild(section);
  }

  createSpacingControl(label, type) {
    const container = document.createElement('div');
    container.className = 'spacing-control-container';

    const controlRow = document.createElement('div');
    controlRow.className = 'spacing-control-row';

    // 标签
    const labelEl = document.createElement('span');
    labelEl.className = 'control-label-inline';
    labelEl.textContent = label;

    // X轴输入
    const xInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'spacing-input',
      onChange: (value) => this.updateSpacing(type, 'x', value)
    });

    // Y轴输入
    const yInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      placeholder: '0',
      className: 'spacing-input',
      onChange: (value) => this.updateSpacing(type, 'y', value)
    });

    // 详细设置按钮
    const detailBtn = window.WVE.PropertyControls.createIconButton({
      icon: '📐',
      size: 'small',
      onClick: () => this.showDetailSpacing(type)
    });

    // 链接按钮
    const linkBtn = window.WVE.PropertyControls.createIconButton({
      icon: '🔗',
      size: 'small',
      toggle: true,
      onClick: (active) => this.toggleSpacingLink(type, active)
    });

    controlRow.appendChild(labelEl);

    const inputGroup = document.createElement('div');
    inputGroup.className = 'spacing-input-group';

    const xGroup = document.createElement('div');
    xGroup.className = 'input-with-label';
    const xLabel = document.createElement('span');
    xLabel.textContent = 'X:';
    xGroup.appendChild(xLabel);
    xGroup.appendChild(xInput);

    const yGroup = document.createElement('div');
    yGroup.className = 'input-with-label';
    const yLabel = document.createElement('span');
    yLabel.textContent = 'Y:';
    yGroup.appendChild(yLabel);
    yGroup.appendChild(yInput);

    inputGroup.appendChild(xGroup);
    inputGroup.appendChild(yGroup);
    inputGroup.appendChild(detailBtn);
    inputGroup.appendChild(linkBtn);

    controlRow.appendChild(inputGroup);
    container.appendChild(controlRow);

    // 存储控件引用
    container.xInput = xInput;
    container.yInput = yInput;
    container.linkBtn = linkBtn;

    return container;
  }

  createAlignmentSection(container) {
    const section = document.createElement('div');
    section.className = 'grid-alignment-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '对齐设置';

    const alignmentPanel = document.createElement('div');
    alignmentPanel.className = 'alignment-panel';

    // 网格对齐
    const justifyItemsGroup = this.createJustifyItemsGroup();

    // 内容对齐
    const alignItemsGroup = this.createAlignItemsGroup();

    alignmentPanel.appendChild(justifyItemsGroup);
    alignmentPanel.appendChild(alignItemsGroup);

    section.appendChild(title);
    section.appendChild(alignmentPanel);
    container.appendChild(section);
  }

  createJustifyItemsGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '网格对齐 (justify-items)';

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'icon-button-group';

    const justifyOptions = [
      { value: 'start', icon: '≡', label: '起始' },
      { value: 'center', icon: '⊞', label: '居中' },
      { value: 'end', icon: '≣', label: '末尾' },
      { value: 'stretch', icon: '↕', label: '拉伸' }
    ];

    justifyOptions.forEach(option => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: option.icon,
        tooltip: option.label,
        onClick: () => this.setJustifyItems(option.value)
      });
      button.dataset.value = option.value;
      buttonGroup.appendChild(button);
    });

    this.controls.justifyItemsGroup = buttonGroup;

    group.appendChild(label);
    group.appendChild(buttonGroup);

    return group;
  }

  createAlignItemsGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '内容对齐 (align-items)';

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'icon-button-group';

    const alignOptions = [
      { value: 'start', icon: '⬆', label: '起始' },
      { value: 'center', icon: '⊞', label: '居中' },
      { value: 'end', icon: '⬇', label: '末尾' },
      { value: 'stretch', icon: '↕', label: '拉伸' }
    ];

    alignOptions.forEach(option => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: option.icon,
        tooltip: option.label,
        onClick: () => this.setAlignItems(option.value)
      });
      button.dataset.value = option.value;
      buttonGroup.appendChild(button);
    });

    this.controls.alignItemsGroup = buttonGroup;

    group.appendChild(label);
    group.appendChild(buttonGroup);

    return group;
  }

  createGridItemSection(container) {
    const section = document.createElement('div');
    section.className = 'grid-item-section';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '子元素控制 (当前选中元素在grid容器中)';

    const itemPanel = document.createElement('div');
    itemPanel.className = 'grid-item-panel';

    // 网格位置
    const positionGroup = this.createGridPositionGroup();

    // 区域命名
    const areaGroup = this.createGridAreaGroup();

    // 自身对齐
    const selfAlignGroup = this.createSelfAlignGroup();

    itemPanel.appendChild(positionGroup);
    itemPanel.appendChild(areaGroup);
    itemPanel.appendChild(selfAlignGroup);

    section.appendChild(title);
    section.appendChild(itemPanel);
    container.appendChild(section);

    this.controls.gridItemSection = section;
  }

  createGridPositionGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '网格位置';

    const positionControls = document.createElement('div');
    positionControls.className = 'grid-position-controls';

    // 列位置
    const columnGroup = document.createElement('div');
    columnGroup.className = 'position-group';

    const columnLabel = document.createElement('span');
    columnLabel.textContent = '列: 从';

    const columnStartInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '1',
      min: '1',
      className: 'position-input',
      onChange: (value) => this.updateGridPosition('grid-column-start', value)
    });

    const toLabel1 = document.createElement('span');
    toLabel1.textContent = '到';

    const columnEndInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '2',
      min: '1',
      className: 'position-input',
      onChange: (value) => this.updateGridPosition('grid-column-end', value)
    });

    columnGroup.appendChild(columnLabel);
    columnGroup.appendChild(columnStartInput);
    columnGroup.appendChild(toLabel1);
    columnGroup.appendChild(columnEndInput);

    // 行位置
    const rowGroup = document.createElement('div');
    rowGroup.className = 'position-group';

    const rowLabel = document.createElement('span');
    rowLabel.textContent = '行: 从';

    const rowStartInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '1',
      min: '1',
      className: 'position-input',
      onChange: (value) => this.updateGridPosition('grid-row-start', value)
    });

    const toLabel2 = document.createElement('span');
    toLabel2.textContent = '到';

    const rowEndInput = window.WVE.PropertyControls.createInput({
      type: 'number',
      value: '2',
      min: '1',
      className: 'position-input',
      onChange: (value) => this.updateGridPosition('grid-row-end', value)
    });

    rowGroup.appendChild(rowLabel);
    rowGroup.appendChild(rowStartInput);
    rowGroup.appendChild(toLabel2);
    rowGroup.appendChild(rowEndInput);

    this.controls.gridColumnStart = columnStartInput;
    this.controls.gridColumnEnd = columnEndInput;
    this.controls.gridRowStart = rowStartInput;
    this.controls.gridRowEnd = rowEndInput;

    positionControls.appendChild(columnGroup);
    positionControls.appendChild(rowGroup);

    group.appendChild(label);
    group.appendChild(positionControls);

    return group;
  }

  createGridAreaGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '区域命名';

    const areaControls = document.createElement('div');
    areaControls.className = 'area-controls';

    const areaInput = window.WVE.PropertyControls.createInput({
      type: 'text',
      placeholder: 'header',
      className: 'area-input',
      onChange: (value) => this.updateGridArea(value)
    });

    const setBtn = document.createElement('button');
    setBtn.textContent = '设置';
    setBtn.className = 'area-set-btn';
    setBtn.onclick = () => this.applyGridArea();

    this.controls.gridAreaInput = areaInput;

    areaControls.appendChild(areaInput);
    areaControls.appendChild(setBtn);

    group.appendChild(label);
    group.appendChild(areaControls);

    return group;
  }

  createSelfAlignGroup() {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '自身对齐';

    const alignControls = document.createElement('div');
    alignControls.className = 'self-align-controls';

    // justify-self
    const justifyGroup = document.createElement('div');
    justifyGroup.className = 'align-sub-group';

    const justifyLabel = document.createElement('span');
    justifyLabel.textContent = 'justify-self:';

    const justifyButtons = document.createElement('div');
    justifyButtons.className = 'small-button-group';

    const justifyOptions = [
      { value: 'start', icon: '≡' },
      { value: 'center', icon: '⊞' },
      { value: 'end', icon: '≣' },
      { value: 'stretch', icon: '↕' }
    ];

    justifyOptions.forEach(option => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: option.icon,
        size: 'small',
        onClick: () => this.setJustifySelf(option.value)
      });
      button.dataset.value = option.value;
      justifyButtons.appendChild(button);
    });

    justifyGroup.appendChild(justifyLabel);
    justifyGroup.appendChild(justifyButtons);

    // align-self
    const alignGroup = document.createElement('div');
    alignGroup.className = 'align-sub-group';

    const alignLabel = document.createElement('span');
    alignLabel.textContent = 'align-self:';

    const alignButtons = document.createElement('div');
    alignButtons.className = 'small-button-group';

    const alignOptions = [
      { value: 'start', icon: '⬆' },
      { value: 'center', icon: '⊞' },
      { value: 'end', icon: '⬇' },
      { value: 'stretch', icon: '↕' }
    ];

    alignOptions.forEach(option => {
      const button = window.WVE.PropertyControls.createIconButton({
        icon: option.icon,
        size: 'small',
        onClick: () => this.setAlignSelf(option.value)
      });
      button.dataset.value = option.value;
      alignButtons.appendChild(button);
    });

    alignGroup.appendChild(alignLabel);
    alignGroup.appendChild(alignButtons);

    this.controls.justifySelfGroup = justifyButtons;
    this.controls.alignSelfGroup = alignButtons;

    alignControls.appendChild(justifyGroup);
    alignControls.appendChild(alignGroup);

    group.appendChild(label);
    group.appendChild(alignControls);

    return group;
  }

  /**
   * 设置网格属性
   */
  setGridProperty(property, value) {
    if (!this.currentElement) return;

    // 确保元素是grid容器
    if (property.startsWith('grid-template') || property === 'justify-items' || property === 'align-items') {
      if (this.currentElement.style.display !== 'grid') {
        this.currentElement.style.display = 'grid';
      }
    }

    this.currentElement.style[property] = value;
    this.notifyChange(property, value);
  }

  /**
   * 更新间距
   */
  updateGap(axis, value) {
    if (!this.currentElement) return;

    const numValue = parseInt(value) || 0;
    const unit = 'px';

    const currentGap = this.parseGap(this.currentElement.style.gap);

    if (axis === 'row') {
      currentGap.row = numValue + unit;
    } else {
      currentGap.column = numValue + unit;
    }

    const newGap = `${currentGap.row} ${currentGap.column}`;
    this.currentElement.style.gap = newGap;

    // 如果链接是激活的，同步另一个轴
    if (this.controls.gapLinkBtn.classList.contains('active')) {
      const otherInput = axis === 'row' ? this.controls.gapXInput : this.controls.gapYInput;
      otherInput.value = value;
      this.updateGap(axis === 'row' ? 'column' : 'row', value);
    }

    this.notifyChange('gap', newGap);
  }

  parseGap(gapValue) {
    if (!gapValue) return { row: '0px', column: '0px' };

    const parts = gapValue.split(' ');
    if (parts.length === 1) {
      return { row: parts[0], column: parts[0] };
    } else {
      return { row: parts[0], column: parts[1] };
    }
  }

  toggleGapLink(active) {
    if (active) {
      const xValue = this.controls.gapXInput.value;
      if (xValue) {
        this.controls.gapYInput.value = xValue;
        this.updateGap('row', xValue);
      }
    }
  }

  /**
   * 更新间距（外边距/内边距）
   */
  updateSpacing(type, axis, value) {
    if (!this.currentElement) return;

    const numValue = parseInt(value) || 0;
    const unit = 'px';

    if (type === 'margin') {
      if (axis === 'x') {
        this.currentElement.style.marginLeft = numValue + unit;
        this.currentElement.style.marginRight = numValue + unit;
      } else {
        this.currentElement.style.marginTop = numValue + unit;
        this.currentElement.style.marginBottom = numValue + unit;
      }
    } else if (type === 'padding') {
      if (axis === 'x') {
        this.currentElement.style.paddingLeft = numValue + unit;
        this.currentElement.style.paddingRight = numValue + unit;
      } else {
        this.currentElement.style.paddingTop = numValue + unit;
        this.currentElement.style.paddingBottom = numValue + unit;
      }
    }

    // 如果链接是激活的，同步另一个轴
    const control = this.controls[type + 'Control'];
    if (control && control.linkBtn.classList.contains('active')) {
      const otherAxis = axis === 'x' ? 'y' : 'x';
      const otherInput = axis === 'x' ? control.yInput : control.xInput;
      otherInput.value = value;
      this.updateSpacing(type, otherAxis, value);
    }

    this.notifyChange(type, { axis, value: numValue });
  }

  toggleSpacingLink(type, active) {
    if (active) {
      const control = this.controls[type + 'Control'];
      if (control) {
        const xValue = control.xInput.value;
        if (xValue) {
          control.yInput.value = xValue;
          this.updateSpacing(type, 'y', xValue);
        }
      }
    }
  }

  showDetailSpacing(type) {
    // TODO: 实现详细的四方向间距设置弹窗
    console.log(`Show detail spacing for ${type}`);
  }

  /**
   * 设置对齐
   */
  setJustifyItems(value) {
    this.setGridProperty('justify-items', value);
    this.updateButtonGroup(this.controls.justifyItemsGroup, value);
  }

  setAlignItems(value) {
    this.setGridProperty('align-items', value);
    this.updateButtonGroup(this.controls.alignItemsGroup, value);
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

  /**
   * 更新网格位置
   */
  updateGridPosition(property, value) {
    if (!this.currentElement) return;

    const numValue = parseInt(value) || 1;
    this.currentElement.style[property] = numValue.toString();
    this.notifyChange(property, numValue);
  }

  /**
   * 更新网格区域
   */
  updateGridArea(value) {
    if (!this.currentElement) return;

    this.currentElement.style.gridArea = value;
    this.notifyChange('grid-area', value);
  }

  applyGridArea() {
    const value = this.controls.gridAreaInput.value;
    if (value) {
      this.updateGridArea(value);
    }
  }

  /**
   * 设置自身对齐
   */
  setJustifySelf(value) {
    if (!this.currentElement) return;

    this.currentElement.style.justifySelf = value;
    this.updateButtonGroup(this.controls.justifySelfGroup, value);
    this.notifyChange('justify-self', value);
  }

  setAlignSelf(value) {
    if (!this.currentElement) return;

    this.currentElement.style.alignSelf = value;
    this.updateButtonGroup(this.controls.alignSelfGroup, value);
    this.notifyChange('align-self', value);
  }

  /**
   * 显示网格可视化器
   */
  showGridVisualizer(type) {
    // TODO: 实现网格可视化编辑器
    console.log(`Show grid visualizer for ${type}`);
  }

  /**
   * 从元素更新控件值
   */
  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 更新网格模板
    this.updateTemplateInputs('columns', style.gridTemplateColumns);
    this.updateTemplateInputs('rows', style.gridTemplateRows);

    // 更新间距
    this.updateGapValues(style.gap);
    this.updateSpacingValues(element, style);

    // 更新对齐
    this.updateJustifyItemsUI(style.justifyItems);
    this.updateAlignItemsUI(style.alignItems);

    // 更新grid item属性（如果元素在grid容器中）
    this.updateGridItemValues(element, style);

    // 显示/隐藏grid item控制
    this.updateGridItemVisibility(element);
  }

  updateGapValues(gap) {
    const gapValues = this.parseGap(gap);

    this.controls.gapYInput.value = parseInt(gapValues.row) || 0;
    this.controls.gapXInput.value = parseInt(gapValues.column) || 0;
  }

  updateSpacingValues(element, style) {
    // 更新外边距
    this.updateSpacingControl('margin', {
      x: parseInt(style.marginLeft) || 0,
      y: parseInt(style.marginTop) || 0
    });

    // 更新内边距
    this.updateSpacingControl('padding', {
      x: parseInt(style.paddingLeft) || 0,
      y: parseInt(style.paddingTop) || 0
    });
  }

  updateSpacingControl(type, values) {
    const control = this.controls[type + 'Control'];
    if (control) {
      control.xInput.value = values.x;
      control.yInput.value = values.y;
    }
  }

  updateJustifyItemsUI(justifyItems) {
    this.updateButtonGroup(this.controls.justifyItemsGroup, justifyItems);
  }

  updateAlignItemsUI(alignItems) {
    this.updateButtonGroup(this.controls.alignItemsGroup, alignItems);
  }

  updateGridItemValues(element, style) {
    // 更新网格位置
    this.controls.gridColumnStart.value = style.gridColumnStart === 'auto' ? '1' : style.gridColumnStart;
    this.controls.gridColumnEnd.value = style.gridColumnEnd === 'auto' ? '2' : style.gridColumnEnd;
    this.controls.gridRowStart.value = style.gridRowStart === 'auto' ? '1' : style.gridRowStart;
    this.controls.gridRowEnd.value = style.gridRowEnd === 'auto' ? '2' : style.gridRowEnd;

    // 更新区域命名
    this.controls.gridAreaInput.value = style.gridArea === 'auto' ? '' : style.gridArea;

    // 更新自身对齐
    this.updateButtonGroup(this.controls.justifySelfGroup, style.justifySelf);
    this.updateButtonGroup(this.controls.alignSelfGroup, style.alignSelf);
  }

  updateGridItemVisibility(element) {
    const parent = element.parentElement;
    const isInGridContainer = parent && window.getComputedStyle(parent).display === 'grid';

    if (this.controls.gridItemSection) {
      if (isInGridContainer) {
        this.controls.gridItemSection.style.display = 'block';
      } else {
        this.controls.gridItemSection.style.display = 'none';
      }
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
        source: 'GridLayoutSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    if (document.getElementById('grid-layout-styles')) return;

    const style = document.createElement('style');
    style.id = 'grid-layout-styles';
    style.textContent = `
      .grid-layout-section .section-content {
        padding: 12px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      /* 网格定义 */
      .grid-definition-panel {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
        margin-bottom: 16px;
      }

      .template-group {
        margin-bottom: 12px;
      }

      .template-group:last-child {
        margin-bottom: 0;
      }

      .control-label {
        font-size: 10px;
        font-weight: 500;
        color: #cccccc;
        margin-bottom: 6px;
        display: block;
      }

      .template-container {
        display: flex;
        gap: 8px;
        align-items: flex-start;
      }

      .template-list {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .template-input-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .template-buttons {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .remove-btn {
        width: 16px;
        height: 16px;
        background: #444444;
        border: 1px solid #666666;
        border-radius: 2px;
        color: #cccccc;
        font-size: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .remove-btn:hover {
        background: #666666;
      }

      /* 快捷模板 */
      .quick-templates-group {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #404040;
      }

      .quick-template-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .quick-template-btn {
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #cccccc;
        font-size: 9px;
        padding: 4px 8px;
        cursor: pointer;
        white-space: nowrap;
      }

      .quick-template-btn:hover {
        background: #404040;
        border-color: #505050;
      }

      /* 间距和对齐 */
      .gap-panel, .spacing-panel, .alignment-panel {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
        margin-bottom: 16px;
      }

      .gap-controls, .spacing-input-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .input-with-label {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .input-with-label span {
        font-size: 9px;
        color: #999999;
      }

      .gap-input, .spacing-input {
        width: 40px;
        height: 20px;
        padding: 2px 4px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
        text-align: center;
      }

      .gap-input:focus, .spacing-input:focus {
        border-color: #0078d4;
        outline: none;
      }

      .unit-label {
        font-size: 9px;
        color: #999999;
      }

      .control-label-inline {
        font-size: 10px;
        color: #cccccc;
        min-width: 50px;
      }

      .spacing-control-container {
        margin-bottom: 6px;
      }

      .spacing-control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      /* 图标按钮组 */
      .icon-button-group {
        display: flex;
        gap: 2px;
      }

      .icon-button-group button {
        width: 24px;
        height: 20px;
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #cccccc;
        font-size: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-button-group button:hover {
        background: #404040;
        border-color: #505050;
      }

      .icon-button-group button.active {
        background: #0078d4;
        border-color: #106ebe;
        color: #ffffff;
      }

      .control-group {
        margin-bottom: 12px;
      }

      .control-group:last-child {
        margin-bottom: 0;
      }

      /* Grid item 控制 */
      .grid-item-panel {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
      }

      .grid-position-controls {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .position-group {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .position-group span {
        font-size: 9px;
        color: #999999;
        white-space: nowrap;
      }

      .position-input {
        width: 30px;
        height: 18px;
        padding: 1px 3px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 2px;
        color: #ffffff;
        font-size: 9px;
        text-align: center;
      }

      .area-controls {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .area-input {
        flex: 1;
        height: 20px;
        padding: 2px 6px;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        color: #ffffff;
        font-size: 10px;
      }

      .area-set-btn {
        background: #0078d4;
        border: 1px solid #106ebe;
        border-radius: 3px;
        color: #ffffff;
        font-size: 9px;
        padding: 4px 8px;
        cursor: pointer;
      }

      .area-set-btn:hover {
        background: #106ebe;
      }

      .self-align-controls {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .align-sub-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .align-sub-group span {
        font-size: 9px;
        color: #999999;
        min-width: 70px;
      }

      .small-button-group {
        display: flex;
        gap: 1px;
      }

      .small-button-group button {
        width: 20px;
        height: 16px;
        background: #2c2c2c;
        border: 1px solid #404040;
        border-radius: 2px;
        color: #cccccc;
        font-size: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .small-button-group button:hover {
        background: #404040;
      }

      .small-button-group button.active {
        background: #0078d4;
        border-color: #106ebe;
        color: #ffffff;
      }

      /* 区域间距 */
      .grid-definition-section,
      .grid-gap-section,
      .grid-spacing-section,
      .grid-alignment-section,
      .grid-item-section {
        margin-bottom: 16px;
      }

      .grid-item-section:last-child {
        margin-bottom: 0;
      }
    `;

    document.head.appendChild(style);
  }
};