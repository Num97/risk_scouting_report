// components/ThresholdsEditor/AddTemplateDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus } from 'lucide-react';
import type { ScoutReportTemplate } from '@/types/handbooks';

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableTemplates: ScoutReportTemplate[];
  existingTemplateIds: Set<string>;
  onAddTemplate: (template: ScoutReportTemplate) => void;
}

const AddTemplateDialog: React.FC<AddTemplateDialogProps> = ({
  open,
  onOpenChange,
  availableTemplates,
  existingTemplateIds,
  onAddTemplate
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтруем шаблоны, которых еще нет в пороговых значениях
  const filteredTemplates = availableTemplates.filter(template => {
    const templateId = template.scout_report_template_id.toString();
    const isNotExisting = !existingTemplateIds.has(templateId);
    const matchesSearch = template.scout_report_template_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return isNotExisting && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Добавить шаблон</DialogTitle>
          <DialogDescription>
            Выберите шаблон из справочника для добавления пороговых значений
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск шаблонов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.scout_report_template_id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
              >
                <div>
                  <div className="font-medium">
                    {template.scout_report_template_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {template.scout_report_template_id}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onAddTemplate(template);
                    onOpenChange(false);
                    setSearchQuery('');
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {availableTemplates.length === 0 
                  ? 'Нет доступных шаблонов в справочнике'
                  : 'Шаблоны не найдены'}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTemplateDialog;