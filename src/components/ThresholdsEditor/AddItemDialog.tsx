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
import { Search, Plus, AlertCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: any[];
  existingItemIds: Set<string>;
  onAddItem: (item: any) => void;
  title: string;
  description: string;
  searchPlaceholder: string;
  noItemsMessage: string;
  noResultsMessage: string;
  getId: (item: any) => number;
  getName: (item: any) => string;
  // Дополнительные данные для валидации групп культур
  validateCropGroup?: (item: any) => {
    isValid: boolean;
    conflictCrops?: Array<{ id: number; name: string; groupName: string }>;
    errorMessage?: string;
  };
  // Данные о культурах и их группах
  allCropGroups?: any[];
  allCrops?: any[];
  existingCropGroupIds?: number[];
  getCropsInGroup?: (groupId: number) => Array<{ id: number; name: string }>;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({
  open,
  onOpenChange,
  items,
  existingItemIds,
  onAddItem,
  title,
  description,
  searchPlaceholder,
  noItemsMessage,
  noResultsMessage,
  getId,
  getName,
  validateCropGroup,
  getCropsInGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);

  const filteredItems = items.filter(item => {
    const itemId = getId(item).toString();
    const isNotExisting = !existingItemIds.has(itemId);
    const matchesSearch = getName(item)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return isNotExisting && matchesSearch;
  });

  // Получаем конфликтующие культуры для каждой группы
  const getItemConflicts = (item: any) => {
    if (!validateCropGroup) return null;
    return validateCropGroup(item);
  };

  const handleAddItem = (item: any) => {
    setSelectedItem(null);
    setValidationError(null);
    onAddItem(item);
    onOpenChange(false);
    setSearchQuery('');
    setShowConflicts(false);
  };

  const handleSelectItem = (item: any) => {
    if (selectedItem === item) {
      setSelectedItem(null);
      setShowConflicts(false);
    } else {
      setSelectedItem(item);
      setShowConflicts(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Показываем ошибку валидации */}
        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="relative my-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-2 pr-4">
            {filteredItems.map((item) => {
              const validation = getItemConflicts(item);
              const isValid = !validation || validation.isValid;
              const conflictCrops = validation?.conflictCrops || [];
              
              return (
                <div
                  key={getId(item)}
                  className={`border rounded-lg transition-all ${
                    selectedItem === item 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  } ${!isValid ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}`}
                >
                  <div 
                    className="p-3 cursor-pointer"
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{getName(item)}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {getId(item)}
                        </div>
                      </div>
                      {!isValid && (
                        <div className="flex items-center gap-1 text-red-500">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">Конфликт культур</span>
                        </div>
                      )}
                      {/* Кнопка "Добавить" всегда видима для валидных групп */}
                      {isValid && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddItem(item);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Показываем детали конфликта при выборе */}
                  {selectedItem === item && showConflicts && !isValid && conflictCrops.length > 0 && (
                    <div className="border-t p-3 space-y-2 bg-red-50/50 dark:bg-red-950/10">
                      <div className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Конфликтующие культуры:
                      </div>
                      <div className="space-y-1">
                        {conflictCrops.map((crop) => (
                          <div key={crop.id} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                            <span>{crop.name}</span>
                            <span className="text-xs text-muted-foreground">
                              (уже в группе "{crop.groupName}")
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Для добавления этой группы необходимо сначала удалить конфликтующие группы культур
                      </div>
                    </div>
                  )}
                  
                  {/* Показываем культуры в группе при выборе (если нет конфликтов) */}
                  {selectedItem === item && showConflicts && isValid && getCropsInGroup && (
                    <div className="border-t p-3 space-y-2">
                      <div className="text-sm font-medium">Культуры в группе:</div>
                      <div className="flex flex-wrap gap-2">
                        {getCropsInGroup(getId(item)).map((crop) => (
                          <span
                            key={crop.id}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                          >
                            {crop.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {items.length === 0 ? noItemsMessage : noResultsMessage}
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

export default AddItemDialog;