import React, { useState } from 'react';
import { useTourStore } from '../../store/tourStore';
import { Button } from '../UI/Button';
import { HelpPanel } from './HelpPanel';
import { ConfigurationManager } from './ConfigurationManager';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

export const TourControls: React.FC = () => {
  const { 
    tourProgress, 
    showTooltips, 
    startTour, 
    stopTour, 
    toggleTooltips, 
    toggleHelpPanel 
  } = useTourStore();
  
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { shortcuts } = useKeyboardNavigation();

  return (
    <>
      {/* Tour controls bar */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col space-y-2">
        {/* Main controls */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center space-x-2">
          {/* Tour button */}
          <Button
            variant={tourProgress.isActive ? "secondary" : "primary"}
            size="sm"
            onClick={tourProgress.isActive ? stopTour : startTour}
            data-tooltip="tour-button"
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={tourProgress.isActive 
                  ? "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                } 
              />
            </svg>
            <span className="hidden sm:inline">
              {tourProgress.isActive ? 'Stop Tour' : 'Start Tour'}
            </span>
          </Button>

          {/* Tooltips toggle */}
          <Button
            variant={showTooltips ? "secondary" : "outline"}
            size="sm"
            onClick={toggleTooltips}
            data-tooltip="tooltips-toggle"
            title="Toggle tooltips (i)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </Button>

          {/* Help button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHelpPanel}
            data-tooltip="help-button"
            title="Help & Documentation (h)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </Button>

          {/* Configuration manager */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigManager(true)}
            data-tooltip="save-config"
            title="Save & Share Configurations"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
              />
            </svg>
          </Button>

          {/* Keyboard shortcuts */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" 
              />
            </svg>
          </Button>
        </div>

        {/* Tour progress indicator */}
        {tourProgress.isActive && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Tour Progress</span>
              <span>{tourProgress.completedSteps.length + 1} / {21}</span>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((tourProgress.completedSteps.length + 1) / 21) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Help panel */}
      <HelpPanel />

      {/* Configuration manager */}
      <ConfigurationManager 
        isOpen={showConfigManager}
        onClose={() => setShowConfigManager(false)}
      />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Module navigation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Module Navigation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shortcuts.filter(s => ['1', '2', '3', '4'].includes(s.key)).map((shortcut) => (
                      <div key={shortcut.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tour controls */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tour Controls</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shortcuts.filter(s => ['t', 'ArrowRight', 'ArrowLeft', 'Escape'].includes(s.key)).map((shortcut) => (
                      <div key={shortcut.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                          {shortcut.shiftKey && 'Shift + '}
                          {shortcut.ctrlKey && 'Ctrl + '}
                          {shortcut.altKey && 'Alt + '}
                          {shortcut.key === 'ArrowRight' ? '→' : 
                           shortcut.key === 'ArrowLeft' ? '←' : 
                           shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Help and utilities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Help & Utilities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shortcuts.filter(s => ['h', '?', 'i'].includes(s.key)).map((shortcut) => (
                      <div key={shortcut.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                          {shortcut.shiftKey && 'Shift + '}
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced shortcuts */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Advanced</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shortcuts.filter(s => s.ctrlKey).map((shortcut) => (
                      <div key={shortcut.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                          Ctrl + {shortcut.key.toUpperCase()}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Keyboard shortcuts work when you're not typing in input fields. 
                  Use Tab to navigate between interactive elements and Enter to activate buttons.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TourControls;