import React, { useEffect, useState, useCallback } from 'react';
import { useTourStore } from '../../store/tourStore';
import { useRAGStore } from '../../store/ragStore';
import { tourSteps } from '../../data/tourSteps';
import { Button } from '../UI/Button';

export const TourOverlay: React.FC = () => {
  const { 
    tourProgress, 
    stopTour, 
    completeStep, 
    nextStep, 
    previousStep 
  } = useTourStore();
  
  const { setCurrentModule } = useRAGStore();
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const currentStep = tourSteps.find(step => step.id === tourProgress.currentStepId);

  // Calculate tooltip position based on target element and position preference
  const calculateTooltipPosition = useCallback((element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 20;

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
      case 'center':
        x = window.innerWidth / 2 - tooltipWidth / 2;
        y = window.innerHeight / 2 - tooltipHeight / 2;
        break;
      default:
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + offset;
    }

    // Ensure tooltip stays within viewport
    x = Math.max(10, Math.min(x, window.innerWidth - tooltipWidth - 10));
    y = Math.max(10, Math.min(y, window.innerHeight - tooltipHeight - 10));

    return { x, y };
  }, []);

  // Update highlighted element and tooltip position when step changes
  useEffect(() => {
    if (!currentStep || !tourProgress.isActive) {
      setHighlightedElement(null);
      return;
    }

    const targetElement = document.querySelector(currentStep.target) as HTMLElement;
    if (targetElement) {
      setHighlightedElement(targetElement);
      const position = calculateTooltipPosition(targetElement, currentStep.position);
      setTooltipPosition(position);

      // Scroll element into view
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });

      // Switch to appropriate module if needed
      if (currentStep.module !== 'overview') {
        setCurrentModule(currentStep.module as any);
      }
    }
  }, [currentStep, tourProgress.isActive, calculateTooltipPosition, setCurrentModule]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (highlightedElement && currentStep) {
        const position = calculateTooltipPosition(highlightedElement, currentStep.position);
        setTooltipPosition(position);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [highlightedElement, currentStep, calculateTooltipPosition]);

  // Execute step actions
  const executeStepActions = useCallback(async (actions: any[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          const clickTarget = document.querySelector(action.target) as HTMLElement;
          if (clickTarget) {
            clickTarget.click();
          }
          break;
        case 'input':
          const inputTarget = document.querySelector(action.target) as HTMLInputElement;
          if (inputTarget) {
            inputTarget.value = action.value;
            inputTarget.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
        case 'wait':
          await new Promise(resolve => setTimeout(resolve, action.delay));
          break;
        case 'navigate':
          if (action.target) {
            setCurrentModule(action.target as any);
          }
          break;
      }
    }
  }, [setCurrentModule]);

  const handleNext = async () => {
    if (currentStep) {
      // Execute actions if present
      if (currentStep.actions) {
        await executeStepActions(currentStep.actions);
      }
      
      // Mark step as completed
      completeStep(currentStep.id);
      
      // Move to next step
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSkip = () => {
    stopTour();
  };

  if (!tourProgress.isActive || !currentStep) {
    return null;
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Highlight spotlight */}
      {highlightedElement && currentStep.position !== 'center' && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: highlightedElement.getBoundingClientRect().left - 4,
            top: highlightedElement.getBoundingClientRect().top - 4,
            width: highlightedElement.getBoundingClientRect().width + 8,
            height: highlightedElement.getBoundingClientRect().height + 8,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
          }}
        />
      )}

      {/* Tour tooltip */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {currentStep.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Step {currentStep.order}</span>
              <span>•</span>
              <span className="capitalize">{currentStep.module}</span>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 ml-2"
            title="Skip tour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{tourProgress.completedSteps.length + 1} / {tourSteps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((tourProgress.completedSteps.length + 1) / tourSteps.length) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep.order === 1}
          >
            Previous
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
            >
              Skip Tour
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
            >
              {currentStep.order === tourSteps.length ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TourOverlay;