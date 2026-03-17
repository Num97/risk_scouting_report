import type { ScoutReportItem, IndicatorsResponse } from "../types/scoutingReport"
import type { IndicatorsData, ThresholdValue } from "../components/ThresholdsEditor/types"

interface ScoutReportsResponse {
  count: number
  data: ScoutReportItem[]
}

export interface IndicatorThreshold {
  id?: number;
  scout_report_template_id: number;
  crop_id: number;
  scout_report_measurement_type_id: number;
  threshold_value: number;
  indicator_zone: string;
}

// Расширим тип ThresholdValue, чтобы включить ID
export interface ThresholdValueWithId extends ThresholdValue {
  id?: number; // ID правила из БД
}

export async function getScoutReports(season: number): Promise<ScoutReportItem[]> {
  const res = await fetch(`/api/v1/risc_scouting_report?season=${season}`)

  if (!res.ok) {
    throw new Error("Failed to load scouting reports")
  }

  const json: ScoutReportsResponse = await res.json()
  return json.data
}

export async function getIndicators(): Promise<IndicatorsResponse> {
  const res = await fetch(`/api/v1/risc_scouting_report/indicators/`)

  if (!res.ok) {
    throw new Error("Failed to load indicators")
  }

  return res.json()
}

// Получаем все правила в плоском виде с ID
export async function getAllThresholds(): Promise<IndicatorThreshold[]> {
  const res = await fetch(`/api/v1/risc_scouting_report/indicators/`)
  
  if (!res.ok) {
    throw new Error("Failed to load thresholds")
  }
  
  const data = await res.json()
  const flatList: IndicatorThreshold[] = []
  
  // Преобразуем вложенную структуру в плоский список
  Object.entries(data).forEach(([templateId, templateData]: [string, any]) => {
    Object.entries(templateData).forEach(([cropId, cropData]: [string, any]) => {
      Object.entries(cropData).forEach(([measurementId, zones]: [string, any]) => {
        zones.forEach((zone: any) => {
          flatList.push({
            id: zone.id, // предполагаем, что сервер вернет ID
            scout_report_template_id: Number(templateId),
            crop_id: Number(cropId),
            scout_report_measurement_type_id: Number(measurementId),
            threshold_value: zone.threshold_value,
            indicator_zone: zone.zone
          })
        })
      })
    })
  })
  
  return flatList
}

// Преобразуем наши данные с учетом ID
export function flattenIndicatorsWithIds(indicators: IndicatorsData, existingRules: IndicatorThreshold[]): IndicatorThreshold[] {
  const flatList: IndicatorThreshold[] = [];
  
  // Создаем Map для быстрого поиска существующих правил по уникальному ключу
  const ruleMap = new Map(
    existingRules.map(rule => [
      `${rule.scout_report_template_id}_${rule.crop_id}_${rule.scout_report_measurement_type_id}_${rule.threshold_value}`,
      rule
    ])
  );

  Object.entries(indicators).forEach(([templateId, templateData]) => {
    Object.entries(templateData).forEach(([cropId, cropData]) => {
      Object.entries(cropData).forEach(([measurementId, zones]) => {
        zones.forEach((zone) => {
          const key = `${templateId}_${cropId}_${measurementId}_${zone.threshold_value}`;
          const existingRule = ruleMap.get(key);
          
          flatList.push({
            id: existingRule?.id, // Сохраняем ID если правило уже существовало
            scout_report_template_id: Number(templateId),
            crop_id: Number(cropId),
            scout_report_measurement_type_id: Number(measurementId),
            threshold_value: zone.threshold_value,
            indicator_zone: zone.zone
          });
        });
      });
    });
  });

  return flatList;
}

// Создание нового правила
export async function createIndicatorThreshold(rule: IndicatorThreshold): Promise<number> {
  const res = await fetch(`/api/v1/risc_scouting_report/indicators/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rule),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Create rule failed:', {
      status: res.status,
      statusText: res.statusText,
      error: errorData,
      rule
    });
    throw new Error(errorData.error || `Failed to create indicator threshold (${res.status})`);
  }

  const result = await res.json();
  return result.id;
}

// Обновление существующего правила
export async function updateIndicatorThreshold(id: number, rule: IndicatorThreshold): Promise<void> {
  const res = await fetch(`/api/v1/risc_scouting_report/indicators/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rule),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Update rule failed:', {
      id,
      status: res.status,
      statusText: res.statusText,
      error: errorData,
      rule
    });
    throw new Error(errorData.error || `Failed to update indicator threshold (${res.status})`);
  }
}

// Удаление правила
export async function deleteIndicatorThreshold(id: number): Promise<void> {
  const res = await fetch(`/api/v1/risc_scouting_report/indicators/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('Delete rule failed:', {
      id,
      status: res.status,
      statusText: res.statusText,
      error: errorData
    });
    throw new Error(errorData.error || `Failed to delete indicator threshold (${res.status})`);
  }
}

// Находим изменения между старыми и новыми данными
export function findChanges(
  oldRules: IndicatorThreshold[], 
  newRules: IndicatorThreshold[]
): {
  toCreate: IndicatorThreshold[],
  toUpdate: { id: number; data: IndicatorThreshold }[],
  toDelete: number[]
} {
  const toCreate: IndicatorThreshold[] = [];
  const toUpdate: { id: number; data: IndicatorThreshold }[] = [];
  const toDelete: number[] = [];

  // Создаем карты для быстрого поиска
  // const oldMap = new Map(oldRules.map(rule => [rule.id, rule]));
  
  // Для новых правил создаем ключ по уникальным полям (без id)
  const newKeyMap = new Map(
    newRules.map(rule => [
      `${rule.scout_report_template_id}_${rule.crop_id}_${rule.scout_report_measurement_type_id}_${rule.threshold_value}`,
      rule
    ])
  );

  // Создаем карту старых правил по их уникальному ключу
  const oldKeyMap = new Map(
    oldRules.map(rule => [
      `${rule.scout_report_template_id}_${rule.crop_id}_${rule.scout_report_measurement_type_id}_${rule.threshold_value}`,
      rule
    ])
  );

  console.log('Old rules:', oldRules);
  console.log('New rules:', newRules);

  // Ищем новые и измененные записи
  newRules.forEach(newRule => {
    const key = `${newRule.scout_report_template_id}_${newRule.crop_id}_${newRule.scout_report_measurement_type_id}_${newRule.threshold_value}`;
    const existingRule = oldKeyMap.get(key);

    if (!existingRule) {
      // Совсем новое правило
      console.log('New rule to create:', newRule);
      toCreate.push(newRule);
    } else if (existingRule.id) {
      // Правило существует, проверяем, изменилась ли зона
      if (existingRule.indicator_zone !== newRule.indicator_zone) {
        console.log('Rule to update:', { id: existingRule.id, data: newRule });
        toUpdate.push({ id: existingRule.id, data: newRule });
      } else {
        console.log('Rule unchanged:', existingRule.id);
      }
    }
  });

  // Ищем удаленные записи
  oldRules.forEach(oldRule => {
    if (!oldRule.id) return; // Пропускаем правила без id

    const key = `${oldRule.scout_report_template_id}_${oldRule.crop_id}_${oldRule.scout_report_measurement_type_id}_${oldRule.threshold_value}`;
    const stillExists = newKeyMap.has(key);

    if (!stillExists) {
      console.log('Rule to delete:', oldRule.id);
      toDelete.push(oldRule.id);
    }
  });

  return { toCreate, toUpdate, toDelete };
}

// Сохраняем все изменения
export async function saveAllThresholds(
  oldData: IndicatorsData, 
  newData: IndicatorsData,
  existingRules: IndicatorThreshold[] // Все существующие правила с ID
): Promise<void> {
  // Преобразуем данные в плоский список с ID
  const oldRules = flattenIndicatorsWithIds(oldData, existingRules);
  const newRules = flattenIndicatorsWithIds(newData, existingRules);
  
  const changes = findChanges(oldRules, newRules);
  
  console.log('Changes to save:', changes);

  // Выполняем все операции последовательно для надежности
  const results = [];
  
  // Сначала удаляем (чтобы освободить ключи, если нужно)
  for (const id of changes.toDelete) {
    try {
      await deleteIndicatorThreshold(id);
      results.push({ type: 'delete', success: true, id });
      console.log(`Deleted rule ${id}`);
    } catch (error) {
      console.error(`Failed to delete rule ${id}:`, error);
      throw error;
    }
  }

  // Потом обновляем существующие
  for (const { id, data } of changes.toUpdate) {
    try {
      await updateIndicatorThreshold(id, data);
      results.push({ type: 'update', success: true, id });
      console.log(`Updated rule ${id}`);
    } catch (error) {
      console.error(`Failed to update rule ${id}:`, error);
      throw error;
    }
  }

  // В конце создаем новые
  for (const item of changes.toCreate) {
    try {
      const newId = await createIndicatorThreshold(item);
      results.push({ type: 'create', success: true, id: newId });
      console.log(`Created rule for template ${item.scout_report_template_id}, crop ${item.crop_id}, measurement ${item.scout_report_measurement_type_id}`);
    } catch (error) {
      console.error('Failed to create rule:', item, error);
      throw error;
    }
  }

  console.log('All changes saved:', results);
}

export async function deleteTemplateThresholds(templateId: number): Promise<void> {
  // Получаем все актуальные правила
  const allRules = await getAllThresholds();
  
  // Фильтруем правила для этого шаблона
  const rulesToDelete = allRules.filter(rule => rule.scout_report_template_id === templateId);
  
  console.log(`🗑️ Found ${rulesToDelete.length} rules to delete for template ${templateId}`);
  
  // Удаляем каждое правило
  for (const rule of rulesToDelete) {
    if (rule.id) {
      await deleteIndicatorThreshold(rule.id);
    }
  }
  
  console.log(`✅ Deleted ${rulesToDelete.length} rules for template ${templateId}`);
}

export async function deleteCropThresholds(templateId: number, cropId: number): Promise<void> {
  // Получаем все актуальные правила
  const allRules = await getAllThresholds();
  
  // Фильтруем правила для этого шаблона и культуры
  const rulesToDelete = allRules.filter(
    rule => rule.scout_report_template_id === templateId && rule.crop_id === cropId
  );
  
  console.log(`🗑️ Found ${rulesToDelete.length} rules to delete for template ${templateId}, crop ${cropId}`);
  
  // Удаляем каждое правило
  for (const rule of rulesToDelete) {
    if (rule.id) {
      await deleteIndicatorThreshold(rule.id);
    }
  }
  
  console.log(`✅ Deleted ${rulesToDelete.length} rules for template ${templateId}, crop ${cropId}`);
}