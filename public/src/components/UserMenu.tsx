/**
 * User Menu Component
 * Dropdown menu showing user info and username edit option
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { UsernameSetup } from './UsernameSetup.js';

export function UserMenu() {
    const { user, username, avatarUrl, signOut, updateUsername, updateAvatar } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [showUsernameEdit, setShowUsernameEdit] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    if (!user) {
        return null;
    }

    const displayName = username || user.email?.split('@')[0] || 'User';

    const handleProfileSubmit = async (newUsername: string, newAvatarUrl?: string) => {
        await updateUsername(newUsername);
        if (newAvatarUrl) {
            await updateAvatar(newAvatarUrl);
        }
        setShowUsernameEdit(false);
        setShowMenu(false);
    };

    const handleSignOut = async () => {
        setShowMenu(false);
        await signOut();
    };

    return (
        <>
            <div className="user-menu" ref={menuRef}>
                <button
                    className="user-menu-trigger"
                    onClick={() => setShowMenu(!showMenu)}
                    aria-label="User menu"
                    aria-expanded={showMenu}
                    aria-haspopup="true"
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="user-avatar-img" />
                    ) : (
                        <span className="user-avatar">{displayName[0].toUpperCase()}</span>
                    )}
                    <span className="user-name">{displayName}</span>
                    <span className="user-menu-arrow">▼</span>
                </button>

                {showMenu && (
                    <div className="user-menu-dropdown" role="menu">
                        <div className="user-menu-header">
                            <div className="user-menu-email">{user.email}</div>
                            {username && (
                                <div className="user-menu-username">@{username}</div>
                            )}
                        </div>

                        <div className="user-menu-divider" />

                        <button
                            className="user-menu-item"
                            onClick={() => {
                                setShowUsernameEdit(true);
                                setShowMenu(false);
                            }}
                            role="menuitem"
                        >
                            <span className="user-menu-icon">✏️</span>
                            Edit Profile
                        </button>

                        <div className="user-menu-divider" />

                        <button
                            className="user-menu-item user-menu-item-danger"
                            onClick={handleSignOut}
                            role="menuitem"
                        >
                            <span className="user-menu-icon">🚪</span>
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            {showUsernameEdit && createPortal(
                <UsernameSetup
                    onSubmit={handleProfileSubmit}
                    onSkip={() => setShowUsernameEdit(false)}
                    initialUsername={username || ''}
                    initialAvatarUrl={avatarUrl || ''}
                />,
                document.body
            )}
            <style>{`
                .user-avatar-img {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                }
            `}</style>
        </>
    );
}
