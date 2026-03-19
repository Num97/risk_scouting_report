import type { Crop, ScoutReportTemplate, ScoutReportMeasurementType } from '@/types/handbooks';
import type { 
  TemplateGroupName, 
  TemplateGroup, 
  CropGroupName, 
  CropGroup,
  TemplateGroupCropGroup,
  TemplateGroupCropGroupMeasurement 
} from '@/types/groups';
import type { ThresholdValueWithId } from '@/api/scoutingReportApi';

export type ViewType = 'templateGroups' | 'cropGroups' | 'measurements' | 'zones';
export type DialogType = 'templateGroup' | 'cropGroup' | 'measurement';

export interface NavigationState {
  view: ViewType;
  selectedTemplateGroupId: string | null;
  selectedCropGroupId: string | null;
  selectedMeasurementId: string | null;
  selectedTemplateGroupCropGroupId: string | null; // Добавляем ID связки групп
}

export interface ThresholdValue {
  threshold_value: number;
  zone: 'green' | 'orange' | 'red';
}

export type MeasurementThresholds = ThresholdValue[];

// Новая структура данных для группового редактора
export interface GroupsIndicatorsData {
  [templateGroupId: string]: {
    [cropGroupId: string]: {
      [measurementId: string]: MeasurementThresholds; // MeasurementThresholds - это массив ThresholdValue[]
    };
  };
}

export interface GroupsHandbooksData {
  crops: Crop[];
  scout_report_templates: ScoutReportTemplate[];
  scout_report_measurement_types: ScoutReportMeasurementType[];
}

export interface GroupsThresholdsEditorProps {
  indicators: GroupsIndicatorsData;
  handbooks: GroupsHandbooksData;
  
  // Группы
  templateGroupNames: TemplateGroupName[];
  templateGroups: TemplateGroup[];
  cropGroupNames: CropGroupName[];
  cropGroups: CropGroup[];
  
  // Новые связи
  templateGroupCropGroups: TemplateGroupCropGroup[]; // связи групп шаблонов с группами культур
  templateGroupCropGroupMeasurements: TemplateGroupCropGroupMeasurement[]; // измерения для связок групп
  
  // Функции для управления связями
  onAddTemplateGroupCropGroup?: (templateGroupId: number, cropGroupId: number) => Promise<number>;
  onRemoveTemplateGroupCropGroup?: (id: number) => Promise<void>;
  onAddMeasurementToGroup?: (templateGroupCropGroupId: number, measurementTypeId: number) => Promise<number>;
  onRemoveMeasurementFromGroup?: (id: number) => Promise<void>;
  
  // Сохранение и удаление
  onSave?: (indicators: GroupsIndicatorsData) => Promise<void>;
  onDeleteTemplateGroup?: (templateGroupId: number) => Promise<void>;
  onDeleteCropGroup?: (templateGroupId: number, cropGroupId: number) => Promise<void>;
  
  isSaving?: boolean;
}

export interface TemplateGroupsListProps {
  indicators: GroupsIndicatorsData;
  templateGroupNames: TemplateGroupName[];
  templateGroups: TemplateGroup[];
  templates: ScoutReportTemplate[];
  cropGroupNames: CropGroupName[];                    // Добавляем
  templateGroupCropGroups: TemplateGroupCropGroup[];   // Добавляем
  onSelect: (templateGroupId: string) => void;
  onDelete?: (templateGroupId: number) => Promise<void>;
  onAdd: () => void;
  isLoading?: boolean;
}

export interface CropGroupsListProps {
  indicators: GroupsIndicatorsData;
  templateGroupId: string;
  cropGroupNames: CropGroupName[];
  cropGroups: CropGroup[];
  crops: Crop[];
  measurements: ScoutReportMeasurementType[];
  templateGroupCropGroups: TemplateGroupCropGroup[];
  templateGroupCropGroupMeasurements: TemplateGroupCropGroupMeasurement[]; // Добавляем
  onSelect: (cropGroupId: string) => void;
  onDelete?: (templateGroupId: number, cropGroupId: number) => Promise<void>;
  onAdd: () => void;
  isLoading?: boolean;
}

export interface MeasurementsListProps {
  indicators: GroupsIndicatorsData;
  templateGroupId: string;
  cropGroupId: string;
  measurements: ScoutReportMeasurementType[];
  templateGroupCropGroupMeasurements: TemplateGroupCropGroupMeasurement[]; // Добавляем для отображения уже добавленных измерений
  templateGroupCropGroups: TemplateGroupCropGroup[]; // Нужно для получения ID связки
  onSelect: (measurementId: string) => void;
  onAdd: () => void;
}

export interface ZonesEditorProps {
  zones: ThresholdValueWithId[]; // <-- меняем на тип с id
  measurementName: string;
  onChange: (zones: ThresholdValueWithId[]) => void;
  onAutoSave?: (zones: ThresholdValueWithId[]) => Promise<void>;
  disabled?: boolean;
  isSaving?: boolean;
}