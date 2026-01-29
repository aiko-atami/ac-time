# AC Live Timing - React SPA

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![shadcn](https://img.shields.io/badge/shadcn-v3.7-black.svg)

A clean **React SPA** for displaying live timing data from Assetto Corsa racing servers. Built with shadcn UI components, featuring responsive card-based layout and real-time data filtering/sorting.

## ✨ Features

- 🏎️ **Live Timing Display**: Real-time leaderboard with driver positions, lap times, and sector splits
- 🎨 **shadcn UI**: Built with premium shadcn components for clean, professional design
- 📱 **Responsive**: Mobile-first card layout that adapts to all screen sizes
- 🔄 **Auto-refresh**: Configurable 30-second auto-refresh for live updates
- 🎯 **Filtering & Sorting**: Filter by car class, sort by lap time/driver/lap count
- 🏁 **Car Classes**: Color-coded badges for GT3, GT4, Porsche Cup, Super Production
- ⏱️ **Sector Timing**: Display both best lap splits and theoretical best lap

## 🎯 Tech Stack

- **React 19.2** - UI library
- **TypeScript 5.9** - Type safety
- **Vite 7** - Build tool & dev server
- **shadcn** - UI component library
- **Tabler Icons** - Icon library

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended: Node 20+)
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Development with Mock Data

By default, the app uses **mock data** for development. No backend API is required to run and test the application.

### Production Setup (Backend Integration)

When your backend API is ready:

1. Create `.env.production`:
   ```bash
   VITE_API_URL=https://your-backend-api.com
   VITE_USE_MOCK_DATA=false
   ```

2. Build for production:
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
src/
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── api.ts                # API client
│   ├── mockData.ts           # Mock leaderboard data
│   └── utils.ts              # Utilities (formatTime, colors, etc.)
├── hooks/
│   ├── useLeaderboard.ts     # Data fetching hook
│   └── useLeaderboardFilters.ts # Filtering & sorting logic
├── components/
│   ├── LoadingState.tsx      # Loading spinner
│   ├── ErrorState.tsx        # Error display
│   ├── CarClassBadge.tsx     # Car class badges
│   ├── LeaderboardFilters.tsx # Filter controls
│   ├── LeaderboardCard.tsx   # Driver card (main UI)
│   ├── Leaderboard.tsx       # Leaderboard wrapper
│   └── ui/                   # shadcn components
├── App.tsx                   # Main app component
├── index.css                 # Racing theme styles
└── main.tsx                  # React entry point
```

## 🎨 Styling & Theme

### shadcn Base Theme

The application uses shadcn's base theme with minimal customization:
- **Layout**: Card components with standard borders
- **Typography**: Nunito Sans Variable font
- **Colors**: shadcn default color palette
- **Car Class Badges**:
  - GT3: Red `#ef4444`
  - GT4: Blue `#3b82f6`
  - Porsche Cup: Orange `#f59e0b`
  - Super Production: Green `#10b981`
  - Other: Gray `#6b7280`

### Responsive Breakpoints

- Mobile: `< 480px`
- Tablet: `480px - 640px`
- Desktop: `> 640px`

## 🔌 Backend API Integration

### API Contract

The frontend expects the backend to return **pre-processed** data in this format:

```typescript
interface ProcessedLeaderboard {
  leaderboard: ProcessedEntry[];
  serverName: string;
  track: string;
  sessionName: string;
  lastUpdate?: string;
  error?: string;
}

interface ProcessedEntry {
  id: string;
  driverName: string;
  carName: string;
  carModel: string;
  carClass: string; // GT3, GT4, Porsche Cup, etc.
  teamName: string;
  bestLap: number | null; // milliseconds
  splits: (number | null)[]; // theoretical best splits
  bestLapSplits: (number | null)[]; // actual best lap splits
  theoreticalBestLap: number | null; // sum of splits
  lapCount: number;
}
```

### Backend Responsibilities

The backend API should:
1. Fetch raw data from Assetto Corsa server API
2. **Transform** data (nanoseconds → milliseconds)
3. **Detect** car classes based on car model/name
4. **Calculate** theoretical best lap (sum of best splits)
5. **Sort** entries by best lap time
6. Return `ProcessedLeaderboard` JSON

### Frontend Responsibilities

The frontend:
- Fetches pre-processed data from backend
- Handles UI state (filters, sorting)
- Displays data with premium styling
- Auto-refreshes every 30 seconds

## 🛠️ Available Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## 🔍 Key Features Explained

### Auto-Refresh
```typescript
// In App.tsx
const { data, loading, error } = useLeaderboard({ 
  refreshInterval: 30000 // 30 seconds
});
```

### Filtering & Sorting
- **Filter by class**: All, GT3, GT4, Porsche Cup, Super Production
- **Sort by**: Best Lap, Driver Name, Lap Count
- **Sort direction**: Ascending ↑ / Descending ↓

### Time Formatting
Lap times are displayed as `MM:SS.mmm`:
- Example: `2:23.567` (2 minutes, 23.567 seconds)
