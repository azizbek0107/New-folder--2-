// Own all camera/model resources, including those resolving after cancellation.
export class CameraSession {
  constructor(video, callbacks) {
    this.video = video
    this.callbacks = callbacks
    this.stopped = false
    this.busy = false
    this.lastTime = -1
    this.lastSent = 0
    this.frames = 0
    this.started = performance.now()
    this.tick = this.tick.bind(this)
  }
  stop() {
    this.stopped = true
    cancelAnimationFrame(this.frame)
    clearTimeout(this.timeout)
    clearTimeout(this.frameTimeout)
    this.worker?.terminate()
    this.worker = null
    this.detector?.close()
    this.detector = null
    this.stream?.getTracks().forEach(track => track.stop())
    if (this.video.srcObject === this.stream) this.video.srcObject = null
  }
  fail(message) {
    if (this.stopped) return
    this.stop()
    this.callbacks.error(message)
  }
  async start(cameraId) {
    this.callbacks.loading('Kameraga ruxsat bering.')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Kamera uchun localhost yoki HTTPS manzilida oching.')
      const stream = await navigator.mediaDevices.getUserMedia({ video: {
        ...(cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'user' }),
        width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 },
      }, audio: false })
      if (this.stopped) { stream.getTracks().forEach(track => track.stop()); return }
      this.stream = stream
      stream.getVideoTracks()[0].addEventListener('ended', () => this.fail('Kamera uzildi. Qayta ulab, kamerani yoqing.'))
      navigator.mediaDevices.enumerateDevices?.().then(devices => {
        if (!this.stopped) this.callbacks.cameras(devices.filter(device => device.kind === 'videoinput'))
      }).catch(() => {})
      this.video.srcObject = stream
      await this.video.play()
      if (this.stopped) return
      this.callbacks.aspect(this.video.videoWidth / this.video.videoHeight || 4 / 3)
      this.callbacks.loading('Qo‘lni aniqlash modeli yuklanmoqda…')
      this.base = new URL(import.meta.env.BASE_URL, location.href).href
      this.timeout = setTimeout(() => this.fallback(), 25000)
      try {
        this.worker = new Worker(new URL('./tracking.worker.js', import.meta.url), { type: 'module' })
        this.worker.onerror = () => this.fallback()
        this.worker.onmessage = ({ data }) => {
          if (this.stopped || this.fallbackStarted) return
          if (data.type === 'error') this.fallback()
          if (data.type === 'ready') this.ready()
          if (data.type === 'result') this.receive(data.hands)
        }
        this.worker.postMessage({ type: 'init', base: this.base })
      } catch { this.fallback() }
    } catch (error) { this.fail(this.callbacks.cameraError(error)) }
  }
  async fallback() {
    if (this.stopped || this.fallbackStarted) return
    this.fallbackStarted = true
    cancelAnimationFrame(this.frame)
    clearTimeout(this.timeout)
    clearTimeout(this.frameTimeout)
    this.worker?.terminate()
    this.worker = null
    this.busy = false
    this.lastTime = -1
    this.callbacks.loading('Mos kuzatish rejimiga o‘tilmoqda…')
    this.timeout = setTimeout(() => this.fail('Qo‘l modeli ishga tushmadi. Chrome yoki Edge’da sahifani qayta oching.'), 45000)
    try {
      const { createHandTracker } = await import('./hand-tracker')
      if (this.stopped) return
      const detector = await createHandTracker(this.base)
      if (this.stopped) { detector.close(); return }
      this.detector = detector
      this.ready()
    } catch { this.fail('Qo‘lni aniqlash modeli yuklanmadi. Chrome yoki Edge’da qayta urinib ko‘ring.') }
  }
  ready() {
    if (this.stopped) return
    clearTimeout(this.timeout)
    cancelAnimationFrame(this.frame)
    this.callbacks.ready()
    this.frame = requestAnimationFrame(this.tick)
  }
  receive(hands) {
    if (this.stopped) return
    clearTimeout(this.frameTimeout)
    this.busy = false
    this.callbacks.hands(hands)
    this.frames++
    const now = performance.now()
    if (now - this.started > 1000) {
      this.callbacks.fps(Math.round(this.frames * 1000 / (now - this.started)))
      this.frames = 0; this.started = now
    }
  }
  async tick(now) {
    if (this.stopped) return
    this.frame = requestAnimationFrame(this.tick)
    if (this.busy || this.video.readyState < 2 || this.video.currentTime === this.lastTime || now - this.lastSent < 33) return
    this.busy = true; this.lastTime = this.video.currentTime; this.lastSent = now
    try {
      if (this.detector) { this.receive(this.detector.detectForVideo(this.video, now).landmarks); return }
      const bitmap = await createImageBitmap(this.video)
      if (this.stopped || !this.worker) { bitmap.close(); return }
      this.frameTimeout = setTimeout(() => this.fallback(), 5000)
      this.worker.postMessage({ type: 'frame', bitmap, timestamp: now }, [bitmap])
    } catch {
      if (this.detector) this.fail('Kamera kadrini o‘qib bo‘lmadi. Kamerani qayta yoqing.')
      else this.fallback()
    }
  }
}
