/**
 * App Root Component
 * Handles username setup prompt for new users
 */

import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.js';
import { GalleryPage } from './pages/GalleryPage.js';
import { ChatPage } from './pages/ChatPage.js';
import AuthPage from './components/AuthPage.js';
import { UsernameSetup } from './components/UsernameSetup.js';
import { GalleryErrorBoundary } from './components/GalleryErrorBoundary.js';
import { ChatErrorBoundary } from './components/ChatErrorBoundary.js';

export function AppRoot() {
    const { user, username, updateUsername, loading } = useAuth();
    const [showUsernameSetup, setShowUsernameSetup] = useState(false);

    // Check if user needs to set username
    useEffect(() => {
        if (!loading && user && !username) {
            setShowUsernameSetup(true);
        } else {
            setShowUsernameSetup(false);
        }
    }, [user, username, loading]);

    const handleUsernameSubmit = async (newUsername: string) => {
        await updateUsername(newUsername);
        setShowUsernameSetup(false);
    };

    const handleSkip = () => {
        setShowUsernameSetup(false);
    };

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={
                        <GalleryErrorBoundary>
                            <GalleryPage />
                        </GalleryErrorBoundary>
                    }
                />
                <Route
                    path="/auth"
                    element={<AuthPage />}
                />
                <Route
                    path="/chat/:characterId?"
                    element={
                        <ChatErrorBoundary>
                            <ChatPage />
                        </ChatErrorBoundary>
                    }
                />
            </Routes>

            {showUsernameSetup && (
                <UsernameSetup
                    onSubmit={handleUsernameSubmit}
                    onSkip={handleSkip}
                />
            )}
        </>
    );
}
