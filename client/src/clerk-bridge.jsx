import React, { useState, useEffect, useCallback } from 'react';
import * as ClerkOriginal from '../node_modules/@clerk/react/dist/index.mjs';

// Re-export all original Clerk components/hooks
export * from '../node_modules/@clerk/react/dist/index.mjs';

const hasClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Mock wrapper for ClerkProvider if no environment key is present
export const ClerkProvider = ({ children }) => {
  if (hasClerkKey) {
    return <ClerkOriginal.ClerkProvider afterSignOutUrl="/">{children}</ClerkOriginal.ClerkProvider>;
  }
  return <>{children}</>;
};

// Mock wrapper for useUser
export const useUser = () => {
  if (hasClerkKey) {
    return ClerkOriginal.useUser();
  }

  const [isSignedIn, setIsSignedIn] = useState(() => {
    return localStorage.getItem('sandbox_signed_in') !== 'false';
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setIsSignedIn(localStorage.getItem('sandbox_signed_in') !== 'false');
    };
    window.addEventListener('sandbox-auth-change', handleAuthChange);
    return () => window.removeEventListener('sandbox-auth-change', handleAuthChange);
  }, []);

  return {
    isLoaded: true,
    isSignedIn,
    user: isSignedIn ? {
      fullName: 'SmartOps Demo Admin',
      primaryEmailAddress: { emailAddress: 'admin@smartops.ai' },
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'
    } : null
  };
};

// Mock wrapper for useAuth
export const useAuth = () => {
  if (hasClerkKey) {
    return ClerkOriginal.useAuth();
  }

  const [isSignedIn, setIsSignedIn] = useState(() => {
    return localStorage.getItem('sandbox_signed_in') !== 'false';
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setIsSignedIn(localStorage.getItem('sandbox_signed_in') !== 'false');
    };
    window.addEventListener('sandbox-auth-change', handleAuthChange);
    return () => window.removeEventListener('sandbox-auth-change', handleAuthChange);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.setItem('sandbox_signed_in', 'false');
    window.dispatchEvent(new CustomEvent('sandbox-auth-change'));
  }, []);

  return {
    isLoaded: true,
    isSignedIn,
    userId: isSignedIn ? 'mock-admin-id-123' : null,
    getToken: async () => isSignedIn ? 'mock-jwt-token' : null,
    signOut
  };
};

// Mock wrapper for SignInButton
export const SignInButton = ({ children, mode }) => {
  if (hasClerkKey) {
    return <ClerkOriginal.SignInButton mode={mode}>{children}</ClerkOriginal.SignInButton>;
  }
  const handleSignIn = () => {
    localStorage.setItem('sandbox_signed_in', 'true');
    window.dispatchEvent(new CustomEvent('sandbox-auth-change'));
    window.location.href = '/dashboard';
  };
  return (
    <div onClick={handleSignIn} className="w-full cursor-pointer">
      {children}
    </div>
  );
};

// Mock wrapper for SignUpButton
export const SignUpButton = ({ children, mode }) => {
  if (hasClerkKey) {
    return <ClerkOriginal.SignUpButton mode={mode}>{children}</ClerkOriginal.SignUpButton>;
  }
  const handleSignUp = () => {
    localStorage.setItem('sandbox_signed_in', 'true');
    window.dispatchEvent(new CustomEvent('sandbox-auth-change'));
    window.location.href = '/dashboard';
  };
  return (
    <div onClick={handleSignUp} className="w-full cursor-pointer">
      {children}
    </div>
  );
};

// Mock wrapper for UserButton
export const UserButton = ({ afterSignOutUrl }) => {
  if (hasClerkKey) {
    return <ClerkOriginal.UserButton afterSignOutUrl={afterSignOutUrl} />;
  }
  const handleSignOut = () => {
    localStorage.setItem('sandbox_signed_in', 'false');
    window.dispatchEvent(new CustomEvent('sandbox-auth-change'));
    window.location.href = afterSignOutUrl || '/login';
  };
  return (
    <div 
      onClick={handleSignOut}
      className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-zinc-800 text-white text-xs font-bold cursor-pointer hover:bg-zinc-700 transition-colors"
      title="Click to sign out (Sandbox)"
    >
      SO
    </div>
  );
};

// Implement custom `<Show>` component for Clerk's signed-in/signed-out views
export const Show = ({ when, children }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (when === 'signed-in' && isSignedIn) {
    return <>{children}</>;
  }

  if (when === 'signed-out' && !isSignedIn) {
    return <>{children}</>;
  }

  return null;
};
