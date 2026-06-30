# FligFlag

3D geography flag quiz game. Guess country locations on a 3D globe based on flag images.

## Setup

```bash
npm install
```

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run typecheck # Type check without build
npm test          # Run tests
npm run test:watch # Run tests in watch mode
```

## Gameplay

- View a flag and guess which country it belongs to
- Click on the 3D globe to mark your guess
- Score points based on distance accuracy
- Earn time bonuses for faster answers

### Difficulty Modes

- **Easy**: No timer, country name shown
- **Normal**: 30 second countdown
- **Hard**: 10 second countdown, flag hidden after 3 seconds

### Game Modes

- **Country**: Guess the country location
- **Capital**: Guess the capital city location

### Scoring

- Base score: 1000 points for exact location
- Distance decay: Score decreases with distance
- Time bonus: 10% of base score per second remaining (Normal/Hard only)

## Architecture

```
src/
├── app/          # Application controller
├── data/         # Data loading and normalization
├── domain/       # Pure business logic
├── geo/          # Geographic utilities
├── rendering/    # Three.js 3D rendering
└── ui/           # DOM UI components
```

## Data Sources

- Country metadata: [world-countries](https://github.com/mledoze/countries) (ODbL)
- Country boundaries: [geo-countries](https://github.com/datasets/geo-countries) (Natural Earth, Public Domain)
- Flag images: [FlagCDN](https://flagcdn.com/)

## Future Features

- High scores with persistent storage
- Co-op multiplayer mode
- Versus mode
- Extended city database
