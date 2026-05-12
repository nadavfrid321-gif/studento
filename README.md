# Studento

מעקב משימות, קריאות, בחנים ומבחנים לסטודנטים לתואר משולב משפטים + כלכלה.
PWA בעברית RTL, נבנה על React + Vite + TypeScript + Tailwind + Supabase + Claude.

## פיצ'רים

- **תיקייה לכל קורס** עם משימות, קבצים וסיכומים. הפרדה ויזואלית בין משפטים (כחול) לכלכלה (ירוק).
- **תזכורות push** אוטומטיות 7 / 3 / 1 ימים לפני כל deadline + ביום ההגשה.
- **ייבוא AI** של משימות מצילום מסך, תמונה, PDF (סילבוס) או טקסט מודבק — Claude מחלץ סוג, כותרת, תאריך, משקל וממלא טופס לאישור.
- **לוח שנה** עם תאריכים גרגוריאניים + עבריים (`@hebcal/core`).
- **לוח בקרה** עם סטטיסטיקות, באיחור, השבוע, מבחנים קרובים.
- **התקנה למסך הבית** (PWA) על אנדרואיד / iOS / דסקטופ.
- **התחברות עם Google** (Bar-Ilan / אישי).

---

## הקמה מקומית

### 1. דרישות
- Node 20+
- חשבון Supabase (חינמי): https://supabase.com
- חשבון Anthropic + API key לפיצ'ר ייבוא: https://console.anthropic.com

### 2. התקנה
```bash
npm install
cp .env.example .env.local
```

### 3. הקמת פרויקט Supabase
1. ב-https://supabase.com/dashboard → New project. צור כל פרטים.
2. **Settings → API**: העתק `Project URL` ו-`anon public key` → הדבק ב-`.env.local` כ-`VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY`.
3. **Authentication → Providers → Google**: הפעל, הגדר Client ID + Secret של Google Cloud Console (https://console.cloud.google.com → APIs → Credentials → OAuth 2.0). Redirect URL → המסך יציג אחד, הדבק אצל גוגל.
4. **SQL Editor**: הדבק את `supabase/migrations/0001_init.sql` → Run.
5. (אופציונלי, נדרש ל-CLI) `npm i -g supabase` → `supabase login` → `supabase link --project-ref <ref>`.

### 4. תזכורות push (אופציונלי בפיתוח)
```bash
npx web-push generate-vapid-keys
```
- הדבק את ה-public key ב-`.env.local` כ-`VITE_VAPID_PUBLIC_KEY`.
- הגדר את ה-secrets ב-Supabase (לצורך הפונקציה הצדדית):
```bash
supabase secrets set VAPID_PUBLIC_KEY=...
supabase secrets set VAPID_PRIVATE_KEY=...
supabase secrets set VAPID_SUBJECT=mailto:youremail@example.com
```
- פריסת הפונקציה: `supabase functions deploy send-reminders --no-verify-jwt`
- תזמון יומי דרך pg_cron (SQL Editor):
```sql
select cron.schedule(
  'studento-daily-reminders',
  '0 6 * * *', -- 06:00 UTC = 08:00 שעון ישראל
  $$select net.http_post(
    url := 'https://<PROJECT-REF>.functions.supabase.co/send-reminders',
    headers := '{"content-type": "application/json"}'::jsonb
  );$$
);
```

### 5. פיצ'ר ייבוא AI
- ב-Anthropic Console צור API key.
- הגדר ב-Supabase: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
- פריסה: `supabase functions deploy extract-task`

### 6. הרצה
```bash
npm run dev
```
פתח את http://localhost:5173 → התחבר עם גוגל. הקורסים של הסמסטר ייוצרו אוטומטית בכניסה הראשונה.

---

## פריסה ל-Netlify

1. דחוף את הריפו ל-GitHub.
2. ב-Netlify → New site from Git → בחר את הריפו.
3. הגדרות בנייה (אוטומטי מ-`netlify.toml`): build = `npm run build`, publish = `dist`.
4. Environment variables: הוסף את 3 ה-`VITE_*` של `.env.local`.
5. ב-Supabase Auth Settings → Site URL = ה-URL של Netlify, ו-Additional Redirect URLs כולל את ה-URL הזה.

`netlify.toml` כבר מוכן עם redirect ל-`/` עבור SPA.

---

## אייקוני PWA

`favicon.svg` קיים כברירת מחדל. להתקנה איכותית במיוחד ב-iOS, גנרציה של PNG ב-https://realfavicongenerator.net → שמירה ב-`public/icons/` → עדכון `vite.config.ts → manifest.icons`.

---

## מבנה ספריות

```
src/
├── components/
│   ├── course/      — כרטיסי קורס, טאבים לפי פקולטה
│   ├── task/        — TaskCard, TaskForm, ImportTaskDialog (ייבוא AI)
│   ├── layout/      — NavDrawer, TopBar, BottomNav, Fab
│   └── ui/          — Icon, Spinner
├── hooks/           — useAuth, useCourses, useTasks, useFiles, useNotes, useSeedCourses
├── lib/             — supabase, push, dates (date-fns + hebcal), labels, extract
├── pages/           — Login, Dashboard, Courses, CourseDetail, Calendar, Notifications, Settings, TaskDetail
└── sw.ts            — Service Worker (Push handler)

supabase/
├── migrations/0001_init.sql   — schema + RLS + storage bucket
├── functions/
│   ├── send-reminders/        — daily push reminders (Deno + web-push)
│   └── extract-task/          — Claude vision task extraction
└── config.toml
```

---

## בדיקה end-to-end

ראה את התוכנית המלאה ב-`C:\Users\nadav\.claude\plans\async-baking-lerdorf.md` (סעיף Verification).
