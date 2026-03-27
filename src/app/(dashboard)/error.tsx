'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 max-w-md text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Une erreur est survenue</h2>
        <p className="text-sm text-gray-500 mb-4">
          {error.message || 'Quelque chose ne s\u2019est pas pass\u00e9 comme pr\u00e9vu.'}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">Ref: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          R\u00e9essayer
        </button>
      </div>
    </div>
  )
}
