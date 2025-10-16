import { HelpArticle } from '../types/tour';

export const helpArticles: HelpArticle[] = [
  // Concepts
  {
    id: 'what-is-rag',
    title: 'What is Retrieval-Augmented Generation (RAG)?',
    category: 'concepts',
    content: `
# What is RAG?

Retrieval-Augmented Generation (RAG) is a technique that enhances large language models by providing them with relevant external information during response generation.

## How RAG Works

1. **Document Processing**: Large documents are broken into smaller chunks
2. **Embedding Generation**: Each chunk is converted into a vector representation
3. **Query Processing**: User queries are also converted to embeddings
4. **Retrieval**: The most relevant chunks are found using similarity search
5. **Generation**: The language model generates a response using the retrieved context

## Benefits of RAG

- **Accuracy**: Responses are grounded in specific source material
- **Freshness**: Can incorporate up-to-date information not in training data
- **Transparency**: Sources can be cited and verified
- **Efficiency**: More cost-effective than fine-tuning for domain-specific knowledge

## Use Cases

- Question answering over documents
- Customer support with knowledge bases
- Research assistance
- Content summarization with source attribution
    `,
    searchKeywords: ['rag', 'retrieval', 'augmented', 'generation', 'overview', 'introduction'],
    relatedArticles: ['chunking-strategies', 'embedding-models', 'search-algorithms']
  },

  {
    id: 'chunking-strategies',
    title: 'Text Chunking Strategies',
    category: 'concepts',
    content: `
# Text Chunking Strategies

Chunking divides large texts into smaller, manageable pieces for processing and retrieval.

## Fixed-Size Chunking

**How it works**: Splits text into chunks of a fixed character or token count.

**Pros**:
- Simple and predictable
- Consistent chunk sizes
- Fast processing

**Cons**:
- May break sentences or concepts
- Context boundaries can be arbitrary

**Best for**: Technical documents, code, structured content

## Semantic Chunking

**How it works**: Groups sentences based on semantic similarity, keeping related content together.

**Pros**:
- Preserves meaning and context
- More coherent chunks
- Better retrieval accuracy

**Cons**:
- Variable chunk sizes
- More computationally expensive
- Requires embedding model

**Best for**: Narrative text, articles, educational content

## Sentence-Based Chunking

**How it works**: Respects sentence boundaries while maintaining target chunk sizes.

**Pros**:
- Preserves sentence integrity
- Good balance of size and meaning
- Readable chunks

**Cons**:
- Variable sizes
- May not capture larger concepts

**Best for**: General text processing, mixed content types

## Paragraph-Based Chunking

**How it works**: Uses paragraph breaks as natural chunk boundaries.

**Pros**:
- Follows document structure
- Preserves author's organization
- Maintains topic coherence

**Cons**:
- Highly variable sizes
- May create very large or small chunks

**Best for**: Well-structured documents, academic papers, reports

## Choosing the Right Strategy

Consider these factors:
- **Content type**: Technical vs. narrative
- **Document structure**: Formal vs. informal
- **Retrieval goals**: Precision vs. context
- **Processing constraints**: Speed vs. quality
    `,
    searchKeywords: ['chunking', 'splitting', 'segmentation', 'fixed-size', 'semantic', 'sentence', 'paragraph'],
    relatedArticles: ['what-is-rag', 'chunk-size-optimization']
  },

  {
    id: 'embedding-models',
    title: 'Understanding Embedding Models',
    category: 'concepts',
    content: `
# Understanding Embedding Models

Embeddings convert text into numerical vectors that capture semantic meaning.

## How Embeddings Work

Embedding models are neural networks trained to map text to high-dimensional vectors where similar meanings have similar vector representations.

## Available Models

### Amazon Titan Embed Text v1
- **Dimensions**: 1536
- **Strengths**: General-purpose, good performance across domains
- **Best for**: Mixed content, general applications

### Cohere Embed English v3
- **Dimensions**: 1024
- **Strengths**: Optimized for English text, high accuracy
- **Best for**: English-only applications, high precision needs

### Cohere Embed Multilingual v3
- **Dimensions**: 1024
- **Strengths**: Supports 100+ languages, cross-lingual retrieval
- **Best for**: Multilingual content, international applications

## Key Concepts

### Cosine Similarity
Measures the angle between two vectors, ranging from -1 to 1:
- **1.0**: Identical meaning
- **0.8-0.9**: Very similar
- **0.6-0.8**: Somewhat similar
- **< 0.6**: Different topics

### Dimensionality
Higher dimensions can capture more nuanced relationships but:
- Require more storage and computation
- May suffer from "curse of dimensionality"
- Need more data for effective training

## Best Practices

1. **Consistent Models**: Use the same model for indexing and querying
2. **Domain Matching**: Choose models trained on similar content
3. **Batch Processing**: Generate embeddings in batches for efficiency
4. **Caching**: Store embeddings to avoid regeneration
    `,
    searchKeywords: ['embeddings', 'vectors', 'titan', 'cohere', 'similarity', 'cosine', 'dimensions'],
    relatedArticles: ['what-is-rag', 'search-algorithms', 'similarity-search']
  },

  {
    id: 'search-algorithms',
    title: 'Search and Retrieval Algorithms',
    category: 'concepts',
    content: `
# Search and Retrieval Algorithms

Different search methods find relevant information in different ways.

## Keyword Search

**How it works**: Matches exact words or phrases in the query with document text.

**Algorithms**:
- **TF-IDF**: Term frequency × inverse document frequency
- **BM25**: Improved version of TF-IDF with better normalization
- **Boolean**: Exact phrase and operator matching

**Strengths**:
- Fast and efficient
- Precise for specific terms
- Transparent results

**Weaknesses**:
- Misses synonyms and related concepts
- Sensitive to exact wording
- Poor with typos or variations

## Semantic Search

**How it works**: Uses embedding similarity to find conceptually related content.

**Process**:
1. Convert query to embedding vector
2. Calculate similarity with all document embeddings
3. Rank by similarity score
4. Return top matches

**Strengths**:
- Finds conceptually similar content
- Handles synonyms and paraphrasing
- Works across languages (with multilingual models)

**Weaknesses**:
- May miss exact term matches
- Less transparent reasoning
- Requires embedding computation

## Hybrid Search

**How it works**: Combines keyword and semantic search with weighted scoring.

**Scoring Formula**:
\`\`\`
Final Score = (keyword_weight * keyword_score) + (semantic_weight * semantic_score)
\`\`\`

**Benefits**:
- Best of both approaches
- Tunable for different use cases
- More robust results

**Configuration Tips**:
- **High keyword weight (0.7-0.8)**: For technical, exact-match content
- **High semantic weight (0.7-0.8)**: For conceptual, narrative content
- **Balanced (0.5-0.5)**: For mixed content types

## Optimization Strategies

### Result Ranking
- **Diversity**: Avoid too many similar results
- **Recency**: Weight newer content higher
- **Authority**: Consider source credibility
- **User Context**: Personalize based on history

### Performance
- **Indexing**: Pre-compute embeddings and keyword indices
- **Caching**: Store frequent query results
- **Filtering**: Apply constraints before similarity calculation
- **Approximation**: Use approximate nearest neighbor for speed
    `,
    searchKeywords: ['search', 'retrieval', 'keyword', 'semantic', 'hybrid', 'tf-idf', 'bm25', 'similarity'],
    relatedArticles: ['embedding-models', 'similarity-search', 'result-ranking']
  },

  // Parameters
  {
    id: 'chunk-size-optimization',
    title: 'Optimizing Chunk Size and Overlap',
    category: 'parameters',
    content: `
# Optimizing Chunk Size and Overlap

Finding the right chunk size and overlap is crucial for effective RAG performance.

## Chunk Size Guidelines

### Small Chunks (50-150 characters)
**Pros**: Precise retrieval, focused context
**Cons**: May lack sufficient context
**Best for**: Fact lookup, specific data retrieval

### Medium Chunks (150-500 characters)
**Pros**: Good balance of precision and context
**Cons**: May still break important concepts
**Best for**: General Q&A, mixed content

### Large Chunks (500-1500 characters)
**Pros**: Rich context, complete concepts
**Cons**: May include irrelevant information
**Best for**: Complex reasoning, detailed explanations

## Overlap Considerations

### No Overlap (0%)
- Fastest processing
- Risk of losing context at boundaries
- Good for well-structured content

### Light Overlap (10-20%)
- Minimal redundancy
- Some boundary protection
- Good default choice

### Heavy Overlap (30-50%)
- Maximum context preservation
- Increased storage and processing
- Good for critical applications

## Optimization Process

1. **Start with defaults**: 200 characters, 20% overlap
2. **Test with sample queries**: Measure retrieval accuracy
3. **Analyze failure cases**: Where does retrieval fail?
4. **Adjust iteratively**: Increase size for context, decrease for precision
5. **Monitor performance**: Track speed and accuracy metrics

## Domain-Specific Recommendations

### Technical Documentation
- **Size**: 300-500 characters
- **Overlap**: 15-25%
- **Strategy**: Sentence-based

### Legal Documents
- **Size**: 500-800 characters
- **Overlap**: 25-35%
- **Strategy**: Paragraph-based

### News Articles
- **Size**: 200-400 characters
- **Overlap**: 20-30%
- **Strategy**: Semantic

### Code Documentation
- **Size**: 150-300 characters
- **Overlap**: 10-20%
- **Strategy**: Fixed-size
    `,
    searchKeywords: ['chunk size', 'overlap', 'optimization', 'parameters', 'tuning'],
    relatedArticles: ['chunking-strategies', 'performance-tuning']
  },

  // Examples
  {
    id: 'example-configurations',
    title: 'Example Configurations for Different Use Cases',
    category: 'examples',
    content: `
# Example Configurations

Here are proven configurations for common RAG use cases.

## Customer Support Knowledge Base

**Scenario**: Answering customer questions from support documentation

**Configuration**:
- **Chunking**: Sentence-based, 250 characters, 20% overlap
- **Embedding**: Cohere English v3 (high accuracy)
- **Search**: Hybrid (0.4 keyword, 0.6 semantic)
- **Generation**: Temperature 0.3, 800 max tokens

**Why this works**:
- Sentence boundaries preserve complete thoughts
- Hybrid search catches both exact terms and concepts
- Low temperature ensures consistent, reliable answers

## Research Assistant

**Scenario**: Helping researchers find relevant academic information

**Configuration**:
- **Chunking**: Semantic, 400 characters, 30% overlap
- **Embedding**: Titan (general purpose, good for academic text)
- **Search**: Semantic (0.8 semantic, 0.2 keyword)
- **Generation**: Temperature 0.5, 1200 max tokens

**Why this works**:
- Semantic chunking preserves research concepts
- High semantic weight finds conceptually related work
- Moderate temperature balances accuracy with insight

## Technical Documentation

**Scenario**: Code documentation and API references

**Configuration**:
- **Chunking**: Fixed-size, 200 characters, 15% overlap
- **Embedding**: Cohere English v3 (precise matching)
- **Search**: Keyword-heavy (0.7 keyword, 0.3 semantic)
- **Generation**: Temperature 0.2, 600 max tokens

**Why this works**:
- Fixed chunks work well with structured content
- Keyword search finds exact API names and functions
- Low temperature ensures accurate technical details

## Educational Content

**Scenario**: Interactive learning and concept explanation

**Configuration**:
- **Chunking**: Paragraph-based, 350 characters, 25% overlap
- **Embedding**: Titan (good for explanatory text)
- **Search**: Balanced hybrid (0.5 keyword, 0.5 semantic)
- **Generation**: Temperature 0.6, 1000 max tokens

**Why this works**:
- Paragraph chunks maintain instructional flow
- Balanced search finds both specific terms and related concepts
- Higher temperature allows for engaging explanations

## Multilingual Support

**Scenario**: Supporting multiple languages in one system

**Configuration**:
- **Chunking**: Sentence-based, 300 characters, 25% overlap
- **Embedding**: Cohere Multilingual v3
- **Search**: Semantic-heavy (0.2 keyword, 0.8 semantic)
- **Generation**: Temperature 0.4, 900 max tokens

**Why this works**:
- Sentence chunking works across languages
- Multilingual embeddings enable cross-language retrieval
- Semantic search handles language variations better
    `,
    searchKeywords: ['examples', 'configurations', 'use cases', 'customer support', 'research', 'technical', 'education'],
    relatedArticles: ['chunk-size-optimization', 'search-algorithms', 'performance-tuning']
  },

  // Troubleshooting
  {
    id: 'common-issues',
    title: 'Common Issues and Solutions',
    category: 'troubleshooting',
    content: `
# Common Issues and Solutions

Troubleshooting guide for frequent RAG implementation problems.

## Poor Retrieval Quality

### Symptoms
- Irrelevant chunks returned for queries
- Missing obvious matches
- Inconsistent results

### Solutions

**Check chunk quality**:
- Ensure chunks contain complete thoughts
- Verify chunk size isn't too small or large
- Review chunking strategy for content type

**Optimize search parameters**:
- Adjust similarity thresholds
- Try different search modes (keyword vs semantic)
- Tune hybrid search weights

**Improve embeddings**:
- Use appropriate embedding model for content
- Ensure consistent model for indexing and querying
- Consider domain-specific models

## Slow Performance

### Symptoms
- Long response times
- High memory usage
- Timeouts during processing

### Solutions

**Optimize chunk processing**:
- Reduce chunk overlap if possible
- Use larger chunks to reduce total count
- Implement batch processing

**Improve search efficiency**:
- Cache frequent queries
- Use approximate similarity search
- Implement result filtering

**Optimize generation**:
- Reduce context length
- Lower max token limits
- Use faster models when appropriate

## Inconsistent Responses

### Symptoms
- Different answers to same question
- Contradictory information
- Unstable quality

### Solutions

**Stabilize generation**:
- Lower temperature (0.1-0.3)
- Use deterministic sampling
- Implement response caching

**Improve context selection**:
- Use consistent ranking algorithms
- Implement deduplication
- Add source diversity controls

**Quality control**:
- Add confidence scoring
- Implement response validation
- Use multiple model comparison

## Context Window Overflow

### Symptoms
- Truncated context
- Missing important information
- Error messages about token limits

### Solutions

**Optimize context usage**:
- Prioritize most relevant chunks
- Implement smart truncation
- Use summarization for long contexts

**Adjust parameters**:
- Reduce max context length
- Decrease chunk sizes
- Limit number of retrieved chunks

**Model selection**:
- Use models with larger context windows
- Implement context compression
- Consider streaming responses

## Poor Answer Quality

### Symptoms
- Generic or vague responses
- Missing key information
- Factual errors

### Solutions

**Improve retrieval**:
- Increase number of retrieved chunks
- Adjust similarity thresholds
- Use better query preprocessing

**Enhance prompts**:
- Add specific instructions
- Include examples in prompts
- Specify desired response format

**Optimize generation**:
- Adjust temperature for use case
- Use appropriate model size
- Implement response post-processing
    `,
    searchKeywords: ['troubleshooting', 'issues', 'problems', 'performance', 'quality', 'errors', 'debugging'],
    relatedArticles: ['performance-tuning', 'chunk-size-optimization', 'search-algorithms']
  }
];

export const searchArticles = (query: string): HelpArticle[] => {
  const lowercaseQuery = query.toLowerCase();
  
  return helpArticles.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(lowercaseQuery);
    const contentMatch = article.content.toLowerCase().includes(lowercaseQuery);
    const keywordMatch = article.searchKeywords.some(keyword => 
      keyword.toLowerCase().includes(lowercaseQuery)
    );
    
    return titleMatch || contentMatch || keywordMatch;
  });
};

export const getArticlesByCategory = (category: HelpArticle['category']): HelpArticle[] => {
  return helpArticles.filter(article => article.category === category);
};

export const getArticleById = (id: string): HelpArticle | undefined => {
  return helpArticles.find(article => article.id === id);
};