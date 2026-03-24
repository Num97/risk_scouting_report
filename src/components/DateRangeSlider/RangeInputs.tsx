import { useState, useEffect } from "react";
import styles from "./DateRangeSlider.module.css";

type Props = {
  min: number;
  max: number;
  startValue: number;
  endValue: number;
  onStartChange: (value: number) => void;
  onEndChange: (value: number) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
};

export default function RangeInputs({
  min,
  max,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  onMouseDown,
  onMouseUp,
}: Props) {
  const [localStart, setLocalStart] = useState(startValue);
  const [localEnd, setLocalEnd] = useState(endValue);

  // Синхронизация с пропсами извне
  useEffect(() => setLocalStart(startValue), [startValue]);
  useEffect(() => setLocalEnd(endValue), [endValue]);

  const handleStartChange = (value: number) => {
    // Не даем start стать больше end
    const newStart = Math.min(value, localEnd);
    setLocalStart(newStart);
    onStartChange(newStart);
  };

  const handleEndChange = (value: number) => {
    // Не даем end стать меньше start
    const newEnd = Math.max(value, localStart);
    setLocalEnd(newEnd);
    onEndChange(newEnd);
  };

  return (
    <>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={localStart}
        onChange={(e) => handleStartChange(Number(e.target.value))}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        className={styles.slider}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "12px",
          zIndex: localStart > localEnd ? 5 : 4,
        }}
      />

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={localEnd}
        onChange={(e) => handleEndChange(Number(e.target.value))}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        className={styles.slider}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "12px",
          zIndex: localEnd < localStart ? 5 : 4,
        }}
      />
    </>
  );
}