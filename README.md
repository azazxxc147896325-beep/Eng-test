# Score Quest

PWA สำหรับฝึก TOEIC Listening & Reading พร้อมคะแนนประมาณการและการวิเคราะห์จุดอ่อน

## Requirements

- Node.js 22 ขึ้นไป
- npm 10 ขึ้นไป
- บัญชีและโปรเจกต์บน Supabase Cloud
- Supabase CLI (ไม่ต้องติดตั้ง Docker)

## Commands

```bash
npm install
npm run dev
npm test -- --run
npm run typecheck
npm run build
npm run test:e2e
```

## เชื่อม Supabase Cloud

1. สร้างโปรเจกต์ที่ Supabase แล้วคัดลอกไฟล์ตั้งค่า

```bash
cp .env.example .env.local
```

2. ใส่ `Project URL` และ `Publishable key` จาก **Project Settings > API** ใน `.env.local`

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

3. เชื่อม CLI และส่ง schema/Edge Functions ขึ้น Cloud

```bash
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
npx supabase functions deploy create-attempt
npx supabase functions deploy submit-attempt
npx supabase functions deploy generate-question
```

คำสั่งเหล่านี้ใช้ Supabase Cloud โดยตรง ไม่ต้องเปิด Docker

## Google Login

เปิด Google provider ที่ **Authentication > Providers > Google** ใน Supabase Dashboard แล้วตั้งค่า Site URL และ Redirect URL ให้ตรงกับโดเมนเว็บ คีย์ลับของ Google ให้กรอกใน Dashboard เท่านั้น

## API สำหรับสร้างข้อสอบด้วย AI

ยังไม่ต้องใส่ตอนนี้ ภายหลังให้เก็บ `GEMINI_API_KEY` เป็น Edge Function secret:

```bash
npx supabase secrets set GEMINI_API_KEY=YOUR_KEY GEMINI_MODEL=gemini-2.5-flash APP_ORIGIN=https://YOUR_DOMAIN
```

ตัวแปร `VITE_*` ถูกส่งไปยัง browser จึงใช้ได้เฉพาะค่าที่เปิดเผยได้ เช่น Supabase URL และ publishable key ห้ามเก็บ `GEMINI_API_KEY`, Google OAuth client secret หรือ Supabase service-role key ในตัวแปร `VITE_*`
