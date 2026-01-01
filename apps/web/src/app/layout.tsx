import "./globals.css";
import { Nav } from "../components/Nav";

export const metadata = { title: "LOTO Simulator" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        <div className="mx-auto max-w-4xl px-4">
          <Nav />
          {children}
          <div className="py-10 text-xs text-gray-400">MVP — LOTO com histórico</div>
        </div>
      </body>
    </html>
  );
}
