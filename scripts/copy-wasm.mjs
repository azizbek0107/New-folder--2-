import { cpSync, mkdirSync } from 'node:fs'
mkdirSync(new URL('../public/wasm/', import.meta.url), { recursive: true })
cpSync(new URL('../node_modules/@mediapipe/tasks-vision/wasm/', import.meta.url), new URL('../public/wasm/', import.meta.url), { recursive: true })
console.log('MediaPipe WASM files copied to public/wasm')
