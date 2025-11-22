# Regex Script 支持实现方案

## 📋 概述

实现通用的 **Regex Script 处理引擎**，支持 Character Card 中定义的 `regex_scripts` 扩展功能。

这是一个**通用系统**，不针对特定卡片，而是读取任何卡片的 `extensions.regex_scripts` 并应用。

## 🔄 工作流程

```
1. 加载 Character Card
   ↓
2. 提取 regex_scripts 配置
   ↓
3. AI 生成回复（包含自定义标记）
   ↓
4. 应用 regex 替换（标记 → HTML）
   ↓
5. 渲染到 UI
```

## 📝 Regex Script 格式

### 标准格式（来自 SillyTavern）

```typescript
interface RegexScript {
  id: string;                    // 唯一标识
  scriptName: string;            // 脚本名称
  findRegex: string;             // 正则表达式（如 "/<dm>(.*?)<\/dm>/g"）
  replaceString: string;         // 替换字符串（支持 $1, $2 等）
  placement?: number[];          // [1, 2] - 1=AI消息, 2=用户消息
  disabled?: boolean;            // 是否禁用
  markdownOnly?: boolean;        // 仅在 markdown 模式应用
  promptOnly?: boolean;          // 仅在提示词应用（我们跳过）
  runOnEdit?: boolean;           // 编辑时运行
  minDepth?: number | null;      // 最小消息深度
  maxDepth?: number | null;      // 最大消息深度
  trimStrings?: string[];        // 需要删除的字符串
}
```

### 示例

```json
{
  "scriptName": "弹幕",
  "findRegex": "/<dm>([\\s\\S]*?)<\\/dm>/g",
  "replaceString": "<marquee scrollamount=\"3\" style=\"color: #666;\">$1</marquee>",
  "placement": [1, 2],
  "disabled": false,
  "markdownOnly": true
}
```

## 🛠️ 实现

### 1. Regex Script Processor

已创建：`public/src/services/regex-script-processor.ts`

**核心功能**：
- ✅ 解析正则表达式（支持 `/pattern/flags` 格式）
- ✅ 应用替换（支持 `$1`, `$2` 等捕获组）
- ✅ 过滤脚本（根据 placement, depth, disabled 等）
- ✅ 错误处理（单个脚本失败不影响其他脚本）

### 2. 集成到消息渲染

#### 方案 A：在前端应用（推荐）

**优点**：
- ✅ 不影响后端
- ✅ 可以实时预览
- ✅ 用户可以切换开关

**实现位置**：`ChatMessage` 组件

```typescript
import { RegexScriptProcessor } from '../services/regex-script-processor';

function ChatMessage({ message, characterCard }) {
  const processor = new RegexScriptProcessor();
  
  // 提取 regex scripts
  const scripts = RegexScriptProcessor.extractScripts(characterCard);
  
  // 应用替换
  const processedContent = processor.process(
    message.content,
    scripts,
    {
      isAIMessage: message.role === 'assistant',
      isMarkdown: true,
    }
  );
  
  return (
    <div 
      className="message-content"
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(processedContent) }}
    />
  );
}
```

#### 方案 B：在后端应用

**优点**：
- ✅ 统一处理
- ✅ 减少前端计算

**缺点**：
- ❌ 增加后端复杂度
- ❌ 难以调试

### 3. 安全性处理

**必须使用 HTML 清理库**：

```typescript
import DOMPurify from 'dompurify';

function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    // 允许的标签
    ALLOWED_TAGS: [
      // 标准 HTML
      'div', 'span', 'p', 'br', 'img', 'a', 'marquee',
      'details', 'summary', 'table', 'tr', 'td', 'th',
      // 可能的自定义标签（根据需要添加）
      'dm', 'zbj', 'nxxf', 'gz', 'zb',
    ],
    // 允许的属性
    ALLOWED_ATTR: [
      'style', 'class', 'src', 'href', 'alt', 'title',
      'scrollamount', 'data-*',
    ],
    // 禁止的属性
    FORBID_ATTR: [
      'onclick', 'onerror', 'onload', 'onmouseover',
    ],
  });
}
```

### 4. 性能优化

#### 缓存处理后的内容

```typescript
const processedContentCache = new Map<string, string>();

function getProcessedContent(
  messageId: string,
  content: string,
  scripts: RegexScript[]
): string {
  const cacheKey = `${messageId}-${JSON.stringify(scripts)}`;
  
  if (processedContentCache.has(cacheKey)) {
    return processedContentCache.get(cacheKey)!;
  }
  
  const processed = processor.process(content, scripts, options);
  processedContentCache.set(cacheKey, processed);
  
  return processed;
}
```

#### 限制脚本数量

```typescript
const MAX_SCRIPTS = 50;  // 最多处理 50 个脚本

const scripts = RegexScriptProcessor
  .extractScripts(characterCard)
  .slice(0, MAX_SCRIPTS);
```

## 🎯 使用示例

### 示例 1：弹幕效果

**AI 输出**：
```
<dm>这个表演太棒了！</dm>
```

**Regex Script**：
```json
{
  "findRegex": "/<dm>(.*?)<\\/dm>/g",
  "replaceString": "<marquee scrollamount=\"3\" style=\"color: #666;\">$1</marquee>"
}
```

**最终渲染**：
```html
<marquee scrollamount="3" style="color: #666;">这个表演太棒了！</marquee>
```

### 示例 2：直播间

**AI 输出**：
```
<details>
  <summary>直播间</summary>
  <nxxf>观众反应热烈</nxxf>
  <gz>1234</gz>
</details>
```

**Regex Script**：
```json
{
  "findRegex": "/<nxxf>(.*?)<\\/nxxf>/g",
  "replaceString": "<div style=\"background: #ffe6f0; padding: 8px;\">💭 $1</div>"
}
```

**最终渲染**：
```html
<details>
  <summary>直播间</summary>
  <div style="background: #ffe6f0; padding: 8px;">💭 观众反应热烈</div>
  <gz>1234</gz>
</details>
```

## 🔧 配置选项

### 用户可配置

建议在设置中添加：

```typescript
interface RegexScriptSettings {
  enabled: boolean;           // 是否启用 regex scripts
  maxScripts: number;         // 最多处理多少个脚本
  allowCustomTags: boolean;   // 是否允许自定义 HTML 标签
  sanitizeHTML: boolean;      // 是否清理 HTML（建议始终为 true）
}
```

### UI 控制

```tsx
function ChatSettings() {
  const [settings, setSettings] = useState({
    regexScriptsEnabled: true,
    maxScripts: 50,
  });
  
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings.regexScriptsEnabled}
          onChange={(e) => setSettings({
            ...settings,
            regexScriptsEnabled: e.target.checked
          })}
        />
        启用 Regex Scripts（UI 特效）
      </label>
    </div>
  );
}
```

## 🐛 调试

### 调试模式

```typescript
class RegexScriptProcessor {
  private debug = false;
  
  enableDebug() {
    this.debug = true;
  }
  
  private applyScript(content: string, script: RegexScript): string {
    if (this.debug) {
      console.log(`[RegexScript] Applying: ${script.scriptName}`);
      console.log(`[RegexScript] Before:`, content);
    }
    
    const result = /* ... apply regex ... */;
    
    if (this.debug) {
      console.log(`[RegexScript] After:`, result);
    }
    
    return result;
  }
}
```

### 测试用例

```typescript
describe('RegexScriptProcessor', () => {
  it('should replace simple tags', () => {
    const processor = new RegexScriptProcessor();
    const scripts = [{
      scriptName: 'test',
      findRegex: '/<dm>(.*?)<\\/dm>/g',
      replaceString: '<marquee>$1</marquee>',
    }];
    
    const result = processor.process(
      '<dm>Hello</dm>',
      scripts,
      { isAIMessage: true }
    );
    
    expect(result).toBe('<marquee>Hello</marquee>');
  });
});
```

## 📊 实现优先级

### 阶段 1：核心功能（立即）

- ✅ RegexScriptProcessor 类
- ✅ 基础正则替换
- ✅ HTML 清理
- ✅ 集成到消息渲染

**工作量**：2-3 小时

### 阶段 2：增强功能（短期）

- ✅ 性能优化（缓存）
- ✅ 用户设置
- ✅ 调试模式
- ✅ 错误处理

**工作量**：2-3 小时

### 阶段 3：高级功能（长期）

- ✅ 脚本编辑器
- ✅ 实时预览
- ✅ 脚本市场

**工作量**：1-2 天

## 🔐 安全性检查清单

- [ ] 使用 DOMPurify 清理所有 HTML
- [ ] 白名单允许的标签和属性
- [ ] 禁止所有事件处理器（onclick 等）
- [ ] 限制脚本数量
- [ ] 限制正则复杂度（防止 ReDoS）
- [ ] 添加 CSP 头
- [ ] 沙箱化渲染（iframe）

## 📝 总结

### 这是什么？

**通用的 Regex Script 处理引擎**，支持任何 Character Card 中定义的 `regex_scripts`。

### 如何工作？

1. 从 Character Card 读取 `extensions.regex_scripts`
2. 对 AI 生成的内容应用正则替换
3. 将自定义标记转换为 HTML
4. 安全地渲染到 UI

### 优势

- ✅ **通用性**：支持任何卡片的自定义标记
- ✅ **灵活性**：卡片作者可以自由定义 UI 效果
- ✅ **安全性**：通过 DOMPurify 防止 XSS
- ✅ **性能**：缓存处理结果

### 下一步

1. 完成 RegexScriptProcessor 实现
2. 集成到 ChatMessage 组件
3. 添加 DOMPurify
4. 测试验证
