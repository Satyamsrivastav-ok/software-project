import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// High-reliability Database Engine supporting both MongoDB Mongoose connection and
// persisted local document storage if MongoDB server is offline in sandboxed container.

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function generateObjectId(): string {
  try {
    return new mongoose.Types.ObjectId().toHexString();
  } catch {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
    const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return timestamp + random;
  }
}

export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export interface DatabaseStore {
  users: any[];
  doctorProfiles: any[];
  clinics: any[];
  availabilities: any[];
  appointments: any[];
  prescriptions: any[];
  reviews: any[];
  notifications: any[];
  verificationRequests: any[];
}

const defaultStore: DatabaseStore = {
  users: [],
  doctorProfiles: [],
  clinics: [],
  availabilities: [],
  appointments: [],
  prescriptions: [],
  reviews: [],
  notifications: [],
  verificationRequests: []
};

class LocalDocumentStore {
  private store: DatabaseStore = { ...defaultStore };
  private isConnectedToMongo = false;

  constructor() {
    this.load();
  }

  public async init() {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri && mongoUri.startsWith('mongodb')) {
      try {
        console.log(`[DB] Attempting MongoDB connection to: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
        // Set short timeout so sandbox startup is instant if offline
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        this.isConnectedToMongo = true;
        console.log('[DB] Connected successfully to remote/local MongoDB instance via Mongoose');
      } catch (err: any) {
        console.warn(`[DB] Live MongoDB server unavailable (${err.message || 'offline'}). Running high-performance integrated persistent document engine.`);
        this.isConnectedToMongo = false;
      }
    } else {
      console.log('[DB] Integrated persistent document engine active.');
    }
  }

  public get isMongo(): boolean {
    return this.isConnectedToMongo;
  }

  public load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.store = { ...defaultStore, ...JSON.parse(raw) };
      } else {
        this.store = { ...defaultStore };
        this.save();
      }
    } catch (e) {
      console.error('[DB] Error loading db.json, using clean default store:', e);
      this.store = { ...defaultStore };
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Error saving db.json:', e);
    }
  }

  public getCollection<T = any>(name: keyof DatabaseStore): T[] {
    if (!this.store[name]) {
      this.store[name] = [];
    }
    return this.store[name] as T[];
  }

  public setCollection(name: keyof DatabaseStore, items: any[]) {
    this.store[name] = items;
    this.save();
  }

  public resetToEmpty() {
    this.store = {
      users: [],
      doctorProfiles: [],
      clinics: [],
      availabilities: [],
      appointments: [],
      prescriptions: [],
      reviews: [],
      notifications: [],
      verificationRequests: []
    };
    this.save();
  }
}

export const dbStore = new LocalDocumentStore();
