/**
 * 样式标签页 - 颜色与尺寸基础控制
 */
window.WVE = window.WVE || {};
window.WVE.StyleTab = class StyleTab {
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
        <label class="w-14 text-gray-600">背景</label>
        <input id="bgColor" type="color" class="w-8 h-8 rounded border border-gray-200" />
        <input id="bgColorText" type="text" class="flex-1 px-2 py-1 text-xs bg-gray-100 rounded border-0" placeholder="#ffffff" />
      </div>
      <div class="flex items-center gap-2">
        <label class="w-14 text-gray-600">文本</label>
        <input id="textColor" type="color" class="w-8 h-8 rounded border border-gray-200" />
        <input id="textColorText" type="text" class="flex-1 px-2 py-1 text-xs bg-gray-100 rounded border-0" placeholder="#111111" />
      </div>
      <div class="grid" style="grid-template-columns: 3.5rem repeat(4, 1fr); gap: .5rem; align-items: center;">
        <label class="text-gray-600">尺寸</label>
        <div class="flex items-center gap-1"><span class="text-xs text-gray-500">W</span><input id="width" type="number" class="w-16 px-1 py-1 text-xs bg-gray-100 rounded border-0" /></div>
        <div class="flex items-center gap-1"><span class="text-xs text-gray-500">H</span><input id="height" type="number" class="w-16 px-1 py-1 text-xs bg-gray-100 rounded border-0" /></div>
        <div class="flex items-center gap-1"><span class="text-xs text-gray-500">Px</span><select id="sizeUnit" class="px-1 py-1 text-xs bg-gray-100 rounded border-0"><option>px</option></select></div>
      </div>
      <div class="grid" style="grid-template-columns: 3.5rem repeat(4, 1fr); gap: .5rem; align-items: center;">
        <label class="text-gray-600">外边距</label>
        <input id="marginTop" placeholder="T" type="number" class="w-14 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="marginRight" placeholder="R" type="number" class="w-14 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="marginBottom" placeholder="B" type="number" class="w-14 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="marginLeft" placeholder="L" type="number" class="w-14 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
      </div>
      <div class="grid" style="grid-template-columns: 3.5rem repeat(4, 1fr); gap: .5rem; align-items: center;">
        <label class="text-gray-600">内边距</label>
        <input id="paddingTop" placeholder="T" type="number" class="w-14 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="paddingRight" placeholder="R" type="number" class="w-14 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="paddingBottom" placeholder="B" type="number" class="w-14 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
        <input id="paddingLeft" placeholder="L" type="number" class="w-14 px-1 py-1 text-xs bg-gray-100 rounded border-0" />
      </div>
    `;
    this.el = wrap;
    return wrap;
  }

  /**
   * 绑定事件并填充初始值
   */
  bind(selectedEl) {
    if (!this.el || !selectedEl) return;
    const qs = id => this.el.querySelector('#' + id);

    const getStyle = name => (selectedEl.style?.[name] || window.getComputedStyle(selectedEl).getPropertyValue(name))?.toString();
    const stripPx = v => parseInt((v || '').toString().replace('px', '') || '0', 10);

    qs('bgColor').value = this.toHexColor(getStyle('background-color')) || '#ffffff';
    qs('bgColorText').value = getStyle('background-color') || '';
    qs('textColor').value = this.toHexColor(getStyle('color')) || '#111111';
    qs('textColorText').value = getStyle('color') || '';

    qs('width').value = stripPx(getStyle('width'));
    qs('height').value = stripPx(getStyle('height'));

    qs('marginTop').value = stripPx(getStyle('margin-top'));
    qs('marginRight').value = stripPx(getStyle('margin-right'));
    qs('marginBottom').value = stripPx(getStyle('margin-bottom'));
    qs('marginLeft').value = stripPx(getStyle('margin-left'));
    qs('paddingTop').value = stripPx(getStyle('padding-top'));
    qs('paddingRight').value = stripPx(getStyle('padding-right'));
    qs('paddingBottom').value = stripPx(getStyle('padding-bottom'));
    qs('paddingLeft').value = stripPx(getStyle('padding-left'));

    const apply = () => this.applyStyles(selectedEl);

    const syncColorInputs = (colorId, textId) => {
      const colorInput = qs(colorId);
      const textInput = qs(textId);
      if (!colorInput || !textInput) { return; }

      colorInput.addEventListener('input', () => {
        textInput.value = colorInput.value;
        apply();
      });

      textInput.addEventListener('input', () => {
        const parsed = this.toHexColor(textInput.value);
        if (parsed) {
          colorInput.value = parsed;
        }
        apply();
      });
    };

    syncColorInputs('bgColor', 'bgColorText');
    syncColorInputs('textColor', 'textColorText');

    ['width','height','marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft']
      .forEach(id => qs(id).addEventListener('input', apply));
  }

  applyStyles(el) {
    const qs = id => this.el.querySelector('#' + id);
    const unit = 'px';

    const toCssColor = v => v?.trim();
    const setPx = (name, value) => {
      const val = parseInt(value, 10);
      if (Number.isFinite(val)) el.style[name] = val + unit;
    };

    const bg = qs('bgColorText').value || qs('bgColor').value;
    const color = qs('textColorText').value || qs('textColor').value;
    if (bg) el.style.backgroundColor = toCssColor(bg);
    if (color) el.style.color = toCssColor(color);

    setPx('width', qs('width').value);
    setPx('height', qs('height').value);

    setPx('marginTop', qs('marginTop').value);
    setPx('marginRight', qs('marginRight').value);
    setPx('marginBottom', qs('marginBottom').value);
    setPx('marginLeft', qs('marginLeft').value);

    setPx('paddingTop', qs('paddingTop').value);
    setPx('paddingRight', qs('paddingRight').value);
    setPx('paddingBottom', qs('paddingBottom').value);
    setPx('paddingLeft', qs('paddingLeft').value);

    // 发送代码编辑
    const style = el.getAttribute('style') || '';
    const operation = { type: 'style', style };
    const sm = this.stateManager;
    const updated = sm.codeEdits.some(edit => {
      if (edit.element === el) { edit.operations.push(operation); return true; }
    });
    if (!updated) sm.addCodeEdit({ element: el, operations: [operation] });
    this.eventManager.emitCodeEdits(new Set([el]), sm.codeEdits);
  }

  toHexColor(input) {
    if (!input) return '';
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = input;
    const computed = ctx.fillStyle; // normalized color
    // handle rgba/hex names → we can create a dummy div to get computed color
    const div = document.createElement('div');
    div.style.color = computed;
    document.body.appendChild(div);
    const rgb = getComputedStyle(div).color;
    document.body.removeChild(div);
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return '#000000';
    const r = (+m[1]).toString(16).padStart(2, '0');
    const g = (+m[2]).toString(16).padStart(2, '0');
    const b = (+m[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
};
