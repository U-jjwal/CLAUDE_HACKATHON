import React, { createContext, useContext, useState } from 'react';
import { DEMO_CREDENTIALS, DEMO_USER, type OfficerUser } from './demoAuth';

interface AuthContextType {
  user: OfficerUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
});

const SESSION_KEY = 'ghat_triage_officer_logged_in';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<OfficerUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored === 'true') {
        return DEMO_USER;
      }
    } catch {
      // sessionStorage unavailable or blocked
    }
    return null;
  });

  const login = (email: string, password: string): boolean => {
    if (
      email.trim().toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase() &&
      password === DEMO_CREDENTIALS.password
    ) {
      setUser(DEMO_USER);
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
      } catch {
        // ignore storage error
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore storage error
    }
    // Return to public dashboard if in officer area
    if (window.location.hash.startsWith('#/officer')) {
      window.location.hash = '#/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
