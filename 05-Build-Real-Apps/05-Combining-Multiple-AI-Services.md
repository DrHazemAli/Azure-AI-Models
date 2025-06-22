# Lesson 5.5: Combining Multiple AI Services

## Learning Objectives
- Integrate multiple Azure AI services into a single application
- Design service orchestration and workflow management
- Implement error handling and fallback mechanisms
- Create a comprehensive AI-powered application

## Introduction

The power of AI applications often comes from combining multiple services to create comprehensive solutions. In this lesson, we'll build an intelligent document processing system that combines Computer Vision, Language Services, Speech, and OpenAI to create a complete AI workflow.

## Architecture Overview

```
Document Upload → Vision (OCR) → Language (Analysis) → OpenAI (Summarization) → Speech (Audio Summary)
                ↓
          Text Translation → Sentiment Analysis → Key Phrase Extraction
```

## Step 1: Multi-Service Application

### requirements.txt
```txt
flask==2.3.3
azure-cognitiveservices-vision-computervision==0.9.0
azure-ai-textanalytics==5.3.0
azure-cognitiveservices-speech==1.34.0
azure-cognitiveservices-language-translator==1.0.0
openai==1.3.0
azure-storage-blob==12.19.0
python-dotenv==1.0.0
```

### app.py
```python
import os
from flask import Flask, request, jsonify, render_template
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.ai.textanalytics import TextAnalyticsClient
from azure.cognitiveservices.speech import SpeechConfig, SpeechSynthesizer
from azure.core.credentials import AzureKeyCredential
from msrest.authentication import CognitiveServicesCredentials
from openai import AzureOpenAI
import uuid
import base64

app = Flask(__name__)

# Initialize all AI services
cv_client = ComputerVisionClient(
    os.getenv('COMPUTER_VISION_ENDPOINT'),
    CognitiveServicesCredentials(os.getenv('COMPUTER_VISION_KEY'))
)

text_client = TextAnalyticsClient(
    endpoint=os.getenv('TEXT_ANALYTICS_ENDPOINT'),
    credential=AzureKeyCredential(os.getenv('TEXT_ANALYTICS_KEY'))
)

speech_config = SpeechConfig(
    subscription=os.getenv('SPEECH_KEY'),
    region=os.getenv('SPEECH_REGION')
)

openai_client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-02-01",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

class IntelligentDocumentProcessor:
    def __init__(self):
        self.processing_results = {}
    
    def extract_text_from_image(self, image_url):
        """Extract text using Computer Vision OCR"""
        try:
            read_response = cv_client.read(image_url, raw=True)
            operation_id = read_response.headers["Operation-Location"].split("/")[-1]
            
            import time
            while True:
                read_result = cv_client.get_read_result(operation_id)
                if read_result.status.lower() not in ['notstarted', 'running']:
                    break
                time.sleep(1)
            
            extracted_text = ""
            if read_result.status.lower() == 'succeeded':
                for text_result in read_result.analyze_result.read_results:
                    for line in text_result.lines:
                        extracted_text += line.text + "\n"
            
            return extracted_text.strip()
            
        except Exception as e:
            return f"OCR Error: {str(e)}"
    
    def analyze_text_sentiment(self, text):
        """Analyze sentiment and extract key phrases"""
        try:
            # Sentiment analysis
            sentiment_response = text_client.analyze_sentiment(documents=[text])
            sentiment_result = sentiment_response[0]
            
            # Key phrase extraction
            key_phrases_response = text_client.extract_key_phrases(documents=[text])
            key_phrases = key_phrases_response[0].key_phrases
            
            # Language detection
            language_response = text_client.detect_language(documents=[text])
            language = language_response[0].primary_language.name
            
            return {
                'sentiment': sentiment_result.sentiment,
                'confidence_scores': {
                    'positive': sentiment_result.confidence_scores.positive,
                    'neutral': sentiment_result.confidence_scores.neutral,
                    'negative': sentiment_result.confidence_scores.negative
                },
                'key_phrases': key_phrases,
                'language': language
            }
            
        except Exception as e:
            return {'error': f"Text analysis error: {str(e)}"}
    
    def summarize_with_openai(self, text):
        """Generate summary using OpenAI"""
        try:
            response = openai_client.chat.completions.create(
                model="gpt-35-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates concise summaries."},
                    {"role": "user", "content": f"Please summarize this text in 2-3 sentences:\n\n{text}"}
                ],
                max_tokens=150,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Summarization error: {str(e)}"
    
    def generate_audio_summary(self, text):
        """Convert summary to speech"""
        try:
            synthesizer = SpeechSynthesizer(speech_config, None)
            result = synthesizer.speak_text_async(text).get()
            
            if result.reason.name == 'SynthesizingAudioCompleted':
                return base64.b64encode(result.audio_data).decode('utf-8')
            return None
            
        except Exception as e:
            return None
    
    def detect_entities(self, text):
        """Extract named entities"""
        try:
            entities_response = text_client.recognize_entities(documents=[text])
            entities = []
            
            for entity in entities_response[0].entities:
                entities.append({
                    'text': entity.text,
                    'category': entity.category,
                    'confidence': entity.confidence_score
                })
            
            return entities
            
        except Exception as e:
            return []
    
    def process_document_workflow(self, image_url):
        """Complete document processing workflow"""
        workflow_id = str(uuid.uuid4())
        results = {'workflow_id': workflow_id}
        
        try:
            # Step 1: Extract text from image
            results['step1_status'] = 'Processing OCR...'
            extracted_text = self.extract_text_from_image(image_url)
            results['extracted_text'] = extracted_text
            results['step1_status'] = 'Completed'
            
            if extracted_text and not extracted_text.startswith('OCR Error'):
                # Step 2: Analyze text
                results['step2_status'] = 'Analyzing text...'
                text_analysis = self.analyze_text_sentiment(extracted_text)
                results['text_analysis'] = text_analysis
                results['step2_status'] = 'Completed'
                
                # Step 3: Extract entities
                results['step3_status'] = 'Extracting entities...'
                entities = self.detect_entities(extracted_text)
                results['entities'] = entities
                results['step3_status'] = 'Completed'
                
                # Step 4: Generate summary
                results['step4_status'] = 'Generating summary...'
                summary = self.summarize_with_openai(extracted_text)
                results['summary'] = summary
                results['step4_status'] = 'Completed'
                
                # Step 5: Generate audio
                results['step5_status'] = 'Generating audio...'
                audio_summary = self.generate_audio_summary(summary)
                results['audio_summary'] = audio_summary
                results['step5_status'] = 'Completed'
                
                # Generate insights
                results['insights'] = self.generate_insights(text_analysis, entities, summary)
            
            results['status'] = 'Completed'
            return results
            
        except Exception as e:
            results['error'] = str(e)
            results['status'] = 'Failed'
            return results
    
    def generate_insights(self, text_analysis, entities, summary):
        """Generate comprehensive insights"""
        insights = {
            'document_type': self.classify_document_type(entities),
            'sentiment_summary': f"Overall sentiment: {text_analysis.get('sentiment', 'Unknown')}",
            'key_topics': text_analysis.get('key_phrases', [])[:5],
            'important_entities': [e for e in entities if e['confidence'] > 0.8][:5],
            'summary_length': len(summary.split()),
            'language': text_analysis.get('language', 'Unknown')
        }
        return insights
    
    def classify_document_type(self, entities):
        """Classify document type based on entities"""
        entity_categories = [e['category'] for e in entities]
        
        if 'Person' in entity_categories and 'Organization' in entity_categories:
            return 'Business Document'
        elif 'DateTime' in entity_categories and 'Location' in entity_categories:
            return 'Event/Meeting Document'
        elif 'Quantity' in entity_categories:
            return 'Financial Document'
        else:
            return 'General Document'

processor = IntelligentDocumentProcessor()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_document', methods=['POST'])
def process_document():
    if 'document' not in request.files:
        return jsonify({'error': 'No document provided'}), 400
    
    # Upload document and get URL (simplified - use blob storage in production)
    document_file = request.files['document']
    
    # For demo purposes, assume we have the image URL
    # In production, upload to blob storage first
    image_url = "https://example.com/uploaded-document.jpg"
    
    # Process document through complete workflow
    results = processor.process_document_workflow(image_url)
    
    return jsonify(results)

@app.route('/workflow_status/<workflow_id>')
def get_workflow_status(workflow_id):
    # Return workflow status (implement persistence in production)
    return jsonify({'status': 'Processing', 'workflow_id': workflow_id})

if __name__ == '__main__':
    app.run(debug=True)
```

## Step 2: Frontend for Multi-Service App

### templates/index.html
```html
<!DOCTYPE html>
<html>
<head>
    <title>Intelligent Document Processor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .upload-area { border: 2px dashed #007acc; padding: 40px; text-align: center; margin: 20px 0; cursor: pointer; }
        .workflow-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 20px 0; }
        .step { padding: 15px; border-radius: 8px; text-align: center; background: #f8f9fa; border: 2px solid #e9ecef; }
        .step.active { background: #cce5ff; border-color: #007acc; }
        .step.completed { background: #d4edda; border-color: #28a745; }
        .step.failed { background: #f8d7da; border-color: #dc3545; }
        .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .result-panel { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; }
        .entity { display: inline-block; background: #e7f3ff; padding: 3px 8px; margin: 2px; border-radius: 12px; font-size: 12px; }
        .sentiment { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .sentiment.positive { background: #d4edda; }
        .sentiment.negative { background: #f8d7da; }
        .sentiment.neutral { background: #e2e3e5; }
        audio { width: 100%; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Intelligent Document Processor</h1>
        <p>Upload a document image to extract text, analyze sentiment, summarize content, and generate insights</p>
        
        <div class="upload-area" onclick="document.getElementById('documentInput').click()">
            <h3>📄 Upload Document Image</h3>
            <p>JPG, PNG, PDF (first page)</p>
            <input type="file" id="documentInput" accept="image/*,.pdf" style="display: none;">
        </div>
        
        <div class="workflow-steps" id="workflowSteps" style="display: none;">
            <div class="step" id="step1">
                <h4>1. OCR</h4>
                <p>Extract Text</p>
            </div>
            <div class="step" id="step2">
                <h4>2. Analysis</h4>
                <p>Sentiment & Language</p>
            </div>
            <div class="step" id="step3">
                <h4>3. Entities</h4>
                <p>Extract Key Info</p>
            </div>
            <div class="step" id="step4">
                <h4>4. Summary</h4>
                <p>AI Summary</p>
            </div>
            <div class="step" id="step5">
                <h4>5. Audio</h4>
                <p>Speech Output</p>
            </div>
        </div>
        
        <div id="results" style="display: none;">
            <h2>📊 Processing Results</h2>
            
            <div class="results-grid">
                <div class="result-panel">
                    <h3>📝 Extracted Text</h3>
                    <div id="extractedText"></div>
                </div>
                
                <div class="result-panel">
                    <h3>💭 Sentiment Analysis</h3>
                    <div id="sentimentResult"></div>
                </div>
                
                <div class="result-panel">
                    <h3>🎯 Key Entities</h3>
                    <div id="entitiesResult"></div>
                </div>
                
                <div class="result-panel">
                    <h3>📋 AI Summary</h3>
                    <div id="summaryResult"></div>
                    <audio id="audioSummary" controls style="display: none;"></audio>
                </div>
            </div>
            
            <div class="result-panel" style="margin-top: 20px;">
                <h3>🔍 Document Insights</h3>
                <div id="insightsResult"></div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('documentInput').addEventListener('change', processDocument);
        
        async function processDocument(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Show workflow steps
            document.getElementById('workflowSteps').style.display = 'grid';
            document.getElementById('results').style.display = 'none';
            
            const formData = new FormData();
            formData.append('document', file);
            
            try {
                // Simulate workflow steps
                await simulateWorkflow();
                
                const response = await fetch('/process_document', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                displayResults(data);
                
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('step1').classList.add('failed');
            }
        }
        
        async function simulateWorkflow() {
            const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
            
            for (let i = 0; i < steps.length; i++) {
                document.getElementById(steps[i]).classList.add('active');
                await new Promise(resolve => setTimeout(resolve, 1000));
                document.getElementById(steps[i]).classList.remove('active');
                document.getElementById(steps[i]).classList.add('completed');
            }
        }
        
        function displayResults(data) {
            document.getElementById('results').style.display = 'block';
            
            // Extracted text
            document.getElementById('extractedText').innerHTML = 
                `<pre>${data.extracted_text || 'No text extracted'}</pre>`;
            
            // Sentiment
            if (data.text_analysis) {
                const sentiment = data.text_analysis.sentiment;
                const sentimentDiv = document.getElementById('sentimentResult');
                sentimentDiv.innerHTML = `
                    <div class="sentiment ${sentiment.toLowerCase()}">
                        <strong>${sentiment}</strong><br>
                        Positive: ${Math.round(data.text_analysis.confidence_scores.positive * 100)}%<br>
                        Neutral: ${Math.round(data.text_analysis.confidence_scores.neutral * 100)}%<br>
                        Negative: ${Math.round(data.text_analysis.confidence_scores.negative * 100)}%
                    </div>
                    <p><strong>Language:</strong> ${data.text_analysis.language}</p>
                    <p><strong>Key Phrases:</strong> ${data.text_analysis.key_phrases.join(', ')}</p>
                `;
            }
            
            // Entities
            if (data.entities) {
                const entitiesDiv = document.getElementById('entitiesResult');
                entitiesDiv.innerHTML = data.entities.map(entity => 
                    `<span class="entity">${entity.text} (${entity.category})</span>`
                ).join('');
            }
            
            // Summary
            document.getElementById('summaryResult').innerHTML = 
                `<p>${data.summary || 'No summary available'}</p>`;
            
            // Audio summary
            if (data.audio_summary) {
                const audio = document.getElementById('audioSummary');
                const audioBlob = base64ToBlob(data.audio_summary, 'audio/wav');
                audio.src = URL.createObjectURL(audioBlob);
                audio.style.display = 'block';
            }
            
            // Insights
            if (data.insights) {
                const insights = data.insights;
                document.getElementById('insightsResult').innerHTML = `
                    <p><strong>Document Type:</strong> ${insights.document_type}</p>
                    <p><strong>Language:</strong> ${insights.language}</p>
                    <p><strong>Summary Length:</strong> ${insights.summary_length} words</p>
                    <p><strong>Top Topics:</strong> ${insights.key_topics.join(', ')}</p>
                    <p><strong>Sentiment:</strong> ${insights.sentiment_summary}</p>
                `;
            }
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
    </script>
</body>
</html>
```

## Step 3: Service Orchestration Patterns

### Workflow Manager
```python
class WorkflowManager:
    def __init__(self):
        self.workflows = {}
    
    def register_step(self, workflow_id, step_name, status, result=None):
        """Register workflow step completion"""
        if workflow_id not in self.workflows:
            self.workflows[workflow_id] = {}
        
        self.workflows[workflow_id][step_name] = {
            'status': status,
            'result': result,
            'timestamp': datetime.utcnow()
        }
    
    def get_workflow_status(self, workflow_id):
        """Get current workflow status"""
        return self.workflows.get(workflow_id, {})
```

### Error Handling and Fallbacks
```python
class ServiceOrchestrator:
    def __init__(self):
        self.fallback_strategies = {
            'ocr_failure': self.ocr_fallback,
            'sentiment_failure': self.sentiment_fallback,
            'summary_failure': self.summary_fallback
        }
    
    def execute_with_fallback(self, primary_function, fallback_key, *args, **kwargs):
        """Execute function with fallback strategy"""
        try:
            return primary_function(*args, **kwargs)
        except Exception as e:
            print(f"Primary function failed: {e}")
            fallback = self.fallback_strategies.get(fallback_key)
            if fallback:
                return fallback(*args, **kwargs)
            raise e
    
    def ocr_fallback(self, image_url):
        """Fallback OCR strategy"""
        return "Text extraction failed. Please try with a clearer image."
    
    def sentiment_fallback(self, text):
        """Fallback sentiment analysis"""
        return {
            'sentiment': 'Neutral',
            'confidence_scores': {'positive': 0.33, 'neutral': 0.34, 'negative': 0.33}
        }
```

## Step 4: Performance Optimization

### Parallel Processing
```python
import asyncio
import concurrent.futures

class ParallelProcessor:
    def __init__(self):
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)
    
    async def process_parallel_analysis(self, text):
        """Run multiple text analysis services in parallel"""
        tasks = []
        
        # Run sentiment and entity analysis in parallel
        loop = asyncio.get_event_loop()
        
        sentiment_task = loop.run_in_executor(
            self.executor, 
            processor.analyze_text_sentiment, 
            text
        )
        
        entities_task = loop.run_in_executor(
            self.executor, 
            processor.detect_entities, 
            text
        )
        
        summary_task = loop.run_in_executor(
            self.executor, 
            processor.summarize_with_openai, 
            text
        )
        
        # Wait for all tasks to complete
        sentiment_result, entities_result, summary_result = await asyncio.gather(
            sentiment_task, entities_task, summary_task
        )
        
        return {
            'sentiment': sentiment_result,
            'entities': entities_result,
            'summary': summary_result
        }
```

## Step 5: Monitoring and Analytics

### Service Health Monitoring
```python
class ServiceMonitor:
    def __init__(self):
        self.service_health = {}
        self.response_times = {}
    
    def monitor_service_call(self, service_name, func, *args, **kwargs):
        """Monitor service call performance"""
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            
            # Record success
            self.service_health[service_name] = {
                'status': 'healthy',
                'last_check': datetime.utcnow(),
                'response_time': end_time - start_time
            }
            
            return result
            
        except Exception as e:
            # Record failure
            self.service_health[service_name] = {
                'status': 'unhealthy',
                'last_check': datetime.utcnow(),
                'error': str(e)
            }
            raise e
```

## Best Practices for Multi-Service Integration

1. **Service Isolation:** Design loosely coupled services
2. **Error Handling:** Implement comprehensive error handling and fallbacks
3. **Monitoring:** Monitor each service independently
4. **Rate Limiting:** Respect API limits and implement backoff strategies
5. **Caching:** Cache results to reduce API calls and costs
6. **Security:** Secure inter-service communication
7. **Testing:** Test each service integration thoroughly

## Common Integration Patterns

### Sequential Processing
- Services called one after another
- Results from one service feed into the next
- Simple but slower execution

### Parallel Processing  
- Multiple services called simultaneously
- Faster execution but more complex error handling
- Good for independent operations

### Event-Driven Architecture
- Services communicate through events
- Highly scalable and resilient
- More complex to implement

## Summary

You've learned how to:
- Integrate multiple Azure AI services into a single application
- Design service orchestration workflows
- Implement error handling and fallback mechanisms
- Optimize performance with parallel processing
- Monitor service health and performance
- Create comprehensive AI-powered applications

This multi-service approach enables building sophisticated AI applications that leverage the strengths of different specialized services.

## Congratulations! 

You've completed Section 5: Build Real Apps. You now have the skills to:
- Plan and architect AI applications
- Build smart chatbots with conversation management
- Create image analysis applications
- Develop voice assistants with speech capabilities
- Combine multiple AI services into comprehensive solutions

## Next Steps

Continue to Section 6: Advanced Topics to learn about deployment, security, scaling, and production best practices for your AI applications.

## References

[1] Azure AI Services Integration - https://docs.microsoft.com/azure/cognitive-services/
[2] Workflow Orchestration - https://docs.microsoft.com/azure/logic-apps/
[3] Service Monitoring - https://docs.microsoft.com/azure/azure-monitor/ 