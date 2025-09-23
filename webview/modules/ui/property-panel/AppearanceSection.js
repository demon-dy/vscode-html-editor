/**
 * 外观设置区域
 * 支持透明度设置、圆角设置（包括全部圆角和四个角度的单独设置）
 */
window.WVE = window.WVE || {};
window.WVE.AppearanceSection = class AppearanceSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '外观 Appearance',
      collapsed: false,
      className: 'appearance-section',
      icon: 'eye',
      actions: [
        {
          icon: 'eye', // 这个会被忽略，我们会自定义按钮内容
          title: '切换可见性',
          onClick: (e) => {
            // 阻止事件冒泡，避免触发面板折叠
            if (e) {
              e.stopPropagation();
              e.preventDefault();
            }
            this.toggleVisibility();
          }
        }
      ],
      ...options
    });

    this.currentElement = null;
    this.controls = {};
    this.showAdvancedRadius = false; // 是否显示四个角度的单独设置
    this.isVisible = true; // 当前元素是否可见
  }

  createElement() {
    const element = super.createElement();
    this.injectStyles();

    // 自定义可见性按钮，使用预创建的两个图标
    this.customizeVisibilityButton();

    return element;
  }

  customizeVisibilityButton() {
    // 等待DOM创建完成后再自定义按钮
    setTimeout(() => {
      const actionButtons = this.element?.querySelectorAll('.section-actions button');
      if (actionButtons && actionButtons.length > 0) {
        const visibilityButton = actionButtons[0]; // 第一个是可见性按钮

        // 清空原有内容
        visibilityButton.innerHTML = '';

        // 创建eye图标（可见状态）
        const eyeIcon = document.createElement('i');
        eyeIcon.className = 'wve-icon';
        eyeIcon.style.cssText = 'width: 8px; height: 8px;';
        eyeIcon.setAttribute('data-lucide', 'eye');

        // 创建eye-off图标（隐藏状态）
        const eyeOffIcon = document.createElement('i');
        eyeOffIcon.className = 'wve-icon';
        eyeOffIcon.style.cssText = 'width: 8px; height: 8px;';
        eyeOffIcon.setAttribute('data-lucide', 'eye-off');

        // 添加到按钮中
        visibilityButton.appendChild(eyeIcon);
        visibilityButton.appendChild(eyeOffIcon);

        // 保存图标引用
        this.eyeIcon = eyeIcon;
        this.eyeOffIcon = eyeOffIcon;

        // 使用 LucideIcons 渲染图标
        if (window.WVE?.LucideIcons?.replaceInRoot) {
          window.WVE.LucideIcons.replaceInRoot(visibilityButton);
        } else if (window.lucide) {
          window.lucide.createIcons();
        }

        // 在图标渲染后设置初始显示状态
        setTimeout(() => {
          this.setInitialIconState();
        }, 50);

        console.log('[AppearanceSection] Custom visibility button created');
      }
    }, 100);
  }

  setInitialIconState() {
    const actionButtons = this.element?.querySelectorAll('.section-actions button');
    if (!actionButtons || actionButtons.length === 0) {
      console.warn('[AppearanceSection] setInitialIconState: button not found');
      return;
    }

    const visibilityButton = actionButtons[0];
    const eyeIcon = visibilityButton.querySelector('[data-lucide="eye"]');
    const eyeOffIcon = visibilityButton.querySelector('[data-lucide="eye-off"]');

    if (!eyeIcon || !eyeOffIcon) {
      console.warn('[AppearanceSection] setInitialIconState: rendered icons not found');
      return;
    }

    console.log(`[AppearanceSection] Setting initial icon state, isVisible: ${this.isVisible}`);

    if (this.isVisible) {
      // 显示状态：显示eye图标，隐藏eye-off图标
      eyeIcon.style.display = 'inline-block';
      eyeOffIcon.style.display = 'none';
      console.log('[AppearanceSection] Set to visible state (eye icon shown)');
    } else {
      // 隐藏状态：隐藏eye图标，显示eye-off图标
      eyeIcon.style.display = 'none';
      eyeOffIcon.style.display = 'inline-block';
      console.log('[AppearanceSection] Set to hidden state (eye-off icon shown)');
    }
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 透明度和圆角设置在一行
    this.createOpacityAndRadiusRow(container);
  }

  createOpacityAndRadiusRow(container) {
    const section = document.createElement('div');
    section.className = 'mb-4';

    // 主控制行：透明度 | 圆角 | 更多
    const controlRow = document.createElement('div');
    controlRow.className = 'flex items-center gap-3';

    // 透明度控制
    this.createOpacityControl(controlRow);

    // 分隔线
    const separator1 = document.createElement('div');
    separator1.className = 'w-px h-6 bg-gray-600';
    controlRow.appendChild(separator1);

    // 圆角控制
    this.createCornerRadiusControl(controlRow);

    // 分隔线
    const separator2 = document.createElement('div');
    separator2.className = 'w-px h-6 bg-gray-600';
    controlRow.appendChild(separator2);

    // 更多按钮
    this.createMoreButton(controlRow);

    section.appendChild(controlRow);

    // 高级圆角设置面板
    const advancedPanel = document.createElement('div');
    advancedPanel.className = 'mt-2 p-2 bg-gray-800 border border-gray-600 rounded';
    advancedPanel.style.display = 'none';
    this.createAdvancedRadiusControls(advancedPanel);
    section.appendChild(advancedPanel);
    this.advancedPanel = advancedPanel;

    container.appendChild(section);
  }

  createOpacityControl(container) {
    const opacityGroup = document.createElement('div');
    opacityGroup.className = 'flex items-center gap-2 flex-1';

    // 透明度图标（可拖拽）
    const opacityIcon = document.createElement('i');
    opacityIcon.className = 'w-4 h-4 text-gray-400 cursor-ew-resize opacity-drag-icon';
    opacityIcon.setAttribute('data-lucide', 'droplets');
    opacityIcon.title = '拖拽调整透明度';

    // 透明度数值输入框
    const opacityInput = document.createElement('input');
    opacityInput.type = 'number';
    opacityInput.min = '0';
    opacityInput.max = '100';
    opacityInput.value = '100';
    opacityInput.className = 'w-12 h-6 px-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none text-center';
    opacityInput.placeholder = '100';

    opacityInput.addEventListener('input', (e) => {
      const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
      e.target.value = value;
      this.updateStyle('opacity', (value / 100).toString());
    });

    this.controls.opacity = opacityInput;

    opacityGroup.appendChild(opacityIcon);
    opacityGroup.appendChild(opacityInput);
    container.appendChild(opacityGroup);

    // 延迟添加拖拽功能，确保图标渲染完成
    setTimeout(() => {
      // 使用 LucideIcons 渲染图标
      if (window.WVE?.LucideIcons?.replaceInRoot) {
        window.WVE.LucideIcons.replaceInRoot(opacityGroup);
      } else if (window.lucide) {
        window.lucide.createIcons();
      }

      // 在图标渲染后，重新查找实际的图标元素并添加拖拽功能
      setTimeout(() => {
        // 查找渲染后的实际图标元素
        const renderedIcon = opacityGroup.querySelector('[data-lucide="droplets"], svg[data-lucide="droplets"], i[data-lucide="droplets"]');
        const actualIcon = renderedIcon || opacityIcon;

        console.log('[AppearanceSection] Found icon element:', actualIcon, 'tagName:', actualIcon.tagName);

        // 确保图标元素有正确的样式
        actualIcon.classList.add('opacity-drag-icon');
        actualIcon.style.cursor = 'ew-resize';
        actualIcon.title = '拖拽调整透明度';

        this.addOpacityDragListener(actualIcon, opacityInput);
        console.log('[AppearanceSection] Opacity drag listener added to actual icon');
      }, 100);
    }, 50);
  }

  createCornerRadiusControl(container) {
    const radiusGroup = document.createElement('div');
    radiusGroup.className = 'flex items-center gap-1 flex-1';

    // 圆角图标
    const radiusIcon = document.createElement('i');
    radiusIcon.className = 'w-4 h-4 text-gray-400';
    radiusIcon.setAttribute('data-lucide', 'square');

    // 圆角输入容器（使用 position-input-container 样式）
    const inputContainer = document.createElement('div');
    inputContainer.className = 'position-input-container flex-1';

    // 数值输入框
    const radiusInput = document.createElement('input');
    radiusInput.type = 'text';
    radiusInput.className = 'position-input';
    radiusInput.placeholder = '0';
    radiusInput.value = '0';

    // 单位选择器
    const unitSelect = document.createElement('select');
    unitSelect.className = 'position-unit-select';
    const units = ['px', '%', 'em', 'rem'];
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      if (unit === 'px') option.selected = true;
      unitSelect.appendChild(option);
    });

    radiusInput.addEventListener('input', (e) => {
      const value = e.target.value || '0';
      const unit = unitSelect.value;
      this.updateStyle('borderRadius', value + unit);

      // 如果在高级模式下，同步更新所有角度
      if (this.showAdvancedRadius) {
        this.syncAllRadiusInputs(value);
      }
    });

    unitSelect.addEventListener('change', (e) => {
      const value = radiusInput.value || '0';
      const unit = e.target.value;
      this.updateStyle('borderRadius', value + unit);
    });

    this.controls.borderRadius = radiusInput;
    this.controls.radiusUnit = unitSelect;

    inputContainer.appendChild(radiusInput);
    inputContainer.appendChild(unitSelect);
    radiusGroup.appendChild(radiusIcon);
    radiusGroup.appendChild(inputContainer);
    container.appendChild(radiusGroup);
  }

  createMoreButton(container) {
    const moreButton = document.createElement('button');
    moreButton.className = 'flex items-center justify-center w-6 h-6 bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 hover:bg-gray-600 transition-colors';
    moreButton.title = '更多圆角选项';

    const moreIcon = document.createElement('i');
    moreIcon.className = 'w-3 h-3';
    moreIcon.setAttribute('data-lucide', 'more-horizontal');
    moreButton.appendChild(moreIcon);

    moreButton.addEventListener('click', () => {
      this.toggleAdvancedRadius();
    });

    this.controls.expandButton = moreButton;
    container.appendChild(moreButton);
  }

  addOpacityDragListener(icon, input) {
    // 先移除可能存在的旧监听器
    if (icon._cleanupDragListener) {
      icon._cleanupDragListener();
    }

    let isDragging = false;
    let startX = 0;
    let startValue = 0;
    let moveHandler = null;
    let upHandler = null;

    const handleMouseDown = (e) => {
      console.log('[AppearanceSection] Mouse down on opacity icon', e.target);

      // 确保只响应左键点击
      if (e.button !== 0) return;

      // 阻止默认行为和事件冒泡
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      startX = e.clientX;
      startValue = parseInt(input.value) || 0;

      // 立即设置样式
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.mozUserSelect = 'none';
      document.body.style.msUserSelect = 'none';

      console.log('[AppearanceSection] Starting opacity drag, startValue:', startValue, 'startX:', startX);

      // 创建移动处理器
      moveHandler = (e) => {
        if (!isDragging) return;

        e.preventDefault();
        e.stopPropagation();

        const deltaX = e.clientX - startX;
        const sensitivity = 1; // 降低灵敏度
        const newValue = Math.max(0, Math.min(100, startValue + Math.round(deltaX / sensitivity)));

        if (newValue !== parseInt(input.value)) {
          input.value = newValue;
          this.updateStyle('opacity', (newValue / 100).toString());
          console.log('[AppearanceSection] Opacity drag to:', newValue, 'deltaX:', deltaX);
        }
      };

      // 创建释放处理器
      upHandler = (e) => {
        console.log('[AppearanceSection] Mouse up, isDragging:', isDragging);

        if (isDragging) {
          isDragging = false;

          // 恢复样式
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.body.style.webkitUserSelect = '';
          document.body.style.mozUserSelect = '';
          document.body.style.msUserSelect = '';

          // 移除监听器
          if (moveHandler) {
            document.removeEventListener('mousemove', moveHandler, true);
            window.removeEventListener('mousemove', moveHandler, true);
            moveHandler = null;
          }
          if (upHandler) {
            document.removeEventListener('mouseup', upHandler, true);
            window.removeEventListener('mouseup', upHandler, true);
            upHandler = null;
          }

          console.log('[AppearanceSection] Opacity drag ended');
        }
      };

      // 添加监听器到document和window，确保能捕获事件
      document.addEventListener('mousemove', moveHandler, true);
      document.addEventListener('mouseup', upHandler, true);
      window.addEventListener('mousemove', moveHandler, true);
      window.addEventListener('mouseup', upHandler, true);
    };

    // 添加测试点击监听器来验证元素是否可点击
    const testClickHandler = (e) => {
      console.log('[AppearanceSection] TEST: Icon clicked!', e.target);
    };
    icon.addEventListener('click', testClickHandler, true);

    // 添加mousedown监听器，使用捕获阶段
    icon.addEventListener('mousedown', handleMouseDown, true);

    // 添加拖拽开始时的视觉反馈
    const mouseEnterHandler = () => {
      icon.style.color = '#ffffff';
      console.log('[AppearanceSection] Mouse entered icon');
    };

    const mouseLeaveHandler = () => {
      if (!isDragging) {
        icon.style.color = '';
        console.log('[AppearanceSection] Mouse left icon');
      }
    };

    icon.addEventListener('mouseenter', mouseEnterHandler);
    icon.addEventListener('mouseleave', mouseLeaveHandler);

    // 清理函数
    icon._cleanupDragListener = () => {
      icon.removeEventListener('mousedown', handleMouseDown, true);
      icon.removeEventListener('click', testClickHandler, true);
      icon.removeEventListener('mouseenter', mouseEnterHandler);
      icon.removeEventListener('mouseleave', mouseLeaveHandler);

      // 清理可能残留的全局监听器
      if (moveHandler) {
        document.removeEventListener('mousemove', moveHandler, true);
        window.removeEventListener('mousemove', moveHandler, true);
      }
      if (upHandler) {
        document.removeEventListener('mouseup', upHandler, true);
        window.removeEventListener('mouseup', upHandler, true);
      }
    };

    console.log('[AppearanceSection] Opacity drag listener attached to:', icon, 'classList:', icon.classList.toString());
  }

  createAdvancedRadiusControls(container) {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-2';

    // 四个角度的配置
    const corners = [
      { key: 'topLeft', label: '左上', property: 'borderTopLeftRadius' },
      { key: 'topRight', label: '右上', property: 'borderTopRightRadius' },
      { key: 'bottomLeft', label: '左下', property: 'borderBottomLeftRadius' },
      { key: 'bottomRight', label: '右下', property: 'borderBottomRightRadius' }
    ];

    corners.forEach(corner => {
      const item = document.createElement('div');
      item.className = 'flex flex-col gap-1';

      const label = document.createElement('label');
      label.textContent = corner.label;
      label.className = 'text-xs text-gray-400 font-medium';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = '0';
      input.className = 'px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none';
      input.placeholder = '0';

      input.addEventListener('input', (e) => {
        const value = e.target.value || '0';
        this.updateStyle(corner.property, value + 'px');
      });

      this.controls[corner.key] = input;

      item.appendChild(label);
      item.appendChild(input);
      grid.appendChild(item);
    });

    container.appendChild(grid);
  }

  toggleAdvancedRadius() {
    this.showAdvancedRadius = !this.showAdvancedRadius;

    if (this.showAdvancedRadius) {
      this.advancedPanel.style.display = 'block';
      // 更新更多按钮图标
      const moreIcon = this.controls.expandButton.querySelector('i');
      if (moreIcon) {
        moreIcon.setAttribute('data-lucide', 'chevron-up');
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
      this.controls.expandButton.title = '收起圆角选项';

      // 同步当前值到所有角度
      const currentValue = this.controls.borderRadius.value || '0';
      this.syncAllRadiusInputs(currentValue);
    } else {
      this.advancedPanel.style.display = 'none';
      // 更新更多按钮图标
      const moreIcon = this.controls.expandButton.querySelector('i');
      if (moreIcon) {
        moreIcon.setAttribute('data-lucide', 'more-horizontal');
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
      this.controls.expandButton.title = '更多圆角选项';
    }
  }

  syncAllRadiusInputs(value) {
    if (this.controls.topLeft) this.controls.topLeft.value = value;
    if (this.controls.topRight) this.controls.topRight.value = value;
    if (this.controls.bottomLeft) this.controls.bottomLeft.value = value;
    if (this.controls.bottomRight) this.controls.bottomRight.value = value;
  }

  createControlGroup(title, parent) {
    const group = document.createElement('div');
    group.className = 'control-group';

    const header = document.createElement('div');
    header.className = 'control-group-header';

    const titleElement = document.createElement('h4');
    titleElement.className = 'control-group-title';
    titleElement.textContent = title;

    header.appendChild(titleElement);

    const content = document.createElement('div');
    content.className = 'control-group-content';

    group.appendChild(header);
    group.appendChild(content);
    parent.appendChild(group);

    return content;
  }

  updateStyle(property, value) {
    if (!this.currentElement) return;

    this.currentElement.style[property] = value;
    this.notifyChange(property, value);
  }

  updateFromElement(element) {
    if (!element) return;

    const style = window.getComputedStyle(element);

    // 更新可见性状态
    const currentVisibility = style.visibility;
    this.isVisible = currentVisibility !== 'hidden';

    console.log(`[AppearanceSection] Element visibility: ${currentVisibility}, isVisible: ${this.isVisible}`);

    // 延迟更新按钮，确保DOM已准备好
    setTimeout(() => {
      this.updateVisibilityButton();
    }, 50);

    // 更新透明度
    if (this.controls.opacity) {
      const opacity = parseFloat(style.opacity) || 1;
      this.controls.opacity.value = Math.round(opacity * 100);
    }

    // 更新圆角
    if (this.controls.borderRadius) {
      const borderRadius = parseInt(style.borderRadius) || 0;
      this.controls.borderRadius.value = borderRadius;
    }

    // 如果显示高级模式，更新各个角度
    if (this.showAdvancedRadius) {
      const corners = [
        { control: 'topLeft', property: 'borderTopLeftRadius' },
        { control: 'topRight', property: 'borderTopRightRadius' },
        { control: 'bottomLeft', property: 'borderBottomLeftRadius' },
        { control: 'bottomRight', property: 'borderBottomRightRadius' }
      ];

      corners.forEach(corner => {
        if (this.controls[corner.control]) {
          const value = parseInt(style[corner.property]) || 0;
          this.controls[corner.control].value = value;
        }
      });
    }
  }

  update(element) {
    super.update(element);
    this.currentElement = element;

    if (element) {
      this.updateFromElement(element);
    }
  }

  toggleVisibility() {
    if (!this.currentElement) {
      console.warn('[AppearanceSection] No current element to toggle visibility');
      return;
    }

    // 切换可见性状态
    this.isVisible = !this.isVisible;
    const visibility = this.isVisible ? 'visible' : 'hidden';

    console.log(`[AppearanceSection] Toggling visibility to: ${visibility}, isVisible: ${this.isVisible}`);

    // 应用样式
    this.updateStyle('visibility', visibility);

    // 延迟更新按钮图标，确保状态已切换
    setTimeout(() => {
      this.updateVisibilityButton();
    }, 10);
  }

  updateVisibilityButton() {
    const actionButtons = this.element?.querySelectorAll('.section-actions button');
    if (!actionButtons || actionButtons.length === 0) return;

    const visibilityButton = actionButtons[0];
    const eyeIcon = visibilityButton.querySelector('[data-lucide="eye"]');
    const eyeOffIcon = visibilityButton.querySelector('[data-lucide="eye-off"]');

    if (!eyeIcon || !eyeOffIcon) return;

    if (this.isVisible) {
      // 显示状态：显示eye图标，隐藏eye-off图标
      eyeIcon.style.display = 'inline-block';
      eyeOffIcon.style.display = 'none';
    } else {
      // 隐藏状态：隐藏eye图标，显示eye-off图标
      eyeIcon.style.display = 'none';
      eyeOffIcon.style.display = 'inline-block';
    }

    console.log(`[AppearanceSection] Updated visibility icon, isVisible: ${this.isVisible}`);

    // 更新按钮提示文本
    visibilityButton.title = this.isVisible ? '隐藏元素' : '显示元素';
  }

  notifyChange(property, value) {
    const event = new CustomEvent('wveStyleChange', {
      detail: {
        element: this.currentElement,
        property: property,
        value: value,
        source: 'AppearanceSection'
      }
    });
    document.dispatchEvent(event);
  }

  injectStyles() {
    // 在组件内部注入样式，而不是全局document.head
    if (this.element && this.element.querySelector('#appearance-section-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'appearance-section-styles';
    style.textContent = `
      .appearance-section .section-content {
        padding: 12px;
      }

      /* position-input-container 样式（用于圆角输入） */
      .position-input-container {
        display: flex;
        align-items: center;
        gap: 0;
        background: #1e1e1e;
        border: 1px solid #404040;
        border-radius: 3px;
        overflow: hidden;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      .position-input {
        height: 22px;
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 10px;
        padding: 2px 4px;
        outline: none;
        width: 45px;
        box-sizing: border-box;
        flex: 1;
      }

      .position-input::placeholder {
        color: #666666;
      }

      .position-unit-select {
        height: 22px;
        background: #2c2c2c;
        border: none;
        border-left: 1px solid #404040;
        color: #cccccc;
        font-size: 9px;
        padding: 0 2px;
        outline: none;
        cursor: pointer;
        flex-shrink: 0;
        min-width: 32px;
        box-sizing: border-box;
      }

      .position-unit-select:hover {
        background: #363636;
      }

      /* 透明度拖拽图标样式 */
      .opacity-drag-icon {
        cursor: ew-resize !important;
      }

      .opacity-drag-icon:hover {
        color: #ffffff !important;
      }
    `;

    if (this.element) {
      this.element.appendChild(style);
    } else {
      document.head.appendChild(style);
    }
  }
};