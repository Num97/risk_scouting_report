import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { getScoutReports, getIndicators, getAllThresholds, type IndicatorThreshold, deleteTemplateThresholds } from "./api/scoutingReportApi"
import { aggregateTemplates } from "./services/aggregateTemplates"

import ScoutingTemplateTableNested from "./components/Table/ScoutingTemplateTableNested"

import type { TemplateData } from "./types/scoutingAggregated"
import type { ScoutReportItem } from "./types/scoutingReport"
import { ThemeProvider } from "./components/ui/theme-provider";
import { Header } from "./components/Header/Header";
import { useSearchParams } from "react-router-dom";

import { getHandbooks } from "./api/handbooksApi"
import GroupsThresholdsEditor from "./components/GroupsThresholdsEditor/GroupsThresholdsEditor"
import type { GroupsIndicatorsData, NavigationState } from "./components/GroupsThresholdsEditor/types"
import type { Crop, ScoutReportTemplate, ScoutReportMeasurementType } from "./types/handbooks"
import GroupsManager from "./components/GroupsManager/GroupsManager";
import ScoutingOverview from "./components/ScoutingOverview/ScoutingOverview"
import DateRangeSlider from "./components/DateRangeSlider/DateRangeSlider";

// Импортируем типы для групп
import type { 
  TemplateGroupName, 
  TemplateGroup, 
  CropGroupName, 
  CropGroup,
  TemplateGroupCropGroup,
  TemplateGroupCropGroupMeasurement 
} from "./types/groups";
import {
  getTemplateGroupNames,
  getTemplateGroups,
  getCropGroupNames,
  getCropGroups,
  getTemplateGroupCropGroups,
  getTemplateGroupCropGroupMeasurements,
  createTemplateGroupCropGroup,
  deleteTemplateGroupCropGroup,
  createTemplateGroupCropGroupMeasurement,
  deleteTemplateGroupCropGroupMeasurement,
} from "./api/scoutingReportApi";

import { 
  saveAllThresholds
} from "./api/scoutingReportApi";

function App() {
  const [templates, setTemplates] = useState<TemplateData[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [reportTemplates, setReportTemplates] = useState<ScoutReportTemplate[]>([])
  const [measurementTypes, setMeasurementTypes] = useState<ScoutReportMeasurementType[]>([])
  
  // Состояния для групп
  const [templateGroupNames, setTemplateGroupNames] = useState<TemplateGroupName[]>([]);
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [cropGroupNames, setCropGroupNames] = useState<CropGroupName[]>([]);
  const [cropGroups, setCropGroups] = useState<CropGroup[]>([]);
  
  // Новые состояния для связей групп и измерений
  const [templateGroupCropGroups, setTemplateGroupCropGroups] = useState<TemplateGroupCropGroup[]>([]);
  const [templateGroupCropGroupMeasurements, setTemplateGroupCropGroupMeasurements] = useState<TemplateGroupCropGroupMeasurement[]>([]);
  
  // Данные для группового редактора
  const [groupsThresholdsData, setGroupsThresholdsData] = useState<GroupsIndicatorsData>({});
  const [existingRules, setExistingRules] = useState<IndicatorThreshold[]>([])
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'table' | 'zones' | 'groups'>('table');
  
  const reportsRef = useRef<ScoutReportItem[]>([])

  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();

  const urlSeason = Number(searchParams.get("season")) || currentYear;
  const [season, setSeason] = useState(urlSeason);

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [expandedCrops, setExpandedCrops] = useState<Set<number>>(new Set())
  const [expandedMeasurements, setExpandedMeasurements] = useState<Set<number>>(new Set())

    const [groupsNavigation, setGroupsNavigation] = useState<NavigationState>({
    view: 'templateGroups',
    selectedTemplateGroupId: null,
    selectedCropGroupId: null,
    selectedMeasurementId: null,
    selectedTemplateGroupCropGroupId: null
  });

  const handleToggleGroup = useCallback((id: number) => {
  setExpandedGroups(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}, [])

const handleToggleCrop = useCallback((id: number) => {
  setExpandedCrops(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}, [])

const handleToggleMeasurement = useCallback((id: number) => {
  setExpandedMeasurements(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}, [])

  const handleSeasonChange = (newSeason: number) => {
    setSeason(newSeason);
    setSearchParams({ ...Object.fromEntries(searchParams), season: String(newSeason) });
  };

  const [dateRange, setDateRange] = useState({
    start: new Date(season, 0, 1),
    end: new Date(season, 11, 31),
  });

  // Обновляем диапазон при смене сезона
  useEffect(() => {
    setDateRange({
      start: new Date(season, 0, 1),
      end: new Date(season, 11, 31),
    });
  }, [season]);

  const filteredTemplates = useMemo(() => {
  if (!templates.length) return [];
  
  return templates.map(template => {
    // Создаем копию шаблона
    const filteredTemplate = { ...template };
    
    // Фильтруем культуры
    filteredTemplate.crops = template.crops.map(crop => {
      const filteredCrop = { ...crop };
      
      // Фильтруем измерения
      filteredCrop.measurements = crop.measurements.map(measurement => {
        const filteredMeasurement = { ...measurement };
        
        // Фильтруем отчеты по дате
        filteredMeasurement.reports = measurement.reports.filter(report => {
          // Нужно получить дату отчета. Предположим, что у отчета есть поле created_at или scout_report_date
          const reportDate = new Date(report.report_date); // или report.created_at
          return reportDate >= dateRange.start && reportDate <= dateRange.end;
        });
        
        // Пересчитываем статистику для измерения
        filteredMeasurement.stats = {
          green: filteredMeasurement.reports.filter(r => r.zone === 'green').length,
          orange: filteredMeasurement.reports.filter(r => r.zone === 'orange').length,
          red: filteredMeasurement.reports.filter(r => r.zone === 'red').length,
          total: filteredMeasurement.reports.length
        };
        
        return filteredMeasurement;
      }).filter(m => m.reports.length > 0); // Убираем измерения без отчетов
      
      // Пересчитываем статистику для культуры
      filteredCrop.stats = {
        green: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.green, 0),
        orange: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.orange, 0),
        red: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.red, 0),
        total: filteredCrop.measurements.reduce((sum, m) => sum + m.stats.total, 0)
      };
      
      return filteredCrop;
    }).filter(c => c.measurements.length > 0); // Убираем культуры без измерений
    
    // Пересчитываем статистику для шаблона
    filteredTemplate.stats = {
      green: filteredTemplate.crops.reduce((sum, c) => sum + c.stats.green, 0),
      orange: filteredTemplate.crops.reduce((sum, c) => sum + c.stats.orange, 0),
      red: filteredTemplate.crops.reduce((sum, c) => sum + c.stats.red, 0),
      total: filteredTemplate.crops.reduce((sum, c) => sum + c.stats.total, 0)
    };
    
    return filteredTemplate;
  }).filter(t => t.crops.length > 0); // Убираем шаблоны без культур
  
}, [templates, dateRange]);

  const handleViewChange = (view: 'table' | 'zones' | 'groups') => {
    setCurrentView(view);
  };

  // Функция для загрузки всех данных групп
  const loadGroupsData = async () => {
    try {
      const [
        tGroupNames, 
        tGroups, 
        cGroupNames, 
        cGroups,
        tgcgGroups,
        tgcgMeasurements
      ] = await Promise.all([
        getTemplateGroupNames(),
        getTemplateGroups(),
        getCropGroupNames(),
        getCropGroups(),
        getTemplateGroupCropGroups(),
        getTemplateGroupCropGroupMeasurements()
      ]);

      setTemplateGroupNames(tGroupNames);
      setTemplateGroups(tGroups);
      setCropGroupNames(cGroupNames);
      setCropGroups(cGroups);
      setTemplateGroupCropGroups(tgcgGroups);
      setTemplateGroupCropGroupMeasurements(tgcgMeasurements);
    } catch (error) {
      console.error("Ошибка загрузки групп", error);
    }
  };

  // Функции для управления связями групп
  const handleAddTemplateGroupCropGroup = async (templateGroupId: number, cropGroupId: number) => {
    try {
      const newId = await createTemplateGroupCropGroup(templateGroupId, cropGroupId);
      await loadGroupsData();
      return newId;
    } catch (error) {
      console.error("Ошибка создания связи групп", error);
      throw error;
    }
  };

  const handleRemoveTemplateGroupCropGroup = async (id: number) => {
    try {
      await deleteTemplateGroupCropGroup(id);
      await loadGroupsData();
    } catch (error) {
      console.error("Ошибка удаления связи групп", error);
      throw error;
    }
  };

  // Функции для управления измерениями в связках
  const handleAddMeasurementToGroup = async (templateGroupCropGroupId: number, measurementTypeId: number) => {
    try {
      const newId = await createTemplateGroupCropGroupMeasurement(templateGroupCropGroupId, measurementTypeId);
      await loadGroupsData();
      return newId;
    } catch (error) {
      console.error("Ошибка добавления измерения в группу", error);
      throw error;
    }
  };

  const handleRemoveMeasurementFromGroup = async (id: number) => {
    try {
      await deleteTemplateGroupCropGroupMeasurement(id);
      
      // Загружаем свежие данные
      const [indicators, allRules] = await Promise.all([
        getIndicators(),
        getAllThresholds()
      ]);
      
      // Обновляем состояние
      setGroupsThresholdsData(indicators);
      setExistingRules(allRules);
      
      // Перезагружаем данные групп
      await loadGroupsData();
      
    } catch (error) {
      console.error("Ошибка удаления измерения из группы", error);
      throw error;
    }
  };

    const handleDeleteTemplateGroup = async (templateGroupId: number) => {
      try {
        setIsSaving(true);
        console.log(`🗑️ Deleting template group ${templateGroupId}...`);
        
        // Получаем все шаблоны в группе
        const templateIds = templateGroups
          .filter(tg => tg.template_group_id === templateGroupId)
          .map(tg => tg.scout_report_template_id);
        
        // Удаляем правила для всех шаблонов в группе
        for (const templateId of templateIds) {
          await deleteTemplateThresholds(templateId);
        }
        
        // Обновляем данные
        const [indicators, allRules] = await Promise.all([
          getIndicators(),
          getAllThresholds()
        ]);
        
        setExistingRules(allRules);
        setGroupsThresholdsData(indicators); // Просто устанавливаем новые данные
        
        // Перезагружаем данные групп
        await loadGroupsData();
        
      } catch (error) {
        console.error(`❌ Failed to delete template group ${templateGroupId}:`, error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    };

const handleDeleteCropGroup = async (templateGroupId: number, cropGroupId: number) => {
  try {
    setIsSaving(true);
    console.log(`🗑️ Deleting crop group ${cropGroupId} from template group ${templateGroupId}...`);
    
    // 1. Находим ID связки групп
    const tgcg = templateGroupCropGroups.find(
      g => g.template_group_id === templateGroupId && g.crop_group_id === cropGroupId
    );
    
    if (!tgcg) {
      console.error('Template group crop group not found');
      return;
    }
    
    // 2. Удаляем связь - каскадно удалятся все измерения и правила в БД
    await deleteTemplateGroupCropGroup(tgcg.id);
    
    // 3. Перезагружаем данные групп (обновит templateGroupCropGroups и связанные данные)
    await loadGroupsData();
    
    // 4. Обновляем пороговые значения из БД
    const [indicators, allRules] = await Promise.all([
      getIndicators(),
      getAllThresholds()
    ]);
    
    setExistingRules(allRules);
    setGroupsThresholdsData(indicators);
    
    console.log(`✅ Crop group ${cropGroupId} deleted successfully`);
    
  } catch (error) {
    console.error(`❌ Failed to delete crop group ${cropGroupId}:`, error);
    throw error;
  } finally {
    setIsSaving(false);
  }
};

  const handleSaveGroupsThresholds = async (updatedIndicators: GroupsIndicatorsData) => {
    try {
      setIsSaving(true);
      console.log("Saving groups thresholds:", updatedIndicators);
      
      // Прямо как в старом редакторе
      await saveAllThresholds(
    groupsThresholdsData, 
    updatedIndicators, 
    existingRules,
    templateGroupCropGroups,      // Добавить из состояния
    templateGroupCropGroupMeasurements // Добавить из состояния
  );
      
      // Обновляем состояние
      setGroupsThresholdsData(updatedIndicators);
      
      // Обновляем правила
      const updatedRules = await getAllThresholds();
      setExistingRules(updatedRules);
      
      console.log("Groups thresholds saved successfully");
      
    } catch (error) {
      console.error("Error saving groups thresholds:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Загружаем все данные
// Загружаем все данные
useEffect(() => {
  async function loadAll() {
    try {
      setIsLoading(true);
      
      // Загружаем все параллельно
      const [reports, indicators, handbooks, allRules, groupsData] = await Promise.all([
        getScoutReports(season),
        getIndicators(),
        getHandbooks(),
        getAllThresholds(),
        Promise.all([
          getTemplateGroupNames(),
          getTemplateGroups(),
          getCropGroupNames(),
          getCropGroups(),
          getTemplateGroupCropGroups(),
          getTemplateGroupCropGroupMeasurements()
        ])
      ]);

      // Распаковываем данные групп
      const [
        tGroupNames, 
        tGroups, 
        cGroupNames, 
        cGroups,
        tgcgGroups,
        tgcgMeasurements
      ] = groupsData;

      // Устанавливаем состояния групп
      setTemplateGroupNames(tGroupNames);
      setTemplateGroups(tGroups);
      setCropGroupNames(cGroupNames);
      setCropGroups(cGroups);
      setTemplateGroupCropGroups(tgcgGroups);
      setTemplateGroupCropGroupMeasurements(tgcgMeasurements);

      console.log('📊 Indicators from API:', indicators);
      console.log('📊 templateGroups:', tGroups);
      console.log('📊 cropGroups:', cGroups);
      console.log('📊 templateGroupCropGroups:', tgcgGroups);

      reportsRef.current = reports;
      setExistingRules(allRules);

      const filteredReports = reports.filter(r => r.scout_report_id)
      
      // Агрегируем с загруженными данными групп
      const aggregated = aggregateTemplates(
        filteredReports, 
        indicators,
        tGroups,
        cGroups,
        tgcgGroups
      )
      setTemplates(aggregated)

      setCrops(handbooks.crops || [])
      setReportTemplates(handbooks.scout_report_templates || [])
      setMeasurementTypes(handbooks.scout_report_measurement_types || [])

      // Устанавливаем indicators
      setGroupsThresholdsData(indicators);

    } catch (error) {
      console.error("Ошибка загрузки данных", error)
    } finally {
      setIsLoading(false)
    }
  }

  loadAll()
}, [season])

useEffect(() => {
  if (isLoading || reportsRef.current.length === 0) return;
  
  console.log('🔄 Recalculating templates due to thresholds change...');
  
  const filteredReports = reportsRef.current.filter(r => r.scout_report_id);
  
  const aggregated = aggregateTemplates(
    filteredReports,
    groupsThresholdsData,
    templateGroups,
    cropGroups,
    templateGroupCropGroups
  );
  
  setTemplates(aggregated);
  
}, [groupsThresholdsData, templateGroups, cropGroups, templateGroupCropGroups, isLoading]);

  if (isLoading) {
    return (
      <ThemeProvider>
        <Header 
          onSeasonChange={handleSeasonChange} 
          onViewChange={handleViewChange}
          currentView={currentView}
        />
        <div className="p-4 max-w-7xl mx-auto mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <Header 
        onSeasonChange={handleSeasonChange} 
        onViewChange={handleViewChange}
        currentView={currentView}
      />
      <div className="p-4 max-w-7xl mx-auto mt-8 space-y-8">

        {currentView === 'table' && (
          <>
          <DateRangeSlider
            start={dateRange.start}
            end={dateRange.end}
            min={new Date(season, 0, 1)}
            max={new Date(season, 11, 31)}
            onChange={(start, end) => setDateRange({ start, end })}
          />
          <ScoutingOverview templates={filteredTemplates} />
          <ScoutingTemplateTableNested 
            templates={filteredTemplates}
            templateGroups={templateGroups}
            templateGroupNames={templateGroupNames}
            cropGroups={cropGroups}
            cropGroupNames={cropGroupNames}
            expandedGroups={expandedGroups}
            expandedCrops={expandedCrops}
            expandedMeasurements={expandedMeasurements}
            onToggleGroup={handleToggleGroup}
            onToggleCrop={handleToggleCrop}
            onToggleMeasurement={handleToggleMeasurement}
          />
          </>
        )}
        {currentView === 'zones' && (
          <GroupsThresholdsEditor
            indicators={groupsThresholdsData}
            handbooks={{
              crops,
              scout_report_templates: reportTemplates,
              scout_report_measurement_types: measurementTypes
            }}
            templateGroupNames={templateGroupNames}
            templateGroups={templateGroups}
            cropGroupNames={cropGroupNames}
            cropGroups={cropGroups}
            templateGroupCropGroups={templateGroupCropGroups}
            templateGroupCropGroupMeasurements={templateGroupCropGroupMeasurements}
            onAddTemplateGroupCropGroup={handleAddTemplateGroupCropGroup}
            onRemoveTemplateGroupCropGroup={handleRemoveTemplateGroupCropGroup}
            onAddMeasurementToGroup={handleAddMeasurementToGroup}
            onRemoveMeasurementFromGroup={handleRemoveMeasurementFromGroup}
            onSave={handleSaveGroupsThresholds}
            onDeleteTemplateGroup={handleDeleteTemplateGroup}
            onDeleteCropGroup={handleDeleteCropGroup}
            isSaving={isSaving}
            navigation={groupsNavigation}
            onNavigationChange={setGroupsNavigation}
          />
        )}
        {currentView === 'groups' && (
          <GroupsManager
            templates={reportTemplates}
            crops={crops}
            templateGroupNames={templateGroupNames}
            templateGroups={templateGroups}
            cropGroupNames={cropGroupNames}
            cropGroups={cropGroups}
            onUpdate={loadGroupsData}
            onClose={() => setCurrentView('table')}
          />
        )}
      </div>
    </ThemeProvider>
  )
}

export default App