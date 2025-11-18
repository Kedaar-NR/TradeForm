# TradeForm - AI-Powered Trade Study Automation

> Turning 1-month engineering decisions into 2-hour sprints with the power of AI

## What is TradeForm?

TradeForm is an enterprise web application built for engineers who need to make component selection decisions quickly and confidently. Whether you're choosing antennas, sensors, processors, or any other commercially available component, TradeForm uses AI to automate the entire trade study process—from discovery to final report.

Think of it as your AI-powered research assistant that can read hundreds of datasheets, extract specifications, score components against your criteria, and generate comprehensive reports while you grab a coffee.

## Why TradeForm?

Traditional trade studies are painful:
- 📊 Endless spreadsheet gymnastics
- 📄 Manual datasheet reading and data extraction
- 🔍 Searching through distributor catalogs for hours
- ⏰ Weeks of work for a single component selection
- 🤯 Subjective scoring with no clear rationale

TradeForm makes it simple:
- ✨ AI discovers components automatically from distributor APIs
- 🤖 Intelligent datasheet Q&A extracts specifications instantly
- 📈 Automated scoring with transparent AI-generated rationale
- 📊 Beautiful visualizations (tables, heatmaps, charts)
- 📑 Professional Excel reports ready to share with your team
- 👥 Real-time collaboration with team members

## Key Features

### 🎯 Smart Project Management
Create and manage multiple trade study projects with ease. Each project maintains its own criteria, components, and results with full version history.

### 📋 Flexible Criteria Definition
Define exactly what matters for your component selection. Set weights, units, scoring directions (higher or lower is better), and optional min/max requirements. Import criteria from Excel templates or create them from scratch.

### 🔍 AI-Powered Component Discovery
Let AI do the heavy lifting. TradeForm automatically searches Digi-Key, Mouser, and other distributor APIs to find relevant components based on your project description. No more manual catalog browsing.

### 📚 Intelligent Datasheet Analysis
Upload PDF datasheets and ask questions in natural language. Our AI assistant extracts specifications, answers technical questions, and provides suggestions—all backed by Google's Gemini AI.

### 🧠 Automated AI Scoring
TradeForm uses Claude (Anthropic's AI) to score each component against your criteria on a 1-10 scale. Every score comes with a detailed rationale explaining the reasoning, making the process transparent and auditable.

### 📊 Rich Visualizations
View your results your way:
- **Table View**: Classic ranked table with color-coded scores
- **Heatmap View**: Visual heat map showing strengths and weaknesses at a glance
- **Charts**: Bar charts, spider charts, and sensitivity analysis to understand how weight changes affect rankings

### 📑 Professional Reporting
Export comprehensive Excel reports with multiple sheets:
- Executive summary with rankings
- Detailed scores with AI rationale
- Criteria breakdown
- Component specifications

Generate PDF reports with full trade study documentation using AI-powered summarization.

### 👥 Team Collaboration
Work together seamlessly:
- Share projects with team members
- Add comments on specific components or criteria
- Track all changes with automatic change logging
- Create versions to snapshot your work at key milestones

### 🔐 Enterprise Authentication
Secure authentication with:
- Email/password login
- WorkOS SSO integration for enterprise customers
- JWT token-based security
- Role-based access control

## Technology Stack

We've built TradeForm with modern, production-ready technologies:

### Frontend
- **React 18** with **TypeScript** for type-safe, maintainable code
- **Tailwind CSS** for a beautiful, responsive UI
- **React Router** for seamless navigation
- **Recharts** for stunning data visualizations
- **Axios** for reliable API communication

### Backend
- **FastAPI** (Python) - Blazing fast, modern web framework
- **PostgreSQL** - Rock-solid relational database
- **SQLAlchemy** - Powerful ORM for database operations
- **Pydantic** - Data validation with Python type hints

### AI/ML Stack
- **Claude AI (Anthropic)** - Component discovery and intelligent scoring
- **Google Gemini** - Datasheet analysis and Q&A
- **LangChain** - LLM orchestration and chaining
- **OpenAI** - Additional AI capabilities

### Data Processing
- **PyPDF2** & **pdfplumber** - PDF datasheet parsing
- **openpyxl** - Excel import/export
- **pandas** - Data manipulation and analysis

## Getting Started

### Prerequisites
- **Docker & Docker Compose** (recommended), OR
- **Node.js 18+**, **Python 3.11+**, **PostgreSQL 15+**

### Quick Start with Docker (Recommended)

1. **Clone and navigate to the repository**
   ```bash
   cd TradeForm
   ```

2. **Set up your environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```
   ANTHROPIC_API_KEY=your_claude_api_key
   GEMINI_API_KEY=your_gemini_api_key
   DATABASE_URL=postgresql://postgres:postgres@db:5432/tradeform
   ```

3. **Launch everything**
   ```bash
   docker-compose up -d
   ```

4. **Start building trade studies!**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend

1. **Create a virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your database**
   ```bash
   createdb tradeform
   ```

4. **Configure environment variables**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/tradeform"
   export ANTHROPIC_API_KEY="your_key_here"
   export GEMINI_API_KEY="your_key_here"
   ```

5. **Run the backend**
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set your API URL** (optional, defaults to http://localhost:8000)
   ```bash
   export REACT_APP_API_URL="http://localhost:8000"
   ```

3. **Start the dev server**
   ```bash
   npm start
   ```

## How to Use TradeForm

### 1️⃣ Create Your Project
Start by creating a new trade study project. Give it a name, specify the component type (e.g., "RF Antenna", "Microcontroller", "Pressure Sensor"), and add an optional description.

### 2️⃣ Define Your Criteria
Add the criteria that matter for your component selection:
- **Name**: What you're evaluating (e.g., "Gain", "Power Consumption", "Cost")
- **Weight**: How important it is (1-10 scale)
- **Unit**: What it's measured in (dBi, mW, USD)
- **Direction**: Whether higher or lower values are better
- **Requirements**: Optional min/max thresholds

You can create criteria manually, import from Excel, or use AI-suggested criteria based on your component type.

### 3️⃣ Discover Components
Click "Discover Components" and let AI search distributor databases for relevant options. Review the discovered components and add any specific parts you want to evaluate. Upload datasheets for each component to enable AI extraction.

### 4️⃣ Ask Questions & Extract Data
Use the datasheet Q&A feature to ask questions like:
- "What is the operating voltage range?"
- "What's the temperature rating?"
- "How much does it cost in quantity 100?"

AI reads the datasheets and extracts the information automatically.

### 5️⃣ Score & Analyze
Click "Score All Components" to let AI evaluate each component against your criteria. Review the scores and rationales. Override any scores manually if you have additional context.

### 6️⃣ Visualize Results
Switch between table, heatmap, and chart views to understand your results:
- See which component ranks highest
- Identify strengths and weaknesses
- Run sensitivity analysis to understand how criterion weights affect rankings

### 7️⃣ Generate Reports
Export your findings:
- **Excel Export**: Multi-sheet workbook with all details
- **PDF Report**: Professional document with AI-generated summary
- **CSV Export**: Simple data export for further analysis

### 8️⃣ Collaborate & Iterate
Share your project with team members, add comments, and create versions to track your progress over time.

## Scoring Methodology

TradeForm uses a transparent, weighted scoring system:

### Individual Scores (1-10 scale)
- **1-2**: Fails minimum requirements - Not viable
- **3-4**: Below expectations - Marginal performance
- **5-6**: Meets baseline - Acceptable option
- **7-8**: Exceeds requirements - Strong performer
- **9-10**: Best-in-class - Exceptional choice

### Weighted Total Score
Each component's final score is calculated as:

```
Final Score = Σ (Criterion Score × Criterion Weight) / Σ (All Weights)
```

**Example:**
- Gain: 7/10 (weight: 8) → 56 points
- Cost: 6/10 (weight: 10) → 60 points
- Size: 9/10 (weight: 5) → 45 points
- **Total: (56+60+45)/(8+10+5) = 7.0/10**

This means even if a component doesn't excel in every area, it can still rank highly if it performs well on your most important criteria.

## API Reference

TradeForm provides a comprehensive REST API. Full interactive documentation is available at `/docs` when running the backend.

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Criteria
- `POST /api/projects/{id}/criteria` - Add criterion
- `GET /api/projects/{id}/criteria` - List criteria
- `POST /api/projects/{id}/criteria/upload` - Import from Excel
- `GET /api/projects/{id}/criteria/export` - Export to Excel
- `PUT /api/criteria/{id}` - Update criterion
- `DELETE /api/criteria/{id}` - Delete criterion

### Components
- `POST /api/projects/{id}/components` - Add component manually
- `GET /api/projects/{id}/components` - List components
- `POST /api/projects/{id}/discover` - AI component discovery
- `POST /api/projects/{id}/components/upload` - Import from Excel
- `GET /api/projects/{id}/components/export` - Export to Excel
- `PUT /api/components/{id}` - Update component
- `DELETE /api/components/{id}` - Remove component

### Datasheets & AI Analysis
- `POST /api/components/{id}/datasheet` - Upload datasheet PDF
- `GET /api/components/{id}/datasheet/status` - Check processing status
- `POST /api/components/{id}/datasheet/query` - Ask questions about datasheet
- `GET /api/components/{id}/datasheet/suggestions` - Get AI suggestions

### Scoring
- `POST /api/projects/{id}/score` - Trigger AI scoring for all components
- `GET /api/projects/{id}/scores` - Get all scores
- `POST /api/scores` - Create manual score
- `PUT /api/scores/{id}` - Update score

### Results & Reports
- `GET /api/projects/{id}/results` - Get ranked results
- `GET /api/projects/{id}/export/full` - Export full Excel report
- `POST /api/projects/{id}/generate-report` - Generate AI summary report
- `GET /api/projects/{id}/report` - Get current report
- `GET /api/projects/{id}/report/pdf` - Download PDF report

### Collaboration
- `GET /api/projects/{id}/shares` - List project shares
- `POST /api/projects/{id}/shares` - Share with team member
- `GET /api/projects/{id}/comments` - Get all comments
- `POST /api/projects/{id}/comments` - Add comment
- `GET /api/projects/{id}/changes` - View change history
- `GET /api/projects/{id}/versions` - List versions
- `POST /api/projects/{id}/versions` - Create new version

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/workos/callback` - SSO authentication
- `GET /api/auth/me` - Get current user info

## Database Schema

TradeForm uses PostgreSQL with a well-designed relational schema:

### Core Tables
- **Projects**: Trade study projects with metadata
- **Criteria**: Evaluation criteria with weights and requirements
- **Components**: Component catalog with manufacturer, part numbers, datasheets
- **Scores**: Individual scores linking components to criteria with AI rationale

### Collaboration Tables
- **Users**: User accounts and authentication
- **Shares**: Project sharing and permissions
- **Comments**: Discussions on components and criteria
- **Changes**: Audit log of all modifications

### Advanced Features
- **Versions**: Snapshots of projects at specific points in time
- **Datasheets**: Uploaded PDF files with processing status and extracted content

All tables use UUIDs as primary keys, include created/updated timestamps, and maintain referential integrity with foreign key constraints.

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

### Code Quality
- **Backend**: Black formatter, isort for imports, type hints throughout
- **Frontend**: Prettier for formatting, ESLint for linting, strict TypeScript

### Contributing
We welcome contributions! Please:
1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass and code is formatted
4. Submit a pull request with a clear description

## Deployment

### Vercel (Frontend)
The frontend is optimized for Vercel deployment:
1. Connect your GitHub repository
2. Set `REACT_APP_API_URL` environment variable to your backend URL
3. Deploy - Vercel handles the build automatically

### Backend Deployment
For production backends, we recommend:
- **AWS**: ECS/Fargate for containers, RDS for PostgreSQL
- **Google Cloud**: Cloud Run for containers, Cloud SQL for database
- **Railway/Render**: Quick deployment with managed databases

### Environment Variables
Key environment variables to configure:

**Backend:**
```
DATABASE_URL=postgresql://user:pass@host:5432/tradeform
ANTHROPIC_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key
WORKOS_API_KEY=your_workos_key (optional, for SSO)
WORKOS_CLIENT_ID=your_client_id (optional, for SSO)
CORS_ORIGINS=https://your-frontend-domain.com
ALLOW_ALL_ORIGINS=false
SECRET_KEY=your_secret_key_for_jwt
```

**Frontend:**
```
REACT_APP_API_URL=https://your-backend-domain.com
```

### Production Checklist
- ✅ Use managed database service (not SQLite)
- ✅ Enable HTTPS with valid certificates
- ✅ Set up monitoring and error tracking
- ✅ Configure API rate limiting
- ✅ Use secrets manager for API keys
- ✅ Set up automated backups
- ✅ Configure CORS properly
- ✅ Enable logging and analytics

## Roadmap

We're constantly improving TradeForm. Here's what's coming:

- 🔄 Real-time collaboration with WebSockets
- 🎨 Custom themes and white-labeling
- 📱 Mobile-responsive improvements
- 🔌 More distributor integrations (Arrow, Avnet, etc.)
- 🧪 Monte Carlo simulation for uncertainty analysis
- 📊 Advanced analytics and insights
- 🔍 Semantic search across historical trade studies
- 🤝 Third-party integrations (Slack, Teams, etc.)

## Support & Community

- 📧 **Email**: support@tradeform.io
- 💬 **Discord**: Join our community (coming soon)
- 🐛 **Issues**: Report bugs on GitHub Issues
- 📖 **Documentation**: Full docs at docs.tradeform.io (coming soon)

## License

Proprietary - All rights reserved. Contact us for licensing inquiries.

---

**Built with ❤️ for engineers who want to focus on innovation, not spreadsheets.**

*TradeForm: Because your time is better spent designing the future, not wrestling with datasheets.*
