# TORIS Brand Guidelines

TORIS is an independent product-engineering studio for small and medium-sized businesses improving an existing service. This guide is the source of truth for customer-facing product, portfolio, and consultation experiences.

## Brand foundation

- **Audience:** decision-makers who need to modernize, stabilize, or extend a web, app, or desktop service without adding delivery risk.
- **Promise:** **아이디어를 작동하게, 끝까지.** TORIS connects interface, system, launch, and operation instead of stopping at screens or prototypes.
- **Personality:** clear, persistent, trustworthy. Calm competence is more credible than spectacle.
- **Proof:** shipped products, full-stack ownership, deployment records, and technical writing. Never imply metrics, clients, or outcomes that cannot be verified.

## Voice

Lead with the customer problem and an observable outcome. Use direct Korean, short active sentences, and concrete scope such as 설계, 개발, 배포, 운영. Explain technical choices only when they reduce uncertainty. Calls to action should describe the next step: `프로젝트 상담하기`, `작업 사례 보기`.

Avoid inflated claims, trend-heavy jargon, anonymous agency language, and treating a technology list as the main value proposition. TORIS speaks as a responsible product partner, not a hobby project or neon Web3 showcase.

## Visual identity

### Palette roles

| Role | Value | Use |
| --- | --- | --- |
| Ink | `#0E0F12` | Primary copy and dark stage canvas |
| Graphite | `#202123` | Dark surfaces and structural depth |
| Mist | `#F5F7FA` | Default light canvas |
| Steel | `#9EA1AA` | Secondary copy on dark surfaces only |
| Signal Green | `#10A37F` | Delivery, completion, and primary action state |
| System Blue | `#2B8FFF` | Navigation, focus, links, and system flow |
| Destructive | `#B42318` light / `#F97066` dark | Errors, destructive action surfaces, and error text |

Use semantic tokens from `src/styles/brand-tokens.css`; do not scatter canonical hex values through components. On light surfaces, use the darker `--toris-ink-muted` token instead of Steel for body copy so contrast remains readable. Use Ink through `--toris-on-signal` and `--toris-on-system` for copy on saturated brand actions. Use `--toris-destructive-text` for inline errors and pair destructive surfaces with `--toris-on-destructive`; both roles change by theme to retain normal-text contrast. Decorative borders may stay quiet; inputs and interactive boundaries must use the stronger `--toris-control-border`. Green communicates delivery/status. Blue communicates systems/navigation. Neither is decoration.

### Typography

Use Space Grotesk for concise display headings and Inter for Korean body copy and controls. Keep display type at or below `6rem`, tracking no tighter than `-0.04em`, and Korean line breaks intentional with `word-break: keep-all` where appropriate. Sentence case is the default; repeated tiny uppercase labels are not a hierarchy system.

### Surfaces and shape

Move deliberately between a dark product stage and a Mist work canvas. Use white or Graphite surfaces, 12–16px card corners, thin semantic borders, and restrained shadows. Depth should communicate grouping, not make every element float. Buttons may use full pill corners when their shape improves recognition.

### Motion

Motion should reveal navigation direction, product handoff, or state change. Prefer short transforms and opacity changes over perpetual ambient effects. Every non-essential animation must stop or simplify under `prefers-reduced-motion`; content and controls must remain fully usable without motion.

### Accessibility

Meet WCAG AA contrast for text and controls. Keep visible System Blue focus indicators, meaningful image alternative text, semantic heading order, keyboard access, and at least 44×44px interactive targets. Never encode status by color alone.

## Prohibited treatments

- Gradient text or gradient logo marks
- Decorative dot/grid backgrounds, cyberpunk neon, large glows, or blurred-orb filler
- Repeated translucent glass cards or border-plus-wide-shadow cards
- Unverified metrics, client claims, awards, or outcomes
- AI-generated text baked into the logo; the TORIS wordmark must remain real text
- Stretching, recoloring, adding shadows to, or placing effects over the logo mark
