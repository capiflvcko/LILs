export interface Song {
  id: string;
  title: string;
  artistId: string;
  playCount: number;
  totalEarnings: number; // in tokens
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  tokenBalance: number;
  songs: string[]; // song IDs
  createdAt: Date;
}

// In-memory storage for our marketplace
export class MarketplaceDB {
  private static instance: MarketplaceDB;
  songs: Map<string, Song> = new Map();
  users: Map<string, User> = new Map();

  private constructor() {}

  static getInstance(): MarketplaceDB {
    if (!MarketplaceDB.instance) {
      MarketplaceDB.instance = new MarketplaceDB();
    }
    return MarketplaceDB.instance;
  }

  // Create a new song
  createSong(id: string, title: string, artistId: string): Song {
    const song: Song = {
      id,
      title,
      artistId,
      playCount: 0,
      totalEarnings: 0,
      createdAt: new Date()
    };
    this.songs.set(id, song);
    return song;
  }

  // Get a song by ID
  getSong(id: string): Song | undefined {
    return this.songs.get(id);
  }

  // Increment play count and distribute tokens
  incrementPlayCount(songId: string): void {
    const song = this.songs.get(songId);
    if (song) {
      song.playCount++;
      // Distribute tokens (1 token per play for now)
      this.distributeTokens(songId, 1);
    }
  }

  // Distribute tokens to artist
  private distributeTokens(songId: string, amount: number): void {
    const song = this.songs.get(songId);
    if (song) {
      song.totalEarnings += amount;
      const user = this.users.get(song.artistId);
      if (user) {
        user.tokenBalance += amount;
      }
    }
  }

  // Create a new user
  createUser(id: string, username: string): User {
    const user: User = {
      id,
      username,
      tokenBalance: 0,
      songs: [],
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Get user by ID
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  // Get user's songs
  getUserSongs(userId: string): Song[] {
    const user = this.users.get(userId);
    if (!user) return [];
    return user.songs.map(songId => this.songs.get(songId)).filter(Boolean) as Song[];
  }
}