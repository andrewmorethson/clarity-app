import type { NextApiRequest, NextApiResponse } from 'next'
import { hashPassword, validatePasswordStrength } from './[...nextauth]'

const SUPABASE_URL = 'https://okmmmtzaxcmmcvveqzfc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbW1tdHpheGNtbWN2dmVxemZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc1NjUsImV4cCI6MjA5MzU2MzU2NX0.ZGDUCW1HMsX6-fWuwC9XgUCk4m74QKyYTnE0alftS-4'

async function supabase(path: string, options: any = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
    ...options,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, password } = req.body

  if (!name?.trim())  return res.status(400).json({ error: 'Nome é obrigatório' })
  if (!email?.trim()) return res.status(400).json({ error: 'E-mail é obrigatório' })
  if (!password)      return res.status(400).json({ error: 'Senha é obrigatória' })

  const strength = validatePasswordStrength(password)
  if (!strength.valid) return res.status(400).json({ error: 'Senha não atende os requisitos', details: strength.errors })

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'E-mail inválido' })

  const cleanEmail = email.toLowerCase().trim()

  try {
    // Verificar se e-mail já existe
    const check = await supabase(`/users?email=eq.${encodeURIComponent(cleanEmail)}&select=id`)
    if (check.ok && check.data?.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado' })
    }

    // Criar usuário
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const create = await supabase('/users', {
      method: 'POST',
      body: JSON.stringify({
        id,
        email: cleanEmail,
        name: name.trim(),
        password_hash: hashPassword(password),
        plan: 'starter',
      }),
    })

    if (!create.ok) {
      console.error('Supabase create error:', create.data)
      return res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' })
    }

    return res.status(201).json({ id, email: cleanEmail, name: name.trim(), plan: 'starter' })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' })
  }
}
