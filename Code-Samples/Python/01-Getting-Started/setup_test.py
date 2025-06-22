#!/usr/bin/env python3
"""
Azure AI Setup Test Script
==========================

This script helps you test your Azure AI services setup and demonstrates
basic API calls to various Azure AI services.

Prerequisites:
- Azure account with AI services created
- API keys and endpoints configured
- Required Python packages installed: pip install azure-ai-textanalytics azure-cognitiveservices-vision-computervision openai python-dotenv

Usage:
1. Copy your API keys and endpoints to a .env file
2. Run: python setup_test.py
"""

import os
import sys
from typing import Optional, Dict, Any
import json
import asyncio
from dotenv import load_dotenv

# Import Azure AI SDKs
try:
    from azure.ai.textanalytics import TextAnalyticsClient
    from azure.core.credentials import AzureKeyCredential
    from azure.cognitiveservices.vision.computervision import ComputerVisionClient
    from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
    from msrest.authentication import CognitiveServicesCredentials
    import openai
except ImportError as e:
    print(f"❌ Missing required packages. Please install them:")
    print("pip install azure-ai-textanalytics azure-cognitiveservices-vision-computervision openai python-dotenv")
    print(f"Error: {e}")
    sys.exit(1)

# Load environment variables
load_dotenv()

class AzureAITester:
    """Test various Azure AI services to verify setup."""
    
    def __init__(self):
        """Initialize the tester with environment variables."""
        self.test_results = {}
        self.load_credentials()
    
    def load_credentials(self):
        """Load API credentials from environment variables."""
        print("🔑 Loading credentials from environment...")
        
        # Language Service (Text Analytics)
        self.language_endpoint = os.getenv('AZURE_LANGUAGE_ENDPOINT')
        self.language_key = os.getenv('AZURE_LANGUAGE_KEY')
        
        # Computer Vision
        self.vision_endpoint = os.getenv('AZURE_VISION_ENDPOINT')
        self.vision_key = os.getenv('AZURE_VISION_KEY')
        
        # Azure OpenAI
        self.openai_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
        self.openai_key = os.getenv('AZURE_OPENAI_KEY')
        self.openai_deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4o')
        
        # Check which services are configured
        self.services_configured = {
            'Language Service': bool(self.language_endpoint and self.language_key),
            'Computer Vision': bool(self.vision_endpoint and self.vision_key),
            'Azure OpenAI': bool(self.openai_endpoint and self.openai_key)
        }
        
        print("📋 Service Configuration Status:")
        for service, configured in self.services_configured.items():
            status = "✅ Configured" if configured else "❌ Not configured"
            print(f"   {service}: {status}")
        print()

    def test_language_service(self) -> Dict[str, Any]:
        """Test Azure Language Service (Text Analytics)."""
        if not self.services_configured['Language Service']:
            return {"status": "skipped", "reason": "Not configured"}
        
        try:
            print("🧠 Testing Language Service...")
            
            # Create client
            credential = AzureKeyCredential(self.language_key)
            client = TextAnalyticsClient(
                endpoint=self.language_endpoint,
                credential=credential
            )
            
            # Test data
            test_documents = [
                "I absolutely love using Azure AI services! They make development so much easier.",
                "The weather today is okay, nothing special.",
                "I'm really frustrated with this slow internet connection."
            ]
            
            # Analyze sentiment
            print("   📊 Analyzing sentiment...")
            sentiment_results = client.analyze_sentiment(test_documents)
            
            # Analyze key phrases
            print("   🔍 Extracting key phrases...")
            key_phrase_results = client.extract_key_phrases(test_documents)
            
            # Detect language
            print("   🌐 Detecting language...")
            language_results = client.detect_language([
                "Hello, how are you today?",
                "Bonjour, comment allez-vous?",
                "Hola, ¿cómo estás?"
            ])
            
            # Compile results
            results = {
                "status": "success",
                "sentiment_analysis": [
                    {
                        "text": doc.text[:50] + "...",
                        "sentiment": result.sentiment,
                        "confidence": {
                            "positive": round(result.confidence_scores.positive, 2),
                            "neutral": round(result.confidence_scores.neutral, 2),
                            "negative": round(result.confidence_scores.negative, 2)
                        }
                    }
                    for doc, result in zip(test_documents, sentiment_results)
                ],
                "key_phrases": [
                    {
                        "text": doc.text[:50] + "...",
                        "phrases": result.key_phrases
                    }
                    for doc, result in zip(test_documents, key_phrase_results)
                ],
                "language_detection": [
                    {
                        "text": result.primary_language.name,
                        "confidence": round(result.primary_language.confidence_score, 2)
                    }
                    for result in language_results
                ]
            }
            
            print("   ✅ Language Service test completed successfully!")
            return results
            
        except Exception as e:
            error_msg = f"Language Service test failed: {str(e)}"
            print(f"   ❌ {error_msg}")
            return {"status": "error", "error": error_msg}

    def test_computer_vision(self) -> Dict[str, Any]:
        """Test Azure Computer Vision service."""
        if not self.services_configured['Computer Vision']:
            return {"status": "skipped", "reason": "Not configured"}
        
        try:
            print("👁️ Testing Computer Vision...")
            
            # Create client
            credential = CognitiveServicesCredentials(self.vision_key)
            client = ComputerVisionClient(self.vision_endpoint, credential)
            
            # Test with a sample image URL
            test_image_url = "https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/master/articles/cognitive-services/Computer-vision/Images/faces.jpg"
            
            print("   🖼️ Analyzing image content...")
            # Analyze image
            analysis = client.analyze_image(
                test_image_url,
                visual_features=[
                    'Categories', 'Description', 'Tags', 'Objects', 'Faces'
                ]
            )
            
            print("   📝 Reading text from image...")
            # OCR test with a different image
            ocr_image_url = "https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/master/articles/cognitive-services/Computer-vision/Images/readsample.jpg"
            read_operation = client.read(ocr_image_url, raw=True)
            operation_id = read_operation.headers['Operation-Location'].split('/')[-1]
            
            # Wait for OCR to complete
            import time
            while True:
                read_result = client.get_read_result(operation_id)
                if read_result.status not in [OperationStatusCodes.running]:
                    break
                time.sleep(1)
            
            # Extract text
            extracted_text = []
            if read_result.status == OperationStatusCodes.succeeded:
                for text_result in read_result.analyze_result.read_results:
                    for line in text_result.lines:
                        extracted_text.append(line.text)
            
            results = {
                "status": "success",
                "image_analysis": {
                    "description": analysis.description.captions[0].text if analysis.description.captions else "No description",
                    "tags": [tag.name for tag in analysis.tags[:5]],  # Top 5 tags
                    "objects": [obj.object_property for obj in analysis.objects[:3]],  # Top 3 objects
                    "faces_detected": len(analysis.faces),
                    "categories": [cat.name for cat in analysis.categories[:3]]  # Top 3 categories
                },
                "text_extraction": {
                    "lines_detected": len(extracted_text),
                    "sample_text": extracted_text[:3] if extracted_text else []  # First 3 lines
                }
            }
            
            print("   ✅ Computer Vision test completed successfully!")
            return results
            
        except Exception as e:
            error_msg = f"Computer Vision test failed: {str(e)}"
            print(f"   ❌ {error_msg}")
            return {"status": "error", "error": error_msg}

    def test_azure_openai(self) -> Dict[str, Any]:
        """Test Azure OpenAI service."""
        if not self.services_configured['Azure OpenAI']:
            return {"status": "skipped", "reason": "Not configured"}
        
        try:
            print("🤖 Testing Azure OpenAI...")
            
            # Configure OpenAI client for Azure
            client = openai.AzureOpenAI(
                azure_endpoint=self.openai_endpoint,
                api_key=self.openai_key,
                api_version="2024-10-21"
            )
            
            print("   💬 Testing chat completion...")
            # Test chat completion
            chat_response = client.chat.completions.create(
                model=self.openai_deployment,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant. Respond concisely."},
                    {"role": "user", "content": "What is Azure AI in one sentence?"}
                ],
                max_tokens=100,
                temperature=0.7
            )
            
            print("   📊 Testing embeddings...")
            # Test embeddings (if available)
            try:
                embedding_response = client.embeddings.create(
                    model="text-embedding-ada-002",  # Common embedding model
                    input="Azure AI makes artificial intelligence accessible to developers."
                )
                embedding_success = True
                embedding_dimensions = len(embedding_response.data[0].embedding)
            except Exception:
                embedding_success = False
                embedding_dimensions = 0
            
            results = {
                "status": "success",
                "chat_completion": {
                    "prompt": "What is Azure AI in one sentence?",
                    "response": chat_response.choices[0].message.content,
                    "tokens_used": chat_response.usage.total_tokens
                },
                "embeddings": {
                    "available": embedding_success,
                    "dimensions": embedding_dimensions if embedding_success else "N/A"
                }
            }
            
            print("   ✅ Azure OpenAI test completed successfully!")
            return results
            
        except Exception as e:
            error_msg = f"Azure OpenAI test failed: {str(e)}"
            print(f"   ❌ {error_msg}")
            return {"status": "error", "error": error_msg}

    def run_all_tests(self):
        """Run all available tests and display results."""
        print("🚀 Starting Azure AI Services Test Suite")
        print("=" * 50)
        print()
        
        # Run tests
        tests = [
            ("Language Service", self.test_language_service),
            ("Computer Vision", self.test_computer_vision),
            ("Azure OpenAI", self.test_azure_openai)
        ]
        
        for service_name, test_func in tests:
            self.test_results[service_name] = test_func()
            print()
        
        # Display summary
        self.display_summary()
        
        # Save results to file
        self.save_results()

    def display_summary(self):
        """Display a summary of all test results."""
        print("📊 Test Summary")
        print("=" * 50)
        
        successful_tests = 0
        total_configured = 0
        
        for service, result in self.test_results.items():
            if result["status"] != "skipped":
                total_configured += 1
                if result["status"] == "success":
                    successful_tests += 1
                    print(f"✅ {service}: SUCCESS")
                else:
                    print(f"❌ {service}: FAILED - {result.get('error', 'Unknown error')}")
            else:
                print(f"⚪ {service}: SKIPPED - {result.get('reason', 'Not configured')}")
        
        print()
        if total_configured > 0:
            success_rate = (successful_tests / total_configured) * 100
            print(f"🎯 Success Rate: {successful_tests}/{total_configured} ({success_rate:.1f}%)")
        else:
            print("⚠️ No services were configured for testing.")
        
        print()
        print("💡 Next Steps:")
        if successful_tests == total_configured and total_configured > 0:
            print("   🎉 All configured services are working perfectly!")
            print("   📚 You're ready to proceed with the Azure AI course.")
        else:
            print("   🔧 Some services need attention. Check the error messages above.")
            print("   📖 Review the setup instructions in Lesson 2.")

    def save_results(self):
        """Save test results to a JSON file."""
        try:
            with open('azure_ai_test_results.json', 'w') as f:
                json.dump(self.test_results, f, indent=2)
            print("💾 Test results saved to 'azure_ai_test_results.json'")
        except Exception as e:
            print(f"⚠️ Could not save results: {e}")

def create_env_template():
    """Create a template .env file for users."""
    env_template = """# Azure AI Services Configuration
# Copy this file to .env and fill in your actual values

# Language Service (Text Analytics)
AZURE_LANGUAGE_ENDPOINT=https://your-language-resource.cognitiveservices.azure.com/
AZURE_LANGUAGE_KEY=your-language-service-key-here

# Computer Vision
AZURE_VISION_ENDPOINT=https://your-vision-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your-vision-service-key-here

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-openai-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Instructions:
# 1. Replace the placeholder values with your actual Azure AI service endpoints and keys
# 2. Save this file as .env in the same directory as setup_test.py
# 3. Run: python setup_test.py
"""
    
    if not os.path.exists('.env'):
        with open('.env.template', 'w') as f:
            f.write(env_template)
        print("📄 Created .env.template file with configuration instructions.")
        return True
    return False

def main():
    """Main function to run the Azure AI setup test."""
    print("🔧 Azure AI Services Setup Tester")
    print("=" * 50)
    print()
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("⚠️ No .env file found!")
        create_env_template()
        print()
        print("📋 To get started:")
        print("1. Copy .env.template to .env")
        print("2. Fill in your Azure AI service credentials")
        print("3. Run this script again")
        print()
        print("💡 Need help getting credentials? Check Lesson 2 of the course!")
        return
    
    # Run tests
    tester = AzureAITester()
    tester.run_all_tests()

if __name__ == "__main__":
    main() 