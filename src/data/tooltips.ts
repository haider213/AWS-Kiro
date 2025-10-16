import { Tooltip } from '../types/tour';

export const tooltips: Tooltip[] = [
  // Chunking tooltips
  {
    id: 'chunk-size-tooltip',
    target: '[data-tooltip="chunk-size"]',
    title: 'Chunk Size',
    content: 'The maximum number of characters in each chunk. Larger chunks provide more context but may be less precise for retrieval.',
    position: 'top',
    trigger: 'hover',
    category: 'parameter'
  },
  {
    id: 'chunk-overlap-tooltip',
    target: '[data-tooltip="chunk-overlap"]',
    title: 'Chunk Overlap',
    content: 'The number of characters that overlap between consecutive chunks. Overlap helps maintain context continuity across chunk boundaries.',
    position: 'top',
    trigger: 'hover',
    category: 'parameter'
  },
  {
    id: 'chunking-strategy-tooltip',
    target: '[data-tooltip="chunking-strategy"]',
    title: 'Chunking Strategy',
    content: 'Different approaches to dividing text: Fixed-size uses character counts, Semantic preserves meaning, Sentence respects sentence boundaries, Paragraph follows paragraph structure.',
    position: 'right',
    trigger: 'hover',
    category: 'concept'
  },
  {
    id: 'similarity-threshold-tooltip',
    target: '[data-tooltip="similarity-threshold"]',
    title: 'Similarity Threshold',
    content: 'For semantic chunking, this determines how similar sentences must be to stay in the same chunk. Higher values create more cohesive chunks.',
    position: 'top',
    trigger: 'hover',
    category: 'parameter'
  },

  // Embedding tooltips
  {
    id: 'embedding-model-tooltip',
    target: '[data-tooltip="embedding-model"]',
    title: 'Embedding Model',
    content: 'Different models create different vector representations. Titan is general-purpose, Cohere models are optimized for specific languages.',
    position: 'top',
    trigger: 'hover',
    category: 'concept'
  },
  {
    id: 'dimensionality-reduction-tooltip',
    target: '[data-tooltip="dimensionality-reduction"]',
    title: 'Dimensionality Reduction',
    content: 'Converts high-dimensional embeddings (1536+ dimensions) to 2D/3D for visualization. t-SNE preserves local structure, UMAP preserves global structure.',
    position: 'left',
    trigger: 'hover',
    category: 'concept'
  },
  {
    id: 'similarity-score-tooltip',
    target: '[data-tooltip="similarity-score"]',
    title: 'Similarity Score',
    content: 'Cosine similarity between embedding vectors, ranging from -1 to 1. Higher scores indicate more similar content.',
    position: 'top',
    trigger: 'hover',
    category: 'result'
  },

  // Retrieval tooltips
  {
    id: 'search-mode-tooltip',
    target: '[data-tooltip="search-mode"]',
    title: 'Search Mode',
    content: 'Keyword: exact word matching, Semantic: meaning-based matching using embeddings, Hybrid: combines both approaches with weighted scoring.',
    position: 'bottom',
    trigger: 'hover',
    category: 'concept'
  },
  {
    id: 'result-limit-tooltip',
    target: '[data-tooltip="result-limit"]',
    title: 'Result Limit',
    content: 'Maximum number of chunks to retrieve. More results provide broader context but may include less relevant information.',
    position: 'top',
    trigger: 'hover',
    category: 'parameter'
  },
  {
    id: 'relevance-score-tooltip',
    target: '[data-tooltip="relevance-score"]',
    title: 'Relevance Score',
    content: 'Indicates how well a chunk matches the query. Scores are normalized between 0-1, with higher values indicating better matches.',
    position: 'left',
    trigger: 'hover',
    category: 'result'
  },
  {
    id: 'keyword-weight-tooltip',
    target: '[data-tooltip="keyword-weight"]',
    title: 'Keyword Weight',
    content: 'In hybrid search, this controls the importance of exact word matches vs. semantic similarity. Higher values favor keyword matching.',
    position: 'top',
    trigger: 'hover',
    category: 'parameter'
  },

  // Generation tooltips
  {
    id: 'temperature-tooltip',
    target: '[data-tooltip="temperature"]',
    title: 'Temperature',
    content: 'Controls randomness in generation. Lower values (0.1-0.3) are more focused and consistent, higher values (0.7-1.0) are more creative and varied.',
    position: 'top',
    trigger: 'hover',
    category: 'parameter'
  },
  {
    id: 'max-tokens-tooltip',
    target: '[data-tooltip="max-tokens"]',
    title: 'Max Tokens',
    content: 'Maximum length of the generated response. One token is roughly 3-4 characters in English.',
    position: 'top',
    trigger: 'hover',
    category: 'parameter'
  },
  {
    id: 'context-length-tooltip',
    target: '[data-tooltip="context-length"]',
    title: 'Context Length',
    content: 'Maximum number of characters from retrieved chunks to include in the prompt. Longer context provides more information but uses more tokens.',
    position: 'top',
    trigger: 'hover',
    category: 'parameter'
  },
  {
    id: 'context-strategy-tooltip',
    target: '[data-tooltip="context-strategy"]',
    title: 'Context Selection Strategy',
    content: 'How to choose which retrieved chunks to include: Top-k takes the highest scoring, Threshold includes all above a score, Diverse maximizes variety.',
    position: 'right',
    trigger: 'hover',
    category: 'concept'
  },

  // General UI tooltips
  {
    id: 'help-button-tooltip',
    target: '[data-tooltip="help-button"]',
    title: 'Help & Documentation',
    content: 'Access detailed explanations, examples, and troubleshooting guides for all RAG concepts and features.',
    position: 'bottom',
    trigger: 'hover',
    category: 'action'
  },
  {
    id: 'tour-button-tooltip',
    target: '[data-tooltip="tour-button"]',
    title: 'Guided Tour',
    content: 'Start an interactive walkthrough of the complete RAG pipeline with step-by-step instructions.',
    position: 'bottom',
    trigger: 'hover',
    category: 'action'
  },
  {
    id: 'save-config-tooltip',
    target: '[data-tooltip="save-config"]',
    title: 'Save Configuration',
    content: 'Save your current parameter settings and sample text to reuse later or share with others.',
    position: 'bottom',
    trigger: 'hover',
    category: 'action'
  }
];

export const getTooltipById = (id: string): Tooltip | undefined => {
  return tooltips.find(tooltip => tooltip.id === id);
};

export const getTooltipsByCategory = (category: Tooltip['category']): Tooltip[] => {
  return tooltips.filter(tooltip => tooltip.category === category);
};