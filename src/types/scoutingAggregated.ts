export interface ReportMeasurement {
  field_id: number
  field_name: string
  scout_report_id: number
  value: number
  zone: 'green' | 'orange' | 'red'
  report_date: string
}

export interface MeasurementTypeData {
  measurement_type_id: number
  human_name: string
  stats: { green: number; orange: number; red: number; total: number }
  reports: ReportMeasurement[]
}

export interface CropData {
  crop_id: number
  crop_name: string
  stats: { green: number; orange: number; red: number; total: number }
  measurements: MeasurementTypeData[]
}

export interface TemplateData {
  template_id: number
  template_name: string
  stats: { green: number; orange: number; red: number; total: number }
  crops: CropData[]
}