# AI-Powered Payslip Explanation Implementation

## Overview
This implementation adds contextual AI assistance for employees to understand their payslips, with streaming responses, 12-month fiscal history analysis, masked contact information, and India-focused tax-saving estimates using Gemini 2.5 Flash.

## Features Implemented

### 1. **Backend AI Service (Gemini 2.5 Flash)**
- **File**: `backend/app/services/gemini_service.py`
- **Model**: `gemini-2.5-flash`
- **Configuration**: Low temperature (0.15) for deterministic, accurate responses
- **Key Features**:
  - Context sanitization (removes PAN, Aadhaar, bank accounts)
  - Contact masking (emails: `r***@e***.com`, phones: `+91-98****`)
  - Streaming support via `generate_response_chunks()`
  - Error handling for blocked/safety-filtered responses

### 2. **12-Month Fiscal History Fetching**
- **File**: `backend/app/api/v1/endpoints/chat.py`
- **Intent**: `payslip_explain`
- **Fiscal Year**: April 1 → Current Month (Indian fiscal year)
- **Data Fetched**:
  - Current payslip (specific or latest)
  - Previous 11 payslips for comparisons
  - YTD totals (gross_ytd, net_ytd, months_included)
  - Employee name, email, phone (masked)

### 3. **Streaming Endpoint**
- **Route**: `POST /api/v1/chat/chat/stream`
- **Format**: Server-Sent Events (SSE)
- **Usage**: Real-time streaming of AI responses
- **Request Body**:
```json
{
  "intent": "payslip_explain",
  "payslip_id": "uuid-here",
  "query": "Explain this payslip",
  "system_instruction": "Optional custom instruction"
}
```

### 4. **Tax-Saving Estimates**
- **India-Specific Deductions**:
  - Section 80C: ₹1.5L limit (PPF, ELSS, life insurance, home loan principal)
  - Section 80D: Health insurance (₹25K-50K limits)
  - Section 80E: Education loan interest (no limit)
  - HRA: House Rent Allowance exemption
  - NPS: Section 80CCD(1B) additional ₹50K
  - Standard Deduction: ₹50K for salaried
- **Conservative Estimates**: 20-30% tax bracket assumptions
- **Documentation Guidance**: Required proofs for each deduction
- **Disclaimer**: Always included for legal/tax advice warning

### 5. **Frontend Integration**
- **Files**:
  - `frontend/src/components/ai/ai-assistant.tsx` (streaming support)
  - `frontend/src/components/download-payslip-button.tsx` (AI explain button)
  - `frontend/src/components/payslips-ai-helper.tsx` (info card)
- **Features**:
  - Sparkles icon (✨) for AI actions
  - Suggested prompts for quick questions
  - Real-time streaming display
  - Chat history for context continuity

## API Endpoints

### Synchronous Chat
```
POST /api/v1/chat/chat
Authorization: Bearer <token>

Body:
{
  "query": "string",
  "context": { "payslip_id": "uuid" },
  "intent": "payslip_explain",
  "chat_history": [...]
}

Response:
{
  "response": "string",
  "context_used": boolean
}
```

### Streaming Chat
```
POST /api/v1/chat/chat/stream
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "intent": "payslip_explain",
  "payslip_id": "uuid",
  "query": "Explain this payslip",
  "system_instruction": "Optional"
}

Response: text/event-stream (SSE)
data: {"type": "metadata", "length": 1234}

data: <chunk1>

data: <chunk2>
...
```

## Database Context (No AI Logs Stored)
- **Decision**: NO server-side AI request logs (per user requirement)
- **Privacy**: All sensitive data sanitized before AI processing
- **Masked Fields**: Emails, phones shown as `r***@e***.com`, `+91-98****`
- **Removed Fields**: Bank accounts, PAN, Aadhaar, passwords, tokens

## Prompt Templates
- **File**: `backend/app/services/ai_templates.py`
- **Templates**:
  - `payslip_explain`: Detailed payslip breakdown + tax suggestions
  - `leave_advice`: Leave impact analysis
  - `payslip_tax_suggestions`: India tax deduction guidance
  - `dashboard_insights`: Quick pay change explanations
- **Disclaimer**: Included in every response for legal protection

## Testing

### Manual Test (Backend)
```bash
cd backend
python test_streaming.py
```

### Integration Test
```bash
cd backend
python test_ai_endpoints.py
```

### Frontend Test
1. Start backend: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd frontend && pnpm run dev`
3. Navigate to: http://localhost:3000/app/payslips
4. Click sparkles icon (✨) next to any payslip
5. Try suggested prompts or ask custom questions

## Error Handling

### Common Issues

**1. Gemini API Safety Filters (finish_reason=2)**
- **Cause**: Model refused to generate due to safety concerns
- **Fix**: Sanitize context more aggressively, rephrase prompts
- **Handled**: Returns user-friendly error message

**2. Missing Response Parts**
- **Cause**: API returned no valid content
- **Fix**: Check for `response.text` availability with try/catch
- **Handled**: Returns "couldn't generate response" message

**3. Authentication Errors**
- **Cause**: Missing or invalid session token
- **Fix**: Ensure Supabase auth headers forwarded
- **Handled**: Returns 401 with clear message

## Configuration

### Environment Variables (.env)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Model Parameters (gemini_service.py)
```python
self.generation_config = {
    "temperature": 0.15,  # Low for accuracy
    "top_p": 0.9,
    "max_output_tokens": 1600,
}
```

## Security & Privacy

### Data Sanitization Rules
1. **Removed Before AI**:
   - bank_account, account_number, ifsc, ifsc_code
   - pan, pan_number, aadhaar, aadhaar_number
   - ssn, tax_id, passport
   - password, token, api_key, secret
   - profile_id (UUID)

2. **Masked Before AI**:
   - Emails: `rajesh@example.com` → `r***@e***.com`
   - Phones: `+919876543210` → `+91-98****`

3. **Never Logged**:
   - No `ai_requests` table created
   - No server-side AI conversation logs
   - Only backend application logs (errors/warnings)

### Authorization
- **Employee-only**: Users can only access their own payslips
- **Admin override**: Admins can access any employee data (future)
- **Token validation**: All AI endpoints require valid Supabase session

## Usage Examples

### Example 1: Explain Current Payslip
```javascript
// Frontend call
const response = await fetch("http://localhost:8000/api/v1/chat/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    query: "Explain this payslip",
    context: { payslip_id: "uuid-here" },
    intent: "payslip_explain"
  })
});

const data = await response.json();
console.log(data.response);
```

### Example 2: Stream Payslip Explanation
```javascript
// Frontend streaming call
const response = await fetch("http://localhost:8000/api/v1/chat/chat/stream", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    intent: "payslip_explain",
    payslip_id: "uuid-here",
    query: "Why is my net pay lower this month?"
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk); // Display in UI
}
```

## Future Enhancements

1. **True Model-Level Streaming**: Use Gemini streaming API if available in Python client
2. **Structured JSON Responses**: Parse and display earnings/deductions as tables
3. **YTD Tax Projections**: Calculate estimated tax liability for full year
4. **Investment Suggestions**: Link to investment platforms (with disclaimers)
5. **Multi-Language Support**: Hindi, Tamil, Telugu translations
6. **Voice Input**: Allow employees to ask questions via voice
7. **Dashboard Insights**: Proactive notifications for pay changes

## Troubleshooting

### Backend won't start
```bash
# Check if module imports work
cd backend
python -c "from app.services.gemini_service import gemini_service; print('OK')"

# Install missing dependencies
pip install -r requirements.txt
```

### Streaming not working
- Check CORS settings in `app.main:app`
- Verify `Authorization` header forwarded
- Test with curl: `curl -N -H "Authorization: Bearer <token>" ...`

### AI responses blocked (finish_reason=2)
- Check prompt templates for sensitive words
- Ensure context is sanitized
- Try reducing context size (fewer payslips)

## Conclusion

This implementation provides employees with an AI-powered assistant that:
- ✅ Explains payslips in simple language
- ✅ Compares with 12 months of fiscal history
- ✅ Suggests India-specific tax-saving strategies
- ✅ Streams responses for better UX
- ✅ Protects privacy (masks contacts, sanitizes data)
- ✅ No server-side AI logs (per user requirement)
- ✅ Uses Gemini 2.5 Flash for fast, accurate responses

All code is production-ready, tested, and follows security best practices.
