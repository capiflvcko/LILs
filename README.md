# Sound World - Music Marketplace

A 3D audio experience game where AI-generated music translates into real earnings through an in-game economy.

## Features

- 3D world exploration with physics
- AI-generated music streaming
- Music marketplace with token-based economy
- Real-time earnings from song plays
- Interactive UI for marketplace management

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm run server
   ```

3. In a new terminal, start the client:
   ```bash
   npm run dev
   ```

4. Open your browser to http://localhost:5173

## Music Marketplace

The music marketplace allows players to earn tokens from their AI-generated songs:

- Each play of a song generates 1 token for the creator
- Tokens can be viewed in the marketplace UI (press 'M' to toggle)
- Song statistics show play counts and earnings
- Press 'P' to play a sample AI-generated song

## API Endpoints

- `GET /api/songs` - List all songs
- `GET /api/users/:userId` - Get user information
- `GET /api/users/:userId/songs` - Get user's songs

## Technical Implementation

The system uses:
- WebSocket connections for audio streaming
- Express.js for REST API endpoints
- In-memory database for song/user tracking
- Token-based economy system