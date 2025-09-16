# WebView 模块化架构

## 概述

本项目将原本的单一 `webview.js` 文件重构为模块化架构，每个模块职责单一，便于维护和扩展。

## 目录结构

```
webview/modules/
├── core/                    # 核心模块
│   ├── StateManager.js      # 状态管理
│   ├── EventManager.js      # 事件管理
│   └── WebVisualEditor.js   # 主编辑器类
├── ui/                      # 用户界面模块
│   ├── UIManager.js         # UI管理器
│   ├── FloatingToolbar.js   # 悬浮工具栏
│   └── ToolbarDragHandler.js # 工具栏拖拽
├── interaction/             # 交互模块
│   ├── SelectionManager.js  # 选择管理
│   ├── KeyboardHandler.js   # 键盘交互
│   └── MouseHandler.js      # 鼠标交互
├── layout/                  # 布局模块
│   └── MovableManager.js    # 可移动元素管理
├── utils/                   # 工具模块
│   ├── Logger.js           # 日志系统
│   ├── DOMUtils.js         # DOM工具函数
│   └── LucideIcons.js      # 图标管理
└── config.json             # 模块配置
```

## 核心特性

### 1. 统一日志系统

所有模块使用统一的日志前缀 `[WVE:模块名]`，便于调试和问题排查：

```javascript
const logger = new window.WVE.Logger('模块名');
logger.info('信息日志');
logger.debug('调试日志');
logger.warn('警告日志');
logger.error('错误日志');
```

### 2. 命名空间隔离

使用 `window.WVE` 命名空间避免全局变量污染：

```javascript
window.WVE = {
  Logger: Logger类,
  DOMUtils: DOM工具对象,
  StateManager: 状态管理类,
  // ... 其他模块
};
```

### 3. 依赖管理

模块按依赖关系顺序加载：
1. **第三方库** (lib) - Lucide图标库等，必须最先加载
2. **工具模块** (utils) - 基础工具函数
3. **核心模块** (core) - 状态管理和事件管理
4. **布局模块** (layout) - 可移动元素管理
5. **UI模块** (ui) - 用户界面组件
6. **交互模块** (interaction) - 键盘鼠标交互
7. **主应用模块** - WebVisualEditor主类和入口文件

**重要**: `lib/lucide@0.544.0.min.js` 是关键依赖，必须在所有模块之前加载，因为LucideIcons模块需要使用全局的lucide对象。

### 4. 扩展机制

支持通过配置文件动态加载功能模块，为 IMPLEMENTATION_PLAN.md 中的功能扩展做准备。

## 日志搜索

所有日志都使用固定前缀 `[WVE:模块名]`，可以通过以下方式搜索：

- 搜索 `[WVE:` 查看所有扩展日志
- 搜索 `[WVE:Logger]` 查看日志系统相关日志
- 搜索 `[WVE:StateManager]` 查看状态管理相关日志
- 搜索 `[WVE:FloatingToolbar]` 查看工具栏相关日志

## 性能优化

1. **按需加载**: 每个模块独立，只加载必要功能
2. **内存优化**: 避免全局变量污染，使用命名空间隔离
3. **代码分割**: 单个文件控制在 300 行以内
4. **缓存优化**: 模块间依赖关系清晰，避免重复初始化

## 测试方法

打开 `webview/test.html` 在浏览器中测试模块加载是否正常：

1. 检查控制台输出，确认所有模块加载成功
2. 点击测试按钮验证日志系统工作正常
3. 查看网络面板确认脚本文件正确加载

## 扩展指南

### 添加必需模块

1. 在对应目录下创建模块文件
2. 使用统一的模块结构：
   ```javascript
   window.WVE = window.WVE || {};
   window.WVE.ModuleName = class ModuleName {
     constructor() {
       this.logger = new window.WVE.Logger('ModuleName');
       this.logger.info('Initializing ModuleName');
     }
   };
   ```
3. 在 `visualEditor.ts` 的 `loadModularScripts` 方法中添加配置：
   ```typescript
   { path: 'modules/category/ModuleName.js', description: '模块描述', required: true }
   ```

### 添加可选功能

1. 创建功能模块文件
2. 在 `visualEditor.ts` 的 `loadOptionalFeatures` 方法中添加配置：
   ```typescript
   newFeature: {
     enabled: config.get<boolean>('features.newFeature', false),
     scripts: [
       { path: 'modules/category/FeatureModule.js', description: '功能描述' }
     ]
   }
   ```
3. 在VSCode设置中控制启用/禁用：
   ```json
   {
     "webVisualEditor.features.newFeature": true
   }
   ```

### 统一脚本管理的优势

- 🎯 **集中管理**: 所有脚本在一个地方配置
- 🔄 **依赖控制**: 严格按照依赖关系加载
- 🐛 **调试友好**: 每个脚本都有唯一标识
- 🚀 **可扩展性**: 支持条件加载和功能开关

这种统一管理的架构为项目的持续发展和功能扩展提供了强大的基础。