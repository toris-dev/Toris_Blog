import NextAuth, { AuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string
    })
  ],
  pages: {
    signIn: '/signin',
    error: '/signin'
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // toris-dev 계정만 로그인 허용
      if (profile?.login === 'toris-dev') {
        return true;
      }
      // 다른 계정은 거부
      return false;
    },
    async session({ session, token }: any) {
      // 세션에 추가 정보 포함
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.login) {
        session.user.login = token.login;
      }
      return session;
    },
    async jwt({ token, profile }: any) {
      // GitHub 프로필 정보를 토큰에 추가
      if (profile) {
        token.login = profile.login;
      }
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-here',
  debug: process.env.NODE_ENV === 'development'
};

const handler = NextAuth(authOptions as AuthOptions);
export { handler as GET, handler as POST };
