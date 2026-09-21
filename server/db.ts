import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isMongoConnected = false;
let connectionAttempted = false;

export async function connectToDatabase(): Promise<{ isConnected: boolean; error?: string }> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('[Database] MONGODB_URI not set. Using embedded high-performance storage engine.');
    return { isConnected: false };
  }

  if (isMongoConnected && mongoose.connection.readyState === 1) {
    return { isConnected: true };
  }

  connectionAttempted = true;
  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${mongoUri.replace(/:([^:@]{4,})@/, ':****@')}...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    isMongoConnected = true;
    console.log('[Database] ✅ Successfully connected to MongoDB via Mongoose!');
    return { isConnected: true };
  } catch (err: any) {
    isMongoConnected = false;
    console.warn(`[Database] ⚠️ MongoDB connection failed (${err.message}). Seamlessly operating with local JSON persistence engine.`);
    return { isConnected: false, error: err.message };
  }
}

export function isUsingMongo(): boolean {
  return isMongoConnected && mongoose.connection.readyState === 1;
}

// Local persistent JSON storage fallback
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface LocalStorageData {
  urls: any[];
  clicks: any[];
}

export function initLocalFileDb(): LocalStorageData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[Database] Failed to read local db.json:', err);
  }

  const initialData: LocalStorageData = { urls: [], clicks: [] };
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  } catch (err) {
    console.error('[Database] Failed to initialize db.json:', err);
  }
  return initialData;
}

export function saveLocalFileDb(data: LocalStorageData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Database] Failed to write local db.json:', err);
  }
}
