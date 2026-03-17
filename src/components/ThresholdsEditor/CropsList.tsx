import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2} from 'lucide-react';
import type { CropsListProps } from './types';

const CropsList: React.FC<CropsListProps> = ({
  indicators,
  templateId,
  crops,
  onSelect,
  onDeleteCrop,
  measurements
}) => {
  console.log('CropsList received props:', { indicators, templateId, crops });

  // Получаем данные для текущего шаблона
  const templateData = indicators[templateId] || indicators[Number(templateId)] || {};

  // Получаем ID культур, для которых уже есть пороги
  const existingCropIds = new Set(Object.keys(templateData));

  // Фильтруем культуры, оставляем только те, у которых есть пороги
  const cropsWithThresholds = crops.filter(crop => {
    const cropId = crop.crop_id.toString();
    return existingCropIds.has(cropId) || existingCropIds.has(crop.crop_id.toString());
  });

  // Получаем название измерения по ID
  const getMeasurementName = (measurementId: string): string => {
    const measurement = measurements?.find(m => m.scout_report_measurement_type_id.toString() === measurementId);
    return measurement?.human_name || `Измерение ${measurementId}`;
  };

  // Вычисляем максимальное значение для адаптивной шкалы
  const getMaxThreshold = (zones: any[]) => {
    if (zones.length === 0) return 100;
    const maxValue = Math.max(...zones.map((z: any) => z.threshold_value));
    const buffer = Math.ceil(maxValue * 0.2); // 20% запас
    const suggestedMax = maxValue + buffer;
    
    // Округляем до ближайшего удобного числа
    if (suggestedMax <= 10) return 10;
    if (suggestedMax <= 20) return 20;
    if (suggestedMax <= 30) return 30;
    if (suggestedMax <= 40) return 40;
    if (suggestedMax <= 50) return 50;
    if (suggestedMax <= 60) return 60;
    if (suggestedMax <= 70) return 70;
    if (suggestedMax <= 80) return 80;
    if (suggestedMax <= 90) return 90;
    return Math.ceil(suggestedMax / 10) * 10;
  };

  const getCropStats = (cropId: number) => {
    const cropData = templateData[cropId] || templateData[cropId.toString()];
    if (!cropData) return { measurementsCount: 0 };
    
    const measurementsCount = Object.keys(cropData).length;
    
    return { measurementsCount };
  };

  const handleDeleteCrop = async (e: React.MouseEvent, cropId: number) => {
    e.stopPropagation(); // Предотвращаем открытие карточки
    
    if (!window.confirm('Вы уверены, что хотите удалить эту культуру со всеми её пороговыми значениями?')) {
      return;
    }
    
    try {
      await onDeleteCrop?.(Number(templateId), cropId);
    } catch (error) {
      console.error('Failed to delete crop:', error);
    }
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getZoneBadgeColor = (zone: string) => {
    switch (zone) {
      case 'red': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'orange': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'green': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getZoneText = (zone: string) => {
    switch (zone) {
      case 'red': return 'Красная';
      case 'orange': return 'Оранжевая';
      case 'green': return 'Зеленая';
      default: return zone;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cropsWithThresholds.map((crop) => {
            const cropId = crop.crop_id;
            const cropIdStr = cropId.toString();
            const { measurementsCount } = getCropStats(cropId);
            
            // Получаем данные по измерениям для предпросмотра
            const cropMeasurements = templateData[cropIdStr] || templateData[cropId] || {};
            
            return (
              <Card
                key={cropId}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-primary/20 group relative"
                onClick={() => onSelect(cropIdStr)}
              >
                <CardContent className="p-5">
                  {/* Кнопка удаления */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteCrop(e, cropId)}
                    disabled={!onDeleteCrop}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <h3 className="font-semibold text-lg mb-3 text-stone-800 dark:text-stone-200 pr-8">
                    {crop.crop_name}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Статистика */}
                    <div className="flex justify-between items-center text-sm bg-stone-50 dark:bg-stone-800/50 p-2 rounded-lg">
                      <span className="text-muted-foreground">📊 Измерений:</span>
                      <span className="font-semibold text-stone-700 dark:text-stone-300">{measurementsCount}</span>
                    </div>
                    
                    {/* Измерения */}
                    {Object.entries(cropMeasurements).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Настроенные измерения
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                          {Object.entries(cropMeasurements).map(([measurementId, zones]: [string, any]) => {
                            const sortedZones = [...zones].sort((a, b) => a.threshold_value - b.threshold_value);
                            const maxThreshold = getMaxThreshold(sortedZones);
                            
                            return (
                              <Tooltip key={measurementId}>
                                <TooltipTrigger asChild>
                                  <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-help">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate max-w-[120px]">
                                        {getMeasurementName(measurementId)}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">
                                          {zones.length} зон
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Адаптивная шкала */}
                                    <div className="flex h-2 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-700">
                                      {sortedZones.map((zone: any, idx: number, arr: any[]) => {
                                        const currentValue = zone.threshold_value;
                                        const nextValue = idx < arr.length - 1 
                                          ? arr[idx + 1].threshold_value 
                                          : maxThreshold;
                                        
                                        const width = ((nextValue - currentValue) / maxThreshold) * 100;
                                        
                                        return (
                                          <div
                                            key={idx}
                                            className={`h-full ${getZoneColor(zone.zone)} transition-all hover:brightness-110`}
                                            style={{ width: `${Math.max(width, 2)}%` }}
                                            title={`${getZoneText(zone.zone)}: ${currentValue} - ${nextValue}`}
                                          />
                                        );
                                      })}
                                    </div>
                                    
                                    {/* Значения зон в виде чипсов */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {sortedZones.map((zone: any, idx: number) => (
                                        <span
                                          key={idx}
                                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getZoneBadgeColor(zone.zone)}`}
                                        >
                                          {zone.threshold_value}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-medium">{getMeasurementName(measurementId)}</p>
                                    <p className="text-xs text-muted-foreground">Диапазон: 0 - {maxThreshold}</p>
                                    <div className="text-xs space-y-0.5">
                                      {sortedZones.map((zone: any, idx: number, arr: any[]) => {
                                        const nextValue = idx < arr.length - 1 ? arr[idx + 1].threshold_value : maxThreshold;
                                        return (
                                          <div key={idx} className="flex items-center gap-2">
                                            <span>
                                              {zone.zone === 'red' ? '🔴' : zone.zone === 'orange' ? '🟠' : '🟢'} 
                                              {getZoneText(zone.zone)}: {zone.threshold_value} - {nextValue}
                                              {idx === arr.length - 1 && ' и выше'}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {cropsWithThresholds.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-stone-50 dark:bg-stone-800/50">
            <p className="text-lg mb-2">🌾 Нет культур с пороговыми значениями</p>
            <p className="text-sm">Добавьте культуру через кнопку "Добавить культуру из справочника"</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CropsList;