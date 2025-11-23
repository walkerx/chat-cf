# PNG Character Card 导入功能

## 功能概述

现在支持从 PNG 格式的 Character Card V3 文件中导入角色卡片。PNG 文件中嵌入的角色数据会被自动提取,同时 PNG 图片会被转换为 WebP 格式作为角色头像。

## 技术实现

### 1. PNG 元数据提取

使用 `png-chunks-extract` 和 `png-chunk-text` 库从 PNG 文件的 tEXt chunk 中提取 Character Card V3 数据:

- 查找名为 `ccv3` 的 tEXt chunk
- 如果没有找到,回退到查找 `chara` chunk (向后兼容)
- Base64 解码并解析 JSON 数据
- 支持 V2 到 V3 格式的自动转换

### 2. 图片格式转换

PNG 图片会被自动转换为 WebP 格式以优化存储和加载性能:

- 最大尺寸: 400x400 像素
- 保持宽高比
- WebP 质量: 85%
- 使用高质量图像平滑算法

### 3. 自动头像上传

转换后的 WebP 图片会自动上传到服务器,并将 URL 添加到角色卡片的 `avatar` 字段中。

## 使用方法

1. 在角色画廊页面点击"+ 上传"按钮
2. 选择一个包含 CCv3 数据的 PNG 文件
3. 系统会自动:
   - 提取角色卡片数据
   - 转换图片为 WebP 格式
   - 上传头像
   - 创建角色卡片

## 支持的格式

- **JSON**: 标准的 Character Card V3 JSON 文件
- **PNG**: 包含嵌入 CCv3 数据的 PNG 图片文件

## 相关文件

- `/public/src/utils/pngCharacterCard.ts` - PNG 处理工具函数
- `/public/src/components/UploadModal.tsx` - 上传模态框组件
- `/public/src/types/png-chunks.d.ts` - TypeScript 类型声明

## 依赖包

- `png-chunks-extract` - 提取 PNG chunks
- `png-chunk-text` - 解码 tEXt chunks
