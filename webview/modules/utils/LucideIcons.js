/**
 * Lucide 图标管理模块
 */
window.WVE = window.WVE || {};
window.WVE.LucideIcons = {
  logger: new window.WVE.Logger('LucideIcons'),

  /**
   * 初始化 Lucide 图标
   */
  initialize() {
    this.logger.info('Initializing Lucide icons');

    // 等待 Lucide 库加载完成
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      try {
        // 显式传入内置图标表，避免某些打包环境下的默认导出解析问题
        if (lucide.icons) {
          lucide.createIcons({ icons: lucide.icons });
        } else {
          lucide.createIcons();
        }

        // 二次运行，确保动态插入的节点也被替换
        setTimeout(() => {
          try {
            if (lucide.icons) {
              lucide.createIcons({ icons: lucide.icons });
            } else {
              lucide.createIcons();
            }
            this.logger.debug('Lucide icons initialized successfully (second pass)');
          } catch (error) {
            this.logger.warn('Second pass lucide initialization failed:', error);
          }
        }, 300);

        this.logger.info('Lucide icons initialized successfully');
      } catch (error) {
        this.logger.warn('Lucide initialization failed, retrying...', error);
        // 轻量容错：稍后再试
        setTimeout(() => this.initialize(), 150);
      }
    } else {
      // 如果库还没加载，延迟初始化
      this.logger.debug('Lucide not ready, retrying in 100ms');
      setTimeout(() => this.initialize(), 100);
    }
  },

  /**
   * 在指定根节点内替换 data-lucide 元素为 SVG（适配 Shadow DOM）
   */
  replaceInRoot(root) {
    try {
      this.logger.debug('Replacing lucide icons in root:', root);

      if (!root) return;
      const nodes = root.querySelectorAll('[data-lucide]');
      if (!nodes.length) return;

      const icons = (typeof lucide !== 'undefined' && lucide.icons) ? lucide.icons : null;
      if (!icons) return;

      const toPascal = (name) => name
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join('');

      const NS = 'http://www.w3.org/2000/svg';

      nodes.forEach(el => {
        const rawName = el.getAttribute('data-lucide');
        if (!rawName) return;

        const iconDef = icons[toPascal(rawName)];
        if (!iconDef) return;

        const svg = document.createElementNS(NS, 'svg');
        // 默认属性，与 lucide 保持一致
        svg.setAttribute('xmlns', NS);
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('data-lucide', rawName);

        const cls = ['lucide', `lucide-${rawName}`].concat((el.getAttribute('class') || '').split(/\s+/).filter(Boolean));
        svg.setAttribute('class', cls.join(' '));

        // 构建子元素
        iconDef.forEach(([tag, attrs]) => {
          const child = document.createElementNS(NS, tag);
          Object.entries(attrs).forEach(([k, v]) => child.setAttribute(k, String(v)));
          svg.appendChild(child);
        });

        el.parentNode && el.parentNode.replaceChild(svg, el);
      });

      this.logger.debug(`Replaced ${nodes.length} lucide icons in root`);
    } catch (error) {
      this.logger.error('Error replacing lucide icons:', error);
    }
  }
};