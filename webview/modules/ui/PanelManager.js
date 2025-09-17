/**
 * 面板管理器 - 负责创建与生命周期管理
 */
window.WVE = window.WVE || {};
window.WVE.PanelManager = class PanelManager {
  constructor(uiManager, stateManager, eventManager) {
    this.logger = new window.WVE.Logger('PanelManager');
    this.uiManager = uiManager;
    this.stateManager = stateManager;
    this.eventManager = eventManager;
    this.elementPanel = null;
    this.styleEditorPanel = null;
    this.tailwindManager = null;
  }

  init() {
    this.logger.info('Initializing PanelManager');

    // 初始化Tailwind管理器
    this.tailwindManager = new window.WVE.TailwindStyleManager(this.stateManager, this.eventManager);

    // 初始化样式编辑面板
    this.styleEditorPanel = new window.WVE.StyleEditorPanel(
      this.uiManager,
      this.tailwindManager
    );
    this.styleEditorPanel.init();

    // 初始化元素面板
    this.elementPanel = new window.WVE.ElementPanel(
      this.uiManager,
      this.stateManager,
      this.eventManager,
      this.tailwindManager
    );

    // 连接样式编辑面板
    this.elementPanel.setStyleEditorPanel(this.styleEditorPanel);

    this.elementPanel.init();

    // 监听样式变更事件，实现变更优化
    this.bindStyleChangeOptimization();

    this.logger.info('PanelManager ready');
  }

  /**
   * 绑定样式变更优化
   */
  bindStyleChangeOptimization() {
    let changeTimeout = null;
    const changes = new Map();

    document.addEventListener('wveStyleChange', (event) => {
      const { element, property, value, source } = event.detail;

      // 跳过来自 StyleEditorPanel 的事件，因为它已经直接处理了保存
      if (source === 'StyleEditorPanel') {
        return;
      }

      const elementId = element.getAttribute('data-wve-id') || this.generateElementId(element);

      // 收集变更
      if (!changes.has(elementId)) {
        changes.set(elementId, { element, properties: new Map() });
      }
      changes.get(elementId).properties.set(property, value);

      // 防抖处理，避免频繁更新
      if (changeTimeout) {
        clearTimeout(changeTimeout);
      }

      changeTimeout = setTimeout(() => {
        this.processStyleChanges(changes);
        changes.clear();
        changeTimeout = null;
      }, 100);
    });
  }

  /**
   * 处理样式变更 - 使用转换库将CSS转换为Tailwind
   */
  async processStyleChanges(changes) {
    const tailwindChanges = [];

    for (const { element, properties } of changes.values()) {
      this.logger.debug(`Processing ${properties.size} style changes for element`, element);

      try {
        // 将CSS属性转换为CSS样式对象
        const cssStyles = {};
        properties.forEach((value, property) => {
          cssStyles[property] = value;
        });

        // 使用TailwindStyleManager将CSS转换为Tailwind类名
        if (this.tailwindManager) {
          const tailwindClasses = await this.tailwindManager.saveStyleChanges(element, cssStyles);

          // 收集转换后的Tailwind变更信息
          tailwindChanges.push({
            element: this.getElementSelector(element),
            tailwindClasses: tailwindClasses,
            cssStyles: cssStyles // 保留原始CSS作为备用
          });

          this.logger.info('Converted CSS to Tailwind:', cssStyles, '=>', tailwindClasses);
        } else {
          // 降级处理：如果转换库不可用，使用原有逻辑
          this.logger.warn('TailwindStyleManager not available, falling back to CSS styles');
          properties.forEach((value, property) => {
            tailwindChanges.push({
              element: this.getElementSelector(element),
              property,
              value
            });
          });
        }
      } catch (error) {
        this.logger.error('Failed to convert CSS to Tailwind:', error);

        // 出错时降级处理
        properties.forEach((value, property) => {
          tailwindChanges.push({
            element: this.getElementSelector(element),
            property,
            value
          });
        });
      }

      // 触发UI更新
      if (this.elementPanel && this.elementPanel.currentTarget === element) {
        this.elementPanel.updateValues(element);
      }
    }

    // 所有样式变更处理完毕后，发送Tailwind类名变更信息
    if (tailwindChanges.length > 0) {
      this.syncTailwindChanges(tailwindChanges);
    }
  }

  /**
   * 同步Tailwind类名变更到VSCode
   */
  syncTailwindChanges(tailwindChanges) {
    if (typeof vscode !== 'undefined') {
      const message = {
        type: 'tailwindStyleChange',
        data: {
          changes: tailwindChanges,
          timestamp: Date.now()
        }
      };

      this.logger.debug('Syncing Tailwind style changes to VSCode:', tailwindChanges);
      vscode.postMessage(message);
    }
  }

  /**
   * 同步样式变更到VSCode（保留原方法作为降级处理）
   */
  syncStyleChanges(styleChanges) {
    // 发送具体的样式变更消息给VSCode扩展
    if (typeof vscode !== 'undefined') {
      const message = {
        type: 'styleChange',
        data: {
          changes: styleChanges,
          timestamp: Date.now()
        }
      };

      this.logger.debug('Syncing style changes to VSCode:', styleChanges);
      vscode.postMessage(message);
    }
  }

  /**
   * 获取元素选择器信息
   */
  getElementSelector(element) {
    // 生成多种选择器策略
    const strategies = [];

    // 策略1: 使用ID（如果有的话）
    if (element.id) {
      strategies.push({
        type: 'id',
        selector: `#${element.id}`,
        specificity: 100
      });
    }

    // 策略2: 使用data-wve-id（如果有的话）
    const wveId = element.getAttribute('data-wve-id');
    if (wveId) {
      strategies.push({
        type: 'wve-id',
        selector: `[data-wve-id="${wveId}"]`,
        specificity: 90
      });
    }

    // 策略3: 使用标签名 + nth-of-type
    const parent = element.parentNode;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child =>
        child.tagName === element.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        strategies.push({
          type: 'nth-of-type',
          selector: `${element.tagName.toLowerCase()}:nth-of-type(${index})`,
          specificity: 50
        });
      } else {
        strategies.push({
          type: 'tag-only',
          selector: element.tagName.toLowerCase(),
          specificity: 10
        });
      }
    }

    // 策略4: 生成DOM路径（不包含复杂类名）
    const path = this.generateSimpleDOMPath(element);
    if (path) {
      strategies.push({
        type: 'dom-path',
        selector: path,
        specificity: 80
      });
    }

    return {
      strategies: strategies.sort((a, b) => b.specificity - a.specificity),
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      id: element.id || null,
      wveId: wveId
    };
  }

  /**
   * 生成简单的DOM路径（避免复杂的类名）
   */
  generateSimpleDOMPath(element) {
    const path = [];
    let current = element;
    let depth = 0;
    const maxDepth = 5; // 限制路径深度，避免过于复杂

    while (current && current !== document.body && depth < maxDepth) {
      let selector = current.tagName.toLowerCase();

      // 优先使用ID
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break; // ID是唯一的，可以停止
      }

      // 添加位置信息
      const parent = current.parentNode;
      if (parent) {
        const siblings = Array.from(parent.children).filter(child =>
          child.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentNode;
      depth++;
    }

    return path.length > 0 ? path.join(' > ') : null;
  }

  /**
   * 生成元素ID
   */
  generateElementId(element) {
    const id = 'wve-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    element.setAttribute('data-wve-id', id);
    return id;
  }
};

