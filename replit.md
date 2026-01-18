# Jujutsu Focus

## Overview

Jujutsu Focus is a gamified productivity mobile app built with React Native and Expo. The app uses a "Cursed Energy" economy where users earn energy through study sessions and spend it during leisure/gaming time. The core concept revolves around balancing productive work with breaks, featuring mechanics like "Binding Vows" for debt recovery and "RCT Credits" as a reward system.

The app follows an ultra-minimalist "Apple Sorcery" aesthetic with glassmorphism design, pure white foundations, and translucent glass cards. It's a single-screen dashboard app focused on real-time productivity tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack navigator (single-screen dashboard design)
- **State Management**: React Query for server state, custom `useGameState` hook with AsyncStorage for local persistence
- **Styling**: StyleSheet with theme system supporting light/dark modes
- **Animations**: React Native Reanimated for smooth, performant animations
- **UI Components**: Custom glassmorphism components using expo-blur, expo-linear-gradient

### Directory Structure
- `client/` - React Native frontend code
  - `components/` - Reusable UI components (GlassCard, StatusPill, ControlButton, etc.)
  - `screens/` - Screen components (DashboardScreen is the main screen)
  - `navigation/` - Navigation configuration
  - `hooks/` - Custom React hooks (useTheme, useGameState, useScreenOptions)
  - `constants/` - Theme definitions and design tokens
  - `lib/` - Utilities and API client setup

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server**: HTTP server with CORS configuration for Replit domains
- **API Structure**: REST endpoints prefixed with `/api`
- **Storage**: In-memory storage with interface abstraction (`IStorage`) for easy database migration

### Data Storage
- **Client-side**: AsyncStorage for persisting game state (balance, streaks, vow states)
- **Server-side**: Currently using in-memory storage (`MemStorage` class)
- **Database Schema**: Drizzle ORM with PostgreSQL schema defined (users table with UUID primary keys)
- **Migration**: Drizzle Kit configured for PostgreSQL migrations

### Design Patterns
- **Path Aliases**: `@/` maps to `client/`, `@shared/` maps to `shared/`
- **Error Boundaries**: Class-based error boundary with fallback UI
- **Theme System**: Centralized color tokens with automatic dark/light mode switching
- **Component Architecture**: Presentational components with animated wrappers using Reanimated

## External Dependencies

### Core Technologies
- **Expo SDK 54**: Mobile app framework with managed workflow
- **React 19.1**: UI library
- **TypeScript**: Type safety throughout the codebase

### UI/UX Libraries
- `expo-blur`: Glassmorphism blur effects
- `expo-linear-gradient`: Gradient backgrounds
- `expo-haptics`: Tactile feedback
- `react-native-reanimated`: Performant animations
- `react-native-gesture-handler`: Touch gestures
- `@expo/vector-icons` (Feather): Icon set

### Navigation
- `@react-navigation/native`: Core navigation
- `@react-navigation/native-stack`: Stack navigation
- `@react-navigation/bottom-tabs`: Tab navigation (available but not used in main flow)

### Data Layer
- `@tanstack/react-query`: Server state management
- `@react-native-async-storage/async-storage`: Local persistence
- `drizzle-orm` + `drizzle-zod`: ORM with Zod validation
- `pg`: PostgreSQL client

### Server
- `express`: HTTP server framework
- `http-proxy-middleware`: Development proxy
- `ws`: WebSocket support
- `tsx`: TypeScript execution

### Build Tools
- `babel-preset-expo`: Babel configuration
- `esbuild`: Server bundling
- `drizzle-kit`: Database migrations