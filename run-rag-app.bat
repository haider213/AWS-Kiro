@echo off
REM RAG Pipeline Educator - Windows Launcher
REM This script starts both frontend and backend services on Windows

echo ================================
echo  RAG Pipeline Educator Launcher
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

echo [INFO] System requirements check passed
echo.

REM Setup Python Backend
echo ================================
echo  Setting Up Python Backend
echo ================================

cd python_backend

REM Create virtual environment if it doesn't exist
if not exist "venv_clean" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv_clean
    echo [SUCCESS] Virtual environment created
)

REM Activate virtual environment and install dependencies
echo [INFO] Installing Python dependencies...
call venv_clean\Scripts\activate.bat

REM Install requirements
if exist "requirements.txt" (
    echo [INFO] Installing from requirements.txt...
    pip install -r requirements.txt >nul 2>&1
) else (
    echo [INFO] Installing individual packages...
    pip install flask flask-cors numpy pandas scikit-learn nltk requests python-dotenv boto3 langchain-experimental langchain-community langchain-core >nul 2>&1
)

echo [SUCCESS] Python dependencies installed

REM Download NLTK data
echo [INFO] Downloading NLTK data...
python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); print('NLTK data ready')" 2>nul

echo [SUCCESS] NLTK data downloaded

REM Start Python backend
echo [INFO] Starting Python backend on port 5000...
start "RAG Backend" cmd /k "venv_clean\Scripts\activate.bat && python app.py"

cd ..

REM Setup Frontend
echo ================================
echo  Setting Up Frontend
echo ================================

REM Install frontend dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    npm install >nul 2>&1
    echo [SUCCESS] Frontend dependencies installed
)

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend
echo [INFO] Starting frontend on port 3000...
start "RAG Frontend" cmd /k "npm run dev"

REM Wait for services to start
timeout /t 5 /nobreak >nul

echo.
echo ================================
echo  RAG Pipeline Educator is Ready!
echo ================================
echo.
echo [SUCCESS] All services are starting up:
echo    Frontend Application:  http://localhost:3000
echo    Python Backend API:    http://localhost:5000
echo.
echo [INFO] Available Features:
echo    • Phase 1: Document Chunking (4 strategies)
echo    • Phase 2: Vector Embeddings (AWS Bedrock)
echo    • Phase 3: Information Retrieval (6 reranking methods)
echo    • Phase 4: Response Generation (Claude 3, Titan)
echo.
echo [INFO] Quick Start:
echo    1. Open http://localhost:3000 in your browser
echo    2. Process a document in Phase 1
echo    3. Search and experiment with reranking in Phase 3
echo    4. Generate AI responses in Phase 4
echo.
echo Press any key to close this launcher...
pause >nul