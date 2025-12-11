import "../../styles/globals.css";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="w-full h-full">{children}</div>;
}
