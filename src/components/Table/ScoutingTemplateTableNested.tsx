import React, { useState } from "react"
import type { TemplateData } from "../../types/scoutingAggregated"

interface Props {
  templates: TemplateData[]
}


const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

// Компонент для отображения зоны с процентом
const ZoneBadge = ({ value, total, color, label, icon }: { 
  value: number, 
  total: number, 
  color: string, 
  label: string,
  icon: string 
}) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0"
  
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors">
      <span className="text-base">{icon}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
          <span className="text-xs text-stone-400 dark:text-stone-500">{label}</span>
        </div>
        <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">{percentage}%</span>
      </div>
    </div>
  )
}

// Улучшенный RiskBar с градиентом и glow
const RiskBar = ({ green, orange, red, total }: any) => {
  if (!total) return null

  const gPercent = (green / total) * 100
  const oPercent = (orange / total) * 100
  const rPercent = (red / total) * 100

  const formatPercent = (value: number) => value.toFixed(1)

  return (
    <div className="relative group w-full max-w-md">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800 shadow-inner">
        <div 
          style={{ width: `${gPercent}%` }} 
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 group-hover:from-emerald-500 group-hover:to-emerald-600 transition-all duration-300 relative"
          title={`Зеленая зона: ${green} (${formatPercent(gPercent)}%)`}
        />
        <div 
          style={{ width: `${oPercent}%` }} 
          className="bg-gradient-to-r from-amber-400 to-amber-500 group-hover:from-amber-500 group-hover:to-amber-600 transition-all duration-300"
          title={`Оранжевая зона: ${orange} (${formatPercent(oPercent)}%)`}
        />
        <div 
          style={{ width: `${rPercent}%` }} 
          className="bg-gradient-to-r from-rose-400 to-rose-500 group-hover:from-rose-500 group-hover:to-rose-600 transition-all duration-300"
          title={`Красная зона: ${red} (${formatPercent(rPercent)}%)`}
        />
      </div>
    
    </div>
  )
}

// Компактный бейдж для вложенных уровней
const CompactZoneBadge = ({ value, total, color, icon }: { 
  value: number, 
  total: number, 
  color: string,
  icon: string 
}) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0"
  
  return (
    <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800/30 rounded-md px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors">
      <span className="text-sm">{icon}</span>
      <span className={`text-sm font-medium tabular-nums ${color}`}>{value}</span>
      <span className="text-xs tabular-nums text-stone-400 dark:text-stone-500">({percentage}%)</span>
    </div>
  )
}

const ScoutingTemplateTableNested: React.FC<Props> = ({ templates }) => {
  const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set())
  const [expandedCrops, setExpandedCrops] = useState<Set<number>>(new Set())
  const [expandedMeasurements, setExpandedMeasurements] = useState<Set<number>>(new Set())

  const toggle = (set: Set<number>, setter: any, id: number) => {
    const next = new Set(set)
    next.has(id) ? next.delete(id) : next.add(id)
    setter(next)
  }

  return (
    <div className="bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl shadow-stone-200/20 dark:shadow-stone-950/30 overflow-hidden">
      
      {/* Премиум хедер с градиентом */}
      <div className="bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800 border-b border-stone-200 dark:border-stone-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Анализ рисков по зонам
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Распределение отчетов по зонам риска (зеленая ✅, оранжевая ⚠️, красная ❌)
            </p>
          </div>
          
          {/* Статистика сверху */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-stone-600 dark:text-stone-400">Низкий риск</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-stone-600 dark:text-stone-400">Средний риск</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-stone-600 dark:text-stone-400">Высокий риск</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Таблица с премиум стилями */}
      <div className="overflow-x-auto max-h-[800px] overflow-y-auto relative">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800">
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Название
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Распределение по зонам
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Всего отчетов
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {templates.map((template, index) => (
              <React.Fragment key={template.template_id}>
                {/* TEMPLATE ROW - Улучшенная карточка */}
                <tr className={`
                  group
                  border-l-4 border-transparent
                  hover:border-emerald-400
                  hover:bg-stone-50 dark:hover:bg-stone-900/40
                  transition-all duration-200
                  ${index === 0 ? 'bg-white dark:bg-stone-950' : 'bg-white dark:bg-stone-950'}
                `}>
                  <td className="px-4">
                    <button
                      onClick={() => toggle(expandedTemplates, setExpandedTemplates, template.template_id)}
                      className="p-1 rounded-md transition-all duration-200 
                               hover:bg-stone-200 dark:hover:bg-stone-800
                               text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    >
                      <div className={`transition-transform duration-200 ${
                        expandedTemplates.has(template.template_id) ? "rotate-90" : ""
                      }`}>
                        <ChevronRight />
                      </div>
                    </button>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {template.template_name}
                      </span>
                      <RiskBar {...template.stats} />
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ZoneBadge 
                        value={template.stats.green} 
                        total={template.stats.total}
                        color="text-emerald-600 dark:text-emerald-400" 
                        label="низкий"
                        icon="✅"
                      />
                      <ZoneBadge 
                        value={template.stats.orange} 
                        total={template.stats.total}
                        color="text-amber-600 dark:text-amber-400" 
                        label="средний"
                        icon="⚠️"
                      />
                      <ZoneBadge 
                        value={template.stats.red} 
                        total={template.stats.total}
                        color="text-rose-600 dark:text-rose-400" 
                        label="высокий"
                        icon="❌"
                      />
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                      {template.stats.total}
                    </span>
                  </td>
                </tr>

                {/* CROPS - с визуальной иерархией */}
                {expandedTemplates.has(template.template_id) && (
                  <>
                    {template.crops.map((crop) => (
                      <React.Fragment key={crop.crop_id}>
                        <tr className="
                          bg-stone-50/60 dark:bg-stone-900/30
                          border-l-2 border-stone-200 dark:border-stone-700
                          hover:bg-stone-100 dark:hover:bg-stone-900/50
                          transition-colors
                        ">
                          <td className="px-4 pl-8">
                            <button
                              onClick={() => toggle(expandedCrops, setExpandedCrops, crop.crop_id)}
                              className="p-1 rounded-md transition-all duration-200 
                                       hover:bg-stone-200 dark:hover:bg-stone-800
                                       text-stone-400"
                            >
                              <div className={`transition-transform duration-200 ${
                                expandedCrops.has(crop.crop_id) ? "rotate-90" : ""
                              }`}>
                                <ChevronRight />
                              </div>
                            </button>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-stone-200 dark:bg-stone-700 rounded-full flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-400">
                                {crop.crop_name.charAt(0)}
                              </div>
                              <span className="font-medium text-stone-800 dark:text-stone-200">
                                {crop.crop_name}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <CompactZoneBadge 
                                value={crop.stats.green} 
                                total={crop.stats.total}
                                color="text-emerald-600 dark:text-emerald-400"
                                icon="✅"
                              />
                              <CompactZoneBadge 
                                value={crop.stats.orange} 
                                total={crop.stats.total}
                                color="text-amber-600 dark:text-amber-400"
                                icon="⚠️"
                              />
                              <CompactZoneBadge 
                                value={crop.stats.red} 
                                total={crop.stats.total}
                                color="text-rose-600 dark:text-rose-400"
                                icon="❌"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <span className="text-lg font-semibold tabular-nums text-stone-800 dark:text-stone-200">
                              {crop.stats.total}
                            </span>
                          </td>
                        </tr>

                        {/* MEASUREMENTS - с визуальной иерархией */}
                        {expandedCrops.has(crop.crop_id) && (
                          <>
                            {crop.measurements.map(measurement => {
                              const key = crop.crop_id * 1000 + measurement.measurement_type_id

                              return (
                                <React.Fragment key={key}>
                                  <tr className="
                                    bg-stone-100/50 dark:bg-stone-900/50
                                    border-l-2 border-stone-300 dark:border-stone-600
                                    hover:bg-stone-200/50 dark:hover:bg-stone-900/70
                                    transition-colors
                                  ">
                                    <td className="px-4 pl-12">
                                      <button
                                        onClick={() => toggle(expandedMeasurements, setExpandedMeasurements, key)}
                                        className="p-1 rounded-md transition-all duration-200 
                                                 hover:bg-stone-200 dark:hover:bg-stone-800
                                                 text-stone-400"
                                      >
                                        <div className={`transition-transform duration-200 ${
                                          expandedMeasurements.has(key) ? "rotate-90" : ""
                                        }`}>
                                          <ChevronRight />
                                        </div>
                                      </button>
                                    </td>

                                    <td className="px-4 py-3">
                                      <span className="text-stone-700 dark:text-stone-300">
                                        {measurement.human_name}
                                      </span>
                                    </td>

                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <CompactZoneBadge 
                                          value={measurement.stats.green} 
                                          total={measurement.stats.total}
                                          color="text-emerald-600 dark:text-emerald-400"
                                          icon="✅"
                                        />
                                        <CompactZoneBadge 
                                          value={measurement.stats.orange} 
                                          total={measurement.stats.total}
                                          color="text-amber-600 dark:text-amber-400"
                                          icon="⚠️"
                                        />
                                        <CompactZoneBadge 
                                          value={measurement.stats.red} 
                                          total={measurement.stats.total}
                                          color="text-rose-600 dark:text-rose-400"
                                          icon="❌"
                                        />
                                      </div>
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      <span className="text-base font-semibold tabular-nums text-stone-700 dark:text-stone-300">
                                        {measurement.stats.total}
                                      </span>
                                    </td>
                                  </tr>

                                  {/* REPORTS - Улучшенные карточки */}
                                  {expandedMeasurements.has(key) && (
                                    <tr>
                                      <td colSpan={4} className="px-4 py-3 bg-stone-50 dark:bg-stone-900/50">
                                        <div className="grid grid-cols-5 gap-3">
                                          {measurement.reports.map(report => (
                                            <div
                                              key={report.scout_report_id}
                                              className="
                                                bg-white dark:bg-stone-900
                                                rounded-xl
                                                border border-stone-200 dark:border-stone-700
                                                p-4
                                                hover:shadow-xl
                                                hover:-translate-y-0.5
                                                transition-all
                                                duration-200
                                              "
                                            >
                                              <div className="flex items-start justify-between">
                                                <div>
                                                  <h4 className="font-medium text-stone-900 dark:text-stone-100">
                                                    {report.field_name}
                                                  </h4>
                                                  <a
                                                    href={`https://operations.cropwise.com/fields/${report.field_id}/scout_reports/${report.scout_report_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
                                                  >
                                                    Отчет № {report.scout_report_id}
                                                  </a>
                                                </div>
                                                <span className={`
                                                  px-2.5 py-1 text-xs font-medium rounded-full text-white shadow-sm
                                                  ${report.zone === 'green' ? 'bg-emerald-500' :
                                                    report.zone === 'orange' ? 'bg-amber-500' : 'bg-rose-500'}
                                                `}>
                                                  {report.zone === 'green' ? 'Низкий' :
                                                   report.zone === 'orange' ? 'Средний' : 'Высокий'}
                                                </span>
                                              </div>
                                              <div className="mt-3 flex items-center justify-between">
                                                <span className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                                                  {report.value}
                                                </span>
                                                <span className="text-xs text-stone-400">значение</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              )
                            })}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Премиум футер */}
      <div className="border-t border-stone-200 dark:border-stone-800 px-6 py-4 bg-stone-50 dark:bg-stone-900/50">
        <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-4">
            <span>📊 Отслеживаются {templates.length} шаблонов</span>
            <span>✅ Низкий риск — ⚠️ Средний риск — ❌ Высокий риск</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScoutingTemplateTableNested