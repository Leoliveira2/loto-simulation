export function Loading({ label = "Carregando..." }: { label?: string }) {
  return <div className="text-sm text-gray-600">{label}</div>;
}
