# Zarra

React + Vite dasturi: noutbuk kamerasi orqali bir yoki ikki qo‘lni kuzatadi va kaft hamda barmoqlar harakatini Canvas zarralari bilan takrorlaydi.

## Ishga tushirish

```sh
npm install
npm run dev
```

Terminaldagi localhost manzilini oching (odatda http://localhost:5173).
**Kamerani yoqish** tugmasini bosing va brauzerda kameraga ruxsat bering.
Yorug‘ joyda qo‘lingizni to‘liq kamera qarshisida tuting. Ikkala qo‘lni ham kuzatish mumkin.

- Rang, zarralar soni (400–2800) va harakat izi sozlanadi.
- Kamera ko‘rinishini yashirish kuzatishni davom ettiradi.
- **Kamerani to‘xtatish** kamera oqimi va aniqlash workerini yopadi.
- Ruxsatni kutish yoki model yuklanishi paytida ham bekor qilish mumkin.
- Qo‘l ko‘rinmasa, zarralar kutish animatsiyasiga qaytadi.

Kamera localhost yoki HTTPS manzilida ishlaydi. HTTP tarmoq IP manzilida brauzer kamerani bloklashi mumkin. Kamera tasviri brauzerning o‘zida qayta ishlanadi; yozib olinmaydi yoki serverga uzatilmaydi. Barcha model va WASM fayllari loyiha ichidan yuklanadi. Dastur ochilganda tashqi CDN talab qilinmaydi.

## Tekshiruvlar

```sh
npm run lint
npm run build
npm test
```

Brauzer testlari o‘rnatilgan Google Chrome’dan foydalanadi. Testlarda haqiqiy kamera o‘rniga MediaPipe rasmiy namunasidagi fotosuratdan video oqimi yaratiladi va haqiqiy model bilan qo‘l aniqlanishi tekshiriladi. Shuningdek, mobil ko‘rinish, sozlamalar, kamera ruxsatining rad etilishi, to‘xtatishda kamera yopilishi va ruxsat kutilayotganda bekor qilish tekshiriladi.

Yig‘ilgan buildni tekshirish (PowerShell):

```powershell
npm run build
$env:TEST_PREVIEW='1'
npm test
Remove-Item Env:TEST_PREVIEW
```

```sh
npm run preview
```

## Tuzilishi

- `src/App.jsx` — kamera sessiyasi va boshqaruvlar.
- `src/tracking.worker.js` — MediaPipe Hand Landmarker; aniqlash alohida workerda bajariladi.
- `src/particles.js` — zarralar, kaft va barmoq shakllari, harakat izi.
- `public/models/hand_landmarker.task` — loyiha bilan birga saqlangan Google modeli.
- `scripts/copy-wasm.mjs` — paketning mos WASM fayllarini install, dev va build oldidan `public/wasm` ichiga ko‘chiradi.

## Manbalar

- [MediaPipe Hand Landmarker hujjatlari](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)
- [Google modeli](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task)
- [Test rasmi va manbasi](tests/fixtures/README.md)
