# 布局功能
默认情况下无特殊布局；
当布局设置成flex的时候，需要支持：Direction\Vertical\Horizontal\gap 属性的设置；


# 字体粗细设置
默认Regular
可选择：Thin\Exta Light\ light\Medium\semiBold\bold\Extrabold\black

# 内容对齐方式支持


# 尺寸
宽度支持 Hug、Fill、Rel、Fixed
最大宽度
最小宽度

高度同理

# 圆角
默认整体控制，支持单独控制四个角
边框同理

# 图片
支持本地图片引用

# 背景色
优先从css设计token中选择


缺少design token的管理

考虑一下不同分辨率下，tailwind样式

---- 

当前项目在通过 webview/modules/ui/ElementPanel.js 
  操作元素背景和字体颜色时,发现修改背景\字体颜色就消失了,修改字体
  颜色背景的样式又消失了,帮我解决这个问题


---
字体
-- 布局