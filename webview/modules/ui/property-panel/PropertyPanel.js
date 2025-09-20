/**
 * 属性面板主类 - 基于新布局模式设计的重构版本
 * 实现"布局模式优先"的设计理念
 */
window.WVE = window.WVE || {};
window.WVE.PropertyPanel = class PropertyPanel {
  constructor(uiManager, stateManager, eventManager, tailwindManager = null) {
    this.logger = new window.WVE.Logger('PropertyPanel');
    this.uiManager = uiManager;
    this.stateManager = stateManager;
    this.eventManager = eventManager;
    this.tailwindManager = tailwindManager;

    this.root = null;
    this.panel = null;
    this.currentElement = null;

    // 主要区域实例
    this.sections = {
      layoutMode: null,        // 布局模式选择器
      dynamicLayout: null,     // 动态布局区域 (根据模式变化)
      styleTabs: null          // 样式属性标签页
    };

    // 当前布局模式
    // 注意：由于布局设计重构，不再使用单一的 currentLayoutMode
    // 改为使用 LayoutModeSection 内部的 currentPosition 和 currentLayout

    // 布局模式对应的区域
    this.layoutSections = {
      none: null,       // NoneLayoutSection
      flex: null,       // FlexLayoutSection
      grid: null        // GridLayoutSection
    };

    // 存储和恢复状态
    this.storageKey = `wve-property-panel:${window.wve?.codeId || 'default'}`;
    this.persisted = {
      visible: true,
      layoutMode: 'none',
      sections: {
        layoutMode: { collapsed: false },
        styleTabs: { collapsed: false }
      }
    };

    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleStyleChange = this.handleStyleChange.bind(this);
    this.handleLayoutModeChange = this.handleLayoutModeChange.bind(this);
  }

  /**
   * 初始化属性面板
   */
  init() {
    this.logger.info('Initializing new layout-mode-first property panel');

    this.uiManager.initUIRoot();
    this.root = this.uiManager.getUIRoot();

    this.restoreState();
    this.createPanel();
    this.createSections();
    this.bindEvents();

    this.root.appendChild(this.panel);
    this.updateVisibility();

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(this.root);
    }, 0);

    this.logger.info('New property panel initialized');
  }

  /**
   * 恢复保存的状态
   */
  restoreState() {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.persisted = { ...this.persisted, ...parsed };
        // 注意：由于布局设计重构，不再需要恢复 currentLayoutMode
      }
    } catch (error) {
      this.logger.warn('Failed to restore property panel state', error);
    }
  }

  /**
   * 保存状态
   */
  saveState(patch) {
    this.persisted = { ...this.persisted, ...patch };
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.persisted));
    } catch (error) {
      this.logger.warn('Failed to save property panel state', error);
    }
  }

  /**
   * 创建主面板
   */
  createPanel() {
    const panel = document.createElement('div');
    panel.id = 'wve-property-panel';
    panel.className = 'new-property-panel';

    // 应用新设计的样式
    const style = document.createElement('style');
    style.textContent = `
      .new-property-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 240px;
        height: 100vh;
        background: #2c2c2c;
        color: #ffffff;
        font-family: 'Inter', 'SF Pro Text', system-ui, -apple-system, 'Segoe UI', sans-serif;
        font-size: 12px;
        z-index: 40000;
        overflow-y: auto;
        overflow-x: hidden;
        border-left: 1px solid #404040;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
      }

      .new-property-panel::-webkit-scrollbar {
        width: 8px;
      }

      .new-property-panel::-webkit-scrollbar-track {
        background: #2c2c2c;
      }

      .new-property-panel::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 4px;
      }

      .new-property-panel::-webkit-scrollbar-thumb:hover {
        background: #4a4a4a;
      }

      .new-panel-header {
        position: sticky;
        top: 0;
        background: #272727;
        padding: 12px;
        border-bottom: 1px solid #404040;
        z-index: 1;
        flex-shrink: 0;
      }

      .new-panel-title {
        font-size: 13px;
        font-weight: 600;
        color: #ffffff;
        margin: 0;
      }

      .new-panel-content {
        flex: 1;
        padding: 0;
        display: flex;
        flex-direction: column;
      }

      .new-panel-empty-state {
        padding: 40px 20px;
        text-align: center;
        color: #999999;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .new-panel-empty-state .empty-icon {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .new-panel-empty-state .empty-title {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        color: #cccccc;
      }

      .new-panel-empty-state .empty-description {
        font-size: 11px;
        line-height: 1.4;
        color: #999999;
      }

      /* 动态布局区域 */
      .dynamic-layout-area {
        border-bottom: 1px solid #404040;
      }

      /* 响应式调整 */
      @media (max-width: 1200px) {
        .new-property-panel {
          width: 220px;
        }
      }

      @media (max-height: 600px) {
        .new-panel-header {
          padding: 8px 12px;
        }
      }

      /* 隐藏状态 */
      .new-property-panel.hidden {
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }

      .new-property-panel:not(.hidden) {
        transform: translateX(0);
        transition: transform 0.3s ease;
      }

      /* 区域间的分隔 */
      .panel-section-divider {
        height: 1px;
        background: #404040;
        margin: 0;
      }
    `;

    // 创建标题栏
    const header = document.createElement('div');
    header.className = 'new-panel-header';

    const title = document.createElement('h3');
    title.className = 'new-panel-title';
    title.innerHTML = `
      Design
      <span class="selection-indicator" style="opacity: 0.6; font-size: 11px; font-weight: normal; margin-left: 8px;">
        <span class="no-selection">未选中元素</span>
        <span class="has-selection" style="display: none;">已选中元素</span>
      </span>
    `;
    header.appendChild(title);

    // 保存标题元素的引用，用于更新选中状态
    this.titleElement = title;

    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'new-panel-content';

    panel.appendChild(style);
    panel.appendChild(header);
    panel.appendChild(content);

    this.panel = panel;
    this.content = content;
  }

  /**
   * 创建各个区域
   */
  createSections() {
    this.logger.info('PropertyPanel: createSections called');

    // 重置区域对象
    this.sections = {};
    this.layoutSections = {};

    // 1. 创建布局模式选择器（顶部固定）
    this.logger.info('PropertyPanel: Creating layout mode section');
    this.sections.layoutMode = new window.WVE.LayoutModeSection({
      collapsed: this.persisted.sections.layoutMode?.collapsed || false,
      uiManager: this.uiManager
    });

    // 监听布局模式变更
    // 注意：由于布局设计重构，LayoutModeSection 现在有独立的 onPositionChange 和 onLayoutChange 回调
    this.sections.layoutMode.onPositionChange = this.handlePositionChange.bind(this);
    this.sections.layoutMode.onLayoutChange = this.handleLayoutChange.bind(this);

    const layoutModeElement = this.sections.layoutMode.createElement();
    this.content.appendChild(layoutModeElement);

    // 添加分隔线
    const divider1 = document.createElement('div');
    divider1.className = 'panel-section-divider';
    this.content.appendChild(divider1);

    // 2. 创建动态布局区域容器
    this.dynamicLayoutArea = document.createElement('div');
    this.dynamicLayoutArea.className = 'dynamic-layout-area';
    this.content.appendChild(this.dynamicLayoutArea);

    // 3. 创建所有布局模式对应的区域
    this.createLayoutSections();

    // 添加分隔线
    const divider2 = document.createElement('div');
    divider2.className = 'panel-section-divider';
    this.content.appendChild(divider2);

    // 4. 创建样式属性标签页（底部）
    this.logger.info('PropertyPanel: Creating style tabs section');
    this.sections.styleTabs = new window.WVE.StyleTabsSection({
      collapsed: this.persisted.sections.styleTabs?.collapsed || false,
      uiManager: this.uiManager
    });

    const styleTabsElement = this.sections.styleTabs.createElement();
    this.content.appendChild(styleTabsElement);
    this.logger.info('PropertyPanel: Style tabs section created and appended');

    // 监听折叠状态变化
    Object.values(this.sections).forEach(section => {
      if (section && section.onToggle) {
        section.onToggle = (collapsed) => {
          this.saveSectionState(section.constructor.name.replace('Section', '').toLowerCase(), { collapsed });
        };
      }
    });

    // 确保所有样式都正确应用
    setTimeout(() => {
      this.uiManager.syncTailwindStyles();
      window.WVE.LucideIcons?.replaceInRoot?.(this.uiManager.getUIRoot());
    }, 100);

    this.logger.info('PropertyPanel: createSections completed successfully');
  }

  /**
   * 创建所有布局模式对应的区域
   */
  createLayoutSections() {
    this.logger.info('PropertyPanel: createLayoutSections called');

    // 检查布局 Section 类是否可用
    this.logger.info('PropertyPanel: Checking layout section classes availability');
    this.logger.info('PropertyPanel: NoneLayoutSection available:', !!window.WVE.NoneLayoutSection);
    this.logger.info('PropertyPanel: FlexLayoutSection available:', !!window.WVE.FlexLayoutSection);
    this.logger.info('PropertyPanel: GridLayoutSection available:', !!window.WVE.GridLayoutSection);

    // 无布局模式
    this.logger.info('PropertyPanel: Creating none layout section');
    try {
      this.layoutSections.none = new window.WVE.NoneLayoutSection({
        uiManager: this.uiManager
      });
      this.logger.info('PropertyPanel: NoneLayoutSection created successfully');
    } catch (error) {
      this.logger.error('PropertyPanel: Failed to create NoneLayoutSection:', error);
    }


    // 响应式布局模式 (Flexbox)
    this.logger.info('PropertyPanel: Creating flex layout section');
    try {
      this.layoutSections.flex = new window.WVE.FlexLayoutSection({
        uiManager: this.uiManager
      });
      this.logger.info('PropertyPanel: FlexLayoutSection created successfully');
    } catch (error) {
      this.logger.error('PropertyPanel: Failed to create FlexLayoutSection:', error);
    }

    // 网格布局模式
    this.logger.info('PropertyPanel: Creating grid layout section');
    try {
      this.layoutSections.grid = new window.WVE.GridLayoutSection({
        uiManager: this.uiManager
      });
      this.logger.info('PropertyPanel: GridLayoutSection created successfully');
    } catch (error) {
      this.logger.error('PropertyPanel: Failed to create GridLayoutSection:', error);
    }

    // 将所有区域元素添加到动态区域中，但默认隐藏
    this.logger.info('PropertyPanel: Adding layout section elements to dynamic area');
    Object.values(this.layoutSections).forEach((section, index) => {
      this.logger.info(`PropertyPanel: Processing layout section ${index + 1}`);
      const element = section.createElement();
      element.style.display = 'none';
      this.dynamicLayoutArea.appendChild(element);
    });
    this.logger.info('PropertyPanel: All layout sections created and added');

    // 显示默认布局模式
    // 注意：由于布局设计重构，改为显示默认的 'none' 布局模式
    this.logger.info('PropertyPanel: Showing default layout mode: none');
    this.showLayoutMode('none');
  }

  /**
   * 处理定位类型变更
   */
  handlePositionChange(newPosition, prevPosition, element) {
    this.logger.info('PropertyPanel: handlePositionChange called', {
      newPosition,
      prevPosition,
      element
    });

    // 定位类型变更不需要切换布局区域，只需要日志记录
    this.logger.info('PropertyPanel: Position changed from', prevPosition, 'to', newPosition);
  }

  /**
   * 处理布局方式变更
   */
  handleLayoutChange(newLayout, prevLayout, element) {
    this.logger.info('PropertyPanel: handleLayoutChange called', {
      newLayout,
      prevLayout,
      element
    });

    // 显示对应的布局区域
    this.showLayoutMode(newLayout);

    // 持久化状态
    this.saveState({ layoutMode: newLayout });

    this.logger.info('PropertyPanel: Layout change handled successfully:', newLayout);
  }

  /**
   * 兼容旧的布局模式变更处理（用于事件监听）
   */
  handleLayoutModeChange(event) {
    this.logger.info('PropertyPanel: handleLayoutModeChange event received', event);

    // 处理来自 wveLayoutChange 事件
    if (event && event.detail && event.detail.newLayout) {
      this.handleLayoutChange(event.detail.newLayout, event.detail.prevLayout, event.detail.element);
    }
  }

  /**
   * 显示指定的布局模式区域
   */
  showLayoutMode(mode) {
    console.log(`[PropertyPanel] showLayoutMode called with mode: ${mode}`);
    console.log(`[PropertyPanel] Available layout sections:`, Object.keys(this.layoutSections));

    // 隐藏所有布局区域
    Object.values(this.layoutSections).forEach((section, index) => {
      console.log(`[PropertyPanel] Hiding section ${index}:`, section ? 'exists' : 'null', section?.element ? 'has element' : 'no element');
      if (section && section.element) {
        section.element.style.display = 'none';
      }
    });

    // 显示当前模式的区域
    const currentSection = this.layoutSections[mode];
    console.log(`[PropertyPanel] Target section for mode ${mode}:`, currentSection ? 'exists' : 'null');
    console.log(`[PropertyPanel] Target section has element:`, currentSection?.element ? 'yes' : 'no');

    if (currentSection && currentSection.element) {
      console.log(`[PropertyPanel] Showing ${mode} layout section`);
      currentSection.element.style.display = 'block';

      // 如果有当前元素，更新该区域
      if (this.currentElement) {
        console.log(`[PropertyPanel] Updating ${mode} section with current element`);
        currentSection.update(this.currentElement);
      }
    } else {
      console.warn(`[PropertyPanel] Cannot show ${mode} layout section - section or element missing`);
    }
  }

  /**
   * 更新当前布局区域的元素
   */
  updateCurrentLayoutSection() {
    this.logger.info('PropertyPanel: updateCurrentLayoutSection called');

    // 注意：由于布局设计重构，改为从 LayoutModeSection 获取当前布局
    const currentLayout = this.sections.layoutMode.getCurrentLayout();
    this.logger.info('PropertyPanel: Current layout mode:', currentLayout);
    this.logger.info('PropertyPanel: Available layout sections:', Object.keys(this.layoutSections));

    const currentSection = this.layoutSections[currentLayout];
    this.logger.info('PropertyPanel: Current section exists:', !!currentSection);
    this.logger.info('PropertyPanel: Current element exists:', !!this.currentElement);

    if (currentSection && this.currentElement) {
      this.logger.info('PropertyPanel: Updating current layout section with element');
      currentSection.update(this.currentElement);
    } else {
      this.logger.warn('PropertyPanel: Cannot update layout section - missing section or element');
    }
  }

  /**
   * 保存区域状态
   */
  saveSectionState(sectionName, state) {
    this.saveState({
      sections: {
        ...this.persisted.sections,
        [sectionName]: { ...this.persisted.sections[sectionName], ...state }
      }
    });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    this.logger.info('Binding events for PropertyPanel');
    document.addEventListener('wveSelectionChange', this.handleSelectionChange);
    document.addEventListener('wveModeChange', this.handleModeChange);
    document.addEventListener('wveStyleChange', this.handleStyleChange);
    document.addEventListener('wveLayoutChange', this.handleLayoutModeChange);
    this.logger.info('Events bound successfully');

    // 窗口大小变化时重新应用布局
    window.addEventListener('resize', () => {
      const shouldShow = this.stateManager.editMode && this.persisted.visible;
      this.adjustBodyLayout(shouldShow);
    });

    // 键盘快捷键 - P 键切换面板
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.toggle();
        }
      }
    });
  }

  /**
   * 处理选择变更
   */
  handleSelectionChange(event) {
    this.logger.info('🎯 PropertyPanel: Selection change event received');
    this.logger.info('PropertyPanel: Event object:', {
      type: event?.type,
      detail: event?.detail,
      timestamp: new Date().toISOString()
    });

    const detail = event?.detail?.selected;
    this.logger.info('PropertyPanel: Selection detail analysis:', {
      detail: detail,
      isArray: Array.isArray(detail),
      isSet: detail instanceof Set,
      length: detail?.length || detail?.size || 0
    });

    let target = null;

    if (Array.isArray(detail)) {
      target = detail.length ? detail[detail.length - 1] : null;
      this.logger.info('PropertyPanel: Using last array element as target');
    } else if (detail instanceof Set) {
      const values = Array.from(detail);
      target = values.length ? values[values.length - 1] : null;
      this.logger.info('PropertyPanel: Using last Set element as target');
    }

    this.logger.info('PropertyPanel: Final target element:', {
      target: target,
      isElement: target instanceof Element,
      tagName: target?.tagName,
      shortName: target ? window.WVE.DOMUtils.shortNameOf(target) : 'null'
    });

    this.updateForElement(target instanceof Element ? target : null);
  }

  /**
   * 处理模式变更
   */
  handleModeChange(event) {
    const editMode = event?.detail?.editMode;
    this.updateVisibility();

    if (!editMode) {
      this.adjustBodyLayout(false);
    }
  }

  /**
   * 处理样式变更
   */
  handleStyleChange(event) {
    this.logger.debug('PropertyPanel: Style change event received:', event);
    // 当样式发生变更时，延迟更新面板避免冲突
    setTimeout(() => {
      if (this.currentElement) {
        this.updateForElement(this.currentElement);
      }
    }, 100);
  }

  /**
   * 为指定元素更新面板
   */
  updateForElement(element) {
    this.logger.info('Updating panel for element:', element);
    console.log(`[PropertyPanel] updateForElement called with:`, element);
    this.currentElement = element;

    // 更新标题中的选中状态指示器
    this.updateSelectionIndicator(element);

    if (!element) {
      this.logger.info('No element selected, showing empty state');
      this.showEmptyState();
      return;
    }

    this.logger.info('Element selected, hiding empty state');
    this.hideEmptyState();

    // 传递当前元素给布局模式选择器
    console.log(`[PropertyPanel] Updating layout mode section with element`);
    this.sections.layoutMode.update(element);

    // 注意：由于新的布局设计分离了定位和布局，不再需要自动检测和设置模式
    // LayoutModeSection.update() 方法会自动检测并更新定位类型和布局方式
    this.logger.info('PropertyPanel: Layout section updated via update() method');

    // 更新样式属性标签页
    this.logger.info('PropertyPanel: Updating style tabs');
    this.sections.styleTabs.update(element);

    this.logger.debug('Updated property panel for element:', element.tagName);
  }

  /**
   * 更新标题中的选中状态指示器
   */
  updateSelectionIndicator(element) {
    if (!this.titleElement) {
      return;
    }

    const noSelection = this.titleElement.querySelector('.no-selection');
    const hasSelection = this.titleElement.querySelector('.has-selection');

    if (element) {
      // 有元素选中
      if (noSelection) {
        noSelection.style.display = 'none';
      }
      if (hasSelection) {
        hasSelection.style.display = 'inline';
        // 只显示标签名
        const elementName = element.tagName.toLowerCase();
        hasSelection.textContent = `✓ ${elementName}`;
      }
      this.logger.info('PropertyPanel: Selection indicator updated - element selected');
    } else {
      // 没有元素选中
      if (noSelection) {
        noSelection.style.display = 'inline';
      }
      if (hasSelection) {
        hasSelection.style.display = 'none';
      }
      this.logger.info('PropertyPanel: Selection indicator updated - no element selected');
    }
  }


  /**
   * 显示空状态
   */
  showEmptyState() {
    // 清除现有内容
    this.content.innerHTML = '';

    // 创建空状态
    const emptyState = document.createElement('div');
    emptyState.className = 'new-panel-empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon">
        <i data-lucide="mouse-pointer" style="width: 48px; height: 48px;"></i>
      </div>
      <div class="empty-title">选择一个元素</div>
      <div class="empty-description">
        在页面上选择一个元素来编辑它的设计属性
      </div>
    `;

    this.content.appendChild(emptyState);

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(emptyState);
    }, 0);
  }

  /**
   * 隐藏空状态，恢复正常面板
   */
  hideEmptyState() {
    this.logger.info('PropertyPanel: hideEmptyState called');
    const emptyState = this.content.querySelector('.new-panel-empty-state');
    this.logger.info('PropertyPanel: Found empty state element:', !!emptyState);

    if (emptyState) {
      this.logger.info('PropertyPanel: Removing empty state and recreating sections');
      // 移除空状态元素
      emptyState.remove();

      // 清空内容容器并重新创建所有区域
      this.content.innerHTML = '';
      this.createSections();

      // 重新同步 Tailwind 样式，确保新创建的元素样式正确
      this.logger.info('PropertyPanel: Syncing Tailwind styles after recreation');
      setTimeout(() => {
        this.uiManager.syncTailwindStyles();
        window.WVE.LucideIcons?.replaceInRoot?.(this.uiManager.getUIRoot());
      }, 0);
    } else {
      this.logger.info('PropertyPanel: No empty state found, sections should already exist');
    }
  }

  /**
   * 更新面板可见性
   */
  updateVisibility() {
    if (!this.panel) {
      return;
    }

    const shouldShow = this.stateManager.editMode && this.persisted.visible;

    if (shouldShow) {
      this.panel.classList.remove('hidden');
      this.adjustBodyLayout(true);
    } else {
      this.panel.classList.add('hidden');
      this.adjustBodyLayout(false);
    }
  }

  /**
   * 切换面板显示/隐藏
   */
  toggle() {
    this.persisted.visible = !this.persisted.visible;
    this.saveState({ visible: this.persisted.visible });
    this.updateVisibility();

    this.logger.info(`Property panel ${this.persisted.visible ? 'shown' : 'hidden'}`);
  }

  /**
   * 显示面板
   */
  show() {
    this.persisted.visible = true;
    this.saveState({ visible: true });
    this.updateVisibility();
  }

  /**
   * 隐藏面板
   */
  hide() {
    this.persisted.visible = false;
    this.saveState({ visible: false });
    this.updateVisibility();
  }

  /**
   * 调整页面布局以适应属性面板
   */
  adjustBodyLayout(showPanel) {
    const body = document.body;
    const panelWidth = this.getPanelWidth();

    if (showPanel && this.stateManager.editMode) {
      body.style.marginRight = panelWidth + 'px';
      body.setAttribute('data-property-panel-visible', 'true');
    } else {
      body.style.marginRight = '';
      body.removeAttribute('data-property-panel-visible');
    }
  }

  /**
   * 获取属性面板宽度
   */
  getPanelWidth() {
    if (!this.panel) {
      return 240;
    }

    const computedStyle = window.getComputedStyle(this.panel);
    return parseInt(computedStyle.width, 10) || 240;
  }

  /**
   * 获取当前选中元素
   */
  getCurrentElement() {
    return this.currentElement;
  }

  /**
   * 获取当前布局模式
   */
  getCurrentLayoutMode() {
    // 注意：由于布局设计重构，改为从 LayoutModeSection 获取当前布局
    return this.sections.layoutMode.getCurrentLayout();
  }

  /**
   * 设置 Tailwind 管理器
   */
  setTailwindManager(manager) {
    this.tailwindManager = manager;
  }

  /**
   * 销毁面板
   */
  destroy() {
    // 恢复页面布局
    this.adjustBodyLayout(false);

    // 移除事件监听
    document.removeEventListener('wveSelectionChange', this.handleSelectionChange);
    document.removeEventListener('wveModeChange', this.handleModeChange);
    document.removeEventListener('wveStyleChange', this.handleStyleChange);
    document.removeEventListener('wveLayoutChange', this.handleLayoutModeChange);

    // 销毁各个区域
    Object.values(this.sections).forEach(section => {
      if (section && section.destroy) {
        section.destroy();
      }
    });

    Object.values(this.layoutSections).forEach(section => {
      if (section && section.destroy) {
        section.destroy();
      }
    });

    // 移除面板元素
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }

    this.panel = null;
    this.content = null;
    this.sections = {};
    this.layoutSections = {};
    this.currentElement = null;

    this.logger.info('New property panel destroyed');
  }
};