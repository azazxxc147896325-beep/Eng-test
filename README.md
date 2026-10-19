# Score Quest

PWA สำหรับฝึก TOEIC Listening & Reading พร้อมคะแนนประมาณการและการวิเคราะห์จุดอ่อน

## Requirements

- Node.js 22 ขึ้นไป
- npm 10 ขึ้นไป
- Supabase CLI สำหรับงานฐานข้อมูลในขั้นถัดไป

## Commands

```bash
npm install
npm run dev
npm test -- --run
npm run typecheck
npm run build
npm run test:e2e
```

คัดลอก `.env.example` เป็น `.env.local` เมื่อตั้งค่า Supabase แล้ว

ตัวแปร `VITE_*` ถูกส่งไปยัง browser จึงใช้ได้เฉพาะค่าที่เปิดเผยได้ เช่น Supabase URL และ publishable key ห้ามเก็บ `GEMINI_API_KEY`, Google OAuth client secret หรือ Supabase service-role key ในตัวแปร `VITE_*`
