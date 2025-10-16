import React, { useState, useMemo } from 'react';
import { useTourStore } from '../../store/tourStore';
import { helpArticles, searchArticles, getArticlesByCategory } from '../../data/helpArticles';
import { Button } from '../UI/Button';

export const HelpPanel: React.FC = () => {
  const { 
    showHelpPanel, 
    helpSearchQuery, 
    toggleHelpPanel, 
    setHelpSearchQuery 
  } = useTourStore();
  
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredArticles = useMemo(() => {
    let articles = helpArticles;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      articles = getArticlesByCategory(selectedCategory as any);
    }
    
    // Filter by search query
    if (helpSearchQuery.trim()) {
      articles = searchArticles(helpSearchQuery);
    }
    
    return articles;
  }, [helpSearchQuery, selectedCategory]);

  const selectedArticleData = useMemo(() => {
    return helpArticles.find(article => article.id === selectedArticle);
  }, [selectedArticle]);

  const categories = [
    { id: 'all', label: 'All Topics', count: helpArticles.length },
    { id: 'concepts', label: 'Concepts', count: getArticlesByCategory('concepts').length },
    { id: 'parameters', label: 'Parameters', count: getArticlesByCategory('parameters').length },
    { id: 'examples', label: 'Examples', count: getArticlesByCategory('examples').length },
    { id: 'troubleshooting', label: 'Troubleshooting', count: getArticlesByCategory('troubleshooting').length },
  ];

  if (!showHelpPanel) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Help & Documentation</h2>
            <p className="text-gray-600 mt-1">Learn about RAG concepts, parameters, and best practices</p>
          </div>
          <button
            onClick={toggleHelpPanel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={helpSearchQuery}
                  onChange={(e) => setHelpSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg 
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category.label}</span>
                      <span className="text-xs text-gray-500">{category.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Article list */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Articles {helpSearchQuery && `(${filteredArticles.length} results)`}
              </h3>
              <div className="space-y-2">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedArticle === article.id
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm mb-1">
                      {article.title}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        article.category === 'concepts' ? 'bg-blue-100 text-blue-800' :
                        article.category === 'parameters' ? 'bg-green-100 text-green-800' :
                        article.category === 'examples' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {article.category}
                      </span>
                    </div>
                  </button>
                ))}
                
                {filteredArticles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                    </svg>
                    <p>No articles found</p>
                    <p className="text-sm">Try adjusting your search or category filter</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col">
            {selectedArticleData ? (
              <>
                {/* Article header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedArticleData.title}
                      </h1>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedArticleData.category === 'concepts' ? 'bg-blue-100 text-blue-800' :
                          selectedArticleData.category === 'parameters' ? 'bg-green-100 text-green-800' :
                          selectedArticleData.category === 'examples' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {selectedArticleData.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose prose-gray max-w-none">
                    <div 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: selectedArticleData.content
                          .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                          .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
                          .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
                          .replace(/^\*\*(.+)\*\*:/gm, '<strong>$1:</strong>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                          .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto"><code>$1</code></pre>')
                      }}
                    />
                  </div>

                  {/* Related articles */}
                  {selectedArticleData.relatedArticles && selectedArticleData.relatedArticles.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Related Articles</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedArticleData.relatedArticles.map((relatedId) => {
                          const relatedArticle = helpArticles.find(a => a.id === relatedId);
                          if (!relatedArticle) return null;
                          
                          return (
                            <button
                              key={relatedId}
                              onClick={() => setSelectedArticle(relatedId)}
                              className="text-left p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-gray-900 text-sm">
                                {relatedArticle.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {relatedArticle.category}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Welcome screen */
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <svg className="w-16 h-16 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Welcome to RAG Help
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select an article from the sidebar to learn about RAG concepts, parameters, and best practices.
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      onClick={() => setSelectedArticle('what-is-rag')}
                    >
                      Start with RAG Overview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCategory('examples')}
                    >
                      Browse Examples
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;