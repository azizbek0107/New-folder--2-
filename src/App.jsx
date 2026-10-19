import { useEffect, useRef, useState } from 'react'
import { ParticleScene } from './particles'
import './App.css'
import { CameraSession } from './camera-session'

const colors = [{ name: 'Yalpiz', value: '#79ffd4' }, { name: 'Osmon', value: '#75bdff' }, { name: 'Binafsha', value: '#cb9dff' }, { name: 'Olov', value: '#ffb071' }]
const cameraError = (error) => ({
  NotAllowedError: 'Kameraga ruxsat berilmadi. Brauzer manzil satridagi kamera belgisidan ruxsat bering va qayta urinib ko‘ring.',
  NotFoundError: 'Kamera topilmadi. Kamerani ulang va qayta urinib ko‘ring.',
  NotReadableError: 'Kamera band. Uni ishlatayotgan boshqa dasturni yoping va qayta urinib ko‘ring.',
}[error.name] || error.message || 'Kamerani ishga tushirib bo‘lmadi. Qayta urinib ko‘ring.')

function App() {
  const canvas = useRef(null), video = useRef(null), scene = useRef(null), session = useRef(null)
  const [status, setStatus] = useState('idle'), [error, setError] = useState('')
  const [hands, setHands] = useState(0), [fps, setFps] = useState(0)
  const [color, setColor] = useState(colors[0].value), [count, setCount] = useState(1600)
  const [trail, setTrail] = useState(65), [preview, setPreview] = useState(true)

  const [loadingMessage, setLoadingMessage] = useState('Kameraga ruxsat bering.')
  const [cameras, setCameras] = useState([]), [cameraId, setCameraId] = useState('')

  function dispose() {
    session.current?.stop()
    session.current = null
    scene.current?.setHands([])
  }
  useEffect(() => {
    scene.current = new ParticleScene(canvas.current)
    return () => { dispose(); scene.current.destroy() }
  }, [])
  useEffect(() => { scene.current.setOptions({ color, count, trail }) }, [color, count, trail])

  function stop() { dispose(); setStatus('idle'); setHands(0); setFps(0) }
  function start() {
    if (session.current) return
    setError('')
    const current = new CameraSession(video.current, {
      cameraError,
      loading: message => { setLoadingMessage(message); setStatus('loading') },
      ready: () => setStatus('running'),
      aspect: aspect => { scene.current.aspect = aspect },
      cameras: setCameras,
      hands: detected => { scene.current.setHands(detected); setHands(detected.length) },
      fps: setFps,
      error: message => { session.current = null; scene.current.setHands([]); setHands(0); setFps(0); setStatus('error'); setError(message) },
    })
    session.current = current
    current.start(cameraId)
  }
  const active = status === 'running', loading = status === 'loading'
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="./"><span className="brand-mark">✳</span> zarra<span className="brand-dot">.</span></a>
        <span className="top-label">HARAKATDAN YARALGAN SAN’AT</span>
        <span className="local-badge"><i /> Brauzeringizda ishlaydi</span>
      </header>
      <section className="intro">
        <div><p className="eyebrow">INTERAKTIV ZARRALAR TAJRIBASI</p><h1>Har bir harakat — <em>bir olam zarra.</em></h1><p className="subtitle">Qo‘lingizni kameraga tuting. Zarralar harakatingizga ergashsin.</p></div>
        <div className="edition">HAND TRACKING<br /><span>01 / LIVE EXPERIMENT</span></div>
      </section>
      <div className="workspace">
        <section className="stage" aria-label="Qo‘l harakatiga ergashuvchi zarralar">
          <canvas ref={canvas} />
          <div className="stage-top"><span className={`status-pill ${active ? 'live' : ''}`}><i />{loading ? 'Tayyorlanmoqda' : active ? (hands ? 'Qo‘l kuzatilmoqda' : 'Qo‘lingizni ko‘rsating') : 'Tajriba maydoni'}</span><span className="stage-code">Z / PARTICLE FIELD</span></div>
          {!active && <div className="stage-message"><span className="hand-symbol">✋</span><h2>{loading ? 'Sehr boshlanmoqda…' : 'Harakatni yorug‘likka aylantiring'}</h2><p>{loading ? loadingMessage : 'Kamerani yoqing va kaftingizni ochib ko‘rsating.'}</p>{!loading && <button className="primary" onClick={start}>Kamerani yoqish <span>↗</span></button>}</div>}
          {active && hands === 0 && <div className="tracking-hint">Kaftingizni kamera qarshisida oching</div>}
          <div className={`camera-preview ${!preview || (!active && !loading) ? 'hidden-preview' : ''}`}><video ref={video} autoPlay muted playsInline /><span><i /> KAMERA</span></div>
          <div className="stage-bottom"><span><i /> {active ? 'JONLI HARAKAT' : 'SIZNING HARAKATINGIZNI KUTMOQDA'}</span><span>{active ? `${hands} QO‘L · ${fps} FPS` : 'REAL-TIME / 2D'}</span></div>
        </section>
        <aside className="controls">
          <div className="panel-heading"><span className="eyebrow">BOSHQARUV</span><span>↗</span></div>
          <h2>O‘z oqimingizni yarating</h2><p className="panel-description">Rang va zarralarni o‘zingizga moslang.</p>
          {cameras.length > 1 && <div className="control-group"><label htmlFor="camera">Kamera</label><select id="camera" value={cameraId} onChange={event => { stop(); setCameraId(event.target.value) }}><option value="">Avtomatik tanlash</option>{cameras.map((camera, index) => <option key={camera.deviceId} value={camera.deviceId}>{camera.label || ('Kamera ' + (index + 1))}</option>)}</select><p className="camera-help">Kamerani tanlab, qayta yoqing.</p></div>}
          <div className="control-group"><label>Zarralar rangi <span>{colors.find(item => item.value === color).name}</span></label><div className="swatches">{colors.map(item => <button key={item.value} aria-label={item.name} aria-pressed={color === item.value} className={color === item.value ? 'selected' : ''} style={{ '--swatch': item.value }} onClick={() => setColor(item.value)}>{color === item.value ? '✓' : ''}</button>)}</div></div>
          <div className="control-group"><label htmlFor="count">Zarralar soni <span>{count.toLocaleString('en-US')}</span></label><input id="count" type="range" min="400" max="2800" step="100" value={count} onChange={event => setCount(Number(event.target.value))} /><div className="range-ends"><span>Yengil</span><span>Zich</span></div></div>
          <div className="control-group"><label htmlFor="trail">Harakat izi <span>{trail}%</span></label><input id="trail" type="range" min="0" max="95" value={trail} onChange={event => setTrail(Number(event.target.value))} /><div className="range-ends"><span>Qisqa</span><span>Uzun</span></div></div>
          <label className="toggle-row" htmlFor="preview">Kamera ko‘rinishi <input id="preview" type="checkbox" checked={preview} onChange={event => setPreview(event.target.checked)} /><span className="switch" /></label>
          <div className="session-action">{active || loading ? <button className="stop-button" onClick={stop}><span>■</span> {loading ? 'Bekor qilish' : 'Kamerani to‘xtatish'}</button> : <button className="primary" onClick={start}>Kamerani yoqish <span>↗</span></button>}</div>
          <p className="privacy">◈ Kamera tasviri qurilmangizda qoladi. Video yozib olinmaydi va serverga yuborilmaydi.</p>
        </aside>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <section className="instructions"><div><span>01</span><p><strong>Kamerani yoqing</strong>Brauzerda kameraga ruxsat bering.</p></div><div><span>02</span><p><strong>Kaftingizni ko‘rsating</strong>Yorug‘ joyda bir yoki ikki qo‘lingizni tuting.</p></div><div><span>03</span><p><strong>Harakat bilan yarating</strong>Barmoqlaringizni oching va qo‘lingizni siljiting.</p></div></section>
      <footer><span>zarra. <span className="footer-muted">Kichik harakat. Cheksiz imkoniyat.</span></span><a href="https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js" target="_blank" rel="noreferrer">MediaPipe bilan yaratilgan ↗</a></footer>
    </main>
  )
}
export default App
