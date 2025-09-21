/**
 * 样式属性标签页区域
 * 重构后的版本，使用独立的区域组件：外观、填充、边框、特效、排版
 */
window.WVE = window.WVE || {};
window.WVE.StyleTabsSection = class StyleTabsSection extends window.WVE.PropertySectionBase {
  constructor(options = {}) {
    super({
      title: '样式属性 Style Properties',
      collapsed: false,
      className: 'style-tabs-section',
      ...options
    });

    this.currentElement = null;
    this.sectionComponents = {};
  }

  createContentElements(container) {
    container.innerHTML = '';

    // 创建各个区域组件
    this.createSectionComponents(container);

    this.injectStyles();
  }

  createSectionComponents(container) {
    // 创建外观区域
    this.sectionComponents.appearance = new window.WVE.AppearanceSection();
    if (!this.sectionComponents.appearance.element) {
      this.sectionComponents.appearance.createElement();
    }
    container.appendChild(this.sectionComponents.appearance.element);

    // 创建填充区域
    this.sectionComponents.fill = new window.WVE.FillSection();
    if (!this.sectionComponents.fill.element) {
      this.sectionComponents.fill.createElement();
    }
    container.appendChild(this.sectionComponents.fill.element);

    // 创建边框区域
    this.sectionComponents.stroke = new window.WVE.StrokeSection();
    if (!this.sectionComponents.stroke.element) {
      this.sectionComponents.stroke.createElement();
    }
    container.appendChild(this.sectionComponents.stroke.element);

    // 创建特效区域
    this.sectionComponents.effects = new window.WVE.EffectsSection();
    if (!this.sectionComponents.effects.element) {
      this.sectionComponents.effects.createElement();
    }
    container.appendChild(this.sectionComponents.effects.element);

    // 创建排版区域
    this.sectionComponents.typography = new window.WVE.TypographySection();
    if (!this.sectionComponents.typography.element) {
      this.sectionComponents.typography.createElement();
    }
    container.appendChild(this.sectionComponents.typography.element);

    // 监听各个组件的样式变更事件
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 监听样式变更事件，转发给父级
    document.addEventListener('wveStyleChange', (e) => {
      if (e.detail.source && e.detail.source.endsWith('Section')) {
        // 转发事件，标记来源为StyleTabsSection
        const newEvent = new CustomEvent('wveStyleChange', {
          detail: {
            ...e.detail,
            source: 'StyleTabsSection'
          }
        });
        document.dispatchEvent(newEvent);
      }
    });
  }

  /**
   * 更新组件以匹配当前元素
   */
  update(element) {
    super.update(element);
    this.currentElement = element;

    // 更新所有子组件
    Object.values(this.sectionComponents).forEach(component => {
      if (component && typeof component.update === 'function') {
        component.update(element);
      }
    });
  }


  injectStyles() {
    if (document.getElementById('style-tabs-styles')) return;

    const style = document.createElement('style');
    style.id = 'style-tabs-styles';
    style.textContent = `
      .style-tabs-section .section-content {
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      /* 整体布局 */
      .style-tabs-section .section-content > * {
        border-bottom: 1px solid #404040;
      }

      .style-tabs-section .section-content > *:last-child {
        border-bottom: none;
      }

      /* 滚动条样式 */
      .style-tabs-section .section-content::-webkit-scrollbar {
        width: 6px;
      }

      .style-tabs-section .section-content::-webkit-scrollbar-track {
        background: #2c2c2c;
      }

      .style-tabs-section .section-content::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 3px;
      }

      .style-tabs-section .section-content::-webkit-scrollbar-thumb:hover {
        background: #4a4a4a;
      }
    `;

    document.head.appendChild(style);
  }
};