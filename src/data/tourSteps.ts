import { TourStep } from '../types/tour';

export const tourSteps: TourStep[] = [
  // Overview steps
  {
    id: 'welcome',
    title: 'Welcome to RAG Pipeline Educator',
    content: 'This interactive tool will guide you through the complete Retrieval-Augmented Generation (RAG) pipeline. You\'ll learn how text is processed, embedded, searched, and used to generate responses.',
    target: 'body',
    position: 'center',
    module: 'overview',
    order: 1,
  },
  {
    id: 'navigation-overview',
    title: 'Pipeline Navigation',
    content: 'The RAG pipeline consists of four main stages. Each module builds on the previous one, so we recommend following the sequence: Chunking → Embedding → Retrieval → Generation.',
    target: '[data-tour="navigation"]',
    position: 'bottom',
    module: 'overview',
    order: 2,
  },
  {
    id: 'sample-text-intro',
    title: 'Sample Text',
    content: 'We\'ll use the same sample text throughout all modules to demonstrate how data flows through the RAG pipeline. You can modify this text to experiment with different content.',
    target: '[data-tour="sample-text"]',
    position: 'top',
    module: 'overview',
    order: 3,
  },

  // Chunking module steps
  {
    id: 'chunking-intro',
    title: 'Text Chunking',
    content: 'Chunking breaks down large text into smaller, manageable pieces. This is crucial for RAG systems because it allows for more precise retrieval and fits within model context limits.',
    target: '[data-tour="chunking-module"]',
    position: 'top',
    module: 'chunking',
    order: 4,
  },
  {
    id: 'chunking-strategy',
    title: 'Chunking Strategies',
    content: 'Different strategies work better for different types of content. Fixed-size is simple and consistent, while semantic chunking preserves meaning by keeping related sentences together.',
    target: '[data-tour="chunking-strategy"]',
    position: 'right',
    module: 'chunking',
    order: 5,
  },
  {
    id: 'chunking-parameters',
    title: 'Chunking Parameters',
    content: 'Adjust chunk size and overlap to see how they affect the segmentation. Larger chunks provide more context but may be less precise. Overlap helps maintain continuity between chunks.',
    target: '[data-tour="chunking-parameters"]',
    position: 'left',
    module: 'chunking',
    order: 6,
    actions: [
      { type: 'input', target: '[data-tour="chunk-size"]', value: '150' },
      { type: 'wait', delay: 1000 }
    ]
  },
  {
    id: 'chunking-visualization',
    title: 'Chunk Visualization',
    content: 'The visualization shows how your text is divided into chunks. Each color represents a different chunk, and you can see the boundaries and overlap regions.',
    target: '[data-tour="chunking-visualization"]',
    position: 'top',
    module: 'chunking',
    order: 7,
  },
  {
    id: 'chunking-metrics',
    title: 'Chunking Metrics',
    content: 'These metrics help you understand the effectiveness of your chunking strategy. Monitor chunk count, average size, and overlap to optimize for your use case.',
    target: '[data-tour="chunking-metrics"]',
    position: 'left',
    module: 'chunking',
    order: 8,
  },

  // Embedding module steps
  {
    id: 'embedding-intro',
    title: 'Vector Embeddings',
    content: 'Embeddings convert text chunks into numerical vectors that capture semantic meaning. Similar chunks will have similar vectors, enabling semantic search.',
    target: '[data-tour="embedding-module"]',
    position: 'top',
    module: 'embedding',
    order: 9,
    prerequisites: ['chunking-metrics']
  },
  {
    id: 'embedding-generation',
    title: 'Generate Embeddings',
    content: 'Click to generate embeddings for your chunks using AWS Bedrock. This process converts each text chunk into a high-dimensional vector representation.',
    target: '[data-tour="generate-embeddings"]',
    position: 'bottom',
    module: 'embedding',
    order: 10,
    actions: [
      { type: 'click', target: '[data-tour="generate-embeddings"]' },
      { type: 'wait', delay: 3000 }
    ]
  },
  {
    id: 'embedding-visualization',
    title: 'Vector Space Visualization',
    content: 'This 2D projection shows how your chunks are positioned in vector space. Chunks with similar content appear closer together. Hover over points to see the original text.',
    target: '[data-tour="embedding-visualization"]',
    position: 'top',
    module: 'embedding',
    order: 11,
  },
  {
    id: 'similarity-controls',
    title: 'Similarity Controls',
    content: 'Adjust the similarity threshold to highlight connections between related chunks. This helps you understand which chunks are semantically similar.',
    target: '[data-tour="similarity-controls"]',
    position: 'right',
    module: 'embedding',
    order: 12,
  },

  // Retrieval module steps
  {
    id: 'retrieval-intro',
    title: 'Information Retrieval',
    content: 'Retrieval finds the most relevant chunks for a given query. You can use keyword search, semantic search, or a hybrid approach combining both.',
    target: '[data-tour="retrieval-module"]',
    position: 'top',
    module: 'retrieval',
    order: 13,
    prerequisites: ['embedding-visualization']
  },
  {
    id: 'search-query',
    title: 'Search Query',
    content: 'Enter a question or topic you want to search for. Try asking about concepts mentioned in the sample text to see how retrieval works.',
    target: '[data-tour="search-query"]',
    position: 'bottom',
    module: 'retrieval',
    order: 14,
    actions: [
      { type: 'input', target: '[data-tour="search-query"]', value: 'What is machine learning?' },
      { type: 'wait', delay: 1000 }
    ]
  },
  {
    id: 'search-modes',
    title: 'Search Modes',
    content: 'Keyword search looks for exact word matches, semantic search finds conceptually similar content, and hybrid combines both approaches for better results.',
    target: '[data-tour="search-modes"]',
    position: 'left',
    module: 'retrieval',
    order: 15,
  },
  {
    id: 'search-results',
    title: 'Search Results',
    content: 'Results are ranked by relevance score. Higher scores indicate better matches. The visualization highlights matching chunks and shows why they were selected.',
    target: '[data-tour="search-results"]',
    position: 'right',
    module: 'retrieval',
    order: 16,
  },

  // Generation module steps
  {
    id: 'generation-intro',
    title: 'Response Generation',
    content: 'The final stage uses retrieved chunks as context to generate informed responses. This is where the "Augmented" part of RAG happens.',
    target: '[data-tour="generation-module"]',
    position: 'top',
    module: 'generation',
    order: 17,
    prerequisites: ['search-results']
  },
  {
    id: 'prompt-construction',
    title: 'Prompt Construction',
    content: 'See how your query and retrieved chunks are combined into a prompt for the language model. The context provides relevant information for generating accurate responses.',
    target: '[data-tour="prompt-construction"]',
    position: 'left',
    module: 'generation',
    order: 18,
  },
  {
    id: 'generation-parameters',
    title: 'Generation Parameters',
    content: 'Adjust temperature for creativity vs. consistency, and context length to control how much retrieved information is used in the response.',
    target: '[data-tour="generation-parameters"]',
    position: 'right',
    module: 'generation',
    order: 19,
  },
  {
    id: 'generate-response',
    title: 'Generate Response',
    content: 'Click to generate a response using the constructed prompt. Compare responses with different parameters to see how they affect the output quality.',
    target: '[data-tour="generate-response"]',
    position: 'bottom',
    module: 'generation',
    order: 20,
    actions: [
      { type: 'click', target: '[data-tour="generate-response"]' },
      { type: 'wait', delay: 3000 }
    ]
  },

  // Completion
  {
    id: 'tour-complete',
    title: 'Congratulations!',
    content: 'You\'ve completed the RAG pipeline tour! You now understand how text chunking, embeddings, retrieval, and generation work together. Continue experimenting with different parameters and text samples.',
    target: 'body',
    position: 'center',
    module: 'overview',
    order: 21,
    prerequisites: ['generate-response']
  }
];

export const getStepsForModule = (module: string): TourStep[] => {
  return tourSteps.filter(step => step.module === module);
};

export const getNextStep = (currentStepId: string): TourStep | null => {
  const currentStep = tourSteps.find(step => step.id === currentStepId);
  if (!currentStep) return null;
  
  return tourSteps.find(step => step.order === currentStep.order + 1) || null;
};

export const getPreviousStep = (currentStepId: string): TourStep | null => {
  const currentStep = tourSteps.find(step => step.id === currentStepId);
  if (!currentStep) return null;
  
  return tourSteps.find(step => step.order === currentStep.order - 1) || null;
};