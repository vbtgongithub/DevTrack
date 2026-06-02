import React from 'react';
import { motion } from 'framer-motion';
import { SignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

export const LoginPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-dt-bg font-sans selection:bg-dt-primary/15 selection:text-dt-text">
      {/* ─── Background Effects ─── */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay z-0" />
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-dt-primary/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-dt-secondary/10 rounded-full blur-[100px]"
      />

      {/* ─── Card Container ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* ─── Branding ─── */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-[18px] bg-dt-surface border border-dt-primary/10 shadow-dt-glow mb-6"
          >
            <svg className="w-6 h-6 text-dt-text" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-[32px] font-bold text-dt-text tracking-tight leading-tight"
          >
            Welcome to DevTrack
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[15px] text-dt-textSecondary mt-2 font-medium"
          >
            Log in to continue your developer journey.
          </motion.p>
        </div>

        {/* ─── Clerk Component ─── */}
        <div className="flex justify-center">
          <SignIn 
            routing="path" 
            path="/login" 
            signUpUrl="/signup" 
            appearance={{
              baseTheme: dark,
              elements: {
                card: "bg-dt-surface border border-dt-primary/10 shadow-sm rounded-[28px]",
                headerTitle: "text-dt-text",
                headerSubtitle: "text-dt-textSecondary",
                socialButtonsBlockButton: "border border-dt-primary/10 bg-dt-elevated text-dt-text hover:bg-dt-surface transition-colors",
                socialButtonsBlockButtonText: "font-bold",
                dividerLine: "bg-dt-primary/10",
                dividerText: "text-dt-textMuted",
                formFieldLabel: "text-dt-text font-bold text-[13px]",
                formFieldInput: "bg-dt-elevated border-dt-primary/5 text-dt-text font-bold text-[14px] rounded-xl focus:border-dt-primary focus:ring-4 focus:ring-dt-primary/10",
                formButtonPrimary: "bg-gradient-to-r from-dt-primary to-dt-secondary text-white font-bold text-[15px] rounded-[14px] py-3.5 hover:opacity-90 transition-opacity",
                footerActionText: "text-dt-textSecondary",
                footerActionLink: "text-dt-text hover:text-dt-primary font-bold underline decoration-dt-primary/10 underline-offset-4 hover:decoration-dt-primary/40 transition-colors"
              }
            }}
          />
        </div>

        {/* ─── Subtle Brand Footer ─── */}
        <p className="text-center text-[11px] text-dt-textMuted mt-10 font-bold tracking-widest uppercase">
          DEVTRACK
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;