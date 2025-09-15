# HTML 可视化编辑器增强版 PRD

## 1. 项目概述

### 1.1 项目背景
基于现有的 VSCode HTML 可视化编辑器扩展，重新设计用户界面和交互体验，提供类似 Figma 的直观编辑体验，支持现代化的前端开发工作流。

### 1.2 项目目标
- 提供类似 Figma 的直观视觉编辑体验
- 简化布局系统，专注核心布局模式
- 实现流畅的拖拽和快捷键操作
- 保持与代码编辑器的实时双向同步

### 1.3 目标用户
- 前端开发者
- UI/UX 设计师转前端
- 全栈开发者
- 学习前端开发的设计师

## 2. 现有功能分析

### 2.1 当前功能
- ✅ HTML 元素可视化选择和编辑
- ✅ 代码编辑器与可视化编辑器双向同步
- ✅ 元素拖拽重排
- ✅ 复制、剪切、粘贴操作
- ✅ 页面缩放功能

### 2.2 当前界面问题
- 左侧操作栏占用空间，影响编辑区域
- 缺乏直观的元素操作反馈
- 布局控制过于复杂
- 缺乏现代化的交互体验

### 2.3 技术架构
- **后端**: VSCode Extension API + JSDOM
- **前端**: WebView + JavaScript
- **通信**: VSCode WebView Message API
- **解析**: HTML Entity 编码/解码

## 3. 界面重新设计

### 3.1 底部悬浮工具栏

#### 3.1.1 设计理念
将原有的左侧操作栏改为底部悬浮工具栏，释放更多编辑空间，提供常驻且便捷的操作入口。

#### 3.1.2 工具栏功能布局
```
┌─────────────────────────────────────────────────────────────┐
│                     可视化编辑区域                          │
│                                                             │
│  ┌──────────────┐     ┌─────────────────┐                 │
│  │  选中的元素  │     │   Figma风格     │                 │
│  │              │────▶│   操作面板      │                 │
│  └──────────────┘     └─────────────────┘                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 编辑 │ 👁 预览 │ 🔗 关联 │ 🔄 刷新 │ 🔍+ │ 🔍- │ 📱 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 3.1.3 工具栏组件设计
- **拖拽手柄**: 支持拖拽移动工具栏位置
- **编辑模式切换**: 🎯 开启/关闭编辑模式
- **预览模式**: 👁 切换到纯预览模式
- **关联文件**: 🔗 跳转到对应代码位置
- **刷新视图**: 🔄 重新加载内容
- **缩放控制**: 🔍+ 🔍- 放大缩小视图
- **设备选择**: 📱 响应式设备切换

### 3.2 Figma 风格元素操作面板

#### 3.2.1 设计理念
参考 Figma 的交互设计，为选中元素提供直观的悬浮操作面板，实现所见即所得的编辑体验。

#### 3.2.2 面板触发机制
- 点击元素后立即显示操作面板
- 面板跟随元素位置自适应显示
- 操作面板外点击自动隐藏
- 支持快捷键切换面板显示

#### 3.2.3 操作面板布局
```
        ┌─────────────────────────┐
        │    元素操作面板         │
        ├─────────────────────────┤
选中元素 │ 🎨 样式 │ 📐 布局 │ 🔧 属性 │
   ↓    ├─────────────────────────┤
 ┌───┐  │ • 背景色   [      ]     │
 │ ? │  │ • 文字色   [      ]     │
 └───┘  │ • 边距     [  ][  ]     │
        │ • 圆角     [    ]       │
        │ • 阴影     [预设 ▼]     │
        ├─────────────────────────┤
        │ 📋 复制 ✂️ 剪切 🗑️ 删除 │
        └─────────────────────────┘
```

#### 3.2.4 面板功能分组
**样式标签页**：
- 颜色控制：背景色、文字色、边框色
- 尺寸控制：宽度、高度、边距、内边距
- 效果控制：圆角、阴影、透明度

**布局标签页**：
- 布局模式：默认流布局、Flex布局、绝对定位
- Flex属性：方向、对齐、间距
- 定位属性：top、right、bottom、left

**属性标签页**：
- HTML属性：id、class、data-*
- 可访问性：alt、title、aria-*
- 元素标签：更改标签类型

### 3.3 简化的布局系统

#### 3.3.1 布局模式简化
基于实际开发需求，将布局系统简化为三种核心模式：

1. **默认流布局** (Document Flow)
   - 跟随正常文档流
   - 块级和内联元素的自然排列
   - 适用于大多数内容布局

2. **Flex 布局** (Flexbox)
   - 现代响应式布局的首选
   - 支持方向、对齐、分布控制
   - 适用于组件和页面布局

3. **绝对定位** (Absolute Position)
   - 脱离文档流的精确定位
   - 自动为父元素设置 relative 定位
   - 适用于悬浮元素和精确布局

#### 3.3.2 布局切换界面
```
┌─── 布局模式选择 ───┐
│ ⚪ 默认流布局      │  选择后无需额外设置
│ 🔲 Flex布局       │  显示 Flex 控制选项
│ 📍 绝对定位       │  显示位置输入框
└───────────────────┘

// Flex模式下的控制面板
┌─── Flex 设置 ─────┐
│ 方向: → ↓ ← ↑     │
│ 主轴: ◀─ ─▶ ◆     │
│ 交叉轴: ▲ ▼ ◆     │
│ 换行: 允许 不允许  │
└───────────────────┘

// 绝对定位模式的控制面板
┌─── 绝对定位 ──────┐
│ Top:    [  ]px    │
│ Right:  [  ]px    │
│ Bottom: [  ]px    │
│ Left:   [  ]px    │
│ Z-index:[  ]      │
└───────────────────┘
```

### 3.4 快捷键操作系统

#### 3.4.1 核心快捷键
基于现代编辑器的习惯，提供直观的快捷键操作：

```
基础操作快捷键：
• Ctrl/Cmd + C  - 复制选中元素
• Ctrl/Cmd + V  - 粘贴元素到选中位置
• Ctrl/Cmd + X  - 剪切选中元素
• Delete/Backspace - 删除选中元素
• Ctrl/Cmd + Z  - 撤销操作
• Ctrl/Cmd + Y  - 重做操作

选择和导航：
• Tab            - 选择下一个元素
• Shift + Tab    - 选择上一个元素
• Escape         - 取消选择
• Enter          - 进入编辑模式

布局快捷键：
• Ctrl/Cmd + 1   - 设置为默认布局
• Ctrl/Cmd + 2   - 设置为Flex布局
• Ctrl/Cmd + 3   - 设置为绝对定位
```

#### 3.4.2 拖拽操作设计

**元素间拖拽功能**：
1. **拖拽触发**：鼠标悬停元素时显示拖拽手柄
2. **拖拽预览**：拖拽时显示半透明预览
3. **放置反馈**：可放置区域高亮显示
4. **嵌套支持**：支持拖拽到其他元素内部

```
拖拽操作流程：
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   源元素    │────▶│  拖拽中     │────▶│  目标位置   │
│  [可拖拽]   │     │ [半透明]    │     │  [高亮]     │
└─────────────┘     └─────────────┘     └─────────────┘
        ↓                   ↓                   ↓
  显示拖拽手柄      实时位置预览         松开鼠标完成
```

**父元素相对定位自动设置**：
- 当子元素设置为绝对定位时
- 自动检查父元素是否有定位属性
- 如无则自动添加 `position: relative` 类
- 提供用户确认对话框

### 3.5 响应式设备预览

#### 3.5.1 设备预设
在底部工具栏提供常用设备预设：

```
设备选择器：
┌─────────────────────────────────────┐
│ 📱320 📱375 📱414 📟768 💻1024 🖥1440 │
└─────────────────────────────────────┘
   iPhone  iPhone  iPhone  iPad  Laptop Desktop
     SE      8      Plus
```

#### 3.5.2 自定义尺寸
- 支持输入自定义宽度和高度
- 记住常用的自定义尺寸
- 横屏/竖屏快速切换

## 4. 技术实现方案

### 4.1 架构重构

#### 4.1.1 整体架构
```
VSCode Extension
├── Extension Host (Node.js)
│   ├── VisualEditorProvider (核心编辑器)
│   ├── LayoutManager (简化布局管理)
│   ├── InteractionManager (交互管理)
│   └── KeyboardManager (快捷键管理)
└── WebView (Browser)
    ├── EditableCanvas (编辑画布)
    ├── FloatingToolbar (底部悬浮工具栏)
    ├── ElementPanel (Figma风格操作面板)
    ├── DevicePreview (设备预览)
    └── DragDropManager (拖拽管理)
```

#### 4.1.2 交互数据流
```
用户操作 → 快捷键/拖拽/点击 → 交互管理器 → 状态更新 → DOM操作 → 代码同步
                ↓
           实时视觉反馈 → 操作面板更新 → 工具栏状态同步
```

### 4.2 核心模块重构

#### 4.2.1 简化的LayoutManager
```typescript
class LayoutManager {
  // 简化的布局模式
  setLayoutMode(element: Element, mode: 'flow' | 'flex' | 'absolute'): void

  // Flex布局设置
  setFlexProperties(element: Element, props: {
    direction: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    justify: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
    align: 'flex-start' | 'center' | 'flex-end' | 'stretch'
    wrap: boolean
  }): void

  // 绝对定位设置
  setAbsolutePosition(element: Element, props: {
    top?: string
    right?: string
    bottom?: string
    left?: string
    zIndex?: number
  }): void

  // 自动设置父元素相对定位
  ensureParentRelative(element: Element): void
}
```

#### 4.2.2 InteractionManager
```typescript
class InteractionManager {
  // 元素选择管理
  selectElement(element: Element): void
  getSelectedElement(): Element | null

  // 操作面板控制
  showElementPanel(element: Element, position: {x: number, y: number}): void
  hideElementPanel(): void

  // 快捷键处理
  handleKeyboardEvent(event: KeyboardEvent): void

  // 拖拽操作
  initiateDrag(element: Element): void
  handleDrop(target: Element, position: 'before' | 'after' | 'inside'): void
}
```

#### 4.2.3 DevicePreviewManager
```typescript
class DevicePreviewManager {
  // 设备预设
  devicePresets: {
    name: string
    width: number
    height: number
    userAgent?: string
  }[]

  // 切换设备预览
  switchDevice(preset: string): void
  setCustomSize(width: number, height: number): void

  // 响应式断点检测
  getCurrentBreakpoint(): string
  applyBreakpointStyles(element: Element): void
}
```

### 4.3 重构的 WebView 组件

#### 4.3.1 新组件结构
```
WebView 主界面
├── EditableCanvas (主编辑画布)
│   ├── ElementHighlighter (元素高亮)
│   ├── SelectionIndicator (选择指示器)
│   └── DragPreview (拖拽预览)
├── FloatingToolbar (底部悬浮工具栏)
│   ├── EditModeToggle (编辑模式切换)
│   ├── ViewControls (视图控制)
│   ├── DeviceSelector (设备选择)
│   └── DragHandle (拖拽手柄)
├── ElementPanel (Figma风格操作面板)
│   ├── StyleTab (样式标签页)
│   │   ├── ColorControls (颜色控制)
│   │   ├── SizeControls (尺寸控制)
│   │   └── EffectControls (效果控制)
│   ├── LayoutTab (布局标签页)
│   │   ├── LayoutModeSelector (布局模式)
│   │   ├── FlexControls (Flex控制)
│   │   └── PositionControls (定位控制)
│   └── AttributeTab (属性标签页)
│       ├── HTMLAttributes (HTML属性)
│       └── AccessibilityProps (可访问性属性)
└── ContextMenu (右键菜单)
    ├── ElementActions (元素操作)
    └── LayoutActions (布局操作)
```

### 4.4 简化的状态管理

#### 4.4.1 元素状态接口
```typescript
interface ElementState {
  id: string
  tagName: string
  classes: string[]
  styles: CSSProperties
  layoutMode: 'flow' | 'flex' | 'absolute'
  flexProperties?: {
    direction: string
    justify: string
    align: string
    wrap: boolean
  }
  absoluteProperties?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
    zIndex?: number
  }
  selected: boolean
  panelVisible: boolean
}
```

#### 4.4.2 全局状态管理
```typescript
interface EditorState {
  // 编辑模式
  editMode: boolean

  // 选中元素
  selectedElement: ElementState | null

  // 设备预览
  currentDevice: {
    name: string
    width: number
    height: number
  }

  // 工具栏状态
  toolbarPosition: { x: number, y: number }
  toolbarVisible: boolean

  // 操作面板
  panelPosition: { x: number, y: number }
  panelActiveTab: 'style' | 'layout' | 'attribute'

  // 拖拽状态
  dragState: {
    isDragging: boolean
    dragElement: ElementState | null
    dropTarget: ElementState | null
    dropPosition: 'before' | 'after' | 'inside' | null
  }
}
```

## 5. 开发计划

### 5.1 重构开发阶段

#### 阶段一：界面重构 (2周)
- [ ] 移除左侧操作栏，重构界面布局
- [ ] 实现底部悬浮工具栏组件
- [ ] 添加工具栏拖拽功能
- [ ] 集成设备预览选择器

#### 阶段二：Figma风格操作面板 (3周)
- [ ] 设计和实现元素选择机制
- [ ] 创建悬浮操作面板组件
- [ ] 实现样式、布局、属性三个标签页
- [ ] 添加颜色选择器和尺寸控制组件
- [ ] 实现面板自适应定位算法

#### 阶段三：简化布局系统 (2周)
- [ ] 重构布局管理器，简化为三种模式
- [ ] 实现Flex布局的可视化控制
- [ ] 添加绝对定位的父元素自动设置
- [ ] 优化布局切换的用户体验

#### 阶段四：交互增强 (2周)
- [ ] 实现完整的快捷键系统
- [ ] 添加元素间拖拽功能
- [ ] 实现拖拽预览和放置反馈
- [ ] 优化选择和编辑状态管理

#### 阶段五：集成测试 (1周)
- [ ] 界面响应性测试
- [ ] 拖拽操作稳定性测试
- [ ] 快捷键冲突检测
- [ ] 代码同步准确性验证

### 5.2 技术风险评估

#### 5.2.1 高风险项
- **拖拽操作的跨元素复杂性**: 需要精确的碰撞检测和嵌套逻辑
- **悬浮面板的定位算法**: 在不同屏幕尺寸下的自适应显示
- **快捷键与VSCode冲突**: 可能与编辑器原生快捷键冲突
- **绝对定位的父元素自动设置**: 可能影响现有布局

#### 5.2.2 风险缓解措施
- 建立拖拽操作的单元测试覆盖
- 设计面板定位的多种fallback策略
- 提供快捷键自定义配置选项
- 为布局修改提供撤销机制和用户确认

## 6. 成功指标

### 6.1 功能指标
- ✅ 底部工具栏提供所有核心操作入口
- ✅ 元素选择后立即显示Figma风格操作面板
- ✅ 三种布局模式完整覆盖常用场景
- ✅ 快捷键操作响应准确无冲突
- ✅ 元素拖拽操作流畅且直观

### 6.2 性能指标
- 元素选择响应时间 < 50ms
- 拖拽操作帧率 > 60fps
- 工具栏拖拽延迟 < 16ms
- 操作面板显示延迟 < 100ms
- 设备预览切换时间 < 200ms

### 6.3 用户体验指标
- 新用户2分钟内掌握基础操作
- 类Figma交互体验，设计师友好
- 拖拽成功率 > 95%
- 快捷键操作准确率 > 99%
- 界面响应流畅，无卡顿感

## 7. 后续规划

### 7.1 短期规划 (3个月内)
- 完成界面重构和核心交互
- 发布 Alpha 版本进行内部测试
- 收集设计师和开发者反馈
- 优化拖拽和快捷键体验

### 7.2 中期规划 (6个月内)
- 添加更多设备预设和自定义尺寸
- 实现元素复制粘贴的跨文件支持
- 添加操作历史和撤销重做可视化
- 支持多选元素的批量操作

### 7.3 长期规划 (1年内)
- 集成常用CSS框架的可视化支持
- 添加组件化编辑功能
- 支持设计系统和样式指南
- 实现协作编辑和评论功能

## 8. 结论

本 PRD 重新设计了 HTML 可视化编辑器的用户界面和交互体验，重点关注：

1. **界面优化**: 底部悬浮工具栏释放更多编辑空间
2. **交互升级**: 类Figma的操作面板提供直观的编辑体验
3. **布局简化**: 三种核心布局模式满足大部分开发场景
4. **操作增强**: 完整的快捷键和拖拽操作支持

通过这些改进，将为前端开发者和UI设计师提供一个更加现代化、直观且高效的可视化HTML编辑工具。