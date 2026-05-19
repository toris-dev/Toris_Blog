/**
 * MongoDB 연결 스모크 테스트 (MongoDB 플러그인/MCP 없이 로컬에서 실행)
 * 사용: node scripts/mongo-ping.cjs
 * URI는 출력하지 않습니다.
 */
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');

const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('mongo-ping: .env.local 없음');
  process.exit(1);
}

let uri = '';
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  if (line.startsWith('MONGODB_URI=')) {
    uri = line.slice('MONGODB_URI='.length).trim();
    break;
  }
}

if (!uri) {
  console.error('mongo-ping: MONGODB_URI 없음');
  process.exit(1);
}

if (uri.startsWith('mongodb+srv://') && process.platform === 'win32') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

function resolveDbName(u) {
  const fromEnv = process.env.MONGODB_DB_NAME?.trim();
  if (fromEnv) return fromEnv;
  const emptyPathAfterHost =
    /@[^/?]+\/\?/i.test(u) ||
    /\.mongodb\.net\/\?/i.test(u) ||
    /\.mongodb\.net\/$/i.test(u);
  if (emptyPathAfterHost) return 'torisblog';
  return undefined;
}

const dbName = resolveDbName(uri);

mongoose
  .connect(uri, {
    ...(dbName ? { dbName } : {}),
    serverSelectionTimeoutMS: 15_000,
    maxPoolSize: 5,
    family: 4
  })
  .then(() => {
    console.log(
      'mongo-ping: 연결 성공',
      dbName ? `(dbName=${dbName})` : '(URI 경로의 DB 사용)'
    );
    return mongoose.disconnect();
  })
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('mongo-ping: 연결 실패');
    console.error(e.name + ':', e.message);
    process.exit(1);
  });
