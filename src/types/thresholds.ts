// types/thresholds.ts
export type IndicatorZone = "green" | "yellow" | "red" | ""

export interface ThresholdRow {
  id?: number
  crop_id: number | null
  scout_report_template_id: number | null
  scout_report_measurement_type_id: number | null
  threshold_value: number | null
  indicator_zone: IndicatorZone
}

