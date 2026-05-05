// pages/api/webhooks/cakto.ts
// Recebe notificações do Cakto (pagamento aprovado, cancelado, etc)

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { parseCaktoWebhook } from '../../../lib/cakto'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const parsed = parseCaktoWebhook(req.body)

    if (!parsed || !parsed.userId) {
      return res.status(400).json({ error: 'Payload inválido' })
    }

    const { event, userId, plan, caktoCustomerId } = parsed

    switch (event) {
      // Pagamento aprovado — ativar plano
      case 'payment.approved':
      case 'subscription.activated':
        await prisma.user.update({
          where: { id: userId },
          data: { plan: plan || 'starter', caktoId: caktoCustomerId },
        })
        console.log(`✅ Plano ${plan} ativado para user ${userId}`)
        break

      // Assinatura cancelada — voltar para starter
      case 'subscription.cancelled':
      case 'subscription.expired':
        await prisma.user.update({
          where: { id: userId },
          data: { plan: 'starter' },
        })
        console.log(`⚠️ Plano cancelado para user ${userId}`)
        break

      // Chargeback / reembolso
      case 'payment.refunded':
      case 'payment.chargeback':
        await prisma.user.update({
          where: { id: userId },
          data: { plan: 'starter' },
        })
        console.log(`🚨 Chargeback/refund para user ${userId}`)
        break

      default:
        console.log(`Evento Cakto não tratado: ${event}`)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Cakto webhook error:', err)
    return res.status(500).json({ error: 'Erro interno' })
  }
}
