import { Chunk, ChunkingParameters, ChunkingMetrics } from '../types/chunking'

export function chunkText(text: string, parameters: ChunkingParameters): Chunk[] {
  if (!text.trim()) return []

  const { strategy, chunkSize, overlap } = parameters

  switch (strategy) {
    case 'fixed-size':
      return chunkByFixedSize(text, chunkSize, overlap)
    case 'default':
      return chunkByDefault(text)
    case 'sentence':
      return chunkBySentence(text, chunkSize, overlap)
    case 'paragraph':
      return chunkByParagraph(text, chunkSize)
    case 'hierarchical':
      return chunkByHierarchical(text, parameters)
    case 'semantic':
      return chunkBySemantic(text, parameters)
    case 'no-chunking':
      return chunkByNoChunking(text)
    default:
      return chunkByFixedSize(text, chunkSize, overlap)
  }
}

function chunkByFixedSize(text: string, size: number, overlap: number): Chunk[] {
  const chunks: Chunk[] = []
  const step = Math.max(1, size - overlap)
  
  for (let i = 0; i < text.length; i += step) {
    const end = Math.min(i + size, text.length)
    const content = text.slice(i, end)
    
    if (content.trim().length > 0) {
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        content: content,
        startIndex: i,
        endIndex: end,
        wordCount: content.trim().split(/\s+/).length,
        charCount: content.length
      })
    }
    
    if (end >= text.length) break
  }
  
  return chunks
}

function chunkBySentence(text: string, maxSize: number, overlap: number): Chunk[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks: Chunk[] = []
  let currentChunk = ''
  let currentStartIndex = 0
  
  // Track sentence positions in original text
  const sentencePositions: { sentence: string, start: number, end: number }[] = []
  let searchPos = 0
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    const foundIndex = text.indexOf(trimmed, searchPos)
    if (foundIndex !== -1) {
      sentencePositions.push({
        sentence: trimmed + '.',
        start: foundIndex,
        end: foundIndex + trimmed.length + 1
      })
      searchPos = foundIndex + trimmed.length
    }
  }
  
  for (let i = 0; i < sentencePositions.length; i++) {
    const sentenceData = sentencePositions[i]
    const sentence = sentenceData.sentence
    
    if (currentChunk.length + sentence.length > maxSize && currentChunk.length > 0) {
      // Create chunk
      const chunkEndIndex = currentStartIndex + currentChunk.length
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        content: currentChunk.trim(),
        startIndex: currentStartIndex,
        endIndex: chunkEndIndex,
        wordCount: currentChunk.trim().split(/\s+/).length,
        charCount: currentChunk.trim().length
      })
      
      // Start new chunk with overlap
      if (overlap > 0 && chunks.length > 0) {
        // Find overlap position by going back 'overlap' characters
        const overlapStart = Math.max(0, chunkEndIndex - overlap)
        const overlapText = text.slice(overlapStart, chunkEndIndex)
        currentChunk = overlapText + ' ' + sentence
        currentStartIndex = overlapStart
      } else {
        currentChunk = sentence
        currentStartIndex = sentenceData.start
      }
    } else {
      if (currentChunk === '') {
        currentStartIndex = sentenceData.start
        currentChunk = sentence
      } else {
        currentChunk += ' ' + sentence
      }
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      content: currentChunk.trim(),
      startIndex: currentStartIndex,
      endIndex: currentStartIndex + currentChunk.length,
      wordCount: currentChunk.trim().split(/\s+/).length,
      charCount: currentChunk.trim().length
    })
  }
  
  return chunks
}

function chunkByParagraph(text: string, maxSize: number): Chunk[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const chunks: Chunk[] = []
  let currentIndex = 0
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()
    if (trimmed.length <= maxSize) {
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        content: trimmed,
        startIndex: currentIndex,
        endIndex: currentIndex + trimmed.length,
        wordCount: trimmed.split(/\s+/).length,
        charCount: trimmed.length
      })
    } else {
      // Split large paragraphs
      const subChunks = chunkByFixedSize(trimmed, maxSize, 0)
      chunks.push(...subChunks.map(chunk => ({
        ...chunk,
        id: `chunk-${chunks.length + 1}`,
        startIndex: currentIndex + chunk.startIndex,
        endIndex: currentIndex + chunk.endIndex
      })))
    }
    currentIndex += paragraph.length + 2 // Account for paragraph breaks
  }
  
  return chunks
}

function chunkByDefault(text: string): Chunk[] {
  // Default chunking: ~300 tokens, honors sentence boundaries
  const approximateTokensPerChar = 0.25 // Rough estimate: 1 token ≈ 4 characters
  const targetTokens = 300
  const targetChars = Math.round(targetTokens / approximateTokensPerChar)
  
  return chunkBySentence(text, targetChars, 0)
}

function chunkByHierarchical(text: string, parameters: ChunkingParameters): Chunk[] {
  const parentSize = parameters.parentChunkSize || 800
  const childSize = parameters.childChunkSize || 200
  const overlap = parameters.overlap || 50
  
  // Create parent chunks first
  const parentChunks = chunkByFixedSize(text, parentSize, overlap)
  const hierarchicalChunks: Chunk[] = []
  
  parentChunks.forEach((parent, parentIndex) => {
    const parentId = `parent-${parentIndex + 1}`
    const childrenIds: string[] = []
    
    // Add parent chunk
    hierarchicalChunks.push({
      id: parentId,
      content: parent.content,
      startIndex: parent.startIndex,
      endIndex: parent.endIndex,
      wordCount: parent.wordCount,
      charCount: parent.charCount,
      isChild: false,
      childrenIds: []
    })
    
    // Create child chunks within each parent
    const childChunks = chunkByFixedSize(parent.content, childSize, Math.round(overlap / 2))
    
    childChunks.forEach((child, childIndex) => {
      const childId = `${parentId}-child-${childIndex + 1}`
      childrenIds.push(childId)
      
      hierarchicalChunks.push({
        id: childId,
        content: child.content,
        startIndex: parent.startIndex + child.startIndex,
        endIndex: parent.startIndex + child.endIndex,
        wordCount: child.wordCount,
        charCount: child.charCount,
        parentId: parentId,
        isChild: true
      })
    })
    
    // Update parent with children IDs
    const parentChunk = hierarchicalChunks.find(c => c.id === parentId)
    if (parentChunk) {
      parentChunk.childrenIds = childrenIds
    }
  })
  
  return hierarchicalChunks
}

function chunkBySemantic(text: string, parameters: ChunkingParameters): Chunk[] {
  const maxTokens = parameters.chunkSize || 400
  const threshold = parameters.breakpointThreshold || 75
  
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks: Chunk[] = []
  
  // Simple semantic chunking simulation
  // In reality, this would use embeddings to determine semantic similarity
  let currentChunk = ''
  let startIndex = 0
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim() + '.'
    
    // Simple heuristic: break on topic changes (keywords, transitions)
    const hasTopicChange = sentence.toLowerCase().includes('however') ||
                          sentence.toLowerCase().includes('furthermore') ||
                          sentence.toLowerCase().includes('in contrast') ||
                          sentence.toLowerCase().includes('meanwhile') ||
                          (i > 0 && Math.random() * 100 > threshold) // Simulate semantic breakpoint
    
    if ((currentChunk.length + sentence.length > maxTokens * 4) || 
        (hasTopicChange && currentChunk.length > 100)) {
      
      if (currentChunk.trim()) {
        const endIndex = startIndex + currentChunk.length
        chunks.push({
          id: `semantic-chunk-${chunks.length + 1}`,
          content: currentChunk.trim(),
          startIndex,
          endIndex,
          wordCount: currentChunk.trim().split(/\s+/).length,
          charCount: currentChunk.trim().length
        })
        
        startIndex = endIndex
        currentChunk = sentence
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      id: `semantic-chunk-${chunks.length + 1}`,
      content: currentChunk.trim(),
      startIndex,
      endIndex: startIndex + currentChunk.length,
      wordCount: currentChunk.trim().split(/\s+/).length,
      charCount: currentChunk.trim().length
    })
  }
  
  return chunks
}

function chunkByNoChunking(text: string): Chunk[] {
  // No chunking: treat entire document as single chunk
  return [{
    id: 'single-document',
    content: text.trim(),
    startIndex: 0,
    endIndex: text.length,
    wordCount: text.trim().split(/\s+/).length,
    charCount: text.length
  }]
}

export function calculateMetrics(chunks: Chunk[]): ChunkingMetrics {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      averageChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
      totalWords: 0,
      overlapPercentage: 0
    }
  }

  const sizes = chunks.map(chunk => chunk.charCount)
  const totalWords = chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0)
  
  // Calculate overlap percentage
  let totalOverlap = 0
  for (let i = 1; i < chunks.length; i++) {
    const prevChunk = chunks[i - 1]
    const currentChunk = chunks[i]
    
    if (currentChunk.startIndex < prevChunk.endIndex) {
      totalOverlap += prevChunk.endIndex - currentChunk.startIndex
    }
  }
  
  const totalChars = chunks.length > 0 ? chunks[chunks.length - 1].endIndex - chunks[0].startIndex : 0
  const overlapPercentage = totalChars > 0 ? Math.round((totalOverlap / totalChars) * 100) : 0
  
  return {
    totalChunks: chunks.length,
    averageChunkSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
    totalWords,
    overlapPercentage
  }
}

export function getOverlapInfo(chunks: Chunk[], index: number): { hasOverlap: boolean, overlapText: string, overlapLength: number } {
  if (index === 0 || index >= chunks.length) {
    return { hasOverlap: false, overlapText: '', overlapLength: 0 }
  }
  
  const prevChunk = chunks[index - 1]
  const currentChunk = chunks[index]
  
  if (currentChunk.startIndex < prevChunk.endIndex) {
    const overlapStart = currentChunk.startIndex
    const overlapEnd = Math.min(prevChunk.endIndex, currentChunk.endIndex)
    const overlapText = currentChunk.content.substring(0, overlapEnd - overlapStart)
    
    return {
      hasOverlap: true,
      overlapText,
      overlapLength: overlapEnd - overlapStart
    }
  }
  
  return { hasOverlap: false, overlapText: '', overlapLength: 0 }
}