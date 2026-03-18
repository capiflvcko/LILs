export function requestSong(songId: string): Promise<AudioBuffer> {
  return new Promise<AudioBuffer>((resolve, reject) => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:8081`);
    ws.binaryType = 'arraybuffer';
    const chunks: ArrayBuffer[] = [];
    let settled = false;

    const rejectOnce = (error: unknown) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      reject(error instanceof Error ? error : new Error('Audio request failed'));
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };

    const resolveOnce = (buffer: AudioBuffer) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      resolve(buffer);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    const timeout = setTimeout(() => {
      rejectOnce(new Error('WebSocket connection timeout'));
    }, 10000);

    ws.onopen = () => {
      clearTimeout(timeout);
      ws.send(songId);
    };

    ws.onmessage = async e => {
      if (typeof e.data === 'string') {
        if (e.data === 'END') {
          try {
            const blob = new Blob(chunks);
            const arrayBuffer = await blob.arrayBuffer();
            const audioCtx = new AudioContext();
            const buffer = await audioCtx.decodeAudioData(arrayBuffer);
            resolveOnce(buffer);
          } catch (error) {
            rejectOnce(error);
          }
          return;
        }

        rejectOnce(new Error(e.data));
        return;
      }

      try {
        if (e.data instanceof ArrayBuffer) {
          chunks.push(e.data);
        } else {
          chunks.push(await e.data.arrayBuffer());
        }
      } catch (error) {
        rejectOnce(error);
      }
    };

    ws.onerror = () => {
      rejectOnce(new Error('WebSocket error occurred'));
    };

    ws.onclose = () => {
      if (!settled) {
        try {
          rejectOnce(new Error('WebSocket connection closed unexpectedly'));
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Audio connection closed'));
        }
      }
    };
  });
}
