# Code Samples 📚

Welcome to the code samples section! This directory contains practical examples for all Azure AI services covered in the course, implemented in multiple programming languages.

## 🗂️ Directory Structure

```
Code-Samples/
├── Python/                    # Python examples with requirements.txt
│   ├── 01-Getting-Started/    # Setup and first AI project
│   ├── 02-Text-and-Language/  # Text AI services
│   ├── 03-Vision-and-Images/  # Computer Vision
│   ├── 04-Speech-and-Audio/   # Speech services
│   ├── 05-Build-Real-Apps/    # Complete applications
│   ├── 06-Advanced-Topics/    # Deployment and optimization
│   └── requirements.txt       # Python dependencies
├── JavaScript/                # Node.js examples with package.json
│   ├── 01-Getting-Started/    # Setup and first AI project
│   ├── 02-Text-and-Language/  # Text AI services
│   ├── 03-Vision-and-Images/  # Computer Vision
│   ├── 04-Speech-and-Audio/   # Speech services
│   ├── 05-Build-Real-Apps/    # Complete applications
│   ├── 06-Advanced-Topics/    # Deployment and optimization
│   └── package.json           # Node.js dependencies
├── CSharp/                    # C# examples
│   ├── 01-Getting-Started/    # Setup and first AI project
│   ├── 02-Text-and-Language/  # Text AI services
│   ├── 03-Vision-and-Images/  # Computer Vision
│   ├── 04-Speech-and-Audio/   # Speech services
│   ├── 05-Build-Real-Apps/    # Complete applications
│   └── 06-Advanced-Topics/    # Deployment and optimization
└── REST/                      # REST API examples (.http files)
    ├── 01-Getting-Started/    # Setup and first AI project
    ├── 02-Text-and-Language/  # Text AI services
    ├── 03-Vision-and-Images/  # Computer Vision
    ├── 04-Speech-and-Audio/   # Speech services
    ├── 05-Build-Real-Apps/    # Complete applications
    └── 06-Advanced-Topics/    # Deployment and optimization
```

## 🚀 Quick Start

### Python Setup
```bash
cd Code-Samples/Python
pip install -r requirements.txt
```

### JavaScript Setup
```bash
cd Code-Samples/JavaScript
npm install
```

### C# Setup
```bash
cd Code-Samples/CSharp
dotnet restore
```

### REST API Testing
Use VS Code with the REST Client extension or import the `.http` files into Postman.

## 📋 Available Samples by Section

### Section 1: Getting Started 🚀

| Language | File | Description |
|----------|------|-------------|
| Python | `first_ai_project.py` | Your first Azure AI project |
| Python | `setup_test.py` | Test your Azure setup |
| JavaScript | `first-ai-project.js` | Your first Azure AI project |
| JavaScript | `setup-test.js` | Test your Azure setup |
| C# | `FirstAIProject.cs` | Your first Azure AI project |
| REST | `first-ai-project.http` | REST API examples |

### Section 2: Text and Language 📝

| Language | File | Description |
|----------|------|-------------|
| Python | `chat_with_gpt.py` | Chat with GPT models |
| Python | `translate_text.py` | Text translation |
| Python | `text_analysis_sentiment.py` | Sentiment analysis |
| Python | `05-text-summarizer.py` | Text summarization |
| JavaScript | `chat-with-gpt.js` | Chat with GPT models |
| JavaScript | `translate-text.js` | Text translation |
| JavaScript | `text-analysis-sentiment.js` | Sentiment analysis |
| JavaScript | `05-text-summarizer.js` | Text summarization |
| C# | `ChatWithGPT.cs` | Chat with GPT models |
| C# | `TranslateText.cs` | Text translation |
| C# | `05-text-summarizer.cs` | Text summarization |
| REST | `chat-with-gpt.http` | REST API examples |
| REST | `translate-text.http` | REST API examples |
| REST | `05-text-summarizer.http` | REST API examples |

### Section 3: Vision and Images 👁️

| Language | File | Description |
|----------|------|-------------|
| Python | `analyze_images.py` | Image analysis |
| JavaScript | `analyze-images.js` | Image analysis |
| C# | `AnalyzeImages.cs` | Image analysis |
| REST | `analyze-images.http` | REST API examples |

### Section 4: Speech and Audio 🎤

| Language | File | Description |
|----------|------|-------------|
| Python | `speech_to_text.py` | Speech recognition |
| Python | `text_to_speech.py` | Speech synthesis |
| JavaScript | `speech-to-text.js` | Speech recognition |
| JavaScript | `text-to-speech.js` | Speech synthesis |
| C# | `SpeechToText.cs` | Speech recognition |
| C# | `TextToSpeech.cs` | Speech synthesis |
| REST | `speech-to-text.http` | REST API examples |
| REST | `text-to-speech.http` | REST API examples |

### Section 5: Build Real Apps 🏗️

| Language | File | Description |
|----------|------|-------------|
| Python | `smart_chatbot.py` | Intelligent chatbot |
| Python | `image_analyzer_app.py` | Web-based image analyzer |
| Python | `voice_assistant.py` | Voice-enabled assistant |
| JavaScript | `smart-chatbot.js` | Intelligent chatbot |
| JavaScript | `image-analyzer-app.js` | Web-based image analyzer |
| JavaScript | `voice-assistant.js` | Voice-enabled assistant |
| C# | `SmartChatbot.cs` | Intelligent chatbot |
| C# | `ImageAnalyzerApp.cs` | Web-based image analyzer |
| C# | `VoiceAssistant.cs` | Voice-enabled assistant |
| REST | `smart-chatbot.http` | REST API examples |
| REST | `image-analyzer-app.http` | REST API examples |
| REST | `voice-assistant.http` | REST API examples |

### Section 6: Advanced Topics ⚡

| Language | File | Description |
|----------|------|-------------|
| Python | `deploy_models.py` | Model deployment |
| Python | `security_best_practices.py` | Security implementation |
| Python | `monitoring_logging.py` | Monitoring and logging |
| JavaScript | `deploy-models.js` | Model deployment |
| JavaScript | `security-best-practices.js` | Security implementation |
| JavaScript | `monitoring-logging.js` | Monitoring and logging |
| C# | `DeployModels.cs` | Model deployment |
| C# | `SecurityBestPractices.cs` | Security implementation |
| C# | `MonitoringLogging.cs` | Monitoring and logging |
| REST | `deploy-models.http` | REST API examples |
| REST | `security-best-practices.http` | REST API examples |
| REST | `monitoring-logging.http` | REST API examples |

## 🔧 Prerequisites

### Environment Variables
All samples require Azure AI service credentials. Set these environment variables:

```bash
# Azure OpenAI Service
AZURE_OPENAI_ENDPOINT=your-openai-endpoint
AZURE_OPENAI_KEY=your-openai-key

# Azure Computer Vision
AZURE_COMPUTER_VISION_ENDPOINT=your-vision-endpoint
AZURE_COMPUTER_VISION_KEY=your-vision-key

# Azure Speech Service
AZURE_SPEECH_ENDPOINT=your-speech-endpoint
AZURE_SPEECH_KEY=your-speech-key

# Azure Language Service
AZURE_LANGUAGE_ENDPOINT=your-language-endpoint
AZURE_LANGUAGE_KEY=your-language-key
```

### Azure Services Required
- Azure OpenAI Service
- Azure Computer Vision
- Azure Speech Service
- Azure Language Service
- Azure Translator (optional)

## 🎯 How to Use These Samples

### 1. Choose Your Language
Select the programming language you're most comfortable with:
- **Python**: Great for beginners, extensive AI libraries
- **JavaScript**: Perfect for web applications and Node.js
- **C#**: Ideal for .NET applications and enterprise development
- **REST**: Universal, works with any programming language

### 2. Follow the Course Structure
- Start with Section 1 samples to set up your environment
- Progress through each section in order
- Each sample builds on the previous ones

### 3. Customize and Experiment
- Modify the samples to fit your use case
- Try different parameters and configurations
- Combine multiple services in your applications

### 4. Run the Samples
```bash
# Python
python filename.py

# JavaScript
node filename.js

# C#
dotnet run

# REST
# Use VS Code REST Client or Postman
```

## 📚 Sample Features

### Comprehensive Coverage
- **30+ code samples** across all sections
- **4 programming languages** (Python, JavaScript, C#, REST)
- **Real-world examples** with practical applications
- **Error handling** and best practices
- **Production-ready** code patterns

### Advanced Features
- **Async/await** patterns for better performance
- **Batch processing** examples
- **Custom error handling** and retry logic
- **Configuration management** best practices
- **Security implementations** and best practices

### Learning Aids
- **Detailed comments** explaining each step
- **Multiple examples** for each concept
- **Progressive complexity** from basic to advanced
- **Cross-language comparisons** to understand differences

## 🔍 Sample Highlights

### Text AI Examples
- **Chat with GPT**: Interactive conversations with memory
- **Translation**: Multi-language text translation
- **Sentiment Analysis**: Analyze text emotions and opinions
- **Text Summarization**: Create concise summaries of long text

### Vision AI Examples
- **Image Analysis**: Tag, categorize, and describe images
- **Object Detection**: Find and locate objects in images
- **Face Recognition**: Detect faces and extract attributes
- **OCR**: Extract text from images

### Speech AI Examples
- **Speech-to-Text**: Convert audio to text
- **Text-to-Speech**: Generate natural-sounding speech
- **Speech Translation**: Real-time language translation
- **Voice Commands**: Build voice-controlled applications

### Complete Applications
- **Smart Chatbot**: Multi-modal AI assistant
- **Image Analyzer**: Web-based image processing
- **Voice Assistant**: Complete voice-enabled application
- **Multi-Service Integration**: Combining multiple AI services

## 🛠️ Development Tools

### Recommended IDEs
- **VS Code**: Excellent for all languages with extensions
- **PyCharm**: Great for Python development
- **Visual Studio**: Perfect for C# development
- **WebStorm**: Ideal for JavaScript development

### Useful Extensions
- **REST Client**: For testing REST APIs
- **Python**: Python language support
- **C#**: C# language support
- **JavaScript**: JavaScript language support
- **Azure Tools**: Azure development tools

## 📖 Additional Resources

### Documentation
- [Azure AI Services Documentation](https://docs.microsoft.com/azure/ai-services/)
- [Azure OpenAI Service Documentation](https://docs.microsoft.com/azure/cognitive-services/openai/)
- [Azure Computer Vision Documentation](https://docs.microsoft.com/azure/cognitive-services/computer-vision/)
- [Azure Speech Service Documentation](https://docs.microsoft.com/azure/cognitive-services/speech-service/)

### SDKs and Libraries
- [Azure SDK for Python](https://github.com/Azure/azure-sdk-for-python)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
- [Azure SDK for .NET](https://github.com/Azure/azure-sdk-for-net)

### Community Resources
- [Azure AI Community](https://techcommunity.microsoft.com/t5/azure-ai/bd-p/AzureAI)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-cognitive-services)
- [GitHub Discussions](https://github.com/Azure-Samples/cognitive-services-quickstart-code/discussions)

## 🤝 Contributing

We welcome contributions! Please feel free to:
- Report bugs or issues
- Suggest improvements
- Add new examples
- Improve documentation
- Create samples in additional languages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Happy Coding! 🚀**

*These code samples are designed to help you learn Azure AI services through practical, hands-on examples. Each sample includes detailed comments and follows best practices for production use.* 