import type { ReactNode } from "react";

export const metadata = {
  title: "GitHub Language Stats Card",
  description: "Generate a GitHub language stats card and Markdown snippet"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", color: "#111", background: "#fafafa", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
