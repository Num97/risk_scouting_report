export interface Measurement {
  human_name: string
  measurement_value: number
  scout_report_measurement_type_id: number
}

export interface ScoutReportPoint {
  [pointId: string]: Measurement[]
}

export interface ScoutReportItem {
  id: number
  crop_id: number
  crop_name: string

  field_id: number
  field_name: string
  field_group_name: string

  history_item_id: number
  scout_report_id: number

  end_time: string

  scout_report_point: ScoutReportPoint
  scout_report_template_id: number
    scout_report_template_name: string
}

// Интерфейсы индикаторов

export interface IndicatorZone {
  threshold_value: number
  zone: "green" | "orange" | "red"
}

export interface IndicatorMeasurement {
  [measurementTypeId: string]: IndicatorZone[]
}

export interface IndicatorCrop {
  [cropId: string]: IndicatorMeasurement
}

export interface IndicatorsResponse {
  [templateId: string]: IndicatorCrop
}

export interface IndicatorThreshold {
  id?: number;
  template_group_crop_group_measurement_id: number; // Новое обязательное поле
  scout_report_template_id: number | null;
  crop_id: number | null;
  scout_report_measurement_type_id: number | null;
  threshold_value: number | null;
  indicator_zone: 'green' | 'orange' | 'red';
}