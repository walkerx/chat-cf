/**
 * Username Setup Modal
 * Prompts user to set their username on first login
 */

import { useState, type FormEvent } from 'react';

export interface UsernameSetupProps {
    onSubmit: (username: string) => Promise<void>;
    onSkip?: () => void;
    initialUsername?: string;
}

export function UsernameSetup({ onSubmit, onSkip, initialUsername = '' }: UsernameSetupProps) {
    const [username, setUsername] = useState(initialUsername);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const trimmedUsername = username.trim();

        // Validation
        if (!trimmedUsername) {
            setError('Username cannot be empty');
            return;
        }

        if (trimmedUsername.length < 2) {
            setError('Username must be at least 2 characters');
            return;
        }

        if (trimmedUsername.length > 30) {
            setError('Username must be less than 30 characters');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onSubmit(trimmedUsername);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to save username');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="username-setup-overlay">
            <div className="username-setup-modal">
                <div className="username-setup-header">
                    <h2>Set Your Username</h2>
                    <p>This name will be used when chatting with characters</p>
                </div>

                <form className="username-setup-form" onSubmit={handleSubmit}>
                    <div className="username-input-group">
                        <label htmlFor="username" className="username-label">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="username-input"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoFocus
                            maxLength={30}
                            required
                        />
                        <div className="username-hint">
                            This will replace <code>{'{{user}}'}</code> in character messages
                        </div>
                    </div>

                    {error && (
                        <div className="username-error">{error}</div>
                    )}

                    <div className="username-actions">
                        <button
                            type="submit"
                            disabled={loading}
                            className="username-submit"
                        >
                            {loading ? 'Saving...' : 'Save Username'}
                        </button>
                        {onSkip && (
                            <button
                                type="button"
                                onClick={onSkip}
                                className="username-skip"
                                disabled={loading}
                            >
                                Skip for Now
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
