# Figma 布局分析与复刻方案

## 布局结构分析

### ASCII 布局图

```
┌─────────────────────────────────┐
│            Position             │
├─────────────────────────────────┤
│ Alignment                       │
│ [≡] [⊞] [≣] [‖] [⫴] [‖] [≡]      │
│                                 │
│ Position                        │
│ X [7    ] Y [6413]             │
│                                 │
│ Rotation                        │
│ ∠ [0°] [↻] [⫸] [≋]              │
├─────────────────────────────────┤
│          Auto layout            │
├─────────────────────────────────┤
│ Flow                            │
│ [⊞] [⊟] [→] [⊞⊞]                │
│                                 │
│ Dimensions                      │
│ W [3194 ▼] H [214 ▼] [⊞]       │
│                                 │
│ Alignment        Gap            │
│ [≡] [·] [·]     [≡] [10 ▼] [⫸]  │
│ [·] [·] [·]                     │
│                                 │
│ Padding                         │
│ [⊔] [100] [⊓] [10] [⊔]          │
│                                 │
│ ☐ Clip content                  │
├─────────────────────────────────┤
│         Appearance     [👁] [💧]  │
├─────────────────────────────────┤
│ Opacity        Corner radius    │
│ [☐] [100%]    [⌐] [0] [⌐]       │
├─────────────────────────────────┤
│              Fill      [⊞] [+]  │
├─────────────────────────────────┤
│ [■] [000000] [100%] [👁] [−]    │
├─────────────────────────────────┤
│            Stroke      [⊞] [+]  │
├─────────────────────────────────┤
│ [■] [000000] [100%] [👁] [−]    │
│                                 │
│ Position      Weight            │
│ [Inside ▼]    [≡] [1] [⫸] [⊞]   │
├─────────────────────────────────┤
│            Effects     [⊞] [+]  │
├─────────────────────────────────┤
│ [☐] [Drop shadow ▼] [👁] [−]   │
└─────────────────────────────────┘
```

## 设计原则

### 1. 分组结构
- **折叠式分组**: 每个主要功能区域都有标题栏，支持展开/折叠
- **逻辑分类**: 按功能将属性分为 Position、Auto layout、Appearance 等
- **视觉分隔**: 使用分割线清晰区分不同功能组

### 2. 控件设计
- **统一尺寸**: 所有控件保持一致的高度（约 32px）
- **紧凑排列**: 相关控件水平排列，节省垂直空间
- **图标 + 文本**: 重要功能使用图标配合文字标签

### 3. 交互模式

#### 数值输入与下拉选择
```
X [7    ] Y [6413]
W [3194 ▼] H [214 ▼]
```
- **直接输入**: 支持键盘输入数值
- **下拉选择**: 点击▼展开选项菜单，包含：
  - ✓ Fixed width (3194) - 固定宽度（当前值）
  - ✗ Hug contents - 自适应内容
  - →← Add min width... - 设置最小宽度
  - ←→ Add max width... - 设置最大宽度
  - ⚪ Apply variable... - 应用变量
- **焦点状态**: 获得焦点时显示蓝色边框，失去焦点时恢复原样

#### 按钮组交互
```
[≡] [⊞] [≣] [‖] [⫴] [‖] [≡]
```
- **对齐按钮**: 一次性操作按钮，点击即执行，无选中状态
- **多选按钮**: 选中状态时背景颜色更深（#0078d4）
- **图标表示**: 每个功能都有对应的图标标识

#### 复合控件详细交互
```
[■] [000000] [100%] [👁] [−]
```
- **颜色选择器**: 点击色块弹出颜色面板
  - Custom/Libraries 标签页切换
  - 色彩空间选择器（渐变色块）
  - HSV 彩虹条
  - 透明度滑块
  - RGB 数值输入（255 255 255 100%）
- **百分比输入**: 在图标处鼠标变为左右箭头，可拖拽调整 0%-100%
- **可见性切换**: 眼睛图标在睁眼/闭眼间直接切换，无动画过渡
- **删除操作**: 点击减号删除当前项

## 复刻实现方案

### 1. 基础结构

```css
.property-panel {
  width: 240px;
  background: #2c2c2c;
  color: #ffffff;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
}

.property-section {
  border-bottom: 1px solid #404040;
}

.section-header {
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  background: #383838;
  cursor: pointer;
}

.section-content {
  padding: 12px;
}
```

### 2. 控件样式

#### 输入框
```css
.property-input {
  height: 24px;
  background: #1e1e1e;
  border: 1px solid #404040;
  border-radius: 4px;
  padding: 0 8px;
  color: #ffffff;
  font-size: 11px;
}

.property-input:focus {
  border-color: #0078d4;
}
```

#### 按钮组
```css
.button-group {
  display: flex;
  gap: 2px;
}

.icon-button {
  width: 16px;
  height: 16px;
  background: #2c2c2c;
  border: 1px solid #404040;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-button.active {
  background: #0078d4;
  border-color: #0078d4;
}
```

### 3. 布局网格

#### 双列布局
```css
.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
```

#### 标签-控件布局
```css
.label-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.label {
  min-width: 60px;
  font-size: 11px;
  color: #cccccc;
}
```

### 4. 精确交互行为

#### 折叠展开（无动画）
```javascript
function toggleSection(sectionElement) {
  const content = sectionElement.querySelector('.section-content');
  const isCollapsed = content.style.display === 'none';

  // 瞬时显示/隐藏，无动画效果
  content.style.display = isCollapsed ? 'block' : 'none';
  sectionElement.classList.toggle('collapsed', !isCollapsed);
}
```

#### 下拉菜单实现
```javascript
function createDropdownMenu(options) {
  const dropdown = document.createElement('div');
  dropdown.className = 'figma-dropdown';
  dropdown.innerHTML = `
    <div class="dropdown-item ${options.current === 'fixed' ? 'selected' : ''}">
      <span class="checkmark">✓</span> Fixed width (${options.value})
    </div>
    <div class="dropdown-item">
      <span class="close-mark">✗</span> Hug contents
    </div>
    <hr class="dropdown-divider">
    <div class="dropdown-item">
      <span class="icon">→←</span> Add min width...
    </div>
    <div class="dropdown-item">
      <span class="icon">←→</span> Add max width...
    </div>
    <hr class="dropdown-divider">
    <div class="dropdown-item">
      <span class="icon">⚪</span> Apply variable...
    </div>
  `;
  return dropdown;
}
```

#### 百分比拖拽（图标区域）
```javascript
function enablePercentageDrag(element) {
  const icon = element.querySelector('.percentage-icon');

  icon.addEventListener('mouseenter', () => {
    icon.style.cursor = 'ew-resize'; // 左右箭头光标
  });

  let isDragging = false;
  let startValue = 0;
  let startX = 0;

  icon.addEventListener('mousedown', (e) => {
    isDragging = true;
    startValue = parseFloat(element.value) || 0;
    startX = e.clientX;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(e) {
    if (isDragging) {
      const delta = (e.clientX - startX) * 0.5; // 拖拽敏感度
      const newValue = Math.min(100, Math.max(0, startValue + delta));
      element.value = Math.round(newValue) + '%';
    }
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}
```

#### 颜色选择器面板
```javascript
function createColorPicker() {
  return `
    <div class="color-picker-panel">
      <div class="picker-header">
        <div class="tab active">Custom</div>
        <div class="tab">Libraries</div>
        <div class="controls">
          <button class="btn-add">+</button>
          <button class="btn-close">×</button>
        </div>
      </div>

      <div class="color-tools">
        <div class="tool-icon solid"></div>
        <div class="tool-icon gradient"></div>
        <div class="picker-icons">
          <div class="eyedropper"></div>
          <div class="swap-colors"></div>
        </div>
      </div>

      <div class="color-area">
        <!-- 主色彩选择区域 -->
        <div class="saturation-brightness"></div>
      </div>

      <div class="hue-bar">
        <!-- HSV 彩虹条 -->
      </div>

      <div class="alpha-bar">
        <!-- 透明度滑块 -->
      </div>

      <div class="color-inputs">
        <select class="color-mode">
          <option value="rgb">RGB</option>
        </select>
        <input type="number" value="255" max="255">
        <input type="number" value="255" max="255">
        <input type="number" value="255" max="255">
        <input type="number" value="100" max="100"><span>%</span>
      </div>
    </div>
  `;
}
```

## 关键特性

### 1. 响应式设计
- 固定宽度（240px），适合侧边栏
- 垂直滚动支持长内容
- 控件自适应可用空间

### 2. 交互特性总结
- **无快捷键操作**: 暂不考虑键盘快捷键支持
- **对齐按钮**: 一次性事件，点击即设置，无选中状态保持
- **多选按钮**: 有选中状态，选中时颜色更深
- **眼睛图标**: 纯图标切换，无动画过渡效果
- **折叠区域**: 瞬时显示/隐藏，无动画效果
- **焦点状态**: 蓝色边框表示获得焦点

### 3. 上下文相关
- 根据选中元素类型显示相应属性
- 动态隐藏不适用的功能
- 批量编辑多个元素

### 4. 性能优化
- 虚拟滚动处理大量属性
- 防抖输入避免频繁更新
- 惰性渲染复杂控件

## 图标系统

使用 Lucide Icons 提供一致的图标风格：

```javascript
const icons = {
  alignLeft: 'align-left',
  alignCenter: 'align-center',
  alignRight: 'align-right',
  alignTop: 'align-top',
  alignMiddle: 'align-middle',
  alignBottom: 'align-bottom',
  rotate: 'rotate-ccw',
  eye: 'eye',
  eyeOff: 'eye-off',
  plus: 'plus',
  minus: 'minus',
  link: 'link',
  unlink: 'unlink'
};
```

## 实现优先级

1. **基础结构** - 分组和折叠功能
2. **Position 组** - 位置和对齐控件
3. **Dimensions 组** - 尺寸和间距控件
4. **Appearance 组** - 外观和样式控件
5. **高级功能** - 效果和动画控件

这个设计保持了 Figma 的简洁性和功能性，同时适配了 VSCode 扩展的使用场景。