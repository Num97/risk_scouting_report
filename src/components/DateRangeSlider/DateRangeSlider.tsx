import { useMemo, useRef, useState } from "react";
import MonthMarkers from "./MonthMarkers";
import WeekMarkers from "./WeekMarkers";
import RangeInputs from "./RangeInputs";
import { MS_PER_DAY, getMonthName, getDaysInMonth, getWeeksInMonth } from "./utils";

type Props = {
  start: Date;
  end: Date;
  min: Date;
  max: Date;
  onChange: (start: Date, end: Date) => void;
};

export type ViewMode = "months" | "weeks";

export default function DateRangeSlider({
  start,
  end,
  min,
  max,
  onChange,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("months");
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const minTs = min.getTime();
  const maxTs = max.getTime();
  const totalDays = Math.floor((maxTs - minTs) / MS_PER_DAY);

  const isDraggingRef = useRef(false);

  const handleDragStart = () => {
  isDraggingRef.current = true;
};

const handleDragEnd = () => {
  // Даем небольшую задержку, чтобы клик не сработал сразу после перетаскивания
  setTimeout(() => {
    isDraggingRef.current = false;
  }, 100);
};

  // Генерация месяцев для общего вида
  const monthMarkers = useMemo(() => {
    const year = min.getFullYear();
    const markers: { date: Date; dayOffset: number; daysInMonth: number }[] = [];

    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const daysInMonth = getDaysInMonth(date);
      
      const dayOffset = Math.floor(
        (date.getTime() - min.getTime()) / MS_PER_DAY
      );

      markers.push({ date, dayOffset, daysInMonth });
    }

    return markers;
  }, [min]);

  // Генерация недель для выбранного месяца
  const monthWeeks = useMemo(() => {
    if (!selectedMonth) return [];
    
    return getWeeksInMonth(selectedMonth);
  }, [selectedMonth]);

  // Вычисляем позиции для режима месяцев (глобальные)
  const startValue = Math.floor((start.getTime() - minTs) / MS_PER_DAY);
  const endValue = Math.floor((end.getTime() - minTs) / MS_PER_DAY);
  const monthStartPercent = (startValue / totalDays) * 100;
  const monthEndPercent = (endValue / totalDays) * 100;

  const getMonthInGenitive = (date: Date): string => {
    const month = date.getMonth();
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return months[month];
  };

  // Получаем диапазон недель для выбранного месяца
  const weekRange = useMemo(() => {
    if (!selectedMonth || monthWeeks.length === 0) {
      return null;
    }
    
    const firstWeekStart = monthWeeks[0].startDate;
    const lastWeekEnd = monthWeeks[monthWeeks.length - 1].endDate;
    
    const rangeStart = new Date(firstWeekStart);
    rangeStart.setHours(0, 0, 0, 0);
    
    const rangeEnd = new Date(lastWeekEnd);
    rangeEnd.setHours(23, 59, 59, 999);
    
    return {
      start: rangeStart,
      end: rangeEnd,
      duration: rangeEnd.getTime() - rangeStart.getTime()
    };
  }, [selectedMonth, monthWeeks]);

  // Вычисляем позиции для режима недель
  const getWeekModePositions = () => {
    if (!selectedMonth || !weekRange || monthWeeks.length === 0) {
      return { startPercent: 0, endPercent: 0 };
    }
    
    const startTime = start.getTime();
    const endTime = end.getTime();
    
    // Добавляем 1 день к концу, чтобы включить последний день полностью
    const endOfLastDay = endTime + MS_PER_DAY;
    
    const startPercent = ((startTime - weekRange.start.getTime()) / weekRange.duration) * 100;
    const endPercent = ((endOfLastDay - weekRange.start.getTime()) / weekRange.duration) * 100;
    
    // Ограничиваем проценты в пределах 0-100
    return { 
      startPercent: Math.max(0, Math.min(100, startPercent)),
      endPercent: Math.max(0, Math.min(100, endPercent))
    };
  };

  const { startPercent: weekStartPercent, endPercent: weekEndPercent } = getWeekModePositions();

  const handleMonthClick = (monthDate: Date) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    onChange(monthStart, monthEnd);
    setViewMode("weeks");
    setSelectedMonth(monthDate);
  };

  const handleWeekClick = (weekStart: Date, weekEnd: Date) => {
    onChange(weekStart, weekEnd);
  };

  const handleBackToMonths = () => {
    setViewMode("months");
    setSelectedMonth(null);
  };

  const handleRangeChange = (newStart: Date, newEnd: Date) => {
    // Убеждаемся, что даты в правильном порядке
    if (newStart <= newEnd) {
      onChange(newStart, newEnd);
    } else {
      onChange(newEnd, newStart);
    }
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
      if (isDraggingRef.current) {
    return;
  }

    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    if (viewMode === "months") {
      const dayIndex = Math.round(percent * totalDays);
      const clickedDate = new Date(minTs + dayIndex * MS_PER_DAY);

      const distanceToStart = Math.abs(dayIndex - startValue);
      const distanceToEnd = Math.abs(dayIndex - endValue);

      if (distanceToStart < distanceToEnd) {
        if (clickedDate <= end) onChange(clickedDate, end);
      } else {
        if (clickedDate >= start) onChange(start, clickedDate);
      }
    } else if (viewMode === "weeks" && selectedMonth && weekRange) {
      const clickedTime = weekRange.start.getTime() + (percent * weekRange.duration);
      const clickedDate = new Date(clickedTime);
      
      const distanceToStart = Math.abs(clickedTime - start.getTime());
      const distanceToEnd = Math.abs(clickedTime - end.getTime());
      
      if (distanceToStart < distanceToEnd) {
        if (clickedDate <= end) onChange(clickedDate, end);
      } else {
        if (clickedDate >= start) onChange(start, clickedDate);
      }
    }
  };

  const format = (d: Date) =>
    d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const isMonthActive = (monthIndex: number) => {
    if (!start || !end) return false;
    
    const monthStart = new Date(min.getFullYear(), monthIndex, 1);
    const monthEnd = new Date(min.getFullYear(), monthIndex + 1, 0);
    
    return (
      (start >= monthStart && start <= monthEnd) ||
      (end >= monthStart && end <= monthEnd) ||
      (start <= monthStart && end >= monthEnd)
    );
  };

  return (
    <div className="mb-8 p-6 rounded-2xl bg-stone-100 dark:bg-stone-800 shadow-md min-h-[190px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-sm text-stone-500 dark:text-stone-400">
            Период
          </span>
          {viewMode === "weeks" && selectedMonth && (
            <button
              onClick={handleBackToMonths}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-all duration-200 text-xs cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Все месяцы
            </button>
          )}
        </div>
        <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          {format(start)} — {format(end)}
        </span>
      </div>

      <div className="relative">
        {/* Заголовок режима */}
        {viewMode === "weeks" && selectedMonth && (
          <div className="absolute -top-7 left-0 text-sm text-stone-400 dark:text-stone-500 animate-fade-in flex items-center gap-4">
            <span className="font-medium text-stone-600 dark:text-stone-400">
              {getMonthName(selectedMonth)}
            </span>
            <span>• выберите дни</span>
          </div>
        )}

        {/* Кликабельный трек */}
        <div
          ref={trackRef}

          onClick={handleTrackClick}
          className="relative h-3 rounded-full bg-stone-200 dark:bg-stone-700 cursor-pointer"
        >

        {/* Сетка месяцев */}
        <MonthMarkers
          markers={monthMarkers}
          totalDays={totalDays}
          onMonthClick={handleMonthClick}
          isMonthActive={isMonthActive}
          viewMode={viewMode}
          selectedMonth={selectedMonth}
        />

          {viewMode === "weeks" && weekRange && (
            <WeekMarkers
              weeks={monthWeeks}
              onRangeChange={handleRangeChange}
              start={start}
              end={end}
              selectedMonth={selectedMonth}
            />
          )}

          {/* Выбранный диапазон */}
          <div
            className="absolute top-0 h-3 rounded-full bg-stone-600 dark:bg-stone-300 transition-all duration-300 ease-out"
            style={{
              left: `${viewMode === "months" ? monthStartPercent : weekStartPercent}%`,
              width: `${viewMode === "months" 
                ? monthEndPercent - monthStartPercent 
                : weekEndPercent - weekStartPercent}%`,
              zIndex: 2,
            }}
          />

          {/* Range inputs */}
          <div className="absolute inset-0" style={{ height: '12px' }}>
            {viewMode === "months" ? (
              <RangeInputs
                min={0}
                max={totalDays}
                startValue={startValue}
                endValue={endValue}
                onStartChange={(value) => {
                  const newStart = new Date(minTs + value * MS_PER_DAY);
                  if (newStart <= end) {
                    onChange(newStart, end);
                  }
                }}
                onEndChange={(value) => {
                  const newEnd = new Date(minTs + value * MS_PER_DAY);
                  if (newEnd >= start) {
                    onChange(start, newEnd);
                  }
                }}
                onMouseDown={handleDragStart}  
                onMouseUp={handleDragEnd}      
              />
            ) : (
              selectedMonth && weekRange && (
                <RangeInputs
                  min={0}
                  max={100}
                  startValue={weekStartPercent}
                  endValue={weekEndPercent}
                  onStartChange={(percent) => {
                    const clampedPercent = Math.max(0, Math.min(100, percent));
                    const newStartTime = weekRange.start.getTime() + (clampedPercent / 100) * weekRange.duration;
                    let newStart = new Date(newStartTime);
                    
                    // Ограничиваем диапазоном недель
                    if (newStart < weekRange.start) newStart = new Date(weekRange.start);
                    if (newStart > weekRange.end) newStart = new Date(weekRange.end);
                    
                    if (newStart <= end) {
                      onChange(newStart, end);
                    }
                  }}
                  onEndChange={(percent) => {
                    const clampedPercent = Math.max(0, Math.min(100, percent));
                    const newEndTime = weekRange.start.getTime() + (clampedPercent / 100) * weekRange.duration;
                    let newEnd = new Date(newEndTime);
                    
                    // Ограничиваем диапазоном недель
                    if (newEnd < weekRange.start) newEnd = new Date(weekRange.start);
                    if (newEnd > weekRange.end) newEnd = new Date(weekRange.end);
                    
                    if (newEnd >= start) {
                      onChange(start, newEnd);
                    }
                  }}
                />
              )
            )}
          </div>
        </div>

        {/* Подписи месяцев */}
        {viewMode === "months" && (
          <div className="relative mt-3 text-base text-stone-500 dark:text-stone-400">
            {monthMarkers.map((m, i) => {
              const centerPosition = (m.dayOffset + m.daysInMonth / 2) / totalDays * 100;
              const isActive = isMonthActive(i);
              
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleMonthClick(m.date)}
                  className={`
                    absolute transition-all duration-200
                    hover:text-stone-900 dark:hover:text-white
                    hover:scale-110 cursor-pointer
                    ${isActive 
                      ? "text-stone-900 dark:text-white font-medium" 
                      : "text-stone-500 dark:text-stone-400"
                    }
                  `}
                  style={{
                    left: `${centerPosition}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {m.date.toLocaleDateString("ru-RU", { month: "short" })}
                </button>
              );
            })}
          </div>
        )}
        
        {/* Подписи недель */}
        {viewMode === "weeks" && monthWeeks.length > 0 && (
          <div className="relative mt-1">
            {monthWeeks.map((week, i) => {
              const weekWidth = 100 / monthWeeks.length;
              const centerPosition = (i * weekWidth) + (weekWidth / 2);
              
              // Проверяем пересечение с выбранным диапазоном
              const isActive = start <= week.endDate && end >= week.startDate;
              
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleWeekClick(week.startDate, week.endDate)}
                  className={`
                    absolute flex flex-col items-center gap-0.5
                    transition-all duration-200
                    hover:text-stone-900 dark:hover:text-white
                    hover:scale-110 cursor-pointer
                    ${isActive 
                      ? "text-stone-900 dark:text-white font-medium" 
                      : "text-stone-400 dark:text-stone-500"
                    }
                  `}
                  style={{
                    left: `${centerPosition}%`,
                    transform: "translateX(-50%)",
                    top: "24px",
                    zIndex: 10,
                  }}
                >
                  <span className="text-xs bg-stone-100/80 dark:bg-stone-800/80 px-1 rounded backdrop-blur-sm">
                    {week.startDate.getDate()} {getMonthInGenitive(week.startDate)} - {week.endDate.getDate()} {getMonthInGenitive(week.endDate)}
                  </span>
                  <span className="text-xs opacity-90">
                    нед. {week.weekNumber}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}