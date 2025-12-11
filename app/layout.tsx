import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Presence Shift Companion",
  description:
    "A brief, science-based, 5-step Presence Shift® ritual to help you meet what's next in your day.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧘</text></svg>",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md md:max-w-lg h-screen md:h-[640px] md:rounded-3xl md:shadow-lg md:border md:border-slate-200 overflow-hidden bg-white">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
