/**
 * 布局模式选择器 - 定位类型 + 布局方式分离设计
 * 顶部：定位类型选择（相对|绝对|固定|粘性）
 * 下方：布局方式选择（无布局|自动布局|网格布局）
 */
window.WVE = window.WVE || {};
window.WVE.LayoutModeSection = class LayoutModeSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '布局设置 Layout Settings',
      collapsed: false,
      className: 'layout-mode-section',
      ...options
    });

    this.currentElement = null;
    this.currentPosition = 'static'; // static, relative, absolute, fixed, sticky
    this.currentLayout = 'none'; // none, flex, grid

    // 初始化 LayoutAdapter
    this.layoutAdapter = new window.WVE.LayoutAdapter();

    // 定位类型定义
    this.positionTypes = {
      static: {
        name: '静态',
        icon: 'file-text',
        description: '默认定位，跟随文档流'
      },
      relative: {
        name: '相对',
        icon: 'move-3d',
        description: '相对于自身位置定位'
      },
      absolute: {
        name: '绝对',
        icon: 'move',
        description: '相对于最近定位祖先元素定位'
      },
      fixed: {
        name: '固定',
        icon: 'pin',
        description: '相对于视口固定定位'
      },
      sticky: {
        name: '粘性',
        icon: 'sticky-note',
        description: '粘性定位，结合相对和固定'
      }
    };

    // 布局方式定义
    this.layoutTypes = {
      none: {
        name: '无布局',
        icon: 'file-text',
        description: '默认文档流，block/inline元素'
      },
      flex: {
        name: '自动布局',
        icon: 'split-square-horizontal',
        description: '现代响应式设计 (Flexbox)'
      },
      grid: {
        name: '网格布局',
        icon: 'grid-3x3',
        description: '复杂的二维布局 (Grid)'
      }
    };

    this.onPositionChange = null; // 定位变更回调
    this.onLayoutChange = null; // 布局变更回调

    // 选择状态保护相关
    this.preservedSelection = null; // 保存的选择状态
    this.restoreAttemptTimers = []; // 恢复尝试的定时器数组
    this.selectionRestoreListener = null; // 选择恢复监听器
    this.domObserver = null; // DOM变化观察器
    this.continuousMonitorInterval = null; // 持续监控间隔器
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 创建定位类型选择器
    this.createPositionSelector(container);

    // 创建分隔线
    this.createDivider(container);

    // 创建布局方式选择器
    this.createLayoutSelector(container);

    // 创建当前设置说明
    this.createSettingsDescription(container);

    // 应用样式
    this.injectStyles();

    // 初始化 Lucide 图标
    setTimeout(() => this.initializeLucideIcons(container), 0);
  }

  createPositionSelector(container) {
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'position-selector-container';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '定位类型 Position';

    // 定位类型按钮组
    const positionsContainer = document.createElement('div');
    positionsContainer.className = 'flex bg-[#2c2c2c] rounded gap-1 p-1 border border-[#3d3d3d] mb-2';

    Object.entries(this.positionTypes).forEach(([key, position]) => {
      const button = this.createPositionButton(key, position);
      positionsContainer.appendChild(button);
    });

    sectionContainer.appendChild(title);
    sectionContainer.appendChild(positionsContainer);
    container.appendChild(sectionContainer);
  }

  createLayoutSelector(container) {
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'layout-selector-container';

    // 标题
    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = '布局方式 Layout';

    // 布局方式按钮组
    const layoutsContainer = document.createElement('div');
    layoutsContainer.className = 'flex bg-[#2c2c2c] rounded gap-1 p-1 border border-[#3d3d3d] mb-2';

    Object.entries(this.layoutTypes).forEach(([key, layout]) => {
      const button = this.createLayoutButton(key, layout);
      layoutsContainer.appendChild(button);
    });

    sectionContainer.appendChild(title);
    sectionContainer.appendChild(layoutsContainer);
    container.appendChild(sectionContainer);
  }

  createDivider(container) {
    const divider = document.createElement('div');
    divider.className = 'divider';
    container.appendChild(divider);
  }

  createPositionButton(positionKey, position) {
    const button = document.createElement('div');
    button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
    button.dataset.position = positionKey;
    button.title = `${position.name} - ${position.description}`;

    // 图标 - 使用 Lucide 图标
    const icon = document.createElement('i');
    icon.className = 'w-4 h-4';
    icon.setAttribute('data-lucide', position.icon);

    button.appendChild(icon);

    // 点击事件
    button.addEventListener('click', () => {
      this.selectPosition(positionKey);
    });

    return button;
  }

  createLayoutButton(layoutKey, layout) {
    const button = document.createElement('div');
    button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
    button.dataset.layout = layoutKey;
    button.title = `${layout.name} - ${layout.description}`;

    // 图标 - 使用 Lucide 图标
    const icon = document.createElement('i');
    icon.className = 'w-4 h-4';
    icon.setAttribute('data-lucide', layout.icon);

    button.appendChild(icon);

    // 点击事件
    button.addEventListener('click', () => {
      this.selectLayout(layoutKey);
    });

    return button;
  }

  createSettingsDescription(container) {
    const descContainer = document.createElement('div');
    descContainer.className = 'settings-description-container';

    // 当前选择说明
    this.currentSettingsDesc = document.createElement('div');
    this.currentSettingsDesc.className = 'current-settings-desc';
    this.updateSettingsDescription();

    descContainer.appendChild(this.currentSettingsDesc);
    container.appendChild(descContainer);
  }

  updateSettingsDescription() {
    if (!this.currentSettingsDesc) {
      return;
    }

    const position = this.positionTypes[this.currentPosition];
    const layout = this.layoutTypes[this.currentLayout];

    if (position && layout) {
      this.currentSettingsDesc.innerHTML = `
        <div class="settings-desc-row">
          <span class="settings-desc-label">定位:</span>
          <span class="settings-desc-value">${position.name}</span>
        </div>
        <div class="settings-desc-row">
          <span class="settings-desc-label">布局:</span>
          <span class="settings-desc-value">${layout.name}</span>
        </div>
        <div class="settings-desc-row" style="margin-top: 8px;">
          <button class="manual-restore-btn" style="font-size: 10px; padding: 2px 6px; background: #404040; color: #ccc; border: 1px solid #555; border-radius: 3px; cursor: pointer;">
            恢复选择
          </button>
        </div>
      `;

      // 添加手动恢复按钮事件
      const manualRestoreBtn = this.currentSettingsDesc.querySelector('.manual-restore-btn');
      if (manualRestoreBtn) {
        manualRestoreBtn.addEventListener('click', () => {
          console.log(`[LayoutModeSection] Manual restore button clicked`);
          this.manualRestoreSelection();
        });
      }
    }
  }

  /**
   * 手动恢复选择状态
   */
  manualRestoreSelection() {
    console.log(`[LayoutModeSection] Manual restore triggered`);

    const app = window.WVE?.app?.();
    if (!app || !app.selectionManager) {
      console.error(`[LayoutModeSection] Cannot manual restore - app or selectionManager not available`);
      return;
    }

    // 如果有保存的选择状态，尝试恢复
    if (this.preservedSelection) {
      console.log(`[LayoutModeSection] Using preserved selection for manual restore`);
      this.restoreSelectionState(this.preservedSelection, app.selectionManager);
    } else {
      // 如果没有保存的状态，尝试重新选择当前元素
      console.log(`[LayoutModeSection] No preserved selection, trying to restore current element`);
      if (this.currentElement) {
        console.log(`[LayoutModeSection] Manually restoring current element:`, this.currentElement);
        app.selectionManager.select(this.currentElement, true);
      } else {
        console.warn(`[LayoutModeSection] No current element to restore`);
      }
    }
  }

  /**
   * 选择定位类型
   */
  selectPosition(positionKey) {
    if (this.currentPosition === positionKey) {
      return;
    }

    const prevPosition = this.currentPosition;
    this.currentPosition = positionKey;

    console.log(`[LayoutModeSection] Switching position from ${prevPosition} to ${positionKey}`);

    // 更新UI状态
    this.updatePositionButtons();
    this.updateSettingsDescription();

    // 应用定位类型到当前元素
    if (this.currentElement) {
      console.log(`[LayoutModeSection] Applying ${positionKey} position to element`);
      this.applyPositionToElement(positionKey, prevPosition);
    }

    // 触发定位变更事件
    if (this.onPositionChange) {
      this.onPositionChange(positionKey, prevPosition, this.currentElement);
    }

    // 通知外部系统
    this.dispatchPositionChangeEvent(positionKey, prevPosition);
  }

  /**
   * 选择布局方式
   */
  selectLayout(layoutKey) {
    if (this.currentLayout === layoutKey) {
      return;
    }

    const prevLayout = this.currentLayout;
    this.currentLayout = layoutKey;

    console.log(`[LayoutModeSection] Switching layout from ${prevLayout} to ${layoutKey}`);

    // 更新UI状态
    this.updateLayoutButtons();
    this.updateSettingsDescription();

    // 应用布局方式到当前元素
    if (this.currentElement) {
      console.log(`[LayoutModeSection] Applying ${layoutKey} layout to element`);
      this.applyLayoutToElement(layoutKey, prevLayout);
    }

    // 触发布局变更事件
    if (this.onLayoutChange) {
      this.onLayoutChange(layoutKey, prevLayout, this.currentElement);
    }

    // 通知外部系统
    this.dispatchLayoutChangeEvent(layoutKey, prevLayout);
  }

  updatePositionButtons() {
    const buttons = this.element.querySelectorAll('[data-position]');
    buttons.forEach(button => {
      if (button.dataset.position === this.currentPosition) {
        // 激活状态 - 使用白色背景，黑色图标
        button.className = 'flex items-center justify-center w-8 h-8 rounded bg-white text-black cursor-pointer';
      } else {
        // 非激活状态
        button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
      }
    });
  }

  updateLayoutButtons() {
    const buttons = this.element.querySelectorAll('[data-layout]');
    buttons.forEach(button => {
      if (button.dataset.layout === this.currentLayout) {
        // 激活状态 - 使用白色背景，黑色图标
        button.className = 'flex items-center justify-center w-8 h-8 rounded bg-white text-black cursor-pointer';
      } else {
        // 非激活状态
        button.className = 'flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-all duration-200 cursor-pointer';
      }
    });
  }

  /**
   * 将定位类型应用到元素
   */
  applyPositionToElement(newPosition, prevPosition) {
    if (!this.currentElement) {
      return;
    }

    const element = this.currentElement;

    // 清除前一个定位类型的样式
    this.clearPositionStyles(element, prevPosition);

    // 应用新定位类型的样式
    let appliedClasses = [];
    if (newPosition !== 'static') {
      appliedClasses = [newPosition];
      this.layoutAdapter.applyClasses(element, appliedClasses);
    }

    // 获取应用后的完整class属性值
    const finalClasses = element.className;

    // 同步到 HTML 文件
    this.syncToHTMLFile(element, finalClasses, 'position');

    console.log(`[LayoutModeSection] Position ${newPosition} applied`);
  }

  /**
   * 将布局方式应用到元素
   */
  applyLayoutToElement(newLayout, prevLayout) {
    if (!this.currentElement) {
      return;
    }

    const element = this.currentElement;

    // 清除前一个布局方式的样式
    this.clearLayoutStyles(element, prevLayout);

    // 应用新布局方式的样式
    let appliedClasses = [];
    switch (newLayout) {
      case 'none':
        appliedClasses = ['block'];
        break;
      case 'flex':
        appliedClasses = ['flex'];
        break;
      case 'grid':
        appliedClasses = ['grid'];
        break;
    }

    if (appliedClasses.length > 0) {
      this.layoutAdapter.applyClasses(element, appliedClasses);
    }

    // 获取应用后的完整class属性值
    const finalClasses = element.className;

    // 同步到 HTML 文件
    this.syncToHTMLFile(element, finalClasses, 'layout');

    console.log(`[LayoutModeSection] Layout ${newLayout} applied`);
  }

  clearPositionStyles(element, position) {
    console.log(`[LayoutModeSection] Clearing ${position} position styles from element:`, element);

    // 移除所有定位相关的类名
    const positionClasses = ['static', 'relative', 'absolute', 'fixed', 'sticky'];
    positionClasses.forEach(className => {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    });

    console.log(`[LayoutModeSection] Cleared ${position} position styles`);
  }

  clearLayoutStyles(element, layout) {
    console.log(`[LayoutModeSection] Clearing ${layout} layout styles from element:`, element);

    // 移除所有布局相关的类名
    const layoutClasses = ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid'];
    layoutClasses.forEach(className => {
      if (element.classList.contains(className)) {
        element.classList.remove(className);
      }
    });

    console.log(`[LayoutModeSection] Cleared ${layout} layout styles`);
  }

  /**
   * 从元素检测当前定位类型
   */
  detectPositionFromElement(element) {
    if (!element) {
      return 'static';
    }

    // 首先检查 Tailwind 类名
    const classList = Array.from(element.classList);

    // 检测定位类名
    for (const cls of classList) {
      if (['static', 'relative', 'absolute', 'fixed', 'sticky'].includes(cls)) {
        return cls;
      }
    }

    // 回退到计算样式检测
    const style = window.getComputedStyle(element);
    return style.position || 'static';
  }

  /**
   * 从元素检测当前布局方式
   */
  detectLayoutFromElement(element) {
    if (!element) {
      return 'none';
    }

    // 首先检查 Tailwind 类名
    const classList = Array.from(element.classList);

    // 检测 flex 类名
    if (classList.some(cls => ['flex', 'inline-flex'].includes(cls))) {
      return 'flex';
    }

    // 检测 grid 类名
    if (classList.some(cls => ['grid', 'inline-grid'].includes(cls))) {
      return 'grid';
    }

    // 回退到计算样式检测
    const style = window.getComputedStyle(element);

    if (style.display === 'flex' || style.display === 'inline-flex') {
      return 'flex';
    }

    if (style.display === 'grid' || style.display === 'inline-grid') {
      return 'grid';
    }

    return 'none';
  }

  /**
   * 更新组件以匹配当前元素
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    console.log(`[LayoutModeSection] Update called with element:`, element);

    if (element) {
      // 检测元素的当前定位类型和布局方式
      const detectedPosition = this.detectPositionFromElement(element);
      const detectedLayout = this.detectLayoutFromElement(element);

      console.log(`[LayoutModeSection] Detected position: ${detectedPosition}, layout: ${detectedLayout}`);

      let updated = false;

      // 更新定位类型
      if (detectedPosition !== this.currentPosition) {
        this.currentPosition = detectedPosition;
        this.updatePositionButtons();
        updated = true;
      }

      // 更新布局方式
      if (detectedLayout !== this.currentLayout) {
        this.currentLayout = detectedLayout;
        this.updateLayoutButtons();
        updated = true;
      }

      if (updated) {
        this.updateSettingsDescription();
      }
    } else {
      console.log(`[LayoutModeSection] No element provided to update`);
    }
  }

  /**
   * 同步变更到 HTML 文件
   */
  syncToHTMLFile(element, finalClasses, changeType) {
    console.log(`[LayoutModeSection] Syncing ${changeType} change to HTML file`);
    console.log(`[LayoutModeSection] Element:`, element);
    console.log(`[LayoutModeSection] Final classes:`, finalClasses);

    try {
      // 保存当前选中状态，避免同步后丢失选择
      this.preserveSelectionState();

      // 构造 Tailwind 样式变更数据
      const changeData = {
        changes: [{
          element: {
            tagName: element.tagName.toLowerCase(),
            id: element.id || null,
            className: element.className,
            wveId: element.dataset.wveId || null,
            strategies: this.generateSelectorStrategies(element)
          },
          tailwindClasses: finalClasses,
          cssStyles: null // 只使用 Tailwind 类名，不使用内联样式
        }]
      };

      console.log(`[LayoutModeSection] Sending tailwindStyleChange message:`, changeData);

      // 发送到扩展进行同步
      if (typeof vscode !== 'undefined' && vscode.postMessage) {
        vscode.postMessage({
          type: 'tailwindStyleChange',
          data: changeData
        });
        console.log(`[LayoutModeSection] Message sent successfully`);

        // 检查是否启用了自动刷新模式，如果是则触发事件
        const app = window.WVE?.app?.();
        const floatingToolbar = app?.getFloatingToolbar?.();
        if (floatingToolbar && floatingToolbar.autoRefreshState === 'auto') {
          document.dispatchEvent(new CustomEvent('wve:styleChange', {
            detail: {
              type: 'tailwindStyleChange',
              data: changeData
            }
          }));
          console.log(`[LayoutModeSection] Auto refresh event dispatched (auto mode enabled)`);
        } else {
          console.log(`[LayoutModeSection] Auto refresh skipped (manual mode or toolbar unavailable)`);
        }
      } else {
        console.error(`[LayoutModeSection] vscode.postMessage not available`);
      }
    } catch (error) {
      console.error(`[LayoutModeSection] Error syncing to HTML file:`, error);
    }
  }

  /**
   * 保存当前选中状态，以便在同步后恢复
   */
  preserveSelectionState() {
    console.log(`[LayoutModeSection] ===== PRESERVE SELECTION STATE START =====`);

    // 清除之前的恢复定时器，避免多次并发恢复
    if (this.restoreSelectionTimer) {
      clearTimeout(this.restoreSelectionTimer);
      this.restoreSelectionTimer = null;
    }

    const selectedElements = document.querySelectorAll('[wve-selected]');
    console.log(`[LayoutModeSection] Found ${selectedElements.length} selected elements:`, Array.from(selectedElements));

    if (selectedElements.length > 0) {
      // 获取 WebVisualEditor 实例
      const app = window.WVE?.app?.();
      console.log(`[LayoutModeSection] WebVisualEditor app available:`, !!app);
      console.log(`[LayoutModeSection] SelectionManager available:`, !!(app && app.selectionManager));

      if (app && app.selectionManager) {
        // 保存选中的元素信息，添加更多调试信息
        this.preservedSelection = Array.from(selectedElements).map((el, index) => {
          const elementInfo = {
            wveId: el.dataset.wveId,
            wveCodeStart: el.dataset.wveCodeStart,
            wveCodeEnd: el.dataset.wveCodeEnd,
            selector: this.generateElementSelector(el),
            element: el,
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            innerHTML: el.innerHTML.substring(0, 100) + '...'
          };

          console.log(`[LayoutModeSection] Preserving element ${index + 1}:`, {
            wveId: elementInfo.wveId,
            wveCodeStart: elementInfo.wveCodeStart,
            wveCodeEnd: elementInfo.wveCodeEnd,
            selector: elementInfo.selector,
            tagName: elementInfo.tagName,
            className: elementInfo.className,
            id: elementInfo.id
          });

          return elementInfo;
        });

        console.log(`[LayoutModeSection] Successfully preserved ${this.preservedSelection.length} elements`);

        // 【关键】：将选择状态保存到 sessionStorage，确保 WebView 重新加载后能恢复
        this.saveSelectionToStorage(this.preservedSelection);

        // 【测试】：立即测试 sessionStorage 是否可用
        this.testSessionStorage();

        // 设置多重恢复机制，确保选择状态能够被恢复
        this.setupMultipleRestoreAttempts(app.selectionManager);
      } else {
        console.error(`[LayoutModeSection] Cannot preserve selection - app or selectionManager not available`);
      }
    } else {
      console.warn(`[LayoutModeSection] No selected elements found to preserve`);
    }

    console.log(`[LayoutModeSection] ===== PRESERVE SELECTION STATE END =====`);
  }

  /**
   * 将选择状态保存到 sessionStorage
   */
  saveSelectionToStorage(preservedSelection) {
    console.log(`[LayoutModeSection] ===== SAVING SELECTION TO STORAGE =====`);

    try {
      const storageKey = 'wve-preserved-selection';
      const dataToSave = {
        timestamp: Date.now(),
        selections: preservedSelection.map(sel => ({
          wveId: sel.wveId,
          wveCodeStart: sel.wveCodeStart,
          wveCodeEnd: sel.wveCodeEnd,
          selector: sel.selector,
          tagName: sel.tagName,
          className: sel.className,
          id: sel.id
        }))
      };

      console.log(`[LayoutModeSection] Data to save:`, dataToSave);
      console.log(`[LayoutModeSection] SessionStorage available:`, typeof sessionStorage !== 'undefined');
      console.log(`[LayoutModeSection] SessionStorage before save - length:`, sessionStorage.length);

      sessionStorage.setItem(storageKey, JSON.stringify(dataToSave));

      // 验证保存是否成功
      const verifyData = sessionStorage.getItem(storageKey);
      console.log(`[LayoutModeSection] Verification - data saved successfully:`, verifyData !== null);
      console.log(`[LayoutModeSection] SessionStorage after save - length:`, sessionStorage.length);

      if (verifyData) {
        console.log(`[LayoutModeSection] ✅ Selection state saved successfully to sessionStorage`);
      } else {
        console.error(`[LayoutModeSection] ❌ Failed to save selection state - verification failed`);
      }
    } catch (error) {
      console.error(`[LayoutModeSection] ❌ Failed to save selection to storage:`, error);
    }

    console.log(`[LayoutModeSection] ===== SAVING SELECTION TO STORAGE END =====`);
  }

  /**
   * 从 sessionStorage 恢复选择状态
   */
  loadSelectionFromStorage() {
    try {
      const storageKey = 'wve-preserved-selection';
      const savedData = sessionStorage.getItem(storageKey);

      if (!savedData) {
        console.log(`[LayoutModeSection] No saved selection found in storage`);
        return null;
      }

      const parsedData = JSON.parse(savedData);
      const ageMs = Date.now() - parsedData.timestamp;

      // 如果保存的数据超过10秒，认为过期
      if (ageMs > 10000) {
        console.log(`[LayoutModeSection] Saved selection is too old (${ageMs}ms), ignoring`);
        sessionStorage.removeItem(storageKey);
        return null;
      }

      console.log(`[LayoutModeSection] Loaded selection from storage:`, parsedData);
      return parsedData.selections;
    } catch (error) {
      console.error(`[LayoutModeSection] Failed to load selection from storage:`, error);
      return null;
    }
  }

  /**
   * 清除存储的选择状态
   */
  clearStoredSelection() {
    try {
      const storageKey = 'wve-preserved-selection';
      sessionStorage.removeItem(storageKey);
      console.log(`[LayoutModeSection] Cleared stored selection`);
    } catch (error) {
      console.error(`[LayoutModeSection] Failed to clear stored selection:`, error);
    }
  }

  /**
   * 测试 sessionStorage 是否在WebView中正常工作
   */
  testSessionStorage() {
    console.log(`[LayoutModeSection] ===== TESTING SESSION STORAGE =====`);

    try {
      const testKey = 'wve-test-storage';
      const testData = { timestamp: Date.now(), test: 'sessionStorage功能测试' };

      // 测试写入
      sessionStorage.setItem(testKey, JSON.stringify(testData));
      console.log(`[LayoutModeSection] ✅ SessionStorage write test passed`);

      // 测试读取
      const retrievedData = sessionStorage.getItem(testKey);
      if (retrievedData) {
        const parsedData = JSON.parse(retrievedData);
        console.log(`[LayoutModeSection] ✅ SessionStorage read test passed:`, parsedData);
      } else {
        console.error(`[LayoutModeSection] ❌ SessionStorage read test failed`);
      }

      // 清理测试数据
      sessionStorage.removeItem(testKey);
      console.log(`[LayoutModeSection] ✅ SessionStorage cleanup completed`);

      // 报告 sessionStorage 状态
      console.log(`[LayoutModeSection] SessionStorage status:`, {
        available: typeof sessionStorage !== 'undefined',
        length: sessionStorage.length,
        keys: Object.keys(sessionStorage)
      });

    } catch (error) {
      console.error(`[LayoutModeSection] ❌ SessionStorage test failed:`, error);
    }

    console.log(`[LayoutModeSection] ===== SESSION STORAGE TEST END =====`);
  }

  /**
   * 设置多重恢复尝试机制，确保选择状态能够被恢复
   */
  setupMultipleRestoreAttempts(selectionManager) {
    console.log(`[LayoutModeSection] Setting up multiple restore attempts`);

    // 清理之前的恢复尝试
    this.clearRestoreAttempts();

    // 方案1: 短期多次尝试 - 在同步后立即开始尝试恢复
    const shortTermAttempts = [200, 500, 800, 1200, 1800]; // 5次尝试，递增延迟
    shortTermAttempts.forEach((delay, index) => {
      const timer = setTimeout(() => {
        if (this.preservedSelection && this.attemptRestore(selectionManager, `short-term-${index + 1}`)) {
          this.clearRestoreAttempts(); // 恢复成功后清理所有其他尝试
        }
      }, delay);
      this.restoreAttemptTimers.push(timer);
    });

    // 方案2: 监听DOM变化，当检测到元素重新出现时立即恢复
    this.setupDOMChangeListener(selectionManager);

    // 方案3: 监听WebView消息，当接收到特定消息时恢复
    this.setupMessageListener(selectionManager);

    // 方案4: 长期保护 - 如果前面的方案都失败，继续尝试
    const longTermTimer = setTimeout(() => {
      if (this.preservedSelection) {
        console.log(`[LayoutModeSection] Long-term restore attempt`);
        this.attemptRestore(selectionManager, 'long-term');
        this.clearRestoreAttempts();
      }
    }, 3000);
    this.restoreAttemptTimers.push(longTermTimer);

    // 方案5: 持续监控 - 定期检查选择状态，如果丢失则恢复
    this.setupContinuousMonitoring(selectionManager);
  }

  /**
   * 尝试恢复选择状态
   */
  attemptRestore(selectionManager, attemptName) {
    if (!this.preservedSelection || !selectionManager) {
      return false;
    }

    console.log(`[LayoutModeSection] Attempting restore: ${attemptName}`);

    // 检查目标元素是否已经存在
    let foundElements = 0;
    for (const preserved of this.preservedSelection) {
      let targetElement = null;

      if (preserved.wveId) {
        targetElement = document.querySelector(`[data-wve-id="${preserved.wveId}"]`);
      }

      if (!targetElement && preserved.selector) {
        try {
          targetElement = document.querySelector(preserved.selector);
        } catch (e) {
          // 忽略选择器错误
        }
      }

      if (targetElement) {
        foundElements++;
      }
    }

    console.log(`[LayoutModeSection] ${attemptName}: Found ${foundElements}/${this.preservedSelection.length} elements`);

    // 如果找到所有元素，执行恢复
    if (foundElements === this.preservedSelection.length) {
      this.restoreSelectionState(this.preservedSelection, selectionManager);
      return true;
    }

    return false;
  }

  /**
   * 设置DOM变化监听器
   */
  setupDOMChangeListener(selectionManager) {
    if (this.domObserver) {
      this.domObserver.disconnect();
    }

    this.domObserver = new MutationObserver((mutations) => {
      if (!this.preservedSelection) {
        return;
      }

      // 检查是否有新元素添加
      let hasNewElements = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          hasNewElements = true;
        }
      });

      if (hasNewElements) {
        console.log(`[LayoutModeSection] DOM changed, attempting restore`);
        setTimeout(() => {
          if (this.attemptRestore(selectionManager, 'dom-change')) {
            this.clearRestoreAttempts();
          }
        }, 100);
      }
    });

    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 设置消息监听器
   */
  setupMessageListener(selectionManager) {
    if (this.selectionRestoreListener) {
      window.removeEventListener('message', this.selectionRestoreListener);
    }

    this.selectionRestoreListener = (event) => {
      if (!this.preservedSelection) {
        return;
      }

      // 监听各种可能的消息类型
      const messageTypes = ['webviewReloaded', 'contentUpdated', 'documentChanged'];

      if (event.data && messageTypes.includes(event.data.type)) {
        console.log(`[LayoutModeSection] Received ${event.data.type} message, attempting restore`);

        setTimeout(() => {
          if (this.attemptRestore(selectionManager, `message-${event.data.type}`)) {
            this.clearRestoreAttempts();
          }
        }, 150);
      }
    };

    window.addEventListener('message', this.selectionRestoreListener);
  }

  /**
   * 设置持续监控，定期检查选择状态
   */
  setupContinuousMonitoring(selectionManager) {
    // 清理之前的监控
    if (this.continuousMonitorInterval) {
      clearInterval(this.continuousMonitorInterval);
    }

    console.log(`[LayoutModeSection] Setting up continuous monitoring`);

    this.continuousMonitorInterval = setInterval(() => {
      if (!this.preservedSelection) {
        return; // 没有需要恢复的选择
      }

      // 检查当前是否有选中的元素
      const currentSelected = document.querySelectorAll('[wve-selected]');
      const selectionManagerSelected = selectionManager.getSelected();

      console.log(`[LayoutModeSection] Monitoring check: DOM=${currentSelected.length}, Manager=${selectionManagerSelected.size} selected`);

      // 如果没有选中的元素，尝试恢复
      if (currentSelected.length === 0 && selectionManagerSelected.size === 0) {
        console.log(`[LayoutModeSection] Continuous monitoring detected selection loss, attempting restore`);
        if (this.attemptRestore(selectionManager, 'continuous-monitor')) {
          // 恢复成功，清理监控
          this.clearRestoreAttempts();
        }
      }
    }, 1000); // 每秒检查一次
  }

  /**
   * 清理所有恢复尝试
   */
  clearRestoreAttempts() {
    // 清理定时器
    if (this.restoreAttemptTimers) {
      this.restoreAttemptTimers.forEach(timer => clearTimeout(timer));
      this.restoreAttemptTimers = [];
    }

    // 清理DOM观察器
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }

    // 清理消息监听器
    if (this.selectionRestoreListener) {
      window.removeEventListener('message', this.selectionRestoreListener);
      this.selectionRestoreListener = null;
    }

    // 清理持续监控
    if (this.continuousMonitorInterval) {
      clearInterval(this.continuousMonitorInterval);
      this.continuousMonitorInterval = null;
    }

    // 清理保存的选择状态
    this.preservedSelection = null;

    // 注意：不在这里清除 sessionStorage，让 WebView 重新加载后的恢复机制来处理

    console.log(`[LayoutModeSection] Cleared all restore attempts and monitoring`);
  }

  /**
   * 恢复选中状态
   */
  restoreSelectionState(preservedSelection, selectionManager) {
    console.log(`[LayoutModeSection] ===== RESTORE SELECTION STATE START =====`);

    if (!preservedSelection || !selectionManager) {
      console.warn(`[LayoutModeSection] Cannot restore selection - missing data or manager`, {
        preservedSelection: !!preservedSelection,
        selectionManager: !!selectionManager
      });
      return;
    }

    console.log(`[LayoutModeSection] Attempting to restore ${preservedSelection.length} elements`);
    console.log(`[LayoutModeSection] Current DOM state check...`);

    // 检查当前DOM中的元素状态
    const allElementsWithWveId = document.querySelectorAll('[data-wve-id]');
    console.log(`[LayoutModeSection] Current DOM has ${allElementsWithWveId.length} elements with wve-id`);

    const currentSelectedElements = document.querySelectorAll('[wve-selected]');
    console.log(`[LayoutModeSection] Current DOM has ${currentSelectedElements.length} selected elements`);

    // 先清除现有选择，确保干净的状态
    selectionManager.clearSelection();
    console.log(`[LayoutModeSection] Cleared existing selection`);

    let restoredCount = 0;

    preservedSelection.forEach((preserved, index) => {
      console.log(`[LayoutModeSection] Restoring element ${index + 1}/${preservedSelection.length}:`);
      console.log(`[LayoutModeSection]   - wveId: ${preserved.wveId}`);
      console.log(`[LayoutModeSection]   - selector: ${preserved.selector}`);
      console.log(`[LayoutModeSection]   - tagName: ${preserved.tagName}`);

      let targetElement = null;

      // 尝试通过 wveId 查找
      if (preserved.wveId) {
        targetElement = document.querySelector(`[data-wve-id="${preserved.wveId}"]`);
        console.log(`[LayoutModeSection]   - Search by wveId "${preserved.wveId}":`, targetElement ? 'FOUND' : 'NOT FOUND');
        if (targetElement) {
          console.log(`[LayoutModeSection]     Found element:`, {
            tagName: targetElement.tagName,
            className: targetElement.className,
            id: targetElement.id,
            hasWveSelected: targetElement.hasAttribute('wve-selected')
          });
        }
      }

      // 如果通过 wveId 找不到，尝试使用选择器
      if (!targetElement && preserved.selector) {
        try {
          targetElement = document.querySelector(preserved.selector);
          console.log(`[LayoutModeSection]   - Search by selector "${preserved.selector}":`, targetElement ? 'FOUND' : 'NOT FOUND');
          if (targetElement) {
            console.log(`[LayoutModeSection]     Found element by selector:`, {
              tagName: targetElement.tagName,
              className: targetElement.className,
              id: targetElement.id,
              wveId: targetElement.dataset.wveId
            });
          }
        } catch (e) {
          console.warn(`[LayoutModeSection]   - Selector error:`, preserved.selector, e);
        }
      }

      // 恢复选中状态
      if (targetElement && selectionManager) {
        console.log(`[LayoutModeSection]   - RESTORING selection for element ${index + 1}`);
        try {
          // 使用 emit=false 避免触发过多的选择变更事件，除了最后一个元素
          const shouldEmit = index === preservedSelection.length - 1;
          selectionManager.select(targetElement, shouldEmit);
          restoredCount++;

          // 验证选择是否成功
          const isSelected = targetElement.hasAttribute('wve-selected');
          console.log(`[LayoutModeSection]     Selection success: ${isSelected}`);
        } catch (error) {
          console.error(`[LayoutModeSection]     Selection failed:`, error);
        }
      } else {
        console.warn(`[LayoutModeSection]   - FAILED to restore element ${index + 1}:`, {
          targetElement: !!targetElement,
          selectionManager: !!selectionManager,
          preserved
        });
      }
    });

    console.log(`[LayoutModeSection] Selection restoration completed: ${restoredCount}/${preservedSelection.length} elements restored`);

    // 验证最终状态
    const finalSelectedElements = document.querySelectorAll('[wve-selected]');
    console.log(`[LayoutModeSection] Final verification: ${finalSelectedElements.length} elements now selected`);

    // 强制更新属性面板以反映恢复的选择
    if (restoredCount > 0) {
      console.log(`[LayoutModeSection] Updating property panel...`);
      setTimeout(() => {
        const app = window.WVE?.app?.();
        if (app && app.propertyPanel && app.selectionManager) {
          const selected = app.selectionManager.getSelected();
          console.log(`[LayoutModeSection] SelectionManager reports ${selected.size} selected elements`);

          if (selected.size > 0) {
            const lastSelected = Array.from(selected)[selected.size - 1];
            console.log(`[LayoutModeSection] Updating property panel with element:`, lastSelected);
            app.propertyPanel.updateForElement(lastSelected);
            console.log(`[LayoutModeSection] Property panel update completed`);
          } else {
            console.warn(`[LayoutModeSection] No elements in selection manager after restore`);
          }
        } else {
          console.error(`[LayoutModeSection] Cannot update property panel - missing app/propertyPanel/selectionManager`);
        }
      }, 50);
    } else {
      console.warn(`[LayoutModeSection] No elements were restored, property panel will show empty state`);
    }

    console.log(`[LayoutModeSection] ===== RESTORE SELECTION STATE END =====`);
  }

  /**
   * 生成可靠的元素选择器用于恢复选择
   */
  generateElementSelector(element) {
    // 优先使用 data-wve-id
    if (element.dataset.wveId) {
      return `[data-wve-id="${element.dataset.wveId}"]`;
    }

    // 其次使用 ID
    if (element.id) {
      return `#${element.id}`;
    }

    // 最后使用 nth-child 路径
    return this.generateNthChildSelector(element);
  }

  /**
   * 生成元素选择器策略
   */
  generateSelectorStrategies(element) {
    const strategies = [];

    // 策略1: 使用 data-wve-id（如果存在）
    if (element.dataset.wveId) {
      strategies.push({
        type: 'wve-id',
        selector: `[data-wve-id="${element.dataset.wveId}"]`
      });
    }

    // 策略2: 使用 ID（如果存在）
    if (element.id) {
      strategies.push({
        type: 'id',
        selector: `#${element.id}`
      });
    }

    // 策略3: 使用 nth-child 和父元素路径（精确定位）
    const nthChildSelector = this.generateNthChildSelector(element);
    if (nthChildSelector) {
      strategies.push({
        type: 'nth-child',
        selector: nthChildSelector
      });
    }

    // 策略4: 使用标签名 + 类名（简化版，避免过于复杂的选择器）
    if (element.className) {
      const simpleClasses = element.className.trim().split(/\s+/)
        .filter(cls =>
          !cls.startsWith('wve-') && // 排除扩展添加的类
          !cls.includes(':') &&     // 排除包含冒号的Tailwind类
          cls.length < 20           // 排除过长的类名
        );

      if (simpleClasses.length > 0) {
        strategies.push({
          type: 'tag-class',
          selector: `${element.tagName.toLowerCase()}.${simpleClasses[0]}`
        });
      }
    }

    // 策略5: 只使用标签名（最后的回退）
    strategies.push({
      type: 'tag',
      selector: element.tagName.toLowerCase()
    });

    return strategies;
  }

  /**
   * 生成基于 nth-child 的精确选择器
   */
  generateNthChildSelector(element) {
    try {
      const path = [];
      let current = element;

      // 向上遍历到body或html，构建路径
      while (current && current.tagName && current.tagName !== 'BODY' && current.tagName !== 'HTML') {
        const parent = current.parentElement;
        if (!parent) {
          break;
        }

        // 计算当前元素在同类型兄弟元素中的位置
        const siblings = Array.from(parent.children).filter(child =>
          child.tagName === current.tagName
        );

        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          path.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
        } else {
          path.unshift(current.tagName.toLowerCase());
        }

        current = parent;

        // 限制路径深度，避免过于复杂的选择器
        if (path.length >= 3) {
          break;
        }
      }

      return path.length > 0 ? path.join(' > ') : null;
    } catch (error) {
      console.warn('[LayoutModeSection] Error generating nth-child selector:', error);
      return null;
    }
  }

  /**
   * 派发定位变更事件
   */
  dispatchPositionChangeEvent(newPosition, prevPosition) {
    const event = new CustomEvent('wvePositionChange', {
      detail: {
        element: this.currentElement,
        newPosition: newPosition,
        prevPosition: prevPosition,
        positionTypes: this.positionTypes
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 派发布局变更事件
   */
  dispatchLayoutChangeEvent(newLayout, prevLayout) {
    const event = new CustomEvent('wveLayoutChange', {
      detail: {
        element: this.currentElement,
        newLayout: newLayout,
        prevLayout: prevLayout,
        layoutTypes: this.layoutTypes
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 获取当前定位类型
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * 获取当前布局方式
   */
  getCurrentLayout() {
    return this.currentLayout;
  }

  /**
   * 以编程方式设置定位类型
   */
  setPosition(position) {
    if (this.positionTypes[position]) {
      this.selectPosition(position);
    }
  }

  /**
   * 以编程方式设置布局方式
   */
  setLayout(layout) {
    if (this.layoutTypes[layout]) {
      this.selectLayout(layout);
    }
  }

  /**
   * 初始化 Lucide 图标
   */
  initializeLucideIcons(container) {
    // 确保 LucideIcons 可用
    if (typeof window.WVE !== 'undefined' && window.WVE.LucideIcons) {
      // 使用传入的容器或者this.element查找Lucide图标
      const targetElement = container || this.element;
      if (targetElement) {
        // 使用 replaceInRoot 方法来初始化图标
        window.WVE.LucideIcons.replaceInRoot(targetElement);
      }
    } else {
      // 如果 LucideIcons 还未加载，延迟初始化
      setTimeout(() => this.initializeLucideIcons(container), 100);
    }
  }

  injectStyles() {
    if (document.getElementById('layout-mode-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'layout-mode-styles';
    style.textContent = `
      .layout-mode-section .section-content {
        padding: 12px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
        color: #cccccc;
        margin-bottom: 8px;
      }

      .position-selector-container,
      .layout-selector-container {
        margin-bottom: 12px;
      }

      .divider {
        height: 1px;
        background: #404040;
        margin: 16px 0;
      }

      .settings-description-container {
        background: #363636;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #404040;
      }

      .settings-desc-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .settings-desc-row:last-child {
        margin-bottom: 0;
      }

      .settings-desc-label {
        font-size: 10px;
        color: #999999;
      }

      .settings-desc-value {
        font-size: 10px;
        color: #cccccc;
        font-weight: 500;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 清理资源，包括定时器和事件监听器
   */
  destroy() {
    // 清理所有恢复尝试
    this.clearRestoreAttempts();

    // 清理保存的选择状态
    this.preservedSelection = null;
    this.currentElement = null;

    console.log(`[LayoutModeSection] Resources cleaned up`);
  }
};