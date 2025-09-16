/**
 * 选择管理模块 - 处理元素的选择和取消选择
 */
window.WVE = window.WVE || {};
window.WVE.SelectionManager = class SelectionManager {
  constructor(stateManager, eventManager) {
    this.logger = new window.WVE.Logger('SelectionManager');
    this.stateManager = stateManager;
    this.eventManager = eventManager;

    this.selected = new Set();
    // 仅跟踪来自用户源码的元素（带有 data-wve-code-* 标记）
    this.userElements = Array.from(document.querySelectorAll('body *, body'))
      .filter(el => el.hasAttribute('data-wve-code-start') && el.hasAttribute('data-wve-code-end'));

    this.logger.info('Initializing SelectionManager');
  }

  /**
   * 选择元素
   */
  select(element, emit = true) {
    if (this.selected.has(element)) {
      this.logger.debug('Element already selected:', element);
      return;
    }

    // 检查是否与已选择的元素有包含关系
    if (this.selected.values().some(s => s.contains(element) || element.contains(s))) {
      this.logger.debug('Element has containment relationship with selected elements');
      return;
    }

    // 检查是否与正在编辑的元素有冲突
    if (this.stateManager.codeEdits.some(edit => (
      edit.element !== element && (edit.element.contains(element) || element.contains(edit.element))
    ))) {
      this.logger.debug('Element conflicts with editing elements');
      return;
    }

    this.selected.add(element);
    element.setAttribute('wve-selected', '');

    this.logger.info('Element selected:', window.WVE.DOMUtils.shortNameOf(element));

    if (emit) {
      this.eventManager.emitSelectionChange(this.selected);
    }
  }

  /**
   * 取消选择元素
   */
  deselect(element = null) {
    if (!element) {
      this.logger.debug('Deselecting all elements');
      this.selected.values().forEach(el => {
        this.deselect(el);
      });
      return;
    }

    if (!this.selected.has(element)) {
      this.logger.debug('Element not selected:', element);
      return;
    }

    // 检查是否与正在编辑的元素有冲突
    if (this.stateManager.codeEdits.some(edit => (
      edit.element !== element && (edit.element.contains(element) || element.contains(edit.element))
    ))) {
      this.logger.debug('Cannot deselect element due to editing conflict');
      return;
    }

    this.selected.delete(element);
    element.removeAttribute('wve-selected');

    this.logger.info('Element deselected:', window.WVE.DOMUtils.shortNameOf(element));

    this.eventManager.emitSelectionChange(this.selected);
  }

  /**
   * 切换选择状态
   */
  toggleSelection(el) {
    this.logger.debug('Toggling selection for element:', window.WVE.DOMUtils.shortNameOf(el));

    if (this.selected.has(el)) {
      this.deselect(el);
    } else {
      this.select(el);
    }
  }

  /**
   * 处理矩形选择
   */
  selectByRect(selectorRect, isControlPressed) {
    this.logger.debug('Selecting by rectangle:', selectorRect);

    const targets = this.userElements.filter(el => {
      return window.WVE.DOMUtils.isInSelector(el, selectorRect);
    });

    this.logger.info('Found targets for rect selection:', targets.length);

    if (isControlPressed) {
      targets.forEach(el => this.toggleSelection(el));
    } else {
      targets.forEach(el => this.select(el));
    }
  }

  /**
   * 处理单击选择
   */
  selectByClick(target, isControlPressed) {
    this.logger.debug('Selecting by click:', window.WVE.DOMUtils.shortNameOf(target));

    if (target === document.body) {
      this.logger.debug('Clicked on body, ignoring');
      return;
    }

    if (isControlPressed) {
      this.toggleSelection(target);
    } else {
      this.select(target);
    }
  }

  /**
   * 获取选中的元素集合
   */
  getSelected() {
    return this.selected;
  }

  /**
   * 检查元素是否被选中
   */
  isSelected(element) {
    return this.selected.has(element);
  }

  /**
   * 获取选中元素数量
   */
  getSelectedCount() {
    return this.selected.size;
  }

  /**
   * 清空所有选择
   */
  clearSelection() {
    this.logger.info('Clearing all selections');
    this.deselect();
  }

  /**
   * 更新用户元素列表
   */
  updateUserElements() {
    // 过滤掉扩展自身注入的节点和隐式插入节点，仅保留有源码位置映射的元素
    this.userElements = Array.from(document.querySelectorAll('body *, body'))
      .filter(el => el.hasAttribute('data-wve-code-start') && el.hasAttribute('data-wve-code-end'));
    this.logger.debug('Updated user elements count:', this.userElements.length);
  }
};
