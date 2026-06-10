import React from 'react';
import * as ClerkOriginal from '../node_modules/@clerk/react/dist/index.mjs';

// Re-export all original Clerk components/hooks by importing from the exact file path
export * from '../node_modules/@clerk/react/dist/index.mjs';

// Implement custom `<Show>` component for Clerk's signed-in/signed-out views
export const Show = ({ when, children }) => {
  const { isLoaded, isSignedIn } = ClerkOriginal.useAuth();

  if (!isLoaded) return null;

  if (when === 'signed-in' && isSignedIn) {
    return <>{children}</>;
  }

  if (when === 'signed-out' && !isSignedIn) {
    return <>{children}</>;
  }

  return null;
};
