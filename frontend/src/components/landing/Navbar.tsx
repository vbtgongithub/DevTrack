import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Dashboard', href: '#preview' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <>
      {/* Noise Overlay is separated or kept in Layout. We will just render it here for the fixed effect if needed, but usually it's at root. We'll leave it in LandingPage root. */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl transition-all duration-500 ${
          isScrolled
            ? 'top-3'
            : 'top-6'
        }`}
      >
        <motion.div
          className={`flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ${
            isScrolled
              ? 'bg-[#F7F6F3]/80 backdrop-blur-2xl border border-[rgba(15,23,42,0.06)] shadow-2xl shadow-purple-500/10'
              : 'bg-[#F7F6F3]/60 backdrop-blur-xl border border-[rgba(15,23,42,0.06)]'
          }`}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C6CF2] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-purple-500/25 ring-1 ring-white/10">
              <svg className="w-4 h-4 text-[#0F172A]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#0F172A] tracking-tight">DevTrack</span>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors rounded-full hover:bg-white relative"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.label}
              </motion.a>
            ))}
            <div className="ml-4 flex items-center gap-3">
              <motion.button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium text-[#0F172A]/70 hover:text-[#0F172A] transition-colors"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.button>
              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#7C6CF2] via-[#7C3AED] to-[#A78BFA] rounded-full shadow-lg shadow-purple-500/20 transition-all duration-200 bg-[length:200%_auto] hover:bg-[position:100%_0]"
              >
                Get Started
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="md:hidden mt-2 p-4 rounded-2xl bg-[#F7F6F3]/90 backdrop-blur-xl border border-[rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="px-4 py-2 text-sm font-medium text-[#64748B]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <motion.button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 mt-2 text-sm font-semibold text-[#0F172A] bg-gradient-to-r from-[#7C6CF2] to-[#A78BFA] rounded-full"
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};
