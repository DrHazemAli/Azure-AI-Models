#!/usr/bin/env python3
"""
Your First AI Project - Text Analyzer
=====================================

This application demonstrates how to use Azure AI Language services to:
- Detect the language of input text
- Analyze sentiment (positive, negative, neutral)
- Extract key phrases and important information

Prerequisites:
- Azure AI Language service created
- Environment variables set:
  - AZURE_LANGUAGE_ENDPOINT
  - AZURE_LANGUAGE_KEY

Usage:
    python first_ai_project.py
"""

import os
import sys
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError


def create_client():
    """Create and return a Text Analytics client"""
    endpoint = os.getenv("AZURE_LANGUAGE_ENDPOINT")
    key = os.getenv("AZURE_LANGUAGE_KEY")
    
    if not endpoint or not key:
        print("❌ Error: Missing environment variables")
        print("Please set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY")
        print("\nExample:")
        print("export AZURE_LANGUAGE_ENDPOINT='https://your-resource.cognitiveservices.azure.com/'")
        print("export AZURE_LANGUAGE_KEY='your-api-key-here'")
        sys.exit(1)
    
    try:
        return TextAnalyticsClient(endpoint=endpoint, credential=AzureKeyCredential(key))
    except Exception as e:
        print(f"❌ Error creating client: {e}")
        sys.exit(1)


def analyze_text(client, text):
    """Analyze text for language, sentiment, and key phrases"""
    if not text or not text.strip():
        print("⚠️  Warning: Empty text provided")
        return
    
    # Truncate text if too long
    if len(text) > 5000:
        text = text[:5000]
        print("⚠️  Warning: Text truncated to 5000 characters")
    
    display_text = text[:50] + ('...' if len(text) > 50 else '')
    print(f"\nAnalyzing: '{display_text}'")
    print("-" * 60)
    
    try:
        # Language Detection
        print("🔍 Detecting language...")
        language_result = client.detect_language(documents=[text])[0]
        detected_language = language_result.primary_language.name
        confidence = language_result.primary_language.confidence_score
        
        print(f"🌍 Language: {detected_language} (Confidence: {confidence:.2f})")
        
        # Sentiment Analysis
        print("\n😊 Analyzing sentiment...")
        sentiment_result = client.analyze_sentiment(documents=[text])[0]
        sentiment = sentiment_result.sentiment
        scores = sentiment_result.confidence_scores
        
        # Choose appropriate emoji based on sentiment
        sentiment_emoji = {
            'positive': '😊',
            'negative': '😞',
            'neutral': '😐'
        }.get(sentiment, '🤔')
        
        print(f"{sentiment_emoji} Overall Sentiment: {sentiment.upper()}")
        print(f"   📈 Positive: {scores.positive:.2f}")
        print(f"   ⚖️  Neutral:  {scores.neutral:.2f}")
        print(f"   📉 Negative: {scores.negative:.2f}")
        
        # Key Phrase Extraction
        print("\n🔑 Extracting key phrases...")
        key_phrases_result = client.extract_key_phrases(documents=[text])[0]
        key_phrases = key_phrases_result.key_phrases
        
        if key_phrases:
            print(f"🎯 Key Phrases: {', '.join(key_phrases)}")
        else:
            print("🎯 No key phrases detected")
        
        print("=" * 60)
        
    except HttpResponseError as e:
        if e.status_code == 429:
            print("⏰ Rate limit exceeded. Please wait a moment and try again.")
        elif e.status_code == 401:
            print("🔐 Authentication failed. Please check your API key and endpoint.")
        else:
            print(f"❌ API Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


def run_sample_analysis(client):
    """Run analysis on sample texts"""
    print("🚀 Running sample text analysis...")
    
    sample_texts = [
        "I absolutely love using Azure AI services! They make building intelligent applications incredibly easy and fun.",
        "The weather today is absolutely terrible and I'm feeling quite frustrated about the cancelled outdoor event.",
        "Microsoft Azure provides comprehensive cloud computing services including artificial intelligence, machine learning, and data analytics for businesses of all sizes.",
        "¡Hola! Me encanta la inteligencia artificial y todas sus aplicaciones innovadoras en el mundo moderno.",
        "こんにちは！AIサービスは本当に素晴らしいテクノロジーだと思います。",
        "This product is okay, nothing special but not bad either. It does what it's supposed to do."
    ]
    
    for i, text in enumerate(sample_texts, 1):
        print(f"\n📝 Sample {i}/{len(sample_texts)}:")
        analyze_text(client, text)


def interactive_mode(client):
    """Interactive mode for user input"""
    print("\n🎯 Interactive Mode - Try your own text!")
    print("Enter text to analyze, or type 'quit' to exit.")
    print("Tip: Try different languages, sentiments, and topics!")
    
    while True:
        try:
            user_input = input("\n💬 Enter text: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("👋 Thanks for trying your first AI project!")
                break
            
            if not user_input:
                print("⚠️  Please enter some text to analyze.")
                continue
            
            analyze_text(client, user_input)
            
        except KeyboardInterrupt:
            print("\n\n👋 Thanks for trying your first AI project!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")


def main():
    """Main function to run the text analyzer"""
    print("=" * 60)
    print("🚀 Welcome to Your First AI Project!")
    print("   Text Analyzer using Azure AI Language Services")
    print("=" * 60)
    print("\nThis application will demonstrate:")
    print("✨ Language detection")
    print("✨ Sentiment analysis") 
    print("✨ Key phrase extraction")
    print()
    
    try:
        # Create the client
        print("🔧 Initializing Azure AI client...")
        client = create_client()
        print("✅ Client created successfully!")
        
        # Run sample analysis
        run_sample_analysis(client)
        
        # Interactive mode
        interactive_mode(client)
        
    except KeyboardInterrupt:
        print("\n\n👋 Program interrupted by user.")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 