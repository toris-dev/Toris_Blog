import dns from 'node:dns';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * `mongodb+srv://` resolves Atlas via DNS SRV. On some Windows setups the system
 * resolver refuses Node's queries (querySrv ECONNREFUSED). Prefer explicit or
 * public DNS first; override entirely with `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1`.
 */
const mongodbDnsServers = process.env.MONGODB_DNS_SERVERS?.trim();
if (mongodbDnsServers) {
  dns.setServers(mongodbDnsServers.split(',').map((s) => s.trim()).filter(Boolean));
} else if (
  MONGODB_URI?.startsWith('mongodb+srv://') &&
  process.platform === 'win32'
) {
  const fallback = ['8.8.8.8', '1.1.1.1'];
  dns.setServers([
    ...fallback,
    ...dns.getServers().filter((s) => !fallback.includes(s))
  ]);
}

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

