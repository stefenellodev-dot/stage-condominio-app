import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const result = await Promise.race([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('fetchProfile timeout 10s')), 10000)),
      ]);
      const { data, error } = result;
      if (error) {
        console.error('[AuthContext] fetchProfile error:', error.message, error.code, error.details);
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (err) {
      console.error('[AuthContext] fetchProfile unexpected:', err?.message || err);
      setProfile(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && window.location.hash.includes('type=recovery')) {
        setIsPasswordRecovery(true);
      }
      if (session) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsPasswordRecovery(false);
  };

  const value = {
    session,
    user: session?.user || null,
    profile,
    isSuperadmin: profile?.role === 'superadmin',
    isAdmin: profile?.role === 'admin' || profile?.role === 'superadmin',
    isPasswordRecovery,
    loading,
    setIsPasswordRecovery,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }
  return context;
}
