# Aethera

Aethera is an Expo / React Native application focused on spiritual guidance, rituals, tarot, journaling, horoscope features, and AI-assisted oracle flows.

## Current Stack

- Expo 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation
- Zustand
- Supabase

## Project Structure

- `App.tsx`: app bootstrap, root providers, theme sync, error boundary
- `src/navigation`: navigator setup and navigation fallbacks
- `src/screens`: top-level app screens
- `src/components`: reusable UI building blocks
- `src/features`: domain-specific feature modules
- `src/core`: services, hooks, theme, i18n, API bindings, utilities
- `src/store`: global Zustand stores

## Local Development

Install dependencies:

```bash
pnpm install
```

Start Expo:

```bash
pnpm start
```

Other entry points:

```bash
pnpm android
pnpm ios
pnpm web
```

## Environment

Runtime keys are loaded from environment variables exposed through Expo public envs.

Expected variables:

- `EXPO_PUBLIC_OPENAI_API_KEY`
- `EXPO_PUBLIC_GEMINI_API_KEY`
- `EXPO_PUBLIC_OPENROUTER_API_KEY`
- `EXPO_PUBLIC_GROQ_API_KEY`

Use `.env.example` as the template for local setup.

## Repository Cleanup Notes

The repository has accumulated local backup files, QA dumps, repair scripts, and runtime diagnostics in the root directory. These are not part of the application runtime and should stay untracked.

The current cleanup sequence is:

1. Restore a clean repository baseline.
2. Keep root limited to runtime code and project config.
3. Verify TypeScript and app startup.
4. Refactor feature boundaries only after runtime is stable.
