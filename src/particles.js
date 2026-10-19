const bones = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]]
const palms = [[0, 1, 5], [0, 5, 9], [0, 9, 13], [0, 13, 17]]
export class ParticleScene {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d')
    this.hands = []; this.color = '#79ffd4'; this.trail = 65; this.particles = []
    this.width = 1; this.height = 1; this.previous = 0; this.aspect = 4 / 3
    this.resize = new ResizeObserver(([entry]) => {
      this.width = entry.contentRect.width; this.height = entry.contentRect.height
      const ratio = Math.min(devicePixelRatio || 1, 2)
      canvas.width = this.width * ratio; canvas.height = this.height * ratio
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    })
    this.resize.observe(canvas)
    this.setOptions({ count: 1600 })
    this.draw = this.draw.bind(this)
    this.frame = requestAnimationFrame(this.draw)
  }
  setOptions({ color, count, trail }) {
    if (color) this.color = color
    if (trail !== undefined) this.trail = trail
    if (count !== undefined) {
      while (this.particles.length < count) this.particles.push({ x: Math.random(), y: Math.random(), seed: Math.random(), u: Math.random(), v: Math.random(), size: 0.5 + Math.random() * 1.3 })
      this.particles.length = count
    }
  }
  setHands(hands) { this.hands = hands }
  draw(time) {
    const dt = Math.min((time - (this.previous || time - 16)) / 16.67, 3)
    this.previous = time
    const { ctx, width: w, height: h } = this
    if (!w || !h) { this.frame = requestAnimationFrame(this.draw); return }
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(8, 17, 19, ${1 - this.trail / 100})`; ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    const viewW = Math.min(w * 0.93, h * this.aspect * 0.97), viewH = viewW / this.aspect
    const project = point => ({ x: (w - viewW) / 2 + (1 - point.x) * viewW, y: (h - viewH) / 2 + point.y * viewH })
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]
      let x, y
      const hand = this.hands[i % this.hands.length]
      if (hand) {
        if (particle.seed < 0.76) {
          const [a, b] = bones[Math.floor(particle.u * bones.length)], p = project(hand[a]), q = project(hand[b])
          x = p.x + (q.x - p.x) * particle.v; y = p.y + (q.y - p.y) * particle.v
        } else {
          const [a, b, c] = palms[Math.floor(particle.u * palms.length)]
          const p = project(hand[a]), q = project(hand[b]), r = project(hand[c])
          const u = Math.sqrt(particle.v), v = (particle.seed - 0.76) / 0.24
          x = (1 - u) * p.x + u * (1 - v) * q.x + u * v * r.x
          y = (1 - u) * p.y + u * (1 - v) * q.y + u * v * r.y
        }
        const jitter = 1.5 + particle.seed * 3
        x += Math.sin(time * 0.002 + i) * jitter; y += Math.cos(time * 0.0016 + i) * jitter
      } else {
        const angle = particle.u * Math.PI * 2 + time * 0.00008 * (particle.seed > 0.5 ? 1 : -1)
        const radius = Math.min(w, h) * (0.16 + particle.v * 0.22)
        x = w / 2 + Math.cos(angle) * radius * 1.35
        y = h / 2 + Math.sin(angle) * radius * 0.8 + Math.sin(angle * 3 + time * 0.0004) * 18
      }
      const ease = 1 - Math.pow(hand ? 0.68 : 0.95, dt)
      particle.x += (x / w - particle.x) * ease; particle.y += (y / h - particle.y) * ease
      ctx.globalAlpha = hand ? 0.45 + particle.seed * 0.55 : 0.12 + particle.seed * 0.3
      ctx.fillStyle = this.color; ctx.beginPath()
      ctx.arc(particle.x * w, particle.y * h, particle.size * (hand ? 1 : 0.7), 0, Math.PI * 2); ctx.fill()
      if (hand && particle.seed > 0.97) {
        ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.arc(particle.x * w, particle.y * h, particle.size * 5, 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    this.frame = requestAnimationFrame(this.draw)
  }
  destroy() { cancelAnimationFrame(this.frame); this.resize.disconnect() }
}
