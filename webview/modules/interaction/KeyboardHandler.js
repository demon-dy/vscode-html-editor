/**
 * 键盘交互处理模块
 */
window.WVE = window.WVE || {};
window.WVE.KeyboardHandler = class KeyboardHandler {
  constructor(stateManager, selectionManager, eventManager, movableManager) {
    this.logger = new window.WVE.Logger('KeyboardHandler');
    this.stateManager = stateManager;
    this.selectionManager = selectionManager;
    this.eventManager = eventManager;
    this.movableManager = movableManager;

    this.logger.info('Initializing KeyboardHandler');
    this.bindEvents();
  }

  /**
   * 绑定键盘事件
   */
  bindEvents() {
    this.logger.debug('Binding keyboard events');

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('copy', this.onCopyAndCut.bind(this));
    document.addEventListener('cut', this.onCopyAndCut.bind(this));
    document.addEventListener('paste', this.onPaste.bind(this));

    this.logger.debug('Keyboard events bound');
  }

  /**
   * 处理键盘按下事件
   */
  onKeyDown = (event) => {
    const kbd = this.stateManager.keyboard;
    const prev = { ...kbd };

    switch (event.key) {
      case 'Escape':
        this.logger.debug('Escape pressed - clearing selection and code edits');
        this.selectionManager.clearSelection();
        this.eventManager.emitCodeEdits(
          this.selectionManager.getSelected(),
          this.stateManager.codeEdits,
          this.movableManager
        );
        break;

      case 'Shift':
      case 'Control':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.stateManager.setKeyboardState(event.key, true);
        break;
    }

    // 更新Control状态的UI反馈
    if (!prev.Control && kbd.Control) {
      document.body.classList.add('wve-adding-selection');
      this.logger.debug('Control pressed - entering multi-select mode');
    }

    // 处理可移动元素的键盘移动
    if (wve.config.enableMovingElements && this.movableManager) {
      this.handleMovableKeyboard(event, kbd, prev);
    }
  };

  /**
   * 处理键盘释放事件
   */
  onKeyUp = (event) => {
    const prev = { ...this.stateManager.keyboard };

    switch (event.key) {
      case 'Shift':
      case 'Control':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.stateManager.setKeyboardState(event.key, false);
        break;
    }

    const kbd = this.stateManager.keyboard;

    // 更新Control状态的UI反馈
    if (prev.Control && !kbd.Control) {
      document.body.classList.remove('wve-adding-selection');
      this.logger.debug('Control released - exiting multi-select mode');
    }

    // 处理可移动元素的键盘移动结束
    if (wve.config.enableMovingElements && this.movableManager) {
      if (prev.arrow && !kbd.arrow) {
        this.movableManager.finishStyleEdit('move');
        this.eventManager.emitCodeEdits(
          this.selectionManager.getSelected(),
          this.stateManager.codeEdits,
          this.movableManager
        );
      }
    }

    // 处理删除键
    if (event.key === 'Delete' && this.selectionManager.getSelectedCount() > 0) {
      this.logger.info('Delete key pressed - deleting selected elements');
      this.eventManager.emitDelete(this.selectionManager.getSelected());
    }
  };

  /**
   * 处理可移动元素的键盘操作
   */
  handleMovableKeyboard(event, kbd, prev) {
    if (this.stateManager.operation !== '') return;

    if (!kbd.arrow || !this.movableManager.hasMovers()) return;

    // 开始移动编辑
    if (!prev.arrow) {
      this.movableManager.beginStyleEdit();
    }

    const dx = kbd.ArrowRight ? 1 : kbd.ArrowLeft ? -1 : 0;
    const dy = kbd.ArrowDown ? 1 : kbd.ArrowUp ? -1 : 0;

    this.movableManager.moveElements(dx, dy);

    // 禁用滚动
    event.preventDefault();

    this.logger.debug('Moved elements by keyboard:', { dx, dy });
  }

  /**
   * 处理复制和剪切事件
   */
  onCopyAndCut = (event) => {
    this.logger.info(`${event.type} event triggered for selected elements`);

    if (event.type === 'copy') {
      this.eventManager.emitCopy(this.selectionManager.getSelected());
    } else if (event.type === 'cut') {
      this.eventManager.emitCut(this.selectionManager.getSelected());
    }
  };

  /**
   * 处理粘贴事件
   */
  onPaste = async (event) => {
    this.logger.info('Paste event triggered');
    await this.eventManager.emitPaste(this.selectionManager.getSelected());
  };
};