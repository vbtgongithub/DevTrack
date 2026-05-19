# Motion System

Centralized motion architecture for DevTrack. Provides consistent, accessible animations across the entire application.

## Overview

The motion system is built on Framer Motion and provides:

- **Reusable variants** for common animation patterns
- **Spring presets** for physics-based motion
- **Standardized durations and easing** for consistent timing
- **Reduced motion support** that respects user preferences
- **Motion constraints** to prevent excessive animation

## Architecture

```
motion/
├── variants.ts          # Reusable animation variants
├── springs.ts           # Spring physics presets
├── transitions.ts       # Duration and easing tokens
├── ReducedMotion.tsx    # Reduced motion wrapper & hooks
├── utils.ts             # Utility functions
├── index.ts             # Public exports
└── README.md            # This file
```

## Usage

### Basic Variants

```tsx
import { fadeIn, fadeUp, scaleIn } from '@/design-system/motion';

<motion.div variants={fadeIn} initial="initial" animate="animate">
  Content
</motion.div>
```

### Spring Presets

```tsx
import { snappy, smooth, bouncy } from '@/design-system/motion';

<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={bouncy}
>
  Content
</motion.div>
```

### Overlay Animations

```tsx
import { overlayEnter, overlayContent, overlaySpring } from '@/design-system/motion';

<motion.div variants={overlayEnter} transition={overlaySpring}>
  <motion.div variants={overlayContent}>
    Content
  </motion.div>
</motion.div>
```

### Stagger Animations

```tsx
import { staggerContainer, staggerItem } from '@/design-system/motion';

<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Reduced Motion Hook

```tsx
import { useMotionProps } from '@/design-system/motion';

const motionProps = useMotionProps({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
});

<motion.div {...motionProps}>Content</motion.div>
```

## Available Variants

### Fade Variants
- `fadeIn` - Simple opacity fade
- `fadeUp` - Fade with upward slide
- `fadeDown` - Fade with downward slide

### Scale Variants
- `scaleIn` - Scale from 96% to 100%

### Slide Variants
- `slideLeft` - Slide from right to left
- `slideRight` - Slide from left to right

### Stagger Variants
- `staggerContainer` - Container for staggered children
- `staggerItem` - Individual staggered item

### Overlay Variants
- `overlayEnter` - Full-screen overlay backdrop
- `overlayContent` - Content within overlay

### Drawer Variants
- `drawerSlideRight` - Drawer from right edge
- `drawerSlideLeft` - Drawer from left edge

### Interaction Variants
- `cardHover` - Card hover/tap states
- `buttonTap` - Button hover/tap states

### Loading Variants
- `shimmerPulse` - Shimmer loading effect
- `progressPulse` - Progress indicator pulse

## Spring Presets

- `snappy` - Quick, responsive (stiffness: 420, damping: 32)
- `smooth` - Balanced, polished (stiffness: 280, damping: 28)
- `bouncy` - Playful, energetic (stiffness: 300, damping: 20)
- `gentle` - Soft, calm (stiffness: 200, damping: 25)
- `overlaySpring` - Optimized for overlays (stiffness: 400, damping: 30)

## Duration Tokens

```ts
durations.instant  // 0.1s
durations.fast     // 0.15s
durations.base     // 0.22s
durations.calm     // 0.3s
durations.slow     // 0.4s
durations.overlay  // 0.3s
durations.drawer   // 0.35s
durations.toast    // 0.25s
```

## Easing Functions

```ts
easePremium  // [0.16, 1, 0.3, 1] - Smooth, polished
easeSmooth   // [0.4, 0, 0.2, 1] - Balanced
easeGentle   // [0.25, 0.1, 0.25, 1] - Soft, calm
easeSharp    // [0.4, 0, 0.6, 1] - Quick, responsive
```

## Motion Constraints

To maintain consistency and prevent excessive animation:

```ts
motionConstraints.maxHoverScale = 1.02        // Max scale on hover
motionConstraints.maxTapScale = 0.98          // Min scale on tap
motionConstraints.maxOverlayDuration = 0.4    // Max overlay animation duration
motionConstraints.maxStaggerDelay = 0.1       // Max delay between stagger items
motionConstraints.maxStaggerChildren = 0.08   // Max stagger children delay
```

## Motion Consistency Rules

### 1. Hover Scale
- Maximum hover scale: **1.02**
- Use `cardHover` or `buttonTap` variants
- Never exceed `motionConstraints.maxHoverScale`

### 2. Overlay Duration
- Maximum overlay duration: **0.4s**
- Use `durations.overlay` for consistency
- Never exceed `motionConstraints.maxOverlayDuration`

### 3. Stagger Delay
- Maximum stagger delay: **0.1s**
- Use `staggerTiming` tokens
- Never exceed `motionConstraints.maxStaggerDelay`

### 4. Easing Hierarchy
- **Micro-interactions**: `easeSharp`
- **UI transitions**: `easePremium`
- **Large elements**: `easeGentle`
- **State changes**: `easeSmooth`

### 5. No Inline Transitions
❌ **Bad:**
```tsx
<motion.div transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
```

✅ **Good:**
```tsx
<motion.div transition={fadeTransition}>
```

### 6. No Hardcoded Values
❌ **Bad:**
```tsx
<motion.div transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
```

✅ **Good:**
```tsx
<motion.div transition={bouncy}>
```

### 7. Always Use Variants
❌ **Bad:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
```

✅ **Good:**
```tsx
<motion.div variants={fadeUp} initial="initial" animate="animate">
```

## Reduced Motion Support

All motion respects `prefers-reduced-motion: reduce`. When enabled:

- Animations are disabled or simplified
- Essential motion (like state changes) is preserved
- Interaction clarity is maintained

### Testing Reduced Motion

**Chrome DevTools:**
1. Open DevTools (F12)
2. Press Cmd/Ctrl + Shift + P
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "reduce"

**System Settings:**
- **macOS**: System Preferences → Accessibility → Display → Reduce motion
- **Windows**: Settings → Ease of Access → Display → Show animations
- **Linux**: Varies by desktop environment

## Best Practices

### 1. Choose the Right Spring
- **Buttons, toggles**: `snappy`
- **Cards, modals**: `smooth`
- **Celebrations**: `bouncy`
- **Large overlays**: `gentle`
- **Drawers**: `overlaySpring`

### 2. Layer Animations
Use stagger for sequential reveals:
```tsx
<motion.div variants={staggerContainer}>
  {items.map(item => (
    <motion.div variants={staggerItem} />
  ))}
</motion.div>
```

### 3. Respect Motion Constraints
Always check against `motionConstraints` before adding custom values.

### 4. Test Reduced Motion
Always test your animations with reduced motion enabled.

### 5. Use Semantic Variants
Choose variants that match the semantic meaning of the animation:
- Entry: `fadeIn`, `fadeUp`, `scaleIn`
- Exit: Use the same variant's `exit` state
- Interaction: `cardHover`, `buttonTap`

## Migration Guide

### From Old Motion System

**Before:**
```tsx
import { prefersReducedMotion, springSnappy } from '@/lib/motion';

<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={springSnappy}
>
```

**After:**
```tsx
import { fadeUp, snappy } from '@/design-system/motion';

<motion.div
  variants={fadeUp}
  initial="initial"
  animate="animate"
  transition={snappy}
>
```

## Examples

### Celebration Overlay
```tsx
import { overlayEnter, overlayContent, bouncy, durations } from '@/design-system/motion';

<motion.div
  variants={overlayEnter}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: durations.overlay }}
>
  <motion.div
    variants={overlayContent}
    transition={bouncy}
  >
    Celebration content
  </motion.div>
</motion.div>
```

### Notification Toast
```tsx
import { toastEnter, durations } from '@/design-system/motion';

<motion.div
  variants={toastEnter}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: durations.toast }}
>
  Notification content
</motion.div>
```

### Interactive Card
```tsx
import { cardHover, snappy } from '@/design-system/motion';

<motion.div
  variants={cardHover}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
  transition={snappy}
>
  Card content
</motion.div>
```

## Troubleshooting

### Animation Not Working
1. Check if `prefersReducedMotion` is enabled
2. Verify variant names match (`initial`, `animate`, `exit`)
3. Ensure `AnimatePresence` wraps exit animations

### Animation Too Fast/Slow
1. Use duration tokens instead of hardcoded values
2. Check if the right spring preset is used
3. Verify motion constraints aren't being violated

### Stagger Not Working
1. Ensure parent has `variants={staggerContainer}`
2. Children must have `variants={staggerItem}`
3. Parent must have `initial="hidden" animate="visible"`

## Contributing

When adding new motion patterns:

1. Add variants to `variants.ts`
2. Add springs to `springs.ts` if needed
3. Add durations/easing to `transitions.ts` if needed
4. Export from `index.ts`
5. Document in this README
6. Update motion constraints if applicable
7. Test with reduced motion enabled

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
