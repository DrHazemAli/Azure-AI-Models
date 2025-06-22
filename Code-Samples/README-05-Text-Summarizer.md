# Azure AI Language Text Summarizer - Code Samples

This directory contains comprehensive code samples for **Lesson 5: Build a Text Summarizer** from the Azure AI Models course. Learn how to build powerful text summarization applications using Azure AI Language services with support for extractive summarization, abstractive summarization, and conversation summarization.

## 🚀 Quick Start

### Prerequisites

- Azure subscription with Azure AI Language service
- Azure AI Language service endpoint and API key
- Development environment set up for your preferred language

### Environment Setup

Create a `.env` file in your project root:

```env
AZURE_LANGUAGE_ENDPOINT=https://your-service.cognitiveservices.azure.com/
AZURE_LANGUAGE_KEY=your-api-key-here
```

### Installation

#### Python
```bash
pip install azure-ai-textanalytics azure-core aiohttp requests python-dotenv
python Code-Samples/Python/02-Text-and-Language/05-text-summarizer.py
```

#### JavaScript/Node.js
```bash
npm install @azure/ai-language-text axios readline
node Code-Samples/JavaScript/02-Text-and-Language/05-text-summarizer.js
```

#### C#
```bash
dotnet add package Azure.AI.TextAnalytics
dotnet add package System.Text.Json
dotnet run --project Code-Samples/CSharp/02-Text-and-Language/05-text-summarizer.cs
```

#### REST API
Use VS Code with REST Client extension or any HTTP client:
```http
# Open Code-Samples/REST/02-Text-and-Language/05-text-summarizer.http
# Replace {{AZURE_LANGUAGE_ENDPOINT}} and {{AZURE_LANGUAGE_KEY}} with your values
```

## 📋 Features

### Core Capabilities

- **Extractive Summarization**: Extract key sentences from text while preserving original wording
- **Abstractive Summarization**: Generate new summary text that captures the main ideas
- **Conversation Summarization**: Summarize customer service calls, meetings, and conversations
- **Batch Processing**: Process multiple documents efficiently
- **Real-time Analysis**: Interactive command-line interfaces
- **Error Handling**: Comprehensive retry logic and error management
- **Performance Monitoring**: Track usage statistics and costs

### Advanced Features

- **Multiple Summary Lengths**: Short, medium, and long summaries
- **Ranking Options**: Sort by relevance rank or document offset
- **Conversation Aspects**: Issue, resolution, recap, and narrative summaries
- **Multi-language Support**: Process text in multiple languages
- **Rate Limiting**: Built-in handling for API rate limits
- **Cost Tracking**: Monitor character usage and estimated costs

## 🎯 Use Cases

### Business Applications

1. **News and Media**
   - Article summarization for news feeds
   - Content curation and aggregation
   - Social media post generation

2. **Customer Service**
   - Call center conversation summaries
   - Support ticket analysis
   - Customer feedback processing

3. **Legal and Compliance**
   - Contract and document summarization
   - Legal brief generation
   - Regulatory document analysis

4. **Research and Academia**
   - Research paper abstracts
   - Literature review summaries
   - Academic content curation

5. **Corporate Communications**
   - Meeting minutes generation
   - Email thread summaries
   - Report executive summaries

### Technical Integration

- **Content Management Systems**: Automatic content summarization
- **Knowledge Bases**: FAQ and documentation summaries
- **Analytics Platforms**: Text data insights and reporting
- **Chatbots and Virtual Assistants**: Context understanding
- **Document Processing Pipelines**: Automated content extraction

## 🔧 Configuration Options

### Extractive Summarization Parameters

```python
# Python example
result = await summarizer.extractive_summarization(
    text="Your text here",
    sentence_count=3,        # 1-20 sentences
    sort_by="Rank"          # "Rank" or "Offset"
)
```

### Abstractive Summarization Parameters

```javascript
// JavaScript example
const result = await summarizer.abstractiveSummarization(
    text,
    "medium"  // "short", "medium", or "long"
);
```

### Conversation Summarization Parameters

```csharp
// C# example
var result = await summarizer.ConversationSummarizationAsync(
    conversationItems,
    new List<string> { "issue", "resolution", "recap" }
);
```

## 📊 Performance Optimization

### Best Practices

1. **Batch Processing**: Process multiple documents together for better throughput
2. **Caching**: Store frequently accessed summaries to reduce API calls
3. **Text Preprocessing**: Clean and optimize text before summarization
4. **Appropriate Length**: Choose optimal sentence counts for your use case
5. **Error Handling**: Implement robust retry mechanisms

### Rate Limiting

- **Standard Tier**: 1000 requests per minute
- **Free Tier**: 20 requests per minute
- **Character Limits**: 125,000 characters per document
- **Batch Limits**: Up to 25 documents per request

### Cost Optimization

- Monitor character usage with built-in tracking
- Use extractive summarization for cost-effective processing
- Implement caching for frequently summarized content
- Choose appropriate summary lengths to minimize processing

## 🛠️ Code Examples

### Python - Basic Extractive Summarization

```python
import asyncio
from azure_text_summarizer import AzureTextSummarizer

async def main():
    summarizer = AzureTextSummarizer()
    
    text = """
    Your long text here...
    """
    
    result = await summarizer.extractive_summarization(
        text=text,
        sentence_count=3,
        sort_by="Rank"
    )
    
    print(f"Summary: {result.summary_text}")
    print(f"Processing time: {result.processing_time:.2f}s")

if __name__ == "__main__":
    asyncio.run(main())
```

### JavaScript - Conversation Summarization

```javascript
const { AzureTextSummarizer } = require('./05-text-summarizer');

async function summarizeConversation() {
    const summarizer = new AzureTextSummarizer();
    
    const conversation = [
        { text: "Hello, I need help with my account", role: "Customer" },
        { text: "I can help you with that. What's the issue?", role: "Agent" },
        // ... more conversation items
    ];
    
    const result = await summarizer.conversationSummarization(conversation);
    
    console.log(`Issue: ${result.issue}`);
    console.log(`Resolution: ${result.resolution}`);
}

summarizeConversation().catch(console.error);
```

### C# - Batch Processing

```csharp
using AzureAI.TextSummarizer;

class Program
{
    static async Task Main(string[] args)
    {
        var summarizer = new AzureTextSummarizer();
        
        var documents = new List<string>
        {
            "Document 1 text...",
            "Document 2 text...",
            "Document 3 text..."
        };
        
        var results = await summarizer.BatchSummarizationAsync(
            documents, 
            "extractive",
            new Dictionary<string, object> { { "sentenceCount", 2 } }
        );
        
        foreach (var result in results)
        {
            Console.WriteLine($"Summary: {result.SummaryText}");
        }
    }
}
```

### REST API - Multiple Tasks

```http
POST {{endpoint}}/language/analyze-text/jobs?api-version=2023-04-01
Ocp-Apim-Subscription-Key: {{api_key}}
Content-Type: application/json

{
    "displayName": "CombinedSummarization",
    "analysisInput": {
        "documents": [
            {
                "id": "1",
                "language": "en",
                "text": "Your text here..."
            }
        ]
    },
    "tasks": [
        {
            "kind": "ExtractiveSummarization",
            "taskName": "ExtractiveTask",
            "parameters": {
                "sentenceCount": 3,
                "sortBy": "Rank"
            }
        },
        {
            "kind": "AbstractiveSummarization",
            "taskName": "AbstractiveTask",
            "parameters": {
                "sentenceCount": 2
            }
        }
    ]
}
```

## 🔍 Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: Unauthorized (401)
```
**Solution**: Verify your API key and endpoint are correct in environment variables.

#### Rate Limiting
```
Error: Too Many Requests (429)
```
**Solution**: Implement exponential backoff retry logic (included in samples).

#### Text Too Long
```
Error: Request payload too large
```
**Solution**: Split text into smaller chunks (max 125,000 characters per document).

#### Empty Results
```
Warning: No sentences extracted
```
**Solution**: Ensure text has sufficient content (minimum 2-3 sentences recommended).

### Performance Issues

#### Slow Processing
- Use batch processing for multiple documents
- Implement parallel processing where appropriate
- Consider caching frequently accessed summaries

#### High Costs
- Monitor character usage with built-in tracking
- Use extractive summarization for cost-effective processing
- Implement smart caching strategies

### Error Codes Reference

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check request format and parameters |
| 401 | Unauthorized | Verify API key and endpoint |
| 403 | Forbidden | Check subscription and quota limits |
| 429 | Too Many Requests | Implement rate limiting and retry logic |
| 500 | Internal Server Error | Retry request or contact support |

## 📈 Monitoring and Analytics

### Built-in Statistics

All code samples include comprehensive statistics tracking:

```python
stats = summarizer.get_statistics()
print(f"Success rate: {stats['success_rate_percent']}%")
print(f"Total characters: {stats['total_characters_processed']:,}")
print(f"Estimated cost: ${stats['estimated_cost_usd']:.4f}")
```

### Key Metrics to Monitor

- **Request Volume**: Total API calls per time period
- **Success Rate**: Percentage of successful requests
- **Processing Time**: Average response time
- **Character Usage**: Total characters processed
- **Cost Tracking**: Estimated monthly spending
- **Error Rates**: Failed requests by error type

### Logging Best Practices

- Log all API requests and responses
- Track processing times and success rates
- Monitor character usage for cost control
- Set up alerts for error rate thresholds
- Implement structured logging for analysis

## 🔗 Additional Resources

### Official Documentation

- [Azure AI Language Documentation](https://docs.microsoft.com/azure/cognitive-services/language-service/)
- [Text Summarization API Reference](https://docs.microsoft.com/azure/cognitive-services/language-service/summarization/overview)
- [Conversation Summarization Guide](https://docs.microsoft.com/azure/cognitive-services/language-service/conversation-summarization/overview)
- [Azure AI Language Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/language-service/)

### Related Azure Services

- **Azure OpenAI Service**: Advanced text generation and summarization
- **Azure Form Recognizer**: Extract and summarize document content
- **Azure Search**: Implement summarization in search results
- **Azure Logic Apps**: Automate summarization workflows
- **Azure Functions**: Serverless summarization processing

### Community Resources

- [Azure AI Samples GitHub](https://github.com/Azure-Samples/cognitive-services-quickstart-code)
- [Microsoft Learn - AI Fundamentals](https://docs.microsoft.com/learn/paths/get-started-with-artificial-intelligence-on-azure/)
- [Azure AI Blog](https://techcommunity.microsoft.com/t5/azure-ai/bg-p/AzureAIBlog)
- [Stack Overflow - Azure Cognitive Services](https://stackoverflow.com/questions/tagged/azure-cognitive-services)

### Advanced Topics

- **Custom Models**: Train domain-specific summarization models
- **Multi-modal Summarization**: Combine text with other media types
- **Real-time Streaming**: Process live conversation streams
- **Integration Patterns**: Microservices and event-driven architectures
- **Security**: Implement proper authentication and data protection

## 📞 Support

### Getting Help

1. **Documentation**: Check the official Azure AI Language documentation
2. **Stack Overflow**: Search for existing solutions or ask new questions
3. **GitHub Issues**: Report bugs or request features in relevant repositories
4. **Azure Support**: Contact Microsoft support for production issues
5. **Community Forums**: Engage with the Azure AI community

### Contributing

We welcome contributions to improve these code samples:

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Next Steps**: Continue to the next section of the course to explore Vision and Images with Azure AI services, or dive deeper into advanced text processing techniques.

For questions or support, please refer to the troubleshooting section above or reach out through the official Azure support channels. 