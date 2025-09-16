/**
 * 事件管理模块 - 处理与 VSCode 的通信
 */
window.WVE = window.WVE || {};
window.WVE.EventManager = class EventManager {
  constructor(stateManager) {
    this.logger = new window.WVE.Logger('EventManager');
    this.stateManager = stateManager;
    this.logger.info('Initializing EventManager');
  }

  /**
   * 发送代码编辑事件到扩展
   */
  emitCodeEdits(selectedElements, codeEdits, movableManager) {
    if (codeEdits.length === 0) {
      this.logger.debug('No code edits to emit');
      return;
    }

    this.logger.info('Emitting code edits:', codeEdits.length);

    const data = codeEdits.map(edit => {
      const element = edit.element;
      return {
        element: window.WVE.DOMUtils.shortNameOf(element),
        domPath: window.WVE.DOMUtils.pathOf(element),
        codeRange: {
          start: +element.dataset.wveCodeStart,
          end: +element.dataset.wveCodeEnd
        },
        operations: edit.operations
      };
    });

    vscode.postMessage({ type: 'edit', data });
    this.stateManager.clearCodeEdits();

    if (wve.config.enableMovingElements && movableManager) {
      movableManager.clearMoversBeforeEdit();
    }

    this.logger.debug('Code edits sent to extension');
  }

  /**
   * 发送选择变更事件
   */
  emitSelectionChange(selectedElements) {
    // 内部广播（不受 linkCode 影响）
    try {
      const event = new CustomEvent('wveSelectionChange', {
        detail: { selected: Array.from(selectedElements) }
      });
      document.dispatchEvent(event);
    } catch (e) {
      this.logger.error('Failed to dispatch internal selection event', e);
    }

    // 与扩展同步（受 linkCode 控制）
    if (!this.stateManager.linkCode) {
      this.logger.debug('Link code disabled, skipping VSCode selection sync');
      return;
    }

    this.logger.debug('Emitting selection change:', selectedElements.size);

    vscode.postMessage({
      type: 'select',
      data: Array.from(selectedElements).map(el => {
        return {
          codeRange: {
            start: el.dataset.wveCodeStart,
            end: el.dataset.wveCodeEnd
          }
        };
      })
    });
  }

  /**
   * 发送删除事件
   */
  emitDelete(selectedElements) {
    this.logger.info('Emitting delete for elements:', selectedElements.size);

    vscode.postMessage({
      type: 'delete',
      data: Array.from(selectedElements).map(el => {
        return {
          codeRange: {
            start: +el.dataset.wveCodeStart,
            end: +el.dataset.wveCodeEnd
          }
        };
      })
    });
  }

  /**
   * 发送复制事件
   */
  emitCopy(selectedElements) {
    this.logger.info('Emitting copy for elements:', selectedElements.size);

    vscode.postMessage({
      type: 'copy',
      data: Array.from(selectedElements).map(el => {
        return {
          codeRange: {
            start: +el.dataset.wveCodeStart,
            end: +el.dataset.wveCodeEnd
          }
        };
      })
    });
  }

  /**
   * 发送剪切事件
   */
  emitCut(selectedElements) {
    this.logger.info('Emitting cut for elements:', selectedElements.size);

    vscode.postMessage({
      type: 'cut',
      data: Array.from(selectedElements).map(el => {
        return {
          codeRange: {
            start: +el.dataset.wveCodeStart,
            end: +el.dataset.wveCodeEnd
          }
        };
      })
    });
  }

  /**
   * 发送粘贴事件
   */
  async emitPaste(selectedElements, htmlParser) {
    this.logger.info('Handling paste operation');

    if (!htmlParser) htmlParser = new DOMParser();

    // 等待获取焦点以读取剪贴板
    if (!document.hasFocus()) {
      this.logger.debug('Waiting for focus to read clipboard');
      await new Promise(resolve => {
        window.addEventListener('focus', resolve, { once: true });
      });
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      const isHtml = htmlParser.parseFromString(clipboardText, 'text/html').body.firstElementChild !== null;
      const dest = Array.from(selectedElements).at(-1) ?? document.body;

      this.logger.debug('Paste content type:', isHtml ? 'HTML' : 'Text');

      vscode.postMessage({
        type: 'paste',
        data: {
          isHtml,
          codeRange: {
            start: +dest.dataset.wveCodeStart,
            end: +dest.dataset.wveCodeEnd
          }
        }
      });
    } catch (error) {
      this.logger.error('Error reading clipboard:', error);
    }
  }

  /**
   * 发送刷新事件
   */
  emitRefresh() {
    this.logger.info('Emitting refresh');
    vscode.postMessage({ type: 'refresh' });
  }
};
