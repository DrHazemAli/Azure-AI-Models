# Lesson 5.2: Smart Chatbot

## Learning Objectives
- Build an intelligent chatbot using Azure AI services
- Implement conversation management and context handling
- Create a scalable chatbot architecture
- Deploy and monitor your chatbot in production

## Introduction

Chatbots are one of the most popular AI applications, providing 24/7 customer support, automating routine tasks, and improving user engagement. In this lesson, we'll build a production-ready smart chatbot using Azure AI services.

## Architecture Overview

Our smart chatbot will use:
- **Azure OpenAI** for natural language understanding and generation
- **Azure App Service** for hosting the web application
- **Azure Cosmos DB** for conversation history
- **Application Insights** for monitoring

```
User Interface (Web/Mobile)
        ↓
Azure App Service (Bot Logic)
        ↓
Azure OpenAI Service
        ↓
Azure Cosmos DB (Context Storage)
```

## Step 1: Setting Up Azure Resources

### Create Resource Group
```bash
az group create --name rg-chatbot --location eastus
```

### Create Azure OpenAI Service
```bash
az cognitiveservices account create \
  --name openai-chatbot \
  --resource-group rg-chatbot \
  --kind OpenAI \
  --sku S0 \
  --location eastus
```

### Create Cosmos DB
```bash
az cosmosdb create \
  --name cosmos-chatbot \
  --resource-group rg-chatbot \
  --kind GlobalDocumentDB
```

## Step 2: Building the Chatbot Backend

### Python Implementation

**requirements.txt**
```txt
openai==1.3.0
azure-cosmos==4.5.0
flask==2.3.3
azure-identity==1.14.0
python-dotenv==1.0.0
```

**app.py**
```python
import os
from flask import Flask, request, jsonify
from openai import AzureOpenAI
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
import uuid
from datetime import datetime

app = Flask(__name__)

# Initialize Azure OpenAI client
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version="2024-02-01",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

# Initialize Cosmos DB client
cosmos_client = CosmosClient(
    url=os.getenv("COSMOS_ENDPOINT"),
    credential=os.getenv("COSMOS_KEY")
)
database = cosmos_client.get_database_client("chatbot")
container = database.get_container_client("conversations")

class ChatbotService:
    def __init__(self):
        self.system_message = """
        You are a helpful AI assistant. Be friendly, professional, and concise.
        If you don't know something, admit it rather than making up information.
        """
    
    def get_conversation_history(self, session_id, limit=10):
        """Retrieve recent conversation history"""
        try:
            query = f"""
            SELECT TOP {limit} c.message, c.role, c.timestamp 
            FROM c 
            WHERE c.session_id = '{session_id}' 
            ORDER BY c.timestamp DESC
            """
            items = list(container.query_items(query, enable_cross_partition_query=True))
            return sorted(items, key=lambda x: x['timestamp'])
        except:
            return []
    
    def save_message(self, session_id, message, role):
        """Save message to conversation history"""
        try:
            item = {
                'id': str(uuid.uuid4()),
                'session_id': session_id,
                'message': message,
                'role': role,
                'timestamp': datetime.utcnow().isoformat()
            }
            container.create_item(item)
        except Exception as e:
            print(f"Error saving message: {e}")
    
    def generate_response(self, session_id, user_message):
        """Generate AI response with conversation context"""
        # Get conversation history
        history = self.get_conversation_history(session_id)
        
        # Build messages for OpenAI
        messages = [{"role": "system", "content": self.system_message}]
        
        # Add conversation history
        for msg in history:
            messages.append({
                "role": msg['role'],
                "content": msg['message']
            })
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        try:
            # Generate response
            response = client.chat.completions.create(
                model="gpt-35-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Save both messages
            self.save_message(session_id, user_message, "user")
            self.save_message(session_id, ai_response, "assistant")
            
            return ai_response
            
        except Exception as e:
            return f"I'm sorry, I encountered an error: {str(e)}"

chatbot = ChatbotService()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    session_id = data.get('session_id', str(uuid.uuid4()))
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    response = chatbot.generate_response(session_id, user_message)
    
    return jsonify({
        'response': response,
        'session_id': session_id
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True)
```

### JavaScript/Node.js Implementation

**package.json**
```json
{
  "name": "smart-chatbot",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "openai": "^4.20.0",
    "@azure/cosmos": "^4.0.0",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.0"
  }
}
```

**app.js**
```javascript
const express = require('express');
const { OpenAI } = require('openai');
const { CosmosClient } = require('@azure/cosmos');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-35-turbo`,
  defaultQuery: { 'api-version': '2024-02-01' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY }
});

// Initialize Cosmos DB
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});
const database = cosmosClient.database('chatbot');
const container = database.container('conversations');

class ChatbotService {
  constructor() {
    this.systemMessage = `
      You are a helpful AI assistant. Be friendly, professional, and concise.
      If you don't know something, admit it rather than making up information.
    `;
  }

  async getConversationHistory(sessionId, limit = 10) {
    try {
      const query = `
        SELECT TOP ${limit} c.message, c.role, c.timestamp 
        FROM c 
        WHERE c.session_id = '${sessionId}' 
        ORDER BY c.timestamp DESC
      `;
      const { resources } = await container.items.query(query).fetchAll();
      return resources.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  async saveMessage(sessionId, message, role) {
    try {
      await container.items.create({
        id: uuidv4(),
        session_id: sessionId,
        message: message,
        role: role,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  async generateResponse(sessionId, userMessage) {
    try {
      // Get conversation history
      const history = await this.getConversationHistory(sessionId);
      
      // Build messages array
      const messages = [{ role: 'system', content: this.systemMessage }];
      
      // Add history
      history.forEach(msg => {
        messages.push({ role: msg.role, content: msg.message });
      });
      
      // Add current message
      messages.push({ role: 'user', content: userMessage });

      // Generate response
      const response = await openai.chat.completions.create({
        model: 'gpt-35-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = response.choices[0].message.content;

      // Save messages
      await this.saveMessage(sessionId, userMessage, 'user');
      await this.saveMessage(sessionId, aiResponse, 'assistant');

      return aiResponse;
    } catch (error) {
      console.error('Error generating response:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    }
  }
}

const chatbot = new ChatbotService();

app.post('/chat', async (req, res) => {
  const { session_id = uuidv4(), message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const response = await chatbot.generateResponse(session_id, message);

  res.json({
    response: response,
    session_id: session_id
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Chatbot server running on port ${PORT}`);
});
```

## Step 3: Building the Frontend

### HTML/CSS/JavaScript Frontend

**index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Chatbot</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .chat-container {
            width: 400px;
            height: 600px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
        }
        
        .chat-header {
            background: #0078d4;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        
        .message {
            margin-bottom: 15px;
            display: flex;
        }
        
        .message.user {
            justify-content: flex-end;
        }
        
        .message-content {
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 15px;
            word-wrap: break-word;
        }
        
        .message.user .message-content {
            background: #0078d4;
            color: white;
        }
        
        .message.bot .message-content {
            background: #e9ecef;
            color: #333;
        }
        
        .chat-input {
            display: flex;
            padding: 20px;
            border-top: 1px solid #eee;
        }
        
        .chat-input input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 20px;
            outline: none;
        }
        
        .chat-input button {
            margin-left: 10px;
            padding: 10px 20px;
            background: #0078d4;
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
        }
        
        .chat-input button:hover {
            background: #106ebe;
        }
        
        .typing {
            font-style: italic;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h2>Smart Chatbot</h2>
            <p>Ask me anything!</p>
        </div>
        
        <div class="chat-messages" id="chatMessages">
            <div class="message bot">
                <div class="message-content">
                    Hello! I'm your AI assistant. How can I help you today?
                </div>
            </div>
        </div>
        
        <div class="chat-input">
            <input type="text" id="messageInput" placeholder="Type your message..." 
                   onkeypress="handleKeyPress(event)">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        let sessionId = generateUUID();
        
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        
        function addMessage(content, isUser = false) {
            const messagesContainer = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = content;
            
            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function showTyping() {
            const messagesContainer = document.getElementById('chatMessages');
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot';
            typingDiv.id = 'typing';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content typing';
            contentDiv.textContent = 'AI is typing...';
            
            typingDiv.appendChild(contentDiv);
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function hideTyping() {
            const typingElement = document.getElementById('typing');
            if (typingElement) {
                typingElement.remove();
            }
        }
        
        async function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            addMessage(message, true);
            messageInput.value = '';
            
            // Show typing indicator
            showTyping();
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        session_id: sessionId
                    })
                });
                
                const data = await response.json();
                
                // Hide typing indicator
                hideTyping();
                
                if (data.response) {
                    addMessage(data.response);
                    sessionId = data.session_id;
                } else {
                    addMessage('Sorry, I encountered an error. Please try again.');
                }
            } catch (error) {
                hideTyping();
                addMessage('Sorry, I encountered an error. Please try again.');
                console.error('Error:', error);
            }
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
    </script>
</body>
</html>
```

## Step 4: Deployment

### Deploy to Azure App Service

**Create App Service**
```bash
az appservice plan create \
  --name chatbot-plan \
  --resource-group rg-chatbot \
  --sku B1

az webapp create \
  --name smart-chatbot-app \
  --resource-group rg-chatbot \
  --plan chatbot-plan \
  --runtime "PYTHON|3.9"
```

**Deploy Code**
```bash
az webapp deployment source config-zip \
  --resource-group rg-chatbot \
  --name smart-chatbot-app \
  --src chatbot.zip
```

## Step 5: Monitoring and Analytics

### Application Insights Integration

**Python monitoring code**
```python
from applicationinsights import TelemetryClient

# Initialize telemetry
tc = TelemetryClient(os.getenv('APPINSIGHTS_INSTRUMENTATION_KEY'))

def log_conversation_metrics(session_id, user_message, ai_response, response_time):
    tc.track_event(
        'ChatbotConversation',
        {
            'session_id': session_id,
            'user_message_length': len(user_message),
            'ai_response_length': len(ai_response),
            'response_time': response_time
        }
    )
    tc.flush()
```

## Best Practices

1. **Context Management:** Keep conversation history relevant and manageable
2. **Error Handling:** Implement graceful fallbacks for service failures
3. **Rate Limiting:** Prevent abuse with request throttling
4. **Content Filtering:** Use Azure Content Safety for inappropriate content
5. **Performance:** Cache frequent responses and optimize database queries
6. **Security:** Validate inputs and sanitize outputs
7. **Monitoring:** Track conversation quality and user satisfaction

## Common Issues and Solutions

**Issue: Long response times**
- Solution: Implement caching and optimize database queries

**Issue: Context not maintained**
- Solution: Properly manage session IDs and conversation history

**Issue: High costs**
- Solution: Implement intelligent caching and optimize token usage

## Summary

You've built a production-ready smart chatbot with:
- Natural language understanding using Azure OpenAI
- Conversation context management
- Scalable cloud architecture
- Monitoring and analytics
- Professional user interface

This chatbot can be extended with additional features like voice support, multi-language capabilities, and integration with other business systems.

## Next Steps

In the next lesson, we'll build an Image Analyzer application that combines computer vision capabilities with intelligent analysis and reporting features.

## References

[1] Azure OpenAI Service Documentation - https://docs.microsoft.com/azure/cognitive-services/openai/
[2] Azure Cosmos DB Documentation - https://docs.microsoft.com/azure/cosmos-db/
[3] Azure App Service Documentation - https://docs.microsoft.com/azure/app-service/
[4] Application Insights Documentation - https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview 