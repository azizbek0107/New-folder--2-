import { createHandTracker } from './hand-tracker'

let detector
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      detector = await createHandTracker(data.base, true)
      self.postMessage({ type: 'ready' })
    } catch (error) {
      console.error('HandLandmarker initialization failed', error)
      self.postMessage({ type: 'error', message: 'Qo‘lni aniqlash modeli yuklanmadi. Sahifani yangilab, qayta urinib ko‘ring.' })
    }
  }
  if (data.type === 'frame') {
    try {
      const result = detector.detectForVideo(data.bitmap, data.timestamp)
      self.postMessage({ type: 'result', hands: result.landmarks })
    } catch (error) {
      console.error('HandLandmarker inference failed', error)
      self.postMessage({ type: 'error', message: 'Qo‘lni kuzatishda xatolik yuz berdi. Kamerani qayta yoqing.' })
    } finally { data.bitmap.close() }
  }
}
