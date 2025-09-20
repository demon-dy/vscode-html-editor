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
      position: null,          // 定位设置区域
      layoutMode: null,        // 布局模式选择器（包含完整布局管理功能）
      styleTabs: null          // 样式属性标签页
    };

    // 注意：布局功能已整合到 LayoutModeSection 中，不再需要独立的布局区域

    // 存储和恢复状态
    this.storageKey = `wve-property-panel:${window.wve?.codeId || 'default'}`;
    this.persisted = {
      visible: true,
      layoutMode: 'none',
      sections: {
        position: { collapsed: false },
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

    // 1. 创建定位设置区域（第一个位置）
    this.logger.info('PropertyPanel: Creating position section');
    if (window.WVE.PositionSection) {
      this.sections.position = new window.WVE.PositionSection({
        collapsed: this.persisted.sections.position?.collapsed || false,
        uiManager: this.uiManager
      });

      // 监听定位变更
      this.sections.position.onPositionChange = this.handlePositionChange.bind(this);

      const positionElement = this.sections.position.createElement();
      this.content.appendChild(positionElement);

      // 添加分隔线
      const divider0 = document.createElement('div');
      divider0.className = 'panel-section-divider';
      this.content.appendChild(divider0);
    } else {
      this.logger.warn('PositionSection class not available');
    }

    // 2. 创建布局模式选择器
    this.logger.info('PropertyPanel: Creating layout mode section');
    this.sections.layoutMode = new window.WVE.LayoutModeSection({
      collapsed: this.persisted.sections.layoutMode?.collapsed || false,
      uiManager: this.uiManager
    });

    // 监听布局模式变更
    this.sections.layoutMode.onLayoutChange = this.handleLayoutChange.bind(this);

    const layoutModeElement = this.sections.layoutMode.createElement();
    this.content.appendChild(layoutModeElement);

    // 添加分隔线
    const divider1 = document.createElement('div');
    divider1.className = 'panel-section-divider';
    this.content.appendChild(divider1);

    // 3. 创建样式属性标签页（底部）
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

    // 布局功能已整合到 LayoutModeSection 中，这里只需要持久化状态
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

    // 首先更新定位设置区域
    if (this.sections.position) {
      console.log(`[PropertyPanel] Updating position section with element`);
      this.sections.position.update(element);
    }

    // 传递当前元素给布局模式选择器（包含完整布局管理功能）
    console.log(`[PropertyPanel] Updating layout mode section with element`);
    this.sections.layoutMode.update(element);

    // LayoutModeSection 现在包含完整的布局管理功能，会自动处理所有布局相关设置
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
    // 从 LayoutModeSection 获取当前布局模式
    return this.sections.layoutMode?.getCurrentLayout() || 'none';
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

    // 移除面板元素
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }

    this.panel = null;
    this.content = null;
    this.sections = {};
    this.currentElement = null;

    this.logger.info('New property panel destroyed');
  }
};