/**
 * 可移动元素管理模块
 */
window.WVE = window.WVE || {};
window.WVE.MovableManager = class MovableManager {
  constructor(stateManager) {
    this.logger = new window.WVE.Logger('MovableManager');
    this.stateManager = stateManager;

    this.movables = [];
    this.movers = new Set();
    this.moversBeforeEdit = null;
    this.userElements = Array.from(document.querySelectorAll('body *, body'));

    this.logger.info('Initializing MovableManager');
  }

  /**
   * 初始化可移动元素
   */
  initMovables() {
    this.logger.info('Initializing movable elements');

    // 某些 VS Code 内置 Chromium 版本不支持 CSS Typed OM（computedStyleMap）
    if (typeof Element !== 'undefined' && !('computedStyleMap' in Element.prototype)) {
      this.logger.warn('computedStyleMap not supported, skipping movable elements');
      return;
    }

    let movableCount = 0;

    this.userElements.forEach(el => {
      const styles = window.WVE.DOMUtils.getComputedStyleSafe(el, 'position');
      const position = styles.value;

      if (position === 'static' || position === 'sticky') {
        return;
      }

      const props = {
        left: window.WVE.DOMUtils.getComputedStyleSafe(el, 'left'),
        right: window.WVE.DOMUtils.getComputedStyleSafe(el, 'right'),
        top: window.WVE.DOMUtils.getComputedStyleSafe(el, 'top'),
        bottom: window.WVE.DOMUtils.getComputedStyleSafe(el, 'bottom')
      };

      // 忽略如果同时指定了 left & right, top & bottom
      if ((props.left.value !== 'auto' && props.right.value !== 'auto') ||
          (props.top.value !== 'auto' && props.bottom.value !== 'auto')) {
        return;
      }

      // 默认使用 left, top 如果未指定
      const propX = props.left.value !== 'auto' ? 'left' :
                   props.right.value !== 'auto' ? 'right' : 'left';
      const propY = props.top.value !== 'auto' ? 'top' :
                   props.bottom.value !== 'auto' ? 'bottom' : 'top';

      const x = props[propX];
      const y = props[propY];

      // 忽略非 px 单位
      if ((x.value !== 'auto' && x.unit !== 'px') ||
          (y.value !== 'auto' && y.unit !== 'px')) {
        return;
      }

      el.setAttribute('wve-movable', '');
      el.setAttribute('draggable', 'false');
      el.dataset.wvePropX = propX;
      el.dataset.wvePropY = propY;

      if (x.value !== 'auto') el.style[propX] = x.toString();
      if (y.value !== 'auto') el.style[propY] = y.toString();

      this.movables.push(el);
      movableCount++;
    });

    this.logger.info(`Initialized ${movableCount} movable elements`);
  }

  /**
   * 移动元素
   */
  moveElement(el, dx, dy) {
    if (dx === 0 && dy === 0) return;

    dx = Math.trunc(dx);
    dy = Math.trunc(dy);

    const styles = el.computedStyleMap ? el.computedStyleMap() : window.getComputedStyle(el);

    if (dx !== 0) {
      const propX = el.dataset.wvePropX;
      const valueX = styles.get ? styles.get(propX).value : parseFloat(styles.getPropertyValue(propX)) || 0;
      const x = valueX === 'auto' ? 0 : valueX;
      el.style[propX] = x + (propX === 'left' ? dx : -dx) + 'px';
    }

    if (dy !== 0) {
      const propY = el.dataset.wvePropY;
      const valueY = styles.get ? styles.get(propY).value : parseFloat(styles.getPropertyValue(propY)) || 0;
      const y = valueY === 'auto' ? 0 : valueY;
      el.style[propY] = y + (propY === 'top' ? dy : -dy) + 'px';
    }

    this.logger.debug(`Moved element ${window.WVE.DOMUtils.shortNameOf(el)} by dx:${dx}, dy:${dy}`);
  }

  /**
   * 移动多个元素
   */
  moveElements(dx, dy) {
    this.movers.forEach(el => this.moveElement(el, dx, dy));
  }

  /**
   * 约束移动多个元素（水平或垂直）
   */
  moveElementsConstrained(horizontal, dx, dy) {
    this.movers.forEach(el => {
      const propFixed = horizontal ? el.dataset.wvePropY : el.dataset.wvePropX;
      el.style[propFixed] = this.moversBeforeEdit.get(el).style[propFixed];

      if (horizontal) {
        this.moveElement(el, dx, 0);
      } else {
        this.moveElement(el, 0, dy);
      }
    });
  }

  /**
   * 检查是否在可移动元素上
   */
  isAtMovers(position) {
    return this.movers.values().some(el => {
      const rect = el.getBoundingClientRect();
      return (
        rect.left <= position.viewportX && position.viewportX <= rect.right &&
        rect.top <= position.viewportY && position.viewportY <= rect.bottom
      );
    });
  }

  /**
   * 添加移动元素
   */
  addMover(element) {
    if (element.hasAttribute('wve-movable')) {
      this.movers.add(element);
      this.logger.debug('Added mover:', window.WVE.DOMUtils.shortNameOf(element));
    }
  }

  /**
   * 移除移动元素
   */
  removeMover(element) {
    this.movers.delete(element);
    this.logger.debug('Removed mover:', window.WVE.DOMUtils.shortNameOf(element));
  }

  /**
   * 开始样式编辑
   */
  beginStyleEdit() {
    this.moversBeforeEdit = new Map(
      this.movers.values().map(el => [el, el.cloneNode(true)])
    );
    this.logger.debug('Begin style edit for', this.movers.size, 'movers');
  }

  /**
   * 完成样式编辑
   */
  finishStyleEdit(type) {
    if (!this.moversBeforeEdit) return;

    this.logger.debug('Finishing style edit of type:', type);

    this.movers.forEach(element => {
      const style = element.getAttribute('style');
      const beforeStyle = this.moversBeforeEdit.get(element).getAttribute('style');

      if (style === beforeStyle) return;

      const operation = { type, style };
      const updated = this.stateManager.codeEdits.some(edit => {
        if (edit.element === element) {
          edit.operations.push(operation);
          return true;
        }
      });

      if (!updated) {
        this.stateManager.addCodeEdit({ element, operations: [operation] });
      }
    });

    this.logger.info('Style edit completed with', this.stateManager.codeEdits.length, 'code edits');
  }

  /**
   * 清空编辑前状态
   */
  clearMoversBeforeEdit() {
    this.moversBeforeEdit = null;
  }

  /**
   * 检查是否有移动元素
   */
  hasMovers() {
    return this.movers.size > 0;
  }

  /**
   * 获取移动元素集合
   */
  getMovers() {
    return this.movers;
  }

  /**
   * 获取可移动元素列表
   */
  getMovables() {
    return this.movables;
  }

  /**
   * 更新用户元素列表
   */
  updateUserElements() {
    this.userElements = Array.from(document.querySelectorAll('body *, body'));
    this.logger.debug('Updated user elements count:', this.userElements.length);
  }
};