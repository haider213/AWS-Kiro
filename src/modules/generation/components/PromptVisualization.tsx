import React from 'react';
import { useGenerationStore } from '../../../store/generationStore';
import { useRetrievalStore } from '../../../store/retrievalStore';
import { PromptFlowVisualization } from '../../../visualization';

export const PromptVisualization: React.FC = () => {
  const { 
    promptConstruction, 
    generationResult, 
    selectedModel,
    isGenerating 
  } = useGenerationStore();
  
  const { 
    query, 
    searchResults 
  } = useRetrievalStore();

  // Get retrieved chunks from search results
  const retrievedChunks = searchResults.map(result => result.chunk);

  const handleStepHover = (step: string) => {
    // Optional: Add step-specific hover effects
    console.log('Hovering over step:', step);
  };

  const handleStepClick = (step: string) => {
    // Optional: Add step-specific interactions
    console.log('Clicked on step:', step);
  };

  return (
    <div className="w-full h-full">
      <PromptFlowVisualization
        query={query}
        retrievedChunks={retrievedChunks}
        constructedPrompt={promptConstruction?.prompt || ''}
        generatedResponse={generationResult?.response}
        onStepHover={handleStepHover}
        onStepClick={handleStepClick}
        config={{
          flowDirection: 'horizontal',
          nodeSize: 100,
          arrowSize: 10,
          animationDuration: 1200
        }}
      />
      
      {/* Additional generation details */}
      {isGenerating && (
        <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-blue-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
            <span className="text-sm font-medium">Generating with {selectedModel}...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVisualization;