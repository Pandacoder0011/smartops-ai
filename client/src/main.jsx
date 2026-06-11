import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error('⚠️ Missing Clerk Publishable Key in environment variables.');
  
  // Render a friendly user interface informing about configuration rather than crashing silently with a black screen
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-100 font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-violet-500/10 p-8 rounded-2xl shadow-2xl space-y-4">
        <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto text-violet-400 text-xl font-bold animate-pulse">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-white">Clerk Configuration Required</h2>
        <p className="text-sm text-zinc-400">
          The environment variable <code className="bg-black px-1.5 py-0.5 rounded text-violet-400 font-mono text-xs">VITE_CLERK_PUBLISHABLE_KEY</code> is missing or empty.
        </p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Please add your Clerk Publishable Key in your Vercel Project Settings (or local <code className="bg-black px-1 py-0.5 rounded font-mono text-[10px]">.env</code> file) and redeploy the application to access the platform.
        </p>
      </div>
    </div>
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          afterSignOutUrl="/login"
          signInUrl="/login"
          signUpUrl="/register"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          <App />
        </ClerkProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}
