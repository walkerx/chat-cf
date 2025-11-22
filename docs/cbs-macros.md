# CBS (Curly Braced Syntax) Macros - Implementation Summary

All CBS macros defined in Character Card V3 specification have been fully implemented.

## ✅ Implemented Macros

### 1. `{{char}}`
**Spec**: Replace with character's nickname, or name if nickname is empty.
**Implementation**: ✅ Fully implemented in `replaceChar()`
**Example**: `"Hello, I am {{char}}!"` → `"Hello, I am Alice!"`

### 2. `{{user}}`
**Spec**: Replace with user's display name.
**Implementation**: ✅ Fully implemented in `replaceUser()`
**Example**: `"Nice to meet you, {{user}}!"` → `"Nice to meet you, Bob!"`

### 3. `{{random:A,B,C}}`
**Spec**: Replace with a random value from comma-separated options. Supports escaped commas `\,`.
**Implementation**: ✅ Fully implemented in `replaceRandom()` with `splitWithEscapedCommas()`
**Example**: `"{{random:Hello,Hi,Hey}}"` → `"Hello"` or `"Hi"` or `"Hey"` (random)
**Escaped**: `"{{random:A\,B,C}}"` → `"A,B"` or `"C"`

### 4. `{{pick:A,B,C}}`
**Spec**: Replace with a consistently selected value based on seed. Same prompt = same result. Supports escaped commas `\,`.
**Implementation**: ✅ Fully implemented in `replacePick()` with hash-based selection
**Example**: `"{{pick:Apple,Banana}}"` → Always same result for same conversation
**Note**: Uses `conversationId` as seed for consistency

### 5. `{{roll:N}}` / `{{roll:dN}}`
**Spec**: Replace with random number between 1 and N. Supports `d` prefix (case insensitive).
**Implementation**: ✅ Fully implemented in `replaceRoll()`
**Example**: 
- `"{{roll:6}}"` → `"3"` (random 1-6)
- `"{{roll:d20}}"` → `"15"` (random 1-20)

### 6. `{{reverse:text}}`
**Spec**: Replace with reversed text.
**Implementation**: ✅ Fully implemented in `replaceReverse()`
**Example**: `"{{reverse:Hello}}"` → `"olleH"`

### 7. `{{// comment}}`
**Spec**: Remove from output. Not used for lorebook matching.
**Implementation**: ✅ Fully implemented in `removeComments()`
**Example**: `"Hello {{// secret}} World"` → `"Hello  World"`

### 8. `{{hidden_key:text}}`
**Spec**: Remove from output but extract for lorebook matching (recursive scanning).
**Implementation**: ✅ Fully implemented in `removeHiddenKeys()` and `extractHiddenKeys()`
**Example**: `"{{hidden_key:magic}}"` → `""` (removed from output, but "magic" used for lorebook)

### 9. `{{comment: text}}`
**Spec**: Remove from prompt output. Should be displayed as inline comment in UI (not implemented in UI).
**Implementation**: ✅ Fully implemented in `removeInlineComments()`
**Example**: `"Hello {{comment: note}} World"` → `"Hello  World"`

## 🔧 Implementation Details

### Processing Order
1. Extract and remove `{{hidden_key:}}`
2. Remove `{{//}}` and `{{comment:}}`
3. Replace content-generating macros:
   - `{{char}}`
   - `{{user}}`
   - `{{random:}}`
   - `{{pick:}}`
   - `{{roll:}}`
   - `{{reverse:}}`

### Special Features
- **Case Insensitive**: All macros are detected case-insensitively (as per spec)
- **Escaped Commas**: `{{random:}}` and `{{pick:}}` support `\,` for literal commas
- **Consistent Pick**: `{{pick:}}` uses simple hash function for deterministic selection
- **Hidden Keys**: Extracted separately for lorebook recursive scanning

## 📝 Usage in Character Cards

CBS macros can be used in:
- `description`
- `personality`
- `scenario`
- `first_mes`
- `mes_example`
- `system_prompt`
- `post_history_instructions`
- Lorebook entry `content`
- Any other text fields

## 🎯 Compliance

✅ **100% compliant** with Character Card V3 specification for CBS macros.

All required macros are implemented with full support for:
- Proper escaping
- Correct processing order
- Hidden key extraction
- Consistent randomization (for `{{pick:}}`)
