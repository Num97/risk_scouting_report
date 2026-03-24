import React, { useMemo } from "react"
import { motion } from "framer-motion"
import ScoutingTable from "../Table/ScoutingTable"
import ScoutingTemplateTable from "../Table/ScoutingTemplateTable"
import ScoutingActivityChart from "../ScoutingActivityChart/ScoutingActivityChart"
import type { ScoutingReportItem } from "../../utils/forms"

interface ScoutingTabsProps {
  data: ScoutingReportItem[]
}

type TabType = "template" | "group" | "stats"

const ScoutingTabs: React.FC<ScoutingTabsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = React.useState<TabType>("template")

  const tabs = useMemo(
    () => [
      { label: "По заданиям", value: "template" as TabType },
      { label: "По хозяйствам", value: "group" as TabType },
      { label: "Статистика", value: "stats" as TabType },
    ],
    []
  )

  const activeIndex = tabs.findIndex((t) => t.value === activeTab)

  return (
    <div className="w-full">
      {/* ====== Toggle Header ====== */}
      <div className="flex justify-center mb-6">
        <div className="relative inline-flex rounded-xl bg-stone-200 dark:bg-stone-800 p-1 shadow-inner w-full max-w-lg">

          {/* Индикатор */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg bg-stone-500 shadow-md"
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              width: `calc(${100 / tabs.length}% - 0.5rem)`,
              left: `calc(${activeIndex * (100 / tabs.length)}% + 0.25rem)`,
            }}
          />

          {/* Кнопки */}
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`relative z-10 flex-1 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                activeTab === tab.value
                  ? "text-white"
                  : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
              }`}
              style={{ padding: "0.5rem 1rem" }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====== Контент ====== */}
      <div className="transition-opacity duration-300">
        {activeTab === "template" && (
          <ScoutingTemplateTable data={data} />
        )}

        {activeTab === "group" && (
          <ScoutingTable data={data} />
        )}

        {activeTab === "stats" && (
          <ScoutingActivityChart data={data} />
        )}
      </div>
    </div>
  )
}

export default ScoutingTabs