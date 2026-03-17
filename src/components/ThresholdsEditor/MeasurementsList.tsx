import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Settings} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MeasurementsListProps } from './types';

const MeasurementsList: React.FC<MeasurementsListProps> = ({
  indicators,
  templateId,
  cropId,
  measurements,
  onSelect,
}) => {
  console.log('MeasurementsList received props:', { indicators, templateId, cropId, measurements });

  // Получаем данные для текущего шаблона и культуры с учетом числовых/строковых ключей
  const templateData = indicators[templateId] || indicators[Number(templateId)] || {};
  const cropData = templateData[cropId] || templateData[Number(cropId)] || {};

  // Получаем ID измерений, для которых уже есть пороги
  const existingMeasurementIds = new Set(Object.keys(cropData));

  // Фильтруем измерения, оставляем только те, у которых есть пороги
  const measurementsWithThresholds = measurements.filter(measurement => {
    const measurementId = measurement.scout_report_measurement_type_id.toString();
    return existingMeasurementIds.has(measurementId) || 
           existingMeasurementIds.has(measurement.scout_report_measurement_type_id.toString());
  });

  const getZonesCount = (measurementId: number) => {
    const zones = cropData[measurementId] || cropData[measurementId.toString()];
    return zones?.length || 0;
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

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'red': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'orange': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'green': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getZoneBackground = (zone: string) => {
    switch (zone) {
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
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
          {measurementsWithThresholds.map((measurement) => {
            const measurementId = measurement.scout_report_measurement_type_id;
            const measurementIdStr = measurementId.toString();
            const zonesCount = getZonesCount(measurementId);
            const zones = cropData[measurementIdStr] || cropData[measurementId] || [];
            
            // Сортируем зоны по пороговому значению
            const sortedZones = [...zones].sort((a, b) => a.threshold_value - b.threshold_value);
            const maxThreshold = getMaxThreshold(sortedZones);
            
            return (
              <Card
                key={measurementId}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-primary group"
                onClick={() => onSelect(measurementIdStr)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {measurement.human_name}
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Зон: {zonesCount}</span>
                          <Tooltip>
                            <TooltipContent>
                              <p>Адаптивная шкала: 0 - {maxThreshold}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        {/* Визуализация зон в виде адаптивной шкалы */}
                        <div className="space-y-2">
                          <div className="flex h-6 rounded-lg overflow-hidden shadow-inner">
                            {sortedZones.map((zone, idx) => {
                              const currentValue = zone.threshold_value;
                              const nextValue = idx < sortedZones.length - 1 
                                ? sortedZones[idx + 1].threshold_value 
                                : maxThreshold;
                              
                              const width = ((nextValue - currentValue) / maxThreshold) * 100;
                              
                              return (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`h-full flex items-center justify-center text-xs font-medium text-white
                                        ${getZoneBackground(zone.zone)} cursor-help transition-all hover:brightness-110
                                      `}
                                      style={{ width: `${Math.max(width, 2)}%` }}
                                    >
                                      {width > 8 && (
                                        <span className="truncate px-1">
                                          {zone.threshold_value}
                                        </span>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{getZoneText(zone.zone)} зона</p>
                                    <p className="text-xs">
                                      от {currentValue} до {nextValue}
                                      {idx === sortedZones.length - 1 && ' и выше'}
                                    </p>
                                    {currentValue === 0 && <p className="text-xs text-muted-foreground">(начальная)</p>}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                          
                          {/* Значения зон в виде тегов */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {sortedZones.map((zone, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getZoneColor(zone.zone)}`}
                              >
                                {zone.zone === 'red' ? '🔴' : zone.zone === 'orange' ? '🟠' : '🟢'} {zone.threshold_value}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {measurementsWithThresholds.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-stone-50 dark:bg-stone-800/50">
            <p className="text-lg mb-2">📊 Нет измерений с пороговыми значениями</p>
            <p className="text-sm">Добавьте измерение через кнопку "Добавить измерение из справочника"</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default MeasurementsList;