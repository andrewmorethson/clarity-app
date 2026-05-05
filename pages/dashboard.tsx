import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#08080e', color: '#00e5ff', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #00e5ff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px', color: '#8888a0' }}>Carregando Clarity...</span>
      </div>
    )
  }

  if (!session) return null

  // Injeta o usuário logado no iframe via postMessage
  return (
    <>
      <Head>
        <title>Clarity — Dashboard</title>
      </Head>
      <div style={{ position: 'relative', minHeight: '100vh', background: '#08080e' }}>
        {/* Barra de sessão */}
        <div style={{
          position: 'fixed', top: 0, right: 0, zIndex: 9999,
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '12px', color: '#5a5a72' }}>
            {session.user?.email}
            {' · '}
            <span style={{ color: '#c77dff', textTransform: 'capitalize' }}>
              {(session.user as any)?.plan || 'starter'}
            </span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)',
              color: '#ff4d6d', borderRadius: '6px', padding: '4px 10px',
              fontSize: '11px', cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>

        {/* PRV embed — carrega o HTML do app completo */}
        <iframe
          src="/app.html"
          style={{ width: '100%', height: '100vh', border: 'none' }}
          title="Clarity App"
        />
      </div>
    </>
  )
}

export async function getServerSideProps(context: any) {
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('./api/auth/[...nextauth]')

  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  return { props: { session } }
}
