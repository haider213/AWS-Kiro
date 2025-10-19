import React, { useState } from 'react'
import FullRAGWorkflow from './components/FullRAGWorkflow'
import RAGEvaluationBuilder from './components/RAGEvaluationBuilder'

function SimpleApp() {
  const [currentView, setCurrentView] = useState<'workflow' | 'evaluation'>('workflow')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">RAG Pipeline Educator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('workflow')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  currentView === 'workflow'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🚀 RAG Workflow
              </button>
              <button
                onClick={() => setCurrentView('evaluation')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  currentView === 'evaluation'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🧪 RAG Evaluation
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentView === 'workflow' && <FullRAGWorkflow />}
          {currentView === 'evaluation' && <RAGEvaluationBuilder />}
        </div>
      </main>
    </div>
  )
}

export default SimpleApp