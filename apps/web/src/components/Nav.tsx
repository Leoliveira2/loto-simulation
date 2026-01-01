"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getUser, isAuthed } from "../lib/auth";
import { Button } from "./Button";

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const user = getUser();

  const linkCls = (href: string) =>
    `text-sm ${path === href ? "font-semibold text-black" : "text-gray-600 hover:text-black"}`;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-semibold">LOTO Sim</Link>
        {isAuthed() && (
          <>
            <Link className={linkCls("/scenarios")} href="/scenarios">Cenários</Link>
            <Link className={linkCls("/history")} href="/history">Histórico</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isAuthed() && <span className="text-xs text-gray-600">{user?.email}</span>}
        {isAuthed() ? (
          <Button
            variant="ghost"
            onClick={() => {
              clearAuth();
              router.push("/login");
            }}
          >
            Sair
          </Button>
        ) : (
          <Link className="text-sm text-gray-600 hover:text-black" href="/login">Entrar</Link>
        )}
      </div>
    </div>
  );
}
