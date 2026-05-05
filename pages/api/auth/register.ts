import type { NextApiRequest, NextApiResponse } from 'next'
import { hashPassword, validatePasswordStrength } from './[...nextauth]'

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

  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) { await prisma.$disconnect(); return res.status(409).json({ error: 'Este e-mail já está cadastrado' }) }

    // Usar $executeRaw para contornar o tipo gerado desatualizado
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`
    await prisma.$executeRaw`
      INSERT INTO users (id, email, name, password_hash, plan, created_at, updated_at)
      VALUES (${id}, ${email.toLowerCase().trim()}, ${name.trim()}, ${hashPassword(password)}, 'starter', NOW(), NOW())
    `
    await prisma.$disconnect()

    return res.status(201).json({ id, email: email.toLowerCase().trim(), name: name.trim(), plan: 'starter' })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' })
  }
}
