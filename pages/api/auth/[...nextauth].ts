import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import crypto from 'crypto'

// ============================================
// SEGURANÇA DE SENHAS
// ============================================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':')
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return hash === verifyHash
  } catch {
    return false
  }
}

export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
  score: number // 0-7
  label: string // Fraca | Média | Forte | Muito forte
} {
  const errors: string[] = []
  let score = 0

  if (password.length < 8) {
    errors.push('Mínimo de 8 caracteres')
  } else {
    score += password.length >= 12 ? 2 : 1
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos uma letra maiúscula (A-Z)')
  } else score += 1

  if (!/[a-z]/.test(password)) {
    errors.push('Pelo menos uma letra minúscula (a-z)')
  } else score += 1

  if (!/[0-9]/.test(password)) {
    errors.push('Pelo menos um número (0-9)')
  } else score += 1

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Pelo menos um símbolo (!@#$%^&*...)')
  } else score += 2

  const common = ['12345678', 'password', 'senha123', 'qwerty', 'abc123']
  if (common.some(c => password.toLowerCase().includes(c))) {
    errors.push('Senha muito comum — escolha algo único')
    score = Math.max(0, score - 2)
  }

  const label =
    score <= 2 ? 'Fraca' :
    score <= 4 ? 'Média' :
    score <= 6 ? 'Forte' : 'Muito forte'

  return { valid: errors.length === 0, errors, score, label }
}

// ============================================
// NEXTAUTH
// ============================================

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',  type: 'email'    },
        password: { label: 'Senha',  type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()

          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          })
          await prisma.$disconnect()

          if (!user || !user.passwordHash) return null

          const valid = verifyPassword(credentials.password, user.passwordHash)
          if (!valid) return null

          return { id: user.id, email: user.email, name: user.name, plan: user.plan }
        } catch (err) {
          console.error('Auth error:', err)
          return null
        }
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

  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
