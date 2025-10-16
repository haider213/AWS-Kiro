import React, { Suspense, useEffect, useState } from 'react'
import { useRAGStore } from './store/ragStore'
import { useTourStore } from './store/tourStore'
import { MainLayout } from './components/Layout/MainLayout'
import { LoadingSpinner } from './components/UI/LoadingSpinner'
import { ErrorBoundary } from './components/UI/ErrorBoundary'
import { SampleTextManager } from './components/Layout/SampleTextManager'
import { ParameterPropagation } from './components/Layout/ParameterPropagation'
import { TourOverlay } from './components/Tour/TourOverlay'
import { TooltipProvider } from './components/Tour/TooltipProvider'
import { TourControls } from './components/Tour/TourControls'
import { PerformanceDashboard } from './components/Performance/PerformanceDashboard'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { tourSteps } from './data/tourSteps'
import { offlineManager } from './services/offlineManager'
import { concurrencyManager } from './services/concurrencyManager'

// Direct imports instead of lazy loading to debug
import ChunkingModule from './modules/chunking/ChunkingModule'
import EmbeddingModule from './modules/embedding/EmbeddingModule'
import RetrievalModule from './modules/retrieval/RetrievalModule'
import GenerationModule from './modules/generation/GenerationModule'

function App() {
  const { currentModule, isLoading, error, setError } = useRAGStore()
  const tourStore = useTourStore()
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)
  
  // Initialize keyboard navigation
  useKeyboardNavigation()

  // Initialize tour steps
  useEffect(() => {
    tourStore.setAvailableSteps(tourSteps);
  }, [])

  // Initialize offline support and performance monitoring
  useEffect(() => {
    const initializeServices = () => {
      try {
        // Simplified initialization - skip offline manager for now
        console.log('Initializing services...');
        
        // Register user session for concurrency management
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        concurrencyManager.registerUser(userId);

        // Cleanup on unmount
        return () => {
          concurrencyManager.unregisterUser(userId);
        };
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, [])

  // Clear errors when switching modules
  useEffect(() => {
    if (error) {
      setError(null)
    }
  }, [currentModule, error, setError])

  const renderCurrentModule = () => {
    switch (currentModule) {
      case 'chunking':
        return <ChunkingModule key={currentModule} />
      case 'embedding':
        return <EmbeddingModule key={currentModule} />
      case 'retrieval':
        return <RetrievalModule key={currentModule} />
      case 'generation':
        return <GenerationModule key={currentModule} />
      default:
        return <WelcomeScreen />
    }
  }

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Offline Notice */}
          {showOfflineNotice && (
            <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center z-50">
              <p className="text-sm">
                You're now offline. The app will continue to work with cached data.
              </p>
            </div>
          )}
          
          <MainLayout>
            {/* Global loading overlay */}
            {isLoading && <GlobalLoadingOverlay />}
            
            {/* Sample text manager - handles consistent text across modules */}
            <SampleTextManager />
            
            {/* Parameter propagation system */}
            <ParameterPropagation />
            
            {/* Main content area */}
            <main id="main-content" className="flex-1 overflow-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {renderCurrentModule()}
              </div>
            </main>
          </MainLayout>
          
          {/* Tour system */}
          <TourOverlay />
          <TourControls />
          
          {/* Performance Dashboard */}
          <PerformanceDashboard 
            isVisible={showPerformanceDashboard}
            onClose={() => setShowPerformanceDashboard(false)}
          />
          
          {/* Offline Indicator */}
          {isOffline && (
            <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg z-40">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Offline Mode</span>
              </div>
            </div>
          )}
          
          {/* Performance Dashboard Toggle Button */}
          <button
            onClick={() => setShowPerformanceDashboard(true)}
            className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
            title="Open Performance Dashboard"
          >
            📊
          </button>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

// Loading fallback for lazy-loaded modules
const ModuleLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600">Loading module...</p>
    </div>
  </div>
)

// Global loading overlay
const GlobalLoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 shadow-xl">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Processing...</p>
      </div>
    </div>
  </div>
)

// Welcome screen component
const WelcomeScreen: React.FC = () => {
  const { setCurrentModule } = useRAGStore()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to RAG Pipeline Educator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Learn Retrieval-Augmented Generation through interactive experimentation
        </p>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg" data-tour="sample-text">
          <p className="text-lg">
            Explore each stage of the RAG pipeline with hands-on controls and real-time visualizations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {[
          {
            id: 'chunking' as const,
            title: 'Text Chunking',
            description: 'Learn how to segment text into meaningful chunks with different strategies',
            icon: '📝',
            color: 'blue'
          },
          {
            id: 'embedding' as const,
            title: 'Vector Embeddings',
            description: 'Visualize how text is converted into vector representations',
            icon: '🔢',
            color: 'green'
          },
          {
            id: 'retrieval' as const,
            title: 'Information Retrieval',
            description: 'Experiment with search algorithms and similarity matching',
            icon: '🔍',
            color: 'purple'
          },
          {
            id: 'generation' as const,
            title: 'Response Generation',
            description: 'See how retrieved context enhances AI response quality',
            icon: '🤖',
            color: 'orange'
          }
        ].map((module) => (
          <button
            key={module.id}
            onClick={() => setCurrentModule(module.id)}
            className={`p-6 bg-white rounded-xl shadow-sm border-2 border-transparent hover:border-${module.color}-200 hover:shadow-md transition-all duration-200 text-left group`}
          >
            <div className="flex items-start space-x-4">
              <div className="text-3xl">{module.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                  {module.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {module.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How to Use This Application
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 font-bold">1.</span>
            <span className="text-gray-700">Start with chunking to understand text segmentation</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-500 font-bold">2.</span>
            <span className="text-gray-700">Explore embeddings to see vector representations</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-500 font-bold">3.</span>
            <span className="text-gray-700">Test retrieval and generation with your own queries</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App