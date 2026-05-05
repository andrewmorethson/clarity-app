// lib/cakto.ts
// Integração com Cakto para gerenciar assinaturas

import axios from 'axios'

const CAKTO_BASE = 'https://api.cakto.com.br/v1'
const CAKTO_API_KEY = process.env.CAKTO_API_KEY!

const cakto = axios.create({
  baseURL: CAKTO_BASE,
  headers: {
    Authorization: `Bearer ${CAKTO_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

// Planos do Clarity mapeados no Cakto
// Configure esses IDs no painel do Cakto e cole aqui
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    caktoProductId: 'COLE_ID_DO_PRODUTO_STARTER_AQUI',
    maxAccounts: 1,
    features: ['dashboard', 'weekly_diagnosis', 'best_hours', 'alerts', 'monetization'],
  },
  pro: {
    name: 'Pro',
    price: 129,
    caktoProductId: 'COLE_ID_DO_PRODUTO_PRO_AQUI',
    maxAccounts: 5,
    features: ['dashboard', 'daily_diagnosis', 'best_hours', 'alerts', 'monetization', 'multi_accounts', 'scheduling', 'reports', 'whatsapp_alerts'],
  },
  agency: {
    name: 'Agency',
    price: 299,
    caktoProductId: 'COLE_ID_DO_PRODUTO_AGENCY_AQUI',
    maxAccounts: 20,
    features: ['dashboard', 'daily_diagnosis', 'best_hours', 'alerts', 'monetization', 'multi_accounts', 'scheduling', 'reports', 'whatsapp_alerts', 'white_label', 'api_export', 'benchmark'],
  },
}

// ---- Verificar assinatura ativa ----
export async function checkSubscription(caktoCustomerId: string) {
  try {
    const res = await cakto.get(`/customers/${caktoCustomerId}/subscriptions`)
    const active = res.data?.subscriptions?.find((s: any) => s.status === 'active')
    return active || null
  } catch (err) {
    console.error('Cakto subscription check error:', err)
    return null
  }
}

// ---- Gerar link de checkout ----
export async function createCheckoutLink(planKey: keyof typeof PLANS, userEmail: string, userId: string) {
  const plan = PLANS[planKey]
  try {
    const res = await cakto.post('/checkout', {
      product_id: plan.caktoProductId,
      customer_email: userEmail,
      metadata: { userId, plan: planKey },
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    })
    return res.data?.checkout_url
  } catch (err) {
    console.error('Cakto checkout error:', err)
    throw new Error('Erro ao gerar link de pagamento')
  }
}

// ---- Webhook do Cakto (confirmar pagamento) ----
export function parseCaktoWebhook(body: any) {
  const event = body?.event
  const metadata = body?.data?.metadata

  if (!event || !metadata) return null

  return {
    event,           // payment.approved | subscription.cancelled | etc
    userId: metadata.userId,
    plan: metadata.plan,
    caktoCustomerId: body?.data?.customer?.id,
  }
}

// ---- Verificar se feature está disponível no plano ----
export function hasFeature(userPlan: string, feature: string): boolean {
  const plan = PLANS[userPlan as keyof typeof PLANS]
  if (!plan) return false
  return plan.features.includes(feature)
}

// ---- Verificar limite de contas ----
export function getMaxAccounts(userPlan: string): number {
  const plan = PLANS[userPlan as keyof typeof PLANS]
  return plan?.maxAccounts || 1
}
