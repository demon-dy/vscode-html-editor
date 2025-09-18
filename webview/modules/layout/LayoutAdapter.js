/**
 * 智能布局适配器 - 将Figma式的语义化操作转换为合适的HTML/CSS实现
 */
window.WVE = window.WVE || {};
window.WVE.LayoutAdapter = class LayoutAdapter {
  constructor(uiManager) {
    this.logger = new window.WVE.Logger('LayoutAdapter');
    this.uiManager = uiManager;
  }

  /**
   * 分析元素的布局上下文
   */
  analyzeLayoutContext(element) {
    const context = {
      element,
      parent: element.parentElement,
      isTextElement: this.isTextElement(element),
      isBlockElement: this.isBlockElement(element),
      isFlexContainer: this.isFlexContainer(element),
      parentIsFlexContainer: this.isFlexContainer(element.parentElement),
      currentDisplay: getComputedStyle(element).display,
      parentDisplay: element.parentElement ? getComputedStyle(element.parentElement).display : null,
      hasAbsolutePosition: this.hasAbsolutePosition(element),
      children: Array.from(element.children),
      hasTextContent: this.hasDirectTextContent(element)
    };

    this.logger.debug('Layout context analyzed:', context);
    return context;
  }

  /**
   * 语义化居中操作 - 自动选择最佳实现方式
   */
  applyCenterAlignment(element, type = 'both') {
    const context = this.analyzeLayoutContext(element);
    const strategy = this.selectCenteringStrategy(context, type);

    this.logger.info(`Applying ${type} center alignment using strategy: ${strategy.name}`);

    // 执行选定的策略
    strategy.apply(element, context);

    // 同步Tailwind样式
    if (this.uiManager) {
      this.uiManager.syncTailwindStyles();
    }
  }

  /**
   * 选择居中策略
   */
  selectCenteringStrategy(context, type) {
    // 1. 文本元素居中
    if (context.isTextElement || context.hasTextContent) {
      return this.getTextCenteringStrategy(type);
    }

    // 2. 绝对定位元素居中
    if (context.hasAbsolutePosition) {
      return this.getAbsoluteCenteringStrategy(type);
    }

    // 3. Flex子元素居中
    if (context.parentIsFlexContainer) {
      return this.getFlexChildCenteringStrategy(type);
    }

    // 4. 普通块级元素居中
    if (context.isBlockElement) {
      return this.getBlockCenteringStrategy(type);
    }

    // 5. 默认策略：转换为Flex容器
    return this.getFlexContainerCenteringStrategy(type);
  }

  /**
   * 文本居中策略
   */
  getTextCenteringStrategy(type) {
    return {
      name: 'text-centering',
      apply: (element, context) => {
        if (type === 'horizontal' || type === 'both') {
          this.applyClasses(element, ['text-center']);
        }

        if (type === 'vertical' || type === 'both') {
          // 对于文本的垂直居中，使用line-height或flex
          if (context.isBlockElement) {
            this.applyClasses(element, ['flex', 'items-center']);
          }
        }
      }
    };
  }

  /**
   * 绝对定位居中策略
   */
  getAbsoluteCenteringStrategy(type) {
    return {
      name: 'absolute-centering',
      apply: (element, context) => {
        // 确保元素有absolute或fixed定位
        if (!element.classList.contains('absolute') && !element.classList.contains('fixed')) {
          this.applyClasses(element, ['absolute']);
        }

        if (type === 'horizontal' || type === 'both') {
          this.applyClasses(element, ['left-1/2', '-translate-x-1/2', 'transform']);
        }

        if (type === 'vertical' || type === 'both') {
          this.applyClasses(element, ['top-1/2', '-translate-y-1/2', 'transform']);
        }
      }
    };
  }

  /**
   * Flex子元素居中策略
   */
  getFlexChildCenteringStrategy(type) {
    return {
      name: 'flex-child-centering',
      apply: (element, context) => {
        // 在父容器上设置对齐属性
        const parent = context.parent;

        if (type === 'horizontal' || type === 'both') {
          this.applyClasses(parent, ['justify-center']);
        }

        if (type === 'vertical' || type === 'both') {
          this.applyClasses(parent, ['items-center']);
        }
      }
    };
  }

  /**
   * 块级元素居中策略
   */
  getBlockCenteringStrategy(type) {
    return {
      name: 'block-centering',
      apply: (element, context) => {
        if (type === 'horizontal' || type === 'both') {
          this.applyClasses(element, ['mx-auto']);
        }

        if (type === 'vertical' || type === 'both') {
          // 块级元素垂直居中较复杂，转换为flex容器
          if (context.parent) {
            this.applyClasses(context.parent, ['flex', 'items-center']);
          }
        }
      }
    };
  }

  /**
   * Flex容器居中策略
   */
  getFlexContainerCenteringStrategy(type) {
    return {
      name: 'flex-container-centering',
      apply: (element, context) => {
        // 将元素转换为flex容器并居中内容
        this.applyClasses(element, ['flex']);

        if (type === 'horizontal' || type === 'both') {
          this.applyClasses(element, ['justify-center']);
        }

        if (type === 'vertical' || type === 'both') {
          this.applyClasses(element, ['items-center']);
        }
      }
    };
  }

  /**
   * 语义化对齐操作
   */
  applyAlignment(element, alignment) {
    const context = this.analyzeLayoutContext(element);

    switch (alignment) {
      case 'left':
        this.applyLeftAlignment(element, context);
        break;
      case 'right':
        this.applyRightAlignment(element, context);
        break;
      case 'top':
        this.applyTopAlignment(element, context);
        break;
      case 'bottom':
        this.applyBottomAlignment(element, context);
        break;
      case 'center-horizontal':
        this.applyCenterAlignment(element, 'horizontal');
        break;
      case 'center-vertical':
        this.applyCenterAlignment(element, 'vertical');
        break;
      case 'center':
        this.applyCenterAlignment(element, 'both');
        break;
    }

    if (this.uiManager) {
      this.uiManager.syncTailwindStyles();
    }
  }

  /**
   * 左对齐实现
   */
  applyLeftAlignment(element, context) {
    this.logger.info('Applying left alignment');

    if (context.isTextElement || context.hasTextContent) {
      this.applyClasses(element, ['text-left']);
    } else if (context.parentIsFlexContainer) {
      this.applyClasses(context.parent, ['justify-start']);
    } else {
      this.removeCenteringClasses(element);
    }
  }

  /**
   * 右对齐实现
   */
  applyRightAlignment(element, context) {
    this.logger.info('Applying right alignment');

    if (context.isTextElement || context.hasTextContent) {
      this.applyClasses(element, ['text-right']);
    } else if (context.parentIsFlexContainer) {
      this.applyClasses(context.parent, ['justify-end']);
    } else if (context.isBlockElement) {
      this.applyClasses(element, ['ml-auto']);
    }
  }

  /**
   * 顶部对齐实现
   */
  applyTopAlignment(element, context) {
    this.logger.info('Applying top alignment');

    if (context.parentIsFlexContainer) {
      this.applyClasses(context.parent, ['items-start']);
    } else {
      this.removeCenteringClasses(element);
    }
  }

  /**
   * 底部对齐实现
   */
  applyBottomAlignment(element, context) {
    this.logger.info('Applying bottom alignment');

    if (context.parentIsFlexContainer) {
      this.applyClasses(context.parent, ['items-end']);
    } else {
      // 对于非flex容器，可能需要特殊处理
      this.applyClasses(element, ['self-end']);
    }
  }

  /**
   * 智能应用CSS类
   */
  applyClasses(element, classes) {
    // 移除可能冲突的类
    classes.forEach(newClass => {
      this.removeConflictingClasses(element, newClass);
    });

    // 添加新类
    classes.forEach(className => {
      if (!element.classList.contains(className)) {
        element.classList.add(className);
        this.logger.debug(`Added class: ${className} to ${window.WVE.DOMUtils?.shortNameOf?.(element) || element.tagName}`);
      }
    });
  }

  /**
   * 移除冲突的CSS类
   */
  removeConflictingClasses(element, newClass) {
    const conflicts = {
      // 文本对齐冲突
      'text-left': ['text-center', 'text-right'],
      'text-center': ['text-left', 'text-right'],
      'text-right': ['text-left', 'text-center'],

      // Flex对齐冲突
      'justify-start': ['justify-center', 'justify-end', 'justify-between'],
      'justify-center': ['justify-start', 'justify-end', 'justify-between'],
      'justify-end': ['justify-start', 'justify-center', 'justify-between'],

      'items-start': ['items-center', 'items-end', 'items-stretch'],
      'items-center': ['items-start', 'items-end', 'items-stretch'],
      'items-end': ['items-start', 'items-center', 'items-stretch'],

      // 边距冲突
      'mx-auto': ['ml-auto', 'mr-auto'],
      'ml-auto': ['mx-auto'],
      'mr-auto': ['mx-auto'],

      // 定位冲突
      'left-1/2': ['left-0', 'left-auto'],
      'top-1/2': ['top-0', 'top-auto']
    };

    if (conflicts[newClass]) {
      conflicts[newClass].forEach(conflictClass => {
        if (element.classList.contains(conflictClass)) {
          element.classList.remove(conflictClass);
          this.logger.debug(`Removed conflicting class: ${conflictClass}`);
        }
      });
    }
  }

  /**
   * 移除居中相关的类
   */
  removeCenteringClasses(element) {
    const centeringClasses = [
      'text-center', 'justify-center', 'items-center', 'mx-auto',
      'left-1/2', 'top-1/2', '-translate-x-1/2', '-translate-y-1/2'
    ];

    centeringClasses.forEach(className => {
      element.classList.remove(className);
    });
  }

  /**
   * 检查是否为文本元素
   */
  isTextElement(element) {
    const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'em', 'strong', 'small'];
    return textTags.includes(element.tagName.toLowerCase());
  }

  /**
   * 检查是否为块级元素
   */
  isBlockElement(element) {
    const display = getComputedStyle(element).display;
    return display === 'block' || display === 'flex' || display === 'grid';
  }

  /**
   * 检查是否为Flex容器
   */
  isFlexContainer(element) {
    if (!element) return false;
    const display = getComputedStyle(element).display;
    return display === 'flex' || display === 'inline-flex' ||
           element.classList.contains('flex') || element.classList.contains('inline-flex');
  }

  /**
   * 检查是否有绝对定位
   */
  hasAbsolutePosition(element) {
    const position = getComputedStyle(element).position;
    return position === 'absolute' || position === 'fixed' ||
           element.classList.contains('absolute') || element.classList.contains('fixed');
  }

  /**
   * 检查是否有直接文本内容
   */
  hasDirectTextContent(element) {
    return Array.from(element.childNodes).some(node =>
      node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
  }

  /**
   * 获取建议的布局策略
   */
  suggestLayoutStrategy(element) {
    const context = this.analyzeLayoutContext(element);

    const suggestions = [];

    if (context.children.length > 0 && !context.isFlexContainer) {
      suggestions.push({
        type: 'flex-container',
        description: '转换为Flex容器以更好地控制子元素布局',
        apply: () => this.applyClasses(element, ['flex'])
      });
    }

    if (context.isTextElement && !element.classList.contains('text-center')) {
      suggestions.push({
        type: 'text-align',
        description: '为文本元素添加对齐样式',
        apply: () => this.applyClasses(element, ['text-center'])
      });
    }

    return suggestions;
  }

  /**
   * 应用Figma风格的Auto Layout
   */
  enableAutoLayout(element, direction = 'column') {
    this.logger.info(`Enabling auto layout: ${direction}`);

    const classes = ['flex'];

    switch (direction) {
      case 'horizontal':
        classes.push('flex-row');
        break;
      case 'vertical':
        classes.push('flex-col');
        break;
      case 'wrap':
        classes.push('flex-wrap');
        break;
    }

    this.applyClasses(element, classes);

    if (this.uiManager) {
      this.uiManager.syncTailwindStyles();
    }
  }

  /**
   * 重置元素布局
   */
  resetLayout(element) {
    this.logger.info('Resetting element layout');

    const layoutClasses = [
      // Display
      'flex', 'inline-flex', 'block', 'inline-block', 'grid',
      // Flex direction
      'flex-row', 'flex-col', 'flex-wrap',
      // Alignment
      'justify-start', 'justify-center', 'justify-end', 'justify-between',
      'items-start', 'items-center', 'items-end', 'items-stretch',
      // Text align
      'text-left', 'text-center', 'text-right',
      // Margin
      'mx-auto', 'ml-auto', 'mr-auto',
      // Position
      'absolute', 'relative', 'fixed',
      // Transform
      'transform', 'translate-x-1/2', 'translate-y-1/2', '-translate-x-1/2', '-translate-y-1/2',
      'left-1/2', 'top-1/2'
    ];

    layoutClasses.forEach(className => {
      element.classList.remove(className);
    });

    if (this.uiManager) {
      this.uiManager.syncTailwindStyles();
    }
  }
};