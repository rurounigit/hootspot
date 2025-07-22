// src/components/common/Tooltip.tsx

import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Position tooltip to be centered and 8px above the element
    const top = rect.top - 8;
    const left = rect.left + (rect.width / 2);

    setPosition({ top, left });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const tooltipElement = isVisible ? (
    <div
      // These classNames are specifically chosen to match your screenshot
      className="fixed z-50 w-64 rounded-lg bg-gray-900 px-4 py-3 text-xs font-normal text-white shadow-xl pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        // This transform centers the tooltip horizontally and places its bottom edge at the calculated 'top' position
        transform: 'translate(-50%, -100%)',
      }}
    >
      {content}
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {tooltipElement}
    </div>
  );
};

export default Tooltip;