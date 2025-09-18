/**
 * UI管理模块 - 管理Shadow DOM和基础UI组件
 */
window.WVE = window.WVE || {};
window.WVE.UIManager = class UIManager {
  constructor() {
    this.logger = new window.WVE.Logger('UIManager');
    this.logger.info('Initializing UIManager');

    this.uiHost = null;
    this.uiRoot = null;
    this.selector = null;
  }

  /**
   * 初始化 Shadow DOM 宿主，扩展自身 UI 在此渲染，避免污染用户页面样式
   */
  initUIRoot() {
    if (this.uiRoot) {
      this.logger.debug('UI root already initialized');
      return;
    }

    this.logger.info('Initializing UI root with Shadow DOM');

    this.uiHost = document.createElement('div');
    this.uiHost.id = 'wve-host';
    // 将宿主作为 body 直接子元素，确保定位与 z-index 正常
    document.body.appendChild(this.uiHost);
    this.uiRoot = this.uiHost.attachShadow({ mode: 'open' });

    // 注入样式到 Shadow DOM
    this.injectStyles();
    // 尝试把页面中由 Tailwind CDN 生成的样式复制进 Shadow DOM，
    // 以便 Shadow 内的 UI 也能使用通用的 utility 类（Play CDN 不会自动作用于 ShadowRoot）。
    this.adoptTailwindStyles();

    // 设置动态任意值检测
    this.setupDynamicArbitraryValueDetection();

    this.logger.info('UI root initialized successfully');
  }

  /**
   * 注入样式到 Shadow DOM
   */
  injectStyles() {
    this.logger.debug('Injecting styles to Shadow DOM');

    const tailwindStyle = document.createElement('style');
    tailwindStyle.textContent = `
      /* 基础重置样式 - 必要的重置和兼容性样式 */
      *, ::before, ::after {
        box-sizing: border-box;
        border-width: 0;
        border-style: solid;
        border-color: #e5e7eb;
      }

      /* Tailwind CSS 变量定义 - 确保在 Shadow DOM 中可用 */
      :host {
        all: initial;
        zoom: 1 !important;
        --tw-border-spacing-x: 0;
        --tw-border-spacing-y: 0;
        --tw-translate-x: 0;
        --tw-translate-y: 0;
        --tw-rotate: 0;
        --tw-skew-x: 0;
        --tw-skew-y: 0;
        --tw-scale-x: 1;
        --tw-scale-y: 1;
        --tw-pan-x: ;
        --tw-pan-y: ;
        --tw-pinch-zoom: ;
        --tw-scroll-snap-strictness: proximity;
        --tw-ordinal: ;
        --tw-slashed-zero: ;
        --tw-numeric-figure: ;
        --tw-numeric-spacing: ;
        --tw-numeric-fraction: ;
        --tw-ring-inset: ;
        --tw-ring-offset-width: 0px;
        --tw-ring-offset-color: #fff;
        --tw-ring-color: rgb(59 130 246 / 0.5);
        --tw-ring-offset-shadow: 0 0 #0000;
        --tw-ring-shadow: 0 0 #0000;
        --tw-shadow: 0 0 #0000;
        --tw-shadow-colored: 0 0 #0000;
        --tw-blur: ;
        --tw-brightness: ;
        --tw-contrast: ;
        --tw-grayscale: ;
        --tw-hue-rotate: ;
        --tw-invert: ;
        --tw-saturate: ;
        --tw-sepia: ;
        --tw-drop-shadow: ;
        --tw-backdrop-blur: ;
        --tw-backdrop-brightness: ;
        --tw-backdrop-contrast: ;
        --tw-backdrop-grayscale: ;
        --tw-backdrop-hue-rotate: ;
        --tw-backdrop-invert: ;
        --tw-backdrop-opacity: ;
        --tw-backdrop-saturate: ;
        --tw-backdrop-sepia: ;
      }

      /* 组件特定样式 - 不依赖 Tailwind 的自定义样式 */
      #wve-floating-toolbar {
        font-family: var(--vscode-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial);
        font-size: 12px;
        zoom: 1 !important;
      }
      #wve-floating-toolbar.dragging {
        cursor: grabbing !important;
        transform: none !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        scale: 1.05;
      }
      .active {
        background-color: rgb(59 130 246) !important;
        color: #fff !important;
      }
      .wve-mode-radio {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
        pointer-events: none;
      }
      label[role="radio"] {
        cursor: pointer;
      }

      /* 图标样式 */
      [data-lucide], svg.lucide {
        display: inline-block;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        fill: none;
      }

      /* 测试面板样式 */
      #wve-icon-test-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        background: var(--vscode-editor-background,#fff);
        color: var(--vscode-foreground,#111);
        border-color: var(--vscode-widget-border,#e5e7eb);
        font-family: var(--vscode-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial);
        font-size: 12px;
      }
      #wve-icon-test-panel [data-lucide],
      #wve-icon-test-panel svg.lucide {
        width: 20px;
        height: 20px;
        color: #111;
        stroke: #111;
      }

      /* 表单元素重置 */
      button {
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: inherit;
        margin: 0;
        padding: 0;
        background: none;
        border: none;
        outline: none;
      }
      select {
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        color: inherit;
        margin: 0;
        outline: none;
      }
    `;
    this.uiRoot.appendChild(tailwindStyle);
  }

  /**
   * 复制 Tailwind CDN 生成的样式到 Shadow DOM
   * 注意：这是一个尽力而为的兼容方案，避免把整套 Tailwind 打包进扩展。
   */
  adoptTailwindStyles() {
    try {
      this.logger.info('Starting Tailwind styles adoption process');

      // 等待 Tailwind CDN 初始化完成，带超时机制
      const waitForTailwind = (maxRetries = 50) => {
        return new Promise((resolve, reject) => {
          let retryCount = 0;

          const checkTailwind = () => {
            if (window.tailwind) {
              this.logger.debug('Tailwind CDN detected');
              resolve();
              return;
            }

            retryCount++;
            if (retryCount >= maxRetries) {
              this.logger.warn('Tailwind CDN not detected after maximum retries');
              reject(new Error('Tailwind CDN not available'));
              return;
            }

            setTimeout(checkTailwind, 100);
          };

          checkTailwind();
        });
      };

      waitForTailwind()
        .then(() => {
          // 预先扫描已有内容中的任意值类
          this.scanExistingArbitraryClasses();

          // 强制触发 Tailwind 初始扫描
          this.triggerTailwindScan();

          // 多次尝试查找样式，因为 CDN 可能需要时间生成
          this.retryFindStyles(0);
        })
        .catch((error) => {
          this.logger.warn('Fallback: Using basic styles due to Tailwind CDN unavailable', error);
          // 如果 Tailwind CDN 不可用，确保基础样式仍然工作
        });
    } catch (e) {
      this.logger.warn('Failed to adopt Tailwind styles into Shadow DOM', e);
    }
  }

  /**
   * 触发 Tailwind 扫描
   */
  triggerTailwindScan() {
    try {
      // 检查Tailwind是否可用
      if (typeof window.tailwind === 'undefined') {
        this.logger.warn('Tailwind CDN not yet loaded, deferring scan');
        // 延迟重试
        setTimeout(() => this.triggerTailwindScan(), 100);
        return;
      }

      // 在主文档中添加一些 Tailwind 类，确保 CDN 生成这些样式
      this.addTailwindTriggerClasses();

      if (window.tailwind && typeof window.tailwind.refresh === 'function') {
        this.logger.debug('Triggering Tailwind refresh');
        window.tailwind.refresh();
      }

      // 如果有手动扫描方法，也尝试调用
      if (window.tailwind && typeof window.tailwind.scan === 'function') {
        window.tailwind.scan();
      }
    } catch (e) {
      this.logger.warn('Failed to trigger Tailwind scan', e);
    }
  }

  /**
   * 在主文档中添加触发类，让 Tailwind CDN 生成相应样式
   */
  addTailwindTriggerClasses() {
    if (this.triggerElement) {
      return; // 已经添加过了
    }

    // 创建一个隐藏的元素，包含我们需要的所有 Tailwind 类
    this.triggerElement = document.createElement('div');
    this.triggerElement.style.cssText = 'position: absolute; left: -9999px; top: -9999px; opacity: 0; pointer-events: none;';

    // 最小化触发元素，只保留容器
    this.triggerElement.innerHTML = `<div>
    </div>`;

    document.body.appendChild(this.triggerElement);
    this.logger.debug('Added Tailwind trigger classes to document');
  }

  /**
   * 重试查找 Tailwind 样式
   */
  retryFindStyles(attempt) {
    const maxAttempts = 5;
    const findTailwindStyles = () => {
      const styleNodes = Array.from(document.querySelectorAll('style'));
      const tailwindNodes = styleNodes.filter(s => {
        const content = s.textContent || '';

        // 检查是否包含实际的 Tailwind utility 类
        const hasUtilityClasses = content.includes('.flex{') ||
                                 content.includes('.bg-') ||
                                 content.includes('.text-') ||
                                 content.includes('.p-') ||
                                 content.includes('.m-') ||
                                 content.includes('.border{') ||
                                 content.includes('.rounded{') ||
                                 content.includes('.w-') ||
                                 content.includes('.h-') ||
                                 content.includes('.gap-') ||
                                 content.includes('.shadow') ||
                                 content.includes('.cursor-') ||
                                 content.includes('.transition');

        // 检查是否是 Tailwind 的基础样式或变量定义
        const hasTailwindBase = content.includes('*,::before,::after{box-sizing:border-box}') ||
                               content.includes('--tw-');

        return hasUtilityClasses || hasTailwindBase;
      });

      // 输出更详细的调试信息
      styleNodes.forEach((style, index) => {
        const content = style.textContent || '';
        const preview = content.substring(0, 200).replace(/\s+/g, ' ');
        this.logger.debug(`Style ${index + 1} (${content.length} chars): ${preview}...`);
      });

      this.logger.debug(`Found ${tailwindNodes.length} potential Tailwind style blocks on attempt ${attempt + 1}`);
      return tailwindNodes;
    };

    const tailwindNodes = findTailwindStyles();

    if (tailwindNodes.length > 0) {
      this.logger.info(`Successfully found Tailwind styles on attempt ${attempt + 1}`);
      this.injectTailwindStyles(tailwindNodes);
    } else if (attempt < maxAttempts) {
      this.logger.debug(`No Tailwind styles found on attempt ${attempt + 1}, retrying...`);
      setTimeout(() => {
        // 每次重试前都触发一次扫描
        this.triggerTailwindScan();
        this.retryFindStyles(attempt + 1);
      }, 200 * (attempt + 1)); // 递增延迟
    } else {
      this.logger.warn('Failed to find Tailwind styles after all attempts');
    }
  }

  /**
   * 将 Tailwind 样式注入到 Shadow DOM
   */
  injectTailwindStyles(tailwindNodes) {
    for (const source of tailwindNodes) {
      const clone = document.createElement('style');
      clone.setAttribute('data-source', 'tailwind-cdn');
      clone.textContent = source.textContent;
      this.uiRoot.appendChild(clone);

      // 监听源样式变化并同步（CDN 可能在运行时追加内容）
      const observer = new MutationObserver(() => {
        clone.textContent = source.textContent;
      });
      observer.observe(source, { characterData: true, childList: true, subtree: true });
    }

    this.logger.info(`Adopted ${tailwindNodes.length} Tailwind style blocks into Shadow DOM`);

    // 设置定期同步机制，确保新生成的样式能及时同步
    this.setupStyleSynchronization();

    // 输出调试信息
    // setTimeout(() => {
    //   this.debugStylesStatus();
    // }, 1000);
  }

  /**
   * 设置样式同步机制
   */
  setupStyleSynchronization() {
    // 注意：样式同步现在集成在动态任意值检测中，避免重复监听
    this.logger.debug('Style synchronization integrated with dynamic arbitrary value detection');
  }

  /**
   * 刷新 Tailwind 样式
   */
  refreshTailwindStyles() {
    try {
      if (window.tailwind && typeof window.tailwind.refresh === 'function') {
        // 扫描当前文档（包括 Shadow DOM）
        window.tailwind.refresh();

        // 重新查找并同步新生成的样式
        setTimeout(() => {
          const existingTailwindNodes = Array.from(this.uiRoot.querySelectorAll('style[data-source="tailwind-cdn"]'));
          const currentTailwindNodes = Array.from(document.querySelectorAll('style')).filter(s => {
            const content = s.textContent || '';
            return content.includes('--tw-') ||
                   content.includes('.flex{') ||
                   content.includes('.bg-') ||
                   content.includes('*,::before,::after{box-sizing:border-box}');
          });

          // 检查是否有新的样式需要同步
          for (const source of currentTailwindNodes) {
            const isAlreadySynced = existingTailwindNodes.some(existing =>
              existing.textContent === source.textContent
            );

            if (!isAlreadySynced) {
              const clone = document.createElement('style');
              clone.setAttribute('data-source', 'tailwind-cdn');
              clone.textContent = source.textContent;
              this.uiRoot.appendChild(clone);

              this.logger.debug('Synced new Tailwind styles to Shadow DOM');
            }
          }
        }, 50);
      }
    } catch (e) {
      this.logger.warn('Failed to refresh Tailwind styles', e);
    }
  }

  /**
   * 初始化选择器
   */
  initSelector() {
    this.logger.info('Initializing selector');

    this.selector = document.createElement('div');
    this.selector.id = 'wve-selector';
    this.selector.style.display = 'none';
    document.body.appendChild(this.selector);

    this.logger.debug('Selector initialized');
  }

  /**
   * 获取 UI Root
   */
  getUIRoot() {
    return this.uiRoot;
  }

  /**
   * 获取选择器
   */
  getSelector() {
    return this.selector;
  }

  /**
   * 手动触发 Tailwind 样式同步
   * 可供其他模块调用，确保动态添加的内容能正确应用样式
   */
  syncTailwindStyles(htmlContent = null) {
    this.logger.debug('Manual Tailwind style sync triggered');

    // 如果提供了HTML内容，直接检测其中的任意值类
    if (htmlContent) {
      this.detectAndGenerateArbitraryValues(htmlContent);
    }

    // 扫描当前Shadow DOM中的任意值类
    this.scanExistingArbitraryClasses();

    // 然后刷新样式
    this.refreshTailwindStyles();
  }

  /**
   * 手动生成任意值类的样式
   * @param {string} htmlContent - 包含任意值类的 HTML 内容
   */
  generateArbitraryStyles(htmlContent) {
    this.logger.debug('Manual arbitrary styles generation triggered');
    this.detectAndGenerateArbitraryValues(htmlContent);
  }

  /**
   * 动态检测并生成任意值的 Tailwind 类
   * @param {string} content - 包含 Tailwind 类的内容
   */
  detectAndGenerateArbitraryValues(content) {
    if (!content) return;

    // 匹配所有 Tailwind 类，包括任意值类和常规类（支持点号、冒号等）
    const allTailwindClassRegex = /\b[\w.:-]+(?:\[([^\]]+)\])?/g;
    const matches = content.match(allTailwindClassRegex) || [];

    // 调试：检查是否包含目标hover类
    if (content.includes('hover:bg-[#383838]')) {
      this.logger.info(`[DEBUG] Content contains hover:bg-[#383838], regex matches:`, matches.filter(m => m.includes('383838')));
    }

    if (matches.length === 0) return;

    this.logger.debug(`Detected Tailwind classes:`, matches);

    // 特别调试包含hover:bg-[#383838]的情况
    const hasTargetClass = matches.some(cls => cls.includes('hover:bg-[#383838]') || cls.includes('bg-[#383838]'));
    if (hasTargetClass) {
      this.logger.info('Found target hover:bg-[#383838] class, generating...');
    }

    // 检查 Tailwind CDN 是否可用
    if (!window.tailwind) {
      this.logger.warn('Tailwind CDN not available, deferring class generation');
      // 延迟重试
      setTimeout(() => {
        this.detectAndGenerateArbitraryValues(content);
      }, 500);
      return;
    }

    // 创建临时元素来触发这些类的生成
    const tempElement = document.createElement('div');
    tempElement.style.cssText = 'position: absolute; left: -9999px; top: -9999px; opacity: 0; pointer-events: none;';
    tempElement.className = matches.join(' ');

    document.body.appendChild(tempElement);

    // 对于有hover类的情况，模拟hover状态
    const hasHoverClasses = matches.some(cls => cls.startsWith('hover:'));
    if (hasHoverClasses) {
      // 创建一个实际的hover触发元素
      const hoverTrigger = document.createElement('div');
      hoverTrigger.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: auto;';
      hoverTrigger.className = matches.join(' ');
      document.body.appendChild(hoverTrigger);

      // 模拟鼠标悬停
      setTimeout(() => {
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        hoverTrigger.dispatchEvent(mouseEnterEvent);

        // 稍后移除悬停状态
        setTimeout(() => {
          const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
          hoverTrigger.dispatchEvent(mouseLeaveEvent);

          try {
            document.body.removeChild(hoverTrigger);
          } catch (e) {
            // 忽略错误
          }
        }, 50);
      }, 50);
    }

    // 触发 Tailwind 扫描
    if (typeof window.tailwind.refresh === 'function') {
      window.tailwind.refresh();
    }

    // 如果有scan方法也调用
    if (typeof window.tailwind.scan === 'function') {
      window.tailwind.scan();
    }

    // 延迟移除元素并同步样式，给 Tailwind 足够时间生成样式
    setTimeout(() => {
      try {
        document.body.removeChild(tempElement);
      } catch (e) {
        // 元素可能已经被移除了
      }
      this.refreshTailwindStyles();
    }, 300); // 增加延迟，确保样式生成完成
  }

  /**
   * 监听 Shadow DOM 内容变化，自动检测并生成任意值类
   */
  setupDynamicArbitraryValueDetection() {
    if (!this.uiRoot) return;

    const observer = new MutationObserver((mutations) => {
      const arbitraryClassesToGenerate = new Set();

      mutations.forEach((mutation) => {
        // 检查新增的节点
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.extractTailwindClasses(node, arbitraryClassesToGenerate);
          }
        });

        // 检查属性变化（特别是 class 属性）
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.nodeType === Node.ELEMENT_NODE) {
            this.extractTailwindClasses(target, arbitraryClassesToGenerate);
          }
        }
      });

      // 如果发现新的任意值类，生成它们
      if (arbitraryClassesToGenerate.size > 0) {
        const classesToGenerate = Array.from(arbitraryClassesToGenerate).join(' ');
        this.logger.debug('Auto-detected new arbitrary classes:', classesToGenerate);
        this.detectAndGenerateArbitraryValues(classesToGenerate);
      }
    });

    observer.observe(this.uiRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    this.dynamicArbitraryObserver = observer;
    this.logger.debug('Dynamic arbitrary value detection set up');

    // 立即扫描一次已有内容，确保初始化时的内容也被检测到
    setTimeout(() => {
      this.scanExistingArbitraryClasses();
    }, 0);
  }

  /**
   * 从元素及其后代中提取所有Tailwind类
   */
  extractTailwindClasses(element, classSet) {
    // 检查元素本身的类
    if (element.className) {
      const className = typeof element.className === 'string' ? element.className : element.className.toString();
      // 匹配所有可能的Tailwind类，包括带点号、冒号、任意值等
      const tailwindClassRegex = /\b[\w.:-]+(?:\[([^\]]+)\])?/g;
      const matches = className.match(tailwindClassRegex) || [];
      matches.forEach(cls => {
        // 过滤掉明显不是Tailwind的类（如ID选择器等）
        if (this.isTailwindClass(cls)) {
          classSet.add(cls);
        }
      });
    }

    // 递归检查所有后代元素
    const descendants = element.querySelectorAll('*[class]');
    descendants.forEach(desc => {
      if (desc.className) {
        const className = typeof desc.className === 'string' ? desc.className : desc.className.toString();
        const tailwindClassRegex = /\b[\w.:-]+(?:\[([^\]]+)\])?/g;
        const matches = className.match(tailwindClassRegex) || [];
        matches.forEach(cls => {
          if (this.isTailwindClass(cls)) {
            classSet.add(cls);
          }
        });
      }
    });
  }

  /**
   * 判断是否为Tailwind类
   */
  isTailwindClass(className) {
    // 处理伪类、响应式前缀等复合类
    let actualClass = className;
    const originalClass = className;

    // 移除所有修饰符前缀，获取基础类名
    const modifierPrefixes = [
      'hover:', 'focus:', 'active:', 'visited:', 'disabled:', 'checked:',
      'group-hover:', 'group-focus:', 'focus-within:', 'focus-visible:',
      'sm:', 'md:', 'lg:', 'xl:', '2xl:',
      'dark:', 'light:',
      'first:', 'last:', 'odd:', 'even:',
      'before:', 'after:'
    ];

    // 移除修饰符前缀
    for (const prefix of modifierPrefixes) {
      if (actualClass.startsWith(prefix)) {
        actualClass = actualClass.substring(prefix.length);
        break; // 只移除第一个匹配的前缀
      }
    }

    // 常见的Tailwind基础类前缀和模式
    const tailwindPrefixes = [
      'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-',
      'm-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-',
      'w-', 'h-', 'bg-', 'text-', 'border-', 'rounded',
      'flex', 'grid', 'block', 'inline', 'hidden',
      'absolute', 'relative', 'fixed', 'sticky',
      'top-', 'right-', 'bottom-', 'left-',
      'z-', 'opacity-', 'transform', 'transition',
      'duration-', 'ease-', 'delay-',
      'gap-', 'space-x-', 'space-y-',
      'shadow', 'cursor-', 'select-', 'pointer-events-',
      'overflow-', 'font-', 'leading-', 'tracking-',
      'items-', 'justify-', 'content-',
      'backdrop-blur'
    ];

    // 检查基础类是否匹配Tailwind前缀
    const matchesPrefix = tailwindPrefixes.some(prefix => actualClass.startsWith(prefix));

    // 检查是否为任意值类（包含方括号）
    const isArbitraryValue = /\[([^\]]+)\]/.test(actualClass);

    // 检查是否为纯色类名
    const isColorClass = /^(white|black|gray|red|blue|green|yellow|purple|pink|indigo)(-\d+)?$/.test(actualClass);

    // 检查是否为常见的独立类
    const standaloneClasses = [
      'flex', 'grid', 'block', 'inline', 'hidden', 'visible',
      'absolute', 'relative', 'fixed', 'sticky', 'static',
      'transform', 'transition', 'uppercase', 'lowercase', 'capitalize',
      'truncate', 'break-words', 'break-all'
    ];
    const isStandaloneClass = standaloneClasses.includes(actualClass);

    const result = matchesPrefix || isArbitraryValue || isColorClass || isStandaloneClass;

    // 调试特定类名
    if (originalClass.includes('hover:bg-[#383838]') || originalClass.includes('bg-[#383838]') || originalClass === 'hover:bg-[#383838]') {
      this.logger.info(`[DEBUG] Tailwind class check: "${originalClass}" -> "${actualClass}" -> ${result} (prefix:${matchesPrefix}, arbitrary:${isArbitraryValue}, color:${isColorClass}, standalone:${isStandaloneClass})`);
    }

    return result;
  }

  /**
   * 扫描现有内容中的Tailwind类并预先生成
   */
  scanExistingArbitraryClasses() {
    if (!this.uiRoot) return;

    this.logger.debug('Scanning existing Tailwind classes in Shadow DOM');

    const tailwindClasses = new Set();

    // 扫描Shadow DOM中已有的所有元素，包括根元素本身
    const allElements = this.uiRoot.querySelectorAll('*');

    // 还要扫描根元素的直接子元素的innerHTML内容
    allElements.forEach(element => {
      // 扫描元素的class属性
      if (element.className) {
        const className = typeof element.className === 'string' ? element.className : element.className.toString();
        const tailwindClassRegex = /\b[\w.:-]+(?:\[([^\]]+)\])?/g;
        const matches = className.match(tailwindClassRegex) || [];
        matches.forEach(cls => {
          if (this.isTailwindClass(cls)) {
            tailwindClasses.add(cls);
          }
        });
      }

      // 扫描元素的innerHTML中的Tailwind类（用于动态生成的HTML）
      if (element.innerHTML) {
        const htmlClassRegex = /\bclass\s*=\s*["']([^"']*)["']/g;
        let match;
        while ((match = htmlClassRegex.exec(element.innerHTML)) !== null) {
          const classAttr = match[1];
          const tailwindClassRegex = /\b[\w.:-]+(?:\[([^\]]+)\])?/g;
          const classMatches = classAttr.match(tailwindClassRegex) || [];
          classMatches.forEach(cls => {
            if (this.isTailwindClass(cls)) {
              tailwindClasses.add(cls);
            }
          });
        }
      }
    });

    if (tailwindClasses.size > 0) {
      const classesToGenerate = Array.from(tailwindClasses).join(' ');
      this.logger.info('Pre-generating Tailwind classes found in Shadow DOM:', Array.from(tailwindClasses));
      this.detectAndGenerateArbitraryValues(classesToGenerate);
    } else {
      this.logger.debug('No Tailwind classes found in existing Shadow DOM content');
    }
  }

  /**
   * 检查 Shadow DOM 中是否已有 Tailwind 样式
   */
  hasTailwindStyles() {
    return this.uiRoot && this.uiRoot.querySelectorAll('style[data-source="tailwind-cdn"]').length > 0;
  }

  /**
   * 调试方法：显示当前样式状态
   */
  debugStylesStatus() {
    const info = {
      tailwindAvailable: !!window.tailwind,
      tailwindConfig: window.tailwind?.config,
      documentStyles: document.querySelectorAll('style').length,
      shadowStyles: this.uiRoot ? this.uiRoot.querySelectorAll('style').length : 0,
      tailwindShadowStyles: this.uiRoot ? this.uiRoot.querySelectorAll('style[data-source="tailwind-cdn"]').length : 0
    };

    this.logger.info('Styles Debug Info:', info);

    // 列出文档中的所有样式标签
    const documentStyles = Array.from(document.querySelectorAll('style'));
    documentStyles.forEach((style, index) => {
      const content = style.textContent || '';
      const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      this.logger.debug(`Document Style ${index + 1}:`, preview);
    });

    // 列出 Shadow DOM 中的样式
    if (this.uiRoot) {
      const shadowStyles = Array.from(this.uiRoot.querySelectorAll('style'));
      shadowStyles.forEach((style, index) => {
        const content = style.textContent || '';
        const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        const source = style.getAttribute('data-source') || 'unknown';
        this.logger.debug(`Shadow Style ${index + 1} (${source}):`, preview);
      });
    }

    return info;
  }
};
