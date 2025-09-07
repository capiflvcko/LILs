import { Readable } from 'node:stream';

export async function generateSongStream(prompt: string): Promise<Readable> {
  const data = Buffer.from(`Song for: ${prompt}`);
  const stream = Readable.from([data]);
  return stream;
}
