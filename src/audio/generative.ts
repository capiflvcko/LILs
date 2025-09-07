export function requestSong(prompt: string): Promise<AudioBuffer> {
  return new Promise<AudioBuffer>(resolve => {
    const ws = new WebSocket('ws://localhost:8081');
    const chunks: ArrayBuffer[] = [];
    ws.onopen = () => ws.send(prompt);
    ws.onmessage = async e => {
      if (e.data === 'END') {
        const blob = new Blob(chunks);
        const arrayBuffer = await blob.arrayBuffer();
        const audioCtx = new AudioContext();
        const buffer = await audioCtx.decodeAudioData(arrayBuffer);
        resolve(buffer);
        ws.close();
      } else {
        chunks.push(await e.data.arrayBuffer());
      }
    };
  });
}
