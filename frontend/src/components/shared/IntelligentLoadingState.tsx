import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface IntelligentLoadingStateProps {
  messages?: string[];
  intervalMs?: number;
}

const DEFAULT_MESSAGES = [
  'Calibrating intelligence engine...',
  'Retrieving evidence-backed insights...',
  'Analyzing engineering trajectory...',
  'Preparing operational mission control...',
];

export const IntelligentLoadingState: React.FC<IntelligentLoadingStateProps> = ({
  messages = DEFAULT_MESSAGES,
  intervalMs = 2500,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [messages.length, intervalMs]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-[#FAFAFC] rounded-3xl p-8">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
      
      <div className="h-8 relative w-full max-w-sm flex justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-semibold text-slate-600 absolute tracking-wide"
          >
            {messages[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
