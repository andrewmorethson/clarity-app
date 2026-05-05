import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeScreen, setActiveScreen] = useState('agency')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    const { connected, upgraded, error } = router.query
    if (connected) showToast('Conta TikTok conectada com sucesso! ✅', 'success')
    if (upgraded) showToast('Plano atualizado com sucesso! 🎉', 'success')
    if (error === 'account_limit') showToast('Limite de contas do seu plano atingido.', 'error')
    if (error === 'token_expired') showToast('Token TikTok expirado. Reconecte a conta.', 'error')
  }, [router.query])

  const [toasts, setToasts] = useState<{id:number,msg:string,type:string}[]>([])
  let toastId = 0
  function showToast(msg: string, type: string) {
    const id = ++toastId
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  async function connectTikTok() {
    try {
      showToast("Abrindo TikTok...", "info")
      const res = await fetch("/api/tiktok/auth-url")
      const data = await res.json()
      if (data.url) { window.open(data.url, "_self") }
      else { showToast("Erro ao gerar link do TikTok", "error") }
    } catch { showToast("Erro de conexão", "error") }
  }

  if (status === "loading") return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#08080e', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'40px', height:'40px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid #00e5ff', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#8888a0', fontSize:'14px' }}>Carregando Clarity...</span>
    </div>
  )

  if (!session || !mounted) return null

  const user = session.user as any
  const screens = ['agency','performance','diagnosis','monetization','schedule','reports','alerts','settings','pricing']
  const titles: Record<string,string> = {
    agency:'Multi-contas', performance:'Performance', diagnosis:'Diagnóstico IA',
    monetization:'Monetização', schedule:'Agendamento', reports:'Relatórios',
    alerts:'Alertas', settings:'Configurações', pricing:'Planos'
  }

  return (
    <>
      <Head><title>Clarity — {titles[activeScreen]}</title></Head>

      {/* Toast notifications */}
      <div style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, display:'flex', flexDirection:'column', gap:'8px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background:'#0f0f18', border:`1px solid ${t.type==='success'?'rgba(6,214,160,.3)':'rgba(255,77,109,.3)'}`,
            borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px',
            minWidth:'280px', boxShadow:'0 8px 30px rgba(0,0,0,.4)',
            animation:'slideIn .3s ease',
            color: t.type==='success' ? '#06d6a0' : '#ff4d6d',
            fontSize:'13px'
          }}>
            {t.type==='success'?'✅':'❌'} {t.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #08080e; color: #eeeef5; font-family: system-ui, sans-serif; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }

        .nav-item { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; cursor:pointer; font-size:13.5px; color:#8888a0; transition:all .18s; margin-bottom:1px; position:relative; }
        .nav-item:hover { background:#14141f; color:#eeeef5; }
        .nav-item.active { background:rgba(0,229,255,0.08); color:#00e5ff; font-weight:500; }
        .nav-item.active::before { content:''; position:absolute; left:0; top:20%; bottom:20%; width:3px; background:#00e5ff; border-radius:0 3px 3px 0; }

        .acc-card { background:#0f0f1a; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:18px; cursor:pointer; transition:all .2s; }
        .acc-card:hover { border-color:rgba(0,229,255,.25); transform:translateY(-2px); box-shadow:0 8px 30px rgba(0,0,0,.3); }
        .acc-card.alert-card { border-color:rgba(255,77,109,.25); }
        .acc-card.warn-card { border-color:rgba(255,209,102,.2); }

        .stat-card { background:#0f0f1a; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:18px 20px; position:relative; overflow:hidden; }
        .card { background:#0f0f1a; border:1px solid rgba(255,255,255,.06); border-radius:14px; padding:22px; }

        .btn-primary { background:#00e5ff; color:#08080e; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; }
        .btn-outline { background:none; border:1px solid rgba(255,255,255,.1); color:#eeeef5; border-radius:8px; padding:8px 16px; font-size:13px; cursor:pointer; }
        .btn-outline:hover { border-color:#00e5ff; color:#00e5ff; }
        .btn-danger { background:rgba(255,77,109,.1); border:1px solid rgba(255,77,109,.2); color:#ff4d6d; border-radius:8px; padding:8px 16px; font-size:13px; cursor:pointer; }

        .toggle { position:relative; width:40px; height:22px; }
        .toggle input { opacity:0; width:0; height:0; position:absolute; }
        .toggle-track { position:absolute; inset:0; background:#1a1a28; border-radius:20px; cursor:pointer; transition:all .25s; border:1px solid rgba(255,255,255,.1); }
        .toggle input:checked + .toggle-track { background:#00e5ff; border-color:#00e5ff; }
        .toggle-track::after { content:''; position:absolute; width:16px; height:16px; background:#fff; border-radius:50%; top:2px; left:2px; transition:all .25s; }
        .toggle input:checked + .toggle-track::after { transform:translateX(18px); }

        .sidebar { position:fixed; top:0; bottom:0; left:0; width:240px; background:#0f0f18; border-right:1px solid rgba(255,255,255,.06); display:flex; flex-direction:column; z-index:100; overflow-y:auto; transition:transform .3s; }
        .sidebar.closed { transform:translateX(-100%); }
        .sb-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:99; }
        .sb-overlay.open { display:block; }
        .main-content { margin-left:240px; min-height:100vh; display:flex; flex-direction:column; }
        .bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; height:60px; background:#0f0f18; border-top:1px solid rgba(255,255,255,.06); z-index:200; align-items:center; justify-content:space-around; padding:0 6px; }
        .bnav-item { display:flex; flex-direction:column; align-items:center; gap:3px; padding:6px 8px; border-radius:10px; cursor:pointer; color:#8888a0; font-size:9.5px; transition:all .2s; flex:1; }
        .bnav-item.active { color:#00e5ff; }

        @media(max-width:768px) {
          .sidebar { transform:translateX(-100%); width:260px; z-index:200; }
          .sidebar.open { transform:translateX(0); }
          .main-content { margin-left:0; padding-bottom:60px; }
          .bottom-nav { display:flex; }
          .hamburger { display:flex !important; }
          .period-toggle { display:none !important; }
          .content-pad { padding:16px !important; }
          .stat-grid { grid-template-columns:repeat(2,1fr) !important; }
          .acc-grid { grid-template-columns:1fr !important; }
          .grid-2 { grid-template-columns:1fr !important; }
          .grid-2-1 { grid-template-columns:1fr !important; }
        }
        @media(max-width:420px) {
          .stat-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* Sidebar overlay */}
      <div className="sb-overlay" id="sbOverlay" onClick={() => {
        document.querySelector('.sidebar')?.classList.remove('open')
        document.getElementById('sbOverlay')?.classList.remove('open')
      }}/>

      {/* SIDEBAR */}
      <aside className="sidebar" id="sidebar">
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'30px', height:'30px', background:'#00e5ff', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', boxShadow:'0 0 16px rgba(0,229,255,.35)' }}>◈</div>
          <span style={{ fontWeight:800, fontSize:'18px' }}>Clarity</span>
          <span style={{ fontSize:'9px', background:'rgba(0,229,255,.12)', color:'#00e5ff', padding:'2px 7px', borderRadius:'20px', border:'1px solid rgba(0,229,255,.2)' }}>BETA</span>
        </div>

        {/* Account selector */}
        <div style={{ margin:'14px 10px', background:'#14141f', border:'1px solid rgba(255,255,255,.1)', borderRadius:'12px', padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}
          onClick={() => setActiveScreen('settings')}>
          <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:'linear-gradient(135deg,#00e5ff22,#00b4d822)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🎵</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'13px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Studio Beats</div>
            <div style={{ fontSize:'11px', color:'#8888a0' }}>@studiobeats.br</div>
          </div>
          <span style={{ color:'#8888a0', fontSize:'12px' }}>⌄</span>
        </div>

        <nav style={{ padding:'6px 10px', flex:1 }}>
          {[
            { id:'agency',       icon:'⊞', label:'Multi-contas',  group:'Visão Geral' },
            { id:'performance',  icon:'◎', label:'Performance',   group:'' },
            { id:'diagnosis',    icon:'🧠', label:'Diagnóstico IA', group:'' },
            { id:'monetization', icon:'💰', label:'Monetização',   group:'' },
            { id:'schedule',     icon:'📅', label:'Agendamento',   group:'Ferramentas' },
            { id:'reports',      icon:'📄', label:'Relatórios',    group:'' },
            { id:'alerts',       icon:'🔔', label:'Alertas',       group:'', badge:'3' },
            { id:'settings',     icon:'⚙',  label:'Configurações', group:'Conta' },
            { id:'pricing',      icon:'◈', label:'Planos',        group:'' },
          ].map((item, i, arr) => (
            <div key={item.id}>
              {item.group && <div style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'1.5px', color:'#5a5a72', padding:'16px 12px 6px', fontWeight:600 }}>{item.group}</div>}
              <div className={`nav-item${activeScreen===item.id?' active':''}`} onClick={() => { setActiveScreen(item.id); document.querySelector('.sidebar')?.classList.remove('open'); document.getElementById('sbOverlay')?.classList.remove('open') }}>
                <span style={{ fontSize:'15px', width:'20px', textAlign:'center' }}>{item.icon}</span>
                {item.label}
                {item.badge && <span style={{ marginLeft:'auto', background:'#ff4d6d', color:'#fff', fontSize:'10px', padding:'1px 6px', borderRadius:'10px' }}>{item.badge}</span>}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ margin:'12px', background:'linear-gradient(135deg,rgba(199,125,255,.12),rgba(0,229,255,.06))', border:'1px solid rgba(199,125,255,.2)', borderRadius:'12px', padding:'14px 16px' }}>
          <div style={{ fontWeight:700, fontSize:'13px', color:'#c77dff', marginBottom:'4px', textTransform:'capitalize' }}>Plano {user?.plan || 'Starter'}</div>
          <div style={{ fontSize:'11.5px', color:'#8888a0', lineHeight:'1.6' }}>Logado como<br/>{user?.email}</div>
          <button className="btn-outline" style={{ width:'100%', marginTop:'10px', fontSize:'11.5px', padding:'6px' }} onClick={() => signOut({ callbackUrl:'/login' })}>Sair</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        {/* Topbar */}
        <div style={{ height:'60px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', background:'#08080e', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div className="hamburger" style={{ display:'none', flexDirection:'column', gap:'4px', cursor:'pointer' }}
              onClick={() => { document.getElementById('sidebar')?.classList.toggle('open'); document.getElementById('sbOverlay')?.classList.toggle('open') }}>
              <span style={{ display:'block', width:'20px', height:'2px', background:'#eeeef5', borderRadius:'2px' }}/>
              <span style={{ display:'block', width:'20px', height:'2px', background:'#eeeef5', borderRadius:'2px' }}/>
              <span style={{ display:'block', width:'20px', height:'2px', background:'#eeeef5', borderRadius:'2px' }}/>
            </div>
            <div style={{ fontWeight:800, fontSize:'17px', display:'flex', alignItems:'center', gap:'10px' }}>
              {titles[activeScreen]}
              <span style={{ display:'flex', alignItems:'center', gap:'5px', background:'rgba(6,214,160,.1)', border:'1px solid rgba(6,214,160,.2)', color:'#06d6a0', fontSize:'10px', fontWeight:600, padding:'3px 9px', borderRadius:'20px' }}>
                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#06d6a0', animation:'blink 1.5s infinite', display:'inline-block' }}/>
                ao vivo
              </span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div className="period-toggle" style={{ display:'flex', background:'#0f0f18', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'3px', gap:'2px' }}>
              {['7d','30d','90d'].map(p => (
                <button key={p} style={{ padding:'5px 14px', borderRadius:'6px', fontSize:'12px', cursor:'pointer', background:'none', border:'none', color:'#8888a0', fontFamily:'system-ui' }}
                  onClick={e => { document.querySelectorAll('.period-toggle button').forEach(b => (b as HTMLElement).style.background='none'); (e.target as HTMLElement).style.background='#14141f'; (e.target as HTMLElement).style.color='#eeeef5' }}>
                  {p}
                </button>
              ))}
            </div>
            <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,#c77dff,#00e5ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="content-pad" style={{ padding:'28px', flex:1 }}>
          {activeScreen === 'agency'       && <AgencyScreen onNav={setActiveScreen} />}
          {activeScreen === 'performance'  && <PerformanceScreen />}
          {activeScreen === 'diagnosis'    && <DiagnosisScreen onNav={setActiveScreen} />}
          {activeScreen === 'monetization' && <MonetizationScreen />}
          {activeScreen === 'schedule'     && <ScheduleScreen />}
          {activeScreen === 'reports'      && <ReportsScreen />}
          {activeScreen === 'alerts'       && <AlertsScreen onNav={setActiveScreen} />}
          {activeScreen === 'settings'     && <SettingsScreen user={user} />}
          {activeScreen === 'pricing'      && <PricingScreen plan={user?.plan} />}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {[
          { id:'agency',       icon:'⊞', label:'Contas' },
          { id:'performance',  icon:'◎', label:'Dados' },
          { id:'diagnosis',    icon:'🧠', label:'IA' },
          { id:'alerts',       icon:'🔔', label:'Alertas' },
          { id:'settings',     icon:'⚙',  label:'Config' },
        ].map(item => (
          <div key={item.id} className={`bnav-item${activeScreen===item.id?' active':''}`} onClick={() => setActiveScreen(item.id)}>
            <span style={{ fontSize:'18px' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </>
  )
}

// ======= SCREENS =======

function StatCard({ label, value, delta, deltaUp, color }: any) {
  const colors: Record<string,string> = { cyan:'#00e5ff', pink:'#ff4d6d', purple:'#c77dff', green:'#06d6a0', warn:'#ffd166' }
  return (
    <div className="stat-card" style={{ borderTop:`2px solid ${colors[color]||colors.cyan}` }}>
      <div style={{ fontSize:'11px', color:'#8888a0', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:'8px' }}>{label}</div>
      <div style={{ fontWeight:800, fontSize:'26px', marginBottom:'4px' }}>{value}</div>
      <div style={{ fontSize:'11.5px', color: deltaUp ? '#06d6a0' : '#ff4d6d' }}>{delta}</div>
    </div>
  )
}

function AgencyScreen({ onNav }: { onNav: (s:string)=>void }) {
  const accounts = [
    { name:'Studio Beats', handle:'@studiobeats.br', emoji:'🎵', grad:'#00e5ff22,#00b4d822', status:'Saudável', statusClass:'ok', views:'1.2M', followers:'89K', eng:'5.1%', prog:82, progColor:'#00e5ff' },
    { name:'Moda Atual',   handle:'@modaatual_',     emoji:'👗', grad:'#ff4d6d22,#ff9f4322', status:'⚠ Queda',  statusClass:'alert', views:'210K', followers:'54K', eng:'1.2%', prog:24, progColor:'#ff4d6d' },
    { name:'Beleza Lab',   handle:'@belezalab.co',   emoji:'💄', grad:'#c77dff22,#ec489922', status:'Saudável', statusClass:'ok',    views:'890K', followers:'71K', eng:'4.3%', prog:68, progColor:'#c77dff' },
    { name:'Fit Zone BR',  handle:'@fitzone.brasil', emoji:'🏋️', grad:'#ffd16622,#f9731622', status:'↗ Crescendo', statusClass:'warn', views:'640K', followers:'38K', eng:'3.9%', prog:55, progColor:'#ffd166' },
    { name:'Tech Rápido',  handle:'@techrapido',     emoji:'💻', grad:'#0ea5e922,#6366f122', status:'Saudável', statusClass:'ok',    views:'780K', followers:'45K', eng:'4.7%', prog:74, progColor:'#0ea5e9' },
    { name:'Verde Vivo',   handle:'@verdevivo.br',   emoji:'🌱', grad:'#10b98122,#84cc1622', status:'🚨 Shadowban', statusClass:'alert', views:'48K', followers:'15K', eng:'0.8%', prog:10, progColor:'#ff4d6d' },
  ]
  const statusColors: Record<string,string> = { ok:'rgba(6,214,160,.1)', alert:'rgba(255,77,109,.1)', warn:'rgba(255,209,102,.1)' }
  const statusTextColors: Record<string,string> = { ok:'#06d6a0', alert:'#ff4d6d', warn:'#ffd166' }

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontWeight:800, fontSize:'22px', marginBottom:'4px' }}>Painel da Agência</div>
        <div style={{ color:'#8888a0', fontSize:'13.5px' }}>6 contas monitoradas · Última sync há 2 min</div>
      </div>
      <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'22px' }}>
        <StatCard label="Visualizações Totais" value="4.2M" delta="↑ 18% vs semana anterior" deltaUp color="cyan"/>
        <StatCard label="Seguidores Totais" value="312K" delta="↑ +4.8K novos" deltaUp color="purple"/>
        <StatCard label="Eng. Médio" value="3.4%" delta="↓ queda em 2 contas" color="pink"/>
        <StatCard label="Alertas Ativos" value="3" delta="⚠ requer atenção" color="warn"/>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
        <span style={{ fontWeight:700, fontSize:'15px' }}>Contas Monitoradas</span>
        <button className="btn-primary" onClick={connectTikTok}>+ Adicionar conta</button>
      </div>
      <div className="acc-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
        {accounts.map(a => (
          <div key={a.handle} className={`acc-card${a.statusClass==='alert'?' alert-card':a.statusClass==='warn'?' warn-card':''}`} onClick={() => onNav('performance')}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:`linear-gradient(135deg,${a.grad})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px' }}>{a.emoji}</div>
              <div><div style={{ fontWeight:700, fontSize:'13.5px', marginBottom:'1px' }}>{a.name}</div><div style={{ fontSize:'11px', color:'#8888a0' }}>{a.handle}</div></div>
              <span style={{ marginLeft:'auto', padding:'3px 9px', borderRadius:'20px', fontSize:'10.5px', fontWeight:600, background:statusColors[a.statusClass], color:statusTextColors[a.statusClass] }}>{a.status}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px', textAlign:'center' }}>
              {[['Views',a.views],['Seguid.',a.followers],['Eng.',a.eng]].map(([l,v]) => (
                <div key={l}><div style={{ fontWeight:800, fontSize:'14px', marginBottom:'1px' }}>{v}</div><div style={{ fontSize:'9.5px', color:'#8888a0', textTransform:'uppercase' }}>{l}</div></div>
              ))}
            </div>
            <div style={{ height:'3px', background:'rgba(255,255,255,.08)', borderRadius:'2px', marginTop:'12px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${a.prog}%`, background:a.progColor, borderRadius:'2px', transition:'width 1.2s ease' }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PerformanceScreen() {
  return (
    <div>
      <div style={{ marginBottom:'24px', display:'flex', alignItems:'center', gap:'14px' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'linear-gradient(135deg,#00e5ff22,#00b4d822)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>🎵</div>
        <div><div style={{ fontWeight:800, fontSize:'20px' }}>Studio Beats</div><div style={{ color:'#8888a0', fontSize:'13px' }}>@studiobeats.br · 89K seguidores</div></div>
      </div>
      <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
        <StatCard label="Visualizações" value="1.2M" delta="↑ 18% esta semana" deltaUp color="cyan"/>
        <StatCard label="Taxa de Conclusão" value="67%" delta="↑ acima da média" deltaUp color="green"/>
        <StatCard label="Engajamento" value="5.1%" delta="↑ ótimo p/ nicho" deltaUp color="purple"/>
        <StatCard label="Novos Seguidores" value="+2.4K" delta="↑ últimos 7 dias" deltaUp color="pink"/>
      </div>
      <div className="grid-2-1" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px', marginBottom:'16px' }}>
        <div className="card">
          <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            Visualizações por dia
            <span style={{ fontSize:'10.5px', background:'rgba(6,214,160,.1)', color:'#06d6a0', padding:'3px 9px', borderRadius:'20px' }}>↑ tendência positiva</span>
          </div>
          <svg width="100%" height="130" viewBox="0 0 580 130" preserveAspectRatio="none">
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e5ff" stopOpacity=".25"/><stop offset="100%" stopColor="#00e5ff" stopOpacity="0"/></linearGradient></defs>
            <line x1="0" y1="32" x2="580" y2="32" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
            <line x1="0" y1="64" x2="580" y2="64" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
            <path d="M0,95 C80,55 130,50 250,60 C320,25 420,35 580,6 L580,130 L0,130Z" fill="url(#g1)"/>
            <path d="M0,95 C80,55 130,50 250,60 C320,25 420,35 580,6" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="580" cy="6" r="5" fill="#00e5ff" stroke="rgba(0,229,255,.3)" strokeWidth="6"/>
          </svg>
        </div>
        <div className="card">
          <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'16px' }}>Origem do tráfego</div>
          {[['Para Você (FYP)','62%','#00e5ff'],['Seguidores','21%','#c77dff'],['Busca','11%','#06d6a0'],['Outros','6%','#8888a0']].map(([l,v,c]) => (
            <div key={l} style={{ marginBottom:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'5px' }}><span>{l}</span><span style={{ color:c, fontWeight:600 }}>{v}</span></div>
              <div style={{ height:'5px', background:'rgba(255,255,255,.06)', borderRadius:'3px', overflow:'hidden' }}><div style={{ height:'100%', width:v, background:c, borderRadius:'3px' }}/></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DiagnosisScreen({ onNav }: { onNav: (s:string)=>void }) {
  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontWeight:800, fontSize:'22px', marginBottom:'4px' }}>Diagnóstico IA</div>
        <div style={{ color:'#8888a0', fontSize:'13.5px' }}>Studio Beats · Gerado hoje às 08:14 · Powered by Claude</div>
      </div>
      <div className="grid-2-1" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px' }}>
        <div className="card">
          <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'16px', display:'flex', justifyContent:'space-between' }}>
            🧠 Análise geral da semana
            <span style={{ fontSize:'10.5px', background:'rgba(6,214,160,.1)', color:'#06d6a0', padding:'3px 9px', borderRadius:'20px' }}>conta saudável</span>
          </div>
          <div style={{ background:'rgba(0,229,255,.04)', borderLeft:'3px solid #00e5ff', borderRadius:'8px', padding:'14px 16px', marginBottom:'18px', fontSize:'13.5px', lineHeight:'1.7', color:'#8888a0' }}>
            Sua conta teve uma <strong style={{ color:'#eeeef5' }}>semana acima da média</strong>. O vídeo "Tutorial: 3 acordes que viralizam" foi o destaque com 342K views. O ponto de atenção está na <strong style={{ color:'#ffd166' }}>retenção nos primeiros segundos</strong>.
          </div>
          {[
            { color:'#06d6a0', title:'Melhor horário:', desc:'Poste às 19h–20h nas terças e quintas', sub:'Seu público é 34% mais ativo nesses horários.' },
            { color:'#00e5ff', title:'Formato campeão:', desc:'Vídeos entre 28–45 segundos', sub:'Taxa de conclusão 2x maior nesse range.' },
            { color:'#ffd166', title:'Problema de hook:', desc:'3 vídeos perderam 40%+ nos primeiros 4s', sub:'Comece com afirmação surpreendente ou demonstração visual.' },
            { color:'#c77dff', title:'Oportunidade:', desc:'#musicabraseducativa em alta', sub:'40% menos concorrência esta semana.' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:'12px', paddingBottom:'12px', borderBottom:'1px solid rgba(255,255,255,.06)', marginBottom:'12px' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:item.color, marginTop:'5px', flexShrink:0 }}/>
              <div><div style={{ fontSize:'13px', lineHeight:'1.55' }}><strong>{item.title}</strong> {item.desc}</div><div style={{ fontSize:'11.5px', color:'#8888a0', marginTop:'3px' }}>{item.sub}</div></div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'16px' }}>Score da conta</div>
            <div style={{ position:'relative', width:'90px', height:'90px', margin:'0 auto 12px' }}>
              <svg width="90" height="90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#00e5ff" strokeWidth="8" strokeDasharray="239" strokeDashoffset="48" strokeLinecap="round" transform="rotate(-90 50 50)"/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontWeight:800, fontSize:'20px', color:'#00e5ff' }}>80</span>
                <span style={{ fontSize:'9.5px', color:'#8888a0' }}>/ 100</span>
              </div>
            </div>
            <div style={{ fontSize:'12px', color:'#8888a0', lineHeight:'1.6' }}>Conta saudável. Corrija o hook para chegar a 90+</div>
          </div>
          <div className="card">
            <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'12px' }}>Próximas ações</div>
            {[
              { icon:'⏰', label:'Agendar post hoje às 19h', screen:'schedule' },
              { icon:'💬', label:'Responder 47 comentários', screen:null },
              { icon:'✂️', label:'Encurtar próximo vídeo', screen:null },
            ].map((a, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'center', fontSize:'12.5px', padding:'9px 12px', background:'rgba(255,255,255,.03)', borderRadius:'8px', marginBottom:'6px' }}>
                <span>{a.icon}</span><span style={{ flex:1 }}>{a.label}</span>
                {a.screen && <button className="btn-primary" style={{ fontSize:'11px', padding:'4px 10px' }} onClick={() => onNav(a.screen)}>Ir</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MonetizationScreen() {
  const reqs = [
    { ok:true,  label:'Seguidores mínimos',     val:'89K',    need:'Req: 10.000' },
    { ok:false, label:'Views (30 dias)',          val:'89K/100K', need:'Faltam 11K' },
    { ok:true,  label:'Conta com +30 dias',      val:'14 meses', need:'✓ ok' },
    { ok:true,  label:'Sem violações',           val:'Limpa',    need:'90 dias' },
    { ok:true,  label:'Conta Creator/Business',  val:'Creator',  need:'✓ ok' },
  ]
  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontWeight:800, fontSize:'22px', marginBottom:'4px' }}>Monetização</div>
        <div style={{ color:'#8888a0', fontSize:'13.5px' }}>Studio Beats · Elegibilidade e potencial de receita</div>
      </div>
      <div style={{ background:'linear-gradient(135deg,rgba(0,229,255,.07),rgba(199,125,255,.05))', border:'1px solid rgba(0,229,255,.15)', borderRadius:'20px', padding:'24px', marginBottom:'22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap' as any }}>
        <div>
          <div style={{ fontWeight:800, fontSize:'19px', marginBottom:'6px' }}>Você está quase lá! 🎯</div>
          <div style={{ color:'#8888a0', fontSize:'13.5px', lineHeight:'1.65' }}>Faltam apenas <strong style={{ color:'#00e5ff' }}>11.000 views</strong> para o Creator Rewards este mês.</div>
        </div>
        <div style={{ position:'relative', width:'90px', height:'90px' }}>
          <svg width="90" height="90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8"/>
            <circle cx="50" cy="50" r="38" fill="none" stroke="#00e5ff" strokeWidth="8" strokeDasharray="239" strokeDashoffset="26" strokeLinecap="round" transform="rotate(-90 50 50)"/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontWeight:800, fontSize:'20px', color:'#00e5ff' }}>89%</span>
            <span style={{ fontSize:'9.5px', color:'#8888a0' }}>concluído</span>
          </div>
        </div>
      </div>
      <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        <div>
          <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'12px' }}>Checklist Creator Rewards</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {reqs.map((r, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:'8px', padding:'11px 14px', display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ fontSize:'16px' }}>{r.ok ? '✅' : '⏳'}</span>
                <span style={{ flex:1, fontSize:'13px' }}>{r.label}</span>
                <div style={{ textAlign:'right' }}><div style={{ fontSize:'12.5px', fontWeight:600, color: r.ok ? '#06d6a0' : '#ffd166' }}>{r.val}</div><div style={{ fontSize:'10.5px', color:'#8888a0' }}>{r.need}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'12px' }}>Potencial de receita</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[
              { icon:'💰', label:'Creator Rewards', val:'R$280–490/mês', color:'#00e5ff', need:'estimado' },
              { icon:'🤝', label:'Brand deals', val:'R$1.2–3.5K/post', color:'#c77dff', need:'nicho música' },
              { icon:'🛍️', label:'TikTok Shop', val:'10–20%', color:'#ffd166', need:'comissão' },
              { icon:'🎁', label:'Gifts em Lives', val:'Ativo', color:'#ff4d6d', need:'1K+ seguid.' },
              { icon:'📊', label:'Total potencial/mês', val:'R$2k–8k', color:'#00e5ff', need:'combinando', highlight:true },
            ].map((r, i) => (
              <div key={i} style={{ background: r.highlight ? 'rgba(0,229,255,.04)' : 'rgba(255,255,255,.03)', border:`1px solid ${r.highlight ? 'rgba(0,229,255,.15)' : 'rgba(255,255,255,.06)'}`, borderRadius:'8px', padding:'11px 14px', display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ fontSize:'16px' }}>{r.icon}</span>
                <span style={{ flex:1, fontSize:'13px' }}>{r.label}</span>
                <div style={{ textAlign:'right' }}><div style={{ fontSize: r.highlight ? '16px' : '12.5px', fontWeight:600, color:r.color }}>{r.val}</div><div style={{ fontSize:'10.5px', color:'#8888a0' }}>{r.need}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleScreen() {
  const days = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
  const slots = [
    [{type:'posted',label:'✓ 19h'},{type:'empty',label:'+ add'}],
    [{type:'posted',label:'✓ 20h'},{type:'scheduled',label:'⏱ 12h'}],
    [{type:'failed',label:'✗ 19h'},{type:'empty',label:'+ add'}],
    [{type:'scheduled',label:'⏱ 19h'},{type:'empty',label:'+ add'}],
    [{type:'empty',label:'+ add'},{type:'empty',label:'+ add'}],
    [{type:'empty',label:'+ add'},{type:'empty',label:'+ add'}],
    [{type:'empty',label:'+ add'},{type:'empty',label:'+ add'}],
  ]
  const slotColors: Record<string,string> = { posted:'rgba(6,214,160,.08)', scheduled:'rgba(0,229,255,.08)', failed:'rgba(255,77,109,.08)', empty:'rgba(255,255,255,.03)' }
  const slotTextColors: Record<string,string> = { posted:'#06d6a0', scheduled:'#00e5ff', failed:'#ff4d6d', empty:'#5a5a72' }
  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontWeight:800, fontSize:'22px', marginBottom:'4px' }}>Agendamento</div>
        <div style={{ color:'#8888a0', fontSize:'13.5px' }}>Studio Beats · Posts programados</div>
      </div>
      <div className="card" style={{ marginBottom:'16px' }}>
        <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'16px', display:'flex', justifyContent:'space-between' }}>
          Semana atual — Maio 2026 <button className="btn-primary">+ Novo post</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'6px', marginBottom:'16px' }}>
          {days.map((d, di) => (
            <div key={d} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'10px', color:'#8888a0', textTransform:'uppercase', marginBottom:'6px' }}>{d}</div>
              {slots[di].map((slot, si) => (
                <div key={si} style={{ height:'36px', borderRadius:'6px', marginBottom:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', cursor:'pointer', background:slotColors[slot.type], color:slotTextColors[slot.type], border:`1px solid ${slotColors[slot.type]}` }}>{slot.label}</div>
              ))}
            </div>
          ))}
        </div>
        {slots[2][0].type === 'failed' && (
          <div style={{ background:'rgba(255,77,109,.06)', border:'1px solid rgba(255,77,109,.2)', borderRadius:'10px', padding:'12px 16px' }}>
            <div style={{ fontWeight:600, fontSize:'13px', color:'#ff4d6d', marginBottom:'4px' }}>⚠ Post falhou — Qua 19h</div>
            <div style={{ fontSize:'12px', color:'#8888a0' }}>Formato inválido (16:9 em vez de 9:16). Reenvie em formato vertical.</div>
            <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
              <button className="btn-danger">Reenviar</button>
              <button className="btn-outline">Descartar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReportsScreen() {
  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontWeight:800, fontSize:'22px', marginBottom:'4px' }}>Relatórios</div>
        <div style={{ color:'#8888a0', fontSize:'13.5px' }}>Gere PDFs para seus clientes</div>
      </div>
      <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
        <div className="card">
          <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'16px' }}>Gerar novo relatório</div>
          {[['Conta','Studio Beats (@studiobeats.br)'],['Período','Últimos 7 dias'],['Tipo','Relatório completo']].map(([l,v]) => (
            <div key={l} style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', color:'#8888a0', fontWeight:600, display:'block', marginBottom:'6px' }}>{l}</label>
              <select style={{ width:'100%', background:'#14141f', border:'1px solid rgba(255,255,255,.09)', borderRadius:'8px', padding:'10px 12px', color:'#eeeef5', fontSize:'13px', outline:'none' }}>
                <option>{v}</option>
              </select>
            </div>
          ))}
          <button className="btn-primary" style={{ width:'100%', padding:'11px' }}>Gerar PDF →</button>
        </div>
        <div className="card">
          <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'16px' }}>Relatórios recentes</div>
          {[
            { name:'Studio Beats — Abril 2026', meta:'01/05/2026 · 12 páginas' },
            { name:'Todas as contas — Semana 17', meta:'28/04/2026 · 8 páginas' },
          ].map((r, i) => (
            <div key={i} style={{ display:'flex', gap:'14px', padding:'14px', background:'rgba(255,255,255,.03)', borderRadius:'10px', marginBottom:'10px' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:'rgba(199,125,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📄</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13.5px', fontWeight:600, marginBottom:'3px' }}>{r.name}</div>
                <div style={{ fontSize:'12px', color:'#8888a0' }}>{r.meta}</div>
                <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                  <button className="btn-outline" style={{ fontSize:'12px', padding:'5px 12px' }}>⬇ Baixar</button>
                  <button className="btn-outline" style={{ fontSize:'12px', padding:'5px 12px' }}>🔗 Compartilhar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AlertsScreen({ onNav }: { onNav: (s:string)=>void }) {
  const alerts = [
    { type:'crit', icon:'🚨', title:'@verdevivo.br — Possível shadowban detectado', desc:'Alcance orgânico caiu 89% em 3 dias. Verifique se algum vídeo recente violou diretrizes.', time:'há 1h', action:'Ver diagnóstico', screen:'diagnosis' },
    { type:'crit', icon:'🔌', title:'@modaatual_ — Token de autenticação expirado', desc:'A conexão com a API TikTok foi perdida. Dados parados desde 02/05/2026.', time:'há 2 dias', action:'Reconectar', screen:null },
    { type:'warn', icon:'📉', title:'@modaatual_ — Engajamento abaixo de 2% por 10 dias', desc:'Taxa caiu de 4.1% para 1.2%. Revise o conteúdo ou verifique penalização algorítmica.', time:'há 6h', action:null, screen:null },
    { type:'info', icon:'🎯', title:'@studiobeats.br — A 11K views do Creator Rewards', desc:'No ritmo atual, a meta deve ser atingida em 3–4 dias.', time:'há 12h', action:'Ver monetização', screen:'monetization' },
  ]
  const borderColors: Record<string,string> = { crit:'rgba(255,77,109,.2)', warn:'rgba(255,209,102,.15)', info:'rgba(6,214,160,.15)' }
  const iconBg: Record<string,string> = { crit:'rgba(255,77,109,.1)', warn:'rgba(255,209,102,.1)', info:'rgba(6,214,160,.1)' }

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontWeight:800, fontSize:'22px', marginBottom:'4px' }}>Central de Alertas</div>
        <div style={{ color:'#8888a0', fontSize:'13.5px' }}>3 alertas ativos · 2 resolvidos hoje</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {alerts.map((a, i) => (
          <div key={i} style={{ background:'#0f0f1a', border:`1px solid ${borderColors[a.type]}`, borderRadius:'12px', padding:'14px 16px', display:'flex', gap:'12px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:iconBg[a.type], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0 }}>{a.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'13px', fontWeight:600, marginBottom:'3px' }}>{a.title}</div>
              <div style={{ fontSize:'12px', color:'#8888a0', lineHeight:'1.5', marginBottom:'6px' }}>{a.desc}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ fontSize:'11px', color:'#5a5a72' }}>{a.time}</span>
                {a.action && <span style={{ fontSize:'11px', color:'#00e5ff', cursor:'pointer' }} onClick={() => a.screen && onNav(a.screen)}>{a.action} →</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsScreen({ user }: { user: any }) {
  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontWeight:800, fontSize:'22px', marginBottom:'4px' }}>Configurações</div>
        <div style={{ color:'#8888a0', fontSize:'13.5px' }}>Gerencie sua conta e preferências</div>
      </div>
      <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
        <div>
          <div className="card" style={{ marginBottom:'16px' }}>
            <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'16px', paddingBottom:'10px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>Perfil</div>
            {[['Nome',user?.name||'Admin'],['E-mail',user?.email||''],['WhatsApp','+55 11 9xxxx-xxxx']].map(([l,v]) => (
              <div key={l} style={{ marginBottom:'12px' }}>
                <label style={{ fontSize:'12px', color:'#8888a0', fontWeight:600, display:'block', marginBottom:'6px' }}>{l}</label>
                <input defaultValue={v} style={{ width:'100%', background:'#14141f', border:'1px solid rgba(255,255,255,.09)', borderRadius:'8px', padding:'10px 12px', color:'#eeeef5', fontSize:'13px', outline:'none' }}/>
              </div>
            ))}
            <button className="btn-primary">Salvar alterações</button>
          </div>
          <div className="card">
            <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'14px', paddingBottom:'10px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>Contas TikTok</div>
            {[
              { name:'Studio Beats', status:'Conectado', statusOk:true },
              { name:'Moda Atual', status:'Token expirado', statusOk:false },
            ].map((a, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 12px', background:'rgba(255,255,255,.03)', borderRadius:'8px', marginBottom:'8px', border:`1px solid ${a.statusOk?'rgba(255,255,255,.06)':'rgba(255,77,109,.2)'}` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight:600 }}>{a.name}</div>
                  <div style={{ fontSize:'11px', color: a.statusOk ? '#06d6a0' : '#ff4d6d' }}>● {a.status}</div>
                </div>
                <button className={a.statusOk ? 'btn-danger' : 'btn-primary'} style={{ fontSize:'11px', padding:'5px 12px' }}>{a.statusOk ? 'Desconectar' : 'Reconectar'}</button>
              </div>
            ))}
            <button className="btn-outline" style={{ width:'100%', padding:'10px', marginTop:'4px' }} onClick={connectTikTok}>+ Adicionar conta</button>
          </div>
        </div>
        <div>
          <div className="card" style={{ marginBottom:'16px' }}>
            <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'14px', paddingBottom:'10px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>Notificações</div>
            {['E-mail semanal de resumo','Alertas críticos por e-mail','Alertas por WhatsApp','Diagnóstico IA diário'].map((label, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                <span style={{ fontSize:'13.5px' }}>{label}</span>
                <label className="toggle"><input type="checkbox" defaultChecked={i < 3}/><div className="toggle-track"/></label>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontWeight:700, fontSize:'14px', marginBottom:'14px', paddingBottom:'10px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>Zona de perigo</div>
            <button className="btn-outline" style={{ width:'100%', padding:'10px', marginBottom:'8px' }}>Exportar todos os dados</button>
            <button className="btn-danger" style={{ width:'100%', padding:'10px' }}>Excluir conta</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PricingScreen({ plan }: { plan: string }) {
  const plans = [
    { key:'starter', name:'Starter', price:'R$49', period:'1 conta TikTok', features:['Dashboard de performance','Diagnóstico IA semanal','Melhor horário para postar','Alertas de engajamento','Checklist de monetização'], missing:['Multi-contas','Relatórios PDF','Agendamento'] },
    { key:'pro', name:'Pro', price:'R$129', period:'Até 5 contas TikTok', features:['Tudo do Starter','Multi-contas (até 5)','Diagnóstico IA diário','Agendamento de posts','Relatórios PDF','Alertas via WhatsApp'], missing:['White-label relatórios'] },
    { key:'agency', name:'Agency', price:'R$299', period:'Até 20 contas TikTok', features:['Tudo do Pro','Até 20 contas','Relatórios white-label','Benchmark por nicho','API de exportação','Suporte prioritário'], missing:[] },
  ]
  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <div style={{ fontWeight:800, fontSize:'22px', marginBottom:'4px' }}>Planos & Preços</div>
        <div style={{ color:'#8888a0', fontSize:'13.5px' }}>Você está no plano <strong style={{ color:'#c77dff', textTransform:'capitalize' }}>{plan || 'Starter'}</strong></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        {plans.map(p => (
          <div key={p.key} style={{ background: p.key==='pro' ? 'linear-gradient(180deg,rgba(0,229,255,.04) 0%,#0f0f1a 100%)' : '#0f0f1a', border:`1px solid ${p.key===plan?'rgba(0,229,255,.3)':p.key==='pro'?'rgba(0,229,255,.2)':'rgba(255,255,255,.06)'}`, borderRadius:'20px', padding:'24px', position:'relative' }}>
            {p.key === plan && <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#00e5ff', color:'#08080e', fontSize:'10px', fontWeight:800, padding:'4px 14px', borderRadius:'20px', whiteSpace:'nowrap' }}>PLANO ATUAL</div>}
            {p.key === 'pro' && p.key !== plan && <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'#00e5ff', color:'#08080e', fontSize:'10px', fontWeight:800, padding:'4px 14px', borderRadius:'20px', whiteSpace:'nowrap' }}>MAIS POPULAR</div>}
            <div style={{ fontWeight:700, fontSize:'15px', marginBottom:'6px' }}>{p.name}</div>
            <div style={{ fontWeight:800, fontSize:'32px', marginBottom:'4px' }}>{p.price}<span style={{ fontSize:'15px', fontWeight:400, color:'#8888a0' }}>/mês</span></div>
            <div style={{ fontSize:'12px', color:'#8888a0', marginBottom:'18px' }}>{p.period}</div>
            <ul style={{ listStyle:'none', marginBottom:'20px', display:'flex', flexDirection:'column', gap:'8px' }}>
              {p.features.map(f => <li key={f} style={{ fontSize:'12.5px', display:'flex', gap:'8px' }}><span style={{ color:'#06d6a0', fontWeight:700 }}>✓</span>{f}</li>)}
              {p.missing.map(f => <li key={f} style={{ fontSize:'12.5px', color:'#5a5a72', display:'flex', gap:'8px' }}><span>—</span>{f}</li>)}
            </ul>
            <button
              style={{ width:'100%', padding:'11px', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor: p.key===plan?'not-allowed':'pointer', border:'none', opacity: p.key===plan?0.5:1, background: p.key==='pro'||p.key==='agency' ? '#00e5ff' : 'none', color: p.key==='pro'||p.key==='agency' ? '#08080e' : '#eeeef5', borderWidth:'1px', borderStyle: p.key==='pro'||p.key==='agency' ? 'none' : 'solid', borderColor:'rgba(255,255,255,.1)' } as any}
              disabled={p.key===plan}
            >
              {p.key === plan ? 'Plano atual' : p.key === 'agency' ? 'Fazer upgrade' : 'Começar grátis'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export async function getServerSideProps(context: any) {
  const { getServerSession } = await import('next-auth')
  const { authOptions } = await import('./api/auth/[...nextauth]')
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) return { redirect: { destination: '/login', permanent: false } }
  return { props: { session } }
}
