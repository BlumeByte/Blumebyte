# AI Assistant Implementation Guide

## Overview
The HR AI Assistant is powered by Google Gemini and provides instant help to employees with HR-related questions across all dashboards.

## Features

### 🤖 Intelligent HR Support
- **Policy Questions**: Vacation policies, leave requests, benefits
- **Process Guidance**: Time tracking, onboarding, training
- **General HR Help**: Performance reviews, compensation, attendance
- **Context-Aware**: Maintains conversation history for follow-up questions

### 🎨 User Interface
- **Floating Button**: Accessible from any page via a gradient sparkle button (bottom-right)
- **Chat Panel**: Beautiful card-based chat interface with message history
- **Quick Prompts**: Pre-built questions for common inquiries
- **Responsive Design**: Works on desktop and mobile devices

### 🔐 Security
- **Authentication Required**: Only authenticated users can access the assistant
- **Role-Based**: Available to all user roles (Employee, Manager, Admin, SuperAdmin)
- **Privacy**: Conversations are not stored permanently
- **API Key Protection**: Gemini API key stored securely in environment variables

## Setup Instructions

### 1. Get Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variable
The system has already prompted you to add your `GEMINI_API_KEY`. If you need to update it:
1. Go to your Supabase project dashboard
2. Navigate to Project Settings → Edge Functions → Secrets
3. Add/update `GEMINI_API_KEY` with your API key

### 3. Test the Assistant
1. Log in to the HR system
2. Look for the sparkle button (✨) in the bottom-right corner
3. Click to open the chat panel
4. Try asking: "What is the company's vacation policy?"

## Usage Examples

### Common Questions
```
💼 "What is the vacation policy?"
🏖️ "How do I request time off?"
✨ "What benefits are available?"
⏰ "How does time tracking work?"
📚 "What training programs are offered?"
📊 "How are performance reviews conducted?"
```

### Features
- **New Chat**: Start a fresh conversation anytime
- **Message History**: Last 10 messages sent for context
- **Loading States**: Visual feedback while AI processes
- **Error Handling**: Graceful error messages if API fails
- **Timestamps**: Each message shows send time

## Technical Details

### Frontend Component
- **File**: `/components/HRAIAssistant.tsx`
- **Framework**: React with Motion animations
- **UI Components**: shadcn/ui (Card, Button, Input, ScrollArea)
- **State Management**: React hooks (useState, useRef, useEffect)

### Backend Endpoint
- **Route**: `POST /make-server-a35148f0/ai-assistant`
- **File**: `/supabase/functions/server/index.tsx`
- **AI Model**: Google Gemini 1.5 Flash
- **Context Window**: Last 10 messages
- **Max Tokens**: 1024 per response

### System Prompt
The AI is configured with a specialized HR assistant prompt that:
- Focuses on SAS Finance Group HR topics
- Provides professional, empathetic responses
- Acknowledges limitations and suggests HR contact when needed
- Uses clear, concise language with bullet points

## Customization

### Modify AI Behavior
Edit the system prompt in `/supabase/functions/server/index.tsx`:
```typescript
const systemPrompt = `You are an AI assistant for SAS Finance Group...`;
```

### Change Appearance
Customize the button and panel in `/components/HRAIAssistant.tsx`:
- Button colors: `bg-gradient-to-r from-blue-600 to-purple-600`
- Panel size: `w-96` (384px wide)
- Chat height: `h-[400px]`

### Add Quick Prompts
Add more preset questions in the empty state section:
```typescript
<button onClick={() => setInput("Your question here")}>
  🎯 Your prompt text
</button>
```

## API Limits

### Google Gemini Free Tier
- **Rate Limit**: 60 requests per minute
- **Daily Quota**: Check your API dashboard
- **Cost**: Free tier available, paid plans for higher usage

### Recommendations
- Monitor usage in Google AI Studio
- Implement rate limiting if needed
- Consider upgrading to paid tier for production

## Troubleshooting

### "AI Assistant is not configured"
- **Cause**: GEMINI_API_KEY not set
- **Solution**: Add the environment variable in Supabase

### "Failed to get AI response"
- **Cause**: Network error or API rate limit
- **Solution**: Check console logs, verify API key, check quota

### Button not appearing
- **Cause**: JavaScript error or auth issue
- **Solution**: Check browser console for errors

### Slow responses
- **Cause**: API latency or large context
- **Solution**: Normal for AI processing, consider reducing context window

## Best Practices

### For Employees
1. Ask clear, specific questions
2. Use the quick prompts for common questions
3. Start a new chat if changing topics
4. Contact HR directly for urgent matters

### For Administrators
1. Monitor API usage and costs
2. Update system prompt based on feedback
3. Add company-specific policies to the prompt
4. Train employees on effective AI assistant usage

## Future Enhancements

### Potential Features
- [ ] Integration with company policy documents
- [ ] User-specific responses based on role/department
- [ ] Chat history persistence
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Analytics on common questions
- [ ] Integration with knowledge base

## Support
For technical issues or feature requests, contact the development team or check the main documentation.

---

**Version**: 1.0  
**Last Updated**: March 13, 2026  
**AI Model**: Google Gemini 1.5 Flash  
**Status**: ✅ Active
