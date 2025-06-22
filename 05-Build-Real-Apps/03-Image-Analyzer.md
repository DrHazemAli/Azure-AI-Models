# Lesson 5.3: Image Analyzer

## Learning Objectives
- Build an image analysis application using Azure Computer Vision
- Implement image upload and processing workflows
- Extract text, objects, and insights from images
- Create a web interface for image analysis

## Architecture Overview

```
User Upload → Blob Storage → Computer Vision API → Analysis Results → Web Interface
```

## Step 1: Azure Setup

### Create Resources
```bash
az group create --name rg-imageanalyzer --location eastus

az cognitiveservices account create \
  --name cv-imageanalyzer \
  --resource-group rg-imageanalyzer \
  --kind ComputerVision \
  --sku S1 \
  --location eastus

az storage account create \
  --name storageimageanalyzer \
  --resource-group rg-imageanalyzer \
  --sku Standard_LRS
```

## Step 2: Python Backend

### requirements.txt
```txt
flask==2.3.3
azure-cognitiveservices-vision-computervision==0.9.0
azure-storage-blob==12.19.0
python-dotenv==1.0.0
```

### app.py
```python
import os
from flask import Flask, request, jsonify, render_template
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.storage.blob import BlobServiceClient
from msrest.authentication import CognitiveServicesCredentials
import uuid

app = Flask(__name__)

# Initialize Computer Vision client
cv_client = ComputerVisionClient(
    os.getenv('COMPUTER_VISION_ENDPOINT'),
    CognitiveServicesCredentials(os.getenv('COMPUTER_VISION_KEY'))
)

# Initialize Blob Storage client
blob_service_client = BlobServiceClient(
    account_url=f"https://{os.getenv('STORAGE_ACCOUNT_NAME')}.blob.core.windows.net",
    credential=os.getenv('STORAGE_ACCOUNT_KEY')
)

class ImageAnalyzer:
    def analyze_image(self, image_url):
        """Analyze image and extract insights"""
        try:
            # Define features to analyze
            features = ['description', 'categories', 'tags', 'objects', 'faces']
            
            # Perform analysis
            analysis = cv_client.analyze_image(image_url, visual_features=features)
            
            results = {
                'description': analysis.description.captions[0].text if analysis.description.captions else '',
                'confidence': analysis.description.captions[0].confidence if analysis.description.captions else 0,
                'tags': [{'name': tag.name, 'confidence': tag.confidence} for tag in analysis.tags],
                'objects': [{
                    'name': obj.object_property,
                    'confidence': obj.confidence,
                    'rectangle': [obj.rectangle.x, obj.rectangle.y, obj.rectangle.w, obj.rectangle.h]
                } for obj in analysis.objects],
                'faces': [{
                    'age': face.age,
                    'gender': face.gender.value
                } for face in analysis.faces]
            }
            
            return results
            
        except Exception as e:
            return {'error': str(e)}
    
    def extract_text(self, image_url):
        """Extract text using OCR"""
        try:
            # Call Read API
            read_response = cv_client.read(image_url, raw=True)
            operation_id = read_response.headers["Operation-Location"].split("/")[-1]
            
            # Wait for completion
            import time
            while True:
                read_result = cv_client.get_read_result(operation_id)
                if read_result.status.lower() not in ['notstarted', 'running']:
                    break
                time.sleep(1)
            
            # Extract text
            text_results = []
            if read_result.status.lower() == 'succeeded':
                for text_result in read_result.analyze_result.read_results:
                    for line in text_result.lines:
                        text_results.append(line.text)
            
            return text_results
            
        except Exception as e:
            return [f"OCR Error: {str(e)}"]

analyzer = ImageAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    image_file = request.files['image']
    
    # Upload to blob storage
    filename = f"{uuid.uuid4()}.jpg"
    blob_client = blob_service_client.get_blob_client(container="images", blob=filename)
    
    image_file.seek(0)
    blob_client.upload_blob(image_file, overwrite=True)
    image_url = blob_client.url
    
    # Analyze image
    analysis = analyzer.analyze_image(image_url)
    text_results = analyzer.extract_text(image_url)
    
    return jsonify({
        'image_url': image_url,
        'analysis': analysis,
        'text': text_results
    })

if __name__ == '__main__':
    app.run(debug=True)
```

## Step 3: Web Interface

### templates/index.html
```html
<!DOCTYPE html>
<html>
<head>
    <title>Image Analyzer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .upload-area { 
            border: 2px dashed #007acc; 
            padding: 40px; 
            text-align: center; 
            margin: 20px 0;
            cursor: pointer;
        }
        .results { margin-top: 20px; }
        .section { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px;
        }
        .tag { 
            background: #e7f3ff; 
            padding: 3px 8px; 
            margin: 2px; 
            border-radius: 10px; 
            display: inline-block;
        }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 AI Image Analyzer</h1>
        
        <div class="upload-area" onclick="document.getElementById('imageInput').click()">
            <p>📸 Click to upload an image</p>
            <input type="file" id="imageInput" accept="image/*" style="display: none;">
        </div>
        
        <div id="loading" style="display: none;">
            <p>Analyzing image...</p>
        </div>
        
        <div id="results" style="display: none;">
            <div class="section">
                <h3>Image</h3>
                <img id="imagePreview" alt="Uploaded image">
            </div>
            
            <div class="section">
                <h3>Description</h3>
                <p id="description"></p>
            </div>
            
            <div class="section">
                <h3>Tags</h3>
                <div id="tags"></div>
            </div>
            
            <div class="section">
                <h3>Objects</h3>
                <div id="objects"></div>
            </div>
            
            <div class="section">
                <h3>Extracted Text</h3>
                <div id="text"></div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('imageInput').addEventListener('change', analyzeImage);
        
        async function analyzeImage(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            
            const formData = new FormData();
            formData.append('image', file);
            
            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                displayResults(data);
                
            } catch (error) {
                alert('Error: ' + error.message);
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }
        
        function displayResults(data) {
            // Show image
            document.getElementById('imagePreview').src = data.image_url;
            
            // Show description
            document.getElementById('description').textContent = 
                data.analysis.description || 'No description available';
            
            // Show tags
            const tagsDiv = document.getElementById('tags');
            tagsDiv.innerHTML = '';
            data.analysis.tags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = `${tag.name} (${Math.round(tag.confidence * 100)}%)`;
                tagsDiv.appendChild(span);
            });
            
            // Show objects
            const objectsDiv = document.getElementById('objects');
            objectsDiv.innerHTML = '';
            data.analysis.objects.forEach(obj => {
                const p = document.createElement('p');
                p.textContent = `${obj.name} (${Math.round(obj.confidence * 100)}%)`;
                objectsDiv.appendChild(p);
            });
            
            // Show text
            const textDiv = document.getElementById('text');
            textDiv.innerHTML = '';
            data.text.forEach(text => {
                const p = document.createElement('p');
                p.textContent = text;
                textDiv.appendChild(p);
            });
            
            document.getElementById('results').style.display = 'block';
        }
    </script>
</body>
</html>
```

## Step 4: Environment Configuration

### .env file
```
COMPUTER_VISION_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
COMPUTER_VISION_KEY=your-computer-vision-key
STORAGE_ACCOUNT_NAME=your-storage-account
STORAGE_ACCOUNT_KEY=your-storage-key
```

## Step 5: Deployment

```bash
# Create App Service
az webapp create \
  --name image-analyzer-app \
  --resource-group rg-imageanalyzer \
  --plan Standard \
  --runtime "PYTHON|3.9"

# Configure app settings
az webapp config appsettings set \
  --name image-analyzer-app \
  --resource-group rg-imageanalyzer \
  --settings COMPUTER_VISION_ENDPOINT=$CV_ENDPOINT \
             COMPUTER_VISION_KEY=$CV_KEY
```

## Advanced Features

### Business Card Analysis
```python
def analyze_business_card(image_url):
    """Extract business card information"""
    text_results = analyzer.extract_text(image_url)
    text = ' '.join(text_results)
    
    import re
    email = re.findall(r'\S+@\S+', text)
    phone = re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text)
    
    return {
        'emails': email,
        'phones': phone,
        'text': text
    }
```

### Batch Processing
```python
def process_multiple_images(image_urls):
    """Process multiple images"""
    results = []
    for url in image_urls:
        result = analyzer.analyze_image(url)
        results.append(result)
    return results
```

## Best Practices

1. **Image Size:** Optimize images before processing (max 4MB)
2. **Error Handling:** Implement retry logic for API failures
3. **Caching:** Store results to avoid duplicate processing
4. **Security:** Validate file types and sizes
5. **Cost Control:** Monitor API usage and implement quotas

## Summary

You've built a comprehensive image analyzer that can:
- Analyze image content and generate descriptions
- Detect objects and extract text
- Process images through a web interface
- Handle file uploads and storage

This foundation can be extended for specific use cases like document processing, inventory management, or content moderation.

## Next Steps

In the next lesson, we'll build a Voice Assistant combining speech recognition and text-to-speech capabilities.

## References

[1] Azure Computer Vision - https://docs.microsoft.com/azure/cognitive-services/computer-vision/
[2] OCR with Computer Vision - https://docs.microsoft.com/azure/cognitive-services/computer-vision/concept-recognizing-text 