/**
 * Regex Script Processor
 * Processes regex_scripts from Character Card extensions
 * Applies regex replacements to AI-generated content for UI enhancement
 */

export interface RegexScript {
    id: string;
    scriptName: string;
    findRegex: string;  // Regex pattern with flags (e.g., "/pattern/g")
    replaceString: string;  // Replacement string (supports $1, $2, etc.)
    trimStrings?: string[];
    placement?: number[];  // 1 = AI messages, 2 = User messages
    disabled?: boolean;
    markdownOnly?: boolean;
    promptOnly?: boolean;
    runOnEdit?: boolean;
    substituteRegex?: number;
    minDepth?: number | null;
    maxDepth?: number | null;
}

export interface RegexScriptProcessorOptions {
    isAIMessage: boolean;  // true for AI messages, false for user messages
    isMarkdown?: boolean;
    messageDepth?: number;
}

/**
 * Regex Script Processor
 * Applies regex replacements from character card extensions
 */
export class RegexScriptProcessor {
    /**
     * Process content with regex scripts
     */
    process(
        content: string,
        scripts: RegexScript[],
        options: RegexScriptProcessorOptions = { isAIMessage: true }
    ): string {
        let result = content;

        // Filter and sort scripts
        const activeScripts = this.filterScripts(scripts, options);

        // Apply each script in order
        for (const script of activeScripts) {
            try {
                result = this.applyScript(result, script);
            } catch (error) {
                console.warn(`Failed to apply regex script "${script.scriptName}":`, error);
                // Continue with other scripts even if one fails
            }
        }

        return result;
    }

    /**
     * Filter scripts based on options
     */
    private filterScripts(
        scripts: RegexScript[],
        options: RegexScriptProcessorOptions
    ): RegexScript[] {
        return scripts.filter(script => {
            // Skip disabled scripts
            if (script.disabled) {
                return false;
            }

            // Check placement (1 = AI, 2 = User)
            if (script.placement && script.placement.length > 0) {
                const targetPlacement = options.isAIMessage ? 1 : 2;
                if (!script.placement.includes(targetPlacement)) {
                    return false;
                }
            }

            // Check markdown only
            if (script.markdownOnly && !options.isMarkdown) {
                return false;
            }

            // Check prompt only (skip for display)
            if (script.promptOnly) {
                return false;
            }

            // Check depth constraints
            if (options.messageDepth !== undefined) {
                if (script.minDepth !== null && script.minDepth !== undefined) {
                    if (options.messageDepth < script.minDepth) {
                        return false;
                    }
                }
                if (script.maxDepth !== null && script.maxDepth !== undefined) {
                    if (options.messageDepth > script.maxDepth) {
                        return false;
                    }
                }
            }

            return true;
        });
    }

    /**
     * Apply a single regex script
     */
    private applyScript(content: string, script: RegexScript): string {
        const { pattern, flags } = this.parseRegex(script.findRegex);

        // Create regex with parsed pattern and flags
        const regex = new RegExp(pattern, flags);

        // Apply replacement
        let result = content.replace(regex, script.replaceString);

        // Apply trim strings if specified
        if (script.trimStrings && script.trimStrings.length > 0) {
            for (const trimStr of script.trimStrings) {
                result = result.split(trimStr).join('');
            }
        }

        return result;
    }

    /**
     * Parse regex string (e.g., "/pattern/gi") into pattern and flags
     */
    private parseRegex(regexStr: string): { pattern: string; flags: string } {
        // Check if it's in /pattern/flags format
        const match = regexStr.match(/^\/(.+?)\/([gimsuvy]*)$/);

        if (match) {
            return {
                pattern: match[1],
                flags: match[2] || '',
            };
        }

        // If not in /pattern/flags format, treat as plain pattern
        return {
            pattern: regexStr,
            flags: '',
        };
    }

    /**
     * Extract regex scripts from character card
     */
    static extractScripts(characterCard: any): RegexScript[] {
        const scripts = characterCard?.data?.extensions?.regex_scripts;

        if (!Array.isArray(scripts)) {
            return [];
        }

        return scripts.filter((script: any) => {
            // Validate required fields
            return (
                script &&
                typeof script.scriptName === 'string' &&
                typeof script.findRegex === 'string' &&
                typeof script.replaceString === 'string'
            );
        });
    }

    /**
     * Extract all HTML tags used in replacement strings
     * This allows us to dynamically whitelist custom tags defined in scripts
     */
    static extractTagsFromScripts(scripts: RegexScript[]): string[] {
        const tags = new Set<string>();
        // Regex to match opening tags like <div, <dm, <my-tag
        const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)/g;

        for (const script of scripts) {
            if (!script.replaceString) continue;

            let match;
            while ((match = tagRegex.exec(script.replaceString)) !== null) {
                tags.add(match[1].toLowerCase());
            }
        }

        return Array.from(tags);
    }
}
