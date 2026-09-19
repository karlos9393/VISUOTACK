export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Chargement des tâches"
      className="space-y-6 motion-safe:animate-pulse"
    >
      <div className="h-10 w-44 rounded-xl bg-gray-200" />
      <div className="h-[620px] rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6 h-8 w-1/3 rounded bg-gray-100" />
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="mb-3 h-16 rounded-xl bg-gray-50" />
        ))}
      </div>
      <span className="sr-only">Chargement des tâches…</span>
    </div>
  )
}
