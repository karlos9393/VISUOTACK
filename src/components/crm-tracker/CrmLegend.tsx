'use client'

import { KPI_DEFS } from '@/lib/crm-kpi'

export function CrmLegend() {
  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
        L&eacute;gende &mdash; Interpr&eacute;tation des r&eacute;sultats
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {KPI_DEFS.map((col) => (
          <div key={col.key} className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-sm mb-0.5 flex items-center gap-1.5">
              {col.label}
              {col.provisional && (
                <span className="text-[10px] font-medium uppercase tracking-wide text-primary bg-primary-soft rounded px-1.5 py-0.5">
                  provisoire
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 mb-2 italic">{col.subtitle}</p>
            <div className="space-y-1.5">
              {col.bands.map((rule) => (
                <div key={rule.threshold} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 flex-shrink-0 w-3 h-3 rounded-sm border border-gray-300"
                    style={{ backgroundColor: rule.color }}
                  />
                  <div>
                    <span className="text-xs font-semibold">{rule.threshold}</span>
                    <span className="text-xs text-gray-600"> &mdash; {rule.meaning}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400 italic leading-snug">{col.quote}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
