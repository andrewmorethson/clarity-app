import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  function fillAdmin() {
    setEmail('admin')
    setPassword('teste')
    setError('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Credenciais inválidas. Use admin / teste para acesso demo.')
      setPassword('')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <Head><title>Clarity — Login</title></Head>
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,229,255,0.06) 0%, transparent 70%)',
        padding: '20px',
      }}>
        <div style={{
          width: '100%', maxWidth: '440px',
          background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px', padding: '40px 36px',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '52px', height: '52px', background: '#00e5ff',
              borderRadius: '16px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '24px', margin: '0 auto 12px',
              boxShadow: '0 0 30px rgba(0,229,255,0.35)',
            }}>◈</div>
            <div style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>Clarity</div>
            <div style={{ fontSize: '13px', color: '#8888a0', marginTop: '4px' }}>
              Analytics para criadores TikTok
            </div>
          </div>

          {/* Admin hint */}
          <div style={{
            background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span>🔑</span>
            <div style={{ fontSize: '12px', color: '#8888a0' }}>
              <strong style={{ color: '#00e5ff' }}>Demo:</strong>{' '}
              <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>admin</code>
              {' / '}
              <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>teste</code>
              {' '}
              <span
                onClick={fillAdmin}
                style={{ color: '#00e5ff', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Preencher
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#8888a0', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                E-mail ou usuário
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin"
                required
                style={{
                  width: '100%', background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '11px 14px', fontSize: '14px',
                  color: '#eeeef5', outline: 'none',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#8888a0', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '11px 44px 11px 14px', fontSize: '14px',
                    color: '#eeeef5', outline: 'none',
                  }}
                />
                <span
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '14px' }}
                >
                  {showPwd ? '🙈' : '👁'}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)',
                borderRadius: '8px', padding: '10px 14px', fontSize: '12.5px',
                color: '#ff4d6d', marginBottom: '14px',
              }}>
                ❌ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: '#00e5ff', color: '#08080e',
                border: 'none', borderRadius: '8px', padding: '13px',
                fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all .2s',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
