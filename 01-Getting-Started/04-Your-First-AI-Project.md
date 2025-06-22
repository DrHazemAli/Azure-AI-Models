# Lesson 4: Your First AI Project

Welcome to your first hands-on AI project! In this lesson, we'll build a simple text analyzer that combines multiple Azure AI services to detect language, analyze sentiment, and extract key phrases.

## What You'll Build

A text analyzer application that:
- Detects the language of input text
- Analyzes sentiment (positive, negative, neutral)
- Extracts key phrases and important information
- Works across multiple programming languages

## Prerequisites

- ✅ Active Azure subscription
- ✅ Azure AI Language service created
- ✅ API key and endpoint ready
- ✅ Development environment set up

## Project Overview

Our text analyzer follows this flow:
```
Text Input → Language Detection → Sentiment Analysis → Key Phrase Extraction → Results
```

This teaches you how to:
- Chain AI services together
- Handle API responses
- Build user-friendly applications

## Implementation Examples

### Python Version
See the complete Python implementation in `/Code-Samples/Python/01-Getting-Started/first_ai_project.py`

Key features:
- Environment variable configuration
- Error handling and validation
- Interactive user input
- Formatted output with emojis

### JavaScript Version
See the complete JavaScript implementation in `/Code-Samples/JavaScript/01-Getting-Started/first-ai-project.js`

Key features:
- Async/await patterns
- Promise-based API calls
- Readline interface for user interaction

### C# Version
See the complete C# implementation in `/Code-Samples/CSharp/01-Getting-Started/FirstAIProject.cs`

Key features:
- Task-based async programming
- Strong typing with Azure SDK
- Console application structure

## Running Your Project

1. **Set Environment Variables**:
   ```bash
   # Windows
   set AZURE_LANGUAGE_ENDPOINT=your-endpoint-here
   set AZURE_LANGUAGE_KEY=your-key-here
   
   # macOS/Linux
   export AZURE_LANGUAGE_ENDPOINT=your-endpoint-here
   export AZURE_LANGUAGE_KEY=your-key-here
   ```

2. **Install Dependencies**:
   ```bash
   # Python
   pip install azure-ai-textanalytics
   
   # JavaScript
   npm install @azure/ai-text-analytics
   
   # C#
   dotnet add package Azure.AI.TextAnalytics
   ```

3. **Run Your Project**:
   ```bash
   # Python
   python first_ai_project.py
   
   # JavaScript  
   node first-ai-project.js
   
   # C#
   dotnet run
   ```

## Understanding Results

Sample output:
```
🌍 Language: English (Confidence: 1.00)
😊 Sentiment: positive
   Positive: 0.89
   Neutral: 0.10
   Negative: 0.01
🔑 Key Phrases: Azure AI services, intelligent applications
```

## Common Issues & Solutions

### Authentication Errors
- Double-check endpoint and key
- Verify environment variables
- Ensure service is active

### Rate Limiting
- Add delays between requests
- Monitor free tier limits
- Consider paid tier for production

### Network Issues
- Check internet connection
- Verify firewall settings
- Retry after delays

## Experiments to Try

1. **Different Languages**: Test with French, Spanish, Japanese text
2. **Various Sentiments**: Try positive, negative, neutral examples
3. **Complex Text**: Analyze longer, technical content

## Next Steps

Extend your project with:
- **File Processing**: Analyze text from files
- **Batch Analysis**: Process multiple texts
- **Web Interface**: Create a simple web UI
- **Named Entity Recognition**: Identify people, places, organizations

## What You've Learned

✅ Built a complete AI application from scratch
✅ Used multiple AI services in one project  
✅ Handled API responses and errors
✅ Created user-friendly output
✅ Learned AI development best practices

## Key Takeaways

1. **Start Simple**: Begin with basic functionality
2. **Chain Services**: Combine AI services for richer insights
3. **Handle Errors**: Always include error handling
4. **Test Thoroughly**: Try different input types
5. **Focus on UX**: Make applications easy to use

---

*Congratulations! You've built your first AI project. This is just the beginning of your AI development journey!* 🚀

## References

[1] Azure AI Language Service - https://docs.microsoft.com/en-us/azure/cognitive-services/language-service/
[2] Text Analytics API - https://docs.microsoft.com/en-us/rest/api/language/
[3] Azure AI Best Practices - https://docs.microsoft.com/en-us/azure/cognitive-services/
[4] Azure AI Training Path - https://learn.microsoft.com/en-us/training/paths/get-started-azure-ai/ 