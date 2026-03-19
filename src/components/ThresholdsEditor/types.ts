import type { Crop, ScoutReportTemplate, ScoutReportMeasurementType } from '../../types/handbooks';

export type ViewType = 'templates' | 'crops' | 'measurements' | 'zones';
export type DialogType = 'template' | 'crop' | 'measurement';

export interface NavigationState {
  view: ViewType;
  selectedTemplateId: string | null;
  selectedCropId: string | null;
  selectedMeasurementId: string | null;
}

export interface ThresholdValue {
  threshold_value: number;
  zone: 'green' | 'orange' | 'red';
}

export type MeasurementThresholds = ThresholdValue[];

export interface IndicatorsData {
  [templateId: string]: {
    [cropId: string]: {
      [measurementId: string]: MeasurementThresholds;
    };
  };
}

export interface HandbooksData {
  crops: Crop[];
  scout_report_templates: ScoutReportTemplate[];
  scout_report_measurement_types: ScoutReportMeasurementType[];
}

export interface ThresholdsEditorProps {
  indicators: IndicatorsData;
  handbooks: HandbooksData;
  onSave?: (indicators: IndicatorsData) => Promise<void>;
  onDeleteTemplate?: (templateId: number) => Promise<void>;
  onDeleteCrop?: (templateId: number, cropId: number) => Promise<void>;
  isSaving?: boolean;
}

export interface TemplatesListProps {
  indicators: IndicatorsData;
  templates: ScoutReportTemplate[];
  onSelect: (templateId: string) => void;
  crops: Crop[];
  onDeleteTemplate?: (templateId: number) => Promise<void>;
  onAdd: () => void;
}

export interface CropsListProps {
  indicators: IndicatorsData;
  templateId: string;
  crops: Crop[];
  measurements: ScoutReportMeasurementType[];
  onSelect: (cropId: string) => void;
  onDeleteCrop?: (templateId: number, cropId: number) => Promise<void>;
  onAdd: () => void;
}

export interface MeasurementsListProps {
  indicators: IndicatorsData;
  templateId: string;
  cropId: string;
  measurements: ScoutReportMeasurementType[];
  onSelect: (measurementId: string) => void;
  onAdd: () => void;
}

export interface ZonesEditorProps {
  zones: MeasurementThresholds;
  measurementName: string;
  onChange: (zones: MeasurementThresholds) => void;
  onAutoSave?: (zones: MeasurementThresholds) => Promise<void>; // Добавляем
  disabled?: boolean;
  isSaving?: boolean; // Добавляем
}