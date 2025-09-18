# 智能布局适配器

这个模块解决了 Figma 风格的简单操作与 HTML/CSS 复杂规则之间的映射问题。

## 核心组件

### LayoutAdapter.js
主要的智能布局适配器，提供语义化的布局操作接口。

### LayoutMappings.js
定义了从 Figma 风格操作到 CSS 实现的映射规则。

## 解决的问题

1. **操作抽象层缺失**：提供了统一的语义化操作接口
2. **上下文依赖性**：自动分析元素上下文并选择最佳实现策略
3. **多种实现方式**：智能选择最合适的 CSS 实现方案

## 使用示例

### 基本用法

```javascript
// 创建布局适配器
const layoutAdapter = new window.WVE.LayoutAdapter(uiManager);

// 应用居中对齐
layoutAdapter.applyCenterAlignment(element, 'both'); // 水平和垂直居中
layoutAdapter.applyCenterAlignment(element, 'horizontal'); // 仅水平居中
layoutAdapter.applyCenterAlignment(element, 'vertical'); // 仅垂直居中

// 应用其他对齐
layoutAdapter.applyAlignment(element, 'left');
layoutAdapter.applyAlignment(element, 'right');
layoutAdapter.applyAlignment(element, 'center-horizontal');
```

### 智能策略选择

适配器会根据元素的上下文自动选择最佳实现策略：

1. **文本元素**：使用 `text-center`、`text-left` 等文本对齐类
2. **绝对定位元素**：使用 `left-1/2` + `transform` 等定位技术
3. **Flex 子元素**：在父容器上设置 `justify-center`、`items-center` 等
4. **普通块级元素**：使用 `mx-auto` 等边距技术
5. **默认策略**：转换为 Flex 容器并应用对应的对齐属性

### 布局建议

```javascript
// 获取布局建议
const suggestions = layoutAdapter.suggestLayoutStrategy(element);
suggestions.forEach(suggestion => {
  console.log(suggestion.description);
  // 应用建议
  suggestion.apply();
});
```

### Auto Layout 支持

```javascript
// 启用 Auto Layout
layoutAdapter.enableAutoLayout(element, 'horizontal'); // 水平布局
layoutAdapter.enableAutoLayout(element, 'vertical');   // 垂直布局
layoutAdapter.enableAutoLayout(element, 'wrap');       // 环绕布局
```

## 映射规则

### 对齐操作映射

每个对齐操作都有针对不同上下文的实现策略：

- `textElement`: 文本元素的实现
- `flexChild`: Flex 子元素的实现
- `blockElement`: 块级元素的实现
- `absoluteElement`: 绝对定位元素的实现
- `default`: 默认实现策略

### 冲突解决

自动移除冲突的 CSS 类：

```javascript
// 这些类会自动产生冲突检测和移除
'text-left' ←→ ['text-center', 'text-right']
'justify-center' ←→ ['justify-start', 'justify-end']
'mx-auto' ←→ ['ml-auto', 'mr-auto']
```

## 集成示例

在属性面板中的使用：

```javascript
// 在 PositionSection.js 中
handleAlignment(action) {
  // 初始化布局适配器
  if (!this.layoutAdapter) {
    this.layoutAdapter = new window.WVE.LayoutAdapter(this.uiManager);
  }

  // 使用智能对齐
  const alignmentType = this.mapActionToAlignment(action);
  this.layoutAdapter.applyAlignment(this.currentElement, alignmentType);

  // 显示布局建议
  this.showLayoutSuggestions();
}
```

## 扩展性

### 添加新的映射规则

在 `LayoutMappings.js` 中添加新的映射：

```javascript
alignmentMappings: {
  'new-alignment': {
    textElement: { classes: ['new-text-class'] },
    flexChild: { parentClasses: ['new-flex-class'] },
    // ... 其他上下文
  }
}
```

### 添加新的上下文检测

```javascript
contextRules: {
  isNewElementType: (element) => {
    // 自定义检测逻辑
    return element.classList.contains('special-element');
  }
}
```

## 优势

1. **降低学习成本**：用户可以使用熟悉的 Figma 操作方式
2. **智能适配**：自动选择最佳的 CSS 实现方案
3. **一致性**：确保相同操作在不同上下文中的行为一致
4. **可扩展**：易于添加新的操作和映射规则
5. **容错性**：提供回退机制和错误处理

## 未来扩展

- 支持更多 Figma 特性（如约束、组件变体等）
- 添加动画和过渡效果
- 支持自定义映射规则的导入/导出
- 集成设计令牌（Design Tokens）