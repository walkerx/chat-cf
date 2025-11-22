# 用户昵称功能实现

## 概述
实现了用户昵称设置功能，允许用户设置自己的昵称，该昵称将在与角色对话时替换 `{{user}}` 变量。

## 功能特性

### 1. 昵称存储
- **存储位置**: Supabase 用户元数据 (`user_metadata.username`)
- **持久化**: 昵称与用户账户绑定，跨设备同步
- **默认值**: 如果未设置昵称，后端使用 "User" 作为默认值

### 2. 首次登录引导
- **自动提示**: 用户首次登录且未设置昵称时，自动显示昵称设置弹窗
- **可跳过**: 用户可以选择"Skip for Now"稍后设置
- **验证规则**:
  - 昵称不能为空
  - 最少 2 个字符
  - 最多 30 个字符

### 3. 昵称使用
- **聊天消息**: 发送消息时自动传递用户昵称到后端
- **CBS 宏替换**: 后端使用 `CBSProcessor` 将角色卡片中的 `{{user}}` 替换为用户昵称
- **动态更新**: 用户可以随时更新昵称（通过 `updateUsername` 函数）

## 技术实现

### 前端实现

#### 1. AuthContext 扩展
**文件**: `public/src/contexts/AuthContext.tsx`

添加的功能：
- `username` 状态：从 Supabase user metadata 读取
- `updateUsername(newUsername: string)` 方法：更新用户昵称

```typescript
interface AuthContextType {
    session: Session | null;
    user: User | null;
    username: string | null;  // 新增
    loading: boolean;
    signOut: () => Promise<void>;
    updateUsername: (newUsername: string) => Promise<void>;  // 新增
}
```

#### 2. UsernameSetup 组件
**文件**: `public/src/components/UsernameSetup.tsx`

功能：
- 模态弹窗形式
- 输入验证（长度、非空）
- 提交和跳过选项
- 错误处理和加载状态

#### 3. AppRoot 组件
**文件**: `public/src/AppRoot.tsx`

职责：
- 检测用户是否需要设置昵称
- 在适当时机显示 `UsernameSetup` 组件
- 处理昵称提交和跳过逻辑

#### 4. ChatContext 更新
**文件**: `public/src/contexts/ChatContext.tsx`

修改：
- `sendMessage` 签名：`(prompt: string, userName?: string) => Promise<void>`
- 传递 `userName` 到 API 请求

#### 5. ChatPage 集成
**文件**: `public/src/pages/ChatPage.tsx`

实现：
- 从 `useAuth()` 获取 `username`
- 创建 `handleSendMessage` 包装函数
- 传递用户名到 `chat.sendMessage()`

### 后端实现

#### 1. API 端点更新
**文件**: `src/handlers/chat-stream.ts`

修改：
- 请求体类型添加 `userName?: string`
- 从请求中提取 `userName`，默认为 "User"
- 传递 `userName` 到 `compileStaticContext` 和 `buildPrompt`

```typescript
// 请求体类型
let body: { 
    prompt?: string; 
    conversationId?: string; 
    characterCardId?: string; 
    userName?: string;  // 新增
};

// 提取用户名
const userName = body.userName?.trim() || "User";

// 使用用户名
compiledContext = await promptBuilder.compileStaticContext(
    characterCardData.data,
    userName  // 传递用户名
);
```

#### 2. CBS 宏处理
**文件**: `src/services/cbs-processor.ts`

已有功能（无需修改）：
- `replaceUser(text: string, userName: string)` 方法
- 将 `{{user}}` 替换为实际用户名

### 样式实现

**文件**: `public/src/styles/auth.css`

新增样式：
- `.username-setup-overlay` - 全屏遮罩
- `.username-setup-modal` - 弹窗容器
- `.username-setup-header` - 标题区域
- `.username-setup-form` - 表单样式
- `.username-input` - 输入框样式
- `.username-hint` - 提示文字（包含 `{{user}}` 代码示例）
- `.username-error` - 错误提示
- `.username-submit` / `.username-skip` - 按钮样式

## 用户流程

### 首次登录流程
```
1. 用户注册/登录
   ↓
2. AuthContext 检测到 user 存在但 username 为 null
   ↓
3. AppRoot 显示 UsernameSetup 弹窗
   ↓
4. 用户输入昵称并提交
   ↓
5. 调用 updateUsername() 更新 Supabase user metadata
   ↓
6. 弹窗关闭，用户可以开始使用
```

### 聊天流程
```
1. 用户在聊天页面输入消息
   ↓
2. ChatPage.handleSendMessage 获取当前 username
   ↓
3. 调用 chat.sendMessage(prompt, username)
   ↓
4. ChatContext 将 userName 包含在 API 请求中
   ↓
5. 后端接收 userName 并传递给 PromptBuilder
   ↓
6. CBSProcessor 将角色卡片中的 {{user}} 替换为实际昵称
   ↓
7. AI 生成的回复中包含用户的昵称
```

## 文件变更总结

### 新建文件
1. `public/src/components/UsernameSetup.tsx` - 昵称设置组件
2. `public/src/AppRoot.tsx` - 应用根组件（处理昵称提示）

### 修改文件

#### 前端
1. `public/src/contexts/AuthContext.tsx` - 添加 username 和 updateUsername
2. `public/src/contexts/ChatContext.tsx` - sendMessage 接受 userName 参数
3. `public/src/pages/ChatPage.tsx` - 传递用户名到 sendMessage
4. `public/src/services/api.ts` - ChatStreamRequest 添加 userName 字段
5. `public/src/main.tsx` - 使用 AppRoot 组件
6. `public/src/styles/auth.css` - 添加昵称设置弹窗样式

#### 后端
1. `src/handlers/chat-stream.ts` - 接受和使用 userName 参数

## API 变更

### POST /api/chat/stream

**请求体**（新增字段）:
```json
{
    "prompt": "Hello!",
    "conversationId": "conv-123",
    "characterCardId": "char-456",
    "userName": "Alice"  // 新增：可选，默认为 "User"
}
```

## 使用示例

### 角色卡片中使用 {{user}}
```json
{
    "first_mes": "Hello {{user}}! Nice to meet you!",
    "scenario": "{{char}} is chatting with {{user}} in a cozy cafe."
}
```

### 实际效果
如果用户昵称设置为 "Alice"：
- 角色问候：`"Hello Alice! Nice to meet you!"`
- 场景描述：`"Elara is chatting with Alice in a cozy cafe."`

## 后续优化建议

1. **昵称编辑界面**
   - 在用户设置页面添加昵称编辑功能
   - 允许用户随时修改昵称

2. **昵称验证增强**
   - 添加敏感词过滤
   - 限制特殊字符使用
   - 检查昵称唯一性（如果需要）

3. **多语言支持**
   - 支持 Unicode 字符
   - 不同语言的长度限制调整

4. **昵称历史**
   - 保存昵称修改历史
   - 允许恢复之前的昵称

5. **个性化设置**
   - 为不同角色设置不同的称呼
   - 支持昵称别名

## 验证清单

- ✅ 用户首次登录时显示昵称设置弹窗
- ✅ 昵称保存到 Supabase user metadata
- ✅ 昵称在聊天时传递到后端
- ✅ 后端正确替换 {{user}} 宏
- ✅ 用户可以跳过昵称设置
- ✅ TypeScript 类型检查通过
- ✅ 样式符合应用主题
- ✅ 错误处理完善
