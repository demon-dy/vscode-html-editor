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

    // 注入 Tailwind CSS 到 Shadow DOM
    this.injectStyles();

    this.logger.info('UI root initialized successfully');
  }

  /**
   * 注入样式到 Shadow DOM
   */
  injectStyles() {
    this.logger.debug('Injecting styles to Shadow DOM');

    const tailwindStyle = document.createElement('style');
    tailwindStyle.textContent = `
      /* Tailwind CSS Reset and Utilities for Shadow DOM */
      *, ::before, ::after {
        box-sizing: border-box;
        border-width: 0;
        border-style: solid;
        border-color: #e5e7eb;
      }

      /* Utility Classes */
      .fixed { position: fixed; }
      .bottom-5 { bottom: 1.25rem; }
      .z-50 { z-index: 50; }
      .flex { display: flex; }
      .items-center { align-items: center; }
      .justify-center { justify-content: center; }
      .gap-1 { gap: 0.25rem; }
      .gap-2 { gap: 0.5rem; }
      .gap-8 { gap: 2rem; }
      .rounded { border-radius: 0.25rem; }
      .rounded-md { border-radius: 0.375rem; }
      .rounded-full { border-radius: 9999px; }
      .rounded-12 { border-radius: 0.75rem; }
      .bg-white { background-color: rgb(255 255 255); }
      .bg-gray-100 { background-color: rgb(243 244 246); }
      .bg-gray-200 { background-color: rgb(229 231 235); }
      .border { border-width: 1px; }
      .border-0 { border-width: 0px; }
      .border-gray-200 { border-color: rgb(229 231 235); }
      .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
      .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
      .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .p-1 { padding: 0.25rem; }
      .w-3 { width: 0.75rem; }
      .w-4 { width: 1rem; }
      .w-5 { width: 1.25rem; }
      .w-8 { width: 2rem; }
      .h-3 { height: 0.75rem; }
      .h-4 { height: 1rem; }
      .h-5 { height: 1.25rem; }
      .h-8 { height: 2rem; }
      .text-xs { font-size: 0.75rem; line-height: 1rem; }
      .text-gray-500 { color: rgb(107 114 128); }
      .text-gray-600 { color: rgb(75 85 99); }
      .text-gray-800 { color: rgb(31 41 55); }
      .font-medium { font-weight: 500; }
      .cursor-pointer { cursor: pointer; }
      .cursor-grab { cursor: grab; }
      .cursor-grabbing { cursor: grabbing; }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
      .backdrop-blur-sm { backdrop-filter: blur(4px); }
      .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .hover\\:bg-gray-100:hover { background-color: rgb(243 244 246); }
      .hover\\:bg-gray-200:hover { background-color: rgb(229 231 235); }
      .hover\\:text-gray-800:hover { color: rgb(31 41 55); }
      .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
      .focus\\:ring-2:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
      .focus\\:ring-blue-500:focus { --tw-ring-color: rgb(59 130 246); }

      /* Component Styles */
      :host {
        all: initial;
        zoom: 1 !important;
      }
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
      .active { background-color: rgb(59 130 246) !important; color: #fff !important; }
      [data-lucide], svg.lucide {
        display: inline-block;
        stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; fill: none;
      }
      #wve-icon-test-panel {
        position: fixed; top: 20px; right: 20px; z-index: 2147483647;
        background: var(--vscode-editor-background,#fff); color: var(--vscode-foreground,#111);
        border-color: var(--vscode-widget-border,#e5e7eb);
        font-family: var(--vscode-font-family, system-ui, -apple-system, Segoe UI, Roboto, Arial); font-size: 12px;
      }
      #wve-icon-test-panel [data-lucide], #wve-icon-test-panel svg.lucide {
        width: 20px; height: 20px; color: #111; stroke: #111;
      }

      /* Button and Input Styles */
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
};