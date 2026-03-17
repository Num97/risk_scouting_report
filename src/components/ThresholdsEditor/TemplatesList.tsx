import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { TemplatesListProps } from './types';

const TemplatesList: React.FC<TemplatesListProps> = ({
  indicators,
  templates,
  crops,
  onSelect,
  onDeleteTemplate, // Добавляем
}) => {

  // Получаем только те шаблоны, которые есть в indicators
  const templatesWithThresholds = templates.filter(template => {
    const templateId = template.scout_report_template_id;
    const exists = indicators[templateId] !== undefined || 
                   indicators[templateId.toString()] !== undefined;
    return exists;
  });

  // Получаем название культуры по ID
  const getCropName = (cropId: string): string => {
    const crop = crops.find(c => c.crop_id.toString() === cropId);
    return crop?.crop_name || `Культура ${cropId}`;
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: number) => {
    e.stopPropagation();
    
    // Добавим подтверждение
    if (!window.confirm('Вы уверены, что хотите удалить этот шаблон со всеми его пороговыми значениями?')) {
      return;
    }
    
    try {
      await onDeleteTemplate?.(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
      // Здесь можно показать уведомление об ошибке
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templatesWithThresholds.map((template) => {
          const templateId = template.scout_report_template_id;
          const templateData = indicators[templateId] || indicators[templateId.toString()];
          const cropsList = Object.keys(templateData || {});
          
          return (
            <Card
              key={templateId}
              className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 relative group"
              onClick={() => onSelect(templateId.toString())}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg mb-2">
                    {template.scout_report_template_name}
                  </h3>
                  
                  {/* Кнопка удаления */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteTemplate(e, templateId)}
                    disabled={!onDeleteTemplate}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Используемые культуры:</span>
                  </div>
                  
                  {/* Список культур */}
                  <div className="flex flex-wrap gap-1">
                    {cropsList.map((cropId, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                      >
                        {getCropName(cropId)}
                      </span>
                    ))}
                  </div>
                  
                  {/* Если культур нет */}
                  {cropsList.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">
                      Нет культур
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {templatesWithThresholds.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          Нет шаблонов с пороговыми значениями
        </div>
      )}
    </div>
  );
};

export default TemplatesList;