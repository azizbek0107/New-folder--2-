import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

export async function createHandTracker(base, useModule = false) {
  const files = await FilesetResolver.forVisionTasks(`${base}wasm`, useModule)
  const options = { runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: 0.4, minHandPresenceConfidence: 0.4, minTrackingConfidence: 0.4 }
  try {
    return await HandLandmarker.createFromOptions(files, { ...options, baseOptions: { modelAssetPath: `${base}models/hand_landmarker.task`, delegate: 'GPU' } })
  } catch {
    return HandLandmarker.createFromOptions(files, { ...options, baseOptions: { modelAssetPath: `${base}models/hand_landmarker.task`, delegate: 'CPU' } })
  }
}
