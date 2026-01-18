# Jujutsu Focus - Design Guidelines

## Brand Identity
**App Personality:** Ultra-minimalist "Apple Sorcery" aesthetic - clean, glassy, gamified productivity app revolving around "Cursed Energy" currency. The memorable element is the high-stakes debt system with anime-inspired mechanics (Binding Vows, Reverse Cursed Technique).

**Visual Direction:** Glassmorphism with surgical precision. Pure white foundations, translucent glass cards, no clutter. Every element serves the energy economy narrative.

## Navigation Architecture
**Root Navigation:** Stack-Only (Single-page app)
- Main Dashboard (only screen)

## Screen Specifications

### Main Dashboard
**Purpose:** Real-time productivity tracker with gamified energy economy.

**Layout:**
- No header (full-screen canvas)
- Root view: Non-scrollable, centered layout
- Safe area insets: top = insets.top + 24, bottom = insets.bottom + 24

**Components (Top to Bottom):**

1. **Status Bar** (Horizontal pill group at top)
   - Streak counter pill: "Streak: X Days" (Blue accent if >0)
   - NCE Balance pill: "NCE: 50.0" (Always visible)
   - RCT Credits pill: "RCT: 1" (Visible when >0)

2. **Central Balance Display** (Hero element)
   - Large numerical ticker showing current CE balance
   - State-based styling:
     - Positive balance: Deep Black text
     - Negative balance: Crimson Red text with subtle pulse animation
   - Font size: 72pt, tabular numbers

3. **Control Deck** (Two large glass buttons)
   - Focus button (Study icon) - Left
   - Leisure button (Gamepad icon) - Right
   - Active state: Button morphs to "Stop" with timer display
   - Pill-shaped, equal width

4. **Binding Vow Widget** (Conditional card)
   - Only visible when balance < 0
   - Glass card with "Sign Binding Vow" CTA
   - Once activated, shows:
     - "Grace Time Available: MM:SS" ticker
     - Subtle gradient overlay (blue/10)
     - Auto-dismiss on vow completion with success modal

**Empty States:**
- None needed (single-page tracker)

## Color Palette
- **Background:** Pure White (#FFFFFF) or subtle gray (#F9FAFB)
- **Surface (Glass Cards):** White with 70% opacity, heavy blur
- **Borders:** Light gray (#E5E7EB)
- **Text Primary:** Deep Black (#000000)
- **Text Secondary:** Slate 600 (#475569)
- **Cursed Energy (Positive):** Electric Blue (#3B82F6)
  - Accent backgrounds: Blue 500 at 10% opacity
- **Debt (Negative):** Crimson Red (#EF4444)
  - Warning backgrounds: Red 500 at 10% opacity
- **Success:** Emerald Green (#10B981) for vow completion

## Typography
**Font:** Inter or SF Pro (System sans-serif)
- **Balance Display:** 72pt, Bold, Tabular figures
- **Status Pills:** 14pt, Medium
- **Button Text:** 16pt, Semibold
- **Body Text:** 14pt, Regular

## Visual Design
- **Cards:** Glassmorphism with backdrop blur, 1px subtle border, soft shadows (0 4px 6px rgba(0,0,0,0.05))
- **Buttons:** Solid Black (#000000) with White text, pill-shaped (full border radius)
  - Hover: Scale transform (1.02), no color shift
  - Active button: Blue accent with timer overlay
- **Animations:** Spring-based transitions for balance changes, smooth counting animations
- **Icons:** Use Feather icons - Play (Focus), Gamepad (Leisure), Zap (RCT), Shield (Vow)
- **Touchable Feedback:** Subtle scale down (0.98) on press

## Assets to Generate

**Required Assets:**
1. **icon.png** - App icon featuring stylized "JF" monogram or cursed energy symbol in Electric Blue on Black background. *Used on: Device home screen*

2. **splash-icon.png** - Simplified version of app icon for launch screen. *Used on: App launch*

3. **vow-success.png** - Minimal illustration of breaking chains or energy burst (blue gradient). *Used on: Binding Vow completion modal*

4. **debt-warning.png** - Subtle illustration of descending energy levels (red gradient fading to gray). *Used on: First-time debt entry tooltip*

**Asset Style:** Clean, minimal vector-style illustrations matching the glassmorphism aesthetic. Prefer geometric shapes over detailed illustrations. Maximum 2 colors per asset.