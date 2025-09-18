/**
 * 布局操作映射配置 - 定义Figma风格操作到CSS实现的映射规则
 */
window.WVE = window.WVE || {};
window.WVE.LayoutMappings = {

  /**
   * 对齐操作映射
   * 每个操作包含多种实现策略，系统会根据上下文自动选择最合适的策略
   */
  alignmentMappings: {
    'align-left': {
      textElement: {
        classes: ['text-left'],
        removes: ['text-center', 'text-right']
      },
      flexChild: {
        parentClasses: ['justify-start'],
        parentRemoves: ['justify-center', 'justify-end', 'justify-between']
      },
      blockElement: {
        removes: ['mx-auto', 'ml-auto', 'text-center'],
        classes: ['text-left']
      },
      default: {
        classes: ['text-left']
      }
    },

    'align-center-horizontal': {
      textElement: {
        classes: ['text-center'],
        removes: ['text-left', 'text-right']
      },
      flexChild: {
        parentClasses: ['justify-center'],
        parentRemoves: ['justify-start', 'justify-end', 'justify-between']
      },
      blockElement: {
        classes: ['mx-auto'],
        removes: ['ml-auto', 'mr-auto']
      },
      absoluteElement: {
        classes: ['left-1/2', '-translate-x-1/2', 'transform'],
        removes: ['left-0', 'left-auto', 'right-0', 'right-auto']
      },
      default: {
        classes: ['flex', 'justify-center']
      }
    },

    'align-right': {
      textElement: {
        classes: ['text-right'],
        removes: ['text-left', 'text-center']
      },
      flexChild: {
        parentClasses: ['justify-end'],
        parentRemoves: ['justify-start', 'justify-center', 'justify-between']
      },
      blockElement: {
        classes: ['ml-auto'],
        removes: ['mx-auto', 'mr-auto']
      },
      default: {
        classes: ['text-right']
      }
    },

    'align-top': {
      flexChild: {
        parentClasses: ['items-start'],
        parentRemoves: ['items-center', 'items-end', 'items-stretch']
      },
      absoluteElement: {
        classes: ['top-0'],
        removes: ['top-1/2', '-translate-y-1/2', 'bottom-0']
      },
      default: {
        removes: ['items-center', 'items-end']
      }
    },

    'align-center-vertical': {
      flexChild: {
        parentClasses: ['items-center'],
        parentRemoves: ['items-start', 'items-end', 'items-stretch']
      },
      absoluteElement: {
        classes: ['top-1/2', '-translate-y-1/2', 'transform'],
        removes: ['top-0', 'top-auto', 'bottom-0', 'bottom-auto']
      },
      default: {
        classes: ['flex', 'items-center']
      }
    },

    'align-bottom': {
      flexChild: {
        parentClasses: ['items-end'],
        parentRemoves: ['items-start', 'items-center', 'items-stretch']
      },
      absoluteElement: {
        classes: ['bottom-0'],
        removes: ['top-1/2', '-translate-y-1/2', 'top-0']
      },
      default: {
        classes: ['self-end']
      }
    }
  },

  /**
   * 布局模式映射
   */
  layoutModes: {
    'auto-layout-horizontal': {
      classes: ['flex', 'flex-row'],
      removes: ['flex-col', 'block', 'inline-block']
    },
    'auto-layout-vertical': {
      classes: ['flex', 'flex-col'],
      removes: ['flex-row', 'block', 'inline-block']
    },
    'auto-layout-wrap': {
      classes: ['flex', 'flex-wrap'],
      removes: ['flex-col', 'block', 'inline-block']
    },
    'grid-layout': {
      classes: ['grid'],
      removes: ['flex', 'block', 'inline-block']
    },
    'block-layout': {
      classes: ['block'],
      removes: ['flex', 'grid', 'inline-block']
    }
  },

  /**
   * 尺寸模式映射
   */
  sizingModes: {
    'hug-contents': {
      width: {
        classes: ['w-fit'],
        removes: ['w-full', 'w-auto'],
        styles: { width: 'fit-content' }
      },
      height: {
        classes: ['h-fit'],
        removes: ['h-full', 'h-auto'],
        styles: { height: 'fit-content' }
      }
    },
    'fill-container': {
      width: {
        classes: ['w-full'],
        removes: ['w-fit', 'w-auto']
      },
      height: {
        classes: ['h-full'],
        removes: ['h-fit', 'h-auto']
      }
    },
    'fixed-size': {
      // 固定尺寸需要具体的像素值，由调用方提供
    }
  },

  /**
   * 间距映射
   */
  spacingMappings: {
    gap: {
      // Tailwind gap classes mapping
      0: 'gap-0',
      4: 'gap-1',
      8: 'gap-2',
      12: 'gap-3',
      16: 'gap-4',
      20: 'gap-5',
      24: 'gap-6',
      32: 'gap-8',
      40: 'gap-10',
      48: 'gap-12'
    },
    padding: {
      // Tailwind padding classes mapping
      0: 'p-0',
      4: 'p-1',
      8: 'p-2',
      12: 'p-3',
      16: 'p-4',
      20: 'p-5',
      24: 'p-6',
      32: 'p-8',
      40: 'p-10',
      48: 'p-12'
    },
    margin: {
      // Tailwind margin classes mapping
      0: 'm-0',
      4: 'm-1',
      8: 'm-2',
      12: 'm-3',
      16: 'm-4',
      20: 'm-5',
      24: 'm-6',
      32: 'm-8',
      40: 'm-10',
      48: 'm-12'
    }
  },

  /**
   * 上下文检测规则
   */
  contextRules: {
    isTextElement: (element) => {
      const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'em', 'strong', 'small', 'label'];
      return textTags.includes(element.tagName.toLowerCase());
    },

    hasTextContent: (element) => {
      return Array.from(element.childNodes).some(node =>
        node.nodeType === Node.TEXT_NODE && node.textContent.trim()
      );
    },

    isFlexChild: (element) => {
      const parent = element.parentElement;
      if (!parent) return false;
      const parentDisplay = getComputedStyle(parent).display;
      return parentDisplay === 'flex' || parentDisplay === 'inline-flex' ||
             parent.classList.contains('flex') || parent.classList.contains('inline-flex');
    },

    isBlockElement: (element) => {
      const display = getComputedStyle(element).display;
      return display === 'block' || display === 'flex' || display === 'grid';
    },

    hasAbsolutePosition: (element) => {
      const position = getComputedStyle(element).position;
      return position === 'absolute' || position === 'fixed' ||
             element.classList.contains('absolute') || element.classList.contains('fixed');
    },

    isFlexContainer: (element) => {
      const display = getComputedStyle(element).display;
      return display === 'flex' || display === 'inline-flex' ||
             element.classList.contains('flex') || element.classList.contains('inline-flex');
    }
  },

  /**
   * 冲突解决规则
   */
  conflictResolution: {
    // 文本对齐冲突
    textAlign: {
      'text-left': ['text-center', 'text-right', 'text-justify'],
      'text-center': ['text-left', 'text-right', 'text-justify'],
      'text-right': ['text-left', 'text-center', 'text-justify'],
      'text-justify': ['text-left', 'text-center', 'text-right']
    },

    // Flex对齐冲突
    justifyContent: {
      'justify-start': ['justify-center', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly'],
      'justify-center': ['justify-start', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly'],
      'justify-end': ['justify-start', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly'],
      'justify-between': ['justify-start', 'justify-center', 'justify-end', 'justify-around', 'justify-evenly']
    },

    alignItems: {
      'items-start': ['items-center', 'items-end', 'items-stretch', 'items-baseline'],
      'items-center': ['items-start', 'items-end', 'items-stretch', 'items-baseline'],
      'items-end': ['items-start', 'items-center', 'items-stretch', 'items-baseline'],
      'items-stretch': ['items-start', 'items-center', 'items-end', 'items-baseline']
    },

    // Display冲突
    display: {
      'flex': ['block', 'inline-block', 'grid', 'inline'],
      'block': ['flex', 'inline-block', 'grid', 'inline'],
      'grid': ['flex', 'block', 'inline-block', 'inline'],
      'inline-block': ['flex', 'block', 'grid', 'inline']
    },

    // 定位冲突
    position: {
      'absolute': ['relative', 'static', 'fixed'],
      'relative': ['absolute', 'static', 'fixed'],
      'fixed': ['absolute', 'relative', 'static'],
      'static': ['absolute', 'relative', 'fixed']
    },

    // 边距冲突
    margin: {
      'mx-auto': ['ml-auto', 'mr-auto', 'ml-0', 'mr-0'],
      'ml-auto': ['mx-auto', 'mr-auto'],
      'mr-auto': ['mx-auto', 'ml-auto']
    }
  },

  /**
   * 智能建议规则
   */
  suggestions: {
    // 当元素有子元素但不是flex容器时，建议转换为flex
    flexContainerSuggestion: {
      condition: (element, context) => {
        return context.children.length > 0 && !context.isFlexContainer;
      },
      suggestion: {
        type: 'layout',
        message: '建议将此元素转换为Flex容器以更好地控制子元素布局',
        action: 'enable-flex',
        classes: ['flex']
      }
    },

    // 当文本元素没有对齐样式时，建议添加
    textAlignSuggestion: {
      condition: (element, context) => {
        return (context.isTextElement || context.hasTextContent) &&
               !element.classList.contains('text-left') &&
               !element.classList.contains('text-center') &&
               !element.classList.contains('text-right');
      },
      suggestion: {
        type: 'text-align',
        message: '建议为文本元素添加对齐样式',
        action: 'add-text-align',
        classes: ['text-left']
      }
    },

    // 当元素需要居中但缺少必要的上下文时
    centeringSuggestion: {
      condition: (element, context) => {
        return !context.parentIsFlexContainer && !context.hasAbsolutePosition;
      },
      suggestion: {
        type: 'centering-context',
        message: '为了更好的居中效果，建议父容器使用Flex布局',
        action: 'enable-parent-flex',
        targetParent: true,
        classes: ['flex']
      }
    }
  },

  /**
   * 获取最佳映射策略
   */
  getBestMapping(operation, context) {
    const mapping = this.alignmentMappings[operation];
    if (!mapping) return null;

    // 按优先级检查上下文
    if (context.hasAbsolutePosition && mapping.absoluteElement) {
      return mapping.absoluteElement;
    }
    if (context.isTextElement && mapping.textElement) {
      return mapping.textElement;
    }
    if (context.parentIsFlexContainer && mapping.flexChild) {
      return mapping.flexChild;
    }
    if (context.isBlockElement && mapping.blockElement) {
      return mapping.blockElement;
    }

    return mapping.default;
  },

  /**
   * 获取冲突的类名
   */
  getConflictingClasses(className) {
    for (const [category, conflicts] of Object.entries(this.conflictResolution)) {
      if (conflicts[className]) {
        return conflicts[className];
      }
    }
    return [];
  },

  /**
   * 获取建议
   */
  getSuggestions(element, context) {
    const suggestions = [];

    for (const [name, rule] of Object.entries(this.suggestions)) {
      if (rule.condition(element, context)) {
        suggestions.push({
          name,
          ...rule.suggestion
        });
      }
    }

    return suggestions;
  },

  /**
   * 将像素值转换为最接近的Tailwind值
   */
  convertPixelsToTailwind(pixels, type = 'spacing') {
    const mapping = this.spacingMappings[type];
    if (!mapping) return null;

    // 找到最接近的值
    const availableValues = Object.keys(mapping).map(Number).sort((a, b) => a - b);
    let closest = availableValues[0];
    let minDiff = Math.abs(pixels - closest);

    for (const value of availableValues) {
      const diff = Math.abs(pixels - value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = value;
      }
    }

    return mapping[closest];
  },

  /**
   * 生成自定义CSS变量
   */
  generateCustomCSS(property, value, unit = 'px') {
    return {
      variable: `--${property}-custom`,
      value: `${value}${unit}`,
      className: `${property}-custom`,
      style: `${property}: var(--${property}-custom)`
    };
  }
};