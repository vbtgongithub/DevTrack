import React from 'react';
import { motion } from 'framer-motion';

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  stats: string;
  avatar: string;
  featured?: boolean;
  delay?: number;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  role,
  stats,
  avatar,
  featured = false,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -8 }}
      className={`p-6 rounded-3xl bg-white border border-white/[0.05] backdrop-blur-sm hover:border-[#7C6CF2]/20 transition-all duration-300 ${
        featured ? 'md:col-span-2 md:row-span-1' : ''
      }`}
    >
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-sm text-[#0F172A]/70 mb-6 leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C6CF2] to-[#A78BFA] flex items-center justify-center text-sm font-semibold text-[#0F172A]">
          {avatar}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-[#0F172A]">{author}</div>
          <div className="text-xs text-[#64748B]">{role}</div>
        </div>
        <div className="text-xs text-[#7C6CF2] bg-[#7C6CF2]/10 px-2 py-1 rounded">
          {stats}
        </div>
      </div>
    </motion.div>
  );
};
