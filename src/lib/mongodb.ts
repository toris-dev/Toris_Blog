import dns from 'node:dns';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI?.trim();

/**
 * `mongodb+srv://` resolves Atlas via DNS SRV. On some Windows setups the system
 * resolver refuses Node's queries (querySrv ECONNREFUSED). Prefer explicit or
 * public DNS first; override entirely with `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1`.
 */
const mongodbDnsServers = process.env.MONGODB_DNS_SERVERS?.trim();
if (mongodbDnsServers) {
  dns.setServers(
    mongodbDnsServers.split(',').map((s) => s.trim()).filter(Boolean)
  );
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

/**
 * Atlas/Vercel 템플릿 URI는 `...mongodb.net/?retryWrites=...` 처럼 DB 경로가 비어
 * 있는 경우가 많습니다. 이 때 기본 DB는 드라이버에 따라 `test` 등으로 잡혀
 * 데이터가 "없는 것처럼" 보이거나 권한 오류가 날 수 있습니다.
 * - URI에 `/dbname`을 넣거나
 * - `MONGODB_DB_NAME`(선택)으로 명시하세요.
 */
function resolveDbName(uri: string): string | undefined {
  const fromEnv = process.env.MONGODB_DB_NAME?.trim();
  if (fromEnv) return fromEnv;

  const emptyPathAfterHost =
    /@[^/?]+\/\?/i.test(uri) ||
    /\.mongodb\.net\/\?/i.test(uri) ||
    /\.mongodb\.net\/$/i.test(uri);

  if (emptyPathAfterHost) {
    return 'torisblog';
  }

  return undefined;
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
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI가 없습니다. .env.local(로컬) 또는 Vercel 환경 변수에 연결 문자열을 넣어 주세요.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const dbName = resolveDbName(MONGODB_URI);
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15_000,
      maxPoolSize: 10,
      /** Windows·일부 네트워크에서 IPv6 SRV 경로가 막혀 Atlas 접속이 안 될 때 IPv4 우선 */
      family: 4,
      ...(dbName ? { dbName } : {})
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
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
