# Lesson 2: Speech to Text

Welcome to the world of speech recognition! In this lesson, you'll master Azure AI Speech's powerful speech-to-text capabilities, transforming spoken words into written text with remarkable accuracy. From real-time transcription to batch processing, you'll learn to build applications that can truly listen and understand human speech.

## What You'll Learn

By the end of this lesson, you'll be able to:
- Set up and configure Azure AI Speech for speech recognition
- Implement real-time and batch speech-to-text processing
- Work with multiple languages and handle speaker diarization
- Use custom speech models for domain-specific vocabulary
- Build practical applications with speech recognition capabilities
- Optimize accuracy and performance for your specific use cases

## Understanding Speech-to-Text

Speech-to-text technology converts spoken language into written text, enabling applications to understand and process human speech. Azure AI Speech provides industry-leading accuracy with support for over 100 languages and advanced features like speaker identification and custom models.

### Core Capabilities

**Real-Time Transcription**: Convert speech to text as it happens, perfect for live conversations, dictation, and voice commands.

**Batch Transcription**: Process recorded audio files asynchronously, ideal for call center analytics, meeting transcripts, and content processing.

**Fast Transcription**: Ultra-fast synchronous processing that can transcribe a 10-minute audio file in just 15 seconds.

**Multi-Language Support**: Recognition in over 100 languages and dialects with automatic language detection.

**Speaker Diarization**: Identify and differentiate between multiple speakers in conversations.

**Custom Speech Models**: Train models with your specific vocabulary and terminology for improved accuracy.

## Service Types and Use Cases

### Real-Time Speech Recognition

Perfect for interactive applications requiring immediate feedback:

**Live Meeting Transcription**:
- Real-time captions for accessibility
- Meeting notes and action items
- Multilingual conference support

**Voice User Interfaces**:
- Voice commands and navigation
- Smart home controls
- Virtual assistants

**Accessibility Applications**:
- Live captioning for hearing impaired
- Voice-controlled accessibility tools
- Real-time translation services

### Batch Transcription

Ideal for processing large volumes of recorded content:

**Call Center Analytics**:
- Customer service quality monitoring
- Sentiment analysis of customer calls
- Compliance and training purposes

**Media and Content**:
- Podcast and video transcription
- Content searchability and indexing
- Subtitle generation

**Legal and Medical**:
- Court proceeding transcripts
- Medical consultation records
- Dictation and documentation

### Fast Transcription

Optimized for scenarios requiring quick turnaround:

**Video Production**:
- Rapid subtitle generation
- Content editing workflows
- Social media captioning

**Customer Service**:
- Quick voicemail transcription
- Rapid response systems
- Automated ticket creation

## Practical Implementation

### Setting Up Speech Recognition

**Create Speech Resource**:
```http
POST https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.CognitiveServices/accounts/{accountName}
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "kind": "SpeechServices",
  "location": "eastus",
  "sku": {
    "name": "S0"
  },
  "properties": {}
}
```

**Get Service Credentials**:
- Endpoint URL: `https://{region}.api.cognitive.microsoft.com/`
- Subscription Key: Primary or secondary key
- Region: Azure region where resource is deployed

### Real-Time Speech Recognition

**Using REST API**:
```http
POST https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1
Content-Type: audio/wav
Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY

[Audio data in WAV format]
```

**WebSocket Connection for Streaming**:
```javascript
const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

recognizer.recognized = (s, e) => {
    console.log(`RECOGNIZED: Text=${e.result.text}`);
};

recognizer.recognizing = (s, e) => {
    console.log(`RECOGNIZING: Text=${e.result.text}`);
};

recognizer.startContinuousRecognitionAsync();
```

**Response Format**:
```json
{
  "RecognitionStatus": "Success",
  "DisplayText": "Hello, can you hear me clearly?",
  "Offset": 7200000,
  "Duration": 18700000,
  "NBest": [
    {
      "Confidence": 0.922,
      "Lexical": "hello can you hear me clearly",
      "ITN": "hello can you hear me clearly",
      "MaskedITN": "hello can you hear me clearly",
      "Display": "Hello, can you hear me clearly?"
    }
  ]
}
```

### Batch Transcription

**Submit Transcription Job**:
```http
POST https://eastus.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions
Content-Type: application/json
Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY

{
  "contentUrls": [
    "https://example.com/audio/meeting-recording.wav"
  ],
  "properties": {
    "diarizationEnabled": true,
    "wordLevelTimestampsEnabled": true,
    "punctuationMode": "DictatedAndAutomatic",
    "profanityFilterMode": "Masked"
  },
  "locale": "en-US",
  "displayName": "Meeting Transcription"
}
```

**Check Status and Results**:
```http
GET https://eastus.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions/{transcriptionId}
Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY
```

**Transcription Results**:
```json
{
  "source": "https://example.com/audio/meeting-recording.wav",
  "timestamp": "2024-01-15T10:30:00Z",
  "durationInTicks": 180000000,
  "combinedRecognizedPhrases": [
    {
      "channel": 0,
      "lexical": "good morning everyone welcome to today's meeting",
      "itn": "good morning everyone welcome to today's meeting",
      "maskedITN": "good morning everyone welcome to today's meeting",
      "display": "Good morning everyone, welcome to today's meeting."
    }
  ],
  "recognizedPhrases": [
    {
      "recognitionStatus": "Success",
      "channel": 0,
      "speaker": 1,
      "offset": "PT0.36S",
      "duration": "PT3.42S",
      "offsetInTicks": 3600000,
      "durationInTicks": 34200000,
      "nBest": [
        {
          "confidence": 0.92,
          "lexical": "good morning everyone",
          "itn": "good morning everyone",
          "maskedITN": "good morning everyone",
          "display": "Good morning everyone.",
          "words": [
            {
              "word": "good",
              "offset": "PT0.36S",
              "duration": "PT0.24S",
              "offsetInTicks": 3600000,
              "durationInTicks": 2400000,
              "confidence": 0.94
            }
          ]
        }
      ]
    }
  ]
}
```

## Advanced Features

### Speaker Diarization

Speaker diarization identifies different speakers in audio content:

**Configuration**:
```json
{
  "diarizationEnabled": true,
  "maxSpeakers": 5,
  "minSpeakers": 2
}
```

**Results with Speaker Information**:
```json
{
  "speaker": 1,
  "display": "Hello everyone, let's start the meeting.",
  "offset": "PT0.36S",
  "duration": "PT2.1S"
},
{
  "speaker": 2,
  "display": "Good morning, I have the quarterly reports ready.",
  "offset": "PT2.8S",
  "duration": "PT3.2S"
}
```

### Language Detection and Multi-Language Support

**Automatic Language Detection**:
```json
{
  "candidateLocales": ["en-US", "es-ES", "fr-FR"],
  "mode": "Continuous"
}
```

**Multi-Language Results**:
```json
{
  "language": "en-US",
  "confidence": 0.95,
  "display": "Hello, comment allez-vous today?",
  "languageDetectionResult": {
    "locale": "en-US",
    "confidence": 0.87
  }
}
```

### Custom Speech Models

Create models tailored to your domain:

**Training Data Requirements**:
- Audio files with corresponding transcripts
- Domain-specific vocabulary lists
- Pronunciation guides for technical terms
- Minimum 1 hour of audio for basic customization

**Model Training Process**:
1. Upload training data
2. Create custom model
3. Train and evaluate
4. Deploy custom endpoint
5. Use in applications

**Custom Model Usage**:
```http
POST https://eastus.api.cognitive.microsoft.com/speechtotext/recognition/conversation/cognitiveservices/v1?model={customModelId}
Content-Type: audio/wav
Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY
```

## Audio Input Formats and Requirements

### Supported Audio Formats

**Real-Time Recognition**:
- WAV (PCM, 16-bit, 16 kHz, mono)
- MP3 (for some scenarios)
- FLAC
- OGG/Opus

**Batch Transcription**:
- WAV, MP3, M4A, FLAC, OGG
- Sample rates: 8 kHz to 48 kHz
- Multiple channels supported
- File size up to 1 GB

### Audio Quality Optimization

**Best Practices for Audio**:
- Use high-quality microphones
- Minimize background noise
- Ensure clear speech patterns
- Maintain consistent volume levels

**Audio Preprocessing**:
```javascript
// Example: Audio enhancement before recognition
const audioProcessor = {
    noiseReduction: true,
    echoCancellation: true,
    automaticGainControl: true
};
```

## Real-World Applications

### Customer Service Enhancement

**Call Center Analytics**:
```json
{
  "scenario": "customer_service",
  "features": {
    "sentiment_analysis": true,
    "keyword_detection": ["refund", "complaint", "satisfaction"],
    "quality_scoring": true,
    "compliance_checking": true
  },
  "output": {
    "transcript": "Customer expressed satisfaction with resolution time.",
    "sentiment": "positive",
    "keywords_found": ["satisfaction"],
    "quality_score": 0.92
  }
}
```

**Live Agent Assistance**:
- Real-time transcription for agents
- Automated note-taking
- Suggested responses based on context
- Training and quality monitoring

### Healthcare Documentation

**Medical Dictation**:
```json
{
  "medical_transcription": {
    "custom_model": "medical_terminology_v2",
    "privacy_mode": "enabled",
    "specialized_vocabulary": [
      "hypertension", "bradycardia", "pneumonia",
      "acetaminophen", "echocardiogram"
    ],
    "accuracy_boost": "medical_context"
  }
}
```

**Patient Consultation Recording**:
- Hands-free documentation
- HIPAA-compliant processing
- Integration with electronic health records
- Automated medical coding assistance

### Education and Accessibility

**Lecture Transcription**:
```json
{
  "educational_settings": {
    "real_time_captions": true,
    "multiple_languages": ["en-US", "es-ES"],
    "academic_vocabulary": true,
    "presentation_sync": true
  }
}
```

**Accessibility Features**:
- Live captioning for hearing impaired
- Voice-controlled navigation
- Multi-language support for international students
- Integration with learning management systems

## Performance Optimization

### Accuracy Improvement

**Model Selection**:
- Use latest model versions
- Choose appropriate model for use case
- Consider custom models for specialized domains

**Audio Quality**:
- Optimize recording conditions
- Use noise cancellation
- Ensure proper microphone placement
- Maintain consistent audio levels

**Configuration Tuning**:
```json
{
  "recognition_config": {
    "profanity_filter": "masked",
    "add_punctuation": true,
    "add_word_level_timestamps": true,
    "confidence_threshold": 0.7,
    "max_alternatives": 3
  }
}
```

### Latency Optimization

**Real-Time Performance**:
- Use streaming recognition
- Optimize audio chunk sizes
- Implement efficient buffering
- Choose nearest service region

**Network Optimization**:
- Use WebSocket connections
- Implement connection pooling
- Handle reconnection gracefully
- Monitor service health

### Cost Management

**Pricing Considerations**:
- Standard vs Custom model pricing
- Real-time vs batch processing costs
- Audio duration billing
- API call optimization

**Cost Optimization Strategies**:
```javascript
// Optimize audio processing
const optimizeForCost = {
    useAppropriateQuality: true,
    batchProcessing: true,
    efficientChunking: true,
    cacheCommonResults: true
};
```

## Error Handling and Troubleshooting

### Common Issues

**Audio Quality Problems**:
```json
{
  "error": "NoMatch",
  "reason": "Audio quality insufficient",
  "recommendations": [
    "Improve microphone quality",
    "Reduce background noise",
    "Check audio format compatibility",
    "Ensure proper volume levels"
  ]
}
```

**Network and Service Issues**:
```json
{
  "error": "ConnectionFailure",
  "retry_strategy": {
    "max_attempts": 3,
    "backoff_type": "exponential",
    "base_delay": 1000
  }
}
```

### Troubleshooting Guide

**Low Accuracy**:
1. Check audio quality and format
2. Verify language setting
3. Consider custom model training
4. Review pronunciation and accent factors

**Connection Issues**:
1. Verify credentials and endpoint
2. Check network connectivity
3. Monitor service health status
4. Implement retry logic

## Next Steps

In the next lesson, we'll explore **Text to Speech**, where you'll learn to convert written text into natural-sounding speech using Azure AI Speech's synthesis capabilities.

### Practice Exercises

1. **Real-Time Transcription**: Build a live microphone transcription app
2. **Batch Processing**: Create a system to process recorded meetings
3. **Multi-Language Detection**: Implement automatic language switching
4. **Custom Vocabulary**: Train a model with domain-specific terms

## Key Takeaways

- Azure AI Speech provides comprehensive speech-to-text capabilities with industry-leading accuracy
- Multiple processing modes support different use cases from real-time to batch processing
- Advanced features like speaker diarization and language detection enhance transcription quality
- Custom models enable domain-specific optimization for specialized vocabulary
- Proper audio quality and configuration are crucial for optimal recognition results
- Real-world applications span customer service, healthcare, education, and accessibility

## References

[1] [Azure AI Speech Documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
[2] [Speech-to-Text REST API](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text)
[3] [Batch Transcription Guide](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription)
[4] [Custom Speech Models](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview)
[5] [Language Support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support) 