import React from "react";

type Props = {
  size?: number;
  className?: string;
  active?: boolean; // brighter highlight
  paused?: boolean;
  title?: string;
};

const MoonIcon: React.FC<Props> = ({
  size = 20,
  className = "",
  active = false,
  paused = false,
  title = "Moon",
}) => {
  const core = active ? "#F2F7FF" : "#E8EEF9";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <title>{title}</title>

      <defs>
        {/* soft glow */}
        <radialGradient id="moonGlow" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor={core} stopOpacity="0.9" />
          <stop offset="60%" stopColor={core} stopOpacity="0.25" />
          <stop offset="100%" stopColor={core} stopOpacity="0" />
        </radialGradient>

        {/* crescent mask */}
        <mask id="crescentMask">
          <rect x="0" y="0" width="24" height="24" fill="black" />
          <circle cx="12" cy="12" r="9.2" fill="white" />
          {/* черная часть, которая будет создавать фазу */}
          <circle
            cx="15.5"
            cy="11.6"
            r="7.8"
            fill="black"
          >
            {!paused && (
              <animate
                attributeName="cx"
                values="20;15.5;11;15.5;20"
                dur="40s"           /* медленнее, плавно */
                keyTimes="0;0.25;0.5;0.75;1"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
              />
            )}
            {!paused && (
              <animate
                attributeName="fill-opacity"
                values="1;0.9;1;0.9;1"
                dur="40s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </mask>
      </defs>

      {/* glow behind the moon */}
      <circle cx="12" cy="11.8" r="7.6" fill="url(#moonGlow)" opacity={0.95} />

      {/* moon crescent using mask */}
      <g mask="url(#crescentMask)">
        <circle
          cx="12"
          cy="11.8"
          r="7.6"
          fill={core}
          stroke="#ffffff33"
          strokeWidth="0.35"
        />

        {/* subtle craters */}
        <circle cx="9.6" cy="9.6" r="0.7" fill="#ffffff30" opacity="0.9" />
        <circle cx="13.2" cy="12.8" r="0.45" fill="#00000012" opacity="0.9" />
        <circle cx="11.2" cy="14.1" r="0.55" fill="#00000008" opacity="0.9" />

        {/* soft highlight */}
        <ellipse
          cx="10.2"
          cy="8.6"
          rx="1.8"
          ry="0.6"
          fill="#ffffff20"
          transform="rotate(-20 10.2 8.6)"
        />
      </g>

      {paused && <desc>Animations paused (reduced motion)</desc>}
    </svg>
  );
};

export default MoonIcon;
