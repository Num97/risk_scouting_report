export interface Crop {
  crop_id: number
  crop_name: string
}

export interface ScoutReportTemplate {
  scout_report_template_id: number
  scout_report_template_name: string
}

export interface ScoutReportMeasurementType {
  scout_report_measurement_type_id: number
  human_name: string
}

export interface HandbooksResponse {
  crops: Crop[]
  scout_report_templates: ScoutReportTemplate[]
  scout_report_measurement_types: ScoutReportMeasurementType[]
}

export type TabType = "templates" | "farms" | "stats"