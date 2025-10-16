import React, { useEffect, useRef, useState } from 'react';
import { VisualizationEngine, PromptFlowConfig } from '../VisualizationEngine';
import { Chunk } from '../../types';

interface PromptFlowVisualizationProps {
  query: string;
  retrievedChunks: Chunk[];
  constructedPrompt: string;
  generatedResponse?: string;
  onStepHover?: (step: string) => void;
  onStepClick?: (step: string) => void;
  className?: string;
  config?: Partial<PromptFlowConfig>;
}

interface FlowStep {
  id: string;
  label: string;
  content: string;
  type: 'input' | 'process' | 'output';
  status: 'pending' | 'active' | 'complete';
  details?: any;
}

export const PromptFlowVisualization: React.FC<PromptFlowVisualizationProps> = ({
  query,
  retrievedChunks,
  constructedPrompt,
  generatedResponse,
  onStepHover,
  onStepClick,
  className = '',
  config = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 400 });
  const [activeStep, setActiveStep] = useState<string>('');
  const [animationProgress, setAnimationProgress] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Default configuration
  const defaultConfig: PromptFlowConfig = {
    width: dimensions.width,
    height: dimensions.height,
    margin: { top: 40, right: 40, bottom: 40, left: 40 },
    animationDuration: 1000,
    colorScheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    nodeSize: 80,
    arrowSize: 8,
    flowDirection: 'horizontal'
  };

  const finalConfig = { ...defaultConfig, ...config, width: dimensions.width, height: dimensions.height };

  // Create flow steps based on current state
  const createFlowSteps = (): FlowStep[] => {
    const steps: FlowStep[] = [
      {
        id: 'query',
        label: 'User Query',
        content: query || 'No query provided',
        type: 'input',
        status: query ? 'complete' : 'pending',
        details: {
          length: query?.length || 0,
          wordCount: query?.split(' ').length || 0
        }
      },
      {
        id: 'retrieval',
        label: 'Context Retrieval',
        content: `${retrievedChunks.length} chunks retrieved`,
        type: 'process',
        status: retrievedChunks.length > 0 ? 'complete' : 'pending',
        details: {
          chunkCount: retrievedChunks.length,
          totalTokens: retrievedChunks.reduce((sum, chunk) => sum + chunk.content.length, 0),
          avgChunkSize: retrievedChunks.length > 0 
            ? Math.round(retrievedChunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / retrievedChunks.length)
            : 0
        }
      },
      {
        id: 'construction',
        label: 'Prompt Construction',
        content: 'Combining query + context',
        type: 'process',
        status: constructedPrompt ? 'complete' : 'pending',
        details: {
          promptLength: constructedPrompt?.length || 0,
          hasContext: retrievedChunks.length > 0,
          hasQuery: !!query
        }
      },
      {
        id: 'generation',
        label: 'Response Generation',
        content: generatedResponse ? 'Response generated' : 'Awaiting generation',
        type: 'output',
        status: generatedResponse ? 'complete' : 'pending',
        details: {
          responseLength: generatedResponse?.length || 0,
          wordCount: generatedResponse?.split(' ').length || 0
        }
      }
    ];

    return steps;
  };

  const flowSteps = createFlowSteps();

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 1000,
          height: rect.height || 400
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animate flow progression
  useEffect(() => {
    const completedSteps = flowSteps.filter(step => step.status === 'complete').length;
    const targetProgress = (completedSteps / flowSteps.length) * 100;
    
    const animateProgress = () => {
      setAnimationProgress(prev => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 1) return targetProgress;
        return prev + diff * 0.1;
      });
    };

    const interval = setInterval(animateProgress, 50);
    return () => clearInterval(interval);
  }, [flowSteps]);

  // Render visualization
  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup previous visualization
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const engine = VisualizationEngine.getInstance();
    
    cleanupRef.current = engine.renderPromptConstruction(
      containerRef.current,
      query,
      retrievedChunks,
      constructedPrompt,
      finalConfig,
      {
        onStepHover: (step) => {
          setActiveStep(step);
          onStepHover?.(step);
        },
        onStepClick
      }
    );

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [query, retrievedChunks, constructedPrompt, generatedResponse, dimensions, activeStep, onStepHover, onStepClick]);

  // Get step color based on status
  const getStepColor = (step: FlowStep) => {
    switch (step.status) {
      case 'complete': return '#10B981';
      case 'active': return '#3B82F6';
      case 'pending': return '#9CA3AF';
      default: return '#9CA3AF';
    }
  };

  // Get step details for active step
  const getActiveStepDetails = () => {
    const step = flowSteps.find(s => s.id === activeStep);
    if (!step) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
        <h4 className="font-semibold text-gray-900 mb-2">{step.label}</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              step.status === 'complete' ? 'text-green-600' :
              step.status === 'active' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
            </span>
          </div>
          
          {step.details && (
            <>
              {step.id === 'query' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Length:</span>
                    <span className="font-medium">{step.details.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Words:</span>
                    <span className="font-medium">{step.details.wordCount}</span>
                  </div>
                </>
              )}
              
              {step.id === 'retrieval' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chunks:</span>
                    <span className="font-medium">{step.details.chunkCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tokens:</span>
                    <span className="font-medium">{step.details.totalTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Chunk Size:</span>
                    <span className="font-medium">{step.details.avgChunkSize}</span>
                  </div>
                </>
              )}
              
              {step.id === 'construction' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prompt Length:</span>
                    <span className="font-medium">{step.details.promptLength} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Has Context:</span>
                    <span className={`font-medium ${step.details.hasContext ? 'text-green-600' : 'text-red-600'}`}>
                      {step.details.hasContext ? 'Yes' : 'No'}
                    </span>
                  </div>
                </>
              )}
              
              {step.id === 'generation' && generatedResponse && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Length:</span>
                    <span className="font-medium">{step.details.responseLength} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Words:</span>
                    <span className="font-medium">{step.details.wordCount}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return (
    <div className={`w-full h-full min-h-[400px] border border-gray-200 rounded-lg bg-white ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Prompt Construction Flow</h3>
            <p className="text-sm text-gray-600 mt-1">
              Step-by-step visualization of RAG pipeline execution
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">Progress:</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${animationProgress}%` }}
              />
            </div>
            <div className="text-sm font-medium text-gray-900">
              {Math.round(animationProgress)}%
            </div>
          </div>
        </div>
      </div>

      {/* Flow steps overview */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          {flowSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                  transition-colors duration-300 cursor-pointer
                `}
                style={{ backgroundColor: getStepColor(step) }}
                onMouseEnter={() => setActiveStep(step.id)}
                onMouseLeave={() => setActiveStep('')}
                onClick={() => onStepClick?.(step.id)}
              >
                {index + 1}
              </div>
              <div className="ml-2 text-sm">
                <div className="font-medium text-gray-900">{step.label}</div>
                <div className="text-gray-600">{step.content}</div>
              </div>
              
              {index < flowSteps.length - 1 && (
                <div className="mx-4 flex-1 h-0.5 bg-gray-300 relative">
                  <div 
                    className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
                    style={{ 
                      width: animationProgress > ((index + 1) / flowSteps.length) * 100 ? '100%' : '0%'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div 
          ref={containerRef}
          className="w-full h-full p-4"
          style={{ minHeight: '300px' }}
        />
        
        {/* Active step details overlay */}
        {activeStep && (
          <div className="absolute top-4 right-4 z-10">
            {getActiveStepDetails()}
          </div>
        )}
      </div>

      {/* Context preview for retrieved chunks */}
      {retrievedChunks.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Retrieved Context Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {retrievedChunks.slice(0, 6).map((chunk, index) => (
              <div key={chunk.id} className="bg-white border border-gray-200 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Chunk {index + 1}</div>
                <div className="text-sm text-gray-700 line-clamp-3">
                  {chunk.content.length > 100 
                    ? chunk.content.substring(0, 100) + '...'
                    : chunk.content
                  }
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {chunk.content.length} chars
                </div>
              </div>
            ))}
            {retrievedChunks.length > 6 && (
              <div className="bg-gray-100 border border-gray-200 rounded p-3 flex items-center justify-center">
                <div className="text-sm text-gray-600">
                  +{retrievedChunks.length - 6} more chunks
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptFlowVisualization;