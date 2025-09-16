/**
 * 布局标签页 - 模式与基础 Flex 控制
 */
window.WVE = window.WVE || {};
window.WVE.LayoutTab = class LayoutTab {
  constructor(root, stateManager, eventManager) {
    this.root = root;
    this.stateManager = stateManager;
    this.eventManager = eventManager;
    this.el = null;
  }

  create() {
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-2 p-2';
    wrap.innerHTML = `
      <div class="flex items-center gap-2">
        <label class="w-14 text-gray-600">模式</label>
        <select id="layoutMode" class="px-2 py-1 text-xs bg-gray-100 rounded border-0">
          <option value="flow">文档流</option>
          <option value="flex">Flex</option>
          <option value="absolute">绝对定位</option>
        </select>
      </div>
      <div id="flexControls" class="flex items-center gap-2">
        <label class="w-14 text-gray-600">Flex</label>
        <select id="flexDirection" class="px-2 py-1 text-xs bg-gray-100 rounded border-0">
          <option value="row">row</option>
          <option value="column">column</option>
          <option value="row-reverse">row-reverse</option>
          <option value="column-reverse">column-reverse</option>
        </select>
        <select id="justifyContent" class="px-2 py-1 text-xs bg-gray-100 rounded border-0">
          <option value="flex-start">justify-start</option>
          <option value="center">center</option>
          <option value="flex-end">flex-end</option>
          <option value="space-between">space-between</option>
          <option value="space-around">space-around</option>
        </select>
        <select id="alignItems" class="px-2 py-1 text-xs bg-gray-100 rounded border-0">
          <option value="stretch">align-stretch</option>
          <option value="flex-start">flex-start</option>
          <option value="center">center</option>
          <option value="flex-end">flex-end</option>
        </select>
      </div>
      <div id="absoluteControls" class="flex items-center gap-2">
        <label class="w-14 text-gray-600">定位</label>
        <input id="top" placeholder="Top" type="number" class="w-16 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="right" placeholder="Right" type="number" class="w-16 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="bottom" placeholder="Bottom" type="number" class="w-16 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="left" placeholder="Left" type="number" class="w-16 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
      </div>
    `;
    this.el = wrap;
    return wrap;
  }

  bind(selectedEl) {
    if (!this.el || !selectedEl) return;
    const qs = id => this.el.querySelector('#' + id);

    const mode = this.detectMode(selectedEl);
    qs('layoutMode').value = mode;
    this.updateVisibility(mode);

    // flex
    qs('flexDirection').value = selectedEl.style.flexDirection || window.getComputedStyle(selectedEl).flexDirection || 'row';
    qs('justifyContent').value = selectedEl.style.justifyContent || window.getComputedStyle(selectedEl).justifyContent || 'flex-start';
    qs('alignItems').value = selectedEl.style.alignItems || window.getComputedStyle(selectedEl).alignItems || 'stretch';

    // absolute
    ['top','right','bottom','left'].forEach(p => {
      const v = window.getComputedStyle(selectedEl).getPropertyValue(p);
      qs(p).value = parseInt((v || '0').toString().replace('px','') || '0', 10);
    });

    qs('layoutMode').addEventListener('change', () => {
      const next = qs('layoutMode').value;
      this.applyMode(selectedEl, next);
      this.updateVisibility(next);
    });

    ['flexDirection','justifyContent','alignItems'].forEach(id => {
      qs(id).addEventListener('change', () => this.applyFlex(selectedEl));
    });

    ['top','right','bottom','left'].forEach(id => {
      qs(id).addEventListener('input', () => this.applyAbsolute(selectedEl));
    });
  }

  detectMode(el) {
    const cs = window.getComputedStyle(el);
    if (cs.position === 'absolute') return 'absolute';
    if (cs.display.includes('flex')) return 'flex';
    return 'flow';
  }

  updateVisibility(mode) {
    const show = (id, vis) => this.el.querySelector('#' + id).style.display = vis ? 'flex' : 'none';
    show('flexControls', mode === 'flex');
    show('absoluteControls', mode === 'absolute');
  }

  applyMode(el, mode) {
    if (mode === 'flow') {
      el.style.removeProperty('display');
      el.style.removeProperty('position');
    }
    if (mode === 'flex') {
      el.style.display = 'flex';
      el.style.removeProperty('position');
    }
    if (mode === 'absolute') {
      el.style.position = 'absolute';
      // 父元素自动 relative（简单实现，不弹窗）
      if (el.parentElement && window.getComputedStyle(el.parentElement).position === 'static') {
        el.parentElement.style.position = 'relative';
      }
    }
    this.emitEdit(el);
  }

  applyFlex(el) {
    const qs = id => this.el.querySelector('#' + id);
    el.style.display = 'flex';
    el.style.flexDirection = qs('flexDirection').value;
    el.style.justifyContent = qs('justifyContent').value;
    el.style.alignItems = qs('alignItems').value;
    this.emitEdit(el);
  }

  applyAbsolute(el) {
    const qs = id => this.el.querySelector('#' + id);
    el.style.position = 'absolute';
    ['top','right','bottom','left'].forEach(p => {
      const val = parseInt(qs(p).value, 10);
      if (Number.isFinite(val)) el.style[p] = val + 'px';
    });
    this.emitEdit(el);
  }

  emitEdit(el) {
    const style = el.getAttribute('style') || '';
    const operation = { type: 'style', style };
    const sm = this.stateManager;
    const updated = sm.codeEdits.some(edit => {
      if (edit.element === el) { edit.operations.push(operation); return true; }
    });
    if (!updated) sm.addCodeEdit({ element: el, operations: [operation] });
    this.eventManager.emitCodeEdits(new Set([el]), sm.codeEdits);
  }
};

