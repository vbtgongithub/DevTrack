// ============================================================================
// MobileDrawer.tsx — Mobile-Safe Drawer Component
// ============================================================================
// Full-screen drawer for mobile with gesture-safe spacing.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { safeAreas } from '../../design-system/layout';
import { overlayEnter, drawerSlideRight, overlaySpring } from '../../design-system/motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MobileDrawerProps {
  /**
   * Is drawer open?
   */
  open: boolean;
  
  /**
   * Close handler
   */
  onClose: () => void;
  
  /**
   * Drawer title
   */
  title?: string;
  
  /**
   * Drawer content
   */
  children: React.ReactNode;
  
  /**
   * Full screen on mobile
   * @default false
   */
  fullScreen?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  title,
  children,
  fullScreen = false,
}) => {
  const isMobile = useIsMobile();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayEnter}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            variants={drawerSlideRight}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={overlaySpring}
            className={[
              'fixed z-[81] bg-white flex flex-col',
              isMobile && fullScreen
                ? 'inset-0'
                : 'right-0 top-0 h-full w-full max-w-md',
            ].join(' ')}
            style={{
              paddingTop: isMobile ? safeAreas.top : 0,
              paddingBottom: isMobile ? safeAreas.bottom : 0,
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              {title && (
                <h2 className="text-lg font-black text-dt-text tracking-tight">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-dt-text rounded-lg hover:bg-gray-50 transition-colors ml-auto"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default MobileDrawer;
