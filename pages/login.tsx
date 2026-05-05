import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ---- Validação de senha (espelho do backend) ----
function checkPassword(password: string) {
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    symbol:    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  const label = score <= 2 ? 'Fraca' : score <= 3 ? 'Média' : score === 4 ? 'Forte' : 'Muito forte'
  const color = score <= 2 ? '#ff4d6d' : score <= 3 ? '#ffd166' : score === 4 ? '#06d6a0' : '#00e5ff'
  const valid = Object.values(checks).every(Boolean)
  return { checks, score, label, color, valid }
}

export default function LoginPage() {
  const router  = useRouter()
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)

  const pwd = checkPassword(password)

  // ---- LOGIN ----
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('E-mail ou senha incorretos.')
    } else {
      router.push('/dashboard')
    }
  }

  // ---- CADASTRO ----
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!pwd.valid) return setError('Sua senha não atende todos os requisitos.')
    if (password !== confirm) return setError('As senhas não coincidem.')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta.')
      } else {
        setSuccess('Conta criada! Fazendo login...')
        await signIn('credentials', { email, password, redirect: false })
        router.push('/dashboard')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    }
    setLoading(false)
  }

  const s: Record<string, React.CSSProperties> = {
    wrap: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#08080e',
      backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 70%)',
      padding: '24px',
    },
    card: {
      width: '100%', maxWidth: '460px',
      background: '#0f0f18', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px', padding: '40px 36px',
    },
    logo: { textAlign: 'center', marginBottom: '32px' },
    mark: {
      width: '52px', height: '52px', background: '#00e5ff',
      borderRadius: '16px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px',
      boxShadow: '0 0 28px rgba(0,229,255,0.35)',
    },
    name: { fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px', color: '#eeeef5' },
    sub:  { fontSize: '13px', color: '#8888a0', marginTop: '4px' },
    tabs: {
      display: 'flex', background: '#14141f',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px', padding: '4px', gap: '4px', marginBottom: '28px',
    },
    tab: (active: boolean): React.CSSProperties => ({
      flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
      background: active ? '#1e1e2e' : 'none',
      color: active ? '#eeeef5' : '#8888a0',
      fontWeight: active ? 600 : 400, fontSize: '13.5px',
      cursor: 'pointer', transition: 'all .2s',
      fontFamily: 'system-ui, sans-serif',
      boxShadow: active ? '0 1px 4px rgba(0,0,0,.3)' : 'none',
    }),
    label: { fontSize: '12px', color: '#8888a0', fontWeight: 600, display: 'block', marginBottom: '6px' },
    inputWrap: { position: 'relative', marginBottom: '14px' },
    input: {
      width: '100%', background: '#14141f',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '10px', padding: '11px 14px', fontSize: '14px',
      color: '#eeeef5', outline: 'none', fontFamily: 'system-ui, sans-serif',
      boxSizing: 'border-box',
    },
    eye: {
      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
      cursor: 'pointer', fontSize: '14px', color: '#5a5a72',
    },
    error: {
      background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px',
      color: '#ff4d6d', marginBottom: '14px', lineHeight: '1.5',
    },
    success: {
      background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px',
      color: '#06d6a0', marginBottom: '14px',
    },
    btn: {
      width: '100%', background: '#00e5ff', color: '#08080e',
      border: 'none', borderRadius: '10px', padding: '13px',
      fontSize: '14px', fontWeight: 700, cursor: 'pointer',
      marginTop: '6px', fontFamily: 'system-ui, sans-serif',
      transition: 'all .2s',
      opacity: loading ? 0.7 : 1,
    },
  }

  return (
    <>
      <Head><title>Clarity — {mode === 'login' ? 'Entrar' : 'Criar conta'}</title></Head>
      <div style={s.wrap}>
        <div style={s.card}>

          {/* Logo */}
          <div style={s.logo}>
            <div style={s.mark}>◈</div>
            <div style={s.name}>Clarity</div>
            <div style={s.sub}>Analytics para criadores TikTok</div>
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            <button style={s.tab(mode === 'login')}    onClick={() => { setMode('login');    setError(''); setSuccess('') }}>Entrar</button>
            <button style={s.tab(mode === 'register')} onClick={() => { setMode('register'); setError(''); setSuccess('') }}>Criar conta</button>
          </div>

          {/* ---- FORM LOGIN ---- */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={s.inputWrap}>
                <label style={s.label}>E-mail</label>
                <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
              </div>
              <div style={s.inputWrap}>
                <label style={s.label}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...s.input, paddingRight: '44px' }} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                  <span style={s.eye} onClick={() => setShowPwd(!showPwd)}>{showPwd ? '🙈' : '👁'}</span>
                </div>
              </div>
              {error   && <div style={s.error}>❌ {error}</div>}
              {success && <div style={s.success}>✅ {success}</div>}
              <button type="submit" style={s.btn} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar →'}
              </button>
            </form>
          )}

          {/* ---- FORM CADASTRO ---- */}
          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={s.inputWrap}>
                <label style={s.label}>Nome completo</label>
                <input style={s.input} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required />
              </div>
              <div style={s.inputWrap}>
                <label style={s.label}>E-mail</label>
                <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={s.label}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...s.input, paddingRight: '44px' }} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
                  <span style={s.eye} onClick={() => setShowPwd(!showPwd)}>{showPwd ? '🙈' : '👁'}</span>
                </div>

                {/* Barra de força */}
                {password.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '4px', borderRadius: '2px',
                          background: i <= pwd.score ? pwd.color : 'rgba(255,255,255,0.08)',
                          transition: 'background .3s',
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '11.5px', color: pwd.color, fontWeight: 600, marginBottom: '8px' }}>
                      Senha {pwd.label}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[
                        { key: 'length',    label: 'Mínimo 8 caracteres' },
                        { key: 'uppercase', label: 'Letra maiúscula (A-Z)' },
                        { key: 'lowercase', label: 'Letra minúscula (a-z)' },
                        { key: 'number',    label: 'Número (0-9)' },
                        { key: 'symbol',    label: 'Símbolo (!@#$%...)' },
                      ].map(({ key, label }) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                          <span style={{ color: pwd.checks[key as keyof typeof pwd.checks] ? '#06d6a0' : '#5a5a72', fontSize: '11px' }}>
                            {pwd.checks[key as keyof typeof pwd.checks] ? '✓' : '○'}
                          </span>
                          <span style={{ color: pwd.checks[key as keyof typeof pwd.checks] ? '#8888a0' : '#5a5a72' }}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={s.inputWrap}>
                <label style={s.label}>Confirmar senha</label>
                <input
                  style={{
                    ...s.input,
                    borderColor: confirm && confirm !== password ? 'rgba(255,77,109,0.4)' : confirm && confirm === password ? 'rgba(6,214,160,0.4)' : undefined
                  }}
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  required
                />
                {confirm && confirm !== password && (
                  <div style={{ fontSize: '11.5px', color: '#ff4d6d', marginTop: '4px' }}>As senhas não coincidem</div>
                )}
                {confirm && confirm === password && (
                  <div style={{ fontSize: '11.5px', color: '#06d6a0', marginTop: '4px' }}>✓ Senhas coincidem</div>
                )}
              </div>

              {error   && <div style={s.error}>❌ {error}</div>}
              {success && <div style={s.success}>✅ {success}</div>}

              <button
                type="submit"
                style={{ ...s.btn, opacity: (loading || !pwd.valid || password !== confirm) ? 0.5 : 1 }}
                disabled={loading || !pwd.valid || password !== confirm}
              >
                {loading ? 'Criando conta...' : 'Criar conta →'}
              </button>

              <div style={{ fontSize: '11.5px', color: '#5a5a72', textAlign: 'center', marginTop: '14px', lineHeight: '1.5' }}>
                Ao criar sua conta, você concorda com nossos termos de uso.
              </div>
            </form>
          )}

        </div>
      </div>
    </>
  )
}
