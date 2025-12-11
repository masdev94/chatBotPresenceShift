import "../../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Admin Panel - Presence Shift Companion",
  description:
    "Admin configuration panel for managing Presence Shift rituals and versions",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚙️</text></svg>",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </head>
      <body className=" text-slate-900 antialiased">
        <div className="w-full h-full">{children}</div>
      </body>
    </html>
  );
}
