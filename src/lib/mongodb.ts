import dns from 'node:dns';
import { Resolver } from 'node:dns/promises';
import mongoose from 'mongoose';

const FALLBACK_DNS = ['8.8.8.8', '1.1.1.1'];
const mongoDnsResolver = new Resolver();

/**
 * `mongodb+srv://` resolves Atlas via DNS SRV. On some Windows setups the system
 * resolver refuses Node's queries (querySrv ECONNREFUSED). Prefer explicit or
 * public DNS first; override entirely with `MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1`.
 */
function getMongoDnsServers(): string[] | null {
  const mongodbDnsServers = process.env.MONGODB_DNS_SERVERS?.trim();
  if (mongodbDnsServers) {
    return mongodbDnsServers.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (process.platform === 'win32') {
    return FALLBACK_DNS;
  }
  return null;
}

/** Windows SRV 우회 + mongoose 내부 querySrv 실패 방지용 전용 리졸버 */
export function configureMongoDns(): void {
  const servers = getMongoDnsServers();
  if (servers?.length) {
    mongoDnsResolver.setServers(servers);
    /** mongoose가 srv URI로 자체 SRV 조회할 때를 대비 (표준 URI 변환 시에는 거의 미사용) */
    dns.setServers(servers);
  }
}

configureMongoDns();

interface ParsedSrvUri {
  auth: string;
  hostname: string;
  pathAndQuery: string;
}

function parseMongoSrvUri(uri: string): ParsedSrvUri | null {
  if (!uri.startsWith('mongodb+srv://')) return null;

  const rest = uri.slice('mongodb+srv://'.length);
  const atIdx = rest.indexOf('@');
  let auth = '';
  let hostPart: string;

  if (atIdx !== -1) {
    auth = rest.slice(0, atIdx + 1);
    hostPart = rest.slice(atIdx + 1);
  } else {
    hostPart = rest;
  }

  const slashIdx = hostPart.indexOf('/');
  const qIdx = hostPart.indexOf('?');

  let hostname: string;
  let pathAndQuery = '';

  if (slashIdx !== -1) {
    hostname = hostPart.slice(0, slashIdx);
    pathAndQuery = hostPart.slice(slashIdx);
  } else if (qIdx !== -1) {
    hostname = hostPart.slice(0, qIdx);
    pathAndQuery = hostPart.slice(qIdx);
  } else {
    hostname = hostPart;
  }

  return { auth, hostname, pathAndQuery };
}

function buildPathAndSearch(
  pathAndQuery: string,
  txtOptions: string
): { path: string; search: string } {
  let path = '';
  let existingQuery = '';

  if (pathAndQuery.startsWith('/')) {
    const qIdx = pathAndQuery.indexOf('?');
    if (qIdx === -1) {
      path = pathAndQuery;
    } else {
      path = pathAndQuery.slice(0, qIdx);
      existingQuery = pathAndQuery.slice(qIdx + 1);
    }
  } else if (pathAndQuery.startsWith('?')) {
    existingQuery = pathAndQuery.slice(1);
  }

  const params = new URLSearchParams(existingQuery);
  if (txtOptions) {
    new URLSearchParams(txtOptions).forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }
  if (!params.has('ssl')) {
    params.set('ssl', 'true');
  }

  const search = params.toString();
  return { path, search: search ? `?${search}` : '' };
}

/**
 * Windows 등에서 mongoose가 내부 SRV 조회에 실패할 때, Node dns로 SRV/TXT를
 * 해석해 `mongodb://` 표준 URI로 바꿉니다. 드라이버의 querySrv를 우회합니다.
 */
async function resolveMongoSrvUri(srvUri: string): Promise<string> {
  if (!srvUri.startsWith('mongodb+srv://')) {
    return srvUri;
  }

  const parsed = parseMongoSrvUri(srvUri);
  if (!parsed) {
    return srvUri;
  }

  configureMongoDns();

  const srvHost = `_mongodb._tcp.${parsed.hostname}`;
  const [srvRecords, txtRecords] = await Promise.all([
    mongoDnsResolver.resolveSrv(srvHost),
    mongoDnsResolver.resolveTxt(srvHost).catch(() => [] as string[][])
  ]);

  const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(',');
  const txtOptions = txtRecords.map((chunks) => chunks.join('')).join('&');
  const { path, search } = buildPathAndSearch(parsed.pathAndQuery, txtOptions);

  return `mongodb://${parsed.auth}${hosts}${path}${search}`;
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
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      'MONGODB_URI가 없습니다. .env.local(로컬) 또는 Vercel 환경 변수에 연결 문자열을 넣어 주세요.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    configureMongoDns();
    const resolvedUri = await resolveMongoSrvUri(uri);
    const dbName = resolveDbName(uri);
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15_000,
      maxPoolSize: 10,
      /** Windows·일부 네트워크에서 IPv6 SRV 경로가 막혀 Atlas 접속이 안 될 때 IPv4 우선 */
      family: 4,
      ...(dbName ? { dbName } : {})
    };

    cached.promise = mongoose.connect(resolvedUri, opts).then((m) => m);
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
