import React from "react";

type Props = {
  size?: number;
  className?: string;
  active?: boolean; // ярче если true
  paused?: boolean;
  title?: string;
};

const SunIcon: React.FC<Props> = ({
  size = 20,
  className = "",
  active = false,
  paused = false,
  title = "Sun",
}) => {
  const coreColor = active ? "#E5E7EB" : "#9CA3AF";
  const rayColor = active ? "#D1D5DB" : "#6B7280";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="none"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      {/* центр солнца с пульсацией */}
      <circle cx="12" cy="12" r="5" fill={coreColor}>
        {!paused && (
          <>
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1;1.08;1"
              dur="4s"
              repeatCount="indefinite"
              additive="sum"
              origin="12 12"
            />
            <animate
              attributeName="opacity"
              values="1;0.9;1"
              dur="4s"
              repeatCount="indefinite"
            />
          </>
        )}
      </circle>

      {/* лучи */}
      <g stroke={rayColor} strokeWidth="2" strokeLinecap="round">
        {[
          { x1: 12, y1: 1, x2: 12, y2: 3 },
          { x1: 12, y1: 21, x2: 12, y2: 23 },
          { x1: 4.22, y1: 4.22, x2: 5.64, y2: 5.64 },
          { x1: 18.36, y1: 18.36, x2: 19.78, y2: 19.78 },
          { x1: 1, y1: 12, x2: 3, y2: 12 },
          { x1: 21, y1: 12, x2: 23, y2: 12 },
          { x1: 4.22, y1: 19.78, x2: 5.64, y2: 18.36 },
          { x1: 18.36, y1: 5.64, x2: 19.78, y2: 4.22 },
        ].map((line, idx) => (
          <line key={idx} {...line}>
            {!paused && (
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                dur={`${3 + idx * 0.2}s`}
                repeatCount="indefinite"
              />
            )}
          </line>
        ))}
      </g>
    </svg>
  );
};

export default SunIcon;
