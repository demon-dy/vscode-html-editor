/**
 * 工具栏拖拽处理模块
 */
window.WVE = window.WVE || {};
window.WVE.ToolbarDragHandler = class ToolbarDragHandler {
  constructor(toolbar, dragHandle) {
    this.logger = new window.WVE.Logger('ToolbarDrag');
    this.toolbar = toolbar;
    this.dragHandle = dragHandle;

    this.isDragging = false;
    this.startMouseX = 0;
    this.startMouseY = 0;
    this.startToolbarLeft = 0;
    this.startToolbarBottom = 0;
    this.rafId = null;

    this.logger.info('Initializing ToolbarDragHandler');
    this.setupDragging();
  }

  /**
   * 设置工具栏拖拽功能
   */
  setupDragging() {
    this.logger.debug('Setting up toolbar dragging');

    // 拖拽移动处理函数，使用 RAF 优化性能
    this.handleDragMove = (e) => {
      if (!this.isDragging) return;

      // 取消之前的动画帧请求
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }

      this.rafId = requestAnimationFrame(() => {
        // 计算鼠标移动的距离
        const deltaX = e.clientX - this.startMouseX;
        const deltaY = e.clientY - this.startMouseY;

        // 计算新位置
        let newLeft = this.startToolbarLeft + deltaX;
        let newBottom = this.startToolbarBottom - deltaY; // Y轴反转，因为bottom是从下往上计算

        // 边界检测
        const toolbarRect = this.toolbar.getBoundingClientRect();
        const maxLeft = window.innerWidth - toolbarRect.width - 20;
        const maxBottom = window.innerHeight - toolbarRect.height - 20;

        newLeft = Math.max(20, Math.min(newLeft, maxLeft));
        newBottom = Math.max(20, Math.min(newBottom, maxBottom));

        // 应用新位置
        this.toolbar.style.left = newLeft + 'px';
        this.toolbar.style.bottom = newBottom + 'px';
        this.toolbar.style.transform = 'none';

        this.logger.debug('Toolbar dragged to:', { left: newLeft, bottom: newBottom });
      });
    };

    // 鼠标按下开始拖拽
    this.dragHandle.addEventListener('mousedown', (e) => {
      this.logger.debug('Drag started');

      // 记录拖拽开始时的鼠标位置
      this.startMouseX = e.clientX;
      this.startMouseY = e.clientY;

      // 获取当前工具栏的实际渲染位置
      const rect = this.toolbar.getBoundingClientRect();

      // 先设置为绝对定位，但保持当前显示位置不变
      this.startToolbarLeft = rect.left;
      this.startToolbarBottom = window.innerHeight - rect.bottom;

      // 立即应用位置，确保视觉上没有跳跃
      this.toolbar.style.left = this.startToolbarLeft + 'px';
      this.toolbar.style.bottom = this.startToolbarBottom + 'px';
      this.toolbar.style.transform = 'none';

      // 开始拖拽
      this.isDragging = true;
      this.toolbar.classList.add('dragging');

      // 阻止默认事件和冒泡
      e.preventDefault();
      e.stopPropagation();
    });

    // 鼠标移动事件
    document.addEventListener('mousemove', this.handleDragMove);

    // 结束拖拽
    const endDrag = () => {
      if (this.isDragging) {
        this.logger.debug('Drag ended');

        this.isDragging = false;
        this.toolbar.classList.remove('dragging');

        // 取消动画帧请求
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }

        // 保存工具栏位置
        this.saveToolbarPosition();
      }
    };

    document.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);

    this.logger.debug('Toolbar dragging setup complete');
  }

  /**
   * 保存工具栏位置
   */
  saveToolbarPosition() {
    this.logger.debug('Saving toolbar position');
    // 不再持久化工具栏位置，始终使用默认底部居中
    try {
      localStorage.removeItem('wve-toolbar-position');
    } catch (error) {
      this.logger.warn('Error removing toolbar position from localStorage:', error);
    }
  }

  /**
   * 恢复工具栏位置
   */
  restoreToolbarPosition() {
    this.logger.debug('Restoring toolbar position to default');
    // 忽略历史位置，始终恢复为底部水平居中
    if (this.toolbar) {
      this.toolbar.style.bottom = '20px';
      this.toolbar.style.left = '50%';
      this.toolbar.style.transform = 'translateX(-50%)';
    }
  }
};