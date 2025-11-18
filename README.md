# AI Chat Application

An AI chat application with streaming responses, built on Cloudflare Workers with Hono framework.

## Quick Start

```bash
pnpm install
pnpm run dev
```

## Deployment

```bash
pnpm run deploy
```

## Database Management

This project uses Drizzle ORM for type-safe database operations with Cloudflare D1.

### Database Schema

The database schema is defined in `src/db/schema.ts` using Drizzle's schema API. All tables, columns, indexes, and relationships are defined there.

### Migration Workflow

#### 1. Generate Migrations

After modifying the schema in `src/db/schema.ts`, generate a migration:

```bash
pnpm run db:generate
```

This creates SQL migration files in `src/db/migrations/` directory.

#### 2. Review Generated SQL

Always review the generated migration files before applying them:

```bash
cat src/db/migrations/0001_*.sql
```

#### 3. Apply Migrations

**Local Development:**
```bash
pnpm run db:migrate
```

**Production:**
```bash
pnpm run db:migrate:prod
```

#### 4. Drop Migrations (if needed)

To remove the last migration (use with caution):

```bash
pnpm run db:drop
```

### Migration Best Practices

- Always review generated SQL before applying migrations
- Test migrations on local D1 database first
- Keep migrations small and focused
- Never edit migration files manually after generation
- Commit migration files to version control

## Type Generation

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```bash
pnpm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## Available Scripts

- `pnpm run dev` - Start local dev server (builds frontend + runs wrangler)
- `pnpm run dev:frontend` - Frontend dev server only (Vite)
- `pnpm run build` - Full build (frontend + dry-run deploy check)
- `pnpm run deploy` - Build + deploy to production
- `pnpm run test` - Run all tests once
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run db:generate` - Generate database migrations from schema
- `pnpm run db:migrate` - Apply migrations to local D1 database
- `pnpm run db:migrate:prod` - Apply migrations to production D1 database
- `pnpm run db:drop` - Drop last migration (use with caution)


## Character Cards

This application supports Character Card V3 (CCv3) format for rich character personalities and dynamic prompt rendering.

### Character Card Format

Character cards follow the CCv3 specification with the following structure:

```json
{
  "spec": "chara_card_v3",
  "spec_version": "3.0",
  "data": {
    "name": "Character Name",
    "nickname": "Optional nickname for {{char}} macro",
    "description": "Character description with {{char}} and {{user}} macros",
    "personality": "Personality traits",
    "scenario": "Current scenario or context",
    "first_mes": "Initial greeting message",
    "alternate_greetings": ["Alternative greeting 1", "Alternative greeting 2"],
    "mes_example": "Example conversation format",
    "system_prompt": "System-level instructions",
    "post_history_instructions": "Instructions applied after history",
    "tags": ["tag1", "tag2"],
    "creator": "Creator name",
    "character_version": "1.0",
    "creator_notes": "Notes about the character",
    "extensions": {},
    "group_only_greetings": [],
    "character_book": {
      "name": "Lorebook name",
      "description": "Lorebook description",
      "entries": [
        {
          "keys": ["keyword1", "keyword2"],
          "content": "Content to inject when keys match",
          "enabled": true,
          "insertion_order": 0,
          "use_regex": false,
          "constant": false,
          "extensions": {}
        }
      ],
      "extensions": {}
    }
  }
}
```

### Required Fields

Only three fields are required for a valid character card:
- `name` - Character's name
- `description` - Character description
- `first_mes` - Initial greeting message

All other fields are optional.

### CBS Macros

Character cards support Curly Braced Syntax (CBS) macros for dynamic text:

- `{{char}}` - Replaced with character's nickname (or name if no nickname)
- `{{user}}` - Replaced with user's display name
- `{{random:A,B,C}}` - Randomly selects one option
- `{{pick:A,B,C}}` - Consistently selects same option for same context
- `{{roll:N}}` or `{{roll:dN}}` - Random number between 1 and N
- `{{reverse:text}}` - Reverses the text
- `{{// comment}}` - Removed from output (comment)
- `{{hidden_key:text}}` - Removed from output but used for lorebook scanning

### Lorebook Entries

Lorebook entries conditionally inject content based on keywords in the conversation:

**Basic Entry:**
```json
{
  "keys": ["keyword"],
  "content": "Content to inject",
  "enabled": true,
  "insertion_order": 0,
  "use_regex": false,
  "constant": false
}
```

**Decorators:**

Lorebook entries support decorators to control behavior:

- `@@depth N` - Insert at Nth message from most recent
- `@@role assistant|system|user` - Format as specific message role
- `@@activate_only_after N` - Only activate after N assistant messages
- `@@activate_only_every N` - Activate every N messages
- `@@position after_desc|before_desc` - Position relative to description
- `@@scan_depth N` - Only scan last N messages for keys

Example with decorators:
```json
{
  "keys": ["magic", "spell"],
  "content": "@@role system\n@@depth 2\nMagic in this world requires focus and energy.",
  "enabled": true,
  "insertion_order": 0
}
```

### Example Character Cards

Example character cards are provided in `examples/character-cards/`:

- `detective-noir.json` - Hard-boiled detective with noir atmosphere
- `wizard-mentor.json` - Fantasy wizard mentor with magic system
- `space-captain.json` - Sci-fi spaceship captain with decision-making
- `simple-assistant.json` - Minimal example without lorebook

### Seeding Example Characters

To populate your local database with example character cards:

1. Generate the seed SQL:
```bash
pnpm run seed:characters
```

2. Apply the generated SQL to your local D1 database:
```bash
wrangler d1 execute DB --local --file=seed.sql
```

Or copy the SQL output and run directly:
```bash
wrangler d1 execute DB --local --command="INSERT INTO character_cards ..."
```

### Using Character Cards in Chat

#### Via Frontend UI

The web interface provides a character card selector:

1. Click the "+ Upload" button to upload a Character Card V3 JSON file
2. Select a character from the dropdown menu
3. View the character's greeting message before starting the conversation
4. Start chatting - the character's personality and context will be applied automatically
5. Click "+ New Conversation" to start fresh while keeping the same character

#### Via API

To use a character card programmatically:

1. Create or upload a character card to the database
2. Start a new conversation with the character card ID
3. The system will:
   - Compile static context (description, personality, system prompt) once
   - Process CBS macros in messages
   - Match lorebook entries based on conversation context
   - Render the final prompt using Jinja templates

### API Endpoints

Character card management endpoints:

- `POST /api/character-cards` - Create a new character card
- `GET /api/character-cards` - List all character cards
- `GET /api/character-cards/:id` - Get a specific character card
- `PUT /api/character-cards/:id` - Update a character card
- `DELETE /api/character-cards/:id` - Delete a character card

### Template Rendering

The system uses `@huggingface/jinja` for template rendering with built-in templates:

- **ChatML** - Default format for most models
- **Alpaca** - Alpaca instruction format
- **Llama** - Llama chat format

Templates have access to:
- `character` - Full character card data
- `messages` - Conversation history
- `userName` - User's display name
- `lorebookEntries` - Matched lorebook entries
- `systemPrompt` - System-level instructions

### Performance

Character cards are optimized for performance:

- **Static compilation**: Character description, personality, and system prompt are processed once per conversation and cached
- **Dynamic processing**: Only lorebook matching and current message macros are processed per message
- **First message**: ~50-100ms (includes static compilation)
- **Subsequent messages**: ~10-20ms (dynamic processing only)

### Validation

Character cards are validated on creation and update:

```typescript
import { validateCharacterCard } from './src/models/character-card.js';

const isValid = validateCharacterCard(cardData);
```

The validator checks:
- Correct spec and version
- Required fields present (name, description, first_mes)
- Proper data structure

### Creating Character Cards Programmatically

```typescript
import { createCharacterCard } from './src/models/character-card.js';

const card = createCharacterCard(
  "Character Name",
  "Character description with {{char}} macro",
  "Hello! I'm {{char}}. Nice to meet you!"
);
```

## Available Scripts

- `pnpm run dev` - Start local dev server (builds frontend + runs wrangler)
- `pnpm run dev:frontend` - Frontend dev server only (Vite)
- `pnpm run build` - Full build (frontend + dry-run deploy check)
- `pnpm run deploy` - Build + deploy to production
- `pnpm run test` - Run all tests once
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run db:generate` - Generate database migrations from schema
- `pnpm run db:migrate` - Apply migrations to local D1 database
- `pnpm run db:migrate:prod` - Apply migrations to production D1 database
- `pnpm run db:drop` - Drop last migration (use with caution)
- `pnpm run seed:characters` - Generate SQL to seed example character cards
