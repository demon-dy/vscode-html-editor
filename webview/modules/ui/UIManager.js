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
        color: var(--vscode-foreground, #111);
        background: var(--vscode-editor-background, #fff);
        border-color: var(--vscode-widget-border, #e5e7eb);
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

    // 添加常用的 Tailwind 类，触发 CDN 生成样式
    this.triggerElement.innerHTML = `
      <div class="flex flex-col grid items-center justify-center justify-between gap-1 gap-2 gap-4 gap-8">
        <div class="fixed absolute relative top-0 right-0 bottom-0 left-0 z-10 z-20 z-50">
          <div class="w-3 w-4 w-5 w-8 w-12 w-14 w-16 w-full w-auto h-3 h-4 h-5 h-8 h-12 h-14 h-16 h-full h-auto">
            <div class="p-0 p-1 p-2 p-3 p-4 px-1 px-2 px-3 px-4 py-1 py-2 py-3 py-4">
              <div class="m-0 m-1 m-2 m-3 m-4 mx-1 mx-2 mx-3 mx-4 my-1 my-2 my-3 my-4">
                <div class="rounded rounded-md rounded-lg rounded-full rounded-none border border-0 border-2">
                  <div class="border-gray-200 border-gray-300 border-blue-500 bg-white bg-gray-50 bg-gray-100 bg-gray-200">
                    <div class="bg-gray-800 bg-gray-900 bg-blue-500 bg-blue-600 bg-red-500 bg-green-500">
                      <div class="text-gray-400 text-gray-500 text-gray-600 text-gray-700 text-gray-800 text-gray-900">
                        <div class="text-white text-blue-500 text-red-500 text-green-500 text-xs text-sm text-base text-lg">
                          <div class="font-normal font-medium font-semibold font-bold cursor-pointer cursor-grab cursor-grabbing">
                            <div class="cursor-move cursor-default select-none pointer-events-none pointer-events-auto">
                              <div class="shadow shadow-sm shadow-md shadow-lg shadow-xl backdrop-blur-sm backdrop-blur">
                                <div class="transition transition-all transition-colors transition-transform duration-150 duration-200 duration-300">
                                  <div class="ease-in-out ease-out hover:bg-gray-50 hover:bg-gray-100 hover:bg-gray-200">
                                    <div class="hover:text-gray-600 hover:text-gray-700 hover:text-gray-800 hover:shadow-md hover:scale-105">
                                      <div class="focus:outline-none focus:ring-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        Content
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

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
    // 监听 Shadow DOM 内的变化，自动触发 Tailwind 重新扫描
    const shadowObserver = new MutationObserver(() => {
      // 当 Shadow DOM 内容发生变化时，延迟触发 Tailwind 重新扫描
      clearTimeout(this.syncTimeout);
      this.syncTimeout = setTimeout(() => {
        this.refreshTailwindStyles();
      }, 100);
    });

    shadowObserver.observe(this.uiRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    this.logger.debug('Style synchronization observer set up');
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
  syncTailwindStyles() {
    this.logger.debug('Manual Tailwind style sync triggered');
    this.refreshTailwindStyles();
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
