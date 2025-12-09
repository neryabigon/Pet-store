# מערכת ניהול תקציב - חנות מספר לחיות

מערכת לניהול תקציב לחנות מספר לחיות עם ממשק בעברית מלאה.

## תכונות

### ממשק מנהל
- 📊 **דשבורד** - סיכום הכנסות, הוצאות ורווחיות
- 📂 **קטגוריות** - ניהול קטגוריות הכנסה והוצאה
- 🚚 **ספקים** - ניהול רשימת ספקים
- 👥 **עובדים** - ניהול משתמשים ותעריפי שכר
- 🎯 **יעדים** - הגדרת יעדים חודשיים
- 💰 **מכירות** - צפייה בכל המכירות
- 💸 **הוצאות** - הזנת וצפייה בהוצאות
- ⏰ **משמרות** - מעקב שעות עבודה

### ממשק עובד
- הזנת סכום מכירות יומי לפי קטגוריה
- צפייה במכירות שהוזנו

## התקנה מקומית

```bash
# התקנת dependencies
npm install

# הרצה בפיתוח
npm run dev

# בנייה לפרודקשן
npm run build
npm start
```

## פרטי התחברות ראשוניים

- **שם משתמש:** admin
- **סיסמה:** admin123

## אפשרויות אירוח חינמי

### Railway.app (מומלץ)
1. צור חשבון ב-[Railway](https://railway.app)
2. צור פרויקט חדש מ-GitHub repo
3. Railway יזהה אוטומטית את Next.js
4. הוסף Persistent Volume עבור `/home/claude/pet-store-budget/data`

### Render.com
1. צור חשבון ב-[Render](https://render.com)
2. צור Web Service חדש
3. הוסף Disk לשמירת הדאטאבייס

### Vercel (דורש שינוי DB)
Vercel הוא serverless ולא תומך בקבצי SQLite.
עבור Vercel, יש להחליף ל:
- [Turso](https://turso.tech) - SQLite in the cloud (חינמי)
- [PlanetScale](https://planetscale.com) - MySQL (חינמי)
- [Supabase](https://supabase.com) - PostgreSQL (חינמי)

## מבנה הפרויקט

```
├── app/
│   ├── admin/          # דפי ממשק מנהל
│   ├── worker/         # דפי ממשק עובד
│   ├── api/            # API routes
│   ├── globals.css     # עיצוב גלובלי
│   ├── layout.js       # Layout ראשי
│   └── page.js         # דף התחברות
├── lib/
│   ├── db.js          # ניהול מסד נתונים
│   └── auth.js        # אימות משתמשים
├── data/              # מסד הנתונים (SQLite)
└── public/
```

## טכנולוגיות

- **Frontend:** Next.js 14, React 18
- **Database:** SQLite (sql.js)
- **Authentication:** JWT + HTTP-only cookies
- **Styling:** Custom CSS with RTL support

## רישיון

MIT
