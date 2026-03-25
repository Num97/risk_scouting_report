import React, { useState } from "react"
import type { FarmData, FarmReportMeasurement } from "../../types/scoutingFarmAggregated"
import ReportsModal from "../ScoutingOverview/ReportsModal"

interface Props {
  farms: FarmData[];
  expandedFarms: Set<string>;
  expandedFields: Set<number>;
  expandedCrops: Set<number>;
  expandedMeasurements: Set<number>;
  onToggleFarm: (id: string) => void;
  onToggleField: (id: number) => void;
  onToggleCrop: (id: number) => void;
  onToggleMeasurement: (id: number) => void;
}

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

interface ZoneBadgeProps {
  value: number
  total: number
  color: string
  label: string
  icon: string
  zoneType: 'green' | 'orange' | 'red'
  onBadgeClick: (zoneType: 'green' | 'orange' | 'red', label: string) => void
}

const ZoneBadge = ({ value, total, color, label, icon, zoneType, onBadgeClick }: ZoneBadgeProps) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0"
  
  return (
    <div 
      onClick={() => onBadgeClick(zoneType, label)}
      className="flex items-center gap-2 px-2 py-1 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all cursor-pointer hover:scale-105 active:scale-95"
    >
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

interface CompactZoneBadgeProps {
  value: number
  total: number
  color: string
  icon: string
  zoneType: 'green' | 'orange' | 'red'
  onBadgeClick: (zoneType: 'green' | 'orange' | 'red', label: string) => void
}

const CompactZoneBadge = ({ value, total, color, icon, zoneType, onBadgeClick }: CompactZoneBadgeProps) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0"
  const label = zoneType === 'green' ? 'Низкий' : zoneType === 'orange' ? 'Средний' : 'Высокий'
  
  return (
    <div 
      onClick={() => onBadgeClick(zoneType, label)}
      className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-800/30 rounded-md px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-all cursor-pointer hover:scale-105 active:scale-95"
    >
      <span className="text-sm">{icon}</span>
      <span className={`text-sm font-medium tabular-nums ${color}`}>{value}</span>
      <span className="text-xs tabular-nums text-stone-400 dark:text-stone-500">({percentage}%)</span>
    </div>
  )
}

const RiskBar = ({ green, orange, red, total }: { green: number; orange: number; red: number; total: number }) => {
  if (!total) return null

  const gPercent = (green / total) * 100
  const oPercent = (orange / total) * 100
  const rPercent = (red / total) * 100

  return (
    <div className="relative group w-full max-w-md">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800 shadow-inner">
        <div 
          style={{ width: `${gPercent}%` }} 
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 group-hover:from-emerald-500 group-hover:to-emerald-600 transition-all duration-300"
        />
        <div 
          style={{ width: `${oPercent}%` }} 
          className="bg-gradient-to-r from-amber-400 to-amber-500 group-hover:from-amber-500 group-hover:to-amber-600 transition-all duration-300"
        />
        <div 
          style={{ width: `${rPercent}%` }} 
          className="bg-gradient-to-r from-rose-400 to-rose-500 group-hover:from-rose-500 group-hover:to-rose-600 transition-all duration-300"
        />
      </div>
    </div>
  )
}

const ScoutingFarmTable: React.FC<Props> = ({ 
  farms, 
  expandedFarms,
  expandedFields,
  expandedCrops,
  expandedMeasurements,
  onToggleFarm,
  onToggleField,
  onToggleCrop,
  onToggleMeasurement,
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalReports, setModalReports] = useState<FarmReportMeasurement[]>([])
  const [modalTitle, setModalTitle] = useState('')
  const [modalDescription, setModalDescription] = useState('')

  const handleBadgeClick = (farmName: string, zoneType: 'green' | 'orange' | 'red', label: string) => {
    // Собираем все отчеты по хозяйству и зоне
    const farm = farms.find(f => f.farm_name === farmName)
    if (!farm) return
    
    const reports: FarmReportMeasurement[] = []
    farm.fields.forEach(field => {
      field.crops.forEach(crop => {
        crop.measurements.forEach(measurement => {
          measurement.reports.forEach(report => {
            if (report.zone === zoneType) {
              reports.push(report)
            }
          })
        })
      })
    })
    
    const zoneLabel = zoneType === 'green' ? 'Низкий риск' : zoneType === 'orange' ? 'Средний риск' : 'Высокий риск'
    
    setModalReports(reports)
    setModalTitle(`${farmName} - ${zoneLabel}`)
    setModalDescription(`Список отчетов ${label} риск в хозяйстве "${farmName}"`)
    setModalOpen(true)
  }

  const handleFieldBadgeClick = (farmName: string, fieldName: string, zoneType: 'green' | 'orange' | 'red', label: string, fieldId: number) => {
    // Собираем все отчеты по полю и зоне
    const farm = farms.find(f => f.farm_name === farmName)
    if (!farm) return
    
    const field = farm.fields.find(f => f.field_id === fieldId)
    if (!field) return
    
    const reports: FarmReportMeasurement[] = []
    field.crops.forEach(crop => {
      crop.measurements.forEach(measurement => {
        measurement.reports.forEach(report => {
          if (report.zone === zoneType) {
            reports.push(report)
          }
        })
      })
    })
    
    const zoneLabel = zoneType === 'green' ? 'Низкий риск' : zoneType === 'orange' ? 'Средний риск' : 'Высокий риск'
    
    setModalReports(reports)
    setModalTitle(`${farmName} - ${fieldName} - ${zoneLabel}`)
    setModalDescription(`Список отчетов по полю "${fieldName}" с ${label} риском в хозяйстве "${farmName}"`)
    setModalOpen(true)
  }

  const handleCropBadgeClick = (farmName: string, fieldName: string, cropName: string, zoneType: 'green' | 'orange' | 'red', label: string, cropId: number) => {
    // Собираем все отчеты по культуре и зоне
    const farm = farms.find(f => f.farm_name === farmName)
    if (!farm) return
    
    const field = farm.fields.find(f => f.field_name === fieldName)
    if (!field) return
    
    const crop = field.crops.find(c => c.crop_id === cropId)
    if (!crop) return
    
    const reports: FarmReportMeasurement[] = []
    crop.measurements.forEach(measurement => {
      measurement.reports.forEach(report => {
        if (report.zone === zoneType) {
          reports.push(report)
        }
      })
    })
    
    const zoneLabel = zoneType === 'green' ? 'Низкий риск' : zoneType === 'orange' ? 'Средний риск' : 'Высокий риск'
    
    setModalReports(reports)
    setModalTitle(`${farmName} - ${fieldName} - ${cropName} - ${zoneLabel}`)
    setModalDescription(`Список отчетов по культуре "${cropName}" с ${label} риском в поле "${fieldName}"`)
    setModalOpen(true)
  }

  return (
    <>
      <div className="bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl shadow-stone-200/20 dark:shadow-stone-950/30 overflow-hidden">
        
        <div className="bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800 border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Анализ рисков по хозяйствам
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Распределение отчетов по зонам риска (зеленая ✅, оранжевая ⚠️, красная ❌)
              </p>
            </div>
            
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

        <div className="overflow-x-auto max-h-[800px] overflow-y-auto relative">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Хозяйство / Поле
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
              {farms.map((farm, farmIndex) => (
                <React.Fragment key={farm.farm_id}>
                  {/* FARM ROW */}
                  <tr className={`
                    group hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-all duration-200
                    ${farmIndex === 0 ? 'bg-white dark:bg-stone-950' : 'bg-white dark:bg-stone-950'}
                  `}>
                    <td className="px-4">
                      <button
                        onClick={() => onToggleFarm(farm.farm_id)}
                        className="p-1 rounded-md transition-all duration-200 
                                 hover:bg-stone-200 dark:hover:bg-stone-800
                                 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                      >
                        <div className={`transition-transform duration-200 ${
                          expandedFarms.has(farm.farm_id) ? "rotate-90" : ""
                        }`}>
                          <ChevronRight />
                        </div>
                      </button>
                     </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-100 text-lg">
                          {farm.farm_name}
                        </span>
                        <RiskBar {...farm.stats} />
                      </div>
                     </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <ZoneBadge 
                          value={farm.stats.green} 
                          total={farm.stats.total}
                          color="text-emerald-600 dark:text-emerald-400" 
                          label="низкий"
                          icon="✅"
                          zoneType="green"
                          onBadgeClick={(zoneType, label) => handleBadgeClick(farm.farm_name, zoneType, label)}
                        />
                        <ZoneBadge 
                          value={farm.stats.orange} 
                          total={farm.stats.total}
                          color="text-amber-600 dark:text-amber-400" 
                          label="средний"
                          icon="⚠️"
                          zoneType="orange"
                          onBadgeClick={(zoneType, label) => handleBadgeClick(farm.farm_name, zoneType, label)}
                        />
                        <ZoneBadge 
                          value={farm.stats.red} 
                          total={farm.stats.total}
                          color="text-rose-600 dark:text-rose-400" 
                          label="высокий"
                          icon="❌"
                          zoneType="red"
                          onBadgeClick={(zoneType, label) => handleBadgeClick(farm.farm_name, zoneType, label)}
                        />
                      </div>
                     </td>

                    <td className="px-4 py-4 text-right">
                      <span className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                        {farm.stats.total}
                      </span>
                     </td>
                   </tr>

                  {/* FIELDS внутри хозяйства */}
                  {expandedFarms.has(farm.farm_id) && farm.fields.map((field) => (
                    <React.Fragment key={field.field_id}>
                      <tr className="bg-stone-50/60 dark:bg-stone-900/30 border-l-2 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900/50 transition-colors">
                        <td className="px-4 pl-8">
                          <button
                            onClick={() => onToggleField(field.field_id)}
                            className="p-1 rounded-md transition-all duration-200 
                                     hover:bg-stone-200 dark:hover:bg-stone-800
                                     text-stone-400"
                          >
                            <div className={`transition-transform duration-200 ${
                              expandedFields.has(field.field_id) ? "rotate-90" : ""
                            }`}>
                              <ChevronRight />
                            </div>
                          </button>
                         </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-stone-200 dark:bg-stone-700 rounded-full flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-400">
                              {field.field_name.charAt(0)}
                            </div>
                            <span className="text-stone-700 dark:text-stone-300">
                              {field.field_name}
                            </span>
                          </div>
                         </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CompactZoneBadge 
                              value={field.stats.green} 
                              total={field.stats.total}
                              color="text-emerald-600 dark:text-emerald-400"
                              icon="✅"
                              zoneType="green"
                              onBadgeClick={(zoneType, label) => handleFieldBadgeClick(farm.farm_name, field.field_name, zoneType, label, field.field_id)}
                            />
                            <CompactZoneBadge 
                              value={field.stats.orange} 
                              total={field.stats.total}
                              color="text-amber-600 dark:text-amber-400"
                              icon="⚠️"
                              zoneType="orange"
                              onBadgeClick={(zoneType, label) => handleFieldBadgeClick(farm.farm_name, field.field_name, zoneType, label, field.field_id)}
                            />
                            <CompactZoneBadge 
                              value={field.stats.red} 
                              total={field.stats.total}
                              color="text-rose-600 dark:text-rose-400"
                              icon="❌"
                              zoneType="red"
                              onBadgeClick={(zoneType, label) => handleFieldBadgeClick(farm.farm_name, field.field_name, zoneType, label, field.field_id)}
                            />
                          </div>
                         </td>

                        <td className="px-4 py-3 text-right">
                          <span className="text-lg font-semibold tabular-nums text-stone-800 dark:text-stone-200">
                            {field.stats.total}
                          </span>
                         </td>
                       </tr>

                      {/* CROPS внутри поля */}
                      {expandedFields.has(field.field_id) && field.crops.map((crop) => (
                        <React.Fragment key={crop.crop_id}>
                          <tr className="bg-stone-100/50 dark:bg-stone-900/50 border-l-2 border-stone-300 dark:border-stone-600 hover:bg-stone-200/50 dark:hover:bg-stone-900/70 transition-colors">
                            <td className="px-4 pl-12">
                              <button
                                onClick={() => onToggleCrop(crop.crop_id)}
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
                              <span className="text-stone-700 dark:text-stone-300 text-sm">
                                {crop.crop_name}
                              </span>
                             </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <CompactZoneBadge 
                                  value={crop.stats.green} 
                                  total={crop.stats.total}
                                  color="text-emerald-600 dark:text-emerald-400"
                                  icon="✅"
                                  zoneType="green"
                                  onBadgeClick={(zoneType, label) => handleCropBadgeClick(farm.farm_name, field.field_name, crop.crop_name, zoneType, label, crop.crop_id)}
                                />
                                <CompactZoneBadge 
                                  value={crop.stats.orange} 
                                  total={crop.stats.total}
                                  color="text-amber-600 dark:text-amber-400"
                                  icon="⚠️"
                                  zoneType="orange"
                                  onBadgeClick={(zoneType, label) => handleCropBadgeClick(farm.farm_name, field.field_name, crop.crop_name, zoneType, label, crop.crop_id)}
                                />
                                <CompactZoneBadge 
                                  value={crop.stats.red} 
                                  total={crop.stats.total}
                                  color="text-rose-600 dark:text-rose-400"
                                  icon="❌"
                                  zoneType="red"
                                  onBadgeClick={(zoneType, label) => handleCropBadgeClick(farm.farm_name, field.field_name, crop.crop_name, zoneType, label, crop.crop_id)}
                                />
                              </div>
                             </td>

                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-semibold tabular-nums text-stone-700 dark:text-stone-300">
                                {crop.stats.total}
                              </span>
                             </td>
                           </tr>

                          {/* MEASUREMENTS */}
                          {expandedCrops.has(crop.crop_id) && crop.measurements.map((measurement) => {
                            const key = crop.crop_id * 1000 + measurement.measurement_type_id

                            return (
                              <React.Fragment key={key}>
                                <tr className="bg-stone-100/50 dark:bg-stone-900/50 border-l-2 border-stone-300 dark:border-stone-600 hover:bg-stone-200/50 dark:hover:bg-stone-900/70 transition-colors">
                                  <td className="px-4 pl-12">
                                    <button
                                      onClick={() => onToggleMeasurement(key)}
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
                                    <span className="text-stone-700 dark:text-stone-300 text-sm">
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
                                        zoneType="green"
                                        onBadgeClick={(zoneType, label) => handleCropBadgeClick(farm.farm_name, field.field_name, crop.crop_name, zoneType, label, crop.crop_id)}
                                      />
                                      <CompactZoneBadge 
                                        value={measurement.stats.orange} 
                                        total={measurement.stats.total}
                                        color="text-amber-600 dark:text-amber-400"
                                        icon="⚠️"
                                        zoneType="orange"
                                        onBadgeClick={(zoneType, label) => handleCropBadgeClick(farm.farm_name, field.field_name, crop.crop_name, zoneType, label, crop.crop_id)}
                                      />
                                      <CompactZoneBadge 
                                        value={measurement.stats.red} 
                                        total={measurement.stats.total}
                                        color="text-rose-600 dark:text-rose-400"
                                        icon="❌"
                                        zoneType="red"
                                        onBadgeClick={(zoneType, label) => handleCropBadgeClick(farm.farm_name, field.field_name, crop.crop_name, zoneType, label, crop.crop_id)}
                                      />
                                    </div>
                                   </td>

                                  <td className="px-4 py-3 text-right">
                                    <span className="text-sm font-semibold tabular-nums text-stone-700 dark:text-stone-300">
                                      {measurement.stats.total}
                                    </span>
                                   </td>
                                 </tr>

                                {/* REPORTS */}
                                {expandedMeasurements.has(key) && (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-3 bg-stone-100/50 dark:bg-stone-900/50">
                                      <div className="grid grid-cols-5 gap-3">
                                        {measurement.reports.map((report) => (
                                          <div
                                            key={`${report.scout_report_id}-${report.measurement_type_id}`}
                                            className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
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
                                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                                  Шаблон: {report.template_name}
                                                </p>
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
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-stone-200 dark:border-stone-800 px-6 py-4 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-4">
              <span>📊 Отслеживаются {farms.length} хозяйств</span>
              <span>🌾 {farms.reduce((acc, f) => acc + f.fields.length, 0)} полей</span>
              <span>✅ Низкий риск — ⚠️ Средний риск — ❌ Высокий риск</span>
            </div>
          </div>
        </div>
      </div>

      <ReportsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        reports={modalReports.map(r => ({
          ...r,
          measurement_type_name: r.measurement_type_name
        }))}
        title={modalTitle}
        description={modalDescription}
      />
    </>
  )
}

export default ScoutingFarmTable