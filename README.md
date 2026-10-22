# Problem2Client Dashboard

لوحة تحكم لإيجاد مشاكل أعمال حقيقية، بناء حل لها، إيجاد عملاء مناسبين، وكتابة رسائل تواصل. **كل شيء داخل الموقع (بدون n8n)**، والإرسال يدوي.

```
المتصفح ──► Cloudflare Worker (/api/*) ──► Supabase (جداول)
                    │  cron كل دقيقة
                    ├──► Apify  (Reddit / Google Search / Google Maps)
                    └──► OpenRouter (موديلات مجانية بالتسلسل مع fallback)
```

## الإعداد (Cloudflare → Settings → Variables and Secrets)
| الاسم | النوع | ملاحظة |
|---|---|---|
| `SUPABASE_URL` | Text | |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | |
| `APIFY_TOKEN` | Secret | |
| `OPENROUTER_API_KEY` | Secret | |
| `OPENROUTER_MODELS` | Text | اختياري، قائمة مفصولة بفاصلة بترتيب الأولوية؛ الفارغ = أحدث الموديلات المجانية تلقائياً |
| `APIFY_MAX_COST_USD` | Text | اختياري، سقف تكلفة لكل تشغيل (الافتراضي 0.5) |

حماية الموقع: ضعه خلف Cloudflare Access (الـ API بدون كلمة مرور).

## كيف يعمل
- زر التشغيل ينشئ صف في `jobs`؛ الـ cron (كل دقيقة) أو أي تحديث للصفحة يقدّم المهمة خطوة خطوة.
- المهام: رادار المشاكل، بناء الحل، إيجاد عملاء، كتابة رسالة، كتابة المتابعات.
- الرسائل: «فتح المحادثة + نسخ» (واتساب/إيميل/تليجرام) ثم «تم الإرسال» يدوياً.
- الحدّ اليومي لموديلات OpenRouter المجانية قليل (50 طلب/يوم بدون رصيد)، لذلك كل طلب يحلّل دفعة من النتائج.

## تطوير
```bash
cp .dev.vars.example .dev.vars   # املأ القيم
npm install
npm run dev                      # wrangler dev
npm run test:pipeline            # اختبار الـ pipeline بمحاكاة Supabase/Apify/OpenRouter
```
قاعدة البيانات: `supabase/migrations/`.

## الاكتشاف التلقائي
صفحة «اكتشاف تلقائي» فيها 3 أزرار بدون كلمات بحث:
- **أنشطة بدون موقع**: خرائط Google (فلتر `withoutWebsite`) + لازم رقم هاتف.
- **أنشطة بتقييم ضعيف**: تقييم ≤ 3.8 و≥ 5 مراجعات، مع اقتباس شكوى حقيقية. لا تستهلك طلبات LLM.
- **مشاكل السوق العربي (AI والأتمتة)**: بحث Google + Reddit بصيغ عربية وإنجليزية، ثم استخراج المشاكل بالـ LLM.
