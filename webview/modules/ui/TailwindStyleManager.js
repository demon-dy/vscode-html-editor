/**
 * Tailwind样式管理器 - 负责样式提取和Shadow DOM同步
 * 转换功能由扩展端的npm包处理
 */
window.WVE = window.WVE || {};
window.WVE.TailwindStyleManager = class TailwindStyleManager {
  constructor(stateManager = null, eventManager = null) {
    this.logger = new window.WVE.Logger('TailwindStyleManager');
    this.stateManager = stateManager;
    this.eventManager = eventManager;

    // 初始化完成标记
    this.initialized = true;

    // 防抖机制
    this.pendingOperations = new Map(); // 存储待处理的操作
    this.debounceTimeout = null;
    this.debounceDelay = 400; // 优化为400ms，在响应性和稳定性间平衡
    this.isProcessing = false; // 处理状态标记
    this.lastProcessTime = 0; // 最后处理时间，用于额外的防抖保护

    // 全局操作锁 - 防止重复修改
    if (!window.WVE.GlobalOperationLock) {
      window.WVE.GlobalOperationLock = {
        locked: false,
        queue: [],
        lock() {
          this.locked = true;
        },
        unlock() {
          this.locked = false;
          // 处理队列中的下一个操作
          if (this.queue.length > 0) {
            const nextOperation = this.queue.shift();
            setTimeout(nextOperation, 50);
          }
        },
        isLocked() {
          return this.locked;
        },
        enqueue(operation) {
          this.queue.push(operation);
        }
      };
    }
    this.globalLock = window.WVE.GlobalOperationLock;
  }

  /**
   * 从元素提取当前的类名和计算样式
   */
  extractStyles(element) {
    const currentClasses = Array.from(element.classList);
    const computedStyle = window.getComputedStyle(element);

    return {
      classes: currentClasses,
      computed: {
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        textAlign: computedStyle.textAlign,
        opacity: computedStyle.opacity,
        borderRadius: computedStyle.borderRadius,
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        paddingTop: computedStyle.paddingTop,
        paddingRight: computedStyle.paddingRight,
        paddingBottom: computedStyle.paddingBottom,
        paddingLeft: computedStyle.paddingLeft,
        marginTop: computedStyle.marginTop,
        marginRight: computedStyle.marginRight,
        marginBottom: computedStyle.marginBottom,
        marginLeft: computedStyle.marginLeft,
        // 布局相关属性
        display: computedStyle.display,
        position: computedStyle.position,
        flexDirection: computedStyle.flexDirection,
        justifyContent: computedStyle.justifyContent,
        alignItems: computedStyle.alignItems,
        gap: computedStyle.gap
      },
      hasInlineStyle: element.style.length > 0
    };
  }

























  /**
   * 从元素中提取 Tailwind 类名（过滤扩展相关类名）
   * @param {HTMLElement} element - 目标元素
   * @returns {string} Tailwind 类名字符串
   */
  extractElementTailwindClasses(element) {
    if (!element || !element.className) {
      return '';
    }

    // 过滤掉扩展添加的类名，只保留 Tailwind 类名
    const classes = element.className.split(/\s+/)
      .filter(cls =>
        cls &&
        !cls.startsWith('wve-') &&
        !cls.startsWith('lucide-') &&
        cls !== 'selected'
      );

    return classes.join(' ');
  }

  /**
   * 应用 Tailwind 类名到元素（智能合并，保留不冲突的类名）
   * @param {HTMLElement} element - 目标元素
   * @param {string} classes - 新的 Tailwind 类名字符串
   */
  applyElementTailwindClasses(element, classes) {
    if (!element) {
      throw new Error('Invalid element');
    }

    const currentClasses = element.className.split(/\s+/).filter(cls => cls.trim());
    const newClasses = classes ? classes.split(/\s+/).filter(cls => cls.trim()) : [];

    // 分类现有类名
    const extensionClasses = currentClasses.filter(cls =>
      cls.startsWith('wve-') ||
      cls.startsWith('lucide-') ||
      cls === 'selected'
    );

    const existingTailwindClasses = currentClasses.filter(cls =>
      cls &&
      !cls.startsWith('wve-') &&
      !cls.startsWith('lucide-') &&
      cls !== 'selected'
    );

    // 智能合并：移除冲突的类名，保留不冲突的
    const mergedTailwindClasses = this.mergeTailwindClasses(existingTailwindClasses, newClasses);

    // 最终合并所有类名
    element.className = [...extensionClasses, ...mergedTailwindClasses].join(' ');
    this.logger.info('Applied Tailwind classes:', classes, 'to element:', element);
    this.logger.debug('Final classes:', element.className);
  }

  /**
   * 判断是否为文本颜色类
   * @param {string} cls - 类名
   * @returns {boolean} 是否为文本颜色类
   */
  isTextColorClass(cls) {
    // 排除文本对齐、文本大小等非颜色类
    const nonColorTextClasses = /^text-(left|center|right|justify|start|end|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/;
    return cls.startsWith('text-') && !nonColorTextClasses.test(cls);
  }

  /**
   * 判断是否为背景颜色类
   * @param {string} cls - 类名
   * @returns {boolean} 是否为背景颜色类
   */
  isBackgroundColorClass(cls) {
    // 排除背景相关但非颜色的类
    const nonColorBgClasses = /^bg-(fixed|local|scroll|clip-border|clip-padding|clip-content|origin-border|origin-padding|origin-content|repeat|no-repeat|repeat-x|repeat-y|repeat-round|repeat-space)$/;
    return cls.startsWith('bg-') && !nonColorBgClasses.test(cls);
  }

  /**
   * 智能合并 Tailwind 类名，避免冲突
   * @param {string[]} existingClasses - 现有的 Tailwind 类名
   * @param {string[]} newClasses - 新的 Tailwind 类名
   * @returns {string[]} 合并后的类名数组
   */
  mergeTailwindClasses(existingClasses, newClasses) {
    // 分析新类名的类型
    const newClassTypes = new Set();
    newClasses.forEach(cls => {
      // 检查字体颜色：text-red-500, text-blue-600, text-[#eab308] 等，排除文本对齐和大小类
      if (cls.startsWith('text-') && this.isTextColorClass(cls)) {
        newClassTypes.add('text-color');
      }
      // 检查背景色：bg-red-500, bg-blue-600, bg-[#22c55e] 等
      else if (cls.startsWith('bg-') && this.isBackgroundColorClass(cls)) {
        newClassTypes.add('bg-color');
      }
      // 检查字体大小
      else if (cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/)) {
        newClassTypes.add('text-size');
      }
      // 检查文本对齐
      else if (cls.match(/^text-(left|center|right|justify|start|end)$/)) {
        newClassTypes.add('text-align');
      }
      // 检查显示类型（布局相关）
      else if (cls.match(/^(block|inline|inline-block|flex|inline-flex|table|inline-table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row-group|table-row|flow-root|grid|inline-grid|contents|list-item|hidden)$/)) {
        newClassTypes.add('display');
      }
      // 检查定位
      else if (cls.match(/^(static|fixed|absolute|relative|sticky)$/)) {
        newClassTypes.add('position');
      }
      // 检查 Flex 方向
      else if (cls.match(/^flex-(row|row-reverse|col|col-reverse)$/)) {
        newClassTypes.add('flex-direction');
      }
      // 检查 Flex 主轴对齐
      else if (cls.match(/^justify-(start|end|center|between|around|evenly|stretch)$/)) {
        newClassTypes.add('justify-content');
      }
      // 检查 Flex 交叉轴对齐
      else if (cls.match(/^items-(start|end|center|baseline|stretch)$/)) {
        newClassTypes.add('align-items');
      }
      // 检查间距
      else if (cls.match(/^gap-/)) {
        newClassTypes.add('gap');
      }
      // 其他类型可以继续添加...
    });

    // 过滤现有类名，移除与新类名冲突的
    const filteredExistingClasses = existingClasses.filter(cls => {
      // 检查是否与新的字体颜色冲突
      if (newClassTypes.has('text-color') && cls.startsWith('text-') && this.isTextColorClass(cls)) {
        return false;
      }
      // 检查是否与新的背景色冲突
      if (newClassTypes.has('bg-color') && cls.startsWith('bg-') && this.isBackgroundColorClass(cls)) {
        return false;
      }
      // 检查是否与新的字体大小冲突
      if (newClassTypes.has('text-size') && cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/)) {
        return false;
      }
      // 检查是否与新的文本对齐冲突
      if (newClassTypes.has('text-align') && cls.match(/^text-(left|center|right|justify|start|end)$/)) {
        return false;
      }
      // 检查是否与新的显示类型冲突
      if (newClassTypes.has('display') && cls.match(/^(block|inline|inline-block|flex|inline-flex|table|inline-table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row-group|table-row|flow-root|grid|inline-grid|contents|list-item|hidden)$/)) {
        return false;
      }
      // 检查是否与新的定位冲突
      if (newClassTypes.has('position') && cls.match(/^(static|fixed|absolute|relative|sticky)$/)) {
        return false;
      }
      // 检查是否与新的 Flex 方向冲突
      if (newClassTypes.has('flex-direction') && cls.match(/^flex-(row|row-reverse|col|col-reverse)$/)) {
        return false;
      }
      // 检查是否与新的主轴对齐冲突
      if (newClassTypes.has('justify-content') && cls.match(/^justify-(start|end|center|between|around|evenly|stretch)$/)) {
        return false;
      }
      // 检查是否与新的交叉轴对齐冲突
      if (newClassTypes.has('align-items') && cls.match(/^items-(start|end|center|baseline|stretch)$/)) {
        return false;
      }
      // 检查是否与新的间距冲突
      if (newClassTypes.has('gap') && cls.match(/^gap-/)) {
        return false;
      }
      return true;
    });

    // 合并过滤后的现有类名和新类名
    return [...filteredExistingClasses, ...newClasses];
  }

  /**
   * 获取元素的样式信息（用于样式编辑面板）
   * @param {HTMLElement} element - 目标元素
   * @returns {Object} 包含Tailwind类名和CSS样式的对象
   */
  async getElementStyleInfo(element) {
    if (!element) {
      throw new Error('Invalid element');
    }

    const tailwindClasses = this.extractElementTailwindClasses(element);
    const cssStyles = this.getElementComputedStyles(element);

    return {
      tailwindClasses,
      cssStyles,
      element
    };
  }

  /**
   * 保存样式变更（通过扩展端处理转换）
   * @param {HTMLElement} element - 目标元素
   * @param {Object} cssStyles - CSS样式对象
   * @param {boolean} immediate - 是否立即处理，跳过防抖
   * @returns {Promise<string>} 转换后的Tailwind类名
   */
  async saveStyleChanges(element, cssStyles, immediate = false) {
    if (!element || !cssStyles) {
      throw new Error('Invalid parameters');
    }

    // 检查全局操作锁
    if (this.globalLock.isLocked()) {
      this.logger.warn('Global operation lock is active, queueing style change');
      return new Promise((resolve) => {
        this.globalLock.enqueue(() => {
          if (immediate) {
            this.executeSaveStyleChanges(element, cssStyles).then(resolve);
          } else {
            this.debouncedSaveStyleChanges(element, cssStyles, resolve);
          }
        });
      });
    }

    // 立即处理单个布局变更，避免感知延迟
    if (immediate || this.isSingleLayoutChange(cssStyles)) {
      this.logger.info('Processing immediate style change:', cssStyles);
      return this.executeImmediateStyleChange(element, cssStyles);
    }

    // 使用防抖机制来避免频繁的文件编辑操作
    return new Promise((resolve) => {
      this.debouncedSaveStyleChanges(element, cssStyles, resolve);
    });
  }

  /**
   * 判断是否为单个布局变更（应该立即处理）
   * @param {Object} cssStyles - CSS样式对象
   * @returns {boolean} 是否为单个布局变更
   */
  isSingleLayoutChange(cssStyles) {
    const keys = Object.keys(cssStyles);
    return keys.length === 1 && ['display', 'flexDirection', 'justifyContent', 'alignItems'].includes(keys[0]);
  }

  /**
   * 防抖版本的样式保存
   * @param {HTMLElement} element - 目标元素
   * @param {Object} cssStyles - CSS样式对象
   * @param {Function} resolve - Promise resolve 函数
   */
  debouncedSaveStyleChanges(element, cssStyles, resolve) {
    // 检查是否正在处理或刚刚处理过
    const now = Date.now();
    if (this.isProcessing || (now - this.lastProcessTime < 200)) { // 降低到200ms的最小间隔
      this.logger.warn('Style operation blocked: already processing or too frequent');
      // 延迟重试
      setTimeout(() => {
        this.debouncedSaveStyleChanges(element, cssStyles, resolve);
      }, 100); // 减少重试延迟
      return;
    }

    // 为每个元素创建唯一标识
    const elementId = this.getElementId(element);

    // 存储或合并待处理的操作
    if (this.pendingOperations.has(elementId)) {
      // 合并样式变更
      const existing = this.pendingOperations.get(elementId);
      Object.assign(existing.cssStyles, cssStyles);
      existing.resolvers.push(resolve);
    } else {
      this.pendingOperations.set(elementId, {
        element,
        cssStyles: { ...cssStyles },
        resolvers: [resolve]
      });
    }

    // 清除之前的定时器
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // 设置新的防抖定时器
    this.debounceTimeout = setTimeout(() => {
      this.processPendingOperations();
    }, this.debounceDelay);
  }

  /**
   * 获取元素的唯一标识
   * @param {HTMLElement} element - 目标元素
   * @returns {string} 元素唯一标识
   */
  getElementId(element) {
    // 使用DOM路径作为元素标识
    let path = '';
    let current = element;
    while (current && current !== document.body) {
      let index = 0;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }
      path = `${current.tagName.toLowerCase()}:nth-of-type(${index + 1})` + (path ? `>${path}` : '');
      current = current.parentElement;
    }
    return path;
  }

  /**
   * 处理所有待处理的操作
   */
  async processPendingOperations() {
    // 防止重复处理
    if (this.isProcessing) {
      this.logger.warn('Style operations already being processed, skipping');
      return;
    }

    // 获取全局锁
    this.globalLock.lock();
    this.isProcessing = true;
    this.lastProcessTime = Date.now(); // 记录开始处理的时间

    try {
      const operations = Array.from(this.pendingOperations.values());
      this.pendingOperations.clear();
      this.debounceTimeout = null;

      this.logger.info('Processing', operations.length, 'pending style operations with global lock');

      // 串行处理操作以避免并发编辑冲突
      for (const operation of operations) {
        try {
          const result = await this.executeSaveStyleChanges(operation.element, operation.cssStyles);
          // 解析所有等待的 Promise
          operation.resolvers.forEach(resolve => resolve(result));

          // 在操作之间添加小延迟，进一步减少冲突
          if (operations.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (error) {
          this.logger.error('Failed to process style operation:', error);
          // 即使失败也要解析 Promise
          operation.resolvers.forEach(resolve => resolve(''));
        }
      }
    } finally {
      this.isProcessing = false;
      this.lastProcessTime = Date.now(); // 记录完成处理的时间
      // 释放全局锁
      setTimeout(() => {
        this.globalLock.unlock();
      }, 50); // 减少锁释放延迟，提高响应性
    }
  }

  /**
   * 立即处理样式变更（跳过防抖和队列）
   * @param {HTMLElement} element - 目标元素
   * @param {Object} cssStyles - CSS样式对象
   * @returns {Promise<string>} 转换后的Tailwind类名
   */
  async executeImmediateStyleChange(element, cssStyles) {
    // 获取临时锁，确保不与其他操作冲突
    this.globalLock.lock();

    try {
      return await this.executeSaveStyleChanges(element, cssStyles);
    } finally {
      // 立即释放锁
      this.globalLock.unlock();
    }
  }

  /**
   * 实际执行样式保存的方法
   * @param {HTMLElement} element - 目标元素
   * @param {Object} cssStyles - CSS样式对象
   * @returns {Promise<string>} 转换后的Tailwind类名
   */
  async executeSaveStyleChanges(element, cssStyles) {
    this.logger.info('Converting CSS to Tailwind via extension:', cssStyles);

    try {
      // 通过消息请求扩展端进行转换
      const tailwindClasses = await this.requestCSSToTailwindConversion(cssStyles);

      if (tailwindClasses) {
        // 应用转换后的Tailwind类名到元素
        this.applyElementTailwindClasses(element, tailwindClasses);

        // 发送包含类名和样式的操作到扩展端
        this.sendTailwindStyleOperation(element, tailwindClasses);

        this.logger.info('Style changes applied successfully:', tailwindClasses);
        return tailwindClasses;
      } else {
        // 如果转换失败，回退到内联样式
        this.logger.warn('Tailwind conversion failed, applying inline styles');
        this.applyInlineStyles(element, cssStyles);

        // 发送内联样式操作到扩展端
        this.sendInlineStyleOperation(element);

        return '';
      }
    } catch (error) {
      this.logger.error('Style conversion error:', error);
      // 错误处理：回退到内联样式
      this.applyInlineStyles(element, cssStyles);

      // 发送内联样式操作到扩展端
      this.sendInlineStyleOperation(element);

      return '';
    }
  }

  /**
   * 请求扩展端进行CSS到Tailwind转换
   * @param {Object} cssStyles - CSS样式对象
   * @returns {Promise<string>} Tailwind类名字符串
   */
  async requestCSSToTailwindConversion(cssStyles) {
    return new Promise((resolve) => {
      if (typeof vscode === 'undefined') {
        this.logger.warn('VSCode API not available, conversion failed');
        resolve('');
        return;
      }

      // 生成唯一请求ID
      const requestId = 'css-to-tailwind-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);

      // 设置超时处理
      const timeout = setTimeout(() => {
        this.logger.warn('CSS to Tailwind conversion timeout');
        resolve('');
      }, 5000);

      // 监听回应消息
      const messageHandler = (event) => {
        if (event.data.type === 'cssToTailwindResponse' && event.data.requestId === requestId) {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          resolve(event.data.tailwindClasses || '');
        }
      };

      window.addEventListener('message', messageHandler);

      // 发送转换请求
      vscode.postMessage({
        type: 'cssToTailwindRequest',
        requestId: requestId,
        cssStyles: cssStyles
      });
    });
  }

  /**
   * 发送 Tailwind 样式操作到扩展端
   * @param {HTMLElement} element - 目标元素
   * @param {string} _ - Tailwind 类名字符串（未使用，从元素提取最新的）
   */
  sendTailwindStyleOperation(element, _) {
    if (!this.stateManager || !this.eventManager) {
      this.logger.warn('StateManager or EventManager not available');
      return;
    }

    const finalClasses = this.extractElementTailwindClasses(element);
    const operation = {
      type: 'tailwindStyle',
      tailwindClasses: finalClasses,
      style: element.getAttribute('style') || null
    };

    const updated = this.stateManager.codeEdits.some(edit => {
      if (edit.element === element) {
        edit.operations.push(operation);
        return true;
      }
    });

    if (!updated) {
      this.stateManager.addCodeEdit({ element: element, operations: [operation] });
    }

    this.eventManager.emitCodeEdits(new Set([element]), this.stateManager.codeEdits);
    this.logger.debug('Sent Tailwind style operation:', operation);
  }

  /**
   * 发送内联样式操作到扩展端
   * @param {HTMLElement} element - 目标元素
   */
  sendInlineStyleOperation(element) {
    if (!this.stateManager || !this.eventManager) {
      this.logger.warn('StateManager or EventManager not available');
      return;
    }

    const style = element.getAttribute('style') || null;
    const operation = { type: 'style', style };

    const updated = this.stateManager.codeEdits.some(edit => {
      if (edit.element === element) {
        edit.operations.push(operation);
        return true;
      }
    });

    if (!updated) {
      this.stateManager.addCodeEdit({ element: element, operations: [operation] });
    }

    this.eventManager.emitCodeEdits(new Set([element]), this.stateManager.codeEdits);
    this.logger.debug('Sent inline style operation:', operation);
  }

  /**
   * 应用内联样式（回退方案）
   * @param {HTMLElement} element - 目标元素
   * @param {Object} cssStyles - CSS样式对象
   */
  applyInlineStyles(element, cssStyles) {
    Object.entries(cssStyles).forEach(([property, value]) => {
      const cssProperty = this.camelToKebab(property);
      element.style.setProperty(cssProperty, value);
    });
  }

  /**
   * 获取元素的计算样式（只包含有意义的样式）
   * @param {HTMLElement} element - 目标元素
   * @returns {Object} CSS 样式对象
   */
  getElementComputedStyles(element) {
    if (!element) {
      return {};
    }

    const computedStyles = getComputedStyle(element);
    const relevantStyles = {};

    // 定义需要提取的样式属性
    const relevantProperties = [
      'backgroundColor', 'color', 'fontSize', 'fontWeight', 'fontFamily',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
      'borderRadius', 'borderWidth', 'borderColor', 'borderStyle',
      'display', 'flexDirection', 'alignItems', 'justifyContent', 'flexWrap',
      'width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight',
      'position', 'top', 'right', 'bottom', 'left', 'zIndex',
      'textAlign', 'textDecoration', 'textTransform', 'lineHeight',
      'boxShadow', 'transform', 'opacity', 'overflow'
    ];

    relevantProperties.forEach(property => {
      const value = computedStyles.getPropertyValue(this.camelToKebab(property));
      if (value && this.isValidStyleValue(value)) {
        relevantStyles[property] = value;
      }
    });

    return relevantStyles;
  }

  /**
   * 将驼峰命名转换为短横线命名
   * @param {string} camelCase - 驼峰命名字符串
   * @returns {string} 短横线命名字符串
   */
  camelToKebab(camelCase) {
    return camelCase.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 检查样式是否为有效值
   * @param {string} value - 样式值
   * @returns {boolean} 是否有效
   */
  isValidStyleValue(value) {
    return value &&
           value !== 'initial' &&
           value !== 'inherit' &&
           value !== 'unset' &&
           value !== 'auto' &&
           value !== 'normal' &&
           value !== 'none' &&
           value.trim() !== '';
  }
};