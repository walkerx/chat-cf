import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    username: string | null;
    avatarUrl: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
    updateUsername: (newUsername: string) => Promise<void>;
    updateAvatar: (newAvatarUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setUsername(session?.user?.user_metadata?.username ?? null);
            setAvatarUrl(session?.user?.user_metadata?.avatar_url ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setUsername(session?.user?.user_metadata?.username ?? null);
            setAvatarUrl(session?.user?.user_metadata?.avatar_url ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const updateUsername = async (newUsername: string) => {
        if (!user) {
            throw new Error('No user logged in');
        }

        // Update user metadata in Supabase
        const { error } = await supabase.auth.updateUser({
            data: { username: newUsername }
        });

        if (error) {
            throw error;
        }

        // Update local state
        setUsername(newUsername);
    };

    const updateAvatar = async (newAvatarUrl: string) => {
        if (!user) {
            throw new Error('No user logged in');
        }

        // Update user metadata in Supabase
        const { error } = await supabase.auth.updateUser({
            data: { avatar_url: newAvatarUrl }
        });

        if (error) {
            throw error;
        }

        // Update local state
        setAvatarUrl(newAvatarUrl);
    };

    const value = {
        session,
        user,
        username,
        avatarUrl,
        loading,
        signOut,
        updateUsername,
        updateAvatar,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
