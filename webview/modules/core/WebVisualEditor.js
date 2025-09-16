/**
 * WebVisualEditor 主类 - 模块化重构版本
 */
window.WVE = window.WVE || {};
window.WVE.WebVisualEditor = class WebVisualEditor {
  constructor() {
    this.logger = new window.WVE.Logger('WebVisualEditor');
    this.logger.info('Initializing WebVisualEditor');

    // 初始化各个管理器
    this.stateManager = new window.WVE.StateManager();
    this.eventManager = new window.WVE.EventManager(this.stateManager);
    this.uiManager = new window.WVE.UIManager();
    this.editorStyleManager = null;

    // HTML解析器
    this.htmlParser = null;

    this.logger.info('WebVisualEditor core modules initialized');
  }

  /**
   * 初始化编辑器
   */
  async init() {
    this.logger.info('Starting WebVisualEditor initialization');

    try {
      // 移除 VS Code 默认样式
      document.getElementById('_defaultStyles')?.remove();

      // 将用户样式包装到 layer 中
      document.querySelectorAll('style:not(#wve-user-css-imports)').forEach(el => {
        el.textContent = `\n@layer user-style {\n${el.textContent}\n}`;
      });

      // 初始化UI组件
      this.uiManager.initUIRoot();
      this.editorStyleManager = new window.WVE.EditorStyleManager();
      this.editorStyleManager.init();
      this.uiManager.initSelector();

      // 初始化可移动元素管理器
      if (wve.config.enableMovingElements) {
        this.movableManager = new window.WVE.MovableManager(this.stateManager);
        this.movableManager.initMovables();
      }

      // 初始化选择管理器
      this.selectionManager = new window.WVE.SelectionManager(
        this.stateManager,
        this.eventManager
      );

      // 初始化悬浮工具栏
      this.floatingToolbar = new window.WVE.FloatingToolbar(
        this.uiManager,
        this.stateManager,
        this.eventManager
      );
      this.floatingToolbar.init();

      // 初始化工具栏拖拽
      this.toolbarDragHandler = new window.WVE.ToolbarDragHandler(
        this.floatingToolbar.getToolbar(),
        this.floatingToolbar.getDragHandle()
      );

      // 初始化交互处理器
      this.keyboardHandler = new window.WVE.KeyboardHandler(
        this.stateManager,
        this.selectionManager,
        this.eventManager,
        this.movableManager
      );

      this.mouseHandler = new window.WVE.MouseHandler(
        this.stateManager,
        this.selectionManager,
        this.uiManager,
        this.movableManager,
        this.eventManager
      );

      // 可选：初始化元素操作面板
      if (window.WVE.PanelManager && window.WVE.ElementPanel) {
        this.panelManager = new window.WVE.PanelManager(
          this.uiManager,
          this.stateManager,
          this.eventManager
        );
        this.panelManager.init();
      }

      // 恢复工具栏位置
      this.toolbarDragHandler.restoreToolbarPosition();

      // 确保 Lucide 图标正确初始化
      setTimeout(() => {
        window.WVE.LucideIcons.initialize();
      }, 500);

      // 更新初始状态
      this.floatingToolbar.updateZoom();
      this.floatingToolbar.updateLinkCodeButton();

      // 绑定扩展消息处理
      this.bindExtensionMessages();

      this.logger.info('WebVisualEditor initialization completed successfully');
    } catch (error) {
      this.logger.error('Error during WebVisualEditor initialization:', error);
      throw error;
    }
  }

  /**
   * 绑定扩展消息处理
   */
  bindExtensionMessages() {
    this.logger.debug('Binding extension message handlers');

    window.addEventListener('message', ({ data: { type, data } }) => {
      this.logger.debug('Received message from extension:', type, data);

      switch (type) {
        case 'state':
          Object.assign(this.stateManager, data);
          this.floatingToolbar.updateZoom();
          this.floatingToolbar.updateLinkCodeButton();
          this.floatingToolbar.applyModeState();
          if (typeof this.stateManager.broadcastModeChange === 'function') {
            this.stateManager.broadcastModeChange();
          }
          if (this.stateManager.previewMode) {
            this.floatingToolbar.clearSelectionForPreview();
          }
          break;

        case 'codeRanges':
          this.selectionManager.updateUserElements();
          if (!Array.isArray(data)) {
            this.logger.warn('codeRanges data is not an array');
            break;
          }
          if (data.length !== this.selectionManager.userElements.length) {
            this.logger.warn('codeRanges length mismatch', {
              userElements: this.selectionManager.userElements.length,
              data: data.length
            });
          }
          const count = Math.min(
            this.selectionManager.userElements.length,
            data.length
          );
          for (let index = 0; index < count; index++) {
            const element = this.selectionManager.userElements[index];
            const item = data[index];
            if (!item) continue;
            const { start, end } = item;
            element.setAttribute('data-wve-code-start', start);
            element.setAttribute('data-wve-code-end', end);
          }
          break;

        case 'select':
          if (!this.stateManager.linkCode) return;

          const selecting = data.reduce((collected, position) => {
            const found = this.selectionManager.userElements.findLast(element => {
              const [start, end] = [+element.dataset.wveCodeStart, +element.dataset.wveCodeEnd];
              return start <= position.start && position.end <= end;
            });
            if (found) collected.push(found);
            return collected;
          }, []);

          if (selecting.length === 0) return;

          this.selectionManager.clearSelection();
          selecting.forEach(el => this.selectionManager.select(el, false));
          break;
      }
    });

    this.logger.debug('Extension message handlers bound');
  }

  /**
   * 获取状态管理器
   */
  getStateManager() {
    return this.stateManager;
  }

  /**
   * 获取选择管理器
   */
  getSelectionManager() {
    return this.selectionManager;
  }

  /**
   * 获取事件管理器
   */
  getEventManager() {
    return this.eventManager;
  }

  /**
   * 获取UI管理器
   */
  getUIManager() {
    return this.uiManager;
  }

  /**
   * 获取可移动元素管理器
   */
  getMovableManager() {
    return this.movableManager;
  }
};
