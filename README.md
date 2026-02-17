# FFC Launch - Game Lobby & Arena

> Web3 PvP Gaming Platform - Create games, join battles, win crypto!

## Tech Stack

- **Framework:** React + Vite
- **Styling:** Tailwind CSS + shadcn-style components
- **Animations:** Framer Motion + anime.js
- **Real-time:** Socket.io
- **Web3:** ethers.js v5
- **Deployment:** Cloudflare Pages

## Features

- 🎮 Game Lobby - Browse and join waiting games
- ⚡ Real-time updates via WebSocket
- 💰 Crypto betting with MetaMask
- 🎨 Smooth animations and neon aesthetics
- 📱 Responsive design

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

## Deployment

Automatic deployment to Cloudflare Pages on push to `main`.

Required secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_API_URL`

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── GameCard.jsx  # Game lobby card
│   └── CreateGameModal.jsx
├── context/
│   ├── Web3Context.jsx
│   └── SocketContext.jsx
├── hooks/
│   └── useAuth.js
├── pages/
│   └── Lobby.jsx     # Main lobby page
├── services/
│   └── api.js        # API client
└── lib/
    └── utils.js      # Utility functions
```

## License

MIT
