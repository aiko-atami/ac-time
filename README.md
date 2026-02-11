# AC Live Timing

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![shadcn](https://img.shields.io/badge/shadcn-v3.7-black.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-Orange.svg)

A modern, responsive leaderboard for Assetto Corsa servers. Built with **React**, **Vite**, **shadcn/ui**, and powered by **Cloudflare Pages Functions**.

It acts as a smart wrapper around the raw Assetto Corsa server API, providing a clean, user-friendly interface for live timing.

## ✨ Features

- 🏎️ **Live Timing**: Real-time position, lap times, and sector splits.
- 📊 **Advanced Analytics**:
  - **107% Rule**: Visual indicators (Orange > 105%, Red > 107%) for qualification pace analysis.
  - **Theoretical Best**: Calculates potential best lap times based on sector splits.
- 🎯 **Sorting**:
  - Sort by Lap Time, Consistency, Driver Name, or Lap Count.
- 🏰 **Cloudflare Integration**: Serverless API via Cloudflare Functions to handle CORS and data transformation securely.
- 🎨 **Modern API**: shadcn/ui components with a clean, professional aesthetic.

## 🎯 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Cloudflare Pages Functions (Serverless)
- **State/Hooks**: Custom hooks for polling and data processing (`useLeaderboard`)
- **Icons**: Tabler Icons

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ac-time
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   # The URL of your raw Assetto Corsa server JSON output
   API_URL=http://your-server-ip:port/results.json

   # Optional: Basic Auth if your server requires it
   BASIC_AUTH_USER=username
   BASIC_AUTH_PASS=password
   ```

### Running Locally

There are two development modes:

#### 1. Full Stack (Frontend + API)

Build the project and run with Wrangler to test Cloudflare Functions locally:

```bash
npm run dev:api
```

This runs `npm run build` followed by `npx wrangler pages dev ./dist`. The application will be available at `http://localhost:8788`.

#### 2. Frontend Only (Fast Mode)

For rapid UI development without the API:

```bash
npm run dev
```

This starts Vite dev server at `http://localhost:5173` with hot reload. API calls will fail unless you enable mock data via `VITE_USE_MOCK_DATA=true` in `.env`.

> ⚠️ **Note**: The deprecated `npx wrangler pages dev -- npm run dev` proxy mode causes `Cannot assign requested address` errors due to port exhaustion. Always use `dev:api` for full stack development.

### Building for Production

```bash
npm run build
```

## 📁 Project Structure

```
.
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       └── leaderboard.ts  # Backend logic: fetching, auth, and transformation
├── src/
│   ├── lib/
│   │   ├── api.ts          # Frontend API client
│   │   ├── transform.ts    # Shared data transformation types/constants
│   │   └── types.ts        # TypeScript definitions
│   ├── hooks/              # React hooks (useLeaderboard, etc.)
│   ├── components/         # UI Components (LeaderboardCard, Badges, etc.)
│   └── App.tsx             # Main application entry
├── .env                    # Local environment variables
└── vite.config.ts          # Vite configuration
```

## 🔌 API Architecture

The application uses **Cloudflare Pages Functions** to bridge the gap between the secure HTTPS frontend and the (often HTTP) game server.

1. **Client**: Requests `/api/leaderboard`
2. **Function** (`functions/api/leaderboard.ts`):
   - Fetches raw JSON from the `API_URL` defined in env vars.
   - Handles Basic Auth if configured.
   - Transforms raw data (calculates gaps, detects classes, formats times).
   - Returns a clean, CORS-friendly JSON response to the Client.

## 📜 License

[GPL-3.0](LICENSE)
