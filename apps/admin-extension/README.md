# N24:31 Dev AI Chrome Extension

Pending style-job'larni ChatGPT'ga tashlab, GPT bergan rasmni tez qaytarish uchun ichki admin yordamchisi.

## O'rnatish

1. Chrome'da `chrome://extensions/` ni ochish
2. Yuqori o'ngda **"Developer mode"** ni yoqish
3. **"Load unpacked"** ni bosib `apps/admin-extension/` papkasini tanlash
4. Toolbar'da N24:31 ikonka chiqadi — bosing, "Sozlamalarga o'tish" ni bosing
5. API URL (`http://localhost:4000/api/v1` yoki prod URL) + admin login (`@admin` / `admin123`) kiriting

## Oqim

1. **Toolbar badge** har ~45 soniyada yangilanadi — raqam = pending job soni
2. Yangi job kelganda OS bildirishnomasi chiqadi
3. Ikonka'ni bosib popup'da pending job'larni ko'rasiz
4. Har bir cardda:
   - **"Prompt'ni ko'chirish"** — clipboard'ga olinadi
   - **"ChatGPT'da ochish"** — yangi tab'da chatgpt.com + prompt clipboard'ga ko'chirilgan (job id saqlanadi)
5. ChatGPT sahifasida pastki o'ngda **floating card** chiqadi:
   - Prompt'ni paste qiling, hijob + manekin rasmlarni attach qiling, send bosing
   - GPT rasm chiqarganda **"Rasmni tanlash"** bosib tayyor rasm ustiga bosing — URL avto olinadi
   - **"Qaytarish"** bosganda rasm job'ga biriktiriladi (bu backend'da `styledImageUrl` ga yoziladi + sotuvchiga notification yuboriladi)

## Tuzilma

- `manifest.json` — Manifest V3, host permissions localhost + tunnel + chatgpt.com
- `background.js` — service worker: polling + badge + xabar yuborish
- `popup.html/.js/.css` — pending queue
- `options.html/.js` — admin login + API URL
- `content.js/.css` — chatgpt.com'da floating card

## Keyingi versiyalar

- Rasmni avtomatik qo'shish (file input'ga attachFile API — Chrome DOM injection cheklovlari bilan)
- Prompt'ni avtomatik yuborish (ChatGPT textarea'ga type + Enter)
- Multiple-image response (bir vaqtda bir nechta rasmdan tanlash)
- Natijani R2/S3 ga avtomatik yuklash (hozir URL manual kiritiladi)
