type MarketplaceSong = {
  id: string;
  title: string;
  playCount: number;
  totalEarnings: number;
};

type MarketplaceUser = {
  tokenBalance: number;
};

export class MarketplaceUI {
  private container!: HTMLDivElement;
  private songList!: HTMLUListElement;
  private userBalance!: HTMLSpanElement;
  private readonly apiBase = `${window.location.protocol}//${window.location.hostname}:3000`;

  constructor(
    private readonly onPlaySong: (songId: string) => Promise<void> | void = () => undefined
  ) {
    this.createUI();
  }

  private createUI(): void {
    this.container = document.createElement('div');
    this.container.id = 'marketplace-ui';
    this.container.style.position = 'absolute';
    this.container.style.top = '20px';
    this.container.style.right = '20px';
    this.container.style.width = '320px';
    this.container.style.background = 'rgba(255, 250, 233, 0.94)';
    this.container.style.border = '3px solid rgba(94, 133, 52, 0.65)';
    this.container.style.boxShadow = '0 18px 40px rgba(53, 77, 29, 0.2)';
    this.container.style.color = '#2f3418';
    this.container.style.padding = '18px';
    this.container.style.borderRadius = '18px';
    this.container.style.fontFamily = '"Trebuchet MS", sans-serif';
    this.container.style.zIndex = '1000';
    this.container.style.backdropFilter = 'blur(10px)';

    this.container.innerHTML = `
      <h2 style="margin:0 0 12px;font-size:24px;">Village Market</h2>
      <div id="user-info" style="margin-bottom:14px;padding:12px 14px;background:rgba(156, 208, 88, 0.22);border-radius:14px;">
        <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;">Artist</div>
        <h3 style="margin:6px 0 4px;font-size:18px;">AI Artist</h3>
        <p style="margin:0;">Token Balance: <span id="token-balance">0</span> leaves</p>
      </div>
      <div id="song-list">
        <h3 style="margin:0 0 10px;font-size:16px;">Featured Tracks</h3>
        <ul id="songs-container" style="list-style:none;padding:0;margin:0;display:grid;gap:10px;"></ul>
      </div>
      <button id="refresh-btn" style="margin-top:14px;width:100%;border:none;border-radius:999px;padding:10px 14px;background:#5d8e33;color:#fffaf0;font-weight:700;cursor:pointer;">Refresh Board</button>
    `;

    document.body.appendChild(this.container);

    this.songList = this.container.querySelector('#songs-container') as HTMLUListElement;
    this.userBalance = this.container.querySelector('#token-balance') as HTMLSpanElement;

    (this.container.querySelector('#refresh-btn') as HTMLButtonElement).addEventListener('click', () => {
      this.refreshData();
    });

    this.refreshData();
  }

  async refreshData(): Promise<void> {
    try {
      const userResponse = await fetch(`${this.apiBase}/api/users/artist1`);
      const user = (await userResponse.json()) as MarketplaceUser;
      this.userBalance.textContent = String(user.tokenBalance);

      const songsResponse = await fetch(`${this.apiBase}/api/songs`);
      const songs = (await songsResponse.json()) as MarketplaceSong[];

      this.renderSongs(songs);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    }
  }

  private renderSongs(songs: MarketplaceSong[]): void {
    this.songList.innerHTML = '';

    songs.forEach(song => {
      const li = document.createElement('li');
      li.style.padding = '12px';
      li.style.background = 'rgba(255, 255, 255, 0.65)';
      li.style.border = '1px solid rgba(88, 127, 47, 0.18)';
      li.style.borderRadius = '14px';

      li.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:start;">
          <div>
            <div style="font-weight:700;font-size:15px;">${song.title}</div>
            <div style="margin-top:6px;font-size:13px;opacity:0.75;">Plays: ${song.playCount}</div>
            <div style="font-size:13px;opacity:0.75;">Earnings: ${song.totalEarnings} leaves</div>
          </div>
          <button class="play-btn" data-song-id="${song.id}" style="border:none;border-radius:999px;padding:8px 12px;background:#ff9d5c;color:#fffaf0;font-weight:700;cursor:pointer;">Play</button>
        </div>
      `;

      this.songList.appendChild(li);
    });

    this.container.querySelectorAll<HTMLButtonElement>('.play-btn').forEach(button => {
      button.addEventListener('click', async e => {
        const songId = (e.currentTarget as HTMLButtonElement).getAttribute('data-song-id');
        if (songId) {
          await this.playSong(songId);
        }
      });
    });
  }

  private async playSong(songId: string): Promise<void> {
    try {
      await this.onPlaySong(songId);
      await this.refreshData();
    } catch (error) {
      console.error(`Unable to play song ${songId}:`, error);
    }
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public toggle(): void {
    if (this.container.style.display === 'none') {
      this.show();
      return;
    }

    this.hide();
  }
}
