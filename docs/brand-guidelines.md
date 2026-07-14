# TORIS Brand Guidelines

TORIS is an independent product-engineering lab for small and medium-sized businesses improving an existing service. The name began with the inventive confidence of Tony Stark, but the brand is expressed through an original engineering identity—not character, armor, or entertainment imagery.

## Brand foundation

- **Audience:** decision-makers who need to modernize, stabilize, or extend a web, app, or desktop service without adding delivery risk.
- **Promise:** **아이디어를 작동하게, 끝까지.** TORIS connects interface, system, launch, and operation instead of stopping at screens or prototypes.
- **Personality:** inventive, exact, accountable. Confident engineering is more credible than spectacle.
- **Proof:** shipped products, full-stack ownership, deployment records, and technical writing. Never imply metrics, clients, or outcomes that cannot be verified.

### Core Attributes

| Attribute | Meaning |
| --- | --- |
| **Inventive** | 익숙한 문제도 더 나은 작동 방식으로 다시 설계합니다. |
| **Exact** | 화면, 시스템, 배포 경계를 정확히 정의합니다. |
| **Accountable** | 시연에서 멈추지 않고 실제 운영 결과까지 책임집니다. |

### Brand Personality

| Trait | Expression |
| --- | --- |
| **Inventive** | Bold hypotheses, practical prototypes |
| **Exact** | Structured, legible, engineered |
| **Accountable** | Delivery-minded and evidence-led |

## Voice

Lead with the customer problem and an observable outcome. Use direct Korean, short active sentences, and concrete scope such as 설계, 개발, 배포, 운영. Explain technical choices only when they reduce uncertainty. Calls to action should describe the next step: `프로젝트 상담하기`, `작업 사례 보기`.

Avoid inflated claims, trend-heavy jargon, anonymous agency language, and treating a technology list as the main value proposition. TORIS speaks as a responsible product partner, not a hobby project or neon Web3 showcase.

## Visual identity

### Primary Colors

| Color | Value | Role |
| --- | --- | --- |
| Reactor Cyan | `#5CEBFF` | Core action, active energy, and product state |
| Alloy Gold | `#C99A3D` | System structure, navigation, and craft |

### Secondary Colors

| Color | Value | Role |
| --- | --- | --- |
| Forge Red | `#B72E2C` | Alerts, constraints, and critical state |
| Reactor Cyan Dark | `#5CEBFF` | Active product signal on Carbon |

### Neutral Colors

| Role | Value | Use |
| --- | --- | --- |
| Carbon | `#080A0D` | Primary copy and dark laboratory stage |
| Graphite | `#171A20` | Instrument panels and structural depth |
| Ceramic | `#F4F1E8` | Technical drawing canvas |
| Titanium | `#7E8794` | Secondary copy and hardware detail |

### Semantic Colors

| Role | Source |
| --- | --- |
| Reactor Text Light | `#006877` on Ceramic |
| Reactor Text Dark | `#5CEBFF` on Carbon |
| Alloy Text Light | `#745000` on Ceramic |
| Alloy Text Dark | `#E7C46D` on Carbon |
| Control Border Light | `#69717B` interactive boundary |
| Focus | Reactor Text for the active surface: `#006877` light / `#5CEBFF` dark |

Use semantic tokens from `src/styles/brand-tokens.css`; do not scatter canonical hex values through components. Reactor Cyan means energy is active. Alloy Gold means a system boundary or crafted structure. Forge Red marks constraint or risk. Only the reactor motif may carry a restrained emitted-light effect; the rest of the interface stays materially flat and precise.

### Typography

Use Space Grotesk for concise display headings and Inter for Korean body copy and controls. Keep display type at or below `6rem`, tracking no tighter than `-0.04em`, and Korean line breaks intentional with `word-break: keep-all` where appropriate. Sentence case is the default; repeated tiny uppercase labels are not a hierarchy system.

### Font Stack

```css
--font-heading: 'Space Grotesk';
--font-body: 'Inter';
--font-mono: 'ui-monospace';
```

### Surfaces and shape

Move deliberately between a Carbon product lab and a Ceramic technical-drawing canvas. Use Graphite instrument surfaces, clipped or 12px corners, thin Titanium rules, and restrained depth. The signature element is the T-Reactor: one core, three product paths, one visible operating state.

### Motion

Motion should reveal navigation direction, product handoff, or state change. Prefer short transforms and opacity changes over perpetual ambient effects. Every non-essential animation must stop or simplify under `prefers-reduced-motion`; content and controls must remain fully usable without motion.

## Image style

### Base Prompt Template

```
Original TORIS product-engineering laboratory visual, precise industrial geometry, Carbon and Ceramic materials, one Reactor Cyan energy core, restrained Alloy Gold and Forge Red hardware signals, asymmetric editorial composition, premium but practical, no readable text, no people, no entertainment IP, no superhero armor or helmet
```

### Style Keywords

| Category | Keywords |
| --- | --- |
| **Form** | precision-machined, modular, structural, engineered |
| **Material** | matte carbon, ceramic surface, titanium detail |
| **Light** | restrained cyan emission, controlled studio light |
| **Composition** | asymmetric, editorial, product-focused, spacious |

### Visual Mood Descriptors

- Inventive without becoming fictional
- Exact enough to feel buildable
- Confident, calm, and accountable

### Visual Don'ts

| Avoid | Reason |
| --- | --- |
| Superhero suits, helmets, chest armor, or cinematic character poses | Copies entertainment shorthand instead of building TORIS equity |
| Dense HUD overlays, sci-fi dashboards, or decorative code | Adds spectacle without explaining the product |
| Purple neon, rainbow gradients, or large blurred glow fields | Breaks the material Carbon/Ceramic system |
| AI-generated lettering inside artwork | Wordmarks and labels must remain accessible real text |

### Accessibility

Meet WCAG AA contrast for text and controls. Keep visible surface-safe Reactor focus indicators, meaningful image alternative text, semantic heading order, keyboard access, and at least 44×44px interactive targets. Never encode status by color alone.

### Prohibited

| Avoid | Reason |
| --- | --- |
| Gradient text or gradient logo marks | Weakens the precise operational identity |
| Decorative HUD grids, superhero imagery, armor or helmet silhouettes | Confuses the original TORIS engineering identity with entertainment IP |
| Large neon glows or blurred orbs | Creates spectacle without product meaning |
| Repeated glass cards or border-plus-wide-shadow cards | Flattens information hierarchy |
| Unverified metrics, client claims, awards, or outcomes | Breaks evidence-led trust |
| AI-generated text baked into the logo | The TORIS wordmark must remain real text |
| Stretching, recoloring, shadows, or effects on the logo mark | Breaks mark consistency |
