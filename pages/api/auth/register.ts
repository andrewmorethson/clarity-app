// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { hashPassword, validatePasswordStrength } from './[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, password } = req.body

  // Validações básicas
  if (!name?.trim())  return res.status(400).json({ error: 'Nome é obrigatório' })
  if (!email?.trim()) return res.status(400).json({ error: 'E-mail é obrigatório' })
  if (!password)      return res.status(400).json({ error: 'Senha é obrigatória' })

  // Validar força da senha
  const strength = validatePasswordStrength(password)
  if (!strength.valid) {
    return res.status(400).json({
      error: 'Senha não atende os requisitos de segurança',
      details: strength.errors,
    })
  }

  // Validar formato do e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido' })
  }

  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    // Verificar se e-mail já existe
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      await prisma.$disconnect()
      return res.status(409).json({ error: 'Este e-mail já está cadastrado' })
    }

    // Criar usuário com senha hasheada
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash: hashPassword(password),
        plan: 'starter',
      },
    })

    await prisma.$disconnect()

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' })
  }
}
