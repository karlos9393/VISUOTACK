// Écran de chargement commun au dashboard : il s'affiche dès le clic sur un lien
// (préchargé avec la sidebar), pendant que le serveur prépare la page.
export default function Loading() {
  return (
    <div role="status" aria-label="Chargement" className="space-y-6 motion-safe:animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-xl bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((card) => (
          <div key={card} className="h-24 rounded-2xl border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-6 h-6 w-1/3 rounded bg-gray-100" />
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="mb-3 h-10 rounded-xl bg-gray-50" />
        ))}
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  )
}
