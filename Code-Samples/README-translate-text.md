# Text Translation with Azure AI Translator - Code Samples

This directory contains comprehensive code samples demonstrating how to use Azure AI Translator service to translate text, detect languages, and handle various real-world scenarios.

## 📁 Sample Structure

```
Code-Samples/
├── Python/02-Text-and-Language/translate_text.py
├── JavaScript/02-Text-and-Language/translate-text.js
├── CSharp/02-Text-and-Language/TranslateText.cs
└── REST/02-Text-and-Language/translate-text.http
```

## 🚀 Quick Start

### Prerequisites

1. **Azure Subscription**: You need an active Azure subscription
2. **Azure AI Translator Resource**: Create a Translator resource in Azure portal
3. **Environment Variables**: Set the following environment variables:
   - `TRANSLATOR_KEY`: Your Translator resource key
   - `TRANSLATOR_ENDPOINT`: Your Translator resource endpoint (e.g., https://api.cognitive.microsofttranslator.com/)
   - `TRANSLATOR_REGION`: Your Translator resource region (e.g., eastus)

### Azure Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new resource → AI + Machine Learning → Translator
3. Choose your subscription, resource group, and region
4. Select pricing tier (F0 for free tier, S1 for standard)
5. After deployment, go to Keys and Endpoint tab
6. Copy Key 1, Endpoint, and Region for your environment variables

## 🐍 Python Sample

### Installation
```bash
pip install requests python-dotenv
```

### Environment Setup
Create a `.env` file:
```
TRANSLATOR_KEY=your_translator_key_here
TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
TRANSLATOR_REGION=your_region_here
```

### Run the Sample
```bash
python Code-Samples/Python/02-Text-and-Language/translate_text.py
```

### Key Features
- ✅ Text translation to multiple languages
- ✅ Automatic language detection
- ✅ HTML content translation
- ✅ Batch translation support
- ✅ Interactive translation mode
- ✅ Error handling and retry logic
- ✅ Translation history tracking
- ✅ Business scenario demonstrations

## 🟨 JavaScript Sample

### Installation
```bash
npm install axios dotenv readline
```

### Environment Setup
Create a `.env` file in your project root:
```
TRANSLATOR_KEY=your_translator_key_here
TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
TRANSLATOR_REGION=your_region_here
```

### Run the Sample
```bash
node Code-Samples/JavaScript/02-Text-and-Language/translate-text.js
```

### Key Features
- ✅ Promise-based async operations
- ✅ Interactive readline interface
- ✅ Comprehensive error handling
- ✅ Multiple translation scenarios
- ✅ Real-time language detection
- ✅ Business use case examples

## 🔷 C# Sample

### Prerequisites
- .NET 6.0 or later
- No additional packages required (uses built-in HttpClient and System.Text.Json)

### Environment Setup
Set environment variables in your system or use a `.env` file with a package like `DotNetEnv`:

**Windows (Command Prompt):**
```cmd
set TRANSLATOR_KEY=your_translator_key_here
set TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
set TRANSLATOR_REGION=your_region_here
```

**Windows (PowerShell):**
```powershell
$env:TRANSLATOR_KEY="your_translator_key_here"
$env:TRANSLATOR_ENDPOINT="https://api.cognitive.microsofttranslator.com/"
$env:TRANSLATOR_REGION="your_region_here"
```

**macOS/Linux:**
```bash
export TRANSLATOR_KEY=your_translator_key_here
export TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
export TRANSLATOR_REGION=your_region_here
```

### Run the Sample
```bash
dotnet run --project Code-Samples/CSharp/02-Text-and-Language/TranslateText.cs
```

### Key Features
- ✅ Strong typing with custom classes
- ✅ Async/await patterns
- ✅ Proper resource disposal
- ✅ Comprehensive error handling
- ✅ Interactive console interface
- ✅ Production-ready patterns

## 🌐 REST API Samples

### Tools Supported
- **VS Code REST Client**: Install the REST Client extension
- **Postman**: Import the requests
- **cURL**: Command-line examples included
- **PowerShell**: Script examples provided

### Setup
1. Open `Code-Samples/REST/02-Text-and-Language/translate-text.http`
2. Replace the variables at the top with your actual values:
   ```
   @translatorKey = your_translator_key_here
   @translatorEndpoint = https://api.cognitive.microsofttranslator.com
   @translatorRegion = your_region_here
   ```

### Available Examples (30 total)
1. **Basic Translation** - Single and multi-language
2. **Language Detection** - Automatic language identification
3. **HTML Translation** - Preserve markup while translating
4. **Business Scenarios** - Customer support, product descriptions, legal
5. **Error Handling** - Invalid inputs, rate limiting
6. **Advanced Features** - Alignment, sentence length, profanity filtering
7. **Batch Operations** - Multiple texts, localization
8. **Performance Testing** - Large batches, rate limiting

## 🎯 Features Demonstrated

### Core Translation Features
- **Multi-language Translation**: Translate to multiple target languages simultaneously
- **Language Detection**: Automatically detect source language with confidence scores
- **HTML Translation**: Translate HTML content while preserving markup
- **Batch Translation**: Process multiple texts in a single request
- **Source Language Specification**: Explicitly specify source language when known

### Advanced Features
- **Word Alignment**: Get word-level alignment between source and target
- **Sentence Length**: Retrieve sentence boundary information
- **Profanity Filtering**: Mark or remove profanity in translations
- **Text Type Support**: Handle both plain text and HTML content
- **Transliteration**: Convert text between different scripts

### Production Features
- **Error Handling**: Robust error handling for various failure scenarios
- **Rate Limiting**: Handle API rate limits gracefully
- **Retry Logic**: Automatic retry with exponential backoff
- **Request Tracing**: Unique request IDs for debugging
- **Cost Optimization**: Efficient batching to minimize API calls

## 🏢 Business Use Cases

### Customer Support
```python
# Translate customer messages for multilingual support
customer_message = "I'm having trouble with my order. Can you help me track it?"
translations = await translator.translate_text(customer_message, ['es', 'fr', 'de'])
```

### E-commerce
```javascript
// Translate product descriptions for global markets
const productDesc = "Premium wireless headphones with noise cancellation";
const translations = await translator.translateText(productDesc, ['ja', 'ko', 'zh']);
```

### Content Localization
```csharp
// Translate app interface elements
var uiElements = new[] { "Home", "About", "Services", "Contact", "Login" };
var results = await translator.TranslateTextAsync(uiElements, new[] { "es", "fr", "de" });
```

### Legal and Compliance
```http
# Translate legal disclaimers for different regions
POST /translate?api-version=3.0&to=pt&to=it&to=nl
{
    "text": "By using this service, you agree to our terms and conditions."
}
```

## 📊 Supported Languages

Azure AI Translator supports 130+ languages for text translation. Some popular languages include:

- **European**: English (en), Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), Dutch (nl)
- **Asian**: Chinese Simplified (zh), Japanese (ja), Korean (ko), Hindi (hi), Thai (th), Vietnamese (vi)
- **Middle Eastern**: Arabic (ar), Hebrew (he), Persian (fa), Turkish (tr)
- **Other**: Russian (ru), Polish (pl), Swedish (sv), Norwegian (no), Danish (da)

Get the complete list using the `/languages` endpoint.

## 🔧 Configuration Options

### Translation Parameters
- `to`: Target language(s) - **Required**
- `from`: Source language - *Optional (auto-detected if not specified)*
- `textType`: Content type - `plain` (default) or `html`
- `profanityAction`: Profanity handling - `NoAction`, `Marked`, or `Deleted`
- `includeAlignment`: Word alignment - `true` or `false`
- `includeSentenceLength`: Sentence boundaries - `true` or `false`

### API Limits
- **Free Tier (F0)**: 2M characters per month
- **Standard Tier (S1)**: Pay per character translated
- **Request Size**: Up to 50,000 characters per request
- **Array Size**: Up to 100 text elements per request
- **Rate Limits**: Varies by pricing tier

## 🛠️ Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```
   Error: 401 Unauthorized
   ```
   - Check if `TRANSLATOR_KEY` is correct
   - Verify `TRANSLATOR_REGION` matches your resource region
   - Ensure the key hasn't expired

2. **Invalid Language Codes**
   ```
   Error: 400 Bad Request - Invalid language code
   ```
   - Use ISO 639-1 language codes (e.g., 'es' not 'spanish')
   - Check supported languages with `/languages` endpoint

3. **Text Too Long**
   ```
   Error: 400 Bad Request - Text too long
   ```
   - Maximum 50,000 characters per request
   - Split long texts into smaller chunks

4. **Rate Limiting**
   ```
   Error: 429 Too Many Requests
   ```
   - Implement exponential backoff retry logic
   - Consider upgrading to higher pricing tier
   - Batch multiple texts in single requests

### Environment Variable Issues

**Python:**
```python
import os
print(f"Key: {os.getenv('TRANSLATOR_KEY')[:10]}...")
print(f"Endpoint: {os.getenv('TRANSLATOR_ENDPOINT')}")
print(f"Region: {os.getenv('TRANSLATOR_REGION')}")
```

**JavaScript:**
```javascript
console.log(`Key: ${process.env.TRANSLATOR_KEY?.substring(0, 10)}...`);
console.log(`Endpoint: ${process.env.TRANSLATOR_ENDPOINT}`);
console.log(`Region: ${process.env.TRANSLATOR_REGION}`);
```

**C#:**
```csharp
Console.WriteLine($"Key: {Environment.GetEnvironmentVariable("TRANSLATOR_KEY")?[..10]}...");
Console.WriteLine($"Endpoint: {Environment.GetEnvironmentVariable("TRANSLATOR_ENDPOINT")}");
Console.WriteLine($"Region: {Environment.GetEnvironmentVariable("TRANSLATOR_REGION")}");
```

## 📈 Performance Optimization

### Best Practices
1. **Batch Requests**: Combine multiple texts in single API calls
2. **Cache Results**: Store frequently used translations
3. **Language Detection**: Cache detected languages to avoid repeated detection
4. **Connection Pooling**: Reuse HTTP connections
5. **Async Operations**: Use async/await for better throughput

### Cost Optimization
1. **Avoid Duplicate Translations**: Check cache before translating
2. **Optimize Text Length**: Remove unnecessary whitespace and formatting
3. **Smart Batching**: Group texts by target language
4. **Language Detection**: Only detect when necessary

## 🔗 Additional Resources

- [Azure AI Translator Documentation](https://docs.microsoft.com/azure/cognitive-services/translator/)
- [REST API Reference](https://docs.microsoft.com/azure/cognitive-services/translator/reference/v3-0-reference)
- [Supported Languages](https://docs.microsoft.com/azure/cognitive-services/translator/language-support)
- [Pricing Information](https://azure.microsoft.com/pricing/details/cognitive-services/translator/)
- [Regional Availability](https://azure.microsoft.com/global-infrastructure/services/?products=cognitive-services)

## 📝 License

These samples are provided under the MIT License. See the main repository LICENSE file for details.

## 🤝 Contributing

Found an issue or want to improve the samples? Please open an issue or submit a pull request in the main repository.

---

**Next Steps**: After mastering text translation, explore the next lesson on sentiment analysis and text understanding! 