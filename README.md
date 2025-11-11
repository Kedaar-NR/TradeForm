# TradeForm - AI-Powered Trade Study Automation

TradeForm is a complete enterprise web application that automates engineering trade studies, reducing the time from **1 month to 2 hours** using AI capabilities.

## Overview

A trade study is a systematic process engineers use to select the best component (antenna, sensor, processor, etc.) from many commercially available options by scoring each option against multiple weighted criteria. TradeForm automates this entire process with AI.

## Features

### Core Capabilities
- **Project Management**: Create and manage multiple trade study projects
- **Criteria Definition**: Define weighted evaluation criteria specific to component types
- **Component Discovery**: AI-powered search for commercially available components (planned)
- **Datasheet Extraction**: Automatic PDF parsing and specification extraction (planned)
- **Intelligent Scoring**: AI scores components on 1-10 scale with justification (planned)
- **Results Visualization**: Interactive table and heatmap views with ranking
- **Report Generation**: Export comprehensive documentation (planned)

### Technology Stack

#### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling with ChatGPT-inspired gradients
- **React Router** for navigation
- **Zustand** for state management
- **Recharts** for data visualization
- **Axios** for API calls

#### Backend
- **FastAPI** (Python) - Modern, fast web framework
- **PostgreSQL** - Robust relational database
- **SQLAlchemy** - ORM for database operations
- **Redis** - Caching and session management
- **Celery** - Background job processing (planned)
- **LangChain** - LLM orchestration (planned)

#### AI/ML (Planned)
- **GPT-4 / Claude** for intelligent scoring and extraction
- **PyPDF2 / pdfplumber** for PDF parsing
- **OCR** for image-based datasheets
- **Vector DB** for semantic search

## Project Structure

```
TradeForm/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components (Dashboard, Setup, etc.)
│   │   ├── store/           # Zustand state management
│   │   ├── types/           # TypeScript interfaces
│   │   └── App.tsx          # Main app with routing
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js   # Tailwind with gradient design system
│
├── backend/                  # FastAPI Python application
│   ├── app/
│   │   ├── models.py        # SQLAlchemy database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # Database configuration
│   │   └── main.py          # FastAPI app with all endpoints
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml        # Docker orchestration
├── .env.example             # Environment variables template
└── README.md                # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose (recommended)
- OR Node.js 18+, Python 3.11+, PostgreSQL 15+

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   cd TradeForm
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up PostgreSQL database**
   ```bash
   createdb tradeform
   ```

4. **Set environment variables**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/tradeform"
   export OPENAI_API_KEY="your_key_here"
   ```

5. **Run the backend**
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

## Database Schema

### Projects Table
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Project name
- `component_type` (VARCHAR) - Type of component being evaluated
- `description` (TEXT) - Optional description
- `status` (ENUM) - draft | in_progress | completed
- `created_at`, `updated_at` (TIMESTAMP)

### Criteria Table
- `id` (UUID) - Primary key
- `project_id` (UUID) - Foreign key to projects
- `name` (VARCHAR) - Criterion name (e.g., "Gain")
- `description` (TEXT) - Optional description
- `weight` (FLOAT) - Importance weight (1-10)
- `unit` (VARCHAR) - Unit of measurement
- `higher_is_better` (BOOLEAN) - Scoring direction
- `minimum_requirement`, `maximum_requirement` (FLOAT) - Optional thresholds

### Components Table
- `id` (UUID) - Primary key
- `project_id` (UUID) - Foreign key to projects
- `manufacturer` (VARCHAR) - Component manufacturer
- `part_number` (VARCHAR) - Part number
- `description` (TEXT) - Component description
- `datasheet_url`, `datasheet_file_path` (VARCHAR) - Datasheet references
- `availability` (ENUM) - in_stock | limited | obsolete
- `source` (ENUM) - ai_discovered | manually_added

### Scores Table
- `id` (UUID) - Primary key
- `component_id` (UUID) - Foreign key to components
- `criterion_id` (UUID) - Foreign key to criteria
- `raw_value` (FLOAT) - Extracted specification value
- `score` (INTEGER) - Score (1-10)
- `rationale` (TEXT) - AI justification for score
- `extraction_confidence` (FLOAT) - Confidence (0-1)
- `manually_adjusted` (BOOLEAN) - User override flag
- `adjusted_by`, `adjusted_at` - Audit trail

## API Endpoints

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Criteria
- `POST /api/projects/{id}/criteria` - Add criterion
- `GET /api/projects/{id}/criteria` - List criteria
- `PUT /api/criteria/{id}` - Update criterion
- `DELETE /api/criteria/{id}` - Delete criterion

### Components
- `POST /api/projects/{id}/components` - Add component
- `GET /api/projects/{id}/components` - List components
- `DELETE /api/components/{id}` - Remove component

### Scores
- `POST /api/scores` - Create score
- `GET /api/projects/{id}/scores` - Get all scores
- `PUT /api/scores/{id}` - Update score (manual override)

### Results
- `GET /api/projects/{id}/results` - Get ranked results with weighted scores

### AI Features (Planned)
- `POST /api/projects/{id}/discover` - Trigger component discovery
- `POST /api/components/{id}/datasheet` - Upload & extract datasheet
- `POST /api/projects/{id}/score` - Trigger AI scoring

## Usage Workflow

### 1. Create New Trade Study
- Navigate to Dashboard
- Click "Start New Trade Study"
- Enter project name and component type
- AI suggests common criteria for that component type

### 2. Define Criteria
- Add evaluation criteria with weights
- Specify units and scoring direction (higher/lower is better)
- Set optional minimum/maximum requirements

### 3. Add Components
- Manually add components or use AI discovery (planned)
- Upload datasheets for automatic extraction (planned)
- Review and correct extracted specifications

### 4. Score & Analyze
- AI automatically scores all components (planned)
- Review scoring rationale
- Override any scores manually if needed
- View results in table or heatmap format

### 5. Generate Report
- Export results to PDF or Excel (planned)
- Include executive summary and full scoring details
- Add datasheet appendices

## Scoring Algorithm

The system uses a weighted scoring methodology:

### Individual Scores (1-10 scale)
- **1-2**: Completely inadequate - Fails minimum requirements
- **3-4**: Below acceptable - Marginal performance
- **5-6**: Meets requirements - Acceptable baseline
- **7-8**: Good performance - Exceeds requirements
- **9-10**: Exceptional - Best-in-class

### Weighted Total Score
```
Final Score = Σ (Criterion Score × Criterion Weight) / Σ (All Criterion Weights)
```

Example:
- Gain: 7/10 (weight: 8) = 56
- Cost: 6/10 (weight: 10) = 60
- Size: 9/10 (weight: 5) = 45
- **Total: (56+60+45) / (8+10+5) = 161/23 = 7.0**

## Future AI Capabilities

### Component Discovery
- Integration with Digi-Key, Mouser, Octopart APIs
- Web scraping for manufacturer sites
- Deduplication and availability checking

### Datasheet Extraction
- PDF parsing with table detection
- OCR for image-based datasheets
- Unit normalization and conversion
- Confidence scoring for extractions

### Intelligent Scoring
- LLM-based comparative analysis
- Domain-specific knowledge application
- Rationale generation for transparency

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Style
- Backend: Black formatter, isort
- Frontend: Prettier, ESLint

### Contributing
1. Create feature branch
2. Make changes with tests
3. Submit pull request

## Deployment

### Production Considerations
- Use production-grade database (RDS, Cloud SQL)
- Set up Redis cluster for scaling
- Enable HTTPS with valid certificates
- Configure API rate limiting
- Set up monitoring and logging
- Use environment-specific secrets management

### Environment Variables
See `.env.example` for required configuration.

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.

---

**Built with** ❤️ **for engineers who want to focus on innovation, not spreadsheets.**
