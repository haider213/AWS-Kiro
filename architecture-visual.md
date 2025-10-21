# 🏗️ RAG Pipeline Educator - Visual Architecture

## 📊 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           🌐 USER INTERFACE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  React Frontend (Port 3000)     │    Demo Pages & Testing                      │
│  • TypeScript + Vite            │    • test-reranking.html                     │
│  • Tailwind CSS                 │    • Interactive comparisons                 │
│  • D3.js Visualizations         │    • Real-time demonstrations               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP/REST API
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          🐍 BACKEND SERVICES LAYER                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                    Python Flask API (Port 5000)                                │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────────┐  │
│  │ Document        │ Search &        │ Generation      │ Evaluation          │  │
│  │ Processing      │ Retrieval       │ Services        │ Services            │  │
│  │ /api/process-   │ /api/search-    │ /api/bedrock/   │ /api/evaluate-      │  │
│  │ document        │ chunks          │ generate        │ rag                 │  │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ AWS SDK/API Calls
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ☁️ AWS BEDROCK LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┬─────────────────────────────────────────┐  │
│  │        EMBEDDING MODELS         │         GENERATION MODELS               │  │
│  │  ┌─────────────────────────────┐ │  ┌─────────────────────────────────────┐ │  │
│  │  │ 🔹 Titan Text v1 (1536D)   │ │  │ 🧠 Claude 3 Haiku (Fast)          │ │  │
│  │  │ 🔹 Titan Text v2 (1024D)   │ │  │ 🧠 Claude 3 Sonnet (Balanced)     │ │  │
│  │  │ 🔹 Cohere Embed v3 (1024D) │ │  │ 🧠 Titan Premier (Latest)         │ │  │
│  │  └─────────────────────────────┘ │  └─────────────────────────────────────┘ │  │
│  └─────────────────────────────────┴─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 RAG Pipeline Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            📄 PHASE 1: DOCUMENT PROCESSING                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Raw Document Input                                                             │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────┬─────────────────┬─────────────────┬─────────────────────┐  │
│  │ Sentence-based  │ Fixed-size      │ Paragraph-based │ Semantic-based      │  │
│  │ NLTK Tokenizer  │ Character Count │ Natural Breaks  │ LangChain AI        │  │
│  │ • Fast          │ • Consistent    │ • Structure     │ • Intelligent       │  │
│  │ • Reliable      │ • Predictable   │ • Coherent      │ • Context-aware     │  │
│  └─────────────────┴─────────────────┴─────────────────┴─────────────────────┘  │
│           │                                                                     │
│           ▼                                                                     │
│  📊 Chunk Analysis & Statistics                                                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           🔢 PHASE 2: VECTOR EMBEDDINGS                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Text Chunks → AWS Bedrock → Vector Embeddings                                 │
│                     │                                                           │
│                     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Embedding Models Selection                           │   │
│  │  • Titan v1: 1536 dimensions (Legacy, High-quality)                   │   │
│  │  • Titan v2: 1024 dimensions (Latest, Efficient)                      │   │
│  │  • Cohere v3: 1024 dimensions (Advanced, Multilingual)                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                     │                                                           │
│                     ▼                                                           │
│  📈 t-SNE Visualization & Similarity Matrix                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      🔍 PHASE 3: INFORMATION RETRIEVAL & RERANKING              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Query Input → Query Embedding → Similarity Search                             │
│                                        │                                        │
│                                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Similarity Metrics                                   │   │
│  │  • Cosine Similarity (Normalized, Direction-focused)                   │   │
│  │  • Euclidean Distance (Straight-line, Intuitive)                       │   │
│  │  • Dot Product (Raw similarity, Fast)                                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│                                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Reranking Algorithms (6 Methods)                     │   │
│  │  🎯 None: Pure similarity ranking                                      │   │
│  │  🔍 BM25: Semantic + keyword matching                                  │   │
│  │  🧠 Cross-Encoder: Deep query-document interaction                     │   │
│  │  🌈 Diversity: Reduces redundancy                                      │   │
│  │  📏 Length Penalty: Optimal chunk sizes                               │   │
│  │  🎯 Keyword Boost: Exact match priority                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│                                        ▼                                        │
│  📊 Ranked Results with Comparison Views                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         🤖 PHASE 4: RESPONSE GENERATION                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Retrieved Chunks + Query → Context Building → Prompt Template                 │
│                                        │                                        │
│                                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Generation Models                                    │   │
│  │  🧠 Claude 3 Haiku: Fast, cost-effective responses                     │   │
│  │  🧠 Claude 3 Sonnet: Balanced performance and quality                  │   │
│  │  🧠 Titan Premier: Amazon's latest generation model                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│                                        ▼                                        │
│  📝 Generated Response with Source Attribution                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ⚖️ PHASE 5: LLM-AS-A-JUDGE EVALUATION                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Query + Chunks + Response → Evaluation Prompts → Claude 3 Judge              │
│                                        │                                        │
│                                        ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Evaluation Dimensions                                │   │
│  │  🎯 Relevance: How well chunks match the query                         │   │
│  │  📋 Completeness: Sufficient information coverage                      │   │
│  │  ✨ Answer Quality: Accuracy, clarity, coherence                       │   │
│  │  🔒 Faithfulness: No hallucinations, source fidelity                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                        │
│                                        ▼                                        │
│  📊 Detailed Scores (1-5) + Explanations + Overall Assessment                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack Integration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND STACK                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript                                                         │
│       │                                                                         │
│       ├── Vite (Build Tool & Dev Server)                                       │
│       ├── Tailwind CSS (Styling)                                               │
│       ├── D3.js (Data Visualizations)                                          │
│       ├── Zustand (State Management)                                           │
│       └── Custom Components (Phase-specific UIs)                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND STACK                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Python 3.9+ + Flask                                                           │
│       │                                                                         │
│       ├── Flask-CORS (Cross-origin requests)                                   │
│       ├── LangChain (AI framework & semantic chunking)                         │
│       ├── NLTK (Natural language processing)                                   │
│       ├── Scikit-learn (ML algorithms & similarity)                            │
│       ├── NumPy (Numerical operations)                                         │
│       ├── Pandas (Data manipulation)                                           │
│       └── Boto3 (AWS SDK)                                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │ AWS SDK
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               AI SERVICES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  AWS Bedrock (us-east-1)                                                       │
│       │                                                                         │
│       ├── Anthropic Claude 3 (Haiku, Sonnet)                                  │
│       ├── Amazon Titan (Text v1, v2, Premier)                                 │
│       └── Cohere Embed (English v3)                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Architecture Options

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DEPLOYMENT OPTIONS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │ 💻 LOCAL DEV    │  │ 🖥️ AWS EC2      │  │ 🐳 CONTAINERS   │                │
│  │                 │  │                 │  │                 │                │
│  │ Node.js :3000   │  │ t3.medium       │  │ Docker Compose  │                │
│  │ Python :5000    │  │ Amazon Linux 2  │  │ Multi-service   │                │
│  │ Direct Bedrock  │  │ PM2 Manager     │  │ Nginx Proxy     │                │
│  │                 │  │ CloudWatch      │  │ Auto-scaling    │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │ ⚡ SERVERLESS   │  │ 🚀 APP RUNNER   │  │ 🏗️ EKS          │                │
│  │                 │  │                 │  │                 │                │
│  │ Lambda + API GW │  │ Managed Service │  │ Kubernetes      │                │
│  │ S3 + CloudFront │  │ Auto-deploy     │  │ Enterprise      │                │
│  │ Cost-optimized  │  │ Simple setup    │  │ High-scale      │                │
│  │                 │  │                 │  │                 │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

This architecture provides a comprehensive, educational, and scalable platform for learning RAG systems with hands-on experimentation across all pipeline phases.