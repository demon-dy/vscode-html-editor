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
        marginLeft: computedStyle.marginLeft
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
   * @returns {Promise<string>} 转换后的Tailwind类名
   */
  async saveStyleChanges(element, cssStyles) {
    if (!element || !cssStyles) {
      throw new Error('Invalid parameters');
    }

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