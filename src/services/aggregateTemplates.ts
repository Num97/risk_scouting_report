import type { ScoutReportItem, IndicatorsResponse } from "../types/scoutingReport"
import type { TemplateData, CropData, MeasurementTypeData } from "../types/scoutingAggregated"

export function aggregateTemplates(
  reports: ScoutReportItem[],
  indicators: IndicatorsResponse
): TemplateData[] {

  const templatesMap: Record<number, TemplateData> = {}

  reports.forEach(report => {

    const templateId = report.scout_report_template_id
    const templateName = report.scout_report_template_name
    const cropId = report.crop_id
    const cropName = report.crop_name

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

        if (measurement.measurement_value === null) return

        const measurementTypeId = measurement.scout_report_measurement_type_id

        const cropIndicators =
          indicators[String(templateId)]?.[cropId]

        if (!cropIndicators) return

        const zones = cropIndicators[measurementTypeId]

        if (!zones) return

        let currentZone: 'green' | 'orange' | 'red' = zones[0].zone

        zones.forEach(z => {
          if (measurement.measurement_value >= z.threshold_value) {
            currentZone = z.zone
          }
        })

        // TEMPLATE STATS
        template.stats[currentZone]++
        template.stats.total++

        // CROP STATS
        crop.stats[currentZone]++
        crop.stats.total++

        // Measurement type
        let measurementType =
          crop.measurements.find(m => m.measurement_type_id === measurementTypeId)

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