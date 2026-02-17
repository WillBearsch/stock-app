# Stock App

Responsive market dashboard built with React + Recharts.

## Features

- Fast symbol search with debounced API requests.
- Near-real-time quote refresh (15-second polling).
- Dynamic historical trend chart across multiple ranges.
- Watchlist with quick symbol switching.
- Route-based page transitions with lazy-loaded route chunks.
- Adaptive layout with dark/light mode and reduced-motion-safe animation.
- Skeleton loading states and optimistic watchlist updates.
- Virtualized watchlist route for large datasets.
- Graceful fallback to mock data if the API fails.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add API keys in `.env`:

```env
REACT_APP_FINNHUB_API_KEY=your_key_here
REACT_APP_ALPHA_VANTAGE_API_KEY=your_key_here
```

3. Start development server:

```bash
npm start
```

## Scripts

- `npm start`: run dev server.
- `npm test`: run tests.
- `npm run build`: production build.
