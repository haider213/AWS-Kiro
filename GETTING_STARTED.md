# 🚀 Getting Started with RAG Pipeline Educator

## ⚡ 30-Second Quick Start

```bash
git clone <repository-url>
cd rag-pipeline-educator
./run-rag-app.sh
```

Wait for "🎉 RAG Pipeline Educator is Ready!" then open http://localhost:3000

## 🎯 What You'll Learn

This interactive platform teaches you **Retrieval-Augmented Generation (RAG)** through hands-on experimentation:

### 📄 Phase 1: Document Chunking
Learn how to break documents into optimal chunks for processing
- **Try**: Different chunking strategies (sentence, fixed-size, paragraph, semantic)
- **See**: Real-time chunk visualization and statistics

### 🔢 Phase 2: Vector Embeddings  
Understand how text becomes numerical vectors
- **Try**: Different embedding models (Titan v1/v2, Cohere)
- **See**: t-SNE visualization of embedding space

### 🔍 Phase 3: Information Retrieval & Reranking
Master the art of finding relevant information
- **Try**: 6 different reranking methods (BM25, Cross-Encoder, Diversity, etc.)
- **See**: How reranking changes result order and improves relevance

### 🤖 Phase 4: Response Generation
Generate AI responses using retrieved context
- **Try**: Different models (Claude 3, Titan Premier)
- **See**: How context influences response quality

### ⚖️ Phase 5: LLM-as-a-Judge Evaluation
Automatically evaluate your RAG pipeline performance
- **Try**: End-to-end evaluation and retrieval-only assessment
- **See**: Detailed scores for relevance, completeness, quality, and faithfulness

## 🎮 Interactive Demo Flow

### 1. Start Simple (5 minutes)
1. **Launch**: `./run-rag-app.sh`
2. **Open**: http://localhost:3000
3. **Click**: "🔍 Search for Relevant Chunks" (uses default document and query)
4. **Observe**: See how similarity search works

### 2. Explore Reranking (10 minutes)
1. **Phase 3**: Try different reranking methods
2. **Compare**: Switch between "No Reranking" and "Keyword Boosting"
3. **Notice**: How ranks change (e.g., "was #3, now #1")
4. **Enable**: Comparison view to see side-by-side results

### 3. Generate & Evaluate (10 minutes)
1. **Phase 4**: Generate an AI response
2. **Phase 5**: Click "Evaluate Complete RAG Pipeline"
3. **Review**: Detailed scores and explanations
4. **Experiment**: Try different reranking methods and see how evaluation scores change

## 🧪 Test the Advanced Features

### Reranking Comparison
```bash
# Test all 6 reranking methods
./test-all-reranking.sh

# Interactive demo page
open http://localhost:3000/test-reranking.html
```

### Evaluation System
```bash
# Test LLM-as-a-Judge evaluation
./test-evaluation.sh
```

## 🎯 Key Learning Objectives

By the end of this tutorial, you'll understand:

✅ **How RAG systems work** - The complete pipeline from documents to responses  
✅ **Chunking strategies** - When to use different approaches for different content  
✅ **Vector embeddings** - How text similarity is computed mathematically  
✅ **Reranking methods** - Advanced techniques to improve retrieval quality  
✅ **Evaluation metrics** - How to measure and improve RAG system performance  
✅ **Real-world applications** - Best practices for production RAG systems  

## 🚀 Next Steps

1. **Experiment** with your own documents (paste text in Phase 1)
2. **Compare** different embedding models and reranking methods
3. **Analyze** evaluation scores to understand what makes a good RAG system
4. **Optimize** parameters based on your specific use case

## 🆘 Need Help?

- **Setup Issues**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Feature Questions**: Check the in-app help tooltips
- **API Testing**: Use the provided test scripts
- **Troubleshooting**: Run `curl http://localhost:5000/health`

---

**Ready to become a RAG expert? Start with `./run-rag-app.sh` and explore! 🚀**