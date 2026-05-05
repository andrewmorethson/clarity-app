import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import crypto from 'crypto'

const SUPABASE_URL = 'https://okmmmtzaxcmmcvveqzfc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbW1tdHpheGNtbWN2dmVxemZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc1NjUsImV4cCI6MjA5MzU2MzU2NX0.ZGDUCW1HMsX6-fWuwC9XgUCk4m74QKyYTnE0alftS-4'

async function supabase(path: string, options: any = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

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
  } catch { return false }
}

export function validatePasswordStrength(password: string) {
  const errors: string[] = []
  let score = 0
  if (password.length < 8) { errors.push('Mínimo de 8 caracteres') } else { score += password.length >= 12 ? 2 : 1 }
  if (!/[A-Z]/.test(password)) { errors.push('Pelo menos uma letra maiúscula (A-Z)') } else score += 1
  if (!/[a-z]/.test(password)) { errors.push('Pelo menos uma letra minúscula (a-z)') } else score += 1
  if (!/[0-9]/.test(password)) { errors.push('Pelo menos um número (0-9)') } else score += 1
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) { errors.push('Pelo menos um símbolo (!@#$%^&*...)') } else score += 2
  const label = score <= 2 ? 'Fraca' : score <= 4 ? 'Média' : score <= 6 ? 'Forte' : 'Muito forte'
  return { valid: errors.length === 0, errors, score, label }
}

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
        const cleanEmail = credentials.email.toLowerCase().trim()

        try {
          // Buscar usuário via Supabase REST API
          const result = await supabase(`/users?email=eq.${encodeURIComponent(cleanEmail)}&select=id,email,name,plan,password_hash`)
          
          if (!result.ok || !result.data?.length) return null
          
          const user = result.data[0]
          if (!user.password_hash) return null
          
          const valid = verifyPassword(credentials.password, user.password_hash)
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
      if (user) { token.id = user.id; token.plan = (user as any).plan }
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
