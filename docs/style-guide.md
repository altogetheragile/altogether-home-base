# Altogether Agile — Brand Style Guide

Use this guide when creating PDFs, presentations, social media graphics, print materials, or any asset that should feel consistent with the Altogether Agile website.

---

## 1. Logo

**Text mark:** ALTOGETHER**AGILE** (one word, no space)

| Element | Colour | Weight |
|---------|--------|--------|
| ALTOGETHER | Deep Teal `#004D4D` | 800 (Extra Bold) |
| AGILE | Orange `#FF9715` | 800 (Extra Bold) |

**Favicon / icon:** White background with "AA" — first A in Deep Teal, second A in Orange.

**Clear space:** Maintain at least the height of the "A" character on all sides of the logo.

**Don'ts:** Don't place the logo on busy backgrounds without a white or light container. Don't alter the colour pairing.

---

## 2. Colour Palette

### Primary Brand Colours

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Deep Teal | `#004D4D` | 0, 77, 77 | Headings, nav bar, hero backgrounds, primary text |
| Orange | `#FF9715` | 255, 151, 21 | CTAs, buttons, accent highlights, "AGILE" in logo |

### Supporting Teal Scale

| Name | Hex | Usage |
|------|-----|-------|
| Sky Teal | `#F0FAFA` | Page backgrounds, light sections |
| Pale Teal | `#D9F2F2` | Subtle highlights, hero subtext |
| Light Teal | `#B2DFDF` | Borders, secondary accents |
| Mid Teal | `#007A7A` | Secondary headings, links, icons |

### Neutrals

| Name | Hex | Usage |
|------|-----|-------|
| White | `#FFFFFF` | Backgrounds, card surfaces |
| Body | `#374151` | Body text (gray-700) |
| Muted | `#6B7280` | Captions, metadata, secondary text (gray-500) |
| Border | `#E5E7EB` | Card borders, dividers (gray-200) |
| Light BG | `#FAFAFA` | Page background |

### Functional Colours

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Correct answers, positive states |
| Error | `#EF4444` | Incorrect answers, destructive actions |

---

## 3. Typography

### Font Families

| Role | Font | Fallback Stack |
|------|------|---------------|
| **Primary (sans)** | DM Sans | Inter, system-ui, sans-serif |
| **Display (serif)** | DM Serif Display | Merriweather, Georgia, serif |
| **Monospace** | ui-monospace | SFMono-Regular, monospace |

- **DM Sans** — Used for all body text, navigation, buttons, and UI elements. Weights: 400 (Regular), 700 (Bold).
- **DM Serif Display** — Used sparingly for blog post titles and editorial headings. Weights: 400, 400 Italic.

### Type Scale

| Token | Size | Typical Use |
|-------|------|-------------|
| xs | 12px / 0.75rem | Badges, fine print |
| sm | 14px / 0.875rem | Captions, metadata, button text |
| base | 16px / 1rem | Body text |
| lg | 18px / 1.125rem | Lead paragraphs |
| xl | 20px / 1.25rem | Card titles, section subheadings |
| 2xl | 24px / 1.5rem | Section headings |
| 3xl | 30px / 1.875rem | Page titles |

### Responsive Titles (Web)

Titles use `clamp()` for fluid scaling:
- **Page title:** `clamp(1.5rem, 4vw, 3rem)` — 24px to 48px
- **Subtitle:** `clamp(1rem, 2.5vw, 1.5rem)` — 16px to 24px
- **Content:** `clamp(0.875rem, 1.5vw, 1.125rem)` — 14px to 18px

### Line Heights

| Token | Value | Use |
|-------|-------|-----|
| Tight | 1.25 | Headings |
| Normal | 1.5 | Body text |
| Relaxed | 1.625 | Long-form reading |

### PDF / Print Recommendation

For print materials, use:
- **Headings:** DM Serif Display, 700 weight, Deep Teal
- **Body:** DM Sans, 400 weight, Body colour (#374151)
- **Accents/CTAs:** Orange on white, or white on Deep Teal
- **Base size:** 11pt body, 14–18pt headings

---

## 4. Spacing

Based on an 8px grid (0.5rem increments):

| Token | Value | Px |
|-------|-------|----|
| space-1 | 0.25rem | 4 |
| space-2 | 0.5rem | 8 |
| space-3 | 0.75rem | 12 |
| space-4 | 1rem | 16 |
| space-6 | 1.5rem | 24 |
| space-8 | 2rem | 32 |
| space-12 | 3rem | 48 |
| space-16 | 4rem | 64 |

**Content max-width:** 1100px (cards grid), 960px (blog editor), 900px (hero text)

**Card padding:** 28px internal, 24px grid gap

---

## 5. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| sm | 4px | Small chips, tags |
| md | 6px | Inputs, small buttons |
| lg | 8px | Buttons, cards (default) |
| xl | 14px | Feature cards, images |
| full | 9999px | Badges, avatars, pills |

---

## 6. Shadows

| Level | Value | Use |
|-------|-------|-----|
| xs | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| sm | `0 1px 3px rgba(0,0,0,0.1)` | Cards at rest |
| md | `0 4px 6px rgba(0,0,0,0.1)` | Cards on hover |
| lg | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| xl | `0 20px 25px rgba(0,0,0,0.1)` | Prominent overlays |

---

## 7. Buttons

### Primary (Default)
- **Background:** Orange `#FF9715`
- **Text:** Deep Teal `#004D4D`, 700 weight
- **Padding:** 10px 24px
- **Border radius:** 8px
- **Hover:** opacity 0.9

### Outline
- **Background:** transparent
- **Border:** 1px solid border colour
- **Text:** Body colour
- **Hover:** Light accent background

### Sizes

| Size | Height | Horizontal Padding |
|------|--------|-------------------|
| sm | 36px | 12px |
| default | 40px | 16px |
| lg | 44px | 32px |
| xl | 48px | 40px |
| 2xl | 56px | 48px |

---

## 8. Cards

- **Background:** White `#FFFFFF`
- **Border:** 1px solid `#E5E7EB`
- **Border radius:** 14px
- **Shadow:** sm at rest, md on hover
- **Hover transform:** translateY(-2px)
- **Accent bar:** 6px tall gradient from Deep Teal → Mid Teal (top edge)

---

## 9. Imagery

### Blog Featured Images
- **Recommended size:** 1200 x 630px (Open Graph standard)
- **Aspect ratio:** ~1.9:1 (16:9 also acceptable at 1200 x 675px)
- **Display:** Full width, max 400px tall, `object-fit: cover` with 14px radius
- **Card thumbnail:** 180px tall, cropped to fit

### General Guidance
- Use WebP format for web delivery
- Keep focal content centred (images are cropped differently across card and full-width views)
- Prefer clean, simple compositions that work at both small and large sizes

---

## 10. Gradients

| Name | Value | Use |
|------|-------|-----|
| Hero background | `linear-gradient(135deg, #004D4D 0%, #006666 100%)` | Page hero sections |
| Card accent bar | `linear-gradient(90deg, #004D4D, #007A7A)` | Top edge of cards |

---

## 11. Iconography

- **Library:** Lucide React (line icons)
- **Default size:** 14–18px for inline, 48px for empty states
- **Colour:** Inherits from parent text colour (typically Muted or Deep Teal)
- **Stroke width:** Default (2px)

---

## 12. Voice & Tone

- **Professional but approachable** — not corporate, not casual
- **Clear and direct** — short sentences, active voice
- **Helpful, not preachy** — share expertise without lecturing
- **UK English** — "organised" not "organized", "colour" not "color"

---

## 13. Quick Reference — PDF Template

When creating a downloadable PDF:

| Element | Spec |
|---------|------|
| Page margins | 24mm all sides |
| Header | Logo (left), page title (right, DM Serif Display 14pt Deep Teal) |
| Body font | DM Sans 11pt, #374151, 1.5 line height |
| Heading 1 | DM Serif Display 18pt, #004D4D, 1.25 line height |
| Heading 2 | DM Sans Bold 14pt, #004D4D |
| Heading 3 | DM Sans Bold 12pt, #007A7A |
| Accent/highlight | Orange `#FF9715` for callout borders or key terms |
| Dividers | 1px `#E5E7EB` |
| Footer | Muted text 9pt, "altogetheragile.com", page number right |
| Callout box | Sky Teal `#F0FAFA` background, 8px radius, 16px padding |
