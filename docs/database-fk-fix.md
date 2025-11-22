# 数据库外键约束修复

## 问题描述

删除 Character Card 时出现以下错误：

```
FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
```

## 根本原因

在迁移文件 `0001_melodic_felicia_hardy.sql` 中，添加 `character_card_id` 外键时没有指定 `ON DELETE` 行为：

```sql
-- 错误的写法
ALTER TABLE `conversations` ADD `character_card_id` text REFERENCES character_cards(id);
```

这导致当尝试删除一个被 conversations 引用的 character card 时，SQLite 会阻止删除操作。

## 解决方案

创建了新的迁移 `0002_fix_character_card_fk.sql`，重建 `conversations` 表并添加正确的外键约束：

```sql
FOREIGN KEY (`character_card_id`) REFERENCES `character_cards`(`id`) ON UPDATE no action ON DELETE set null
```

现在当删除 character card 时：
- ✅ 删除操作会成功
- ✅ 相关 conversations 的 `character_card_id` 会被设置为 `NULL`
- ✅ conversations 和 messages 不会被删除（保留聊天历史）

## 迁移步骤

### 本地环境
```bash
npm run db:migrate
```

### 生产环境
```bash
npm run db:migrate:prod
```

## 验证

删除 character card 后，检查数据库：

```sql
-- 查看相关的 conversations
SELECT id, character_card_id FROM conversations WHERE character_card_id IS NULL;
```

应该能看到之前关联到被删除 character card 的 conversations，它们的 `character_card_id` 现在是 `NULL`。

## 注意事项

1. **SQLite 限制**：SQLite 不支持 `ALTER COLUMN`，所以需要重建整个表
2. **数据保留**：迁移过程中所有数据都会被保留
3. **索引重建**：迁移会重新创建所有索引
4. **外键启用**：确保 SQLite 的外键约束已启用（Cloudflare D1 默认启用）

## Schema 定义

在 `src/db/schema.ts` 中的正确定义：

```typescript
characterCardId: text('character_card_id').references(() => characterCards.id, {
  onDelete: 'set null',  // ✅ 正确：删除 card 时设置为 null
}),
```

## 相关文件

- 迁移文件：`src/db/migrations/0002_fix_character_card_fk.sql`
- Schema 定义：`src/db/schema.ts`
- 删除逻辑：`src/services/db.ts` (deleteCharacterCard)
- API 处理：`src/handlers/character-cards.ts` (handleDeleteCharacterCard)
