/**
 * 状态管理模块 - 管理编辑器的所有状态
 */
window.WVE = window.WVE || {};
window.WVE.StateManager = class StateManager {
  constructor() {
    this.logger = new window.WVE.Logger('StateManager');
    this.logger.info('Initializing StateManager');

    // 编辑器状态
    this.zoom = '1';
    this.linkCode = true;
    this.editMode = true;
    this.previewMode = false;

    // 键盘状态
    this.keyboard = {
      arrow: false,
      Shift: false,
      Control: false,
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
    };

    // 鼠标状态
    this.mouse = {
      start: { viewportX: 0, viewportY: 0, pageX: 0, pageY: 0 },
      current: { viewportX: 0, viewportY: 0, pageX: 0, pageY: 0 }
    };

    // 操作状态
    this.operation = '';
    this.codeEdits = [];

    // 从 sessionStorage 恢复状态
    this.restoreState();
  }

  /**
   * 从 sessionStorage 恢复状态
   */
  restoreState() {
    this.logger.debug('Restoring state from sessionStorage');

    try {
      const state = JSON.parse(sessionStorage.getItem(wve.codeId) ?? '{}');
      this.zoom = state.zoom ?? '1';
      this.linkCode = state.linkCode ?? true;
      this.editMode = state.editMode ?? true;
      this.previewMode = state.previewMode ?? false;

      this.logger.info('State restored:', {
        zoom: this.zoom,
        linkCode: this.linkCode,
        editMode: this.editMode,
        previewMode: this.previewMode
      });

      this.broadcastModeChange();
    } catch (error) {
      this.logger.error('Error restoring state:', error);
    }
  }

  /**
   * 保存状态到 sessionStorage 和 VSCode
   */
  saveState() {
    this.logger.debug('Saving state');

    const state = {
      zoom: this.zoom,
      linkCode: this.linkCode,
      editMode: this.editMode,
      previewMode: this.previewMode
    };

    try {
      sessionStorage.setItem(wve.codeId, JSON.stringify(state));
      vscode.postMessage({ type: 'state', data: state });
      this.logger.debug('State saved:', state);
    } catch (error) {
      this.logger.error('Error saving state:', error);
    }
  }

  /**
   * 设置键盘按键状态
   */
  setKeyboardState(key, pressed) {
    this.logger.debug(`Keyboard ${pressed ? 'press' : 'release'}:`, key);
    this.keyboard[key] = pressed;
    this.updateKeyboardCombinedState();
  }

  /**
   * 更新键盘组合状态
   */
  updateKeyboardCombinedState() {
    const kbd = this.keyboard;
    kbd.arrow = kbd.ArrowUp !== kbd.ArrowDown || kbd.ArrowLeft !== kbd.ArrowRight;
  }

  /**
   * 设置鼠标位置
   */
  setMousePosition(type, position) {
    // 只记录开始位置，避免移动时的大量日志输出
    if (type === 'start') {
      this.logger.debug(`Setting mouse ${type} position:`, position);
    }
    this.mouse[type] = { ...position };
  }

  /**
   * 设置操作状态
   */
  setOperation(operation) {
    this.logger.debug('Setting operation:', operation);
    this.operation = operation;
  }

  /**
   * 添加代码编辑
   */
  addCodeEdit(edit) {
    this.logger.debug('Adding code edit:', edit);
    this.codeEdits.push(edit);
  }

  /**
   * 清空代码编辑
   */
  clearCodeEdits() {
    this.logger.debug('Clearing code edits');
    this.codeEdits = [];
  }

  /**
   * 设置缩放
   */
  setZoom(zoom) {
    this.logger.info('Setting zoom:', zoom);
    this.zoom = zoom;
    this.saveState();
  }

  /**
   * 切换链接代码模式
   */
  toggleLinkCode() {
    this.linkCode = !this.linkCode;
    this.logger.info('Toggled link code:', this.linkCode);
    this.saveState();
  }

  /**
   * 设置模式（edit 或 preview）
   */
  setMode(mode) {
    const normalized = mode === 'preview' ? 'preview' : 'edit';
    const nextEdit = normalized === 'edit';
    const nextPreview = normalized === 'preview';
    const changed = this.editMode !== nextEdit || this.previewMode !== nextPreview;

    this.editMode = nextEdit;
    this.previewMode = nextPreview;

    if (changed) {
      this.logger.info('Set mode:', normalized);
      this.saveState();
    } else {
      this.logger.debug('Mode unchanged:', normalized);
    }

    this.broadcastModeChange();
  }

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    this.setMode(this.editMode ? 'preview' : 'edit');
  }

  /**
   * 切换预览模式
   */
  togglePreviewMode() {
    this.setMode(this.previewMode ? 'edit' : 'preview');
  }

  broadcastModeChange() {
    try {
      const detail = {
        editMode: this.editMode,
        previewMode: this.previewMode
      };
      const event = new CustomEvent('wveModeChange', { detail });
      document.dispatchEvent(event);
    } catch (error) {
      this.logger.warn('Failed to dispatch mode change event', error);
    }
  }
};
