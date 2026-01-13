// 서버 사이드 전용 유틸리티 (bcrypt 사용)
import bcrypt from 'bcrypt';

// 비밀번호 해싱 (서버 사이드 전용)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// 비밀번호 검증 (서버 사이드 전용)
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
