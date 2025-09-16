/**
 * 鼠标交互处理模块
 */
window.WVE = window.WVE || {};
window.WVE.MouseHandler = class MouseHandler {
  constructor(stateManager, selectionManager, uiManager, movableManager, eventManager) {
    this.logger = new window.WVE.Logger('MouseHandler');
    this.stateManager = stateManager;
    this.selectionManager = selectionManager;
    this.uiManager = uiManager;
    this.movableManager = movableManager;
    this.eventManager = eventManager;

    this.logger.info('Initializing MouseHandler');
    this.bindEvents();
  }

  /**
   * 绑定鼠标事件
   */
  bindEvents() {
    this.logger.debug('Binding mouse events');
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
  }

  /**
   * 处理鼠标按下事件
   */
  onMouseDown = (event) => {
    // 处理 shadow DOM 下事件重定向，使用 composedPath 判断是否点击在工具栏内
    const path = event.composedPath ? event.composedPath() : [];
    const toolbar = this.uiManager.getUIRoot()?.querySelector('#wve-floating-toolbar');

    if (toolbar && (toolbar.contains(event.target) || path.includes(toolbar))) {
      this.logger.debug('Mouse down on toolbar, ignoring');
      return;
    }

    this.logger.debug('Mouse down event at:', { x: event.clientX, y: event.clientY });

    const pos = window.WVE.DOMUtils.realPositionOf(event, this.stateManager.zoom);

    // 更新鼠标位置状态
    this.stateManager.setMousePosition('start', {
      viewportX: pos.clientX,
      viewportY: pos.clientY,
      pageX: pos.pageX,
      pageY: pos.pageY
    });

    this.stateManager.setMousePosition('current', {
      viewportX: pos.clientX,
      viewportY: pos.clientY,
      pageX: pos.pageX,
      pageY: pos.pageY
    });

    // 判断是否在可移动元素上
    const atMovers = this.movableManager && this.movableManager.isAtMovers(pos);

    if (atMovers && !this.stateManager.keyboard.Control) {
      this.logger.debug('Starting move operation');
      this.stateManager.setOperation('moving');
      this.movableManager.beginStyleEdit();
    } else {
      this.logger.debug('Starting selection operation');
      this.stateManager.setOperation('selecting');

      const selector = this.uiManager.getSelector();
      if (selector) {
        selector.style.display = 'block';
      }

      if (!this.stateManager.keyboard.Control) {
        this.selectionManager.clearSelection();
      }
    }

    // 开始选择绘制
    if (this.stateManager.operation === 'selecting') {
      this.drawSelector();
    }

    // 绑定临时事件
    document.addEventListener('mouseup', this.onMouseUp.bind(this), { once: true });
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
  };

  /**
   * 处理鼠标移动事件
   */
  onMouseMove = (event) => {
    const pos = window.WVE.DOMUtils.realPositionOf(event, this.stateManager.zoom);

    // 计算移动距离
    const dx = pos.clientX - this.stateManager.mouse.current.viewportX;
    const dy = pos.clientY - this.stateManager.mouse.current.viewportY;

    // 更新当前鼠标位置
    this.stateManager.setMousePosition('current', {
      viewportX: pos.clientX,
      viewportY: pos.clientY,
      pageX: pos.pageX,
      pageY: pos.pageY
    });

    // 处理移动操作
    if (this.stateManager.operation === 'moving' && this.movableManager) {
      this.handleMoving(dx, dy, pos);
    }
  };

  /**
   * 处理鼠标释放事件
   */
  onMouseUp = (event) => {
    this.logger.debug('Mouse up event');

    document.removeEventListener('mousemove', this.onMouseMove);

    const mouse = this.stateManager.mouse;

    if (this.stateManager.operation === 'selecting') {
      this.handleSelectionEnd(event, mouse);
    } else if (this.stateManager.operation === 'moving') {
      this.handleMovingEnd(mouse);
    }

    // 重置操作状态
    this.stateManager.setOperation('');

    // 发送代码编辑
    if (this.stateManager.codeEdits.length > 0) {
      this.eventManager.emitCodeEdits(
        this.selectionManager.getSelected(),
        this.stateManager.codeEdits,
        this.movableManager
      );
    }
  };

  /**
   * 处理选择结束
   */
  handleSelectionEnd(event, mouse) {
    const selector = this.uiManager.getSelector();

    if (mouse.start.viewportX !== mouse.current.viewportX ||
        mouse.start.viewportY !== mouse.current.viewportY) {
      // 矩形选择
      this.logger.debug('Handling rectangle selection');

      if (selector) {
        const selectorRect = selector.getBoundingClientRect();
        this.selectionManager.selectByRect(selectorRect, this.stateManager.keyboard.Control);
      }
    } else {
      // 单击选择
      this.logger.debug('Handling click selection');
      this.selectionManager.selectByClick(event.target, this.stateManager.keyboard.Control);
    }

    // 隐藏选择器
    if (selector) {
      selector.style.display = 'none';
    }
  }

  /**
   * 处理移动结束
   */
  handleMovingEnd(mouse) {
    if (mouse.start.viewportX !== mouse.current.viewportX ||
        mouse.start.viewportY !== mouse.current.viewportY) {
      this.logger.debug('Move operation completed');

      if (this.movableManager) {
        this.movableManager.finishStyleEdit('move');
      }
    }
  }

  /**
   * 处理移动操作
   */
  handleMoving(dx, dy, pos) {
    if (!this.movableManager) return;

    const mouse = this.stateManager.mouse;

    if (this.stateManager.keyboard.Shift) {
      // Shift约束移动
      const absDx = Math.abs(pos.clientX - mouse.start.viewportX);
      const absDy = Math.abs(pos.clientY - mouse.start.viewportY);
      const horizontal = absDx > absDy;

      this.movableManager.moveElementsConstrained(horizontal, dx, dy);
    } else {
      // 自由移动
      this.movableManager.moveElements(dx, dy);
    }

    this.logger.debug('Elements moved:', { dx, dy });
  }

  /**
   * 绘制选择框
   */
  drawSelector = () => {
    if (this.stateManager.operation !== 'selecting') return;

    requestAnimationFrame(this.drawSelector);

    const mouse = this.stateManager.mouse;
    const selector = this.uiManager.getSelector();

    if (!selector) return;

    const width = Math.abs(mouse.current.pageX - mouse.start.pageX);
    const height = Math.abs(mouse.current.pageY - mouse.start.pageY);

    selector.style.width = width + 'px';
    selector.style.height = height + 'px';
    selector.style.left = Math.min(mouse.start.pageX, mouse.current.pageX) + 'px';
    selector.style.top = Math.min(mouse.start.pageY, mouse.current.pageY) + 'px';
    selector.style.display = 'block';
  };
};