/**
 * 面板定位引擎 - 负责根据目标元素与视窗空间，计算面板最佳位置
 */
window.WVE = window.WVE || {};
window.WVE.PositioningEngine = class PositioningEngine {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.logger = new window.WVE.Logger('PositioningEngine');
  }

  /**
   * 计算面板位置
   * @param {DOMRect} targetRect 选中元素的边界（未缩放下）
   * @param {{width:number,height:number}} panelSize 面板尺寸
   * @param {DOMRect} viewport 视窗边界
   * @returns {{left:number, top:number}}
   */
  compute(targetRect, panelSize, viewport) {
    const zoom = parseFloat(this.stateManager?.zoom || '1');
    const rect = {
      left: targetRect.left * zoom,
      right: targetRect.right * zoom,
      top: targetRect.top * zoom,
      bottom: targetRect.bottom * zoom,
      width: targetRect.width * zoom,
      height: targetRect.height * zoom
    };

    const candidates = [
      // 1. 元素右侧，垂直居中
      { left: rect.right + 12, top: rect.top + (rect.height - panelSize.height) / 2 },
      // 2. 元素左侧，垂直居中
      { left: rect.left - panelSize.width - 12, top: rect.top + (rect.height - panelSize.height) / 2 },
      // 3. 元素上方，水平居中
      { left: rect.left + (rect.width - panelSize.width) / 2, top: rect.top - panelSize.height - 12 },
      // 4. 元素下方，水平居中
      { left: rect.left + (rect.width - panelSize.width) / 2, top: rect.bottom + 12 }
    ];

    for (const pos of candidates) {
      if (this.inViewport(pos, panelSize, viewport)) return this.snapToViewport(pos, panelSize, viewport);
    }

    // 5. 视窗中央
    const center = {
      left: viewport.left + (viewport.width - panelSize.width) / 2,
      top: viewport.top + (viewport.height - panelSize.height) / 2
    };
    return this.snapToViewport(center, panelSize, viewport);
  }

  inViewport(pos, size, viewport) {
    return (
      pos.left >= viewport.left &&
      pos.top >= viewport.top &&
      pos.left + size.width <= viewport.right &&
      pos.top + size.height <= viewport.bottom
    );
  }

  snapToViewport(pos, size, viewport) {
    return {
      left: Math.min(Math.max(pos.left, viewport.left + 8), viewport.right - size.width - 8),
      top: Math.min(Math.max(pos.top, viewport.top + 8), viewport.bottom - size.height - 8)
    };
  }
};

