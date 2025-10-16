import React, { useState } from 'react';
import { useTourStore } from '../../store/tourStore';
import { useRAGStore } from '../../store/ragStore';
import { Button } from '../UI/Button';

interface ConfigurationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({ isOpen, onClose }) => {
  const { 
    savedConfigurations, 
    saveConfiguration, 
    loadConfiguration, 
    deleteConfiguration, 
    generateShareUrl 
  } = useTourStore();
  
  const { 
    sampleText, 
    chunkingParameters, 
    searchParameters, 
    generationParameters 
  } = useRAGStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleSaveConfiguration = () => {
    if (!configName.trim()) return;

    const config = {
      name: configName,
      description: configDescription,
      parameters: {
        chunking: chunkingParameters,
        search: searchParameters,
        generation: generationParameters,
      },
      sampleText,
    };

    saveConfiguration(config);
    setConfigName('');
    setConfigDescription('');
    setShowSaveDialog(false);
  };

  const handleLoadConfiguration = (configId: string) => {
    loadConfiguration(configId);
    onClose();
  };

  const handleShareConfiguration = (configId: string) => {
    const url = generateShareUrl(configId);
    setShareUrl(url);
    setShowShareDialog(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuration Manager</h2>
            <p className="text-gray-600 mt-1">Save, load, and share your RAG pipeline configurations</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current configuration */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Configuration</h3>
              <Button
                variant="primary"
                onClick={() => setShowSaveDialog(true)}
              >
                Save Current Config
              </Button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Chunking</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>Strategy: {chunkingParameters.strategy}</li>
                    <li>Size: {chunkingParameters.chunkSize}</li>
                    <li>Overlap: {chunkingParameters.overlap}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Search</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>Mode: {searchParameters.mode}</li>
                    <li>Limit: {searchParameters.resultLimit}</li>
                    <li>Threshold: {searchParameters.similarityThreshold}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Generation</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>Temperature: {generationParameters.temperature}</li>
                    <li>Max Tokens: {generationParameters.maxTokens}</li>
                    <li>Context: {generationParameters.maxContextLength}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Saved configurations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Saved Configurations ({savedConfigurations.length})
            </h3>
            
            {savedConfigurations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <p>No saved configurations</p>
                <p className="text-sm">Save your current settings to reuse them later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedConfigurations.map((config) => (
                  <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{config.name}</h4>
                        {config.description && (
                          <p className="text-gray-600 text-sm mb-3">{config.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                          <div>
                            <span className="font-medium">Chunking:</span> {config.parameters.chunking.strategy}
                          </div>
                          <div>
                            <span className="font-medium">Search:</span> {config.parameters.search.mode}
                          </div>
                          <div>
                            <span className="font-medium">Saved:</span> {new Date(config.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadConfiguration(config.id)}
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShareConfiguration(config.id)}
                        >
                          Share
                        </Button>
                        <button
                          onClick={() => deleteConfiguration(config.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete configuration"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuration Name *
                </label>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="e.g., Customer Support Setup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={configDescription}
                  onChange={(e) => setConfigDescription(e.target.value)}
                  placeholder="Describe when to use this configuration..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveConfiguration}
                disabled={!configName.trim()}
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Share dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Share URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareUrl)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Anyone with this URL can load your configuration settings and sample text.
              </p>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                variant="primary"
                onClick={() => setShowShareDialog(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationManager;