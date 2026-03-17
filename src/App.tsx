import { useEffect, useState, useRef } from "react"
import { getScoutReports, getIndicators, saveAllThresholds, getAllThresholds, type IndicatorThreshold, deleteTemplateThresholds, deleteCropThresholds } from "./api/scoutingReportApi"
import { aggregateTemplates } from "./services/aggregateTemplates"

import ScoutingTemplateTableNested from "./components/Table/ScoutingTemplateTableNested"

import type { TemplateData } from "./types/scoutingAggregated"
import type { ScoutReportItem } from "./types/scoutingReport"
import { ThemeProvider } from "./components/ui/theme-provider";
import { Header } from "./components/Header/Header";
import { useSearchParams } from "react-router-dom";

import { getHandbooks } from "./api/handbooksApi"
import ThresholdsEditor from "./components/ThresholdsEditor/ThresholdsEditor"
import type { IndicatorsData } from "./components/ThresholdsEditor/types"
import type { Crop, ScoutReportTemplate, ScoutReportMeasurementType } from "./types/handbooks"

function App() {
  const [templates, setTemplates] = useState<TemplateData[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [reportTemplates, setReportTemplates] = useState<ScoutReportTemplate[]>([])
  const [measurementTypes, setMeasurementTypes] = useState<ScoutReportMeasurementType[]>([])
  const [thresholdsData, setThresholdsData] = useState<IndicatorsData>({})
  const [existingRules, setExistingRules] = useState<IndicatorThreshold[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'table' | 'zones'>('table') // Новое состояние
  
  const reportsRef = useRef<ScoutReportItem[]>([])

  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();

  const urlSeason = Number(searchParams.get("season")) || currentYear;
  const [season, setSeason] = useState(urlSeason);

  const handleSeasonChange = (newSeason: number) => {
    setSeason(newSeason);
    setSearchParams({ ...Object.fromEntries(searchParams), season: String(newSeason) });
  };

  const handleViewChange = (view: 'table' | 'zones') => {
    setCurrentView(view);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      setIsSaving(true);
      console.log(`🗑️ Deleting template ${templateId}...`);
      
      // Удаляем все правила шаблона
      await deleteTemplateThresholds(templateId);
      
      // Обновляем данные
      const [indicators, allRules] = await Promise.all([
        getIndicators(),
        getAllThresholds()
      ]);
      
      // Обновляем existingRules
      setExistingRules(allRules);
      
      // Обновляем thresholdsData
      const convertedData: IndicatorsData = {}
      
      if (indicators && Object.keys(indicators).length > 0) {
        Object.entries(indicators).forEach(([tId, templateData]) => {
          convertedData[tId] = {}
          
          Object.entries(templateData).forEach(([cId, cropData]) => {
            convertedData[tId][cId] = {}
            
            Object.entries(cropData).forEach(([mId, zones]) => {
              convertedData[tId][cId][mId] = zones.map(zone => ({
                threshold_value: zone.threshold_value,
                zone: zone.zone
              }))
            })
          })
        })
      }
      
      setThresholdsData(convertedData);
      
      console.log(`✅ Template ${templateId} deleted successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to delete template ${templateId}:`, error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCrop = async (templateId: number, cropId: number) => {
    try {
      setIsSaving(true);
      console.log(`🗑️ Deleting crop ${cropId} from template ${templateId}...`);
      
      // Удаляем все правила для этой культуры в шаблоне
      await deleteCropThresholds(templateId, cropId);
      
      // Обновляем данные
      const [indicators, allRules] = await Promise.all([
        getIndicators(),
        getAllThresholds()
      ]);
      
      // Обновляем existingRules
      setExistingRules(allRules);
      
      // Обновляем thresholdsData
      const convertedData: IndicatorsData = {}
      
      if (indicators && Object.keys(indicators).length > 0) {
        Object.entries(indicators).forEach(([tId, templateData]) => {
          convertedData[tId] = {}
          
          Object.entries(templateData).forEach(([cId, cropData]) => {
            convertedData[tId][cId] = {}
            
            Object.entries(cropData).forEach(([mId, zones]) => {
              convertedData[tId][cId][mId] = zones.map(zone => ({
                threshold_value: zone.threshold_value,
                zone: zone.zone
              }))
            })
          })
        })
      }
      
      setThresholdsData(convertedData);
      
      console.log(`✅ Crop ${cropId} deleted successfully from template ${templateId}`);
      
    } catch (error) {
      console.error(`❌ Failed to delete crop ${cropId} from template ${templateId}:`, error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Загружаем все данные
  useEffect(() => {
    async function loadAll() {
      try {
        setIsLoading(true);
        
        const [reports, indicators, handbooks, allRules] = await Promise.all([
          getScoutReports(season),
          getIndicators(),
          getHandbooks(),
          getAllThresholds()
        ]);

        reportsRef.current = reports;
        setExistingRules(allRules);

        const filteredReports = reports.filter(r => r.scout_report_id)
        const aggregated = aggregateTemplates(filteredReports, indicators)
        setTemplates(aggregated)

        setCrops(handbooks.crops || [])
        setReportTemplates(handbooks.scout_report_templates || [])
        setMeasurementTypes(handbooks.scout_report_measurement_types || [])

        const convertedData: IndicatorsData = {}
        
        if (indicators && Object.keys(indicators).length > 0) {
          Object.entries(indicators).forEach(([templateId, templateData]) => {
            convertedData[templateId] = {}
            
            Object.entries(templateData).forEach(([cropId, cropData]) => {
              convertedData[templateId][cropId] = {}
              
              Object.entries(cropData).forEach(([measurementId, zones]) => {
                convertedData[templateId][cropId][measurementId] = zones.map(zone => ({
                  threshold_value: zone.threshold_value,
                  zone: zone.zone
                }))
              })
            })
          })
        }
        
        setThresholdsData(convertedData)

      } catch (error) {
        console.error("Ошибка загрузки данных", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAll()
  }, [season])

  // useEffect для обновления templates при изменении thresholdsData
  useEffect(() => {
    if (isLoading || !reportsRef.current.length || Object.keys(thresholdsData).length === 0) {
      return;
    }

    // console.log("🔄 Updating templates with new thresholds:", thresholdsData);
    
    const indicatorsForAggregation: any = {};
    
    Object.entries(thresholdsData).forEach(([templateId, templateData]) => {
      indicatorsForAggregation[templateId] = {};
      
      Object.entries(templateData).forEach(([cropId, cropData]) => {
        indicatorsForAggregation[templateId][cropId] = {};
        
        Object.entries(cropData).forEach(([measurementId, zones]) => {
          indicatorsForAggregation[templateId][cropId][measurementId] = zones.map(zone => ({
            threshold_value: zone.threshold_value,
            zone: zone.zone
          }));
        });
      });
    });

    const filteredReports = reportsRef.current.filter(r => r.scout_report_id);
    const aggregated = aggregateTemplates(filteredReports, indicatorsForAggregation);
    setTemplates(aggregated);
    
  }, [thresholdsData, isLoading]);

  const handleSaveThresholds = async (updatedIndicators: IndicatorsData) => {
    try {
      setIsSaving(true)
      console.log("Saving thresholds:", updatedIndicators)
      
      await saveAllThresholds(thresholdsData, updatedIndicators, existingRules)
      
      setThresholdsData(updatedIndicators)
      
      const updatedRules = await getAllThresholds()
      setExistingRules(updatedRules)
      
      console.log("Thresholds saved successfully")
      
    } catch (error) {
      console.error("Error saving thresholds:", error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

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
        {currentView === 'table' ? (
          <ScoutingTemplateTableNested templates={templates} />
        ) : (
          <ThresholdsEditor
            indicators={thresholdsData}
            handbooks={{
              crops,
              scout_report_templates: reportTemplates,
              scout_report_measurement_types: measurementTypes
            }}
            onSave={handleSaveThresholds}
            onDeleteTemplate={handleDeleteTemplate}
            onDeleteCrop={handleDeleteCrop}
            isSaving={isSaving}
          />
        )}
      </div>
    </ThemeProvider>
  )
}

export default App