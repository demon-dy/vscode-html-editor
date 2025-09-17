/**
 * 属性面板主类 - 1:1 复刻 Figma 右侧属性面板
 * 替代原有的 ElementPanel.js 顶部工具栏
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

    // 区域实例
    this.sections = {
      position: null,
      autoLayout: null,
      appearance: null,
      effects: null
    };

    // 存储和恢复状态
    this.storageKey = `wve-property-panel:${window.wve?.codeId || 'default'}`;
    this.persisted = {
      visible: true,
      sections: {
        position: { collapsed: false },
        autoLayout: { collapsed: false },
        appearance: { collapsed: false },
        effects: { collapsed: false }
      }
    };

    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleStyleChange = this.handleStyleChange.bind(this);
  }

  /**
   * 初始化属性面板
   */
  init() {
    this.logger.info('Initializing Figma-style property panel');

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

    this.logger.info('Property panel initialized');
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
    panel.className = 'figma-property-panel';

    // 应用 Figma 风格样式
    const style = document.createElement('style');
    style.textContent = `
      .figma-property-panel {
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
      }

      .figma-property-panel::-webkit-scrollbar {
        width: 8px;
      }

      .figma-property-panel::-webkit-scrollbar-track {
        background: #2c2c2c;
      }

      .figma-property-panel::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 4px;
      }

      .figma-property-panel::-webkit-scrollbar-thumb:hover {
        background: #4a4a4a;
      }

      .panel-header {
        position: sticky;
        top: 0;
        background: #383838;
        padding: 12px;
        border-bottom: 1px solid #404040;
        z-index: 1;
      }

      .panel-title {
        font-size: 13px;
        font-weight: 600;
        color: #ffffff;
        margin: 0;
      }

      .panel-content {
        padding: 0;
      }

      .panel-empty-state {
        padding: 40px 20px;
        text-align: center;
        color: #999999;
      }

      .panel-empty-state .empty-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 16px;
        opacity: 0.5;
      }

      .panel-empty-state .empty-title {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        color: #cccccc;
      }

      .panel-empty-state .empty-description {
        font-size: 11px;
        line-height: 1.4;
        color: #999999;
      }

      /* 响应式调整 */
      @media (max-width: 1200px) {
        .figma-property-panel {
          width: 220px;
        }
      }

      @media (max-height: 600px) {
        .panel-header {
          padding: 8px 12px;
        }
      }

      /* 隐藏状态 */
      .figma-property-panel.hidden {
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }

      .figma-property-panel:not(.hidden) {
        transform: translateX(0);
        transition: transform 0.3s ease;
      }
    `;

    // 创建标题栏
    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('h3');
    title.className = 'panel-title';
    title.textContent = 'Design';
    header.appendChild(title);

    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'panel-content';

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
    // Position 区域
    this.sections.position = new window.WVE.PositionSection({
      collapsed: this.persisted.sections.position.collapsed
    });

    // Auto Layout 区域
    this.sections.autoLayout = new window.WVE.AutoLayoutSection({
      collapsed: this.persisted.sections.autoLayout.collapsed
    });

    // Appearance 区域
    this.sections.appearance = new window.WVE.AppearanceSection({
      collapsed: this.persisted.sections.appearance.collapsed
    });

    // Effects 区域
    this.sections.effects = new window.WVE.EffectsSection({
      collapsed: this.persisted.sections.effects.collapsed
    });

    // 添加到面板
    Object.values(this.sections).forEach(section => {
      const sectionElement = section.createElement();
      this.content.appendChild(sectionElement);

      // 监听折叠状态变化
      section.onToggle = (collapsed) => {
        this.saveSectionState(section.constructor.name.replace('Section', '').toLowerCase(), { collapsed });
      };
    });
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
    document.addEventListener('wveSelectionChange', this.handleSelectionChange);
    document.addEventListener('wveModeChange', this.handleModeChange);
    document.addEventListener('wveStyleChange', this.handleStyleChange);

    // 窗口大小变化时重新应用布局
    window.addEventListener('resize', () => {
      // 只需要重新调整布局，不自动隐藏面板
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
    const detail = event?.detail?.selected;
    let target = null;

    if (Array.isArray(detail)) {
      target = detail.length ? detail[detail.length - 1] : null;
    } else if (detail instanceof Set) {
      const values = Array.from(detail);
      target = values.length ? values[values.length - 1] : null;
    }

    this.updateForElement(target instanceof Element ? target : null);
  }

  /**
   * 处理模式变更
   */
  handleModeChange(event) {
    const editMode = event?.detail?.editMode;
    this.updateVisibility();

    // 在预览模式下确保移除右边距
    if (!editMode) {
      this.adjustBodyLayout(false);
    }
  }

  /**
   * 处理样式变更
   */
  handleStyleChange(event) {
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
    this.currentElement = element;

    if (!element) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();

    // 更新各个区域
    Object.values(this.sections).forEach(section => {
      section.update(element);
    });

    // 根据元素类型动态显示/隐藏区域
    this.updateSectionVisibility(element);

    this.logger.debug('Updated property panel for element:', element.tagName);
  }

  /**
   * 根据元素类型更新区域可见性
   */
  updateSectionVisibility(element) {
    if (!element) return;

    const tagName = element.tagName.toLowerCase();
    const computedStyle = window.getComputedStyle(element);

    // Auto Layout 区域 - 只对容器类元素显示
    const isContainer = ['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav'].includes(tagName);
    const hasChildren = element.children.length > 0;

    if (isContainer || hasChildren) {
      this.sections.autoLayout.show();
    } else {
      this.sections.autoLayout.hide();
    }

    // 所有其他区域默认显示
    this.sections.position.show();
    this.sections.appearance.show();
    this.sections.effects.show();
  }

  /**
   * 显示空状态
   */
  showEmptyState() {
    // 清除现有内容
    this.content.innerHTML = '';

    // 创建空状态
    const emptyState = document.createElement('div');
    emptyState.className = 'panel-empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon">
        <i data-lucide="mouse-pointer" style="width: 48px; height: 48px;"></i>
      </div>
      <div class="empty-title">Select an element</div>
      <div class="empty-description">
        Choose an element on the page to edit its design properties
      </div>
    `;

    this.content.appendChild(emptyState);

    // 替换图标
    setTimeout(() => {
      window.WVE.LucideIcons?.replaceInRoot?.(emptyState);
    }, 0);
  }

  /**
   * 隐藏空状态，恢复区域
   */
  hideEmptyState() {
    const emptyState = this.content.querySelector('.panel-empty-state');
    if (emptyState) {
      this.content.innerHTML = '';
      // 重新添加所有区域
      Object.values(this.sections).forEach(section => {
        this.content.appendChild(section.element);
      });
    }
  }

  /**
   * 更新面板可见性
   */
  updateVisibility() {
    if (!this.panel) return;

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
      // 编辑模式且面板可见时，为body添加右边距
      body.style.marginRight = panelWidth + 'px';
      body.setAttribute('data-property-panel-visible', 'true');
    } else {
      // 预览模式或面板隐藏时，移除右边距
      body.style.marginRight = '';
      body.removeAttribute('data-property-panel-visible');
    }
  }

  /**
   * 获取属性面板宽度
   */
  getPanelWidth() {
    if (!this.panel) return 240; // 默认宽度

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

    // 销毁各个区域
    Object.values(this.sections).forEach(section => {
      section.destroy();
    });

    // 移除面板元素
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }

    this.panel = null;
    this.content = null;
    this.sections = {};
    this.currentElement = null;

    this.logger.info('Property panel destroyed');
  }
};