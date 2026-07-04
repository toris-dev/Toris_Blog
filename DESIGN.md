# Toris Blog - Design System

> Interactive, modern portfolio with motion-driven interactions and dark-mode optimized visual hierarchy.

---

## 🎯 Design Overview

### Pattern
- **Name:** Portfolio Grid
- **Conversion Focus:** Visuals first. Filter by category. Fast loading essential.
- **CTA Placement:** Project Card Hover + Footer Contact
- **Color Strategy:** Neutral background (let work shine). Text: Black/White. Accent: Minimal.
- **Sections:** 1. Hero (Name/Role), 2. Project Grid (Masonry), 3. About/Philosophy, 4. Contact

### Style
- **Name:** Motion-Driven
- **Mode Support:** Light ✓ Full | Dark ✓ Full
- **Keywords:** Animation-heavy, microinteractions, smooth transitions, scroll effects, parallax, entrance animations, page transitions
- **Performance:** Good | **Accessibility:** Prefers-reduced-motion

---

## 🎨 Color System

### Core Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Primary** | `#18181B` | `--color-primary` | Backgrounds, text in light mode |
| **On Primary** | `#FFFFFF` | `--color-on-primary` | Text on primary backgrounds |
| **Secondary** | `#3F3F46` | `--color-secondary` | Secondary text, muted elements |
| **Accent/CTA** | `#2563EB` | `--color-accent` | Buttons, links, hover states |
| **Background** | `#FAFAFA` | `--color-background` | Light mode background |
| **Foreground** | `#09090B` | `--color-foreground` | Light mode text |
| **Muted** | `#E8ECF0` | `--color-muted` | Disabled states, subtle bg |
| **Border** | `#E4E4E7` | `--color-border` | Dividers, borders |
| **Destructive** | `#DC2626` | `--color-destructive` | Error, delete actions |
| **Ring** | `#18181B` | `--color-ring` | Focus rings, outlines |

### Dark Mode
- Primary: `#18181B` (near-black)
- Text: `#FFFFFF` (white) or `#E4E4E7` (light gray)
- Accent: `#2563EB` (vibrant blue)
- Surfaces: `#27272A` (dark gray)

### Light Mode
- Background: `#FAFAFA` (off-white)
- Text: `#09090B` (near-black)
- Accent: `#2563EB` (same blue)
- Surfaces: `#FFFFFF` (white)

---

## ✍️ Typography

### Font Stack
- **Headings:** `Caveat` (handwritten, personal, warm)
- **Body:** `Quicksand` (friendly, modern, accessible)
- **Code:** `Menlo`, `Monaco`, `monospace`

### Google Fonts Import
```html
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap" as="style">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Type Scale

| Level | Size (px) | Weight | Line Height | Usage |
|-------|-----------|--------|------------|-------|
| Display | 56 | 700 (Caveat) | 1.2 | Hero headline |
| H1 | 48 | 600 (Caveat) | 1.2 | Section titles |
| H2 | 36 | 600 (Caveat) | 1.3 | Subsection titles |
| H3 | 28 | 500 (Caveat) | 1.4 | Card titles |
| H4 | 24 | 500 (Caveat) | 1.4 | Small titles |
| Body Large | 18 | 400 (Quicksand) | 1.6 | Lead text |
| Body | 16 | 400 (Quicksand) | 1.6 | Main body text |
| Body Small | 14 | 400 (Quicksand) | 1.5 | Captions |
| Label | 12 | 600 (Quicksand) | 1.4 | Tags, labels |

---

## 🎭 Interactive Elements

### Buttons

#### Primary Button
- **State:** Default
  - Background: `--color-accent` (#2563EB)
  - Text: White
  - Padding: 12px 24px
  - Border Radius: 6px
  - Font Weight: 600

- **State:** Hover
  - Background: `#1D4ED8` (darker blue)
  - Duration: 200ms
  - Cursor: pointer

- **State:** Active
  - Scale: 0.98
  - Background: `#1E40AF` (even darker)

- **State:** Disabled
  - Opacity: 0.5
  - Cursor: not-allowed

### Links
- **Default:** Color `--color-accent`, underline on hover
- **Hover:** Underline appears, scale 1.05
- **Active:** Color darkens
- **Duration:** 150-200ms

### Cards
- **Default:** 
  - Background: transparent or `--color-background`
  - Border: 1px solid `--color-border`
  - Padding: 16px 20px
  - Border Radius: 8px

- **Hover:**
  - Shadow: 0 10px 30px rgba(0,0,0,0.1)
  - Transform: translateY(-4px)
  - Duration: 300ms
  - Border: 1px solid `--color-accent`

---

## 🎬 Animation & Motion

### Principles
1. **Duration:** Micro-interactions 150-300ms | Complex transitions ≤400ms
2. **Easing:** `cubic-bezier(0.4, 0.0, 0.2, 1)` (material ease-out)
3. **Respect Motion:** Always respect `prefers-reduced-motion`
4. **Performance:** Use `transform` and `opacity` only

### Entrance Animations
- **Fade In:** opacity 0 → 1, duration 300ms
- **Slide Up:** transform `translateY(20px)` → 0, duration 400ms
- **Scale:** transform `scale(0.95)` → 1, duration 300ms

### Scroll Animations (Intersection Observer)
- Projects fade in as they enter viewport
- Parallax effect on hero: 3-5 layers with different scroll speeds
- Stagger list items by 50-80ms per item

### Hover Effects
- **Button:** Scale 1.05, shadow increase
- **Card:** Lift up 4px, border highlight
- **Link:** Color change + underline, duration 150ms

### Page Transitions
- Fade out current page (200ms)
- Fade in next page (300ms)
- Maintain scroll position on back navigation

---

## 📐 Spacing & Layout

### Spacing Scale (4px base)
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px
- **3xl:** 64px

### Breakpoints
- **Mobile:** 375px (min)
- **Tablet:** 768px
- **Desktop:** 1024px
- **Wide:** 1440px

### Grid System
- **Mobile:** 1 column, 16px gutters
- **Tablet:** 2-3 columns, 20px gutters
- **Desktop:** 3-4 columns, 24px gutters
- **Masonry:** CSS Grid with `auto-fit` + `minmax(280px, 1fr)`

### Container
- **Max Width:** 1280px on desktop
- **Padding:** 16px on mobile, 24px on tablet, 32px on desktop

---

## ♿ Accessibility

### Contrast Ratios
- **Normal Text:** Minimum 4.5:1 (WCAG AA)
- **Large Text (18px+):** Minimum 3:1
- **Interactive Elements:** Minimum 4.5:1

### Focus States
- All interactive elements: 2px solid `--color-ring`
- Offset: 2px
- Visible on keyboard navigation (tab)

### Keyboard Navigation
- Tab order matches visual order
- All buttons/links keyboard accessible
- Skip-to-main-content link included
- No keyboard traps

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Readers
- Semantic HTML (`<button>`, `<a>`, `<nav>`, etc.)
- Descriptive alt text for images
- aria-labels for icon-only buttons
- Proper heading hierarchy (h1 → h2 → h3)

---

## 🚀 Performance

### Image Optimization
- Use WebP with JPEG fallback
- Responsive images with `srcset`
- Lazy loading for below-fold images
- Max image size: 2000px width

### Font Loading
- Preload Google Fonts stylesheet
- Use `font-display: swap`
- Limit to 2 fonts maximum

### Bundle Optimization
- Dynamic imports for heavy components
- CSS modules to prevent bloat
- React Suspense for code splitting

### Core Web Vitals
- **LCP:** < 2.5s (Largest Contentful Paint)
- **FID:** < 100ms (First Input Delay)
- **CLS:** < 0.1 (Cumulative Layout Shift)

---

## 🎯 Component Checklist

Before delivering components, verify:

- [ ] No emojis as icons (use Heroicons/Lucide SVG)
- [ ] All text has cursor: pointer on hover (if clickable)
- [ ] Hover states smooth (150-300ms transition)
- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Dark mode text contrast ≥ 4.5:1
- [ ] Focus rings visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive on 375px, 768px, 1024px, 1440px
- [ ] Touch targets ≥ 44×44px
- [ ] No layout shift on state change
- [ ] Semantic HTML used
- [ ] Alt text on all meaningful images
- [ ] Loading states for async operations
- [ ] Error states clear and actionable

---

## 📱 Mobile-First Strategy

1. **Design for 375px first**
2. **Stack vertically** on mobile (1 column)
3. **Increase spacing** on larger screens
4. **Simplify interactions** (remove hover on touch)
5. **Test on real devices**

### Safe Areas
- iOS: Respect notch, home indicator
- Android: Respect status bar, gesture bar
- Padding: minimum 16px from edges

---

## 🌈 Dark Mode Implementation

### Strategy
- Default to dark mode (user preference first)
- Provide light mode toggle
- Store preference in localStorage
- Use CSS variables for theme switching

### CSS Pattern
```css
/* Dark mode (default) */
:root {
  --color-bg: #18181B;
  --color-text: #FFFFFF;
  --color-accent: #2563EB;
}

/* Light mode */
[data-theme="light"] {
  --color-bg: #FAFAFA;
  --color-text: #09090B;
  --color-accent: #2563EB;
}
```

---

## 📋 Anti-Patterns to Avoid

❌ Corporate templates  
❌ Generic layouts  
❌ Animations without purpose  
❌ Color-only meaning (must include icon/text)  
❌ Hardcoded colors (use CSS variables)  
❌ Hover-only interactions (must work on touch)  
❌ Animations that ignore `prefers-reduced-motion`  
❌ Images without alt text  
❌ Auto-playing videos/audio  
❌ Disabled button states that look clickable  

---

## 🔗 Related Files

- **Tailwind Config:** `tailwind.config.ts` (extends with design tokens)
- **Global Styles:** `styles/globals.css` (CSS variables, base styles)
- **Components:** `src/components/` (uses design tokens)
- **Next.js Config:** `next.config.ts` (optimization settings)

---

## 📅 Last Updated

Created: July 4, 2026  
Updated: July 4, 2026  
Design System Version: 1.0
