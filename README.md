# 🏈 NFL Pick'em League

A sleek, modern web application for tracking NFL pick'em leagues with automatic team record updates.

## Features

- **League Setup**: Configure the number of players (1-32)
- **Team Selection**: Each player selects an NFL team
- **Automatic Updates**: Team records automatically sync from ESPN's free NFL API
- **Live Standings**: Real-time leaderboard showing player rankings based on their selected team's performance
- **Modern UI**: Beautiful, responsive design with smooth animations

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Setup**: Enter the number of players in your league
2. **Team Selection**: Each player selects their NFL team
3. **Standings**: View live standings that automatically update based on each team's record
4. **Refresh**: Click the refresh button to get the latest NFL team records

## API

The app uses ESPN's free public NFL API endpoint to fetch current team standings. If the API is unavailable, it falls back to mock data.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Modern styling
- **ESPN API** - Free NFL data source

## Build for Production

```bash
npm run build
npm start
```

Enjoy your NFL pick'em league! 🏈

