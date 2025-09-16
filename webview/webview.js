/**
 * WebView 主入口文件 - 模块化版本
 */

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

    logger.info('WebView initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize WebView:', error);
  }
});

// 导出全局实例供其他模块使用
window.WVE.app = () => webVisualEditor;