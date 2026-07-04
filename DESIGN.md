# Toris Blog Design System v2.0

> **Interactive, Modern, Content-First**
> 
> A comprehensive design system for Toris Blog featuring dark-first OLED colors, smooth interactive animations, developer-friendly patterns, and Swiss Modernism 2.0 aesthetic.

---

## 🎯 Design Philosophy

- **Content First**: Blog content is the hero; UI enables, not decorates
- **Developer Friendly**: Clear patterns, TypeScript-safe components, well-documented
- **Modern & Interactive**: Smooth animations (150-300ms), micro-feedback on every action
- **Accessibility Native**: WCAG AAA compliant, keyboard navigation, screen reader support
- **Dark-First Design**: OLED-friendly colors, reduces eye strain, premium feel
- **Responsive by Default**: Mobile-first, 375px → 1440px

---

## 🎨 Color System

### Semantic Tokens (CSS Variables)

```css
:root {
  /* Primary Surface */
  --color-primary: #1E293B;           /* Slate-800 */
  --color-on-primary: #FFFFFF;        /* White text */
  
  /* Secondary Surface */
  --color-secondary: #334155;         /* Slate-700 */
  
  /* Background & Surfaces */
  --color-background: #0F172A;        /* Slate-950 - Deep, eye-friendly */
  --color-surface: #1E293B;           /* Slate-800 - Card/panel bg */
  --color-surface-hover: #334155;     /* Slate-700 - Interactive hover */
  
  /* Text */
  --color-foreground: #F8FAFC;        /* Slate-50 - Primary text */
  --color-foreground-muted: #CBD5E1;  /* Slate-300 - Secondary text */
  
  /* Accent & CTA */
  --color-accent: #22C55E;            /* Green-500 - Primary CTA, success */
  --color-accent-hover: #16A34A;      /* Green-600 */
  --color-accent-focus: #22C55E;      /* Green-500 - Focus ring */
  
  /* Link */
  --color-link: #3B82F6;              /* Blue-500 */
  --color-link-hover: #2563EB;        /* Blue-600 */
  
  /* Borders & Dividers */
  --color-border: #475569;            /* Slate-600 */
  --color-divider: #334155;           /* Slate-700 */
  
  /* State Colors */
  --color-error: #EF4444;             /* Red-500 */
  --color-error-bg: rgba(239, 68, 68, 0.1);
  --color-warning: #F59E0B;           /* Amber-500 */
  --color-warning-bg: rgba(245, 158, 11, 0.1);
  --color-success: #22C55E;           /* Green-500 */
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-info: #3B82F6;              /* Blue-500 */
  --color-info-bg: rgba(59, 130, 246, 0.1);
  
  /* Muted & Disabled */
  --color-muted: #272F42;             /* Slate-900 */
  --color-disabled: rgba(248, 250, 252, 0.38);
}
```

### Contrast Verification (WCAG AA/AAA)

| Element | Foreground | Background | Contrast | Standard |
|---------|-----------|-----------|----------|----------|
| Primary Text | #F8FAFC | #0F172A | 17:1 | ✅ AAA |
| Secondary Text | #CBD5E1 | #1E293B | 7.2:1 | ✅ AAA |
| Links | #3B82F6 | #0F172A | 4.8:1 | ✅ AA |
| Buttons | #FFFFFF | #22C55E | 5.8:1 | ✅ AA |
| Error | #EF4444 | #0F172A | 5.3:1 | ✅ AA |

---

## 🔤 Typography System

### Font Stack

```css
/* Heading & Body */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace (Code) */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale (3:4 Ratio)

| Role | Size | Weight | Line-Height | Letter-Spacing | Use Case |
|------|------|--------|-------------|-----------------|----------|
| **h1** | 2.5rem (40px) | 700 | 1.2 | -0.02em | Page title, hero section |
| **h2** | 2rem (32px) | 700 | 1.25 | -0.01em | Section heading |
| **h3** | 1.5rem (24px) | 600 | 1.35 | 0 | Subsection, card title |
| **h4** | 1.25rem (20px) | 600 | 1.4 | 0 | Component title |
| **body** | 1rem (16px) | 400 | 1.6 | 0 | Main content, paragraphs |
| **body-sm** | 0.875rem (14px) | 400 | 1.5 | 0 | Description, metadata |
| **caption** | 0.75rem (12px) | 500 | 1.5 | 0.01em | Labels, hints, timestamps |
| **code** | 0.875rem (14px) | 500 | 1.4 | 0 | Inline code snippets |

### Font Import

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

### Font Settings

```css
font-family: var(--font-sans);
font-feature-settings: 'rlig' 1, 'calt' 1;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
text-rendering: optimizeLegibility;
```

---

## 🎯 Spacing System

### Base Unit: 8px (0.5rem)

```css
/* Spacing scale (multiples of 8px) */
--space-1: 0.25rem;  /* 4px - micro gaps */
--space-2: 0.5rem;   /* 8px - tight spacing */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px - standard */
--space-6: 1.5rem;   /* 24px - medium */
--space-8: 2rem;     /* 32px - large */
--space-12: 3rem;    /* 48px - XL */
--space-16: 4rem;    /* 64px - XXL */
--space-20: 5rem;    /* 80px - page margin */
```

### Padding & Margins

- **Button padding**: 12px 16px (space-3 space-4)
- **Input padding**: 12px 16px
- **Card padding**: 24px (space-6)
- **Section margin**: 48px 0 (space-12)
- **Container max-width**: 1200px with 20px gutters (space-20)

---

## 🎭 Component Guidelines

### Buttons

#### Primary Button
```css
/* Default state */
background-color: var(--color-accent);
color: #FFFFFF;
padding: 12px 16px;
border-radius: 8px;
font-weight: 600;
cursor: pointer;
transition: all 200ms ease-out;
border: none;

/* Hover state */
&:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
  transform: translateY(-2px);
}

/* Active/Press state */
&:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.1);
}

/* Focus state */
&:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Disabled state */
&:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading state */
&[data-loading="true"] {
  pointer-events: none;
  opacity: 0.7;
}
```

#### Secondary Button
```css
background-color: var(--color-surface-hover);
color: var(--color-foreground);
border: 1px solid var(--color-border);
padding: 12px 16px;
border-radius: 8px;
font-weight: 500;
cursor: pointer;
transition: all 200ms ease-out;

&:hover:not(:disabled) {
  background-color: var(--color-secondary);
  border-color: var(--color-border);
  transform: translateY(-2px);
}

&:active:not(:disabled) {
  transform: scale(0.98);
}

&:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

#### Ghost Button
```css
background-color: transparent;
color: var(--color-accent);
padding: 12px 16px;
border: none;
border-radius: 8px;
cursor: pointer;
transition: all 200ms ease-out;

&:hover:not(:disabled) {
  background-color: rgba(34, 197, 94, 0.08);
}
```

### Input Fields

```css
/* Container */
display: flex;
flex-direction: column;
gap: 8px;

/* Label */
label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-foreground);
}

/* Input */
input, textarea, select {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-foreground);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 1rem;
  font-family: var(--font-sans);
  transition: all 200ms ease-out;
  
  &::placeholder {
    color: var(--color-foreground-muted);
  }
  
  &:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }
  
  &:disabled {
    background-color: var(--color-muted);
    color: var(--color-disabled);
    cursor: not-allowed;
  }
}

/* Error state */
&[data-invalid="true"] {
  input {
    border-color: var(--color-error);
    box-shadow: 0 0 0 3px var(--color-error-bg);
  }
  
  .error-message {
    color: var(--color-error);
    font-size: 0.75rem;
    margin-top: 4px;
  }
}
```

### Cards

```css
background-color: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: 12px;
padding: 24px;
transition: all 300ms ease-out;

&:hover {
  border-color: var(--color-accent);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.1);
  transform: translateY(-4px);
}

&:focus-within {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### Navigation Links

```css
color: var(--color-link);
text-decoration: none;
position: relative;
transition: all 200ms ease-out;

&:hover {
  color: var(--color-link-hover);
}

&:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
}

/* Underline animation */
&::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--color-link-hover);
  transition: width 200ms ease-out;
}

&:hover::after {
  width: 100%;
}
```

---

## ⚡ Animation & Interaction

### Timing & Easing

```css
/* Durations */
--duration-instant: 50ms;
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;

/* Easing functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Micro-Interactions

#### Button Press
```css
transition: all 100ms cubic-bezier(0.4, 0, 1, 1);

&:active {
  transform: scale(0.98);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

#### Card Lift
```css
transition: all 300ms cubic-bezier(0, 0, 0.2, 1);

&:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}
```

#### Fade In
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

animation: fadeIn 300ms cubic-bezier(0, 0, 0.2, 1) forwards;
```

#### Slide Up
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: slideUp 300ms cubic-bezier(0, 0, 0.2, 1) forwards;
```

#### Loading Skeleton
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

### Loading States

#### Skeleton Screens
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-surface-hover) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 8px;
}
```

#### Loading Spinner
```css
.spinner {
  border: 2px solid var(--color-surface-hover);
  border-top: 2px solid var(--color-accent);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## ♿ Accessibility Standards

### Focus Management

```css
/* Focus states must be visible */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-accent);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
  
  &:focus {
    top: 0;
  }
}
```

### ARIA Attributes

```html
<!-- Icon-only buttons need aria-label -->
<button aria-label="Close menu">
  <X size={24} />
</button>

<!-- Navigation current page -->
<nav>
  <a href="/" aria-current="page">Home</a>
  <a href="/blog">Blog</a>
</nav>

<!-- Live regions for dynamic content -->
<div aria-live="polite" aria-atomic="true" role="status">
  {message}
</div>

<!-- Form error association -->
<input id="email" aria-invalid={hasError} aria-describedby="email-error" />
<span id="email-error" role="alert">{errorMessage}</span>
```

### Screen Reader Text

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Color Not Alone

```html
<!-- ❌ Bad: Color only -->
<span style="color: red;">Error</span>

<!-- ✅ Good: Color + icon + text -->
<span style="color: red;">
  <AlertCircle size={16} />
  Error: Invalid email
</span>
```

### Keyboard Navigation

- Tab order should match visual order
- All interactive elements must be keyboard accessible
- Links and buttons use semantic HTML (`<a>`, `<button>`)
- Use `tabindex="0"` only for custom interactive elements
- Never use `tabindex="-1"` to hide from tab order without good reason

---

## 📱 Responsive Breakpoints

### Mobile-First Strategy

```css
/* Base: Mobile (375px) */
body {
  font-size: 16px;
  line-height: 1.6;
}

/* Tablet (768px) */
@media (min-width: 768px) {
  body {
    font-size: 16px;
  }
}

/* Desktop (1024px) */
@media (min-width: 1024px) {
  body {
    font-size: 16px;
  }
}

/* Large Desktop (1440px) */
@media (min-width: 1440px) {
  body {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Grid Layouts

| Breakpoint | Columns | Max-Width | Gap |
|-----------|---------|-----------|-----|
| 375px (Mobile) | 1 | 100% - 32px | 16px |
| 768px (Tablet) | 2 | 100% - 48px | 24px |
| 1024px (Desktop) | 3 | 1024px | 24px |
| 1440px (Large) | 4 | 1200px | 24px |

### Responsive Images

```html
<!-- Responsive image with srcset -->
<img
  src="/image-800w.jpg"
  srcset="
    /image-400w.jpg 400w,
    /image-800w.jpg 800w,
    /image-1200w.jpg 1200w
  "
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Descriptive alt text"
  width={1200}
  height={600}
/>
```

---

## 🌙 Dark Mode & Theme Support

### CSS Variables Strategy

```css
/* Light mode (optional) */
[data-theme="light"] {
  --color-background: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-foreground: #0F172A;
  /* ... override other colors */
}

/* Dark mode (default) */
[data-theme="dark"],
:root {
  --color-background: #0F172A;
  --color-surface: #1E293B;
  --color-foreground: #F8FAFC;
  /* ... */
}

/* System preference */
@media (prefers-color-scheme: light) {
  :root {
    --color-background: #FFFFFF;
    --color-surface: #F8FAFC;
    --color-foreground: #0F172A;
  }
}
```

---

## 📊 Forms & Input Patterns

### Form Structure

```html
<form>
  <div class="form-group">
    <label for="email">Email Address</label>
    <input
      id="email"
      type="email"
      name="email"
      inputmode="email"
      required
      aria-required="true"
      aria-describedby="email-hint email-error"
    />
    <p id="email-hint" class="hint-text">
      We'll never share your email
    </p>
    <p id="email-error" class="error-text" role="alert">
      {errorMessage}
    </p>
  </div>
</form>
```

### Input Best Practices

- ✅ Use semantic input types (`email`, `tel`, `number`, `date`)
- ✅ Use `inputmode` for mobile keyboards
- ✅ Show labels clearly (not placeholder-only)
- ✅ Provide helper text and error messages
- ✅ Mark required fields with `aria-required="true"`
- ✅ Reserve space for error messages (no layout shift)
- ❌ Don't use placeholder as label
- ❌ Don't disable autocomplete without reason
- ❌ Don't require exact formats without helpers

### Validation Feedback

```html
<!-- Error state -->
<div data-invalid="true">
  <input aria-invalid="true" aria-describedby="email-error" />
  <span id="email-error" role="alert">
    Please enter a valid email address
  </span>
</div>

<!-- Success state -->
<div data-valid="true">
  <input aria-invalid="false" />
  <span class="success-message">
    <CheckCircle size={16} />
    Email saved
  </span>
</div>
```

---

## 🎯 Performance Considerations

### Image Optimization

```html
<!-- WebP with fallback -->
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" loading="lazy" />
</picture>

<!-- Lazy load below-the-fold images -->
<img src="image.jpg" loading="lazy" alt="Description" />

<!-- Fixed dimensions to prevent CLS -->
<img src="image.jpg" width={400} height={300} alt="Description" />
```

### Font Loading

```css
@font-face {
  font-family: 'Inter';
  src: url('/inter.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately */
}
```

### Code Splitting

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div className="skeleton">Loading...</div>,
});
```

### Content Visibility

```css
/* Defer rendering of below-fold content */
.below-fold {
  content-visibility: auto;
}
```

---

## 🧪 Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (use Heroicons/Lucide SVG)
- [ ] All icons from consistent icon family
- [ ] Brand assets used with correct proportions
- [ ] Pressed states don't shift layout
- [ ] Semantic color tokens used consistently

### Interaction & Animation
- [ ] All tappable elements have clear pressed feedback
- [ ] Touch targets meet minimum size (44×44px desktop, 48×48dp mobile)
- [ ] Micro-interactions timing 150-300ms with native easing
- [ ] Disabled states visually clear and non-interactive
- [ ] Loading states shown for operations >300ms

### Accessibility
- [ ] Focus states visible and keyboard navigable
- [ ] Color contrast ≥4.5:1 (normal text) / ≥3:1 (large text)
- [ ] All images have alt text
- [ ] Form inputs have visible labels
- [ ] prefers-reduced-motion respected

### Responsive Design
- [ ] Tested at 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (large)
- [ ] No horizontal scroll on any breakpoint
- [ ] Typography readable on all screen sizes
- [ ] Safe area respected on notch/gesture devices
- [ ] Landscape orientation supported

### Performance
- [ ] Images use WebP/AVIF with fallback
- [ ] Below-fold images lazy loaded
- [ ] Fonts use `font-display: swap`
- [ ] Code split appropriately (routes, heavy components)
- [ ] Lighthouse score ≥90 across metrics

### Browser Support
- [ ] Works on Chrome/Edge (latest 2 versions)
- [ ] Works on Safari (latest 2 versions)
- [ ] Works on Firefox (latest 2 versions)
- [ ] Mobile Safari (iOS 14+)

---

## 📚 Implementation Examples

### Next.js Integration

```tsx
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Toris Blog',
  description: 'Interactive, modern content platform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <style>{`
          :root {
            --color-background: #0F172A;
            --color-surface: #1E293B;
            --color-foreground: #F8FAFC;
            --color-accent: #22C55E;
            --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          * {
            box-sizing: border-box;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            background-color: var(--color-background);
            color: var(--color-foreground);
            font-family: var(--font-sans);
            font-size: 16px;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        foreground: 'var(--color-foreground)',
        accent: 'var(--color-accent)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        4: 'var(--space-4)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
      },
      animation: {
        fadeIn: 'fadeIn 300ms ease-out',
        slideUp: 'slideUp 300ms ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
} satisfies Config;
```

---

## 🔗 Quick Links

- **Color Tool**: [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Icon Library**: [Heroicons](https://heroicons.com/) or [Lucide](https://lucide.dev/)
- **Font**: [Inter](https://fonts.google.com/specimen/Inter)
- **Accessibility**: [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- **Performance**: [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-07-04 | Interactive redesign with animations, Swiss Modernism 2.0 style, comprehensive accessibility |
| 1.0 | 2025-06-15 | Initial design system with dark mode OLED colors |

---

**Last Updated**: 2025-07-04
**Status**: Active (v2.0)
**Maintained by**: Toris
