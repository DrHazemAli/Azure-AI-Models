# Lesson 3: Text to Speech

Welcome to the art of speech synthesis! In this lesson, you'll master Azure AI Speech's text-to-speech capabilities, transforming written content into lifelike, natural-sounding speech. From basic synthesis to advanced features like neural voices and custom voice creation, you'll learn to give your applications a truly human voice.

## What You'll Learn

By the end of this lesson, you'll be able to:
- Understand text-to-speech technology and Azure's capabilities
- Implement basic and advanced speech synthesis
- Work with neural voices and emotional expressions
- Create custom voices for unique brand experiences
- Use SSML for precise speech control
- Build practical applications with speech synthesis

## Understanding Text-to-Speech

Text-to-speech (TTS) technology converts written text into spoken words, enabling applications to communicate with users through voice. Azure AI Speech offers over 400 neural voices across 140+ languages, providing human-like speech quality with natural intonation and emotional expression.

### Core Capabilities

**Neural Voice Technology**: Advanced AI models that produce incredibly natural-sounding speech with proper prosody, emotion, and speaking styles.

**Multilingual Support**: Over 400 voices spanning 140+ languages and locales, with many voices supporting multiple languages.

**Custom Voice Creation**: Build unique brand voices or recreate specific speaker voices for personalized experiences.

**Speaking Styles**: Different emotional expressions and speaking styles like newscast, cheerful, empathetic, and more.

**Real-Time and Batch Synthesis**: Support for both streaming synthesis and offline audio file generation.

## Voice Types and Features

### Standard Neural Voices

High-quality voices available out-of-the-box:

**Popular English Voices**:
- **Aria** (en-US): Cheerful, conversational female voice
- **Davis** (en-US): Warm, professional male voice  
- **Jenny** (en-US): Friendly, clear female voice
- **Guy** (en-US): Mature, authoritative male voice

**Speaking Styles Example**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">
        <mstts:express-as style="cheerful">
            I'm excited to help you with your project today!
        </mstts:express-as>
    </voice>
</speak>
```

### Multilingual Voices

Voices that can speak multiple languages naturally:

**Example Configuration**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis">
    <voice name="en-US-JennyMultilingualNeural">
        <lang xml:lang="en-US">Hello, welcome to our service.</lang>
        <lang xml:lang="es-ES">Hola, bienvenido a nuestro servicio.</lang>
        <lang xml:lang="fr-FR">Bonjour, bienvenue à notre service.</lang>
    </voice>
</speak>
```

### HD Voices (Preview)

Context-aware voices that automatically detect emotions and adjust tone:

**Features**:
- Automatic emotion detection from text
- Real-time tone adjustment
- Enhanced expressiveness
- Consistent persona maintenance

## Practical Implementation

### Basic Text-to-Speech

**Simple REST API Call**:
```http
POST https://eastus.tts.speech.microsoft.com/cognitiveservices/v1
Content-Type: application/ssml+xml
Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY
X-Microsoft-OutputFormat: riff-24khz-16bit-mono-pcm

<speak version='1.0' xml:lang='en-US'>
    <voice xml:lang='en-US' xml:gender='Female' name='en-US-AriaNeural'>
        Hello! Welcome to Azure AI Speech services.
    </voice>
</speak>
```

**Response**: Audio stream in specified format

### Using Speech SDK

**JavaScript Example**:
```javascript
const sdk = require("microsoft-cognitiveservices-speech-sdk");

// Create speech config
const speechConfig = sdk.SpeechConfig.fromSubscription(
    "your-subscription-key", 
    "your-region"
);

// Set voice
speechConfig.speechSynthesisVoiceName = "en-US-AriaNeural";
speechConfig.speechSynthesisOutputFormat = 
    sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;

// Create synthesizer
const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

// Synthesize text
synthesizer.speakTextAsync(
    "Hello! This is Azure Speech service speaking.",
    result => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            console.log("Speech synthesis completed.");
        }
        synthesizer.close();
    },
    error => {
        console.error(error);
        synthesizer.close();
    }
);
```

**Python Example**:
```python
import azure.cognitiveservices.speech as speechsdk

# Create speech config
speech_config = speechsdk.SpeechConfig(
    subscription="your-subscription-key", 
    region="your-region"
)

# Set voice and output format
speech_config.speech_synthesis_voice_name = "en-US-AriaNeural"
speech_config.set_speech_synthesis_output_format(
    speechsdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm
)

# Create synthesizer
synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)

# Synthesize text
result = synthesizer.speak_text_async(
    "Hello! This is Azure Speech service speaking."
).get()

if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
    print("Speech synthesis completed.")
else:
    print(f"Error: {result.reason}")
```

## Advanced Features with SSML

### Speech Synthesis Markup Language (SSML)

SSML provides fine-grained control over speech synthesis:

**Basic Structure**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">
        Your text content here
    </voice>
</speak>
```

### Prosody Control

**Rate, Pitch, and Volume**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">
        <prosody rate="slow" pitch="low" volume="soft">
            This is spoken slowly, with low pitch and soft volume.
        </prosody>
        
        <prosody rate="fast" pitch="high" volume="loud">
            This is spoken quickly, with high pitch and loud volume!
        </prosody>
    </voice>
</speak>
```

### Emphasis and Breaks

**Adding Emphasis**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">
        This is <emphasis level="moderate">moderately emphasized</emphasis>.
        This is <emphasis level="strong">strongly emphasized</emphasis>!
        
        <break time="2s"/>
        
        This comes after a 2-second pause.
    </voice>
</speak>
```

### Phonetic Pronunciation

**Using Phonemes**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">
        <phoneme alphabet="ipa" ph="təˈmeɪtoʊ">tomato</phoneme>
        <phoneme alphabet="sapi" ph="AX M EH R IH K AX">America</phoneme>
    </voice>
</speak>
```

### Speaking Styles and Emotions

**Emotional Expressions**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">
        <mstts:express-as style="cheerful">
            I'm so happy to help you today!
        </mstts:express-as>
        
        <mstts:express-as style="empathetic">
            I understand this might be frustrating for you.
        </mstts:express-as>
        
        <mstts:express-as style="newscast">
            This is your morning news update.
        </mstts:express-as>
    </voice>
</speak>
```

## Custom Voice Creation

### Personal Voice (Preview)

Create a custom voice with minimal training data:

**Requirements**:
- 5-10 minutes of sample audio
- High-quality recordings
- Consent and verification process
- Limited access approval

**Training Process**:
```json
{
  "personal_voice_creation": {
    "audio_samples": "5-10 minutes",
    "recording_quality": "studio quality preferred",
    "training_time": "1-2 hours",
    "use_cases": ["accessibility", "personalization", "brand voice"]
  }
}
```

### Professional Voice (Custom Neural Voice)

Enterprise-grade custom voice creation:

**Data Requirements**:
- 300-2000 recorded sentences
- Professional voice talent
- Studio-quality recordings
- Extensive training process

**Training Steps**:
1. Data preparation and upload
2. Voice talent consent and verification
3. Model training (several hours)
4. Quality testing and validation
5. Deployment to custom endpoint

## Audio Output Formats

### Supported Formats

**High Quality Formats**:
- Raw-48khz-16bit-mono-pcm (highest quality)
- Riff-48khz-16bit-mono-pcm
- Audio-48khz-96kbitrate-mono-mp3

**Standard Formats**:
- Riff-24khz-16bit-mono-pcm (recommended)
- Audio-24khz-48kbitrate-mono-mp3
- Riff-16khz-16bit-mono-pcm

**Streaming Formats**:
- Webm-24khz-16bit-mono-opus
- Ogg-24khz-16bit-mono-opus

### Format Selection Guide

```javascript
// Quality vs file size considerations
const formatConfig = {
    highQuality: "riff-48khz-16bit-mono-pcm",     // Large files
    balanced: "riff-24khz-16bit-mono-pcm",        // Recommended
    streaming: "webm-24khz-16bit-mono-opus",      // Small files
    mobile: "audio-16khz-32kbitrate-mono-mp3"     // Very small
};
```

## Real-World Applications

### E-Learning and Education

**Interactive Learning Content**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">
        <mstts:express-as style="friendly">
            Welcome to today's lesson on renewable energy.
        </mstts:express-as>
        
        <break time="1s"/>
        
        <mstts:express-as style="newscast">
            Solar power harnesses energy from the sun using photovoltaic cells.
        </mstts:express-as>
    </voice>
</speak>
```

**Features for Education**:
- Multi-language content delivery
- Adjustable speaking rates for different learning levels
- Emotional engagement through expressive voices
- Accessibility for visually impaired students

### Customer Service and Support

**IVR and Automated Systems**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-JennyNeural">
        <mstts:express-as style="customerservice">
            Thank you for calling TechSupport Inc. 
            Your call is important to us.
        </mstts:express-as>
        
        <break time="0.5s"/>
        
        For technical support, press 1.
        For billing questions, press 2.
    </voice>
</speak>
```

**Live Agent Assistance**:
- Real-time script reading
- Consistent brand voice
- Emotional tone matching
- Multilingual customer support

### Content Creation and Media

**Podcast and Audiobook Production**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-DavisNeural">
        <mstts:express-as style="newscast">
            Chapter One: The Beginning
        </mstts:express-as>
        
        <break time="1s"/>
        
        <mstts:express-as style="narration">
            In a small town nestled between rolling hills, 
            lived a young inventor named Sarah.
        </mstts:express-as>
    </voice>
</speak>
```

**Social Media and Marketing**:
- Video narration and voiceovers
- Advertisement and promotional content
- Social media posts with audio
- Brand voice consistency

## Performance and Optimization

### Latency Optimization

**Streaming Synthesis**:
```javascript
// Real-time streaming for low latency
const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

synthesizer.synthesisStarted = (s, e) => {
    console.log("Synthesis started");
};

synthesizer.synthesizing = (s, e) => {
    // Process audio chunks as they arrive
    console.log("Receiving audio data...");
};

synthesizer.synthesisCompleted = (s, e) => {
    console.log("Synthesis completed");
};
```

**Text Streaming API**:
```javascript
// For ChatGPT integration with minimal latency
const textStream = new sdk.SpeechSynthesisTextStream();

// Send text chunks as they become available
textStream.write("Hello, this is the first chunk. ");
textStream.write("This is the second chunk. ");
textStream.close();

synthesizer.speakTextStreamAsync(textStream);
```

### Quality Optimization

**Voice Selection**:
- Choose appropriate voice for content type
- Consider target audience and language
- Test different voices for brand fit
- Use consistent voices across applications

**SSML Best Practices**:
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-AriaNeural">
        <!-- Use appropriate breaks for natural flow -->
        <break time="0.5s"/>
        
        <!-- Emphasize important information -->
        <emphasis level="moderate">important points</emphasis>
        
        <!-- Adjust rate for complex information -->
        <prosody rate="slow">
            Technical explanations benefit from slower delivery.
        </prosody>
    </voice>
</speak>
```

### Cost Management

**Pricing Factors**:
- Character count (including SSML markup)
- Voice type (standard vs custom)
- Output format and quality
- Regional pricing variations

**Cost Optimization**:
```javascript
// Optimize character usage
const optimizeText = {
    removeUnnecessaryMarkup: true,
    cacheCommonPhrases: true,
    useEfficientSSML: true,
    batchSimilarRequests: true
};
```

## Error Handling and Troubleshooting

### Common Issues

**Authentication Errors**:
```javascript
try {
    const result = await synthesizer.speakTextAsync(text);
} catch (error) {
    if (error.code === "Forbidden") {
        console.error("Invalid subscription key or region");
    }
}
```

**SSML Validation**:
```xml
<!-- Common SSML mistakes to avoid -->
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <!-- Always specify voice name -->
    <voice name="en-US-AriaNeural">
        <!-- Properly close all tags -->
        <emphasis level="moderate">emphasized text</emphasis>
        
        <!-- Use valid attribute values -->
        <prosody rate="medium">normal speed text</prosody>
    </voice>
</speak>
```

### Quality Issues

**Poor Audio Quality**:
- Check output format settings
- Verify SSML syntax
- Test with different voices
- Review text preprocessing

**Unnatural Speech**:
- Add appropriate breaks and pauses
- Use phonetic spelling for proper nouns
- Adjust prosody settings
- Consider speaking style changes

## Next Steps

In the next lesson, we'll explore **Speech Translation**, where you'll learn to combine speech recognition and synthesis for real-time multilingual communication.

### Practice Exercises

1. **Basic Synthesis**: Create a simple text-to-speech application
2. **SSML Mastery**: Build an advanced speech synthesis with emotional expressions
3. **Voice Comparison**: Test different voices and styles for your use case
4. **Streaming Implementation**: Build a real-time speech synthesis system

## Key Takeaways

- Azure AI Speech offers over 400 neural voices with human-like quality
- SSML provides precise control over speech characteristics and emotions
- Custom voice creation enables unique brand experiences and personalization
- Real-time and streaming capabilities support low-latency applications
- Proper format selection and optimization are crucial for performance and cost efficiency
- Text-to-speech enhances accessibility, user experience, and content delivery

## References

[1] [Azure AI Speech Text-to-Speech Documentation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech)
[2] [SSML Reference Guide](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup)
[3] [Voice Gallery and Samples](https://speech.microsoft.com/portal/voicegallery)
[4] [Custom Neural Voice](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-neural-voice)
[5] [Speech Synthesis REST API](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech) 