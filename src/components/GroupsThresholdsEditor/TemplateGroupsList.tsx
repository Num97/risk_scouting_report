import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { TemplateGroupsListProps } from './types';

const TemplateGroupsList: React.FC<TemplateGroupsListProps> = ({
  indicators,
  templateGroupNames,
  templateGroups,
  templates,
  cropGroupNames,
  templateGroupCropGroups,
  onSelect,
  onDelete,
}) => {
  // Получаем все группы шаблонов
  const allGroups = templateGroupNames;

  // Получаем название группы культур по ID
  const getCropGroupName = (cropGroupId: number): string => {
    const group = cropGroupNames.find(g => g.id === cropGroupId);
    return group?.crop_group_name || `Группа культур ${cropGroupId}`;
  };

  // Получаем группы культур, связанные с данной группой шаблонов
  const getCropGroupsForTemplateGroup = (templateGroupId: number): number[] => {
    return templateGroupCropGroups
      .filter(link => link.template_group_id === templateGroupId)
      .map(link => link.crop_group_id);
  };

  // Проверяем, есть ли у группы пороговые значения
  const hasThresholds = (groupId: number): boolean => {
    return indicators[groupId] !== undefined || indicators[groupId.toString()] !== undefined;
  };

  const handleDeleteGroup = async (e: React.MouseEvent, groupId: number) => {
    e.stopPropagation();
    
    if (!window.confirm('Вы уверены, что хотите удалить эту группу шаблонов?')) {
      return;
    }
    
    try {
      await onDelete?.(groupId);
    } catch (error) {
      console.error('Failed to delete template group:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allGroups.map((group) => {
          const groupId = group.id;
          const hasData = hasThresholds(groupId);
          
          // Получаем связанные группы культур
          const linkedCropGroupIds = getCropGroupsForTemplateGroup(groupId);
          
          return (
            <Card
              key={groupId}
              className={`cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] relative group
                ${hasData ? 'border-primary/50' : 'border-dashed border-stone-300 dark:border-stone-700'}`}
              onClick={() => onSelect(groupId.toString())}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg mb-2">
                    {group.template_group_name}
                    {!hasData && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (нет порогов)
                      </span>
                    )}
                  </h3>
                  
                  {/* Кнопка удаления */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteGroup(e, groupId)}
                    disabled={!onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {/* Информация о связанных группах культур */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium">Связанные группы культур:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {linkedCropGroupIds.map((cropGroupId) => (
                        <span
                          key={cropGroupId}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        >
                          {getCropGroupName(cropGroupId)}
                        </span>
                      ))}
                      {linkedCropGroupIds.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          Нет связанных групп культур
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Индикатор наличия порогов */}
                  {hasData && (
                    <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Есть настроенные пороги
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {allGroups.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          Нет доступных групп шаблонов
        </div>
      )}
    </div>
  );
};

export default TemplateGroupsList;