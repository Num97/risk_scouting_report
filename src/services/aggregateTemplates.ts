import type { ScoutReportItem, IndicatorsResponse } from "../types/scoutingReport"
import type { TemplateData } from "../types/scoutingAggregated"
import type { TemplateGroup, CropGroup, TemplateGroupCropGroup } from "../types/groups"

export function aggregateTemplates(
  reports: ScoutReportItem[],
  indicators: IndicatorsResponse,
  templateGroups: TemplateGroup[],
  cropGroups: CropGroup[],
  templateGroupCropGroups: TemplateGroupCropGroup[]
): TemplateData[] {

  const templatesMap: Record<number, TemplateData> = {}

  // ✅ Функция для безопасного получения числового значения
  const getNumericValue = (value: any): number | null => {
    if (value === null || value === undefined) return null
    
    // Если это строка, пробуем преобразовать в число
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '') return null
      const num = Number(trimmed)
      return isNaN(num) ? null : num
    }
    
    // Если это число, проверяем что оно валидное
    if (typeof value === 'number') {
      return isNaN(value) ? null : value
    }
    
    return null
  }

  const roundValue = (value: number): number => {
    return Number(value.toFixed(2))
  }

  // ✅ Маппинг: template -> [groups]
  const templateToGroupsMap = new Map<number, number[]>()
  templateGroups.forEach(tg => {
    const arr = templateToGroupsMap.get(tg.scout_report_template_id) || []
    arr.push(tg.template_group_id)
    templateToGroupsMap.set(tg.scout_report_template_id, arr)
  })

  // ✅ Маппинг: crop -> [groups]
  const cropToGroupsMap = new Map<number, number[]>()
  cropGroups.forEach(cg => {
    const arr = cropToGroupsMap.get(cg.crop_id) || []
    arr.push(cg.crop_group_id)
    cropToGroupsMap.set(cg.crop_id, arr)
  })

  // Set валидных пар
  const validPairs = new Set<string>()
  templateGroupCropGroups.forEach(tgcg => {
    validPairs.add(`${tgcg.template_group_id}_${tgcg.crop_group_id}`)
  })

  reports.forEach(report => {
    const templateId = report.scout_report_template_id
    const templateName = report.scout_report_template_name
    const cropId = report.crop_id
    const cropName = report.crop_name

    // ✅ Получаем ВСЕ группы
    const templateGroupIds = templateToGroupsMap.get(templateId) || []
    const cropGroupIds = cropToGroupsMap.get(cropId) || []

    if (templateGroupIds.length === 0 || cropGroupIds.length === 0) {
      return
    }

    // ✅ Ищем подходящую пару групп
    let cropGroupData: any = null

    for (const tgId of templateGroupIds) {
      for (const cgId of cropGroupIds) {
        const pairKey = `${tgId}_${cgId}`

        if (!validPairs.has(pairKey)) continue

        const templateGroupData = indicators[tgId.toString()]
        const data = templateGroupData?.[cgId.toString()]

        if (data) {
          cropGroupData = data
          break
        }
      }
      if (cropGroupData) break
    }

    if (!cropGroupData) {
      return
    }

    if (!templatesMap[templateId]) {
      templatesMap[templateId] = {
        template_id: templateId,
        template_name: templateName,
        stats: { green: 0, orange: 0, red: 0, total: 0 },
        crops: []
      }
    }

    const template = templatesMap[templateId]

    let crop = template.crops.find(c => c.crop_id === cropId)
    if (!crop) {
      crop = {
        crop_id: cropId,
        crop_name: cropName,
        stats: { green: 0, orange: 0, red: 0, total: 0 },
        measurements: []
      }
      template.crops.push(crop)
    }

    Object.values(report.scout_report_point).forEach(measurements => {
      measurements.forEach(measurement => {
        // ✅ Получаем числовое значение измерения
        const numericValue = getNumericValue(measurement.measurement_value)
        
        // Если значение невалидное - пропускаем это измерение
        if (numericValue === null) {
          console.warn(`Invalid measurement value for template ${templateId}, crop ${cropId}:`, measurement.measurement_value)
          return
        }

        const measurementTypeId = measurement.scout_report_measurement_type_id
        const zones = cropGroupData[measurementTypeId.toString()]

        if (!zones || zones.length === 0) return

        // ✅ Округляем значение до 2 знаков после запятой
        const roundedValue = roundValue(numericValue)

        // Определяем зону по порогам
        let currentZone: 'green' | 'orange' | 'red' = zones[0].zone
        for (let i = zones.length - 1; i >= 0; i--) {
          if (roundedValue >= zones[i].threshold_value) {
            currentZone = zones[i].zone
            break
          }
        }

        template.stats[currentZone]++
        template.stats.total++
        crop.stats[currentZone]++
        crop.stats.total++

        let measurementType = crop.measurements.find(
          m => m.measurement_type_id === measurementTypeId
        )

        if (!measurementType) {
          measurementType = {
            measurement_type_id: measurementTypeId,
            human_name: measurement.human_name,
            stats: { green: 0, orange: 0, red: 0, total: 0 },
            reports: []
          }
          crop.measurements.push(measurementType)
        }

        measurementType.stats[currentZone]++
        measurementType.stats.total++

        measurementType.reports.push({
          field_id: report.field_id,
          field_name: report.field_name,
          scout_report_id: report.scout_report_id,
          value: roundedValue,
          zone: currentZone,
          report_date: report.report_date
        })
      })
    })
  })

  return Object.values(templatesMap)
}