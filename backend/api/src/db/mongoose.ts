import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let connected = false;

export async function connectMongo() {
  if (connected) return;
  
  if (!uri || !dbName) {
    throw new Error('MONGODB_URI and MONGODB_DB must be defined in environment variables');
  }
  await mongoose.connect(uri, { dbName });
  connected = true;

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to connect to the database');
  }
  await db.collection("episode_metrics")
    .createIndex({ runId: 1, episode: 1 }, { unique: true });
  await db.collection("episode_metrics")
    .createIndex({ runId: 1, ts: 1 });

  console.log("[mongo] connected:", dbName);
}