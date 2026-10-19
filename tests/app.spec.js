import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

test('controls and responsive layout', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Binafsha', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Binafsha', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.locator('#count').fill('2400')
  await expect(page.getByText('2,400', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'test-results/desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true })
  expect(errors).toEqual([])
})

test('camera permission error is actionable', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError') }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Kamerani yoqish' }).first().click()
  await expect(page.getByRole('alert')).toContainText('Kameraga ruxsat berilmadi')
  await expect(page.getByRole('button', { name: 'Kamerani yoqish' }).first()).toBeVisible()
})

test('real model tracks a sample hand and stop releases the stream', async ({ page }) => {
  const image = readFileSync(new URL('./fixtures/hands.jpg', import.meta.url)).toString('base64')
  await page.addInitScript(({ image }) => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 640; canvas.height = 480
      const context = canvas.getContext('2d')
      const sample = new Image()
      sample.src = `data:image/jpeg;base64,${image}`
      await sample.decode()
      const paint = () => {
        context.fillStyle = '#fff'; context.fillRect(0, 0, 640, 480)
        const scale = Math.min(640 / sample.width, 480 / sample.height)
        context.drawImage(sample, (640 - sample.width * scale) / 2, (480 - sample.height * scale) / 2, sample.width * scale, sample.height * scale)
      }
      paint()
      const timer = setInterval(paint, 33)
      const stream = canvas.captureStream(30)
      window.testStream = stream
      const track = stream.getTracks()[0], stop = track.stop.bind(track)
      track.stop = () => { clearInterval(timer); stop() }
      return stream
    }
  }, { image })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Kamerani yoqish' }).first().click()
  await expect(page.locator('.status-pill')).toHaveText('Qo‘l kuzatilmoqda', { timeout: 60000 })
  await expect(page.locator('.stage-bottom')).toContainText(/[12] QO‘L/)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'test-results/tracking.png' })
  await page.locator('#preview').uncheck()
  await expect(page.locator('.camera-preview')).toHaveClass(/hidden-preview/)
  await page.getByRole('button', { name: 'Kamerani to‘xtatish' }).click()
  expect(await page.evaluate(() => window.testStream.getTracks().every(track => track.readyState === 'ended'))).toBeTruthy()
  await expect(page.getByRole('button', { name: 'Kamerani yoqish' }).first()).toBeVisible()
  expect(errors).toEqual([])
})

test('cancel while waiting for permission releases a late camera stream', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => new Promise(resolve => {
      window.resolveCamera = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 640; canvas.height = 480
        window.testStream = canvas.captureStream(30)
        resolve(window.testStream)
      }
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Kamerani yoqish' }).first().click()
  await page.getByRole('button', { name: 'Bekor qilish' }).click()
  await page.evaluate(() => window.resolveCamera())
  await expect.poll(() => page.evaluate(() => window.testStream.getTracks()[0].readyState)).toBe('ended')
  await expect(page.locator('.status-pill')).toHaveText('Tajriba maydoni')
})
