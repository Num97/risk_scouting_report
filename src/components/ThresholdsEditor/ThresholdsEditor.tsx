import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, ArrowLeft } from 'lucide-react';
import TemplatesList from './TemplatesList';
import CropsList from './CropsList';
import MeasurementsList from './MeasurementsList';
import ZonesEditor from './ZonesEditor';
import AddItemDialog from './AddItemDialog';
import type { ThresholdsEditorProps, NavigationState, DialogType } from './types';
import type { ScoutReportTemplate, Crop, ScoutReportMeasurementType } from '@/types/handbooks';

const ThresholdsEditor: React.FC<ThresholdsEditorProps> = ({
  indicators,
  handbooks,
  onSave,
  onDeleteTemplate,
  onDeleteCrop,
  isSaving = false
}) => {
  console.log('ThresholdsEditor received indicators:', indicators);

  const [navigation, setNavigation] = useState<NavigationState>({
    view: 'templates',
    selectedTemplateId: null,
    selectedCropId: null,
    selectedMeasurementId: null
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>('template');
  const [editedIndicators, setEditedIndicators] = useState(indicators);
  const [isLocalSaving, setIsLocalSaving] = useState(false);

  useEffect(() => {
    setEditedIndicators(indicators);
  }, [indicators]);

  const handleTemplateSelect = (templateId: string) => {
    setNavigation({
      view: 'crops',
      selectedTemplateId: templateId,
      selectedCropId: null,
      selectedMeasurementId: null
    });
  };

  const handleCropSelect = (cropId: string) => {
    setNavigation(prev => ({
      ...prev,
      view: 'measurements',
      selectedCropId: cropId,
      selectedMeasurementId: null
    }));
  };

  const handleMeasurementSelect = (measurementId: string) => {
    setNavigation(prev => ({
      ...prev,
      view: 'zones',
      selectedMeasurementId: measurementId
    }));
  };

  const handleBack = () => {
    switch (navigation.view) {
      case 'crops':
        setNavigation({ view: 'templates', selectedTemplateId: null, selectedCropId: null, selectedMeasurementId: null });
        break;
      case 'measurements':
        setNavigation(prev => ({
          view: 'crops',
          selectedTemplateId: prev.selectedTemplateId,
          selectedCropId: null,
          selectedMeasurementId: null
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
  };

  const handleAddTemplate = (template: ScoutReportTemplate) => {
    const templateId = template.scout_report_template_id.toString();
    
    setEditedIndicators(prev => ({
      ...prev,
      [templateId]: {}
    }));

    setNavigation({
      view: 'crops',
      selectedTemplateId: templateId,
      selectedCropId: null,
      selectedMeasurementId: null
    });
  };

  const handleAddCrop = (crop: Crop) => {
    if (!navigation.selectedTemplateId) return;
    
    const cropId = crop.crop_id.toString();
    
    setEditedIndicators(prev => ({
      ...prev,
      [navigation.selectedTemplateId!]: {
        ...prev[navigation.selectedTemplateId!],
        [cropId]: {}
      }
    }));
  };

  const handleAddMeasurement = (measurement: ScoutReportMeasurementType) => {
    if (!navigation.selectedTemplateId || !navigation.selectedCropId) return;
    
    const measurementId = measurement.scout_report_measurement_type_id.toString();
    
    setEditedIndicators(prev => ({
      ...prev,
      [navigation.selectedTemplateId!]: {
        ...prev[navigation.selectedTemplateId!],
        [navigation.selectedCropId!]: {
          ...prev[navigation.selectedTemplateId!]?.[navigation.selectedCropId!],
          [measurementId]: []
        }
      }
    }));
  };

  const handleZonesChange = (zones: any[]) => {
    if (navigation.selectedTemplateId && navigation.selectedCropId && navigation.selectedMeasurementId) {
      setEditedIndicators(prev => ({
        ...prev,
        [navigation.selectedTemplateId!]: {
          ...prev[navigation.selectedTemplateId!],
          [navigation.selectedCropId!]: {
            ...prev[navigation.selectedTemplateId!]?.[navigation.selectedCropId!],
            [navigation.selectedMeasurementId!]: zones
          }
        }
      }));
    }
  };

  const handleZonesAutoSave = async (zones: any[]) => {
    if (!navigation.selectedTemplateId || !navigation.selectedCropId || !navigation.selectedMeasurementId) return;
    
    // Обновляем локальное состояние
    setEditedIndicators(prev => ({
      ...prev,
      [navigation.selectedTemplateId!]: {
        ...prev[navigation.selectedTemplateId!],
        [navigation.selectedCropId!]: {
          ...prev[navigation.selectedTemplateId!]?.[navigation.selectedCropId!],
          [navigation.selectedMeasurementId!]: zones
        }
      }
    }));
    
    // Если есть onSave, вызываем автосохранение
    if (onSave) {
      try {
        await onSave({
          ...editedIndicators,
          [navigation.selectedTemplateId!]: {
            ...editedIndicators[navigation.selectedTemplateId!],
            [navigation.selectedCropId!]: {
              ...editedIndicators[navigation.selectedTemplateId!]?.[navigation.selectedCropId!],
              [navigation.selectedMeasurementId!]: zones
            }
          }
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  const openDialog = (type: DialogType) => {
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const getBreadcrumbs = () => {
    const template = handbooks.scout_report_templates.find(
      t => t.scout_report_template_id === Number(navigation.selectedTemplateId)
    );
    const crop = handbooks.crops.find(
      c => c.crop_id === Number(navigation.selectedCropId)
    );
    const measurement = handbooks.scout_report_measurement_types.find(
      m => m.scout_report_measurement_type_id === Number(navigation.selectedMeasurementId)
    );

    return { template, crop, measurement };
  };

  const { template, crop, measurement } = getBreadcrumbs();

  // Подготовка данных для диалога в зависимости от типа
  const getDialogProps = () => {
    switch (dialogType) {
      case 'template':
        return {
          items: handbooks.scout_report_templates,
          existingItemIds: new Set(Object.keys(editedIndicators)),
          onAddItem: handleAddTemplate,
          title: 'Добавить шаблон',
          description: 'Выберите шаблон из справочника для добавления пороговых значений',
          searchPlaceholder: 'Поиск шаблонов...',
          noItemsMessage: 'Нет доступных шаблонов в справочнике',
          noResultsMessage: 'Шаблоны не найдены',
          getId: (item: ScoutReportTemplate) => item.scout_report_template_id,
          getName: (item: ScoutReportTemplate) => item.scout_report_template_name
        };
      
      case 'crop':
        return {
          items: handbooks.crops,
          existingItemIds: new Set(Object.keys(editedIndicators[navigation.selectedTemplateId!] || {})),
          onAddItem: handleAddCrop,
          title: 'Добавить культуру',
          description: 'Выберите культуру из справочника для добавления пороговых значений',
          searchPlaceholder: 'Поиск культур...',
          noItemsMessage: 'Нет доступных культур в справочнике',
          noResultsMessage: 'Культуры не найдены',
          getId: (item: Crop) => item.crop_id,
          getName: (item: Crop) => item.crop_name
        };
      
      case 'measurement':
        return {
          items: handbooks.scout_report_measurement_types,
          existingItemIds: new Set(Object.keys(editedIndicators[navigation.selectedTemplateId!]?.[navigation.selectedCropId!] || {})),
          onAddItem: handleAddMeasurement,
          title: 'Добавить измерение',
          description: 'Выберите измерение из справочника для добавления пороговых значений',
          searchPlaceholder: 'Поиск измерений...',
          noItemsMessage: 'Нет доступных измерений в справочнике',
          noResultsMessage: 'Измерения не найдены',
          getId: (item: ScoutReportMeasurementType) => item.scout_report_measurement_type_id,
          getName: (item: ScoutReportMeasurementType) => item.human_name
        };
      
      default:
        return null;
    }
  };

  const dialogProps = getDialogProps();
  const savingInProgress = isSaving || isLocalSaving;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {navigation.view !== 'templates' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              disabled={savingInProgress}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle>Редактор пороговых значений</CardTitle>
        </div>
        {navigation.view === 'templates' && (
          <Button 
            onClick={() => openDialog('template')}
            disabled={savingInProgress}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить шаблон
          </Button>
        )}
        {navigation.view === 'crops' && (
          <Button 
            onClick={() => openDialog('crop')}
            disabled={savingInProgress}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить культуру
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
          <span>Шаблоны</span>
          {template && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span>{template.scout_report_template_name}</span>
            </>
          )}
          {crop && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span>{crop.crop_name}</span>
            </>
          )}
          {measurement && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span>{measurement.human_name}</span>
            </>
          )}
        </div>

        {navigation.view === 'templates' && (
          <TemplatesList
            indicators={editedIndicators}
            templates={handbooks.scout_report_templates}
            onSelect={handleTemplateSelect}
            crops={handbooks.crops}
            onDeleteTemplate={onDeleteTemplate}
            onAdd={() => openDialog('template')}
          />
        )}

        {navigation.view === 'crops' && navigation.selectedTemplateId && (
          <CropsList
            indicators={editedIndicators}
            templateId={navigation.selectedTemplateId}
            crops={handbooks.crops}
            measurements={handbooks.scout_report_measurement_types}
            onSelect={handleCropSelect}
            onDeleteCrop={onDeleteCrop}
            onAdd={() => openDialog('crop')}
          />
        )}

        {navigation.view === 'measurements' && 
         navigation.selectedTemplateId && 
         navigation.selectedCropId && (
          <MeasurementsList
            indicators={editedIndicators}
            templateId={navigation.selectedTemplateId}
            cropId={navigation.selectedCropId}
            measurements={handbooks.scout_report_measurement_types}
            onSelect={handleMeasurementSelect}
            onAdd={() => openDialog('measurement')}
          />
        )}

        {navigation.view === 'zones' && 
         navigation.selectedTemplateId && 
         navigation.selectedCropId && 
         navigation.selectedMeasurementId && (
          <ZonesEditor
            zones={editedIndicators[navigation.selectedTemplateId]?.[navigation.selectedCropId]?.[navigation.selectedMeasurementId] || []}
            measurementName={measurement?.human_name || ''}
            onChange={handleZonesChange}
            onAutoSave={handleZonesAutoSave}
            disabled={savingInProgress}
            isSaving={savingInProgress}
          />
        )}
      </CardContent>

      {/* Единый диалог для всех типов добавления */}
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

export default ThresholdsEditor;