/**
 * DOM 工具函数模块
 */
window.WVE = window.WVE || {};
window.WVE.DOMUtils = {
  logger: new window.WVE.Logger('DOMUtils'),

  /**
   * 获取元素的简短名称
   */
  shortNameOf(el) {
    this.logger.debug('Getting short name for element:', el);
    return (
      el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
      + Array.from(el.classList).map(c => `.${c}`).join('')
    );
  },

  /**
   * 生成稳定的 CSS 路径（使用 :nth-child，避免类名变化影响）
   */
  pathOf(el) {
    try {
      const segments = [];
      let node = el;
      while (node && node.nodeType === 1 && node !== document.documentElement) {
        const parent = node.parentElement;
        const tag = node.tagName.toLowerCase();
        if (!parent) {
          segments.unshift(tag);
          break;
        }
        // 计算在父元素中的第几个子元素（仅元素节点）
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(node) + 1; // nth-child 从 1 开始
        segments.unshift(`${tag}:nth-child(${index})`);
        node = parent;
      }
      return segments.join(' > ');
    } catch (e) {
      this.logger.warn('Failed to build path for element', e);
      return '';
    }
  },

  /**
   * 获取真实位置坐标（考虑缩放）
   */
  realPositionOf(event, zoom = '1') {
    this.logger.debug('Calculating real position for event:', event, 'zoom:', zoom);

    // 处理 shadow DOM 下事件重定向
    const path = event.composedPath ? event.composedPath() : [];
    const isPluginUI = path.some(el =>
      el.id === 'wve-host' ||
      el.id === 'wve-selector' ||
      el.id === 'wve-floating-toolbar' ||
      el.id === 'wve-icon-test-panel'
    );

    if (isPluginUI) {
      return {
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY
      };
    }

    // 用户内容区域考虑缩放
    return Object.fromEntries(
      ['clientX', 'clientY', 'pageX', 'pageY'].map(
        key => [key, Math.round(event[key] / +zoom)]
      )
    );
  },

  /**
   * 检查元素是否在选择器范围内
   */
  isInSelector(element, selectorRect) {
    this.logger.debug('Checking if element is in selector:', element, selectorRect);

    const rect = element.getBoundingClientRect();
    return element !== document.body && !(
      selectorRect.right < rect.left ||
      rect.right < selectorRect.left ||
      selectorRect.bottom < rect.top ||
      rect.bottom < selectorRect.top
    ) && !(
      rect.left <= selectorRect.left &&
      selectorRect.right <= rect.right &&
      rect.top <= selectorRect.top &&
      selectorRect.bottom <= rect.bottom
    );
  },

  /**
   * 创建元素
   */
  createElement(tag, attributes = {}, styles = {}) {
    this.logger.debug('Creating element:', tag, attributes, styles);

    const element = document.createElement(tag);

    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    // 设置样式
    Object.entries(styles).forEach(([key, value]) => {
      element.style[key] = value;
    });

    return element;
  },

  /**
   * 安全地获取计算样式
   */
  getComputedStyleSafe(element, property) {
    try {
      if (typeof Element !== 'undefined' && 'computedStyleMap' in Element.prototype) {
        return element.computedStyleMap().get(property);
      } else {
        const computed = window.getComputedStyle(element);
        return { value: computed.getPropertyValue(property) };
      }
    } catch (error) {
      this.logger.error('Error getting computed style:', error);
      return { value: 'auto' };
    }
  }
};
