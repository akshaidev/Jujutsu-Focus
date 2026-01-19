# Jujutsu Focus 📱⚡

A gamified productivity app inspired by Jujutsu Kaisen's cursed energy system. Track your focus time vs leisure time using a dynamic balance mechanic that rewards consistent productivity.

## Core Concept

The app uses **Cursed Energy (CE)** as a currency that rises when you focus (study/work) and falls when you take leisure (gaming/breaks). The goal is to maintain a positive CE balance to build streaks and unlock special abilities.

---

## Features

### 🔮 Cursed Energy (CE) Balance

The central mechanic of the app. Your CE balance changes based on your activities:

| Activity | Effect |
|----------|--------|
| **Focus Mode** | +1.0 CE per minute (base rate) |
| **Leisure Mode** | -1.0 CE per minute |

**Debt Penalties** - When your balance goes negative:
| Debt Level | Focus Earning Rate |
|------------|-------------------|
| 0 to -5 CE | 1.0 CE/min (normal) |
| -5 to -10 CE | 0.5 CE/min (reduced) |
| Below -10 CE | 0.25 CE/min (heavily reduced) |

---

### 🔥 Streaks

Streaks reward consistent productivity:

- **How to earn**: End the day with a higher CE balance than the previous day
- **Streak counter**: Shows consecutive days of positive progress
- **Streak bonus**: Earn **0.5 NCE per minute** while focusing (only when streak > 0)
- **RCT Credits**: Every **3 streak days** grants 1 RCT credit

---

### ⚡ Negative Cursed Energy (NCE)

NCE is a secondary resource earned only through streaks:

- **Earning rate**: 0.5 NCE per minute while focusing (requires active streak)
- **Usage**: Convert to positive CE using RCT (see below)
- **Not affected by**: Binding vows or debt level

---

### 💚 Reverse Cursed Technique (RCT)

A healing ability that converts NCE into positive CE:

- **Requirement**: 1 RCT credit + at least 1 NCE
- **Effect**: Converts all accumulated NCE into positive CE
- **Credit source**: Earned every 3 days of streak

**RCT Button shows when**: You have RCT credits available and NCE > 0

---

### ⛓️ Binding Vow

A high-risk, high-reward mechanic for escaping debt:

#### Signing a Vow
- **Requirement**: Must be in debt (negative CE)
- **Limit**: 1 vow per day
- **Confirmation**: Scary modal with acknowledgment checkbox

#### Active Vow Benefits
- **Boosted earning rate**: +0.5 CE/min added to base rate
- **Grace time earned**: 0.2 seconds per second of focus time
- **Grace time protection**: Leisure time consumes grace instead of CE

#### Vow Completion
- **Success**: Clear your debt (reach CE ≥ 0) within 24 hours
- **Bonus**: Unused grace time converts to CE

#### Vow Failure (24hr expires while in debt)
- **Penalty**: Debt increases by MAX(original debt, current debt)
- **Cooldown**: Binding vow disabled for 6 hours
- **Applied on**: App load or during focus session

#### UI States
| State | Button Text | Subtitle |
|-------|------------|----------|
| Available | "Sign Binding Vow" | "+0.5 CE/min boost..." |
| Used today | "Limit Reached" | "1 vow per day, come back tomorrow" |
| Penalty period | "Vow Recoiled" | "Available in HH:MM" (countdown) |
| Active | Shows timers | Grace Time + Time Left |

---

### 😴 Sleep Log

Daily sleep tracking that rewards rest:

| Hours Slept | CE Reward |
|-------------|-----------|
| 1-5 hours | +10 CE |
| 6-8 hours | +20 CE |
| 9+ hours | +15 CE |

- **Modal appears**: Once per day on app open
- **Can dismiss**: If you don't want to log
- **Server time validated**: Cannot be exploited by changing device time

---

### 📊 Dashboard

The main screen displays:
- **Status Pills**: Streak days, NCE balance, RCT credits
- **Balance Display**: Current CE with earning rate indicator
- **Session Timer**: Active when focusing or in leisure (shows session + daily totals)
- **Control Buttons**: Focus / Leisure toggle buttons
- **RCT Button**: When available, shows conversion preview
- **Binding Vow Widget**: When in debt or vow active

---

### 📖 Grimoire (Scriptures)

In-app guide explaining game mechanics using Jujutsu Kaisen terminology:
- Cursed Energy (CE)
- Debt (The Curse)
- Streaks (Heavenly Gift)
- RCT (Purification)
- Binding Vows

Also includes **Cursed History** tab showing activity log.

---

## Anti-Cheat System

The app uses **server time validation** to prevent device time manipulation:

### How It Works
1. On app startup, fetches time from fast CDN endpoints (Google, Cloudflare)
2. Calculates offset between device time and server time
3. All time-sensitive calculations use server-adjusted time

### Protected Features
- ✅ Daily streak calculations
- ✅ Sleep log (can't claim twice)
- ✅ Binding vow 24hr countdown
- ✅ Penalty period 6hr cooldown
- ✅ Daily counter resets

### Time Endpoints (in order)
1. `google.com/generate_204` (~50ms)
2. `1.1.1.1/cdn-cgi/trace` (~80ms)
3. `cloudflare.com/cdn-cgi/trace` (backup)

---

## Technical Architecture

### File Structure
```
client/
├── App.tsx                 # Root navigation setup
├── screens/
│   ├── DashboardScreen.tsx # Main productivity screen
│   ├── GrimoireScreen.tsx  # Scriptures + History
│   ├── HomeScreen.tsx      # Tab container
│   └── ProfileScreen.tsx   # User profile
├── components/
│   ├── BalanceDisplay.tsx      # CE balance with animation
│   ├── BindingVowWidget.tsx    # Vow status + signing
│   ├── BindingVowConfirmModal  # Scary confirmation modal
│   ├── ControlButton.tsx       # Focus/Leisure buttons
│   ├── SessionTimer.tsx        # Active session display
│   ├── SleepLogModal.tsx       # Daily sleep input
│   ├── RCTButton.tsx           # NCE conversion button
│   ├── StatusPill.tsx          # Streak/NCE/RCT indicators
│   ├── CursedGuide.tsx         # In-app guide modal
│   ├── CursedLog.tsx           # Activity history modal
│   └── GlassCard.tsx           # Glassmorphism card
├── hooks/
│   ├── useGameState.ts         # Context wrapper
│   └── useGameStateInternal.ts # Core game logic
├── utils/
│   └── timeService.ts          # Server time sync
└── constants/
    └── theme.ts                # Colors, spacing, typography
```

### State Management
All game state is managed in `useGameStateInternal.ts` and persisted to `AsyncStorage`.

#### GameState Interface
```typescript
interface GameState {
  balance: number;              // Current CE
  nceBalance: number;           // Negative CE
  streakDays: number;           // Consecutive days
  rctCredits: number;           // Heal charges
  vowState: VowState;           // Binding vow status
  totalStudySeconds: number;    // All-time focus
  totalGamingSeconds: number;   // All-time leisure
  dailyStudySeconds: number;    // Today's focus
  dailyGamingSeconds: number;   // Today's leisure
  logs: LogEntry[];             // Activity history
  lastSleepDate: string | null; // Sleep tracking
  lastBalanceDate: string | null;
  lastBalance: number;
  lastDailyResetDate: string | null;
}
```

---

## Design System

### Theme
- Dark mode with purple/violet accents
- Glassmorphism effects on cards
- Smooth timing-based animations (Apple UI style)

### Colors
| Token | Usage |
|-------|-------|
| `cursedEnergy` | Focus/positive states |
| `debt` | Negative balance, vow danger |
| `success` | Streaks, rewards |
| `textSecondary` | Muted text |

### Animations
All animations use `react-native-reanimated` with `withTiming` and `Easing` functions (no spring bounce).

---

## Running the App

```bash
# Install dependencies
npm install

# Start Expo dev server
npm run expo:dev

# Or specific platform
npm run android
npm run ios
```

---

## Building

```bash
# EAS Build (production)
eas build --platform android
eas build --platform ios
```
