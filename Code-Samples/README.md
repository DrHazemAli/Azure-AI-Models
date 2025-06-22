# Code Samples - Azure AI Models Course

This directory contains practical code examples for the Azure AI Models course. Each sample demonstrates real-world usage of Azure AI services across multiple programming languages.

## 📁 Directory Structure

```
Code-Samples/
├── Python/           # Python implementations
├── JavaScript/       # Node.js implementations  
├── CSharp/          # C# .NET implementations
├── REST/            # REST API examples
└── README.md        # This file
```

## 🚀 Getting Started

### Prerequisites

Before running any code samples, ensure you have:

1. **Azure Subscription** - [Create a free account](https://azure.microsoft.com/free/)
2. **Azure AI Services** - Set up the required services (see course lessons)
3. **Development Environment** - Choose your preferred language setup

### Environment Variables

Most samples require these environment variables:

```bash
# For Language Services
AZURE_LANGUAGE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_LANGUAGE_KEY=your-api-key-here

# For OpenAI Services  
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key-here

# For Vision Services
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your-api-key-here
```

## 🐍 Python Setup

### Installation
```bash
# Navigate to Python directory
cd Python

# Install dependencies
pip install -r requirements.txt

# Set environment variables (Linux/Mac)
export AZURE_LANGUAGE_ENDPOINT="your-endpoint"
export AZURE_LANGUAGE_KEY="your-key"

# Set environment variables (Windows)
set AZURE_LANGUAGE_ENDPOINT=your-endpoint
set AZURE_LANGUAGE_KEY=your-key
```

### Running Examples
```bash
# Run the first AI project
python 01-Getting-Started/first_ai_project.py

# Run other examples
python 02-Text-and-Language/sentiment_analysis.py
```

## 🟨 JavaScript Setup

### Installation
```bash
# Navigate to JavaScript directory
cd JavaScript

# Install dependencies
npm install

# Set environment variables
export AZURE_LANGUAGE_ENDPOINT="your-endpoint"
export AZURE_LANGUAGE_KEY="your-key"
```

### Running Examples
```bash
# Run the first AI project
node 01-Getting-Started/first-ai-project.js

# Run other examples
node 02-Text-and-Language/sentiment-analysis.js
```

## 🔷 C# Setup

### Installation
```bash
# Navigate to CSharp directory
cd CSharp

# Restore packages
dotnet restore

# Set environment variables (Windows)
set AZURE_LANGUAGE_ENDPOINT=your-endpoint
set AZURE_LANGUAGE_KEY=your-key

# Set environment variables (Linux/Mac)
export AZURE_LANGUAGE_ENDPOINT="your-endpoint"
export AZURE_LANGUAGE_KEY="your-key"
```

### Running Examples
```bash
# Run the first AI project
cd 01-Getting-Started
dotnet run

# Run other examples
cd ../02-Text-and-Language
dotnet run
```

## 🌐 REST API Examples

The REST directory contains `.http` files that can be used with:

- **VS Code REST Client Extension**
- **Postman**
- **Insomnia**
- **curl** commands

### Using VS Code REST Client
1. Install the "REST Client" extension
2. Open any `.http` file
3. Replace variables with your actual values
4. Click "Send Request" above each request

### Using curl
```bash
# Copy the curl examples from the .http files
curl -X POST "https://your-endpoint.cognitiveservices.azure.com/language/:analyze-text?api-version=2022-05-01" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: your-key" \
  -d '{"analysisInput":{"documents":[{"id":"1","text":"Hello world"}]},"tasks":[{"kind":"LanguageDetectionTask"}]}'
```

## 📚 Course Sections

### 01-Getting-Started
- **setup_test** - Test your Azure AI setup
- **first_ai_project** - Complete text analyzer application

### 02-Text-and-Language
- **sentiment_analysis** - Advanced sentiment analysis
- **language_translation** - Text translation examples
- **text_summarization** - Document summarization

### 03-Vision-and-Images
- **image_analysis** - Analyze and describe images
- **ocr_text_extraction** - Extract text from images
- **object_detection** - Detect objects in images

### 04-Speech-and-Audio
- **speech_to_text** - Convert speech to text
- **text_to_speech** - Generate speech from text
- **speech_translation** - Real-time speech translation

### 05-Build-Real-Apps
- **chatbot** - Intelligent chatbot application
- **document_processor** - Process and analyze documents
- **multimodal_app** - Combine multiple AI services

### 06-Advanced-Topics
- **custom_models** - Train and deploy custom models
- **scaling_solutions** - Production-ready implementations
- **monitoring** - Monitor and optimize AI applications

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your API keys and endpoints
   - Check environment variables are set correctly
   - Ensure services are created in Azure Portal

2. **Rate Limiting**
   - Add delays between requests
   - Use the free tier limits wisely
   - Consider upgrading to paid tiers

3. **Network Issues**
   - Check internet connectivity
   - Verify firewall settings
   - Try different Azure regions

### Getting Help

- Check the course lessons for detailed explanations
- Review the troubleshooting guide in Lesson 5
- Visit [Azure AI Documentation](https://docs.microsoft.com/azure/cognitive-services/)
- Ask questions on [Microsoft Q&A](https://docs.microsoft.com/answers/)

## 📝 Notes

- All code samples include error handling and best practices
- Examples are production-ready with proper logging
- Each sample is self-contained and can run independently
- Code is extensively commented for learning purposes

## 🎯 Next Steps

1. Start with the Getting Started examples
2. Follow the course lessons in order
3. Experiment with different inputs and parameters
4. Build your own applications using these samples as templates

---

*Happy coding! 🚀 These samples will help you master Azure AI services step by step.* 