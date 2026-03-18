import express from 'express';
import { WebSocketServer } from 'ws';
import type { WebSocket, RawData } from 'ws';
import { generateSongStream } from './aiSong.ts';
import { MarketplaceDB } from './models.ts';

const app = express();
const wss = new WebSocketServer({ port: 8081 });
const db = MarketplaceDB.getInstance();

// Initialize with some sample data
if (!db.getUser('artist1')) {
  const artist = db.createUser('artist1', 'AI Artist');
  const song = db.createSong('song1', 'Sunlit Demo Beat', 'artist1');
  artist.songs.push(song.id);
}

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get('/api/songs', (req, res) => {
  const songs = Array.from(db.songs.values());
  res.json(songs);
});

app.get('/api/users/:userId', (req, res) => {
  const user = db.getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.get('/api/users/:userId/songs', (req, res) => {
  const songs = db.getUserSongs(req.params.userId);
  res.json(songs);
});

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (msg: RawData) => {
    const songId = msg.toString().trim();

    db.incrementPlayCount(songId);

    const song = db.getSong(songId);
    if (!song) {
      ws.send('ERROR: Song not found');
      ws.close();
      return;
    }
    try {
      const stream = await generateSongStream(song.title);
      stream.on('data', chunk => ws.send(chunk));
      stream.on('end', () => ws.send('END'));
      stream.on('error', error => {
        ws.send(`ERROR: ${error instanceof Error ? error.message : 'Song generation failed'}`);
        ws.close();
      });
    } catch (error) {
      ws.send(`ERROR: ${error instanceof Error ? error.message : 'Song generation failed'}`);
      ws.close();
    }
  });
});

app.listen(3000, () => console.log('REST on :3000, WS on :8081'));
