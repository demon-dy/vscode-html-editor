/**
 * 顶部样式操作栏 - 显示选中元素的关键样式
 */
window.WVE = window.WVE || {};
window.WVE.ElementPanel = class ElementPanel {
  constructor(uiManager, stateManager, eventManager) {
    this.logger = new window.WVE.Logger('ElementPanel');
    this.uiManager = uiManager;
    this.stateManager = stateManager;
    this.eventManager = eventManager;

    this.root = null;
    this.panel = null;
    this.toolbar = null;
    this.dragHandle = null;
    this.orientation = 'horizontal';
    this.dragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.persisted = { orientation: 'horizontal', collapsed: false };
    this.valueNodes = {};
    this.currentTarget = null;
    this.itemOrder = [];
    this.overflowWrapper = null;
    this.overflowButton = null;
    this.overflowMenu = null;
    this.isOverflowOpen = false;
    this.collapsed = false;
    this.collapseButton = null;

    this.storageKey = `wve-style-toolbar:${window.wve?.codeId || 'default'}`;

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleOverflowToggle = this.handleOverflowToggle.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleCollapseToggle = this.handleCollapseToggle.bind(this);
  }

  init() {
    this.logger.info('Initializing style toolbar');

    this.uiManager.initUIRoot();
    this.root = this.uiManager.getUIRoot();

    this.restoreState();
    this.createToolbar();

    this.root.appendChild(this.panel);
    this.applyOrientation(this.orientation);
    this.applyStoredPosition();
    this.bindDragHandle();
    this.bindOrientationToggle();
    this.bindCollapseToggle();
    this.applyCollapsedState();
    this.updateVisibility();
    this.updateValues(null);

    window.WVE.LucideIcons.replaceInRoot(this.root);

    this.fixOrientationToggleIcons();

    document.addEventListener('wveSelectionChange', this.handleSelectionChange);
    document.addEventListener('wveModeChange', this.handleModeChange);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousedown', this.handleOutsideClick, true);

    this.logger.info('Style toolbar initialized');
  }

  restoreState() {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        this.persisted = JSON.parse(stored) || this.persisted;
        if (this.persisted.orientation) {
          this.orientation = this.persisted.orientation;
        }
        if (typeof this.persisted.collapsed === 'boolean') {
          this.collapsed = this.persisted.collapsed;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to restore toolbar state', error);
    }
  }

  saveState(patch) {
    this.persisted = { ...this.persisted, ...patch };
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.persisted));
    } catch (error) {
      this.logger.warn('Failed to persist toolbar state', error);
    }
  }

  createToolbar() {
    const panel = document.createElement('div');
    panel.id = 'wve-style-toolbar';
    panel.dataset.orientation = this.orientation;
    panel.style.display = 'none';

    const style = document.createElement('style');
    style.textContent = `
      :host {
        font-family: var(--vscode-font-family, "Inter", "SF Pro Text", system-ui, -apple-system, "Segoe UI", sans-serif);
        color: rgba(255, 255, 255, 0.9);
      }
      #wve-style-toolbar {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        background: rgba(18, 18, 18, 0.82);
        color: rgba(255, 255, 255, 0.88);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 8px 10px;
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.32);
        backdrop-filter: blur(14px);
        display: none;
        pointer-events: auto;
        min-height: 40px;
      }
      #wve-style-toolbar.dragging {
        cursor: grabbing;
        opacity: 0.98;
      }
      #wve-style-toolbar.collapsed .wve-toolbar-content > *:not(.wve-toolbar-item[data-type="handle"]):not(.wve-control-group) {
        display: none;
      }
      .wve-toolbar-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #wve-style-toolbar[data-orientation="vertical"] .wve-toolbar-content {
        flex-direction: column;
        align-items: stretch;
      }
      .wve-toolbar-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        color: inherit;
        font-size: 12px;
        line-height: 1.2;
        min-height: 28px;
        transition: background 120ms ease, color 120ms ease;
        user-select: none;
      }
      .wve-toolbar-item[data-type="handle"] {
        cursor: grab;
        background: transparent;
        padding: 6px;
        justify-content: center;
      }
      #wve-style-toolbar.dragging .wve-toolbar-item[data-type="handle"] {
        cursor: grabbing;
      }
      .wve-toolbar-item[data-type="field"] {
        justify-content: flex-start;
        width: 100px;
        min-width: 100px;
        max-width: 100px;
        font-variant-numeric: tabular-nums;
      }
      #wve-style-toolbar[data-orientation="vertical"] .wve-toolbar-item[data-type="field"] {
        width: 100%;
        justify-content: space-between;
      }
      .wve-toolbar-item[data-type="button"] {
        cursor: pointer;
        background: rgba(255, 255, 255, 0.06);
      }
      .wve-toolbar-item[data-type="button"]:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .wve-toolbar-item[data-type="field"]:hover {
        background: rgba(255, 255, 255, 0.09);
      }
      .wve-toolbar-item.wve-overflow-item {
        width: 100%;
        justify-content: space-between;
      }
      .wve-icon {
        width: 14px;
        height: 14px;
        color: rgba(255, 255, 255, 0.82);
      }
      .wve-value {
        color: rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 60px;
      }
      .wve-value.is-muted {
        color: rgba(255, 255, 255, 0.55);
      }
      .wve-color-chip {
        width: 12px;
        height: 12px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: transparent;
      }
      .wve-field-value {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .wve-divider {
        width: 1px;
        height: 24px;
        background: rgba(255, 255, 255, 0.12);
        align-self: stretch;
      }
      #wve-style-toolbar[data-orientation="vertical"] .wve-divider {
        width: 100%;
        height: 1px;
        margin: 4px 0;
      }
      .wve-overflow {
        position: relative;
        display: none;
        align-items: center;
      }
      .wve-overflow-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        color: inherit;
        cursor: pointer;
        transition: background 120ms ease;
      }
      .wve-overflow-button:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .wve-overflow-menu {
        position: absolute;
        border-radius: 12px;
        padding: 8px;
        display: none;
        flex-direction: column;
        gap: 6px;
        background: rgba(18, 18, 18, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(16px);
        z-index: 2;
      }
      .wve-overflow-menu[data-open="true"] {
        display: flex;
      }
      .wve-overflow-menu .wve-toolbar-item {
        background: rgba(255, 255, 255, 0.06);
      }
      .wve-overflow-menu .wve-toolbar-item:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .wve-overflow-menu .wve-divider {
        width: 100%;
        height: 1px;
        margin: 4px 0;
        background: rgba(255, 255, 255, 0.12);
      }
      .wve-toggle-icons .wve-icon {
        display: none;
      }
      #wve-style-toolbar[data-orientation="horizontal"] .wve-toggle-icons .wve-icon[data-orientation="horizontal"],
      #wve-style-toolbar[data-orientation="vertical"] .wve-toggle-icons .wve-icon[data-orientation="vertical"] {
        display: inline-block;
      }
      .wve-control-group {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
      }
      #wve-style-toolbar[data-orientation="horizontal"] .wve-control-group {
        flex-direction: row;
        gap: 6px;
      }
      #wve-style-toolbar[data-orientation="vertical"] .wve-control-group {
        flex-direction: row;
        justify-content: space-between;
      }
      #wve-style-toolbar[data-orientation="vertical"] .wve-control-group .wve-toolbar-item {
        flex: 1;
        justify-content: center;
      }
    `;

    const toolbar = document.createElement('div');
    toolbar.className = 'wve-toolbar-content';

    panel.appendChild(style);
    panel.appendChild(toolbar);

    this.panel = panel;
    this.toolbar = toolbar;
    this.itemOrder = [];

    this.buildItems();
    this.createOverflowControls();
  }

  buildItems() {
    const schema = [
      { type: 'handle', id: 'dragHandle', icon: 'grip-horizontal', label: '拖拽移动操作栏', fixed: true },
      { type: 'control-group', id: 'controls', fixed: true, controls: [
        { type: 'button', id: 'collapseToggle', icon: 'chevron-left', label: '收起操作栏', collapse: true },
        { type: 'button', id: 'orientationToggle', icon: 'more-horizontal', label: '切换操作栏布局', toggle: true }
      ]},
      { type: 'divider' },
      { type: 'field', id: 'backgroundColor', icon: 'paintbrush', label: '背景色' },
      { type: 'field', id: 'backgroundImage', icon: 'image', label: '背景图片' },
      { type: 'field', id: 'border', icon: 'square-dashed', label: '描边' },
      { type: 'field', id: 'borderRadius', icon: 'radius', label: '圆角' },
      { type: 'divider' },
      { type: 'field', id: 'display', icon: 'layout-dashboard', label: '布局' },
      { type: 'field', id: 'padding', icon: 'shrink', label: '内边距' },
      { type: 'field', id: 'margin', icon: 'expand', label: '外边距' },
      { type: 'divider' },
      { type: 'field', id: 'fontSize', icon: 'type', label: '字号' },
      { type: 'field', id: 'fontWeight', icon: 'bold', label: '粗细' },
      { type: 'field', id: 'fontColor', icon: 'underline', label: '字体颜色' },
      { type: 'divider' },
      { type: 'field', id: 'textAlign', icon: 'align-justify', label: '对齐方式' },
      { type: 'divider' },
      { type: 'field', id: 'opacity', icon: 'droplet', label: '不透明度' },
      { type: 'divider' },
      { type: 'field', id: 'width', icon: 'move-horizontal', label: '宽度' },
      { type: 'field', id: 'height', icon: 'move-vertical', label: '高度' }
    ];

    schema.forEach(item => {
      if (item.type === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'wve-divider';
        this.toolbar.appendChild(divider);
        this.itemOrder.push({ node: divider, meta: item });
        return;
      }

      if (item.type === 'handle') {
        const handle = document.createElement('div');
        handle.className = 'wve-toolbar-item';
        handle.dataset.type = 'handle';
        handle.title = item.label;

        const icon = document.createElement('i');
        icon.className = 'wve-icon';
        icon.setAttribute('data-lucide', item.icon);

        handle.appendChild(icon);
        this.toolbar.appendChild(handle);
        this.dragHandle = handle;
        this.itemOrder.push({ node: handle, meta: item });
        return;
      }

      if (item.type === 'field') {
        const field = document.createElement('div');
        field.className = 'wve-toolbar-item';
        field.dataset.type = 'field';
        field.dataset.field = item.id;
        field.title = item.label;

        const icon = document.createElement('i');
        icon.className = 'wve-icon';
        icon.setAttribute('data-lucide', item.icon);

        const value = document.createElement('span');
        value.className = 'wve-value is-muted';
        value.textContent = '--';

        const valueWrap = document.createElement('span');
        valueWrap.className = 'wve-field-value';
        valueWrap.appendChild(value);

        if (item.id === 'backgroundColor' || item.id === 'fontColor') {
          const chip = document.createElement('span');
          chip.className = 'wve-color-chip';
          valueWrap.prepend(chip);
          this.valueNodes[item.id] = { value, chip };
        } else {
          this.valueNodes[item.id] = { value };
        }

        field.appendChild(icon);
        field.appendChild(valueWrap);
        this.toolbar.appendChild(field);
        this.itemOrder.push({ node: field, meta: item });
        return;
      }

      if (item.type === 'button' && item.collapse) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wve-toolbar-item';
        button.dataset.type = 'collapse';
        button.id = 'wve-collapse-toggle';
        button.title = item.label;

        const icon = document.createElement('i');
        icon.className = 'wve-icon';
        icon.setAttribute('data-lucide', item.icon);

        button.appendChild(icon);
        this.toolbar.appendChild(button);
        this.collapseButton = button;
        this.itemOrder.push({ node: button, meta: item });
        return;
      }

      if (item.type === 'control-group') {
        const group = document.createElement('div');
        group.className = 'wve-control-group';
        group.dataset.type = 'control-group';

        item.controls.forEach(control => {
          if (control.type === 'button' && control.collapse) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'wve-toolbar-item';
            button.dataset.type = 'collapse';
            button.id = 'wve-collapse-toggle';
            button.title = control.label;

            const icon = document.createElement('i');
            icon.className = 'wve-icon';
            icon.setAttribute('data-lucide', control.icon);

            button.appendChild(icon);
            group.appendChild(button);
            this.collapseButton = button;
          }

          if (control.type === 'button' && control.toggle) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'wve-toolbar-item wve-toggle-icons';
            button.dataset.type = 'button';
            button.id = 'wve-orientation-toggle';
            button.title = control.label;

            const iconHorizontal = document.createElement('i');
            iconHorizontal.className = 'wve-icon';
            iconHorizontal.setAttribute('data-lucide', 'more-horizontal');
            iconHorizontal.dataset.orientation = 'horizontal';

            const iconVertical = document.createElement('i');
            iconVertical.className = 'wve-icon';
            iconVertical.setAttribute('data-lucide', 'more-vertical');
            iconVertical.dataset.orientation = 'vertical';

            button.appendChild(iconHorizontal);
            button.appendChild(iconVertical);
            group.appendChild(button);
            this.orientationToggle = button;
          }
        });

        this.toolbar.appendChild(group);
        this.itemOrder.push({ node: group, meta: item });
      }
    });
  }

  createOverflowControls() {
    this.overflowWrapper = document.createElement('div');
    this.overflowWrapper.className = 'wve-overflow';

    this.overflowButton = document.createElement('button');
    this.overflowButton.type = 'button';
    this.overflowButton.className = 'wve-overflow-button';
    this.overflowButton.setAttribute('aria-expanded', 'false');
    this.overflowButton.title = '显示更多操作';

    const icon = document.createElement('i');
    icon.className = 'wve-icon';
    icon.setAttribute('data-lucide', 'ellipsis');
    this.overflowButton.appendChild(icon);

    this.overflowMenu = document.createElement('div');
    this.overflowMenu.className = 'wve-overflow-menu';
    this.overflowMenu.setAttribute('data-open', 'false');

    this.overflowWrapper.appendChild(this.overflowButton);
    this.overflowWrapper.appendChild(this.overflowMenu);
    this.toolbar.appendChild(this.overflowWrapper);

    this.overflowButton.addEventListener('click', this.handleOverflowToggle);
  }

  applyOrientation(next) {
    this.orientation = next === 'vertical' ? 'vertical' : 'horizontal';
    if (this.panel) {
      this.panel.dataset.orientation = this.orientation;
    }
    this.saveState({ orientation: this.orientation });
    this.closeOverflowMenu();
    this.updateOverflowLayout();
  }

  toggleOrientation() {
    const next = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    this.applyOrientation(next);
  }

  fixOrientationToggleIcons() {
    if (this.orientationToggle) {
      const icons = this.orientationToggle.querySelectorAll('svg[data-lucide]');
      icons.forEach(icon => {
        const lucideType = icon.getAttribute('data-lucide');
        if (lucideType === 'more-horizontal') {
          icon.dataset.orientation = 'horizontal';
        } else if (lucideType === 'more-vertical') {
          icon.dataset.orientation = 'vertical';
        }
      });
    }
  }

  bindOrientationToggle() {
    this.orientationToggle?.addEventListener('click', () => this.toggleOrientation());
  }

  bindCollapseToggle() {
    this.collapseButton?.addEventListener('click', this.handleCollapseToggle);
  }

  handleCollapseToggle() {
    this.toggleCollapsed();
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    this.applyCollapsedState();
    this.saveState({ collapsed: this.collapsed });
  }

  applyCollapsedState() {
    if (!this.panel || !this.collapseButton) return;

    this.panel.classList.toggle('collapsed', this.collapsed);

    const icon = this.collapseButton.querySelector('.wve-icon');
    if (icon) {
      icon.setAttribute('data-lucide', this.collapsed ? 'chevron-right' : 'chevron-left');
      window.WVE.LucideIcons?.replaceInRoot?.(this.collapseButton);
    }

    this.collapseButton.title = this.collapsed ? '展开操作栏' : '收起操作栏';
  }

  bindDragHandle() {
    if (!this.dragHandle) return;
    this.dragHandle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();

      const rect = this.panel.getBoundingClientRect();
      this.dragging = true;
      this.dragOffset.x = event.clientX - rect.left;
      this.dragOffset.y = event.clientY - rect.top;

      this.panel.classList.add('dragging');
      this.panel.style.transform = 'none';
      this.panel.style.left = `${rect.left}px`;
      this.panel.style.top = `${rect.top}px`;

      window.addEventListener('pointermove', this.handlePointerMove);
      window.addEventListener('pointerup', this.handlePointerUp);
    });
  }

  handlePointerMove(event) {
    if (!this.dragging) return;

    const nextLeft = event.clientX - this.dragOffset.x;
    const nextTop = event.clientY - this.dragOffset.y;
    const pos = this.clampToViewport(nextLeft, nextTop);

    this.panel.style.left = `${pos.left}px`;
    this.panel.style.top = `${pos.top}px`;
  }

  handlePointerUp() {
    if (!this.dragging) return;

    this.dragging = false;
    this.panel.classList.remove('dragging');

    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);

    this.persistPosition();
  }

  handleSelectionChange(event) {
    const detail = event?.detail?.selected;
    let target = null;

    if (Array.isArray(detail)) {
      target = detail.length ? detail[detail.length - 1] : null;
    } else if (detail instanceof Set) {
      const values = Array.from(detail);
      target = values.length ? values[values.length - 1] : null;
    }

    if (target instanceof Element) {
      this.updateValues(target);
    } else {
      this.updateValues(null);
    }
  }

  handleModeChange(event) {
    const editMode = event?.detail?.editMode;
    this.updateVisibility();
    if (!editMode) {
      this.updateValues(null);
    }
  }

  handleResize() {
    if (this.dragging) return;
    this.applyStoredPosition();
    this.updateOverflowLayout();
    if (this.isOverflowOpen) {
      this.positionOverflowMenu();
    }
  }

  handleOverflowToggle(event) {
    event?.stopPropagation?.();
    if (!this.overflowMenu) return;
    this.isOverflowOpen = !this.isOverflowOpen;
    this.overflowMenu.setAttribute('data-open', String(this.isOverflowOpen));
    this.overflowButton?.setAttribute('aria-expanded', String(this.isOverflowOpen));

    if (this.isOverflowOpen) {
      this.positionOverflowMenu();
    }
  }

  positionOverflowMenu() {
    if (!this.overflowMenu || !this.overflowWrapper || !this.panel) return;

    // 重置位置以获取正确的尺寸
    this.overflowMenu.style.left = '';
    this.overflowMenu.style.right = '';
    this.overflowMenu.style.top = '';
    this.overflowMenu.style.bottom = '';

    const buttonRect = this.overflowWrapper.getBoundingClientRect();
    const menuRect = this.overflowMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const margin = 8; // 与屏幕边缘的最小距离

    // 计算各个方向的可用空间
    const spaceBelow = viewportHeight - buttonRect.bottom - margin;
    const spaceAbove = buttonRect.top - margin;
    const spaceRight = viewportWidth - buttonRect.right - margin;
    const spaceLeft = buttonRect.left - margin;

    let position = {};

    if (this.orientation === 'horizontal') {
      // 横向模式：优先在下方弹出，空间不够则在上方
      if (spaceBelow >= menuRect.height || spaceBelow >= spaceAbove) {
        // 在下方弹出
        position.top = 'calc(100% + 6px)';
      } else {
        // 在上方弹出
        position.bottom = 'calc(100% + 6px)';
      }

      // 水平对齐：优先右对齐，空间不够则左对齐
      if (spaceRight >= menuRect.width || spaceRight >= spaceLeft) {
        position.right = '0';
      } else {
        position.left = '0';
      }
    } else {
      // 纵向模式：优先在右侧弹出，空间不够则在左侧
      if (spaceRight >= menuRect.width || spaceRight >= spaceLeft) {
        // 在右侧弹出
        position.left = 'calc(100% + 6px)';
      } else {
        // 在左侧弹出
        position.right = 'calc(100% + 6px)';
      }

      // 垂直对齐：根据可用空间决定从顶部还是底部对齐
      if (spaceBelow >= menuRect.height || spaceBelow >= spaceAbove) {
        position.top = '0';
      } else {
        position.bottom = '0';
      }
    }

    // 应用计算出的位置
    Object.assign(this.overflowMenu.style, position);
  }

  handleOutsideClick(event) {
    if (!this.isOverflowOpen) return;
    const path = event.composedPath ? event.composedPath() : [];
    if (path.includes(this.panel)) return;
    this.closeOverflowMenu();
  }

  clampToViewport(left, top) {
    const margin = 8;
    const width = this.panel.offsetWidth || 320;
    const height = this.panel.offsetHeight || 48;
    const maxLeft = window.innerWidth - width - margin;
    const maxTop = window.innerHeight - height - margin;

    return {
      left: Math.min(Math.max(left, margin), Math.max(margin, maxLeft)),
      top: Math.min(Math.max(top, margin), Math.max(margin, maxTop))
    };
  }

  persistPosition() {
    const rect = this.panel.getBoundingClientRect();
    const left = rect.left;
    const top = rect.top;
    this.saveState({ position: { left, top } });
  }

  applyStoredPosition() {
    const saved = this.persisted?.position;
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      const clamped = this.clampToViewport(saved.left, saved.top);
      this.panel.style.left = `${clamped.left}px`;
      this.panel.style.top = `${clamped.top}px`;
      this.panel.style.transform = 'none';
    } else {
      this.panel.style.left = '50%';
      this.panel.style.top = '16px';
      this.panel.style.transform = 'translateX(-50%)';
    }
  }

  updateVisibility() {
    if (!this.panel) return;
    if (this.stateManager.editMode) {
      this.panel.style.display = 'block';
      this.updateOverflowLayout();
    } else {
      this.panel.style.display = 'none';
      this.closeOverflowMenu();
    }
  }

  updateValues(target) {
    this.currentTarget = target;
    const values = this.collectValues(target);

    Object.entries(values).forEach(([key, result]) => {
      const nodes = this.valueNodes[key];
      if (!nodes) return;
      const text = result?.text ?? '--';
      const muted = !result || result.isEmpty;

      nodes.value.textContent = text;
      nodes.value.classList.toggle('is-muted', !!muted);

      if (nodes.chip) {
        const color = result?.chip || 'transparent';
        nodes.chip.style.background = color;
        nodes.chip.style.opacity = muted ? '0.4' : '1';
      }
    });

    this.updateOverflowLayout();
  }

  collectValues(target) {
    if (!target) {
      return this.emptyValues();
    }

    const style = window.getComputedStyle(target);
    const rect = target.getBoundingClientRect();

    return {
      backgroundColor: this.toColor(style.backgroundColor),
      backgroundImage: this.toBackgroundImage(style.backgroundImage),
      border: this.toBorder(style),
      borderRadius: this.toRadius(style.borderRadius),
      display: this.toText(style.display),
      padding: this.toBoxValues(style, 'padding'),
      margin: this.toBoxValues(style, 'margin'),
      fontSize: this.toText(style.fontSize),
      fontWeight: this.toFontWeight(style.fontWeight),
      fontColor: this.toColor(style.color),
      textAlign: this.toText(style.textAlign),
      opacity: this.toOpacity(style.opacity),
      width: this.toMeasurement(rect.width),
      height: this.toMeasurement(rect.height)
    };
  }

  emptyValues() {
    const placeholder = { text: '--', isEmpty: true };
    return {
      backgroundColor: placeholder,
      backgroundImage: placeholder,
      border: placeholder,
      borderRadius: placeholder,
      display: placeholder,
      padding: placeholder,
      margin: placeholder,
      fontSize: placeholder,
      fontWeight: placeholder,
      fontColor: placeholder,
      textAlign: placeholder,
      opacity: placeholder,
      width: placeholder,
      height: placeholder
    };
  }

  toText(value) {
    const text = (value || '').trim();
    if (!text) return { text: '--', isEmpty: true };
    return { text };
  }

  toMeasurement(px) {
    if (!Number.isFinite(px)) return { text: '--', isEmpty: true };
    const rounded = Math.round(px);
    return { text: `${rounded}px` };
  }

  toOpacity(value) {
    const numeric = parseFloat(value);
    if (!Number.isFinite(numeric)) return { text: '--', isEmpty: true };
    const percent = Math.round(numeric * 100);
    return { text: `${percent}%` };
  }

  toFontWeight(value) {
    const text = (value || '').trim();
    if (!text) return { text: '--', isEmpty: true };
    const numeric = parseInt(text, 10);
    const lookup = {
      100: 'Thin',
      200: 'ExtraLight',
      300: 'Light',
      400: 'Regular',
      500: 'Medium',
      600: 'SemiBold',
      700: 'Bold',
      800: 'ExtraBold',
      900: 'Black'
    };
    if (lookup[numeric]) {
      return { text: lookup[numeric] };
    }
    return { text };
  }

  toRadius(value) {
    const text = (value || '').trim();
    if (!text || text === '0px') return { text: '0', isEmpty: text === '' };
    return { text };
  }

  toBoxValues(style, name) {
    if (!style) return { text: '--', isEmpty: true };
    const parts = ['Top', 'Right', 'Bottom', 'Left'].map(side => {
      const raw = style.getPropertyValue(`${name}-${side.toLowerCase()}`);
      const numeric = parseFloat(raw);
      if (!Number.isFinite(numeric)) return 0;
      return Math.round(numeric);
    });

    const allEqual = parts.every(v => v === parts[0]);
    if (allEqual) {
      return { text: `${parts[0]}px` };
    }
    return { text: parts.map(v => `${v}px`).join(' ') };
  }

  toBorder(style) {
    if (!style) return { text: '--', isEmpty: true };
    const width = parseFloat(style.borderTopWidth);
    if (!width) return { text: 'None', isEmpty: false };
    const borderStyle = (style.borderTopStyle || '').trim();
    const color = this.toColor(style.borderTopColor);
    const colorText = color && color.text ? ` ${color.text}` : '';
    return { text: `${Math.round(width)}px ${borderStyle}${colorText}`, chip: color ? color.chip : undefined, isEmpty: false };
  }

  toBackgroundImage(value) {
    const text = (value || '').trim();
    if (!text || text === 'none') return { text: '无', isEmpty: false };
    const match = text.match(/url\(["']?(.*?)["']?\)/i);
    if (!match) return { text };
    const url = match[1];
    const decoded = url.split('/').pop() || url;
    const short = decoded.length > 24 ? decoded.slice(0, 21) + '…' : decoded;
    return { text: short };
  }

  toColor(value) {
    const text = (value || '').trim();
    if (!text || text === 'transparent') {
      return { text: '透明', chip: 'transparent', isEmpty: false };
    }

    if (text.startsWith('#')) {
      return { text: text.toUpperCase(), chip: text, isEmpty: false };
    }

    const match = text.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/i);
    if (!match) {
      return { text, chip: text, isEmpty: false };
    }

    const [r, g, b] = match.slice(1, 4).map(Number);
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
    if (alpha < 1) {
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();
      return { text: `${hex}${alphaHex}`, chip: `rgba(${r}, ${g}, ${b}, ${alpha})`, isEmpty: false };
    }
    return { text: hex, chip: `rgb(${r}, ${g}, ${b})`, isEmpty: false };
  }

  updateOverflowLayout() {
    if (!this.panel || !this.toolbar || !this.overflowWrapper) return;
    if (this.panel.style.display === 'none') return;

    this.closeOverflowMenu();

    const availableWidth = Math.max(window.innerWidth - 48, 320);
    const availableHeight = Math.max(window.innerHeight - 48, 200);
    const reference = this.overflowWrapper;
    this.overflowMenu.innerHTML = '';

    this.itemOrder.forEach(({ node }) => {
      if (node.parentNode !== this.toolbar) {
        this.toolbar.insertBefore(node, reference);
      }
      node.classList.remove('wve-overflow-item');
    });

    if (this.orientation === 'vertical') {
      this.overflowWrapper.style.display = 'flex';
      this.handleVerticalOverflow(availableHeight, reference);
      return;
    }

    this.overflowWrapper.style.display = 'flex';

    const findLastMovableIndex = () => {
      for (let index = this.itemOrder.length - 1; index >= 0; index--) {
        const item = this.itemOrder[index];
        if (item.meta.fixed) continue;
        if (item.node.parentNode === this.toolbar) {
          return index;
        }
      }
      return -1;
    };

    const moveIndexToOverflow = (index) => {
      if (index < 0) return;
      const item = this.itemOrder[index];
      if (item.node.parentNode === this.overflowMenu) return;
      if (this.overflowMenu.firstChild) {
        this.overflowMenu.insertBefore(item.node, this.overflowMenu.firstChild);
      } else {
        this.overflowMenu.appendChild(item.node);
      }
      item.node.classList.add('wve-overflow-item');
    };

    const cleanupTrailingDivider = () => {
      while (true) {
        let lastVisible = -1;
        for (let index = this.itemOrder.length - 1; index >= 0; index--) {
          const item = this.itemOrder[index];
          if (item.node.parentNode === this.toolbar && item.node !== this.overflowWrapper) {
            lastVisible = index;
            break;
          }
        }
        if (lastVisible === -1) break;
        const item = this.itemOrder[lastVisible];
        if (item.meta.type === 'divider') {
          moveIndexToOverflow(lastVisible);
        } else {
          break;
        }
      }
    };

    let safety = 0;
    const maxIterations = this.itemOrder.length * 2;

    while (this.panel.getBoundingClientRect().width > availableWidth && safety < maxIterations) {
      safety += 1;
      const index = findLastMovableIndex();
      if (index === -1) break;
      moveIndexToOverflow(index);
      cleanupTrailingDivider();
    }

    cleanupTrailingDivider();

    if (!this.overflowMenu.childElementCount) {
      this.overflowWrapper.style.display = 'none';
    }
  }

  handleVerticalOverflow(availableHeight, reference) {
    const findLastMovableIndex = () => {
      for (let index = this.itemOrder.length - 1; index >= 0; index--) {
        const item = this.itemOrder[index];
        if (item.meta.fixed) continue;
        if (item.node.parentNode === this.toolbar) {
          return index;
        }
      }
      return -1;
    };

    const moveIndexToOverflow = (index) => {
      if (index < 0) return;
      const item = this.itemOrder[index];
      if (item.node.parentNode === this.overflowMenu) return;
      if (this.overflowMenu.firstChild) {
        this.overflowMenu.insertBefore(item.node, this.overflowMenu.firstChild);
      } else {
        this.overflowMenu.appendChild(item.node);
      }
      item.node.classList.add('wve-overflow-item');
    };

    const cleanupTrailingDivider = () => {
      while (true) {
        let lastVisible = -1;
        for (let index = this.itemOrder.length - 1; index >= 0; index--) {
          const item = this.itemOrder[index];
          if (item.node.parentNode === this.toolbar && item.node !== this.overflowWrapper) {
            lastVisible = index;
            break;
          }
        }
        if (lastVisible === -1) break;
        const item = this.itemOrder[lastVisible];
        if (item.meta.type === 'divider') {
          moveIndexToOverflow(lastVisible);
        } else {
          break;
        }
      }
    };

    let safety = 0;
    const maxIterations = this.itemOrder.length * 2;

    while (this.panel.getBoundingClientRect().height > availableHeight && safety < maxIterations) {
      safety += 1;
      const index = findLastMovableIndex();
      if (index === -1) break;
      moveIndexToOverflow(index);
      cleanupTrailingDivider();
    }

    cleanupTrailingDivider();

    if (!this.overflowMenu.childElementCount) {
      this.overflowWrapper.style.display = 'none';
    }
  }

  closeOverflowMenu() {
    if (!this.overflowMenu) return;
    this.isOverflowOpen = false;
    this.overflowMenu.setAttribute('data-open', 'false');
    this.overflowButton?.setAttribute('aria-expanded', 'false');
  }
};
