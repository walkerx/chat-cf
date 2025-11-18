# Example Character Cards

This directory contains example character cards in Character Card V3 (CCv3) format. These examples demonstrate various features of the character card system including CBS macros, lorebook entries, and decorators.

## Available Examples

### 1. Detective Noir (`detective-noir.json`)

A hard-boiled detective character set in a rain-soaked noir city.

**Features demonstrated:**
- Character personality and scenario
- Multiple alternate greetings
- CBS macros in descriptions and messages
- Lorebook with city lore and case information
- `@@role` decorator for dynamic assistant responses

**Use case:** Mystery and investigation roleplay scenarios

### 2. Wizard Mentor (`wizard-mentor.json`)

An ancient elven wizard who mentors young magic users in a floating tower.

**Features demonstrated:**
- `{{random}}` macro for varied content
- `{{roll}}` macro for dice-like randomization
- Extensive lorebook with magical world-building
- `@@position` decorator for content placement
- `@@activate_only_after` decorator for progressive revelation
- Multiple lorebook entries with different activation rules

**Use case:** Fantasy learning and magic system exploration

### 3. Space Captain (`space-captain.json`)

A pragmatic spaceship captain navigating the outer colonies.

**Features demonstrated:**
- Decision-making scenarios
- Technical terminology and world-building
- `@@scan_depth` decorator for context-aware entries
- `@@activate_only_after` for crew information timing
- Lorebook entries for ship systems and universe lore

**Use case:** Sci-fi adventure and command decisions

### 4. Simple Assistant (`simple-assistant.json`)

A minimal friendly assistant character without lorebook.

**Features demonstrated:**
- Minimal required fields only
- Basic `{{char}}` and `{{user}}` macros
- Multiple alternate greetings
- No lorebook (demonstrates simplest valid card)

**Use case:** Testing basic functionality and simple conversations

## Using These Examples

### Option 1: Seed Script (Recommended)

Generate SQL to populate your database:

```bash
pnpm run seed:characters
```

Then apply the SQL to your local D1 database:

```bash
wrangler d1 execute DB --local --command="<paste SQL here>"
```

### Option 2: Manual Import

1. Read the JSON file
2. POST to `/api/character-cards` endpoint
3. Use the returned ID in chat requests

### Option 3: Direct Database Insert

```sql
INSERT INTO character_cards (id, name, data, created_at, modified_at)
VALUES (
  'card_id_here',
  'Character Name',
  '{"spec":"chara_card_v3",...}',
  datetime('now'),
  datetime('now')
);
```

## Character Card Structure

All examples follow the CCv3 specification:

```
{
  spec: "chara_card_v3"
  spec_version: "3.0"
  data: {
    // Required fields
    name: string
    description: string
    first_mes: string
    
    // Optional fields
    nickname?: string
    personality?: string
    scenario?: string
    alternate_greetings?: string[]
    mes_example?: string
    system_prompt?: string
    post_history_instructions?: string
    tags?: string[]
    creator?: string
    character_version?: string
    creator_notes?: string
    
    // Lorebook (optional)
    character_book?: {
      entries: LorebookEntry[]
      ...
    }
  }
}
```

## CBS Macros Used

These examples demonstrate various CBS macros:

- `{{char}}` - Character name/nickname
- `{{user}}` - User's name
- `{{random:A,B,C}}` - Random selection
- `{{roll:N}}` - Random number 1-N
- `{{roll:dN}}` - Dice notation (same as roll:N)

## Lorebook Decorators Used

Examples include these decorators:

- `@@role assistant|system|user` - Message role formatting
- `@@depth N` - Position in message history
- `@@position after_desc` - Relative positioning
- `@@scan_depth N` - Limit scanning to recent messages
- `@@activate_only_after N` - Delay activation

## Customization

Feel free to modify these examples or create your own:

1. Copy an existing example
2. Modify the character data
3. Adjust lorebook entries for your scenario
4. Test with the seed script or API

## Validation

All examples are valid CCv3 cards and pass validation:

```typescript
import { validateCharacterCard } from '../../src/models/character-card.js';

const card = JSON.parse(cardJson);
const isValid = validateCharacterCard(card); // true
```

## Further Reading

- See main README.md for complete character card documentation
- Check `src/models/character-card.ts` for TypeScript interfaces
- Review `.kiro/specs/character-card-prompt-rendering/` for full specification
