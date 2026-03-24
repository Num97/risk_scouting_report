import ReportsModal from "../ScoutingOverview/ReportsModal"
import React, { useMemo, useState } from "react"
import type { TemplateData, ReportMeasurement } from "../../types/scoutingAggregated"
import type { TemplateGroupName, TemplateGroup, CropGroup, CropGroupName } from "../../types/groups"

interface Props {
  templates: TemplateData[];
  templateGroups: TemplateGroup[];
  templateGroupNames: TemplateGroupName[];
  cropGroups: CropGroup[];
  cropGroupNames: CropGroupName[];
  expandedGroups: Set<number>;
  expandedCrops: Set<number>;
  expandedMeasurements: Set<number>;
  onToggleGroup: (id: number) => void;
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

const ScoutingTemplateTableNested: React.FC<Props> = ({ 
  templates, 
  templateGroups, 
  templateGroupNames,
  cropGroups,
  cropGroupNames,
  expandedGroups,
  expandedCrops,
  expandedMeasurements,
  onToggleGroup,
  onToggleCrop,
  onToggleMeasurement,
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalReports, setModalReports] = useState<(ReportMeasurement & { measurement_type_name?: string })[]>([])
  const [modalTitle, setModalTitle] = useState('')
  const [modalDescription, setModalDescription] = useState('')

  // Функция для получения всех отчетов по группе и зоне
  const getReportsByGroupAndZone = (groupId: number, zoneType: 'green' | 'orange' | 'red') => {
    const reports: (ReportMeasurement & { measurement_type_name?: string })[] = []
    
    // Находим все шаблоны, принадлежащие этой группе
    const groupTemplateIds = templateGroups
      .filter((tg: TemplateGroup) => tg.template_group_id === groupId)
      .map((tg: TemplateGroup) => tg.scout_report_template_id)
    
    // Собираем отчеты из всех шаблонов этой группы
    templates.forEach((template: TemplateData) => {
      if (groupTemplateIds.includes(template.template_id)) {
        template.crops.forEach((crop) => {
          crop.measurements.forEach((measurement) => {
            measurement.reports.forEach((report: ReportMeasurement) => {
              if (report.zone === zoneType) {
                reports.push({
                  ...report,
                  measurement_type_name: measurement.human_name
                })
              }
            })
          })
        })
      }
    })
    
    return reports
  }

  // Функция для получения всех отчетов по группе, культуре и зоне
  const getReportsByGroupCropAndZone = (groupId: number, cropId: number, zoneType: 'green' | 'orange' | 'red') => {
    const reports: (ReportMeasurement & { measurement_type_name?: string })[] = []
    
    // Находим все шаблоны, принадлежащие этой группе
    const groupTemplateIds = templateGroups
      .filter((tg: TemplateGroup) => tg.template_group_id === groupId)
      .map((tg: TemplateGroup) => tg.scout_report_template_id)
    
    // Собираем отчеты из всех шаблонов этой группы для конкретной культуры
    templates.forEach((template: TemplateData) => {
      if (groupTemplateIds.includes(template.template_id)) {
        const crop = template.crops.find((c) => c.crop_id === cropId)
        if (crop) {
          crop.measurements.forEach((measurement) => {
            measurement.reports.forEach((report: ReportMeasurement) => {
              if (report.zone === zoneType) {
                reports.push({
                  ...report,
                  measurement_type_name: measurement.human_name
                })
              }
            })
          })
        }
      }
    })
    
    return reports
  }

  const handleBadgeClick = (groupId: number, groupName: string, zoneType: 'green' | 'orange' | 'red', label: string) => {
    const reports = getReportsByGroupAndZone(groupId, zoneType)
    const zoneLabel = zoneType === 'green' ? 'Низкий риск' : zoneType === 'orange' ? 'Средний риск' : 'Высокий риск'
    
    setModalReports(reports)
    setModalTitle(`${groupName} - ${zoneLabel}`)
    setModalDescription(`Список отчетов с ${label} риском в группе "${groupName}"`)
    setModalOpen(true)
  }

  const handleCropBadgeClick = (groupId: number, groupName: string, cropName: string, zoneType: 'green' | 'orange' | 'red', label: string, cropId: number) => {
    const reports = getReportsByGroupCropAndZone(groupId, cropId, zoneType)
    const zoneLabel = zoneType === 'green' ? 'Низкий риск' : zoneType === 'orange' ? 'Средний риск' : 'Высокий риск'
    
    setModalReports(reports)
    setModalTitle(`${groupName} - ${cropName} - ${zoneLabel}`)
    setModalDescription(`Список отчетов по культуре "${cropName}" с ${label} риском в группе "${groupName}"`)
    setModalOpen(true)
  }

  // Агрегируем данные по группам шаблонов и культурам
  const aggregatedData = useMemo(() => {
    // Сначала группируем шаблоны по группам
    const templateGroupsMap = new Map<number, TemplateData[]>()
    
    templates.forEach(template => {
      const groupId = templateGroups.find((tg: TemplateGroup) => tg.scout_report_template_id === template.template_id)?.template_group_id || 0
      if (!templateGroupsMap.has(groupId)) {
        templateGroupsMap.set(groupId, [])
      }
      templateGroupsMap.get(groupId)!.push(template)
    })
    
    // Теперь для каждой группы собираем данные по культурам
    const result: Array<{
      id: number
      name: string
      stats: { green: number; orange: number; red: number; total: number }
      crops: Map<number, {
        crop_id: number
        crop_name: string
        stats: { green: number; orange: number; red: number; total: number }
        measurements: Map<number, {
          measurement_type_id: number
          human_name: string
          stats: { green: number; orange: number; red: number; total: number }
          reports: ReportMeasurement[]
        }>
      }>
    }> = []
    
    for (const [groupId, groupTemplates] of templateGroupsMap) {
      const groupName = groupId === 0 ? 'Без группы' : templateGroupNames.find((g: TemplateGroupName) => g.id === groupId)?.template_group_name || 'Неизвестная группа'
      
      const groupStats = { green: 0, orange: 0, red: 0, total: 0 }
      const cropsMap = new Map()
      
      groupTemplates.forEach(template => {
        // Суммируем статистику группы
        groupStats.green += template.stats.green
        groupStats.orange += template.stats.orange
        groupStats.red += template.stats.red
        groupStats.total += template.stats.total
        
        // Агрегируем данные по культурам
        template.crops.forEach(crop => {
          if (!cropsMap.has(crop.crop_id)) {
            cropsMap.set(crop.crop_id, {
              crop_id: crop.crop_id,
              crop_name: crop.crop_name,
              stats: { green: 0, orange: 0, red: 0, total: 0 },
              measurements: new Map()
            })
          }
          
          const cropData = cropsMap.get(crop.crop_id)
          
          // Суммируем статистику культуры
          cropData.stats.green += crop.stats.green
          cropData.stats.orange += crop.stats.orange
          cropData.stats.red += crop.stats.red
          cropData.stats.total += crop.stats.total
          
          // Агрегируем данные по измерениям
          crop.measurements.forEach(measurement => {
            if (!cropData.measurements.has(measurement.measurement_type_id)) {
              cropData.measurements.set(measurement.measurement_type_id, {
                measurement_type_id: measurement.measurement_type_id,
                human_name: measurement.human_name,
                stats: { green: 0, orange: 0, red: 0, total: 0 },
                reports: []
              })
            }
            
            const measurementData = cropData.measurements.get(measurement.measurement_type_id)
            
            // Суммируем статистику измерения
            measurementData.stats.green += measurement.stats.green
            measurementData.stats.orange += measurement.stats.orange
            measurementData.stats.red += measurement.stats.red
            measurementData.stats.total += measurement.stats.total
            
            // Добавляем отчеты
            measurement.reports.forEach((report: ReportMeasurement) => {
              const reportExists = measurementData.reports.some(
                (r: ReportMeasurement) => r.scout_report_id === report.scout_report_id
              )
              if (!reportExists) {
                measurementData.reports.push(report)
              }
            })
          })
        })
      })
      
      result.push({
        id: groupId,
        name: groupName,
        stats: groupStats,
        crops: cropsMap
      })
    }
    
    return result
  }, [templates, templateGroups, templateGroupNames])

  // Получаем название группы культур для культуры
  const getCropGroupName = (cropId: number) => {
    const groupId = cropGroups.find((cg: CropGroup) => cg.crop_id === cropId)?.crop_group_id
    if (!groupId) return null
    return cropGroupNames.find((gn: CropGroupName) => gn.id === groupId)?.crop_group_name
  }

  return (
    <>
      <div className="bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl shadow-stone-200/20 dark:shadow-stone-950/30 overflow-hidden">
        
        <div className="bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800 border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Анализ рисков по группам шаблонов
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
                  Группа шаблонов / Культура
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
              {aggregatedData.map((group, groupIndex) => (
                <React.Fragment key={group.id}>
                  {/* GROUP ROW */}
                  <tr className={`
                    group hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-all duration-200
                    ${groupIndex === 0 ? 'bg-white dark:bg-stone-950' : 'bg-white dark:bg-stone-950'}
                  `}>
                    <td className="px-4">
                      <button
                        onClick={() => onToggleGroup(group.id)}
                        className="p-1 rounded-md transition-all duration-200 
                                 hover:bg-stone-200 dark:hover:bg-stone-800
                                 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                      >
                        <div className={`transition-transform duration-200 ${
                          expandedGroups.has(group.id) ? "rotate-90" : ""
                        }`}>
                          <ChevronRight />
                        </div>
                      </button>
                     </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-100 text-lg">
                          {group.name}
                        </span>
                        <RiskBar {...group.stats} />
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <ZoneBadge 
                          value={group.stats.green} 
                          total={group.stats.total}
                          color="text-emerald-600 dark:text-emerald-400" 
                          label="низкий"
                          icon="✅"
                          zoneType="green"
                          onBadgeClick={(zoneType, label) => handleBadgeClick(group.id, group.name, zoneType, label)}
                        />
                        <ZoneBadge 
                          value={group.stats.orange} 
                          total={group.stats.total}
                          color="text-amber-600 dark:text-amber-400" 
                          label="средний"
                          icon="⚠️"
                          zoneType="orange"
                          onBadgeClick={(zoneType, label) => handleBadgeClick(group.id, group.name, zoneType, label)}
                        />
                        <ZoneBadge 
                          value={group.stats.red} 
                          total={group.stats.total}
                          color="text-rose-600 dark:text-rose-400" 
                          label="высокий"
                          icon="❌"
                          zoneType="red"
                          onBadgeClick={(zoneType, label) => handleBadgeClick(group.id, group.name, zoneType, label)}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-100">
                        {group.stats.total}
                      </span>
                    </td>
                  </tr>

                  {/* CROPS внутри группы */}
                  {expandedGroups.has(group.id) && Array.from(group.crops.values()).map((crop) => (
                    <React.Fragment key={crop.crop_id}>
                      <tr className="bg-stone-50/60 dark:bg-stone-900/30 border-l-2 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900/50 transition-colors">
                        <td className="px-4 pl-8">
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
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-stone-200 dark:bg-stone-700 rounded-full flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-400">
                              {crop.crop_name.charAt(0)}
                            </div>
                            <span className="text-stone-700 dark:text-stone-300">
                              {crop.crop_name}
                            </span>
                            {getCropGroupName(crop.crop_id) && (
                              <span className="text-xs text-stone-400 dark:text-stone-500 ml-2">
                                ({getCropGroupName(crop.crop_id)})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CompactZoneBadge 
                              value={crop.stats.green} 
                              total={crop.stats.total}
                              color="text-emerald-600 dark:text-emerald-400"
                              icon="✅"
                              zoneType="green"
                              onBadgeClick={(zoneType, label) => handleCropBadgeClick(group.id, group.name, crop.crop_name, zoneType, label, crop.crop_id)}
                            />
                            <CompactZoneBadge 
                              value={crop.stats.orange} 
                              total={crop.stats.total}
                              color="text-amber-600 dark:text-amber-400"
                              icon="⚠️"
                              zoneType="orange"
                              onBadgeClick={(zoneType, label) => handleCropBadgeClick(group.id, group.name, crop.crop_name, zoneType, label, crop.crop_id)}
                            />
                            <CompactZoneBadge 
                              value={crop.stats.red} 
                              total={crop.stats.total}
                              color="text-rose-600 dark:text-rose-400"
                              icon="❌"
                              zoneType="red"
                              onBadgeClick={(zoneType, label) => handleCropBadgeClick(group.id, group.name, crop.crop_name, zoneType, label, crop.crop_id)}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <span className="text-lg font-semibold tabular-nums text-stone-800 dark:text-stone-200">
                            {crop.stats.total}
                          </span>
                        </td>
                      </tr>

                      {/* MEASUREMENTS */}
                      {expandedCrops.has(crop.crop_id) && Array.from(crop.measurements.values()).map(measurement => {
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
                                    onBadgeClick={(zoneType, label) => handleCropBadgeClick(group.id, group.name, crop.crop_name, zoneType, label, crop.crop_id)}
                                  />
                                  <CompactZoneBadge 
                                    value={measurement.stats.orange} 
                                    total={measurement.stats.total}
                                    color="text-amber-600 dark:text-amber-400"
                                    icon="⚠️"
                                    zoneType="orange"
                                    onBadgeClick={(zoneType, label) => handleCropBadgeClick(group.id, group.name, crop.crop_name, zoneType, label, crop.crop_id)}
                                  />
                                  <CompactZoneBadge 
                                    value={measurement.stats.red} 
                                    total={measurement.stats.total}
                                    color="text-rose-600 dark:text-rose-400"
                                    icon="❌"
                                    zoneType="red"
                                    onBadgeClick={(zoneType, label) => handleCropBadgeClick(group.id, group.name, crop.crop_name, zoneType, label, crop.crop_id)}
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
                                    {measurement.reports.map((report: ReportMeasurement) => (
                                      <div
                                        key={report.scout_report_id}
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
            </tbody>
          </table>
        </div>

        <div className="border-t border-stone-200 dark:border-stone-800 px-6 py-4 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-4">
              <span>📊 Отслеживаются {aggregatedData.length} групп шаблонов</span>
              <span>🌾 {aggregatedData.reduce((acc, g) => acc + g.crops.size, 0)} культур</span>
              <span>✅ Низкий риск — ⚠️ Средний риск — ❌ Высокий риск</span>
            </div>
          </div>
        </div>
      </div>

      <ReportsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        reports={modalReports}
        title={modalTitle}
        description={modalDescription}
      />
    </>
  )
}

export default ScoutingTemplateTableNested