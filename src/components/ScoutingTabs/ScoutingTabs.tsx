import React, { useMemo } from "react"
import { motion } from "framer-motion"
import ScoutingTemplateTableNested from "../Table/ScoutingTemplateTableNested"
import ScoutingFarmTable from "../Table/ScoutingFarmTable"
import ScoutingOverview from "../ScoutingOverview/ScoutingOverview"
import DateRangeSlider from "../DateRangeSlider/DateRangeSlider"
import type { TemplateData } from "../../types/scoutingAggregated"
import type { FarmData, FieldData, FarmCropData, FarmMeasurementTypeData } from "../../types/scoutingFarmAggregated"
import type { TemplateGroupName, TemplateGroup, CropGroup, CropGroupName } from "../../types/groups"
import ScoutingRiskChart from "../ScoutingRiskChart/ScoutingRiskChart"
import type { TabType } from "@/types/handbooks"

interface ScoutingTabsProps {
  templates: TemplateData[]
  farmData: FarmData[]
  templateGroups: TemplateGroup[]
  templateGroupNames: TemplateGroupName[]
  cropGroups: CropGroup[]
  cropGroupNames: CropGroupName[]
  season: number
  dateRange: { start: Date; end: Date }
  onDateRangeChange: (start: Date, end: Date) => void
  // Состояния для раскрытия в таблице шаблонов
  expandedGroups: Set<number>
  expandedCrops: Set<number>
  expandedMeasurements: Set<number>
  onToggleGroup: (id: number) => void
  onToggleCrop: (id: number) => void
  onToggleMeasurement: (id: number) => void
  // Состояния для раскрытия в таблице хозяйств
  expandedFarms: Set<string>
  expandedFields: Set<number>
  expandedFarmCrops: Set<number>
  expandedFarmMeasurements: Set<number>
  onToggleFarm: (id: string) => void
  onToggleField: (id: number) => void
  onToggleFarmCrop: (id: number) => void
  onToggleFarmMeasurement: (id: number) => void
  activeTab: TabType
  onActiveTabChange: (tab: TabType) => void
}


const ScoutingTabs: React.FC<ScoutingTabsProps> = ({
  templates,
  farmData,
  templateGroups,
  templateGroupNames,
  cropGroups,
  cropGroupNames,
  season,
  dateRange,
  onDateRangeChange,
  expandedGroups,
  expandedCrops,
  expandedMeasurements,
  onToggleGroup,
  onToggleCrop,
  onToggleMeasurement,
  expandedFarms,
  expandedFields,
  expandedFarmCrops,
  expandedFarmMeasurements,
  onToggleFarm,
  onToggleField,
  onToggleFarmCrop,
  onToggleFarmMeasurement,
  activeTab,
  onActiveTabChange,
}) => {

  const tabs = useMemo(
    () => [
      { label: "По шаблонам", value: "templates" as TabType },
      { label: "По хозяйствам", value: "farms" as TabType },
      { label: "Статистика", value: "stats" as TabType },
    ],
    []
  )

  const activeIndex = tabs.findIndex((t) => t.value === activeTab)

  // Фильтруем шаблоны по дате
  const filteredTemplates = useMemo(() => {
    if (!templates.length) return []
    
    return templates.map(template => {
      const filteredTemplate = { ...template }
      
      filteredTemplate.crops = template.crops.map(crop => {
        const filteredCrop = { ...crop }
        
        filteredCrop.measurements = crop.measurements.map(measurement => {
          const filteredMeasurement = { ...measurement }
          
          filteredMeasurement.reports = measurement.reports.filter(report => {
            const reportDate = new Date(report.report_date)
            return reportDate >= dateRange.start && reportDate <= dateRange.end
          })
          
          filteredMeasurement.stats = {
            green: filteredMeasurement.reports.filter(r => r.zone === 'green').length,
            orange: filteredMeasurement.reports.filter(r => r.zone === 'orange').length,
            red: filteredMeasurement.reports.filter(r => r.zone === 'red').length,
            total: filteredMeasurement.reports.length
          }
          
          return filteredMeasurement
        }).filter(m => m.reports.length > 0)
        
        filteredCrop.stats = {
          green: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.green, 0),
          orange: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.orange, 0),
          red: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.red, 0),
          total: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.total, 0)
        }
        
        return filteredCrop
      }).filter(c => c.measurements.length > 0)
      
      filteredTemplate.stats = {
        green: filteredTemplate.crops.reduce((sum, c) => sum + c.stats.green, 0),
        orange: filteredTemplate.crops.reduce((sum, c) => sum + c.stats.orange, 0),
        red: filteredTemplate.crops.reduce((sum, c) => sum + c.stats.red, 0),
        total: filteredTemplate.crops.reduce((sum, c) => sum + c.stats.total, 0)
      }
      
      return filteredTemplate
    }).filter(t => t.crops.length > 0)
    
  }, [templates, dateRange])

  // Фильтруем данные по хозяйствам по дате
  const filteredFarmData = useMemo((): FarmData[] => {
    if (!farmData.length) return []
    
    const result: FarmData[] = []
    
    for (const farm of farmData) {
      const filteredFarm: FarmData = {
        farm_id: farm.farm_id,
        farm_name: farm.farm_name,
        stats: { green: 0, orange: 0, red: 0, total: 0 },
        fields: []
      }
      
      for (const field of farm.fields) {
        const filteredField: FieldData = {
          field_id: field.field_id,
          field_name: field.field_name,
          field_group_name: field.field_group_name,
          stats: { green: 0, orange: 0, red: 0, total: 0 },
          crops: []
        }
        
        for (const crop of field.crops) {
          const filteredCrop: FarmCropData = {
            crop_id: crop.crop_id,
            crop_name: crop.crop_name,
            stats: { green: 0, orange: 0, red: 0, total: 0 },
            measurements: []
          }
          
          for (const measurement of crop.measurements) {
            const filteredReports = measurement.reports.filter(report => {
              const reportDate = new Date(report.report_date)
              return reportDate >= dateRange.start && reportDate <= dateRange.end
            })
            
            if (filteredReports.length > 0) {
              const filteredMeasurement: FarmMeasurementTypeData = {
                measurement_type_id: measurement.measurement_type_id,
                human_name: measurement.human_name,
                stats: {
                  green: filteredReports.filter(r => r.zone === 'green').length,
                  orange: filteredReports.filter(r => r.zone === 'orange').length,
                  red: filteredReports.filter(r => r.zone === 'red').length,
                  total: filteredReports.length
                },
                reports: filteredReports
              }
              filteredCrop.measurements.push(filteredMeasurement)
            }
          }
          
          if (filteredCrop.measurements.length > 0) {
            filteredCrop.stats = {
              green: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.green, 0),
              orange: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.orange, 0),
              red: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.red, 0),
              total: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.total, 0)
            }
            filteredField.crops.push(filteredCrop)
          }
        }
        
        if (filteredField.crops.length > 0) {
          filteredField.stats = {
            green: filteredField.crops.reduce((sum, c) => sum + c.stats.green, 0),
            orange: filteredField.crops.reduce((sum, c) => sum + c.stats.orange, 0),
            red: filteredField.crops.reduce((sum, c) => sum + c.stats.red, 0),
            total: filteredField.crops.reduce((sum, c) => sum + c.stats.total, 0)
          }
          filteredFarm.fields.push(filteredField)
        }
      }
      
      if (filteredFarm.fields.length > 0) {
        filteredFarm.stats = {
          green: filteredFarm.fields.reduce((sum, f) => sum + f.stats.green, 0),
          orange: filteredFarm.fields.reduce((sum, f) => sum + f.stats.orange, 0),
          red: filteredFarm.fields.reduce((sum, f) => sum + f.stats.red, 0),
          total: filteredFarm.fields.reduce((sum, f) => sum + f.stats.total, 0)
        }
        result.push(filteredFarm)
      }
    }
    
    return result
  }, [farmData, dateRange])

  return (
    <div className="w-full space-y-8">
      {/* ====== Date Range Slider ====== */}
      <DateRangeSlider
        start={dateRange.start}
        end={dateRange.end}
        min={new Date(season, 0, 1)}
        max={new Date(season, 11, 31)}
        onChange={onDateRangeChange}
      />

      {/* ====== Overview всегда сверху ====== */}
      <ScoutingOverview templates={filteredTemplates} />

      {/* ====== Toggle Header ====== */}
      <div className="flex justify-center">
        <div className="relative inline-flex rounded-xl bg-stone-200 dark:bg-stone-800 p-1 shadow-inner w-full max-w-lg">
          {/* Индикатор */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg bg-stone-500 shadow-md"
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              width: `calc(${100 / tabs.length}% - 0.5rem)`,
              left: `calc(${activeIndex * (100 / tabs.length)}% + 0.25rem)`,
            }}
          />

          {/* Кнопки */}
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onActiveTabChange(tab.value)}
              className={`relative z-10 flex-1 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                activeTab === tab.value
                  ? "text-white"
                  : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
              }`}
              style={{ padding: "0.5rem 1rem" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====== Контент ====== */}
      <div className="transition-opacity duration-300">
        {activeTab === "templates" && (
          <ScoutingTemplateTableNested
            templates={filteredTemplates}
            templateGroups={templateGroups}
            templateGroupNames={templateGroupNames}
            cropGroups={cropGroups}
            cropGroupNames={cropGroupNames}
            expandedGroups={expandedGroups}
            expandedCrops={expandedCrops}
            expandedMeasurements={expandedMeasurements}
            onToggleGroup={onToggleGroup}
            onToggleCrop={onToggleCrop}
            onToggleMeasurement={onToggleMeasurement}
          />
        )}

        {activeTab === "farms" && (
          <ScoutingFarmTable
            farms={filteredFarmData}
            expandedFarms={expandedFarms}
            expandedFields={expandedFields}
            expandedCrops={expandedFarmCrops}
            expandedMeasurements={expandedFarmMeasurements}
            onToggleFarm={onToggleFarm}
            onToggleField={onToggleField}
            onToggleCrop={onToggleFarmCrop}
            onToggleMeasurement={onToggleFarmMeasurement}
          />
        )}

        {activeTab === "stats" && (
          <ScoutingRiskChart templates={filteredTemplates} />
        )}
      </div>
    </div>
  )
}

export default ScoutingTabs