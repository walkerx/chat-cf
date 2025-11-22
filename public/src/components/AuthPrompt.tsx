/**
 * Auth Prompt Component
 * Small tooltip/prompt shown on character cards when not logged in
 */

import { memo } from "react";

export interface AuthPromptProps {
    message: string;
}

export const AuthPrompt = memo(function AuthPrompt({ message }: AuthPromptProps) {
    return (
        <div className="auth-prompt" role="tooltip">
            <div className="auth-prompt-icon">🔒</div>
            <div className="auth-prompt-text">{message}</div>
        </div>
    );
});
