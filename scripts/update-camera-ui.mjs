import { readFileSync, writeFileSync } from 'node:fs'
const path = new URL('../src/App.jsx', import.meta.url)
let source = readFileSync(path, 'utf8')
source = source.replace("import './App.css'", "import './App.css'\nimport { CameraSession } from './camera-session'")
source = source.replace("  function dispose() {", "  const [loadingMessage, setLoadingMessage] = useState('Kameraga ruxsat bering.')\n  const [cameras, setCameras] = useState([]), [cameraId, setCameraId] = useState('')\n\n  function dispose() {")
const disposeStart = source.indexOf('    const current = session.current')
const disposeEnd = source.indexOf('    scene.current?.setHands([])', disposeStart)
source = source.slice(0, disposeStart) + '    session.current?.stop()\n    session.current = null\n' + source.slice(disposeEnd)
const start = source.indexOf('  async function start() {')
const end = source.indexOf('  const active =', start)
source = source.slice(0, start) + `  function start() {
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
` + source.slice(end)
source = source.replace("'Kamera va qo‘lni aniqlash modeli tayyorlanmoqda.'", 'loadingMessage')
source = source.replace("!preview || !active", "!preview || (!active && !loading)")
const panelPosition = source.indexOf('          <div className="control-group">')
source = source.slice(0, panelPosition) + `          {cameras.length > 1 && <div className="control-group"><label htmlFor="camera">Kamera</label><select id="camera" value={cameraId} onChange={event => { stop(); setCameraId(event.target.value) }}><option value="">Avtomatik tanlash</option>{cameras.map((camera, index) => <option key={camera.deviceId} value={camera.deviceId}>{camera.label || ('Kamera ' + (index + 1))}</option>)}</select><p className="camera-help">Kamerani tanlab, qayta yoqing.</p></div>}
` + source.slice(panelPosition)
writeFileSync(path, source)
