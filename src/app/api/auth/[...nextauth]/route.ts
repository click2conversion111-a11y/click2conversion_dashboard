import NextAuth from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    FacebookProvider({
      clientId: process.env.META_CLIENT_ID || process.env.NEXT_PUBLIC_META_APP_ID || '',
      clientSecret: process.env.META_CLIENT_SECRET || process.env.META_APP_SECRET || '',
      // Requesting Marketing API scopes
      authorization: {
        params: {
          scope: 'email,public_profile,ads_read,ads_management,read_insights,business_management'
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/adwords',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token and or response to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }: any) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.provider = token.provider
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev-only'
})

export { handler as GET, handler as POST }
