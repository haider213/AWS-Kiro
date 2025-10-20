import React, { useState } from 'react'

interface DocumentChunk {
  id: string
  content: string
  word_count: number
  char_count: number
  strategy: string
  similarity_score?: number
  rank?: number
}

interface EvaluationResult {
  rating: number | null
  explanation: string
  raw_response: string
}

interface RAGEvaluation {
  relevance: EvaluationResult
  completeness: EvaluationResult
  answer_quality: EvaluationResult
  faithfulness: EvaluationResult
}

interface RetrievalEvaluation {
  relevance: EvaluationResult
  coverage: EvaluationResult
  diversity: EvaluationResult
  ranking: EvaluationResult
  overall: EvaluationResult
}

interface EvaluationPhaseProps {
  query: string
  retrievedChunks: DocumentChunk[]
  generatedResponse: string
  onEvaluateRAG: () => void
  onEvaluateRetrieval: () => void
  isProcessing: boolean
  ragEvaluation: RAGEvaluation | null
  retrievalEvaluation: RetrievalEvaluation | null
  overallScore: number | null
  evaluationSummary: string
}

const EvaluationPhase: React.FC<EvaluationPhaseProps> = ({
  query,
  retrievedChunks,
  generatedResponse,
  onEvaluateRAG,
  onEvaluateRetrieval,
  isProcessing,
  ragEvaluation,
  retrievalEvaluation,
  overallScore,
  evaluationSummary
}) => {
  const [activeTab, setActiveTab] = useState<'rag' | 'retrieval'>('rag')

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400'
    if (score >= 4.5) return 'text-green-600'
    if (score >= 3.5) return 'text-blue-600'
    if (score >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number | null) => {
    if (!score) return 'bg-gray-100'
    if (score >= 4.5) return 'bg-green-50'
    if (score >= 3.5) return 'bg-blue-50'
    if (score >= 2.5) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const renderEvaluationCard = (title: string, evaluation: EvaluationResult | undefined, icon: string) => {
    if (!evaluation) return null

    return (
      <div className={`p-4 rounded-lg border ${getScoreBg(evaluation.rating)}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{icon}</span>
            <h4 className="font-semibold text-gray-900">{title}</h4>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(evaluation.rating)}`}>
            {evaluation.rating ? `${evaluation.rating}/5` : 'N/A'}
          </div>
        </div>
        <p className="text-sm text-gray-700">{evaluation.explanation}</p>
      </div>
    )
  }

  if (!query || retrievedChunks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold">Phase 5: LLM-as-a-Judge Evaluation</h2>
        </div>
        <div className="p-6 text-center py-12">
          <div className="text-6xl mb-4">⚖️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results to Evaluate</h3>
          <p className="text-gray-600">Please complete the retrieval and generation phases first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold">Phase 5: LLM-as-a-Judge Evaluation</h2>
        <p className="text-green-100">Automated evaluation of RAG pipeline performance</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Evaluation Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('rag')}
            className={`pb-2 px-1 font-medium text-sm ${
              activeTab === 'rag'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎯 End-to-End RAG Evaluation
          </button>
          <button
            onClick={() => setActiveTab('retrieval')}
            className={`pb-2 px-1 font-medium text-sm ${
              activeTab === 'retrieval'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 Retrieval-Only Evaluation
          </button>
        </div>

        {/* RAG Evaluation Tab */}
        {activeTab === 'rag' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">End-to-End RAG Evaluation</h3>
              <p className="text-sm text-green-700 mb-4">
                Evaluates the complete RAG pipeline including retrieval quality, answer generation, and faithfulness to sources.
              </p>
              
              <button
                onClick={onEvaluateRAG}
                disabled={isProcessing || !generatedResponse}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isProcessing ? '⏳ Evaluating...' : '⚖️ Evaluate Complete RAG Pipeline'}
              </button>
              
              {!generatedResponse && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Please generate a response in Phase 4 first
                </p>
              )}
            </div>

            {/* Overall Score */}
            {overallScore !== null && (
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBg(overallScore)} border-4 ${overallScore >= 4 ? 'border-green-500' : overallScore >= 3 ? 'border-blue-500' : overallScore >= 2 ? 'border-yellow-500' : 'border-red-500'}`}>
                  <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore.toFixed(1)}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-2">Overall RAG Score</h3>
                <p className="text-sm text-gray-600">Average across all evaluation dimensions</p>
              </div>
            )}

            {/* RAG Evaluation Results */}
            {ragEvaluation && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEvaluationCard('Relevance', ragEvaluation.relevance, '🎯')}
                {renderEvaluationCard('Completeness', ragEvaluation.completeness, '📋')}
                {renderEvaluationCard('Answer Quality', ragEvaluation.answer_quality, '✨')}
                {renderEvaluationCard('Faithfulness', ragEvaluation.faithfulness, '🔒')}
              </div>
            )}

            {/* Evaluation Summary */}
            {evaluationSummary && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">📝</span>
                  Evaluation Summary
                </h4>
                <p className="text-sm text-gray-700">{evaluationSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* Retrieval Evaluation Tab */}
        {activeTab === 'retrieval' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Retrieval-Only Evaluation</h3>
              <p className="text-sm text-blue-700 mb-4">
                Evaluates just the information retrieval quality: relevance, coverage, diversity, and ranking of retrieved chunks.
              </p>
              
              <button
                onClick={onEvaluateRetrieval}
                disabled={isProcessing}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isProcessing ? '⏳ Evaluating...' : '🔍 Evaluate Retrieval Quality'}
              </button>
            </div>

            {/* Retrieval Evaluation Results */}
            {retrievalEvaluation && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderEvaluationCard('Relevance', retrievalEvaluation.relevance, '🎯')}
                  {renderEvaluationCard('Coverage', retrievalEvaluation.coverage, '📊')}
                  {renderEvaluationCard('Diversity', retrievalEvaluation.diversity, '🌈')}
                  {renderEvaluationCard('Ranking Quality', retrievalEvaluation.ranking, '📈')}
                </div>
                
                {/* Overall Retrieval Score */}
                {retrievalEvaluation.overall && (
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBg(retrievalEvaluation.overall.rating)} border-4 border-blue-500`}>
                      <div className={`text-2xl font-bold ${getScoreColor(retrievalEvaluation.overall.rating)}`}>
                        {retrievalEvaluation.overall.rating}/5
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mt-2">Overall Retrieval Score</h3>
                    <p className="text-sm text-gray-600">{retrievalEvaluation.overall.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Evaluation Criteria */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">📚</span>
            Evaluation Criteria
          </h4>
          
          {activeTab === 'rag' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-800 mb-1">🎯 Relevance</h5>
                <p className="text-gray-600">How well retrieved chunks match the query</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">📋 Completeness</h5>
                <p className="text-gray-600">Whether chunks contain sufficient information</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">✨ Answer Quality</h5>
                <p className="text-gray-600">Accuracy, clarity, and completeness of generated response</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">🔒 Faithfulness</h5>
                <p className="text-gray-600">Whether answer stays true to source context (no hallucination)</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-800 mb-1">🎯 Relevance</h5>
                <p className="text-gray-600">How relevant chunks are to the query</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">📊 Coverage</h5>
                <p className="text-gray-600">Whether key aspects are covered</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">🌈 Diversity</h5>
                <p className="text-gray-600">Variety of perspectives, avoiding redundancy</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">📈 Ranking Quality</h5>
                <p className="text-gray-600">Whether most relevant chunks are ranked higher</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EvaluationPhase