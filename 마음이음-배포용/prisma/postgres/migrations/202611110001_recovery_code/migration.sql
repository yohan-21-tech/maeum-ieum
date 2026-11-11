-- 비밀번호 복구 코드 해시 (코드 원문은 저장하지 않음)
ALTER TABLE "User" ADD COLUMN "recoveryCodeHash" TEXT;
