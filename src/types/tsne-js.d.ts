declare module 'tsne-js' {
  export interface TSNEOptions {
    dim?: number
    perplexity?: number
    earlyExaggeration?: number
    learningRate?: number
    nIter?: number
    metric?: 'euclidean' | 'manhattan'
  }

  export interface TSNEData {
    data: number[][]
    type: 'dense' | 'sparse'
  }

  export class TSNE {
    constructor(options?: TSNEOptions)
    init(data: TSNEData): void
    step(): void
    getSolution(): number[][]
  }
}