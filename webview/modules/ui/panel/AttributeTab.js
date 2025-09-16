/**
 * 属性标签页 - 基础 HTML 属性控制
 */
window.WVE = window.WVE || {};
window.WVE.AttributeTab = class AttributeTab {
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
        <label class="w-14 text-gray-600">id</label>
        <input id="attrId" type="text" class="flex-1 px-2 py-1 text-xs bg-gray-100 rounded border-0" />
      </div>
      <div class="flex items-center gap-2">
        <label class="w-14 text-gray-600">class</label>
        <input id="attrClass" type="text" class="flex-1 px-2 py-1 text-xs bg-gray-100 rounded border-0" />
      </div>
      <div class="flex items-center gap-2">
        <label class="w-14 text-gray-600">title</label>
        <input id="attrTitle" type="text" class="flex-1 px-2 py-1 text-xs bg-gray-100 rounded border-0" />
      </div>
    `;
    this.el = wrap;
    return wrap;
  }

  bind(selectedEl) {
    if (!this.el || !selectedEl) return;
    const qs = id => this.el.querySelector('#' + id);
    qs('attrId').value = selectedEl.id || '';
    qs('attrClass').value = selectedEl.className || '';
    qs('attrTitle').value = selectedEl.getAttribute('title') || '';

    const apply = () => this.applyAttributes(selectedEl);
    ['attrId','attrClass','attrTitle'].forEach(id => qs(id).addEventListener('input', apply));
  }

  applyAttributes(el) {
    const qs = id => this.el.querySelector('#' + id);
    el.id = qs('attrId').value.trim();
    el.className = qs('attrClass').value.trim();
    const title = qs('attrTitle').value.trim();
    if (title) el.setAttribute('title', title); else el.removeAttribute('title');

    // 发出样式编辑（虽然是属性，但通过替换outerHTML应用）
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

