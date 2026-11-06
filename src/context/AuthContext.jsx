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
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        if (!token) { setProfile(null); return; }
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.pgrst.object+json',
            },
          }
        );
        if (!res.ok) {
          console.error('[AuthContext] fetchProfile HTTP', res.status, '(attempt ' + (attempt + 1) + ')');
          if (attempt < 2) { await new Promise(r => setTimeout(r, 1000)); continue; }
          setProfile(null);
          return;
        }
        const data = await res.json();
        const profile = Array.isArray(data) ? data[0] : data;
        if (!profile) { setProfile(null); return; }
        setProfile(profile);
        return;
      } catch (err) {
        console.error('[AuthContext] fetchProfile unexpected (attempt ' + (attempt + 1) + ')', err?.message || err);
        if (attempt < 2) { await new Promise(r => setTimeout(r, 1000)); continue; }
        setProfile(null);
      }
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
