// types/groups.ts

// ======================
// TEMPLATE GROUP NAMES
// ======================
export interface TemplateGroupName {
  id: number;
  template_group_name: string;
}

// ======================
// TEMPLATE GROUPS
// ======================
export interface TemplateGroup {
  id: number;
  template_group_id: number;
  scout_report_template_id: number;
}

// Расширенный тип для отображения на фронте (с названиями)
export interface TemplateGroupWithNames extends TemplateGroup {
  template_group_name: string;
  scout_report_template_name: string;
}

// ======================
// CROP GROUP NAMES
// ======================
export interface CropGroupName {
  id: number;
  crop_group_name: string;
}

// ======================
// CROP GROUPS
// ======================
export interface CropGroup {
  id: number;
  crop_group_id: number;
  crop_id: number;
}

// Расширенный тип для отображения на фронте (с названиями)
export interface CropGroupWithNames extends CropGroup {
  crop_group_name: string;
  crop_name: string;
}

export interface TemplateGroupCropGroup {
  id: number;
  template_group_id: number;
  crop_group_id: number;
  created_at?: string;
}

// Модель для таблицы template_group_crop_group_measurements
export interface TemplateGroupCropGroupMeasurement {
  id: number;
  template_group_crop_group_id: number;
  scout_report_measurement_type_id: number;
  created_at?: string;
}

// Расширенный тип для отображения на фронте
export interface TemplateGroupCropGroupWithDetails extends TemplateGroupCropGroup {
  template_group_name: string;
  crop_group_name: string;
  measurements: TemplateGroupCropGroupMeasurement[];
}