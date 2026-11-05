# Netlify 배포와 404 해결

## 확인된 원인 (2026-11-04)
strong-moxie-6402ad.netlify.app의 /와 /login은 404이고 /BUILD_ID, /build-manifest.json, /server/app/login.html은 200입니다. .next 빌드 결과가 정적 파일로 게시된 상태이며 Next.js 서버가 배포되지 않았습니다.

.next 폴더를 끌어다 놓거나 index.html을 추가하는 방식으로 로그인/API를 복구할 수 없습니다. 기존 공개 배포에 서버 빌드 파일이 노출되어 있으므로 Netlify에서 배포를 중단하거나 올바른 배포로 교체하세요.

## 권장 배포 방법
1. 이 프로젝트 폴더 전체를 GitHub 저장소에 올립니다. package.json과 netlify.toml이 저장소 최상위에 있어야 합니다. .env, DB, node_modules, .next는 올리지 않습니다.
2. Netlify에서 해당 저장소를 연결합니다. 프로젝트가 하위 폴더에 있다면 Base directory를 package.json이 있는 폴더로 지정합니다.
3. 빌드 명령은 npm run build:postgres, 게시 디렉터리는 .next입니다. netlify.toml에 설정했습니다. Next.js 어댑터는 Netlify가 자동 적용합니다. .next를 수동 업로드한다는 뜻이 아닙니다.
4. PostgreSQL 데이터베이스를 준비하고 아래 환경 변수를 Netlify에 설정합니다. DATABASE_URL과 DATA_ENCRYPTION_KEY는 채팅이나 Git에 넣지 않습니다.

DATABASE_URL: 외부 PostgreSQL 연결 문자열 (file:./dev.db 사용 불가)
DATA_ENCRYPTION_KEY: base64로 인코딩한 32바이트 키, 변경하면 기존 암호화 데이터 복구 불가
APP_ORIGIN: https://strong-moxie-6402ad.netlify.app (다른 사이트라면 해당 주소)
ENABLE_DEMO: 0 (가상 공개 체험만 운영할 때 1)
ALLOW_PUBLIC_DEMO: 0 (가상 공개 체험을 명시적으로 허용할 때만 1)
OPENAI_API_KEY: 선택, 없으면 규칙 기반 데모 모드

5. 관리하는 로컬 터미널의 DATABASE_URL을 같은 PostgreSQL DB로 지정한 뒤 npm run db:postgres:deploy를 실행해 초기 테이블을 만듭니다. 실제 연결 문자열은 채팅에 보내지 마세요.
6. Netlify에서 배포합니다. 빌드 로그에 Next.js 어댑터와 서버 함수 생성이 표시되는지 확인합니다.
7. /login 화면과 실제 로그인/API 응답을 확인합니다. 새 DB에는 데모 사용자가 자동 생성되지 않습니다. 가상 데이터가 필요하면 먼저 npx prisma generate --schema prisma/postgres/schema.prisma를 실행한 뒤 같은 DB와 암호화 키를 지정해 npm run db:seed를 실행합니다. 기존 로컬 SQLite 개발로 돌아갈 때는 npx prisma generate로 클라이언트를 복원합니다.

현재 준비한 것은 배포 설정입니다. 호스팅 계정과 PostgreSQL 연결 및 실제 Netlify 재배포 검증은 아직 완료하지 않았습니다.

공식 문서: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/

## Netlify 관리형 DB 연결 준비 (2026-11-05)

현재 배포 설정의 Base directory는 마음이음-배포용입니다. 기존 폴더 이름을 바꾸는 PR #1은 이 작업과 중복되므로 그대로 병합하지 마세요.

Netlify Database를 생성했고, @netlify/database의 getConnectionString()으로 해당 배포의 DB 분기를 선택하도록 연결했습니다. Netlify 환경에서는 lib/database-config.ts가 관리형 연결을 사용하며 로컬에서는 기존 DATABASE_URL을 사용합니다.

netlify/database/migrations/0001_initial.sql은 Netlify가 게시 직전에 자동 적용합니다. 이 배포에는 prisma migrate deploy를 중복 실행하지 마세요. 기존 PostgreSQL용 Prisma 마이그레이션과 동일한 초기 스키마입니다.

남은 작업: GitHub 인증과 코드 업로드, Netlify 환경 변수 및 비밀키 설정, 새 DB 가상 데이터 초기화, 실제 배포·로그인·데이터 유지 확인. 로컬 SQLite DB는 업로드하지 않습니다.

무료 한도만 사용하며 요금제 업그레이드나 크레딧 추가 결제는 하지 않습니다. 무료 한도 소진 시 접속이 중지될 수 있습니다. DB의 5분 비활성 절전은 첫 요청 지연이 있을 수 있지만 사용자 PC 실행과 무관합니다.

검증: 단위 테스트 46개 통과. PostgreSQL 대상 운영 빌드 및 형식 검사 통과. 실제 Netlify DB 연결은 아직 검증 전입니다.
