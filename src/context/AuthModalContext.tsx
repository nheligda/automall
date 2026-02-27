import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';
import { RegisterModal } from '@/components/auth/RegisterModal';

interface AuthModalContextType {
  mode: 'login' | 'register' | null;
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'login' | 'register' | null>(null);

  const openLogin = () => setMode('login');
  const openRegister = () => setMode('register');
  const close = () => setMode(null);

  return (
    <AuthModalContext.Provider value={{ mode, openLogin, openRegister, close }}>
      {children}
      {mode === 'login' && <LoginModal onClose={close} />}
      {mode === 'register' && <RegisterModal onClose={close} />}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return ctx;
}
