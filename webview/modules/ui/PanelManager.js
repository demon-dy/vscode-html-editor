/**
 * 面板管理器 - 负责创建与生命周期管理
 */
window.WVE = window.WVE || {};
window.WVE.PanelManager = class PanelManager {
  constructor(uiManager, stateManager, eventManager) {
    this.logger = new window.WVE.Logger('PanelManager');
    this.uiManager = uiManager;
    this.stateManager = stateManager;
    this.eventManager = eventManager;
    this.panel = null;
  }

  init() {
    this.logger.info('Initializing PanelManager');
    this.panel = new window.WVE.ElementPanel(this.uiManager, this.stateManager, this.eventManager);
    this.panel.init();
    this.logger.info('PanelManager ready');
  }
};

