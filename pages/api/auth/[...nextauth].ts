// pages/api/auth/[...nextauth].ts
import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Admin de teste
        if (
          (credentials.email === 'admin' || credentials.email === 'admin@clarity.app') &&
          credentials.password === 'teste'
        ) {
          // Garantir que o admin existe no banco
          const admin = await prisma.user.upsert({
            where: { email: 'admin@clarity.app' },
            update: {},
            create: {
              email: 'admin@clarity.app',
              name: 'Admin Clarity',
              plan: 'agency',
            },
          })
          return { id: admin.id, email: admin.email, name: admin.name, plan: admin.plan }
        }

        // Buscar usuário real no banco
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        // Em produção: comparar hash da senha
        // Por ora retorna o usuário se existir
        return { id: user.id, email: user.email, name: user.name, plan: user.plan }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.plan = (user as any).plan
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id
        ;(session.user as any).plan = token.plan
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
