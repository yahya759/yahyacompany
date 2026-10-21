# Problem2Client Dashboard

لوحة تحكم لنظام outreach المؤتمت: **Dashboard → Express API → n8n Webhook**، والنتائج تُقرأ من **Supabase**.

## تشغيل
```bash
cp .env.example .env   # املأ SUPABASE_SERVICE_ROLE_KEY و N8N_* و APP_PASSWORD
npm install
npm run dev            # http://localhost:3000
npm run build && npm start   # إنتاج
```
المتصفح لا يرى أي سر: كل الاتصال بـ Supabase و n8n يتم من `server.ts`.

### الدخول
لا توجد شاشة تسجيل دخول ولا كلمة مرور — اللوحة تفتح مباشرة.
كل مسارات `/api` عامة، فإن احتوت البيانات عملاء حقيقيين فاحمِ النطاق نفسه
(Cloudflare Access / Basic Auth / شبكة داخلية).

قاعدة البيانات: `supabase/migrations/0001_core_tables.sql`.

## النشر على Cloudflare Pages
اللوحة تعمل بالكامل على Cloudflare: الواجهة كملفات ثابتة + الـ API كـ Pages Functions
(`functions/api/[[path]].ts`) — لا حاجة لسيرفر Node.
1. Pages → Settings → Build & deployments: **Build command** `npm run build`، **Build output directory** `dist`، **Root** `/`، ومتغيّر بيئة `NODE_VERSION = 22.12.0`.
2. Environment variables: `SUPABASE_URL`، `SUPABASE_SERVICE_ROLE_KEY`، `N8N_WEBHOOK_URL`، `N8N_WEBHOOK_HEADER`، `N8N_WEBHOOK_SECRET`.
3. تحقّق: `GET https://<project>.pages.dev/api/health` يجب أن يرجّع JSON (`"ok":true`). لو رجّع HTML فالـ Functions لم تُبنَ.
4. `public/_redirects` يوجّه كل المسارات إلى `index.html` (SPA) مع بقاء `/api/*` للـ Functions.

بديل بدون Cloudflare: `npm run build && npm start` على أي استضافة Node (Railway/Render/VPS).

## عقد n8n (Main Flow)
`POST N8N_WEBHOOK_URL` مع header `N8N_WEBHOOK_HEADER: N8N_WEBHOOK_SECRET` والجسم `{ "action", "params" }`.
الـ Main Flow لازم: ينشئ صف في `jobs` (`action` + **`params` كما وصلت**، status=running) ويرد `{ "job_id": "..." }` فوراً.
الداش بورد يعتمد على `params` ليعرف أي مشكلة/عميل عليه مهمة جارية.

| action | params |
|---|---|
| find_problems | `keywords[]`, `sector`, `sources[]`, `market?`, `markets[]` |
| build_solution | `problem_id` |
| find_leads | `problem_id` |
| write_message | `lead_id` |
| send_message | `message_id` |
| write_followup | — |

عند الانتهاء: حدّث `jobs` (`done` + `finished_at`)، أو `failed` + `error`.
`problems.sector` يفضّل أن يكون أحد: `real-estate, ecommerce, fnb, healthcare, construction, services`، و`market`: `gulf | arabic | local`.
الإنستجرام والقنوات `other` يدوية: «نسخ الرسالة» ثم «تم الإرسال يدوياً».
