# Payroll AI Backend

Python FastAPI backend for AI-powered payroll processing and analysis.

## Features

- 🤖 AI-powered chat assistant using Gemini API
- 📊 Payroll anomaly detection and analysis
- 🔒 Secure JWT authentication with Supabase
- 🎯 Row Level Security (RLS) integration
- 📈 RESTful API design

## Technology Stack

- **FastAPI**: Modern Python web framework
- **Supabase**: Backend-as-a-Service (Auth + Database)
- **Gemini API**: AI intelligence for chat and analysis
- **Pydantic**: Data validation
- **ReportLab**: PDF generation

## Setup

### Prerequisites

- Python 3.9+
- pip or poetry
- Supabase account
- Gemini API key

### Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (keep secret!)
- `GEMINI_API_KEY`: Your Google Gemini API key

### Running Locally

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000`

Interactive API docs: `http://localhost:8000/docs`

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check

### AI Chat
- `POST /api/v1/chat` - Context-aware AI chat assistant
  - Optional authentication for general queries
  - Required authentication for queries with private data

### Payroll Analysis
- `POST /api/v1/analyze-payroll` - Analyze payroll for anomalies
  - Requires admin authentication
  - Returns detected anomalies and AI insights

## Deployment to Render

### Step 1: Create a Render Account
Sign up at [render.com](https://render.com)

### Step 2: Create Web Service

1. Connect your GitHub repository
2. Select "Web Service"
3. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3

### Step 3: Add Environment Variables

In Render dashboard, add all variables from `.env.example`:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- GEMINI_API_KEY
- ENVIRONMENT=production
- CORS_ORIGINS=https://your-frontend-domain.vercel.app

### Step 4: Deploy

Render will automatically deploy your service. The API will be available at:
`https://your-service-name.onrender.com`

## Security Best Practices

1. **Never expose service keys**: Keep `SUPABASE_SERVICE_KEY` and `GEMINI_API_KEY` in environment variables only
2. **Validate JWTs**: Always verify Supabase JWTs before accessing protected resources
3. **Sanitize data**: Remove PII before sending data to AI services
4. **Use RLS**: Rely on Row Level Security for database access control
5. **Rate limiting**: Implement rate limits for AI endpoints to control costs
6. **Audit logs**: Log all service_role database access

## Development

### Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── chat.py
│   │           └── payroll.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── supabase.py
│   ├── models/
│   │   └── schemas.py
│   ├── services/
│   │   └── gemini_service.py
│   └── main.py
├── requirements.txt
├── .env.example
└── README.md
```

### Adding New Endpoints

1. Create endpoint file in `app/api/v1/endpoints/`
2. Define request/response models in `app/models/schemas.py`
3. Add router to `app/main.py`

### Testing

```bash
# Run tests (when implemented)
pytest

# Check code style
black app/
flake8 app/
```

## License

See LICENSE file in root directory.
