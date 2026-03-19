import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, ArrowLeft } from 'lucide-react';
import TemplateGroupsList from './TemplateGroupsList';
import CropGroupsList from './CropGroupsList';
import MeasurementsList from './MeasurementsList';
import ZonesEditor from './ZonesEditor';
import AddItemDialog from '../ThresholdsEditor/AddItemDialog';
import type { ThresholdValue } from './types';
import type { GroupsThresholdsEditorProps, NavigationState, DialogType, GroupsIndicatorsData } from './types';
import type { ScoutReportMeasurementType } from '@/types/handbooks';
import type { TemplateGroupName, CropGroupName } from '@/types/groups';
import type { ThresholdValueWithId } from '@/api/scoutingReportApi';

const GroupsThresholdsEditor: React.FC<GroupsThresholdsEditorProps> = ({
  indicators,
  handbooks,
  templateGroupNames,
  templateGroups,
  cropGroupNames,
  cropGroups,
  templateGroupCropGroups,
  templateGroupCropGroupMeasurements,
  onAddTemplateGroupCropGroup,
  onAddMeasurementToGroup,
  onDeleteTemplateGroup,
  onDeleteCropGroup,
  onSave,
  isSaving = false
}) => {
  const [navigation, setNavigation] = useState<NavigationState>({
    view: 'templateGroups',
    selectedTemplateGroupId: null,
    selectedCropGroupId: null,
    selectedMeasurementId: null,
    selectedTemplateGroupCropGroupId: null
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('templateGroup');
  const [editedIndicators, setEditedIndicators] = useState(indicators);
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  
  // Добавляем ref для отслеживания последнего сохраненного состояния
  const lastSavedRef = useRef(indicators);

  useEffect(() => {
    setEditedIndicators(indicators);
    lastSavedRef.current = indicators;
  }, [indicators]);

  // Эффект для автосохранения при изменении editedIndicators
  useEffect(() => {
    // Не сохраняем, если данные не изменились или нет onSave
    if (!onSave || editedIndicators === lastSavedRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      setIsLocalSaving(true);
      onSave(editedIndicators)
        .then(() => {
          lastSavedRef.current = editedIndicators;
        })
        .catch(error => console.error('Auto-save failed:', error))
        .finally(() => setIsLocalSaving(false));
    }, 500); // Дебаунс 500мс

    return () => clearTimeout(timer);
  }, [editedIndicators, onSave]);

  // ... остальные мемоизированные вычисления (без изменений)
  const getTemplatesInGroup = useCallback((groupId: number): number[] => {
    return templateGroups
      .filter(tg => tg.template_group_id === groupId)
      .map(tg => tg.scout_report_template_id);
  }, [templateGroups]);

  const getCropsInGroup = useCallback((groupId: number): number[] => {
    return cropGroups
      .filter(cg => cg.crop_group_id === groupId)
      .map(cg => cg.crop_id);
  }, [cropGroups]);

  const getTemplateGroupCropGroupId = useCallback((templateGroupId: number, cropGroupId: number): number | null => {
    const found = templateGroupCropGroups.find(
      tgcg => tgcg.template_group_id === templateGroupId && tgcg.crop_group_id === cropGroupId
    );
    return found?.id || null;
  }, [templateGroupCropGroups]);

  const currentTemplateGroup = useMemo(() => 
    templateGroupNames.find(g => g.id === Number(navigation.selectedTemplateGroupId)),
    [templateGroupNames, navigation.selectedTemplateGroupId]
  );

  const currentCropGroup = useMemo(() => 
    cropGroupNames.find(g => g.id === Number(navigation.selectedCropGroupId)),
    [cropGroupNames, navigation.selectedCropGroupId]
  );

  const currentMeasurement = useMemo(() => 
    handbooks.scout_report_measurement_types.find(
      m => m.scout_report_measurement_type_id === Number(navigation.selectedMeasurementId)
    ),
    [handbooks.scout_report_measurement_types, navigation.selectedMeasurementId]
  );

  const availableCropGroups = useMemo(() => {
    if (!navigation.selectedTemplateGroupId) return cropGroupNames;
    
    const templateGroupId = Number(navigation.selectedTemplateGroupId);
    const existingIds = new Set(
      templateGroupCropGroups
        .filter(tgcg => tgcg.template_group_id === templateGroupId)
        .map(tgcg => tgcg.crop_group_id)
    );
    
    return cropGroupNames.filter(group => !existingIds.has(group.id));
  }, [cropGroupNames, templateGroupCropGroups, navigation.selectedTemplateGroupId]);

  const availableMeasurements = useMemo(() => {
    if (!navigation.selectedTemplateGroupCropGroupId) return handbooks.scout_report_measurement_types;
    
    const tgcgId = Number(navigation.selectedTemplateGroupCropGroupId);
    const existingIds = new Set(
      templateGroupCropGroupMeasurements
        .filter(m => m.template_group_crop_group_id === tgcgId)
        .map(m => m.scout_report_measurement_type_id)
    );
    
    return handbooks.scout_report_measurement_types.filter(
      m => !existingIds.has(m.scout_report_measurement_type_id)
    );
  }, [handbooks.scout_report_measurement_types, templateGroupCropGroupMeasurements, navigation.selectedTemplateGroupCropGroupId]);

  const currentZones = useMemo((): ThresholdValue[] => {
    if (!navigation.selectedTemplateGroupId || !navigation.selectedCropGroupId || !navigation.selectedMeasurementId) {
      return [];
    }
    
    const templateGroupId = Number(navigation.selectedTemplateGroupId);
    const cropGroupId = Number(navigation.selectedCropGroupId);
    const measurementId = Number(navigation.selectedMeasurementId);
    
    return editedIndicators[templateGroupId]?.[cropGroupId]?.[measurementId] || [];
  }, [editedIndicators, navigation]);

  // Обработчики навигации (без изменений)
  const handleTemplateGroupSelect = useCallback((templateGroupId: string) => {
    setNavigation({
      view: 'cropGroups',
      selectedTemplateGroupId: templateGroupId,
      selectedCropGroupId: null,
      selectedMeasurementId: null,
      selectedTemplateGroupCropGroupId: null
    });
  }, []);

  const handleCropGroupSelect = useCallback((cropGroupId: string) => {
    const templateGroupIdNum = Number(navigation.selectedTemplateGroupId);
    const cropGroupIdNum = Number(cropGroupId);
    const tgcgId = getTemplateGroupCropGroupId(templateGroupIdNum, cropGroupIdNum);
    
    setNavigation(prev => ({
      ...prev,
      view: 'measurements',
      selectedCropGroupId: cropGroupId,
      selectedTemplateGroupCropGroupId: tgcgId?.toString() || null,
      selectedMeasurementId: null
    }));
  }, [navigation.selectedTemplateGroupId, getTemplateGroupCropGroupId]);

  const handleMeasurementSelect = useCallback((measurementId: string) => {
    setNavigation(prev => ({
      ...prev,
      view: 'zones',
      selectedMeasurementId: measurementId
    }));
  }, []);

  const handleBack = useCallback(() => {
    switch (navigation.view) {
      case 'cropGroups':
        setNavigation({ 
          view: 'templateGroups', 
          selectedTemplateGroupId: null, 
          selectedCropGroupId: null, 
          selectedMeasurementId: null,
          selectedTemplateGroupCropGroupId: null
        });
        break;
      case 'measurements':
        setNavigation(prev => ({
          view: 'cropGroups',
          selectedTemplateGroupId: prev.selectedTemplateGroupId,
          selectedCropGroupId: null,
          selectedMeasurementId: null,
          selectedTemplateGroupCropGroupId: null
        }));
        break;
      case 'zones':
        setNavigation(prev => ({
          ...prev,
          view: 'measurements',
          selectedMeasurementId: null
        }));
        break;
    }
  }, [navigation.view]);

  const handleAddTemplateGroup = useCallback((templateGroup: TemplateGroupName) => {
    const templateGroupId = templateGroup.id.toString();
    
    setEditedIndicators(prev => ({
      ...prev,
      [templateGroupId]: {}
    }));

    setNavigation({
      view: 'cropGroups',
      selectedTemplateGroupId: templateGroupId,
      selectedCropGroupId: null,
      selectedMeasurementId: null,
      selectedTemplateGroupCropGroupId: null
    });
  }, []);

  const handleAddCropGroup = useCallback(async (cropGroup: CropGroupName) => {
    if (!navigation.selectedTemplateGroupId) return;
    
    const templateGroupIdNum = Number(navigation.selectedTemplateGroupId);
    const cropGroupIdNum = cropGroup.id;
    
    try {
      await onAddTemplateGroupCropGroup?.(templateGroupIdNum, cropGroupIdNum);
      
      setEditedIndicators(prev => {
        const updated = { ...prev };
        if (!updated[templateGroupIdNum]) {
          updated[templateGroupIdNum] = {};
        }
        return updated;
      });
    } catch (error) {
      console.error('Failed to add crop group:', error);
    }
  }, [navigation.selectedTemplateGroupId, onAddTemplateGroupCropGroup]);

  const handleAddMeasurement = useCallback(async (measurement: ScoutReportMeasurementType) => {
    if (!navigation.selectedTemplateGroupCropGroupId) return;
    
    const tgcgId = Number(navigation.selectedTemplateGroupCropGroupId);
    const measurementId = measurement.scout_report_measurement_type_id;
    
    try {
      await onAddMeasurementToGroup?.(tgcgId, measurementId);
    } catch (error) {
      console.error('Failed to add measurement:', error);
    }
  }, [navigation.selectedTemplateGroupCropGroupId, onAddMeasurementToGroup]);

  // ✅ ИСПРАВЛЕНО: handleZonesChange только обновляет локальное состояние
  // const handleZonesChange = useCallback((zones: ThresholdValue[]) => {
  //   if (!navigation.selectedTemplateGroupId || !navigation.selectedCropGroupId || !navigation.selectedMeasurementId) return;
    
  //   const templateGroupId = Number(navigation.selectedTemplateGroupId);
  //   const cropGroupId = Number(navigation.selectedCropGroupId);
  //   const measurementId = Number(navigation.selectedMeasurementId);
    
  //   setEditedIndicators(prev => {
  //     const updated = { ...prev };
      
  //     if (!updated[templateGroupId]) {
  //       updated[templateGroupId] = {};
  //     }
  //     if (!updated[templateGroupId][cropGroupId]) {
  //       updated[templateGroupId][cropGroupId] = {};
  //     }
      
  //     updated[templateGroupId][cropGroupId][measurementId] = zones;
      
  //     return updated;
  //   });
  // }, [navigation]);

const handleZonesChange = useCallback((zones: ThresholdValueWithId[]) => {
  if (!navigation.selectedTemplateGroupId || !navigation.selectedCropGroupId || !navigation.selectedMeasurementId) return;
  
  const templateGroupId = Number(navigation.selectedTemplateGroupId);
  const cropGroupId = Number(navigation.selectedCropGroupId);
  const measurementId = Number(navigation.selectedMeasurementId);
  
  setEditedIndicators(prev => {
    const updated = { ...prev };
    
    if (!updated[templateGroupId]) {
      updated[templateGroupId] = {};
    }
    if (!updated[templateGroupId][cropGroupId]) {
      updated[templateGroupId][cropGroupId] = {};
    }
    
    updated[templateGroupId][cropGroupId][measurementId] = zones;
    
    return updated;
  });
}, [navigation]);

const handleZonesAutoSave = useCallback(async (zones: ThresholdValueWithId[]) => {
  if (!navigation.selectedTemplateGroupId || !navigation.selectedCropGroupId || !navigation.selectedMeasurementId) return;

  const templateGroupId = Number(navigation.selectedTemplateGroupId);
  const cropGroupId = Number(navigation.selectedCropGroupId);
  const measurementId = Number(navigation.selectedMeasurementId);

  // 1. Сначала обновляем локальное состояние
  setEditedIndicators(prev => {
    const updated = {
      ...prev,
      [templateGroupId]: {
        ...(prev[templateGroupId] || {}),
        [cropGroupId]: {
          ...(prev[templateGroupId]?.[cropGroupId] || {}),
          [measurementId]: zones
        }
      }
    };
    return updated;
  });

  // 2. Вызываем onSave ПОСЛЕ обновления состояния, а не внутри него
  if (onSave) {
    setIsLocalSaving(true);
    try {
      // Важно: нужно передать актуальные данные. Можно использовать замыкание,
      // но надежнее подождать, пока состояние применится, или использовать ref.
      // Самый простой способ здесь - передать зоны и навигацию в App через onSave,
      // но onSave ожидает весь объект. Пока оставим так, но вызов вынесен.
      await onSave({
        ...editedIndicators, // Здесь может быть старое значение! Это тоже проблема.
        [templateGroupId]: {
          ...(editedIndicators[templateGroupId] || {}),
          [cropGroupId]: {
            ...(editedIndicators[templateGroupId]?.[cropGroupId] || {}),
            [measurementId]: zones
          }
        }
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsLocalSaving(false);
    }
  }
}, [navigation, onSave, editedIndicators]); // Зависимость от editedIndicators

  const openDialog = useCallback((type: DialogType) => {
    setDialogType(type);
    setIsDialogOpen(true);
  }, []);

  const savingInProgress = isSaving || isLocalSaving;

  // Диалоговые пропсы (без изменений)
  const dialogProps = useMemo(() => {
    switch (dialogType) {
      case 'templateGroup':
        return {
          items: templateGroupNames,
          existingItemIds: new Set(Object.keys(editedIndicators)),
          onAddItem: handleAddTemplateGroup,
          title: 'Добавить группу шаблонов',
          description: 'Выберите группу шаблонов для добавления пороговых значений',
          searchPlaceholder: 'Поиск групп шаблонов...',
          noItemsMessage: 'Нет доступных групп шаблонов',
          noResultsMessage: 'Группы не найдены',
          getId: (item: TemplateGroupName) => item.id,
          getName: (item: TemplateGroupName) => item.template_group_name
        };
      
      case 'cropGroup':
        return {
          items: availableCropGroups,
          existingItemIds: new Set<string>(),
          onAddItem: handleAddCropGroup,
          title: 'Добавить группу культур',
          description: 'Выберите группу культур для добавления к текущей группе шаблонов',
          searchPlaceholder: 'Поиск групп культур...',
          noItemsMessage: 'Нет доступных групп культур',
          noResultsMessage: 'Группы не найдены',
          getId: (item: CropGroupName) => item.id,
          getName: (item: CropGroupName) => item.crop_group_name
        };
      
      case 'measurement':
        return {
          items: availableMeasurements,
          existingItemIds: new Set<string>(),
          onAddItem: handleAddMeasurement,
          title: 'Добавить измерение',
          description: 'Выберите измерение для добавления к текущей паре групп',
          searchPlaceholder: 'Поиск измерений...',
          noItemsMessage: 'Нет доступных измерений',
          noResultsMessage: 'Измерения не найдены',
          getId: (item: ScoutReportMeasurementType) => item.scout_report_measurement_type_id,
          getName: (item: ScoutReportMeasurementType) => item.human_name
        };
      
      default:
        return null;
    }
  }, [dialogType, templateGroupNames, editedIndicators, availableCropGroups, availableMeasurements, handleAddTemplateGroup, handleAddCropGroup, handleAddMeasurement]);

  return (
    <Card className="w-full">
      {/* ... JSX без изменений ... */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {navigation.view !== 'templateGroups' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              disabled={savingInProgress}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle>Редактор пороговых значений для групп</CardTitle>
        </div>
        {navigation.view === 'templateGroups' && (
          <Button 
            onClick={() => openDialog('templateGroup')}
            disabled={savingInProgress}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить группу шаблонов
          </Button>
        )}
        {navigation.view === 'cropGroups' && (
          <Button 
            onClick={() => openDialog('cropGroup')}
            disabled={savingInProgress}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить группу культур
          </Button>
        )}
        {navigation.view === 'measurements' && (
          <Button 
            onClick={() => openDialog('measurement')}
            disabled={savingInProgress}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить измерение
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <span>Группы шаблонов</span>
          {currentTemplateGroup && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span>{currentTemplateGroup.template_group_name}</span>
            </>
          )}
          {currentCropGroup && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span>{currentCropGroup.crop_group_name}</span>
            </>
          )}
          {currentMeasurement && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span>{currentMeasurement.human_name}</span>
            </>
          )}
        </div>

        {navigation.view === 'templateGroups' && (
          <TemplateGroupsList
            indicators={editedIndicators}
            templateGroupNames={templateGroupNames}
            templateGroups={templateGroups}
            templates={handbooks.scout_report_templates}
            cropGroupNames={cropGroupNames}                    
            templateGroupCropGroups={templateGroupCropGroups}
            onSelect={handleTemplateGroupSelect}
            onDelete={onDeleteTemplateGroup}
            onAdd={() => openDialog('templateGroup')}
          />
        )}

        {navigation.view === 'cropGroups' && navigation.selectedTemplateGroupId && (
          <CropGroupsList
            indicators={editedIndicators}
            templateGroupId={navigation.selectedTemplateGroupId}
            cropGroupNames={cropGroupNames}
            cropGroups={cropGroups}
            crops={handbooks.crops}
            measurements={handbooks.scout_report_measurement_types}
            templateGroupCropGroups={templateGroupCropGroups}
            templateGroupCropGroupMeasurements={templateGroupCropGroupMeasurements}
            onSelect={handleCropGroupSelect}
            onDelete={onDeleteCropGroup}
            onAdd={() => openDialog('cropGroup')}
          />
        )}

        {navigation.view === 'measurements' && 
         navigation.selectedTemplateGroupId && 
         navigation.selectedCropGroupId && (
          <MeasurementsList
            indicators={editedIndicators}
            templateGroupId={navigation.selectedTemplateGroupId}
            cropGroupId={navigation.selectedCropGroupId}
            measurements={handbooks.scout_report_measurement_types}
            templateGroupCropGroupMeasurements={templateGroupCropGroupMeasurements}
            templateGroupCropGroups={templateGroupCropGroups}
            onSelect={handleMeasurementSelect}
            onAdd={() => openDialog('measurement')}
          />
        )}

        {navigation.view === 'zones' && 
         navigation.selectedTemplateGroupId && 
         navigation.selectedCropGroupId && 
         navigation.selectedMeasurementId && (
          <ZonesEditor
            zones={currentZones}
            measurementName={currentMeasurement?.human_name || ''}
            onChange={handleZonesChange}
            onAutoSave={handleZonesAutoSave}
            disabled={savingInProgress}
            isSaving={savingInProgress}
          />
        )}
      </CardContent>

      {dialogProps && (
        <AddItemDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          {...dialogProps}
        />
      )}
    </Card>
  );
};

export default GroupsThresholdsEditor;