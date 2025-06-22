# Lesson 5.4: Voice Assistant

## Learning Objectives
- Build a voice assistant using Azure Speech Services
- Implement speech-to-text and text-to-speech
- Create voice command processing
- Integrate with language understanding

## Architecture Overview

```
Voice Input → Speech-to-Text → Language Processing → Response → Text-to-Speech → Audio Output
```

## Step 1: Azure Setup

```bash
# Create resource group
az group create --name rg-voiceassistant --location eastus

# Create Speech service
az cognitiveservices account create \
  --name speech-voiceassistant \
  --resource-group rg-voiceassistant \
  --kind SpeechServices \
  --sku S0 \
  --location eastus

# Create OpenAI service for NLU
az cognitiveservices account create \
  --name openai-voiceassistant \
  --resource-group rg-voiceassistant \
  --kind OpenAI \
  --sku S0 \
  --location eastus
```

## Step 2: Backend Implementation

### requirements.txt
```txt
flask==2.3.3
azure-cognitiveservices-speech==1.34.0
openai==1.3.0
flask-socketio==5.3.6
python-dotenv==1.0.0
```

### app.py
```python
import os
import azure.cognitiveservices.speech as speechsdk
from openai import AzureOpenAI
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import base64
import io
import wave

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Speech SDK
speech_config = speechsdk.SpeechConfig(
    subscription=os.getenv('AZURE_SPEECH_KEY'),
    region=os.getenv('AZURE_SPEECH_REGION')
)
speech_config.speech_recognition_language = "en-US"
speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"

# Initialize OpenAI client
openai_client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-02-01",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

class VoiceAssistant:
    def __init__(self):
        self.conversation_history = []
        self.system_message = """
        You are a helpful voice assistant. Keep responses concise and conversational.
        Respond naturally as if speaking to the user.
        """
    
    def speech_to_text(self, audio_data):
        """Convert speech to text"""
        try:
            # Create audio stream from data
            audio_stream = speechsdk.audio.PushAudioInputStream()
            audio_config = speechsdk.audio.AudioConfig(stream=audio_stream)
            
            # Create speech recognizer
            speech_recognizer = speechsdk.SpeechRecognizer(
                speech_config=speech_config,
                audio_config=audio_config
            )
            
            # Push audio data
            audio_stream.write(audio_data)
            audio_stream.close()
            
            # Recognize speech
            result = speech_recognizer.recognize_once()
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                return result.text
            else:
                return "Sorry, I couldn't understand that."
                
        except Exception as e:
            return f"Speech recognition error: {str(e)}"
    
    def process_command(self, text):
        """Process voice command and generate response"""
        try:
            # Add to conversation history
            self.conversation_history.append({"role": "user", "content": text})
            
            # Build messages for OpenAI
            messages = [{"role": "system", "content": self.system_message}]
            messages.extend(self.conversation_history[-10:])  # Keep last 10 exchanges
            
            # Generate response
            response = openai_client.chat.completions.create(
                model="gpt-35-turbo",
                messages=messages,
                max_tokens=150,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Add to history
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            return ai_response
            
        except Exception as e:
            return f"I'm sorry, I encountered an error processing your request."
    
    def text_to_speech(self, text):
        """Convert text to speech"""
        try:
            # Create audio config for in-memory stream
            audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=False)
            
            # Create speech synthesizer
            speech_synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=speech_config,
                audio_config=None
            )
            
            # Synthesize speech
            result = speech_synthesizer.speak_text_async(text).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                return result.audio_data
            else:
                return None
                
        except Exception as e:
            print(f"TTS error: {e}")
            return None

voice_assistant = VoiceAssistant()

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('voice_input')
def handle_voice_input(data):
    """Handle voice input from client"""
    try:
        # Decode audio data
        audio_data = base64.b64decode(data['audio'])
        
        # Convert speech to text
        text = voice_assistant.speech_to_text(audio_data)
        emit('transcription', {'text': text})
        
        # Process command
        response_text = voice_assistant.process_command(text)
        emit('response_text', {'text': response_text})
        
        # Convert response to speech
        audio_response = voice_assistant.text_to_speech(response_text)
        
        if audio_response:
            # Encode audio as base64
            audio_base64 = base64.b64encode(audio_response).decode('utf-8')
            emit('audio_response', {'audio': audio_base64})
        
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('text_input')
def handle_text_input(data):
    """Handle text input from client"""
    try:
        text = data['text']
        
        # Process command
        response_text = voice_assistant.process_command(text)
        emit('response_text', {'text': response_text})
        
        # Convert response to speech
        audio_response = voice_assistant.text_to_speech(response_text)
        
        if audio_response:
            audio_base64 = base64.b64encode(audio_response).decode('utf-8')
            emit('audio_response', {'audio': audio_base64})
        
    except Exception as e:
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, debug=True)
```

## Step 3: Frontend Implementation

### templates/index.html
```html
<!DOCTYPE html>
<html>
<head>
    <title>Voice Assistant</title>
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .voice-button {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
            color: white;
            font-size: 16px;
            cursor: pointer;
            margin: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        
        .voice-button:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 35px rgba(0,0,0,0.3);
        }
        
        .voice-button.recording {
            background: linear-gradient(45deg, #ff4757, #ff3838);
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .text-input {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 25px;
            margin: 20px 0;
            font-size: 16px;
            background: rgba(255,255,255,0.9);
            color: #333;
        }
        
        .send-button {
            padding: 12px 30px;
            border: none;
            border-radius: 25px;
            background: linear-gradient(45deg, #5f27cd, #341f97);
            color: white;
            cursor: pointer;
            font-size: 16px;
            margin-left: 10px;
        }
        
        .conversation {
            max-height: 400px;
            overflow-y: auto;
            margin: 20px 0;
            text-align: left;
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
        }
        
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 10px;
        }
        
        .user-message {
            background: rgba(102, 126, 234, 0.3);
            text-align: right;
        }
        
        .assistant-message {
            background: rgba(118, 75, 162, 0.3);
        }
        
        .status {
            font-style: italic;
            opacity: 0.8;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎤 Voice Assistant</h1>
        <p>Click the microphone to talk or type your message below</p>
        
        <button id="voiceButton" class="voice-button">
            🎤<br>Click to Talk
        </button>
        
        <div>
            <input type="text" id="textInput" class="text-input" placeholder="Or type your message here...">
            <button id="sendButton" class="send-button">Send</button>
        </div>
        
        <div id="status" class="status">Ready to help!</div>
        
        <div id="conversation" class="conversation"></div>
        
        <audio id="audioPlayer" style="display: none;"></audio>
    </div>

    <script>
        const socket = io();
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        
        const voiceButton = document.getElementById('voiceButton');
        const textInput = document.getElementById('textInput');
        const sendButton = document.getElementById('sendButton');
        const status = document.getElementById('status');
        const conversation = document.getElementById('conversation');
        const audioPlayer = document.getElementById('audioPlayer');
        
        // Voice recording
        voiceButton.addEventListener('click', toggleRecording);
        sendButton.addEventListener('click', sendTextMessage);
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendTextMessage();
        });
        
        async function toggleRecording() {
            if (!isRecording) {
                startRecording();
            } else {
                stopRecording();
            }
        }
        
        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    sendAudioMessage(audioBlob);
                };
                
                mediaRecorder.start();
                isRecording = true;
                
                voiceButton.classList.add('recording');
                voiceButton.innerHTML = '⏹️<br>Stop';
                status.textContent = 'Listening...';
                
            } catch (error) {
                console.error('Error starting recording:', error);
                status.textContent = 'Microphone access denied';
            }
        }
        
        function stopRecording() {
            if (mediaRecorder) {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            
            isRecording = false;
            voiceButton.classList.remove('recording');
            voiceButton.innerHTML = '🎤<br>Click to Talk';
            status.textContent = 'Processing...';
        }
        
        function sendAudioMessage(audioBlob) {
            const reader = new FileReader();
            reader.onload = function() {
                const audioBase64 = reader.result.split(',')[1];
                socket.emit('voice_input', { audio: audioBase64 });
            };
            reader.readAsDataURL(audioBlob);
        }
        
        function sendTextMessage() {
            const text = textInput.value.trim();
            if (!text) return;
            
            addMessage(text, 'user');
            socket.emit('text_input', { text: text });
            textInput.value = '';
            status.textContent = 'Processing...';
        }
        
        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            messageDiv.textContent = text;
            conversation.appendChild(messageDiv);
            conversation.scrollTop = conversation.scrollHeight;
        }
        
        function playAudio(audioBase64) {
            const audioBlob = base64ToBlob(audioBase64, 'audio/wav');
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            audioPlayer.play();
        }
        
        function base64ToBlob(base64, mimeType) {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: mimeType });
        }
        
        // Socket event handlers
        socket.on('transcription', (data) => {
            addMessage(data.text, 'user');
        });
        
        socket.on('response_text', (data) => {
            addMessage(data.text, 'assistant');
            status.textContent = 'Ready to help!';
        });
        
        socket.on('audio_response', (data) => {
            playAudio(data.audio);
        });
        
        socket.on('error', (data) => {
            status.textContent = `Error: ${data.message}`;
        });
    </script>
</body>
</html>
```

## Step 4: Environment Configuration

### .env file
```
AZURE_SPEECH_KEY=your-speech-service-key
AZURE_SPEECH_REGION=your-region
AZURE_OPENAI_KEY=your-openai-key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
```

## Step 5: Advanced Features

### Custom Voice Commands
```python
def process_voice_commands(text):
    """Handle specific voice commands"""
    text_lower = text.lower()
    
    if "what time is it" in text_lower:
        from datetime import datetime
        current_time = datetime.now().strftime("%I:%M %p")
        return f"It's currently {current_time}"
    
    elif "weather" in text_lower:
        return "I'd need a weather API to get current weather information"
    
    elif "set reminder" in text_lower:
        return "Reminder functionality would require integration with a task management system"
    
    elif "play music" in text_lower:
        return "Music playback would require integration with a music service"
    
    else:
        # Use general AI response
        return voice_assistant.process_command(text)
```

### Voice Emotion Detection
```python
def analyze_voice_emotion(audio_data):
    """Analyze emotion in voice (requires additional service)"""
    # This would require Azure Speech emotion recognition
    # or integration with other emotion detection services
    pass
```

### Multi-language Support
```python
def detect_language_and_respond(text):
    """Support multiple languages"""
    # Language detection logic
    if is_spanish(text):
        speech_config.speech_synthesis_voice_name = "es-ES-ElviraNeural"
    elif is_french(text):
        speech_config.speech_synthesis_voice_name = "fr-FR-DeniseNeural"
    else:
        speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"
```

## Deployment

```bash
# Create App Service with WebSocket support
az webapp create \
  --name voice-assistant-app \
  --resource-group rg-voiceassistant \
  --plan Standard \
  --runtime "PYTHON|3.9"

# Enable WebSocket
az webapp config set \
  --name voice-assistant-app \
  --resource-group rg-voiceassistant \
  --web-sockets-enabled true
```

## Best Practices

1. **Audio Quality:** Use proper audio formats and sample rates
2. **Latency:** Optimize for real-time performance
3. **Error Handling:** Graceful fallbacks for speech recognition failures
4. **Privacy:** Handle audio data securely
5. **Bandwidth:** Compress audio for better performance
6. **Accessibility:** Provide text alternatives for voice interactions

## Common Issues

**Issue: Poor speech recognition**
- Solution: Ensure good audio quality and reduce background noise

**Issue: High latency**
- Solution: Optimize audio processing and use streaming APIs

**Issue: WebSocket disconnections**
- Solution: Implement reconnection logic

## Summary

You've built a voice assistant that can:
- Convert speech to text in real-time
- Process natural language commands
- Generate intelligent responses
- Convert text back to speech
- Handle both voice and text interactions

This foundation can be extended with custom commands, emotion detection, and multi-language support for various business applications.

## Next Steps

In the final lesson, we'll learn how to combine multiple AI services to create comprehensive intelligent applications.

## References

[1] Azure Speech Services - https://docs.microsoft.com/azure/cognitive-services/speech-service/
[2] Speech SDK for Python - https://docs.microsoft.com/azure/cognitive-services/speech-service/quickstarts/speech-to-text-from-microphone?pivots=programming-language-python
[3] Text-to-Speech - https://docs.microsoft.com/azure/cognitive-services/speech-service/text-to-speech 