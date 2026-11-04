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
