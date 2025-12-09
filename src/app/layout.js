import './globals.css';

export const metadata = {
  title: 'ניהול תקציב - חנות מספר לחיות',
  description: 'מערכת ניהול תקציב לחנות מספר לחיות',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
