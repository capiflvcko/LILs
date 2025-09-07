import express from 'express';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { generateSongStream } from './aiSong.js';

const app = express();
const wss = new WebSocketServer({ port: 8081 });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (msg: RawData) => {
    const stream = await generateSongStream(msg.toString());
    stream.on('data', chunk => ws.send(chunk));
    stream.on('end', () => ws.send('END'));
  });
});

app.listen(3000, () => console.log('REST on :3000, WS on :8081'));
