/**
 * Username Setup Modal
 * Prompts user to set their username on first login
 */

import { useState, type FormEvent } from 'react';
import { AvatarUpload } from './AvatarUpload.js';

export interface UsernameSetupProps {
    onSubmit: (username: string, avatarUrl?: string) => Promise<void>;
    onSkip?: () => void;
    initialUsername?: string;
    initialAvatarUrl?: string;
}

export function UsernameSetup({ onSubmit, onSkip, initialUsername = '', initialAvatarUrl = '' }: UsernameSetupProps) {
    const [username, setUsername] = useState(initialUsername);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
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
            await onSubmit(trimmedUsername, avatarUrl);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to save profile');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="username-setup-overlay">
            <div className="username-setup-modal">
                <div className="username-setup-header">
                    <h2>Set Your Profile</h2>
                    <p>Customize how you appear in chats</p>
                </div>

                <form className="username-setup-form" onSubmit={handleSubmit}>
                    <div className="username-input-group" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <AvatarUpload
                            currentAvatarUrl={avatarUrl}
                            onUpload={setAvatarUrl}
                            size={100}
                        />
                    </div>

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
                            {loading ? 'Saving...' : 'Save Profile'}
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
