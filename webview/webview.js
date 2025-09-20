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

    // 检查并恢复保存的选择状态（WebView重新加载后）
    setTimeout(() => {
      restoreSelectionAfterReload();
    }, 1000); // 给其他组件足够的初始化时间

    // 添加调试面板（开发环境）
    // setTimeout(() => {
    //   createTailwindDebugPanel();
    // }, 2000);

    logger.info('WebView initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize WebView:', error);
  }
});

/**
 * WebView重新加载后恢复选择状态
 */
function restoreSelectionAfterReload() {
  const logger = new window.WVE.Logger('SelectionRestore');
  logger.info('===== SELECTION RESTORE AFTER RELOAD START =====');

  try {
    const storageKey = 'wve-preserved-selection';

    // 详细调试 sessionStorage 状态
    logger.info('SessionStorage debugging:');
    logger.info('  - Storage available:', typeof sessionStorage !== 'undefined');
    logger.info('  - Storage length:', sessionStorage.length);

    // 列出所有 sessionStorage 项目
    const allKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      allKeys.push(sessionStorage.key(i));
    }
    logger.info('  - All storage keys:', allKeys);

    const savedData = sessionStorage.getItem(storageKey);
    logger.info('  - Target key exists:', savedData !== null);
    logger.info('  - Saved data:', savedData);

    if (!savedData) {
      logger.info('No saved selection found - selection was not saved or was cleared');
      return;
    }

    const parsedData = JSON.parse(savedData);
    const ageMs = Date.now() - parsedData.timestamp;

    // 检查数据是否过期（超过10秒）
    if (ageMs > 10000) {
      logger.info(`Saved selection is too old (${ageMs}ms), ignoring`);
      sessionStorage.removeItem(storageKey);
      return;
    }

    logger.info(`Found saved selection data (${ageMs}ms old):`, parsedData);

    // 获取应用实例
    const app = window.WVE?.app?.();
    if (!app || !app.selectionManager) {
      logger.warn('App or SelectionManager not available for restoration');
      return;
    }

    // 尝试恢复选择
    let restoredCount = 0;
    for (const selectionData of parsedData.selections) {
      let targetElement = null;

      // 策略1: 通过 wveCodeStart 和 wveCodeEnd 查找
      if (selectionData.wveCodeStart && selectionData.wveCodeEnd) {
        targetElement = document.querySelector(`[data-wve-code-start="${selectionData.wveCodeStart}"][data-wve-code-end="${selectionData.wveCodeEnd}"]`);
        logger.info(`Search by code range [${selectionData.wveCodeStart}-${selectionData.wveCodeEnd}]:`, targetElement ? 'FOUND' : 'NOT FOUND');
      }

      // 策略2: 通过 wveId 查找
      if (!targetElement && selectionData.wveId) {
        targetElement = document.querySelector(`[data-wve-id="${selectionData.wveId}"]`);
        logger.info(`Search by wveId "${selectionData.wveId}":`, targetElement ? 'FOUND' : 'NOT FOUND');
      }

      // 策略3: 通过选择器查找
      if (!targetElement && selectionData.selector) {
        try {
          targetElement = document.querySelector(selectionData.selector);
          logger.info(`Search by selector "${selectionData.selector}":`, targetElement ? 'FOUND' : 'NOT FOUND');
        } catch (e) {
          logger.warn(`Invalid selector: ${selectionData.selector}`, e);
        }
      }

      // 恢复选择
      if (targetElement) {
        logger.info('Restoring selection for element:', targetElement);
        app.selectionManager.select(targetElement, true);
        restoredCount++;
      } else {
        logger.warn('Could not find element for restoration:', selectionData);
      }
    }

    logger.info(`Selection restoration completed: ${restoredCount}/${parsedData.selections.length} elements restored`);

    // 更新属性面板
    if (restoredCount > 0) {
      const selected = app.selectionManager.getSelected();
      if (selected.size > 0 && app.propertyPanel) {
        const lastSelected = Array.from(selected)[selected.size - 1];
        app.propertyPanel.updateForElement(lastSelected);
        logger.info('Property panel updated with restored selection');
      }
    }

    // 只有在成功恢复后才清除保存的数据
    if (restoredCount > 0) {
      sessionStorage.removeItem(storageKey);
      logger.info('Cleared saved selection data after successful restoration');
    } else {
      logger.warn('Did not clear saved selection data - restoration failed');
    }

  } catch (error) {
    logger.error('Error during selection restoration:', error);
  }
}

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