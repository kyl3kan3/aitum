# The Altum Connection

A premium mobile app that bridges recipes and home cooking. Upload cookbook collections and video content, surface recipes from owned cookbooks, and get clean, actionable cooking lists from saved videos.

## Onboarding Flow

The app features a high-converting onboarding flow that follows the "Promise → Commitment → Product" framework:

### Flow Structure
1. **Intro** - Transformational promise: "Feel energized. Sleep better. Optimize your body."
2. **Quiz: Cooking Level** - Personalize the experience based on skill level
3. **Quiz: Goals** - Multi-select cooking goals (healthy eating, save time, etc.)
4. **Quiz: Time** - Available cooking time per day
5. **Results** - Personalized insights based on answers (creates anticipation)
6. **Symptoms/Challenges** - Identify pain points the app will solve
7. **How App Can Help** - Show solutions to their specific challenges
8. **Reviews** - Social proof with real testimonials
9. **App Features** - Visual showcase of premium features
10. **Custom Plan** - Personalized plan preview (Quick Win before paywall)
11. **Paywall** - RevenueCat subscription with Weekly/Monthly/Annual options

### RevenueCat Integration
- **Entitlement**: `premium`
- **Products**:
  - Weekly: $4.99/week
  - Monthly: $9.99/month
  - Annual: $49.99/year (58% savings)
- **Offering**: `default`

## Premium Features

### Core Experience
- **Home Screen**: Featured recipes carousel with smooth animations, quick action buttons, and personalized recipe browsing
- **AI Food Scanner**: Point camera at ingredients → AI identifies them → Get instant recipe suggestions powered by OpenAI GPT-5.2 Vision
- **Recipe Details**: Full ingredients list, step-by-step instructions with interactive timers, nutritional information, and related video tutorials
- **Search**: Search by recipe name, ingredients, or category with search history

### AI-Powered Features
- **Ingredient Detection**: OpenAI Vision analyzes photos to identify food items with categories (protein, vegetable, fruit, dairy, grain, spice)
- **Recipe Generation**: AI generates 3 personalized recipe suggestions based on detected ingredients
- **Smart Categorization**: Ingredients are color-coded by category for easy visual scanning

### Vibecode Cloud Backend
- **Recipe Storage**: Save AI-generated recipes to the cloud for later access
- **Scan History**: Track your ingredient scan history with timestamps
- **User Profile**: Store cooking preferences, skill level, and dietary needs
- **Collections**: Create and manage recipe collections synced across devices
- **Meal Plans**: Save weekly meal plans to the cloud
- **Data Export**: Export all your data as JSON for backup

### Theme & Design
- **Beautiful Dark/Light Mode**: Toggle between themes with warm cooking colors (orange accents, cream backgrounds)
- **Smooth Animations**: Delightful micro-interactions and transitions throughout the app using react-native-reanimated
- **Haptic Feedback**: Tactile feedback for all interactions

### Cooking Features
- **Cooking Mode**: Hands-free cooking with large text instructions, voice reading (text-to-speech), and interactive step timers
- **Shopping List**: Auto-generate shopping lists from recipe ingredients with checkboxes, grouped by recipe
- **Meal Planner**: Weekly calendar view to schedule recipes for breakfast, lunch, dinner, and snacks
- **Nutritional Info**: Per-serving calories, protein, carbs, fat, fiber, and sodium for each recipe

### Organization
- **Recipe Collections**: Create custom folders with icons and colors to organize your recipes
- **Favorites**: Quick access to your favorite recipes with heart animation
- **Video Player**: Full-screen video player with playback controls for cooking tutorials

### Social
- **Share Recipes**: Native sharing to send recipes to friends via any app

## Environment variables

Secrets must **never** be committed to git. Copy `.env.example` to `.env` locally, or set values in the **Vibecode App ENV tab**.

- `.env` and other env files are gitignored; only `.env.example` is tracked.
- `EXPO_PUBLIC_*` values are embedded in the client app. For OpenAI vision/recipes, set `EXPO_PUBLIC_VIBECODE_AI_PROXY_URL` and deploy the optional proxy in `server/ai-proxy` so the OpenAI key stays on the server.
- If keys were ever pushed to a public repository, rotate them at each provider immediately (history is not rewritten by this repo).

## Structure

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab navigation with theme
│   │   ├── index.tsx        # Home screen with quick actions
│   │   ├── scan.tsx         # Camera/scan screen
│   │   ├── videos.tsx       # Video tutorials
│   │   └── profile.tsx      # User profile
│   ├── recipe/
│   │   └── [id].tsx         # Recipe detail with nutrition & timers
│   ├── onboarding.tsx       # Full onboarding flow (11 steps)
│   ├── paywall.tsx          # RevenueCat subscription paywall
│   ├── cooking-mode.tsx     # Hands-free cooking mode
│   ├── shopping-list.tsx    # Shopping list with checkboxes
│   ├── meal-planner.tsx     # Weekly meal calendar
│   ├── collections.tsx      # Custom recipe collections
│   ├── video-player.tsx     # Video player
│   ├── settings.tsx         # App settings & theme toggle
│   ├── camera.tsx           # Full camera modal
│   ├── search.tsx           # Search screen
│   └── _layout.tsx          # Root layout with ThemeProvider & onboarding logic
├── components/
│   └── RecipeCard.tsx       # Reusable recipe card
└── lib/
    ├── state/
    │   ├── recipe-store.ts      # Recipes, favorites, videos, photos
    │   ├── app-store.ts         # Theme, shopping list, collections, meal plan
    │   └── onboarding-store.ts  # Onboarding state and quiz answers
    ├── theme-context.tsx        # Theme provider with warm cooking colors
    └── revenuecatClient.ts      # RevenueCat SDK wrapper
```

## Core Philosophy

Cooking should be joyful and friction-free. The app helps users:
- Surface recipes from their cookbook collections
- Get clean, actionable cooking lists from saved videos
- Save favorite recipes for quick access
- Track cooking progress with interactive step completion
- Plan meals for the week ahead
- Shop efficiently with auto-generated lists
