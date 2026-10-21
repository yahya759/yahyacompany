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
| البيئة | كلمة المرور |
|---|---|
| تطوير (`npm run dev` / `NODE_ENV !== production`) | **`123456`** (افتراضية إذا `APP_PASSWORD` فاضي) |
| إنتاج (`npm start`) | لازم تحدد `APP_PASSWORD` في البيئة، وإلا الـ API يرد `503` |

المقارنة تتم في السيرفر فقط (`server.ts`) ولا تُخزَّن كلمة المرور في Supabase ولا في الكود للإنتاج. التوكن صالح 7 أيام ويُوقَّع بـ `SESSION_SECRET` (أو `APP_PASSWORD` إذا لم يُحدَّد).
قاعدة البيانات: `supabase/migrations/0001_core_tables.sql`.

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
