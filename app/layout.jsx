import "./globals.css";

export const metadata = {
  title: "ECS - Elite Cyber Squad",
  description: "ECS community platform for Fortnite and CS2 tournaments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
