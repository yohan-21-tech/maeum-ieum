// 상시 호스팅(Vercel 등) 빌드 스크립트
// 1) PostgreSQL용 Prisma 클라이언트 생성
// 2) DB 테이블 생성/갱신 (prisma migrate deploy, 여러 번 실행해도 안전)
// 3) 참고 사례 시드(항상) + 공개 데모가 켜져 있으면 데모 계정 (upsert라 중복 생성 없음)
// 4) Next.js 운영 빌드
import { execSync } from 'node:child_process';

const run = (cmd, env = process.env) => { console.log(`\n> ${cmd}`); execSync(cmd, { stdio: 'inherit', env }); };

const pooled = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
if (!pooled) throw new Error('DATABASE_URL이 없습니다. 호스팅 환경 변수에 PostgreSQL 연결 문자열을 추가하세요.');
if (pooled.startsWith('file:')) throw new Error('상시 호스팅에는 SQLite(file:)를 쓸 수 없습니다. PostgreSQL 주소를 넣으세요.');
const key = process.env.DATA_ENCRYPTION_KEY;
if (!key || Buffer.from(key, 'base64').length !== 32) throw new Error('DATA_ENCRYPTION_KEY(base64 32바이트)가 필요합니다.');

// 마이그레이션은 풀러(pgbouncer)가 아닌 직접 연결이 안전하므로, 있으면 그것을 사용
const direct = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL || pooled;
const dbEnv = { ...process.env, DATABASE_URL: direct };
process.env.DATABASE_URL = pooled;

run('npx prisma generate --schema prisma/postgres/schema.prisma');
run('npx prisma migrate deploy --schema prisma/postgres/schema.prisma', dbEnv);

// 참고 사례는 항상 넣고, 데모 계정은 공개 데모가 켜져 있을 때만 만든다 (seed.ts가 판단).
run('node --import tsx prisma/seed.ts', { ...dbEnv, NODE_ENV: 'production' });

run('npx next build');
