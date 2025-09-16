/**
 * 编辑器样式管理模块 - 负责注入编辑模式下的悬浮与选中样式
 */
window.WVE = window.WVE || {};
window.WVE.EditorStyleManager = class EditorStyleManager {
  constructor() {
    this.logger = new window.WVE.Logger('EditorStyleManager');
    this.styleElement = null;
  }

  init() {
    if (this.styleElement) {
      this.logger.debug('Editor overlay styles already initialized');
      return;
    }

    this.logger.info('Injecting editor overlay styles');

    const style = document.createElement('style');
    style.id = 'wve-editor-overlays';
    style.textContent = `
      @layer user-style, wve-overlays;

      @layer wve-overlays {
        :root {
          --wve-zoom: 1;
        }

        html,
        body {
          overflow: auto;
          inset: auto;
          opacity: initial;
          visibility: visible;
          transform: none;
          transform-style: flat;
          transition: none;
          animation: none;
        }

        html { margin: 0; }

        body { position: relative; }

        body > *:not(#wve-host):not(#wve-selector) {
          zoom: var(--wve-zoom);
        }

        #wve-host,
        #wve-selector,
        #wve-floating-toolbar,
        #wve-icon-test-panel {
          zoom: 1 !important;
        }

        body.wve-edit-mode {
          cursor: default;
        }

        body.wve-edit-mode :hover:not(:has(:hover), [wve-selected], #wve-floating-toolbar, #wve-floating-toolbar *, #wve-icon-test-panel, #wve-icon-test-panel *, #wve-selector, #wve-selector *) {
          box-shadow: inset 0 0 0 max(100vh, 100vw) color-mix(in srgb, currentColor, transparent 90%);
        }

        [wve-selected] {
          box-shadow: 0 0 0 2px color-mix(in srgb, currentColor, transparent 30%);
        }

        [wve-selected][wve-movable] {
          cursor: grab;
          box-shadow: 0 0 0 2px var(--vscode-editorWarning-foreground);
        }

        [wve-selected][wve-movable]:active {
          cursor: grabbing;
        }

        [wve-selected] * {
          pointer-events: none;
        }

        .wve-adding-selection,
        .wve-adding-selection :not([id^=wve-], [id^=wve-] *) {
          cursor: copy !important;
        }

        #wve-selector {
          all: unset;
          box-sizing: border-box;
          position: absolute;
          width: 0;
          height: 0;
          background-color: oklch(50% 0 0 / 0.15);
          box-shadow: 0 0 0 1px var(--vscode-editorWarning-foreground);
        }

        body.wve-preview-mode [wve-selected],
        body.wve-preview-mode :where(:hover) {
          box-shadow: none !important;
        }
      }
    `;

    document.head.appendChild(style);
    this.styleElement = style;
  }
};
