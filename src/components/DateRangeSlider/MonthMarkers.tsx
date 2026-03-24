import type { ViewMode } from "./DateRangeSlider";  // Импортируем тип

type Props = {
  markers: { date: Date; dayOffset: number; daysInMonth: number }[];
  totalDays: number;
  onMonthClick: (date: Date, index: number) => void;
  isMonthActive: (index: number) => boolean;
  viewMode: ViewMode;  // Теперь тип определен
  selectedMonth: Date | null;
};

export default function MonthMarkers({
  markers,
  totalDays,
  // onMonthClick,
  isMonthActive,
  viewMode,
  // selectedMonth,
}: Props) {
  return (
    <>
      {markers.map((m, i) => {
        if (i === 0) return null;
        
        const percent = (m.dayOffset / totalDays) * 100;
        const isActive = isMonthActive(i);
        // const isSelectedMonth = selectedMonth?.getMonth() === i;
        
        // В недельном режиме делаем линии очень прозрачными
        const opacity = viewMode === "weeks" 
          ? 0.0  // Едва заметные
          : isActive ? 0.8 : 0.4;
        
        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-stone-400 dark:bg-stone-500 transition-colors duration-200"
            style={{ 
              left: `${percent}%`, 
              zIndex: 4,
              opacity,
            }}
          />
        );
      })}
    </>
  );
}