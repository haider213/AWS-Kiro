import React, { useEffect, useState, useCallback } from 'react';
import { useTourStore } from '../../store/tourStore';
import { tooltips } from '../../data/tooltips';

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showTooltips, activeTooltip, showTooltip, hideTooltip } = useTourStore();
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipContent, setTooltipContent] = useState<any>(null);

  const calculateTooltipPosition = useCallback((element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 120;
    const offset = 12;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - offset;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + offset;
        break;
      case 'left':
        x = rect.left - tooltipWidth - offset;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = rect.right + offset;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(10, Math.min(x, window.innerWidth - tooltipWidth - 10));
    y = Math.max(10, Math.min(y, window.innerHeight - tooltipHeight - 10));

    return { x, y };
  }, []);

  // Set up event listeners for tooltips
  useEffect(() => {
    if (!showTooltips) return;

    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tooltipId = target.getAttribute('data-tooltip');
      
      if (tooltipId) {
        const tooltip = tooltips.find(t => t.target.includes(tooltipId));
        if (tooltip && tooltip.trigger === 'hover') {
          const position = calculateTooltipPosition(target, tooltip.position);
          setTooltipPosition(position);
          setTooltipContent(tooltip);
          showTooltip(tooltip.id);
        }
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tooltipId = target.getAttribute('data-tooltip');
      
      if (tooltipId) {
        const tooltip = tooltips.find(t => t.target.includes(tooltipId));
        if (tooltip && tooltip.trigger === 'hover') {
          hideTooltip();
          setTooltipContent(null);
        }
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tooltipId = target.getAttribute('data-tooltip');
      
      if (tooltipId) {
        const tooltip = tooltips.find(t => t.target.includes(tooltipId));
        if (tooltip && tooltip.trigger === 'click') {
          const position = calculateTooltipPosition(target, tooltip.position);
          setTooltipPosition(position);
          setTooltipContent(tooltip);
          showTooltip(tooltip.id);
        }
      } else if (activeTooltip) {
        // Click outside tooltip - hide it
        hideTooltip();
        setTooltipContent(null);
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const tooltipId = target.getAttribute('data-tooltip');
      
      if (tooltipId) {
        const tooltip = tooltips.find(t => t.target.includes(tooltipId));
        if (tooltip && tooltip.trigger === 'focus') {
          const position = calculateTooltipPosition(target, tooltip.position);
          setTooltipPosition(position);
          setTooltipContent(tooltip);
          showTooltip(tooltip.id);
        }
      }
    };

    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const tooltipId = target.getAttribute('data-tooltip');
      
      if (tooltipId) {
        const tooltip = tooltips.find(t => t.target.includes(tooltipId));
        if (tooltip && tooltip.trigger === 'focus') {
          hideTooltip();
          setTooltipContent(null);
        }
      }
    };

    // Add event listeners
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, [showTooltips, activeTooltip, calculateTooltipPosition, showTooltip, hideTooltip]);

  return (
    <>
      {children}
      
      {/* Tooltip overlay */}
      {showTooltips && activeTooltip && tooltipContent && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 max-w-xs pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          {/* Tooltip content */}
          <div className="space-y-2">
            <div className="font-medium text-gray-100">
              {tooltipContent.title}
            </div>
            <div className="text-gray-300 leading-relaxed">
              {tooltipContent.content}
            </div>
            
            {/* Category badge */}
            <div className="flex justify-end">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                tooltipContent.category === 'concept' ? 'bg-blue-100 text-blue-800' :
                tooltipContent.category === 'parameter' ? 'bg-green-100 text-green-800' :
                tooltipContent.category === 'action' ? 'bg-purple-100 text-purple-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {tooltipContent.category}
              </span>
            </div>
          </div>

          {/* Tooltip arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              tooltipContent.position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1' :
              tooltipContent.position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1' :
              tooltipContent.position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1' :
              'left-0 top-1/2 -translate-y-1/2 -translate-x-1'
            }`}
          />
        </div>
      )}
    </>
  );
};

export default TooltipProvider;