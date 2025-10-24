# AI-Powered Employee Assistant

This document describes the contextual AI assistant features for employees in the Payroll Management System.

## Overview

The AI assistant provides intelligent, context-aware help for employees across three key areas:
1. **Leave Management** - Advice on leave requests, balance, and impact
2. **Payslip Analysis** - Detailed explanations, comparisons, and tax-saving suggestions
3. **Dashboard Insights** - Personalized insights about compensation and benefits

## Features

### 1. Leave Request Assistant

**Location**: Leave page, Request Leave Dialog

**Capabilities**:
- Calculate exact days for leave requests (including weekends)
- Explain paid vs unpaid leave impact on salary
- Estimate salary deductions for unpaid leaves
- Check leave balance availability
- Suggest optimal leave dates considering holidays
- Improve reason phrasing for better approval chances

**Suggested Prompts**:
- "How will this leave request affect my balance?"
- "Will this leave be deducted from my salary?"
- "How many days will this request use?"
- "Are there any holidays during these dates?"
- "Suggest a better reason for approval"

**Context Sent to AI**:
- Employee ID
- Requested start/end dates
- Leave type (paid/unpaid)
- Current leave balance
- Recent leave history (last 5 requests)
- Company leave periods (holidays)

---

### 2. Payslip Explanation Assistant

**Location**: Payslips page (click ✨ icon next to each payslip)

**Capabilities**:
- Break down earnings and deductions in simple terms
- Compare with previous month's payslip
- Explain why net pay changed
- Identify unusual deductions
- Provide India-specific tax-saving suggestions (80C, 80D, HRA, NPS, etc.)
- Estimate tax savings for common deductions
- Suggest required documentation for ITR filing

**Suggested Prompts**:
- "Explain this payslip in simple terms"
- "Why is my net pay different from last month?"
- "Break down my deductions"
- "How can I reduce my tax liability?"
- "What documents do I need for ITR filing?"

**Context Sent to AI**:
- Current payslip (all financial data)
- Previous payslip for comparison
- Salary structure
- Leave deductions (if any)

**India Tax Guidance Included**:
- Section 80C: PPF, ELSS, life insurance, home loan principal
- Section 80D: Health insurance premium (₹25k-₹50k)
- Section 80E: Education loan interest (no limit)
- HRA: House rent allowance exemption
- Section 80CCD(1B): NPS contributions (additional ₹50k)
- Standard Deduction: ₹50,000 for salaried
- Section 192: TDS on salary

---

### 3. Dashboard Insights Assistant

**Location**: Employee Dashboard (AI Insights card)

**Capabilities**:
- Explain latest payslip changes
- Summarize year-to-date earnings
- Provide leave balance insights
- Suggest tax-saving opportunities
- Identify trends in compensation

**Suggested Prompts**:
- "Explain my latest payslip"
- "Why did my net pay change?"
- "How can I save on taxes?"
- "What are my leave balances?"
- "Show me my year-to-date earnings"

**Context Sent to AI**:
- Latest payslip
- Previous payslips (up to 3)
- Leave balance
- Recent leave history

---

## Technical Implementation

### Backend (FastAPI + Gemini 2.0 Flash)

#### Key Files:
- `backend/app/services/ai_templates.py` - Prompt templates and sanitization
- `backend/app/services/gemini_service.py` - Gemini AI integration (2.0 Flash)
- `backend/app/api/v1/endpoints/chat.py` - Chat endpoint with intent routing

#### API Endpoint:
```http
POST /api/v1/chat/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "Explain this payslip",
  "intent": "payslip_explain",
  "context": {
    "page_view": "payslip",
    "payslip_id": "uuid"
  },
  "chat_history": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous answer"}
  ]
}
```

#### Supported Intents:
- `payslip_explain` - Detailed payslip analysis
- `leave_advice` - Leave request guidance
- `payslip_tax_suggestions` - India tax-saving tips
- `dashboard_insights` - General compensation insights

#### Context Enrichment:
The backend automatically fetches relevant data based on intent:
- **payslip_explain**: Fetches current & previous payslip from DB
- **leave_advice**: Fetches leave balance, history, and company leave periods
- **dashboard_insights**: Fetches recent payslips and leave data

#### Security & Privacy:
- **No server-side logs** stored (user requested NO ai_requests table)
- **Sanitization**: Removes bank accounts, PAN, Aadhaar, tax IDs, tokens
- **Authorization**: Only employees can access their own data
- **Disclaimers**: All tax/legal advice includes strong disclaimers

---

### Frontend (Next.js + React)

#### Key Components:
- `frontend/src/components/ai/ai-assistant.tsx` - Reusable AI modal
- `frontend/src/components/dashboard-ai-helper.tsx` - Dashboard AI card
- `frontend/src/components/payslips-ai-helper.tsx` - Payslips info banner
- `frontend/src/components/request-leave-dialog.tsx` - Leave dialog with AI
- `frontend/src/components/download-payslip-button.tsx` - Payslip actions

#### AI Assistant Modal Features:
- Conversational chat interface
- Message history (last 5 messages sent with each request)
- Suggested prompt chips for quick questions
- Auto-scroll to latest message
- Loading states and error handling
- Shift+Enter for multiline, Enter to send

---

## User Experience Flow

### Scenario 1: Employee Requests Leave

1. Employee opens Request Leave dialog
2. Fills in dates and leave type
3. Sees "Need help with your leave request?" card
4. Clicks "Ask AI"
5. AI modal opens with suggested prompts
6. Selects "How will this affect my balance?"
7. AI fetches leave balance and calculates impact
8. Response explains: days used, salary impact, balance remaining

### Scenario 2: Employee Views Payslip

1. Employee navigates to Payslips page
2. Sees AI info banner explaining ✨ icon
3. Clicks ✨ next to a payslip
4. AI modal opens pre-loaded with payslip context
5. Clicks "Why is my net pay different from last month?"
6. AI fetches current + previous payslip
7. Response shows: comparison table, reasons for change, tax tips

### Scenario 3: Employee Checks Dashboard

1. Employee views Dashboard
2. Sees AI Insights card with ✨ icon
3. Clicks "Ask AI Assistant"
4. AI modal opens with dashboard context
5. Asks "How can I save on taxes?"
6. AI analyzes salary structure and suggests:
   - Invest ₹1.5L in 80C (save ~₹46,800)
   - Health insurance ₹25k in 80D (save ~₹7,800)
   - NPS ₹50k in 80CCD(1B) (save ~₹15,600)
   - Required documents for each

---

## Configuration

### Environment Variables (Backend)

```bash
# .env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### Model Configuration

The system uses **Gemini 2.0 Flash** for:
- Fast response times (<2s average)
- Cost-effective token usage
- Good balance of accuracy and speed

Generation parameters:
```python
{
    "temperature": 0.7,  # Balanced creativity
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 2048
}
```

---

## Testing

### Manual Testing Steps

1. **Start Backend**:
   ```bash
   cd backend
   .\payroll\Scripts\Activate.ps1
   python -m uvicorn app.main:app --reload --port 8000
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   pnpm dev
   ```

3. **Test Leave Assistant**:
   - Login as employee
   - Go to Leave page
   - Click "Request Leave"
   - Fill dates and click "Ask AI"
   - Try suggested prompts

4. **Test Payslip Assistant**:
   - Go to Payslips page
   - Click ✨ icon next to any payslip
   - Try "Explain this payslip"
   - Try "How can I reduce taxes?"

5. **Test Dashboard Assistant**:
   - Go to Dashboard
   - Click "Ask AI Assistant" in AI Insights card
   - Try suggested prompts

### API Testing (curl)

```bash
# Get session token from browser DevTools (Application > Cookies > sb-access-token)

curl -X POST http://localhost:8000/api/v1/chat/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "Explain my latest payslip",
    "intent": "payslip_explain",
    "context": {
      "page_view": "payslip"
    }
  }'
```

---

## Limitations & Disclaimers

### AI Limitations:
- AI responses are informational only, not financial/legal advice
- Tax suggestions are high-level; consult a CA for personalized advice
- Calculations are estimates; actual amounts may vary
- Model may occasionally provide incorrect information

### Privacy Limitations:
- No conversation history stored server-side
- Each session starts fresh (no learning from previous users)
- Context limited to current request + last 5 messages

### Data Limitations:
- AI only sees data from current employee's records
- Cannot access other employees' data
- Cannot make predictions about future payroll changes

---

## Future Enhancements

1. **Voice Input**: Allow voice questions via Web Speech API
2. **Multi-language**: Support Hindi, Tamil, Telugu translations
3. **PDF Generation**: Generate AI-powered salary breakdowns as PDF
4. **Proactive Insights**: Auto-notify about tax-saving opportunities
5. **Comparison Analytics**: "Compare my salary with similar roles"
6. **Investment Suggestions**: Link to specific investment platforms
7. **Document OCR**: Upload rent receipts for HRA calculation
8. **ITR Integration**: Auto-fill ITR forms with payslip data

---

## Support & Troubleshooting

### Common Issues:

**AI not responding**:
- Check GEMINI_API_KEY is set in backend/.env
- Verify backend is running on port 8000
- Check browser console for fetch errors

**"Authentication required" error**:
- Ensure user is logged in
- Check session token is valid
- Verify Authorization header is sent

**Wrong data in AI response**:
- Check employee_id in context
- Verify payslip_id is correct
- Check backend logs for data fetch errors

**Slow responses**:
- Gemini 2.0 Flash should respond in <2s
- Check network latency
- Verify API key quota isn't exceeded

---

## Contact

For questions or issues:
- Backend: Check `backend/app/services/ai_templates.py` for prompt templates
- Frontend: Check `frontend/src/components/ai/ai-assistant.tsx` for UI logic
- API: Check `backend/app/api/v1/endpoints/chat.py` for endpoint logic

---

**Last Updated**: October 24, 2025
**Version**: 1.0.0
**Model**: Gemini 2.0 Flash (gemini-2.0-flash-exp)
