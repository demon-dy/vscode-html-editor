# HTML 可视化编辑器增强版 PRD

## 1. 项目概述

### 1.1 项目背景
基于现有的 VSCode HTML 可视化编辑器扩展，增强其功能以支持现代化的前端开发需求，特别是 Tailwind CSS 的可视化编辑、DOM 布局管理和响应式设计。

### 1.2 项目目标
- 提供直观的 Tailwind CSS 样式编辑体验
- 支持可视化的 DOM 布局操作
- 实现响应式布局的可视化管理
- 保持与现有代码编辑器的双向同步

### 1.3 目标用户
- 前端开发者
- UI/UX 设计师
- 全栈开发者
- 学习前端开发的初学者

## 2. 现有功能分析

### 2.1 当前功能
- ✅ HTML 元素可视化选择和编辑
- ✅ 代码编辑器与可视化编辑器双向同步
- ✅ 元素拖拽重排
- ✅ 复制、剪切、粘贴操作
- ✅ 页面缩放功能

### 2.2 技术架构
- **后端**: VSCode Extension API + JSDOM
- **前端**: WebView + JavaScript
- **通信**: VSCode WebView Message API
- **解析**: HTML Entity 编码/解码

## 3. 新增功能需求

### 3.1 Tailwind CSS 集成

#### 3.1.1 功能描述
集成 Tailwind CSS 框架，提供可视化的样式编辑界面。

#### 3.1.2 核心功能
- **Tailwind CSS 自动检测**: 自动识别项目中的 Tailwind 配置
- **类名智能提示**: 提供完整的 Tailwind 类名自动完成
- **样式预览**: 实时预览 Tailwind 类的效果
- **类名管理**: 批量添加、删除、替换 Tailwind 类

#### 3.1.3 用户界面
```
┌─────────────────────┐  ┌─────────────────────┐
│   HTML 代码编辑器    │  │   可视化编辑器       │
│                    │  │                    │
│  <div class=       │  │  [选中的元素]       │
│    "bg-blue-500    │  │                    │
│     text-white     │  │  ┌───────────────┐  │
│     p-4">          │  │  │ 样式编辑面板  │  │
│                    │  │  │ 背景: 蓝色    │  │
│                    │  │  │ 文字: 白色    │  │
│                    │  │  │ 内边距: 1rem  │  │
│                    │  │  └───────────────┘  │
└─────────────────────┘  └─────────────────────┘
```

#### 3.1.4 技术实现要点
- 解析 `tailwind.config.js` 获取自定义配置
- 构建 Tailwind 类名到 CSS 的映射关系
- 实现类名的分类管理（布局、颜色、字体等）

### 3.2 可视化样式编辑

#### 3.2.1 功能描述
提供直观的样式编辑界面，支持常用 CSS 属性的可视化调整。

#### 3.2.2 核心功能
- **颜色选择器**: 支持背景色、文字色、边框色等
- **尺寸调整器**: 宽度、高度、内外边距、边框等
- **字体编辑器**: 字体大小、粗细、行高等
- **效果编辑器**: 阴影、圆角、透明度等
- **动画编辑器**: 过渡效果、变换等

#### 3.2.3 样式面板设计
```
样式编辑面板
├── 布局 (Layout)
│   ├── Display: flex/grid/block
│   ├── Position: relative/absolute
│   └── Z-index: 数值输入
├── 尺寸 (Sizing)
│   ├── Width/Height: 输入框 + 单位选择
│   └── Max/Min Width/Height
├── 间距 (Spacing)
│   ├── Margin: 四向输入
│   └── Padding: 四向输入
├── 颜色 (Colors)
│   ├── Background: 颜色选择器
│   ├── Text Color: 颜色选择器
│   └── Border Color: 颜色选择器
├── 字体 (Typography)
│   ├── Font Size: 滑块 + 输入
│   ├── Font Weight: 下拉选择
│   └── Line Height: 滑块 + 输入
└── 效果 (Effects)
    ├── Border Radius: 滑块
    ├── Shadow: 预设 + 自定义
    └── Opacity: 滑块
```

### 3.3 DOM 布局管理

#### 3.3.1 功能描述
提供可视化的 DOM 结构管理和布局控制功能。

#### 3.3.2 核心功能
- **布局模式切换**: Flexbox/Grid/普通流布局
- **Flexbox 控制**: 方向、对齐、换行等
- **Grid 控制**: 网格定义、区域分配
- **层级管理**: 元素嵌套关系可视化

#### 3.3.3 布局控制界面
```
布局控制面板
├── 容器类型
│   ├── ⚪ Block
│   ├── 🔵 Flex
│   └── ⬜ Grid
├── Flex 设置 (当选择 Flex 时)
│   ├── 方向: → ↓ ← ↑
│   ├── 主轴对齐: ◀ ▶ ◆
│   └── 交叉轴对齐: ▲ ▼ ◆
├── Grid 设置 (当选择 Grid 时)
│   ├── 列数: [3]
│   ├── 行数: [2]
│   └── 间距: [1rem]
└── 元素排序
    ├── 上移 ↑
    ├── 下移 ↓
    └── 删除 🗑
```

### 3.4 自适应布局功能

#### 3.4.1 功能描述
支持响应式设计的可视化编辑，提供多设备预览和断点管理。

#### 3.4.2 核心功能
- **设备预览**: 手机/平板/桌面视图切换
- **断点编辑**: 自定义响应式断点
- **条件样式**: 不同屏幕尺寸下的样式设置
- **设备适配**: 自动适配常见设备尺寸

#### 3.4.3 响应式控制界面
```
响应式编辑器
├── 设备选择
│   ├── 📱 Mobile (320px-768px)
│   ├── 📟 Tablet (768px-1024px)
│   └── 🖥️ Desktop (1024px+)
├── 断点管理
│   ├── sm: 640px ✏️
│   ├── md: 768px ✏️
│   ├── lg: 1024px ✏️
│   └── xl: 1280px ✏️
├── 当前断点样式
│   ├── [移动端特有样式]
│   └── [继承的基础样式]
└── 预览窗口
    └── [实时响应式预览]
```

## 4. 技术实现方案

### 4.1 架构设计

#### 4.1.1 整体架构
```
VSCode Extension
├── Extension Host (Node.js)
│   ├── VisualEditorProvider (扩展)
│   ├── TailwindService (新增)
│   ├── StyleManager (新增)
│   └── LayoutManager (新增)
└── WebView (Browser)
    ├── 可视化编辑器 (现有)
    ├── 样式编辑面板 (新增)
    ├── 布局控制面板 (新增)
    └── 响应式编辑器 (新增)
```

#### 4.1.2 数据流设计
```
用户操作 → WebView UI → Message API → Extension Host → JSDOM 处理 → 代码更新 → WebView 同步
```

### 4.2 核心模块设计

#### 4.2.1 TailwindService
```typescript
class TailwindService {
  // Tailwind 配置解析
  parseTailwindConfig(): TailwindConfig

  // 类名到 CSS 的转换
  classToCSS(className: string): CSSProperties

  // CSS 到类名的反向转换
  cssToClass(css: CSSProperties): string[]

  // 类名自动完成
  getClassSuggestions(prefix: string): string[]
}
```

#### 4.2.2 StyleManager
```typescript
class StyleManager {
  // 样式应用
  applyStyles(element: Element, styles: CSSProperties): void

  // 样式提取
  extractStyles(element: Element): CSSProperties

  // 响应式样式管理
  applyResponsiveStyles(element: Element, breakpoint: string, styles: CSSProperties): void
}
```

#### 4.2.3 LayoutManager
```typescript
class LayoutManager {
  // 布局模式切换
  setLayoutMode(element: Element, mode: 'flex' | 'grid' | 'block'): void

  // Flex 属性设置
  setFlexProperties(element: Element, props: FlexProperties): void

  // Grid 属性设置
  setGridProperties(element: Element, props: GridProperties): void
}
```

### 4.3 WebView 组件设计

#### 4.3.1 组件结构
```
WebView
├── EditorCore (现有核心编辑器)
├── StylePanel (样式编辑面板)
│   ├── ColorPicker
│   ├── SizeEditor
│   ├── TypographyEditor
│   └── EffectsEditor
├── LayoutPanel (布局控制面板)
│   ├── FlexControls
│   ├── GridControls
│   └── PositionControls
└── ResponsivePanel (响应式编辑面板)
    ├── DeviceSelector
    ├── BreakpointManager
    └── PreviewWindow
```

### 4.4 数据存储设计

#### 4.4.1 元素状态管理
```typescript
interface ElementState {
  id: string;
  tagName: string;
  classes: string[];
  styles: CSSProperties;
  responsiveStyles: {
    [breakpoint: string]: CSSProperties;
  };
  layoutMode: 'flex' | 'grid' | 'block';
  flexProperties?: FlexProperties;
  gridProperties?: GridProperties;
}
```

## 5. 开发计划

### 5.1 开发阶段划分

#### 阶段一：Tailwind CSS 集成 (2周)
- [ ] Tailwind 配置解析
- [ ] 类名映射系统
- [ ] 基础样式编辑面板
- [ ] 类名自动完成

#### 阶段二：可视化样式编辑 (3周)
- [ ] 颜色选择器组件
- [ ] 尺寸调整器组件
- [ ] 字体编辑器组件
- [ ] 效果编辑器组件
- [ ] 样式同步机制

#### 阶段三：布局管理功能 (2周)
- [ ] Flex 布局控制
- [ ] Grid 布局控制
- [ ] 布局模式切换
- [ ] 元素排序功能

#### 阶段四：响应式布局 (3周)
- [ ] 设备预览功能
- [ ] 断点管理系统
- [ ] 响应式样式编辑
- [ ] 多设备同步预览

#### 阶段五：优化和测试 (1周)
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 单元测试
- [ ] 集成测试

### 5.2 技术风险评估

#### 5.2.1 高风险项
- **Tailwind 配置解析复杂性**: 需要处理各种自定义配置
- **响应式样式同步**: 多断点下的状态管理复杂
- **WebView 性能**: 大量 DOM 操作可能影响性能

#### 5.2.2 风险缓解措施
- 提前进行技术验证
- 分阶段开发，逐步验证可行性
- 建立完善的测试体系

## 6. 成功指标

### 6.1 功能指标
- ✅ 支持完整的 Tailwind CSS 类名编辑
- ✅ 提供直观的样式可视化编辑
- ✅ 实现完整的布局管理功能
- ✅ 支持响应式设计编辑

### 6.2 性能指标
- 样式编辑响应时间 < 100ms
- 大型 HTML 文件 (>1000 元素) 加载时间 < 3s
- WebView 内存占用 < 100MB

### 6.3 用户体验指标
- 学习成本低，5分钟内上手基础功能
- 操作流畅，无明显卡顿
- 与代码编辑器同步准确率 > 99%

## 7. 后续规划

### 7.1 短期规划 (3个月内)
- 完成核心功能开发
- 发布 Beta 版本
- 收集用户反馈

### 7.2 长期规划 (6个月-1年)
- 支持更多 CSS 框架 (Bootstrap, Material-UI 等)
- 添加组件库功能
- 支持团队协作编辑
- 集成设计系统管理

## 8. 结论

本 PRD 设计了一个全面的 HTML 可视化编辑器增强方案，在现有功能基础上添加了 Tailwind CSS 支持、可视化样式编辑、布局管理和响应式设计功能。通过分阶段开发，可以逐步实现一个功能完整、用户体验优秀的现代化前端开发工具。