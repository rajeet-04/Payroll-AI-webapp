# Payroll AI Backend

A robust FastAPI backend powering an AI-driven payroll management system for Indian businesses. Built with modern Python practices, comprehensive security, and intelligent AI integration using Google's Gemini models.

## 🎯 What This Project Does

**Payroll AI Backend** is a comprehensive API service that powers intelligent payroll processing with:

- **AI-Powered Chat Assistant**: Context-aware conversations about payslips, tax advice, and leave management
- **Automated Payroll Processing**: Intelligent calculation engine with validation and anomaly detection
- **PDF Payslip Generation**: Professional payslip PDFs with Indian Rupee formatting
- **Multi-tenant Architecture**: Company-based data isolation with role-based access control
- **Real-time Streaming**: Server-Sent Events for live AI responses
- **Comprehensive Analytics**: Payroll anomaly detection and business insights

## 🏗️ Tech Stack

### Core Framework
- **FastAPI 0.115.0** - Modern, high-performance Python web framework
- **Python 3.12** - Latest Python with advanced type hints and async support
- **Uvicorn** - ASGI server for production deployment
- **Pydantic 2.9.2** - Data validation and serialization with modern Python types

### Database & Authentication
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database with real-time subscriptions
  - JWT-based authentication with automatic token refresh
  - Row Level Security (RLS) policies for data isolation
  - Server-side session management

### AI & Machine Learning
- **Google Generative AI (Gemini)** - Latest Gemini 2.5 Flash model
- **Custom AI Templates** - Intent-based prompt engineering for specialized responses
- **Context Enrichment** - Dynamic data fetching for personalized AI responses
- **Streaming Responses** - Real-time AI output via Server-Sent Events

### Document Processing
- **ReportLab** - Professional PDF generation for payslips
- **Unicode Font Support** - Proper Indian Rupee (₹) symbol rendering
- **Base64 Encoding** - Secure PDF storage and retrieval

### Security & Validation
- **JWT Authentication** - Bearer token validation with Supabase
- **Role-Based Access Control** - Admin vs Employee permissions
- **Data Sanitization** - Automatic removal of sensitive information before AI processing
- **Input Validation** - Comprehensive request/response model validation

### Development Tools
- **python-dotenv** - Environment variable management
- **python-jose** - JWT token handling
- **passlib** - Password hashing utilities
- **python-multipart** - File upload support

## 🏛️ Architecture Overview

### Project Structure
```
backend/
├── app/
│   ├── main.py                    # FastAPI application entry point
│   ├── core/                      # Core functionality
│   │   ├── config.py             # Environment configuration
│   │   ├── security.py           # JWT validation & auth
│   │   └── supabase.py           # Database client setup
│   ├── models/                   # Data models
│   │   └── schemas.py            # Pydantic request/response models
│   ├── api/v1/endpoints/         # API route handlers
│   │   ├── chat.py               # AI chat endpoints
│   │   └── payroll.py            # Payroll processing endpoints
│   └── services/                 # Business logic services
│       ├── gemini_service.py     # AI integration
│       ├── ai_templates.py       # Prompt engineering
│       └── pdf_service.py        # PDF generation
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables (gitignored)
└── README.md
```

### Key Architectural Patterns

#### 1. **Service-Oriented Architecture**
- **GeminiService**: Handles all AI interactions with context management
- **PDFService**: Dedicated PDF generation with font management
- **AITemplates**: Centralized prompt engineering and data sanitization

#### 2. **Authentication Flow**
```
Client Request → JWT Bearer Token → Supabase Validation → User Context → Role Check → Business Logic
```

#### 3. **Data Security Pipeline**
```
Raw Request → Pydantic Validation → Supabase Auth → RLS Filtering → Sanitization → AI Processing → Response
```

#### 4. **AI Context Enrichment**
```
User Query → Intent Detection → Database Fetch → Context Sanitization → Prompt Building → AI Response → Streaming Output
```

## 🔄 How It Works

### API Endpoints Overview

#### Chat Endpoints (`/api/v1/chat/`)
- **POST `/chat`** - Synchronous AI chat with context awareness
- **POST `/chat/stream`** - Real-time streaming AI responses via SSE

#### Payroll Endpoints (`/api/v1/payroll/`)
- **POST `/process-payroll`** - Automated payroll calculation and PDF generation
- **POST `/analyze-payroll`** - AI-powered anomaly detection
- **GET `/payslip/{id}/download`** - Secure PDF download with authorization

### AI Integration Deep Dive

#### Intent-Based Processing
The AI assistant uses specialized templates for different use cases:

- **payslip_explain**: Analyzes payslip data with Indian tax guidance
- **leave_advice**: Provides leave management recommendations
- **payslip_tax_suggestions**: Offers tax optimization strategies
- **dashboard_insights**: Gives personalized financial insights

#### Context Enrichment Process
```
1. User Query → Intent Classification
2. Database Query → Fetch Relevant Data (last 12 months payslips, leave balances, etc.)
3. Data Sanitization → Remove sensitive fields (PAN, bank details, etc.)
4. Prompt Engineering → Build contextual AI prompt
5. AI Processing → Generate response with conversation history
6. Response Streaming → Real-time output via Server-Sent Events
```

#### Multi-turn Conversations
- Maintains conversation history (last 8 messages)
- Uses Gemini's chat session API for context continuity
- Automatically manages token limits and context window

### Payroll Processing Engine

#### Automated Calculation Pipeline
```
Employee Data → Salary Structure → Leave Deductions → Tax Calculations → PDF Generation → Database Storage
```

#### Key Calculation Features
- **Base Pay**: Monthly salary with per-day calculations
- **Allowances**: Configurable HRA, conveyance, LTA, etc.
- **Deductions**: Fixed amounts and percentage-based deductions
- **Leave Impact**: Unpaid leave salary deductions
- **Tax Estimation**: Conservative 10% TDS calculation
- **YTD Totals**: Year-to-date earnings tracking

#### PDF Generation
- **Professional Layout**: Company header, employee details, earnings/deductions tables
- **Indian Rupee Support**: Unicode font detection for ₹ symbol
- **Secure Storage**: Base64 encoding for database storage
- **Download Security**: Role-based access control for PDF retrieval

### Security & Compliance

#### Authentication & Authorization
- **JWT Validation**: Bearer token authentication via Supabase
- **Role-Based Access**: Admin vs Employee permission levels
- **Company Isolation**: Multi-tenant data separation
- **Session Management**: Automatic token refresh and validation

#### Data Protection
- **Row Level Security**: PostgreSQL RLS policies
- **Sensitive Data Masking**: Automatic removal before AI processing
- **Audit Trail**: Complete logging of all operations
- **Input Sanitization**: Comprehensive validation of all inputs

#### Indian Compliance Features
- **Tax Calculations**: Support for Indian tax slabs and deductions
- **Leave Policies**: Compliance with Indian labor laws
- **Data Privacy**: GDPR and Indian data protection compliance
- **Financial Security**: Bank-grade security for payroll data

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Supabase project with configured database
- Google AI API key
- Virtual environment (recommended)

### Installation

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv payroll_env
   payroll_env\Scripts\activate  # Windows
   # source payroll_env/bin/activate  # Linux/Mac
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration:**
   Create `.env` file:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key

   # AI Configuration
   GEMINI_API_KEY=your_gemini_api_key

   # Application Settings
   ENVIRONMENT=development
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001

   # Security (optional - defaults provided)
   JWT_SECRET_KEY=your-secret-key
   ```

5. **Start development server:**
   ```bash
   uvicorn app.main:app --reload
   ```

### API Documentation
Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## 📊 Data Models & Schemas

### Core Entities
- **Employees**: Profile, salary structure, leave balances
- **Payrolls**: Processing runs with payslip generation
- **Payslips**: Individual payment records with PDF storage
- **Leave Requests**: Time-off management with approval workflow

### API Request/Response Models
- **ChatRequest/Response**: AI conversation handling
- **PayslipExplainRequest**: Streaming AI payslip analysis
- **PayrollAnalysisRequest/Response**: Anomaly detection results
- **ProcessPayrollRequest/Response**: Bulk payroll processing

## 🤖 AI Features Explained

### Intelligent Context Awareness
The AI assistant automatically:
- **Fetches Relevant Data**: Retrieves payslip history, leave balances, company policies
- **Maintains Privacy**: Sanitizes all sensitive information before processing
- **Provides Personalized Advice**: Tailored responses based on user role and data
- **Offers Tax Guidance**: Indian tax law compliant suggestions with disclaimers

### Streaming Response Technology
- **Server-Sent Events**: Real-time message delivery
- **Chunked Processing**: Efficient memory usage for long responses
- **Error Handling**: Graceful degradation with user-friendly messages
- **Connection Management**: Automatic cleanup and timeout handling

### Anomaly Detection
- **Statistical Analysis**: Identifies unusual payroll patterns
- **Comparative Metrics**: Month-over-month change detection
- **Risk Assessment**: Severity classification (low/medium/high)
- **Actionable Insights**: Specific recommendations for anomalies

## 🔧 Development Workflow

### Code Quality Standards
- **Type Hints**: Comprehensive Python typing throughout
- **Pydantic Models**: Strict data validation and serialization
- **Error Handling**: Proper exception management with logging
- **Documentation**: Detailed docstrings for all functions

### Testing Strategy
- **Unit Tests**: Individual function and service testing
- **Integration Tests**: API endpoint validation
- **AI Testing**: Prompt engineering and response quality validation
- **Security Testing**: Authentication and authorization verification

### Database Migrations
- **Supabase Dashboard**: Schema changes via web interface
- **Version Control**: Migration files tracked in repository
- **Data Integrity**: Foreign key constraints and validation rules

## 📈 Performance & Monitoring

### Optimization Features
- **Async Processing**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Response caching for frequently accessed data
- **Resource Limits**: Configurable rate limiting and timeouts

### Monitoring & Logging
- **Structured Logging**: JSON-formatted logs with context
- **Health Checks**: `/health` endpoint for service monitoring
- **Performance Metrics**: Response times and error rates
- **AI Usage Tracking**: Token consumption and API call monitoring

## 🚀 Deployment

### Production Setup
1. **Environment Variables**: Configure production Supabase and AI credentials
2. **Database Setup**: Run Supabase migrations and seed data
3. **SSL Configuration**: Enable HTTPS with proper certificates
4. **Monitoring**: Set up logging and alerting systems

### Docker Deployment (Optional)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Scaling Considerations
- **Horizontal Scaling**: Stateless design supports multiple instances
- **Database Optimization**: Indexing strategy for performance
- **AI Rate Limiting**: API quota management and fallback strategies
- **Caching Layer**: Redis integration for session and response caching

## 🔒 Security Best Practices

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Access Control**: Principle of least privilege implementation
- **Audit Logging**: Complete audit trail of all system activities
- **Regular Updates**: Dependencies kept current with security patches

### API Security
- **Input Validation**: All inputs validated against strict schemas
- **Rate Limiting**: Protection against abuse and DoS attacks
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Error Handling**: Generic error messages to prevent information leakage

## 📋 API Usage Examples

### AI Chat with Context
```python
import requests

response = requests.post("http://localhost:8000/api/v1/chat/stream", json={
    "intent": "payslip_explain",
    "payslip_id": "uuid-here",
    "query": "Why did my salary decrease?",
    "chat_history": [
        {"role": "user", "content": "Explain my payslip"},
        {"role": "assistant", "content": "Your payslip shows..."}
    ]
}, headers={"Authorization": "Bearer <token>"})
```

### Payroll Processing
```python
response = requests.post("http://localhost:8000/api/v1/payroll/process-payroll", json={
    "company_id": "company-uuid",
    "pay_period_start": "2024-01-01T00:00:00Z",
    "pay_period_end": "2024-01-31T23:59:59Z",
    "created_by": "admin-uuid"
}, headers={"Authorization": "Bearer <admin-token>"})
```

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow PEP 8 with Black formatting
2. **Type Safety**: Use modern Python typing throughout
3. **Documentation**: Comprehensive docstrings and API documentation
4. **Testing**: Write tests for new features and bug fixes

### Pull Request Process
1. **Branch Naming**: `feature/`, `bugfix/`, `hotfix/` prefixes
2. **Code Review**: All changes require review and approval
3. **CI/CD**: Automated testing and deployment pipelines
4. **Documentation**: Update README and API docs for changes

## 📈 Future Roadmap

### Planned Enhancements
- **Advanced AI Features**: Predictive analytics and automated recommendations
- **Multi-currency Support**: International payroll processing
- **Integration APIs**: Third-party HR system connections
- **Mobile SDK**: Native mobile application support
- **Advanced Reporting**: Custom dashboard and analytics features

### Technical Improvements
- **GraphQL API**: More flexible data fetching capabilities
- **Event Streaming**: Real-time notifications and updates
- **Machine Learning**: Advanced anomaly detection algorithms
- **Microservices**: Service decomposition for better scalability

---

**Payroll AI Backend** - Powering intelligent payroll management with AI-driven insights and automated processing for modern Indian businesses.
