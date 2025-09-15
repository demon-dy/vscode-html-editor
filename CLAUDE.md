# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 VSCode 扩展，用于可视化编辑 HTML 文件。它允许用户在 WebView 中实时编辑 HTML 元素，并与代码编辑器保持同步。

## 常用开发命令

### 构建和编译
- `npm run compile` - 编译项目（包含类型检查和代码检查）
- `npm run watch` - 监视模式编译
- `npm run package` - 打包生产版本
- `npm run vscode:prepublish` - 发布前预处理

### 代码质量
- `npm run check-types` - TypeScript 类型检查
- `npm run lint` - ESLint 代码检查

### 测试
- `npm run compile-tests` - 编译测试文件
- `npm run pretest` - 运行测试前的准备工作

### 开发工作流
1. 使用 `npm run watch` 进行开发时的自动编译
2. 修改代码后运行 `npm run lint` 确保代码风格
3. 使用 `npm run check-types` 验证类型
4. 使用 `npm run package` 打包最终版本

## 代码架构

### 核心文件结构
- `src/extension.ts` - 扩展的主入口文件，注册命令和自定义编辑器
- `src/visualEditor.ts` - 可视化编辑器的核心实现，处理 WebView 与代码的同步
- `webview/` - WebView 相关的前端资源（JavaScript、CSS、字体）
- `package.json` - 扩展配置，定义命令、菜单和设置

### 关键组件

#### VisualEditorProvider
- 实现 `vscode.CustomTextEditorProvider` 接口
- 管理 WebView 与文本文档的双向同步
- 处理 HTML DOM 操作和缩进配置
- 使用 JSDOM 进行服务端 HTML 解析

#### 主要功能
1. **可视化编辑**: 在 WebView 中直接编辑 HTML 元素
2. **实时同步**: 代码编辑器与可视化编辑器的选择同步
3. **元素操作**: 支持复制、剪切、粘贴和拖拽重排
4. **缩放功能**: 页面缩放查看

#### 依赖关系
- `jsdom` - 服务端 HTML 解析和操作
- `he` - HTML 实体编码/解码
- VSCode API - 自定义编辑器和 WebView 集成

### 扩展配置
- 支持的文件类型：`.html`, `.htm`, `.xhtml`, `.shtml`, `.xht`, `.mhtml`, `.mht`, `.ehtml`
- 配置选项：
  - `webVisualEditor.allowScript` - 是否启用 JavaScript 预览
  - `webVisualEditor.enableMovingElements` - 是否允许拖拽元素

## 代码规范

### TypeScript 配置
- 目标版本：ES2022
- 模块系统：Node16
- 严格模式启用

### ESLint 规则
- 使用单引号字符串
- 2 空格缩进
- Unix 换行符
- 强制使用分号
- 命名约定：驼峰式和帕斯卡式

## 开发注意事项

1. **WebView 通信**: 扩展使用 WebView 与前端进行双向通信，需要注意消息传递的格式和时序
2. **HTML 解析**: 使用 JSDOM 进行服务端 HTML 解析，避免在 WebView 中进行复杂的 DOM 操作
3. **同步机制**: 代码编辑器和可视化编辑器之间的同步是核心功能，需要仔细处理选择状态和内容变更
4. **性能优化**: 大型 HTML 文件的处理需要考虑性能，避免频繁的 DOM 操作