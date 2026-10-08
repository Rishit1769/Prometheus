import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "PROMETHEUS", description: "Intelligence should inherit intelligence." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
