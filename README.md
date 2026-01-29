# AC Live Timing

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![shadcn](https://img.shields.io/badge/shadcn-v3.7-black.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-Orange.svg)

A modern, responsive leaderboard for Assetto Corsa Competizione servers. Built with **React**, **Vite**, **shadcn/ui**, and powered by **Cloudflare Pages Functions**.

It acts as a smart wrapper around the raw Assetto Corsa server API, providing a beautiful, user-friendly interface with advanced features like gap analysis, dynamic filtering, and mobile optimizations.

## ✨ Features

- 🏎️ **Live Timing**: Real-time position, lap times, and sector splits.
- 📊 **Advanced Analytics**:
  - **107% Rule**: Visual indicators (Orange > 105%, Red > 107%) for qualification pace analysis.
  - **Dynamic Gaps**: Calculates time differences relative to the current leader or filters.
  - **Theoretical Best**: Calculates potential best lap times based on sector splits.
- 🎯 **Filtering & Sorting**:
  - Filter by Car Class (GT3, GT4, Porsche Cup, etc.).
  - Sort by Lap Time, Consistency, Driver Name, or Lap Count.
- 📱 **Mobile-First Design**: Responsive card-based UI that adapts to any screen size.
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

To run the full stack (Frontend + API Proxy) locally, use Wrangler. This ensures the `/api` endpoints work correctly by emulating the Cloudflare environment.

```bash
# Start frontend and backend proxy together
npx wrangler pages dev -- npm run dev
```
The application will be available at `http://localhost:8788`.

*Note: Running just `npm run dev` will start the frontend at `http://localhost:5173`, but calls to `/api` will fail unless you have a separate proxy configured.*

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

[MIT](LICENSE)
