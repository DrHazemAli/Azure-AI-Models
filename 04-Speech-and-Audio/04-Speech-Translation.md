# 04 - Speech Translation

## Learning Objectives
By the end of this lesson, you will:
- Understand Azure AI Speech Translation capabilities and features
- Learn about multi-lingual speech translation
- Implement real-time speech translation
- Handle multiple target languages
- Build applications that break down language barriers

## What is Speech Translation?

Azure AI Speech Translation combines speech recognition and text translation into a single, powerful service. It can translate spoken words from one language to another in real-time, supporting both speech-to-text and speech-to-speech translation [1].

### Core Features

#### 1. Speech-to-Text Translation
Translates spoken input into text in your target language:
```
English Speech → "Hello, how are you?" → French Text: "Bonjour, comment allez-vous?"
```

#### 2. Speech-to-Speech Translation
Provides natural voice output in the target language:
```
English Speech → "Hello" → French Speech: "Bonjour" (with natural voice)
```

#### 3. Multi-lingual Speech Translation 🆕
Revolutionary capability that automatically detects input language without specification:
- **No input language required**: Automatically handles multiple languages
- **Language switching**: Seamlessly switches between languages in the same session
- **Live streaming**: Real-time translation into English
- **40+ supported input languages** [1]

#### 4. Multiple Target Languages
Translate into up to 2 target languages simultaneously with a single API call.

## Real-World Applications

### Travel & Tourism
```python
# Travel interpreter scenario
# Automatically translates any input language to local language
async def travel_interpreter():
    # User speaks in any of 40+ supported languages
    # System automatically detects and translates to local language
    pass
```

### Business Meetings
```javascript
// Multilingual business meeting
// All participants can speak their native language
// System translates everything to a common language
const meetingTranslator = new SpeechTranslator({
    targetLanguage: 'en',
    autoDetectSourceLanguage: true
});
```

### Customer Service
```csharp
// Contact center serving global clients
// No need to know customer's language in advance
var translator = new SpeechTranslator();
translator.AutoDetectSourceLanguage = true;
translator.TargetLanguages = new[] { "en", "es" };
```

## Implementation Examples

### REST API - Real-time Translation

```http
POST /speech/translation/v1.0/stream HTTP/1.1
Host: your-region.api.cognitive.microsoft.com
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
    "config": {
        "inputLanguage": "auto", // Multi-lingual mode
        "targetLanguages": ["en", "es"],
        "enableVoiceOutput": true,
        "voiceFont": "en-US-JennyNeural"
    },
    "audio": {
        "format": "pcm",
        "sampleRate": 16000,
        "channels": 1
    }
}
```

### Python - Multi-lingual Translation

```python
import azure.cognitiveservices.speech as speechsdk
import os

def create_multilingual_translator():
    """Create a speech translator with multi-lingual support"""
    
    # Configuration
    speech_key = os.environ["AZURE_SPEECH_KEY"]
    service_region = os.environ["AZURE_SPEECH_REGION"]
    
    # Create translation config
    translation_config = speechsdk.translation.SpeechTranslationConfig(
        subscription=speech_key, 
        region=service_region
    )
    
    # Enable multi-lingual mode (no source language needed)
    translation_config.set_property(
        speechsdk.PropertyId.SpeechServiceConnection_SingleLanguageIdPriority,
        "Latency"
    )
    
    # Set target languages
    translation_config.add_target_language("en")
    translation_config.add_target_language("es")
    translation_config.add_target_language("fr")
    
    # Configure voice output
    translation_config.voice_name = "en-US-AriaNeural"
    
    return speechsdk.translation.TranslationRecognizer(
        translation_config=translation_config
    )

async def translate_speech_realtime():
    """Real-time speech translation example"""
    
    translator = create_multilingual_translator()
    
    # Event handlers
    def handle_translation_result(evt):
        result = evt.result
        
        print(f"Recognized: {result.text}")
        print(f"Detected language: {result.properties.get('DetectedLanguage')}")
        
        for language, translation in result.translations.items():
            print(f"Translation ({language}): {translation}")
    
    def handle_synthesis_result(evt):
        audio_data = evt.result.audio
        # Play or save audio data
        print(f"Synthesized {len(audio_data)} bytes of audio")
    
    # Connect events
    translator.recognized.connect(handle_translation_result)
    translator.synthesis_result.connect(handle_synthesis_result)
    
    # Start continuous translation
    translator.start_continuous_recognition()
    
    print("Speak into your microphone (any of 40+ supported languages)...")
    print("Translation will appear in real-time")
    
    # Keep running
    import time
    time.sleep(30)
    
    translator.stop_continuous_recognition()

if __name__ == "__main__":
    import asyncio
    asyncio.run(translate_speech_realtime())
```

### JavaScript - Browser Translation

```javascript
class MultilingualSpeechTranslator {
    constructor() {
        this.speechConfig = SpeechSDK.SpeechTranslationConfig.fromSubscription(
            process.env.AZURE_SPEECH_KEY,
            process.env.AZURE_SPEECH_REGION
        );
        
        // Multi-lingual mode - no source language specified
        this.speechConfig.setProperty(
            SpeechSDK.PropertyId.SpeechServiceConnection_SingleLanguageIdPriority,
            "Latency"
        );
        
        // Add target languages
        this.speechConfig.addTargetLanguage("en");
        this.speechConfig.addTargetLanguage("es");
        this.speechConfig.addTargetLanguage("fr");
        
        // Configure voice
        this.speechConfig.voiceName = "en-US-AriaNeural";
        
        this.translator = new SpeechSDK.TranslationRecognizer(this.speechConfig);
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.translator.recognized = (s, e) => {
            if (e.result.reason === SpeechSDK.ResultReason.TranslatedSpeech) {
                console.log(`Recognized: ${e.result.text}`);
                
                // Display translations
                for (const [language, translation] of Object.entries(e.result.translations)) {
                    console.log(`${language}: ${translation}`);
                    this.displayTranslation(language, translation);
                }
            }
        };
        
        this.translator.synthesizing = (s, e) => {
            console.log(`Synthesizing audio: ${e.result.audio.length} bytes`);
            this.playAudio(e.result.audio);
        };
        
        this.translator.canceled = (s, e) => {
            console.error(`Translation canceled: ${e.errorDetails}`);
        };
    }
    
    async startTranslation() {
        try {
            await this.translator.startContinuousRecognitionAsync();
            console.log("🎤 Speak in any language - translation starting...");
            
            // Update UI
            document.getElementById('status').textContent = 
                'Listening... Speak in any language';
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
        } catch (error) {
            console.error("Failed to start translation:", error);
        }
    }
    
    async stopTranslation() {
        try {
            await this.translator.stopContinuousRecognitionAsync();
            console.log("Translation stopped");
            
            // Update UI
            document.getElementById('status').textContent = 'Ready';
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
        } catch (error) {
            console.error("Failed to stop translation:", error);
        }
    }
    
    displayTranslation(language, text) {
        const translationDiv = document.getElementById('translations');
        const languageDiv = document.createElement('div');
        languageDiv.className = 'translation-item';
        languageDiv.innerHTML = `
            <span class="language">${language.toUpperCase()}:</span>
            <span class="text">${text}</span>
        `;
        translationDiv.appendChild(languageDiv);
        
        // Auto-scroll to bottom
        translationDiv.scrollTop = translationDiv.scrollHeight;
    }
    
    playAudio(audioData) {
        const audioBlob = new Blob([audioData], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    }
}

// Initialize translator when page loads
let translator;
document.addEventListener('DOMContentLoaded', () => {
    translator = new MultilingualSpeechTranslator();
    
    document.getElementById('startBtn').onclick = () => translator.startTranslation();
    document.getElementById('stopBtn').onclick = () => translator.stopTranslation();
});
```

### C# - Enterprise Translation Service

```csharp
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.Translation;
using System;
using System.Threading.Tasks;

public class EnterpriseTranslationService
{
    private readonly SpeechTranslationConfig config;
    private readonly TranslationRecognizer recognizer;
    
    public EnterpriseTranslationService(string subscriptionKey, string region)
    {
        config = SpeechTranslationConfig.FromSubscription(subscriptionKey, region);
        
        // Enable multi-lingual mode
        config.SetProperty(
            PropertyId.SpeechServiceConnection_SingleLanguageIdPriority,
            "Latency"
        );
        
        // Add multiple target languages
        config.AddTargetLanguage("en");
        config.AddTargetLanguage("es");
        config.AddTargetLanguage("fr");
        config.AddTargetLanguage("de");
        
        // Configure high-quality voice
        config.VoiceName = "en-US-AriaNeural";
        
        // Use default microphone
        var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
        recognizer = new TranslationRecognizer(config, audioConfig);
        
        SetupEventHandlers();
    }
    
    private void SetupEventHandlers()
    {
        recognizer.Recognized += OnTranslationRecognized;
        recognizer.Recognizing += OnTranslationRecognizing;
        recognizer.SynthesisResult += OnSynthesisResult;
        recognizer.Canceled += OnCanceled;
    }
    
    private void OnTranslationRecognized(object sender, TranslationRecognitionEventArgs e)
    {
        if (e.Result.Reason == ResultReason.TranslatedSpeech)
        {
            Console.WriteLine($"✅ Recognized: {e.Result.Text}");
            
            // Display all translations
            foreach (var translation in e.Result.Translations)
            {
                Console.WriteLine($"🌐 {translation.Key}: {translation.Value}");
            }
            
            // Log detected language
            var detectedLanguage = e.Result.Properties.GetProperty(
                PropertyId.SpeechServiceConnection_AutoDetectSourceLanguageResult
            );
            Console.WriteLine($"🔍 Detected language: {detectedLanguage}");
        }
    }
    
    private void OnTranslationRecognizing(object sender, TranslationRecognitionEventArgs e)
    {
        if (e.Result.Reason == ResultReason.TranslatingSpeech)
        {
            Console.Write($"⏳ Recognizing: {e.Result.Text}");
            
            foreach (var translation in e.Result.Translations)
            {
                Console.Write($" -> {translation.Key}: {translation.Value}");
            }
            Console.WriteLine();
        }
    }
    
    private void OnSynthesisResult(object sender, TranslationSynthesisEventArgs e)
    {
        if (e.Result.Audio.Length > 0)
        {
            Console.WriteLine($"🔊 Synthesized {e.Result.Audio.Length} bytes");
            // Play audio or save to file
            PlayAudio(e.Result.Audio);
        }
    }
    
    private void OnCanceled(object sender, TranslationRecognitionCanceledEventArgs e)
    {
        Console.WriteLine($"❌ Translation canceled: {e.ErrorDetails}");
    }
    
    public async Task StartContinuousTranslationAsync()
    {
        Console.WriteLine("🎤 Starting multi-lingual translation...");
        Console.WriteLine("Speak in any of 40+ supported languages");
        
        await recognizer.StartContinuousRecognitionAsync();
    }
    
    public async Task StopTranslationAsync()
    {
        await recognizer.StopContinuousRecognitionAsync();
        Console.WriteLine("🛑 Translation stopped");
    }
    
    private void PlayAudio(byte[] audioData)
    {
        // Implementation to play audio
        // Could use NAudio, DirectSound, or other audio libraries
    }
    
    public void Dispose()
    {
        recognizer?.Dispose();
        config?.Dispose();
    }
}

// Usage example
class Program
{
    static async Task Main(string[] args)
    {
        var service = new EnterpriseTranslationService(
            Environment.GetEnvironmentVariable("AZURE_SPEECH_KEY"),
            Environment.GetEnvironmentVariable("AZURE_SPEECH_REGION")
        );
        
        try
        {
            await service.StartContinuousTranslationAsync();
            
            Console.WriteLine("Press any key to stop...");
            Console.ReadKey();
            
            await service.StopTranslationAsync();
        }
        finally
        {
            service.Dispose();
        }
    }
}
```

## Advanced Features

### Language Detection and Switching
```python
def setup_language_detection():
    """Configure automatic language detection"""
    
    config = speechsdk.translation.SpeechTranslationConfig(
        subscription=speech_key,
        region=service_region
    )
    
    # Enable continuous language identification
    config.set_property(
        speechsdk.PropertyId.SpeechServiceConnection_LanguageIdMode,
        "Continuous"
    )
    
    # Set language detection candidates (optional)
    auto_detect_config = speechsdk.AutoDetectSourceLanguageConfig(
        languages=["en-US", "es-ES", "fr-FR", "de-DE", "ja-JP"]
    )
    
    return config, auto_detect_config
```

### Custom Translation Models
```javascript
// Use custom translation models for domain-specific content
const config = SpeechSDK.SpeechTranslationConfig.fromSubscription(
    subscriptionKey, 
    region
);

// Set custom translation model category
config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_TranslationToLanguages,
    "medical-domain-model"
);
```

### Batch Translation for Audio Files
```csharp
public async Task<TranslationResult> TranslateAudioFileAsync(string filePath)
{
    var audioConfig = AudioConfig.FromWavFileInput(filePath);
    var recognizer = new TranslationRecognizer(config, audioConfig);
    
    var result = await recognizer.RecognizeOnceAsync();
    
    if (result.Reason == ResultReason.TranslatedSpeech)
    {
        return new TranslationResult
        {
            OriginalText = result.Text,
            Translations = result.Translations,
            DetectedLanguage = result.Properties.GetProperty(
                PropertyId.SpeechServiceConnection_AutoDetectSourceLanguageResult
            )
        };
    }
    
    throw new Exception($"Translation failed: {result.Reason}");
}
```

## Best Practices

### 1. Optimize for Your Use Case
```python
# For low latency (real-time conversations)
config.set_property(
    speechsdk.PropertyId.SpeechServiceConnection_SingleLanguageIdPriority,
    "Latency"
)

# For high accuracy (recorded content)
config.set_property(
    speechsdk.PropertyId.SpeechServiceConnection_SingleLanguageIdPriority,
    "Accuracy"
)
```

### 2. Handle Multiple Languages Efficiently
```javascript
class EfficientMultilingualTranslator {
    constructor() {
        this.languageStats = new Map();
        this.adaptiveThreshold = 0.8;
    }
    
    updateLanguageStatistics(detectedLanguage, confidence) {
        if (!this.languageStats.has(detectedLanguage)) {
            this.languageStats.set(detectedLanguage, []);
        }
        
        this.languageStats.get(detectedLanguage).push(confidence);
        
        // Adapt detection threshold based on patterns
        this.adaptiveThreshold = this.calculateOptimalThreshold();
    }
    
    calculateOptimalThreshold() {
        // Algorithm to optimize detection threshold
        // based on usage patterns
        return 0.8;
    }
}
```

### 3. Error Handling and Resilience
```csharp
public class ResilientTranslationService
{
    private readonly int maxRetries = 3;
    private readonly TimeSpan retryDelay = TimeSpan.FromSeconds(2);
    
    public async Task<string> TranslateWithRetryAsync(string text, string targetLang)
    {
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await PerformTranslationAsync(text, targetLang);
            }
            catch (Exception ex) when (attempt < maxRetries)
            {
                Console.WriteLine($"Translation attempt {attempt} failed: {ex.Message}");
                await Task.Delay(retryDelay * attempt); // Exponential backoff
            }
        }
        
        throw new Exception("Translation failed after all retry attempts");
    }
}
```

## Cost Optimization

### 1. Pricing Structure
- **Speech Translation**: $2.50 per hour (up to 2 target languages)
- **Additional languages**: $10 per million characters (character-based pricing)
- **Multi-lingual mode**: Same pricing structure [1]

### 2. Cost-Effective Strategies
```python
def optimize_translation_costs():
    """Strategies to optimize translation costs"""
    
    # 1. Use appropriate quality settings
    config.set_property(
        speechsdk.PropertyId.SpeechServiceConnection_TranslationRequestStablePartialResult,
        "true"  # Reduces intermediate results
    )
    
    # 2. Batch shorter audio segments
    # 3. Cache common translations
    # 4. Use streaming for real-time, batch for recorded content
    
    return config
```

## Troubleshooting Common Issues

### Issue 1: Language Not Detected
```python
# Solution: Improve audio quality and add language hints
config.set_property(
    speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
    "5000"
)

# Add language detection candidates
auto_detect_config = speechsdk.AutoDetectSourceLanguageConfig(
    languages=["en-US", "es-ES", "fr-FR"]  # Limit to expected languages
)
```

### Issue 2: Poor Translation Quality
```javascript
// Solution: Use domain-specific models and context
const config = SpeechSDK.SpeechTranslationConfig.fromSubscription(key, region);

// Add context for better translation
config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_TranslationRequestStablePartialResult,
    "true"
);

// Use phrase lists for domain-specific terms
const phraseList = SpeechSDK.PhraseListGrammar.fromRecognizer(recognizer);
phraseList.addPhrase("technical terminology");
```

### Issue 3: Audio Quality Problems
```csharp
// Solution: Optimize audio configuration
var audioConfig = AudioConfig.FromStreamInput(
    AudioInputStream.CreatePushStream(
        AudioStreamFormat.GetWaveFormatPCM(16000, 16, 1) // Optimal format
    )
);

// Add noise reduction
config.SetProperty(
    PropertyId.SpeechServiceConnection_EnableAudioLogging,
    "false" // Disable for production
);
```

## Next Steps

In the next lesson, we'll explore **Voice Commands** and learn how to build interactive voice-controlled applications that respond to user commands in multiple languages.

## Summary

In this lesson, you learned about:
- Azure AI Speech Translation capabilities including multi-lingual support
- Real-time speech-to-speech and speech-to-text translation
- Implementation across multiple programming languages
- Advanced features like automatic language detection
- Best practices for cost optimization and error handling
- Building applications that break down language barriers

Speech Translation opens up incredible possibilities for global communication, making it easier than ever to build applications that connect people across language barriers.

## References
[1] Microsoft Learn - Speech Translation: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation
[2] Azure AI Speech Translation API Enhancements: https://techcommunity.microsoft.com/blog/azure-ai-services-blog/announcing-video-translation--speech-translation-api-enhancements/4148007
[3] Microsoft Learn - Translate Speech Training: https://learn.microsoft.com/en-us/training/modules/translate-speech-speech-service/ 