import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cart2Class Portal",
  description: "A.L.M.A. learning portal for families, educators, partners, and administrators.",
  icons: { icon: "/favicon.ico" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
