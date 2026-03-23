// import type { ScoutReportItem, IndicatorsResponse } from "../types/scoutingReport"
// import type { TemplateData, CropData, MeasurementTypeData } from "../types/scoutingAggregated"

// export function aggregateTemplates(
//   reports: ScoutReportItem[],
//   indicators: IndicatorsResponse
// ): TemplateData[] {

//   const templatesMap: Record<number, TemplateData> = {}

//   reports.forEach(report => {

//     const templateId = report.scout_report_template_id
//     const templateName = report.scout_report_template_name
//     const cropId = report.crop_id
//     const cropName = report.crop_name

//     if (!templatesMap[templateId]) {
//       templatesMap[templateId] = {
//         template_id: templateId,
//         template_name: templateName,
//         stats: { green: 0, orange: 0, red: 0, total: 0 },
//         crops: []
//       }
//     }

//     const template = templatesMap[templateId]

//     let crop = template.crops.find(c => c.crop_id === cropId)

//     if (!crop) {
//       crop = {
//         crop_id: cropId,
//         crop_name: cropName,
//         stats: { green: 0, orange: 0, red: 0, total: 0 },
//         measurements: []
//       }

//       template.crops.push(crop)
//     }

//     Object.values(report.scout_report_point).forEach(measurements => {

//       measurements.forEach(measurement => {

//         if (measurement.measurement_value === null) return

//         const measurementTypeId = measurement.scout_report_measurement_type_id

//         const cropIndicators =
//           indicators[String(templateId)]?.[cropId]

//         if (!cropIndicators) return

//         const zones = cropIndicators[measurementTypeId]

//         if (!zones) return

//         let currentZone: 'green' | 'orange' | 'red' = zones[0].zone

//         zones.forEach(z => {
//           if (measurement.measurement_value >= z.threshold_value) {
//             currentZone = z.zone
//           }
//         })

//         // TEMPLATE STATS
//         template.stats[currentZone]++
//         template.stats.total++

//         // CROP STATS
//         crop.stats[currentZone]++
//         crop.stats.total++

//         // Measurement type
//         let measurementType =
//           crop.measurements.find(m => m.measurement_type_id === measurementTypeId)

//         if (!measurementType) {

//           measurementType = {
//             measurement_type_id: measurementTypeId,
//             human_name: measurement.human_name,
//             stats: { green: 0, orange: 0, red: 0, total: 0 },
//             reports: []
//           }

//           crop.measurements.push(measurementType)
//         }

//         measurementType.stats[currentZone]++
//         measurementType.stats.total++

//         measurementType.reports.push({
//           field_id: report.field_id,
//           field_name: report.field_name,
//           scout_report_id: report.scout_report_id,
//           value: measurement.measurement_value,
//           zone: currentZone
//         })

//       })
//     })
//   })

//   return Object.values(templatesMap)
// }
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

  // Создаем маппинги
  const templateToGroupMap = new Map<number, number>()
  templateGroups.forEach(tg => {
    templateToGroupMap.set(tg.scout_report_template_id, tg.template_group_id)
  })

  const cropToGroupMap = new Map<number, number>()
  cropGroups.forEach(cg => {
    cropToGroupMap.set(cg.crop_id, cg.crop_group_id)
  })

  // Создаем Set для проверки существования пары групп
  const validPairs = new Set<string>()
  templateGroupCropGroups.forEach(tgcg => {
    validPairs.add(`${tgcg.template_group_id}_${tgcg.crop_group_id}`)
  })

  reports.forEach(report => {
    const templateId = report.scout_report_template_id
    const templateName = report.scout_report_template_name
    const cropId = report.crop_id
    const cropName = report.crop_name

    // Получаем группы
    const templateGroupId = templateToGroupMap.get(templateId)
    const cropGroupId = cropToGroupMap.get(cropId)

    // Если нет группы для шаблона или культуры - пропускаем (нет порогов)
    if (!templateGroupId || !cropGroupId) {
      return
    }

    // Проверяем, есть ли связь между этими группами
    const pairKey = `${templateGroupId}_${cropGroupId}`
    if (!validPairs.has(pairKey)) {
      return
    }

    // Получаем пороги для этой пары групп
    const templateGroupData = indicators[templateGroupId.toString()]
    const cropGroupData = templateGroupData?.[cropGroupId.toString()]
    
    if (!cropGroupData) {
      return
    }

    // Создаем или находим шаблон в результате
    if (!templatesMap[templateId]) {
      templatesMap[templateId] = {
        template_id: templateId,
        template_name: templateName,
        stats: { green: 0, orange: 0, red: 0, total: 0 },
        crops: []
      }
    }

    const template = templatesMap[templateId]

    // Находим или создаем культуру
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

    // Обрабатываем измерения
    Object.values(report.scout_report_point).forEach(measurements => {
      measurements.forEach(measurement => {
        if (measurement.measurement_value === null) return

        const measurementTypeId = measurement.scout_report_measurement_type_id
        const zones = cropGroupData[measurementTypeId.toString()]

        if (!zones || zones.length === 0) return

        // Определяем зону по порогам
        let currentZone: 'green' | 'orange' | 'red' = zones[0].zone
        for (let i = zones.length - 1; i >= 0; i--) {
          if (measurement.measurement_value >= zones[i].threshold_value) {
            currentZone = zones[i].zone
            break
          }
        }

        // Обновляем статистику
        template.stats[currentZone]++
        template.stats.total++
        crop.stats[currentZone]++
        crop.stats.total++

        // Находим или создаем измерение
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
          value: measurement.measurement_value,
          zone: currentZone
        })
      })
    })
  })

  return Object.values(templatesMap)
}