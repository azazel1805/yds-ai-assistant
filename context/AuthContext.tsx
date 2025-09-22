
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const ALL_USERS_KEY = 'yds-ai-all-users';

interface AuthContextType {
  user: string | null;
  users: string[];
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [users, setUsers] = useLocalStorage<string[]>(ALL_USERS_KEY, []);

  // Check for a logged-in user on initial load (from session storage)
  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('yds-ai-current-user');
    if (loggedInUser) {
      setUser(loggedInUser);
    }
  }, []);

  const login = (username: string) => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;
    
    setUser(trimmedUsername);
    sessionStorage.setItem('yds-ai-current-user', trimmedUsername);
    
    // Add to all users list if not already there
    if (!users.find(u => u.toLowerCase() === trimmedUsername.toLowerCase())) {
      setUsers(prevUsers => [...prevUsers, trimmedUsername]);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('yds-ai-current-user');
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
