# 统一脚本管理系统

## 概述

现在所有脚本资源都通过 `visualEditor.ts` 中的 `loadModularScripts()` 方法统一管理，实现了：
- 🎯 **集中管理**: 所有脚本加载逻辑在一个地方
- 🔄 **依赖控制**: 严格按照依赖关系顺序加载
- 🐛 **调试友好**: 每个脚本都有标识和描述
- 🚀 **可扩展性**: 支持可选功能的条件加载

## 资源加载顺序

### 1. CSS 样式资源
```typescript
// 用户自定义CSS（包装到layer中）
document.querySelectorAll('style:not(#wve-user-css-imports)').forEach(el => {
  el.textContent = `\n@layer user-style {\n${el.textContent}\n}`;
});

// Tailwind CSS（通过CSS文件加载，用于Shadow DOM）
const link = document.createElement('link');
link.setAttribute('href', 'webview/style-tailwind.css');
```

### 2. 统一脚本加载
通过 `loadModularScripts()` 方法统一处理所有JavaScript资源：

```typescript
const scriptConfigs = [
  // 第三方库 - 必须最先加载
  { path: 'lib/lucide@0.544.0.min.js', description: 'Lucide 图标库', required: true },

  // 工具模块 - 基础工具，被其他模块依赖
  { path: 'modules/utils/Logger.js', description: '统一日志系统', required: true },
  { path: 'modules/utils/DOMUtils.js', description: 'DOM操作工具', required: true },
  { path: 'modules/utils/LucideIcons.js', description: '图标管理', required: true },

  // 核心模块 - 基础功能
  { path: 'modules/core/StateManager.js', description: '状态管理', required: true },
  { path: 'modules/core/EventManager.js', description: '事件管理', required: true },

  // 布局模块
  { path: 'modules/layout/MovableManager.js', description: '可移动元素管理', required: true },

  // UI模块
  { path: 'modules/ui/UIManager.js', description: 'UI管理器', required: true },
  { path: 'modules/ui/FloatingToolbar.js', description: '悬浮工具栏', required: true },
  { path: 'modules/ui/ToolbarDragHandler.js', description: '工具栏拖拽', required: true },

  // 交互模块
  { path: 'modules/interaction/SelectionManager.js', description: '选择管理', required: true },
  { path: 'modules/interaction/KeyboardHandler.js', description: '键盘交互', required: true },
  { path: 'modules/interaction/MouseHandler.js', description: '鼠标交互', required: true },

  // 主模块 - 最后加载
  { path: 'modules/core/WebVisualEditor.js', description: '主编辑器类', required: true },
  { path: 'webview.js', description: '入口文件', required: true }
];
```

## 关键依赖说明

### Lucide 图标库
- **位置**: `webview/lib/lucide@0.544.0.min.js`
- **重要性**: 🔴 **必需** - 必须在 `LucideIcons.js` 模块之前加载
- **原因**: `LucideIcons.js` 需要访问全局的 `lucide` 对象

### 模块间依赖关系
```
Logger.js (无依赖)
├── DOMUtils.js (依赖Logger)
├── LucideIcons.js (依赖Logger + lucide库)
├── StateManager.js (依赖Logger)
├── EventManager.js (依赖Logger + StateManager)
├── MovableManager.js (依赖Logger + StateManager + DOMUtils)
├── UIManager.js (依赖Logger)
├── FloatingToolbar.js (依赖Logger + UIManager + StateManager + EventManager + LucideIcons)
├── ToolbarDragHandler.js (依赖Logger)
├── SelectionManager.js (依赖Logger + StateManager + EventManager + DOMUtils)
├── KeyboardHandler.js (依赖Logger + StateManager + SelectionManager + EventManager + MovableManager)
├── MouseHandler.js (依赖Logger + StateManager + SelectionManager + UIManager + MovableManager + EventManager + DOMUtils)
├── WebVisualEditor.js (依赖所有上述模块)
└── webview.js (依赖WebVisualEditor)
```

## 测试验证

可以通过以下方式验证加载顺序：

1. **浏览器测试**: 打开 `webview/test.html`
2. **控制台检查**: 查看是否有模块加载错误
3. **日志输出**: 搜索 `[WVE:` 查看模块初始化顺序

## 故障排查

### 常见问题
1. **lucide is not defined**: Lucide库未正确加载或加载顺序错误
2. **WVE.Logger is not a constructor**: Logger模块未先加载
3. **模块初始化失败**: 检查依赖模块是否已加载

### 调试技巧
- 在浏览器开发者工具Network面板查看脚本加载顺序
- 使用 `console.log(window.WVE)` 检查命名空间是否正确
- 搜索日志前缀 `[WVE:` 确认模块初始化状态
- 检查脚本元素的 `data-wve-script` 和 `data-wve-description` 属性

## 统一管理的优势

### 🎯 集中控制
所有脚本加载逻辑都在 `loadModularScripts()` 方法中，修改加载顺序或添加新模块时只需要修改一处代码。

### 🔧 易于维护
```typescript
// 添加新模块只需要在配置数组中添加一行
{ path: 'modules/new/NewModule.js', description: '新功能模块', required: true }
```

### 🚀 功能扩展
支持可选功能的条件加载，通过VSCode设置控制：

```json
{
  "webVisualEditor.features.elementPanel": false,
  "webVisualEditor.features.dragDrop": false,
  "webVisualEditor.features.layoutModes": false
}
```

### 🐛 调试增强
每个脚本都有唯一标识：
```html
<script data-wve-script="1-lucide@0.544.0.min.js" data-wve-description="Lucide 图标库" src="...">
<script data-wve-script="2-Logger.js" data-wve-description="统一日志系统" src="...">
```

### 📈 未来扩展
为 IMPLEMENTATION_PLAN.md 中计划的功能模块预留了扩展机制：
- Figma风格元素面板
- 拖拽重排功能
- 布局模式管理
- 其他新功能模块

只需要实现对应的模块文件，然后在配置中启用即可！