# RAG Pipeline Educator

An interactive web application designed to teach Retrieval-Augmented Generation (RAG) concepts through hands-on simulations and visualizations.

## Features

- **Interactive Chunking Module**: Experiment with different text segmentation strategies
- **Embedding Visualization**: Visualize vector representations and similarity relationships
- **Retrieval Demonstration**: Explore query matching and ranking mechanisms
- **Generation Simulation**: See how retrieved context affects response generation
- **Real-time Parameter Adjustment**: Modify algorithm settings and see immediate effects
- **Educational Tooltips**: Learn concepts through guided explanations

## Tech Stack

### Frontend
- **React 18** with TypeScript for component-based architecture
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling
- **Zustand** for state management
- **D3.js** for interactive visualizations

### Backend
- **Node.js/Express** API server
- **AWS Bedrock** integration for embeddings and text generation
- **TypeScript** for type safety

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- AWS account with Bedrock access (for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rag-pipeline-educator
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   # In backend directory
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

### Development

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   # In root directory
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
```

## Project Structure

```
rag-pipeline-educator/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/         # Layout components (Header, Navigation)
│   │   └── UI/             # Basic UI components (Card, LoadingSpinner)
│   ├── modules/            # RAG pipeline modules
│   │   ├── chunking/       # Text chunking module
│   │   ├── embedding/      # Vector embedding module
│   │   ├── retrieval/      # Information retrieval module
│   │   └── generation/     # Response generation module
│   ├── store/              # Zustand state management
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── backend/
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   └── types/          # Backend type definitions
│   └── dist/               # Compiled JavaScript
└── public/                 # Static assets
```

## Usage

1. **Navigate between modules** using the top navigation
2. **Adjust parameters** using the interactive controls
3. **Observe real-time changes** in visualizations
4. **Follow the guided tour** for structured learning
5. **Experiment with different configurations** to understand RAG concepts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Deployment

### Quick Deployment

1. **Configure AWS credentials** (see [AWS_SETUP.md](AWS_SETUP.md))
2. **Run deployment script**:
   ```bash
   # Windows
   .\deploy.ps1 -Environment production
   
   # Linux/Mac
   ./deploy.sh -e production
   ```
3. **Verify deployment**:
   ```bash
   .\health-check.ps1 -Production
   ```

### Deployment Options

- **Static Hosting**: Netlify, Vercel, AWS S3 + CloudFront
- **Backend Hosting**: AWS EC2, DigitalOcean, Railway
- **Container Deployment**: Docker + AWS ECS/Fargate

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Health Monitoring

- Frontend: `https://your-domain.com`
- Backend Health: `https://your-api-domain.com/health`
- Metrics: `https://your-api-domain.com/api/metrics`

### Cost Optimization

Estimated hackathon costs (48 hours, 50 users): ~$25-60
- Built-in rate limiting and caching
- Request batching for AWS Bedrock
- Offline functionality after initial load

## Documentation

- [**DEPLOYMENT.md**](DEPLOYMENT.md) - Complete deployment guide
- [**AWS_SETUP.md**](AWS_SETUP.md) - AWS Bedrock configuration
- **API Documentation**: Available at `/api` endpoint

## Acknowledgments

- Built for educational purposes to demonstrate RAG concepts
- Designed for hackathons and interactive learning environments
- Powered by AWS Bedrock for production-quality AI capabilities
- Optimized for concurrent users and offline reliability