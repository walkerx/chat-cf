/**
 * Simple CBS (Curly Braced Syntax) macro processor for frontend
 * Handles basic {{user}} and {{char}} replacements
 */

export interface CBSContext {
    userName: string;
    charName: string;
}

/**
 * Process basic CBS macros in text
 * Currently supports: {{user}}, {{char}}
 */
export function processCBSMacros(text: string, context: CBSContext): string {
    let result = text;

    // Replace {{char}} with character name
    result = result.replace(/\{\{char\}\}/gi, context.charName);

    // Replace {{user}} with user name
    result = result.replace(/\{\{user\}\}/gi, context.userName);

    return result;
}
