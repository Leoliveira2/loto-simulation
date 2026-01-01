"use client";

import Link from "next/link";
import { isAuthed } from "../lib/auth";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export default function Home() {
  const authed = isAuthed();

  return (
    <main className="space-y-6">
      <Card>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Simulador LOTO</h1>
          <p className="text-sm text-gray-600">
            Execução de cenários com trilha de eventos (event log) e histórico por usuário.
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          {authed ? (
            <>
              <Link href="/scenarios"><Button>Ver cenários</Button></Link>
              <Link href="/history"><Button variant="ghost">Meu histórico</Button></Link>
            </>
          ) : (
            <Link href="/login"><Button>Entrar</Button></Link>
          )}
        </div>
      </Card>
    </main>
  );
}
