import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome Back to SmartOps AI
          </h1>
          <p className="text-white/80">
            Sign in to access your AI-powered dashboard
          </p>
        </div>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "shadow-2xl bg-white dark:bg-gray-800 rounded-2xl",
              headerTitle: "text-2xl font-bold",
              socialButtonsBlockButton:
                "border-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition",
              socialButtonsBlockButtonText: "font-medium",
              formButtonPrimary:
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90",
              footerActionLink: "text-indigo-600 hover:text-indigo-700",
            },
            layout: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "blockButton",
            }
          }}
        />
      </motion.div>
    </div>
  );
}
