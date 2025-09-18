/**
 * WebView 主入口文件 - 模块化版本
 */

// 全局配置
window.WVE = window.WVE || {};
window.WVE.config = {
  // 日志级别: 0=debug, 1=info, 2=warn, 3=error
  // 默认为 1 (info)，在开发时可以设置为 0 (debug)
  logLevel: 1, // 生产环境默认不显示 debug 日志

  // 其他配置...
  enableMovingElements: false,
  allowScript: false
};

// 获取 VSCode API
const vscode = acquireVsCodeApi();

// 全局编辑器实例
let webVisualEditor = null;

// 等待 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  const logger = new window.WVE.Logger('Main');
  logger.info('DOM content loaded, starting initialization');

  try {
    // 创建编辑器实例
    webVisualEditor = new window.WVE.WebVisualEditor();

    // 初始化编辑器
    await webVisualEditor.init();

    // 添加调试面板（开发环境）
    // setTimeout(() => {
    //   createTailwindDebugPanel();
    // }, 2000);

    logger.info('WebView initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize WebView:', error);
  }
});

// 导出全局实例供其他模块使用
window.WVE.app = () => webVisualEditor;

/**
 * 创建 Tailwind 调试面板
 */
function createTailwindDebugPanel() {
  const logger = new window.WVE.Logger('TailwindDebug');

  // 创建调试面板
  const debugPanel = document.createElement('div');
  debugPanel.id = 'tailwind-debug-panel';
  debugPanel.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    background: white;
    border: 2px solid #333;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    z-index: 999999;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  `;

  debugPanel.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">Tailwind Debug Panel</div>
    <button id="debug-close" style="float: right; margin-top: -30px;">×</button>
    <div id="debug-content">Loading...</div>
    <div style="margin-top: 10px;">
      <button id="debug-refresh">Refresh</button>
      <button id="debug-test">Test Styles</button>
      <button id="debug-trigger">Trigger Generate</button>
    </div>
  `;

  document.body.appendChild(debugPanel);

  // 关闭按钮
  document.getElementById('debug-close').onclick = () => {
    debugPanel.remove();
  };

  // 刷新按钮
  document.getElementById('debug-refresh').onclick = () => {
    updateDebugInfo();
  };

  // 测试样式按钮
  document.getElementById('debug-test').onclick = () => {
    testTailwindStyles();
  };

  // 触发生成按钮
  document.getElementById('debug-trigger').onclick = () => {
    triggerTailwindGeneration();
  };

  // 更新调试信息
  function updateDebugInfo() {
    const info = {
      tailwindAvailable: !!window.tailwind,
      tailwindMethods: window.tailwind ? Object.keys(window.tailwind) : [],
      documentStyles: document.querySelectorAll('style').length,
      uiManager: !!window.WVE?.app()?.uiManager,
      shadowRoot: !!window.WVE?.app()?.uiManager?.getUIRoot()
    };

    // 检查 Shadow DOM 中的样式
    const uiManager = window.WVE?.app()?.uiManager;
    if (uiManager) {
      const shadowRoot = uiManager.getUIRoot();
      info.shadowStyles = shadowRoot ? shadowRoot.querySelectorAll('style').length : 0;
      info.tailwindShadowStyles = shadowRoot ? shadowRoot.querySelectorAll('style[data-source="tailwind-cdn"]').length : 0;
    }

    const content = document.getElementById('debug-content');
    content.innerHTML = `
      <div><strong>Tailwind Available:</strong> ${info.tailwindAvailable}</div>
      <div><strong>Tailwind Methods:</strong> ${info.tailwindMethods.join(', ')}</div>
      <div><strong>Document Styles:</strong> ${info.documentStyles}</div>
      <div><strong>UI Manager:</strong> ${info.uiManager}</div>
      <div><strong>Shadow Root:</strong> ${info.shadowRoot}</div>
      <div><strong>Shadow Styles:</strong> ${info.shadowStyles || 0}</div>
      <div><strong>Tailwind Shadow Styles:</strong> ${info.tailwindShadowStyles || 0}</div>
    `;

    // 输出详细的 UI Manager 调试信息
    if (uiManager && typeof uiManager.debugStylesStatus === 'function') {
      uiManager.debugStylesStatus();
    }
  }

  // 测试 Tailwind 样式
  function testTailwindStyles() {
    const uiManager = window.WVE?.app()?.uiManager;
    if (!uiManager) {
      logger.warn('UI Manager not available');
      return;
    }

    const shadowRoot = uiManager.getUIRoot();
    if (!shadowRoot) {
      logger.warn('Shadow Root not available');
      return;
    }

    // 创建测试元素
    const testDiv = document.createElement('div');
    testDiv.innerHTML = `
      <div class="bg-blue-500 text-white p-4 rounded-lg m-2">
        Blue background test
      </div>
      <div class="flex gap-2 p-2">
        <div class="bg-red-500 w-4 h-4 rounded"></div>
        <div class="bg-green-500 w-4 h-4 rounded"></div>
        <div class="bg-yellow-500 w-4 h-4 rounded"></div>
      </div>
    `;
    testDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999998; background: white; border: 1px solid #ccc; padding: 10px;';

    shadowRoot.appendChild(testDiv);

    // 5秒后移除测试元素
    setTimeout(() => {
      if (testDiv.parentNode) {
        testDiv.remove();
      }
    }, 5000);

    logger.info('Test elements added to Shadow DOM');
  }

  // 触发 Tailwind 生成样式
  function triggerTailwindGeneration() {
    const uiManager = window.WVE?.app()?.uiManager;
    if (!uiManager) {
      logger.warn('UI Manager not available');
      return;
    }

    logger.info('Manually triggering Tailwind style generation...');

    // 强制触发 UI Manager 的样式同步
    if (typeof uiManager.syncTailwindStyles === 'function') {
      uiManager.syncTailwindStyles();
    }

    // 直接调用 Tailwind CDN 的方法
    if (window.tailwind) {
      if (typeof window.tailwind.refresh === 'function') {
        logger.info('Calling tailwind.refresh()');
        window.tailwind.refresh();
      }
      if (typeof window.tailwind.scan === 'function') {
        logger.info('Calling tailwind.scan()');
        window.tailwind.scan();
      }
    }

    // 延迟更新调试信息
    setTimeout(() => {
      updateDebugInfo();
      logger.info('Style generation triggered, check the updated info');
    }, 1000);
  }

  // 初始更新
  updateDebugInfo();

  logger.info('Tailwind debug panel created');
}