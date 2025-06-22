#!/usr/bin/env python3
"""
Azure AI Language - Text Analysis and Sentiment Example

This example demonstrates how to use Azure AI Language service for:
- Sentiment analysis with confidence scores
- Opinion mining (targets and assessments)
- Key phrase extraction
- Named entity recognition (NER)
- Language detection
- Comprehensive text understanding

Prerequisites:
- Azure subscription with Language resource
- pip install azure-ai-textanalytics python-dotenv

Set environment variables:
- LANGUAGE_KEY: Your Language resource key
- LANGUAGE_ENDPOINT: Your Language resource endpoint
"""

import os
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import json
from dotenv import load_dotenv

from azure.ai.textanalytics import TextAnalyticsClient
from azure.ai.textanalytics.aio import TextAnalyticsClient as AsyncTextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError

# Load environment variables
load_dotenv()

@dataclass
class SentimentInsight:
    """Data class for sentiment analysis results."""
    text: str
    sentiment: str
    confidence_scores: Dict[str, float]
    targets: List[Dict[str, Any]]
    assessments: List[Dict[str, Any]]
    overall_confidence: float
    
@dataclass
class TextAnalysisResult:
    """Comprehensive text analysis result."""
    original_text: str
    language: str
    language_confidence: float
    sentiment: SentimentInsight
    key_phrases: List[str]
    entities: List[Dict[str, Any]]
    analysis_timestamp: str

class AzureTextAnalyzer:
    """Azure AI Language client for comprehensive text analysis."""
    
    def __init__(self):
        """Initialize the text analyzer with Azure credentials."""
        self.key = os.getenv('LANGUAGE_KEY')
        self.endpoint = os.getenv('LANGUAGE_ENDPOINT')
        
        if not all([self.key, self.endpoint]):
            raise ValueError("Missing required environment variables. Please set LANGUAGE_KEY and LANGUAGE_ENDPOINT")
        
        self.credential = AzureKeyCredential(self.key)
        self.client = TextAnalyticsClient(
            endpoint=self.endpoint,
            credential=self.credential
        )
        
        # Async client for batch processing
        self.async_client = AsyncTextAnalyticsClient(
            endpoint=self.endpoint,
            credential=self.credential
        )
    
    def detect_language(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Detect the language of input texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of language detection results
        """
        try:
            results = self.client.detect_language(documents=texts)
            
            language_results = []
            for idx, result in enumerate(results):
                if result.kind == "LanguageDetection":
                    language_results.append({
                        'text': texts[idx],
                        'language': result.primary_language.iso6391_name,
                        'language_name': result.primary_language.name,
                        'confidence': result.primary_language.confidence_score,
                        'warnings': [warning.message for warning in result.warnings]
                    })
                else:
                    language_results.append({
                        'text': texts[idx],
                        'error': f"Error: {result.error.message}",
                        'language': 'unknown',
                        'confidence': 0.0
                    })
            
            return language_results
            
        except HttpResponseError as e:
            print(f"Error detecting language: {e}")
            return []
    
    def analyze_sentiment(self, texts: List[str], show_opinion_mining: bool = True) -> List[SentimentInsight]:
        """
        Analyze sentiment with optional opinion mining.
        
        Args:
            texts: List of texts to analyze
            show_opinion_mining: Whether to include opinion mining results
            
        Returns:
            List of sentiment analysis results
        """
        try:
            results = self.client.analyze_sentiment(
                documents=texts,
                show_opinion_mining=show_opinion_mining
            )
            
            sentiment_results = []
            for idx, result in enumerate(results):
                if result.kind == "SentimentAnalysis":
                    # Extract targets and assessments from opinion mining
                    targets = []
                    assessments = []
                    
                    if show_opinion_mining and hasattr(result, 'sentences'):
                        for sentence in result.sentences:
                            if hasattr(sentence, 'targets'):
                                for target in sentence.targets:
                                    targets.append({
                                        'text': target.text,
                                        'sentiment': target.sentiment,
                                        'confidence_scores': asdict(target.confidence_scores),
                                        'offset': target.offset,
                                        'length': target.length
                                    })
                            
                            if hasattr(sentence, 'assessments'):
                                for assessment in sentence.assessments:
                                    assessments.append({
                                        'text': assessment.text,
                                        'sentiment': assessment.sentiment,
                                        'confidence_scores': asdict(assessment.confidence_scores),
                                        'offset': assessment.offset,
                                        'length': assessment.length,
                                        'is_negated': assessment.is_negated
                                    })
                    
                    # Calculate overall confidence
                    confidence_scores = asdict(result.confidence_scores)
                    overall_confidence = max(confidence_scores.values())
                    
                    sentiment_results.append(SentimentInsight(
                        text=texts[idx],
                        sentiment=result.sentiment,
                        confidence_scores=confidence_scores,
                        targets=targets,
                        assessments=assessments,
                        overall_confidence=overall_confidence
                    ))
                else:
                    # Handle error case
                    sentiment_results.append(SentimentInsight(
                        text=texts[idx],
                        sentiment="error",
                        confidence_scores={"positive": 0.0, "neutral": 0.0, "negative": 0.0},
                        targets=[],
                        assessments=[],
                        overall_confidence=0.0
                    ))
            
            return sentiment_results
            
        except HttpResponseError as e:
            print(f"Error analyzing sentiment: {e}")
            return []
    
    def extract_key_phrases(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Extract key phrases from texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of key phrase extraction results
        """
        try:
            results = self.client.extract_key_phrases(documents=texts)
            
            key_phrase_results = []
            for idx, result in enumerate(results):
                if result.kind == "KeyPhraseExtraction":
                    key_phrase_results.append({
                        'text': texts[idx],
                        'key_phrases': result.key_phrases,
                        'warnings': [warning.message for warning in result.warnings]
                    })
                else:
                    key_phrase_results.append({
                        'text': texts[idx],
                        'key_phrases': [],
                        'error': f"Error: {result.error.message}"
                    })
            
            return key_phrase_results
            
        except HttpResponseError as e:
            print(f"Error extracting key phrases: {e}")
            return []
    
    def recognize_entities(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Recognize named entities in texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of entity recognition results
        """
        try:
            results = self.client.recognize_entities(documents=texts)
            
            entity_results = []
            for idx, result in enumerate(results):
                if result.kind == "EntityRecognition":
                    entities = []
                    for entity in result.entities:
                        entities.append({
                            'text': entity.text,
                            'category': entity.category,
                            'subcategory': entity.subcategory,
                            'confidence_score': entity.confidence_score,
                            'offset': entity.offset,
                            'length': entity.length
                        })
                    
                    entity_results.append({
                        'text': texts[idx],
                        'entities': entities,
                        'warnings': [warning.message for warning in result.warnings]
                    })
                else:
                    entity_results.append({
                        'text': texts[idx],
                        'entities': [],
                        'error': f"Error: {result.error.message}"
                    })
            
            return entity_results
            
        except HttpResponseError as e:
            print(f"Error recognizing entities: {e}")
            return []
    
    def comprehensive_analysis(self, text: str) -> TextAnalysisResult:
        """
        Perform comprehensive text analysis including all features.
        
        Args:
            text: Text to analyze
            
        Returns:
            Comprehensive analysis result
        """
        # Language detection
        language_result = self.detect_language([text])[0]
        
        # Sentiment analysis with opinion mining
        sentiment_result = self.analyze_sentiment([text], show_opinion_mining=True)[0]
        
        # Key phrase extraction
        key_phrases_result = self.extract_key_phrases([text])[0]
        
        # Entity recognition
        entities_result = self.recognize_entities([text])[0]
        
        return TextAnalysisResult(
            original_text=text,
            language=language_result.get('language', 'unknown'),
            language_confidence=language_result.get('confidence', 0.0),
            sentiment=sentiment_result,
            key_phrases=key_phrases_result.get('key_phrases', []),
            entities=entities_result.get('entities', []),
            analysis_timestamp=datetime.now().isoformat()
        )
    
    async def batch_analysis(self, texts: List[str]) -> List[TextAnalysisResult]:
        """
        Perform batch analysis on multiple texts asynchronously.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of comprehensive analysis results
        """
        async with self.async_client:
            # Run all analyses concurrently
            language_task = self.async_client.detect_language(documents=texts)
            sentiment_task = self.async_client.analyze_sentiment(documents=texts, show_opinion_mining=True)
            key_phrases_task = self.async_client.extract_key_phrases(documents=texts)
            entities_task = self.async_client.recognize_entities(documents=texts)
            
            # Wait for all results
            language_results, sentiment_results, key_phrases_results, entities_results = await asyncio.gather(
                language_task, sentiment_task, key_phrases_task, entities_task
            )
            
            # Combine results
            batch_results = []
            for i, text in enumerate(texts):
                # Process language result
                lang_result = language_results[i]
                language = lang_result.primary_language.iso6391_name if lang_result.kind == "LanguageDetection" else "unknown"
                lang_confidence = lang_result.primary_language.confidence_score if lang_result.kind == "LanguageDetection" else 0.0
                
                # Process sentiment result
                sent_result = sentiment_results[i]
                if sent_result.kind == "SentimentAnalysis":
                    targets = []
                    assessments = []
                    
                    for sentence in sent_result.sentences:
                        if hasattr(sentence, 'targets'):
                            for target in sentence.targets:
                                targets.append({
                                    'text': target.text,
                                    'sentiment': target.sentiment,
                                    'confidence_scores': asdict(target.confidence_scores),
                                    'offset': target.offset,
                                    'length': target.length
                                })
                        
                        if hasattr(sentence, 'assessments'):
                            for assessment in sentence.assessments:
                                assessments.append({
                                    'text': assessment.text,
                                    'sentiment': assessment.sentiment,
                                    'confidence_scores': asdict(assessment.confidence_scores),
                                    'offset': assessment.offset,
                                    'length': assessment.length,
                                    'is_negated': assessment.is_negated
                                })
                    
                    sentiment_insight = SentimentInsight(
                        text=text,
                        sentiment=sent_result.sentiment,
                        confidence_scores=asdict(sent_result.confidence_scores),
                        targets=targets,
                        assessments=assessments,
                        overall_confidence=max(asdict(sent_result.confidence_scores).values())
                    )
                else:
                    sentiment_insight = SentimentInsight(
                        text=text,
                        sentiment="error",
                        confidence_scores={"positive": 0.0, "neutral": 0.0, "negative": 0.0},
                        targets=[],
                        assessments=[],
                        overall_confidence=0.0
                    )
                
                # Process key phrases result
                key_phrases_result = key_phrases_results[i]
                key_phrases = key_phrases_result.key_phrases if key_phrases_result.kind == "KeyPhraseExtraction" else []
                
                # Process entities result
                entities_result = entities_results[i]
                entities = []
                if entities_result.kind == "EntityRecognition":
                    for entity in entities_result.entities:
                        entities.append({
                            'text': entity.text,
                            'category': entity.category,
                            'subcategory': entity.subcategory,
                            'confidence_score': entity.confidence_score,
                            'offset': entity.offset,
                            'length': entity.length
                        })
                
                batch_results.append(TextAnalysisResult(
                    original_text=text,
                    language=language,
                    language_confidence=lang_confidence,
                    sentiment=sentiment_insight,
                    key_phrases=key_phrases,
                    entities=entities,
                    analysis_timestamp=datetime.now().isoformat()
                ))
            
            return batch_results

class TextAnalysisApp:
    """Interactive application demonstrating text analysis capabilities."""
    
    def __init__(self):
        """Initialize the text analysis application."""
        self.analyzer = AzureTextAnalyzer()
        self.analysis_history = []
    
    def display_sentiment_analysis(self, result: SentimentInsight):
        """Display sentiment analysis results in a formatted way."""
        print(f"\n📊 SENTIMENT ANALYSIS")
        print(f"Text: {result.text}")
        print(f"Overall Sentiment: {result.sentiment.upper()}")
        print(f"Confidence: {result.overall_confidence:.2%}")
        
        print(f"\nConfidence Scores:")
        for sentiment, score in result.confidence_scores.items():
            print(f"  {sentiment.capitalize()}: {score:.2%}")
        
        if result.targets:
            print(f"\n🎯 Opinion Mining - Targets:")
            for target in result.targets:
                print(f"  • {target['text']} ({target['sentiment']}, {max(target['confidence_scores'].values()):.2%})")
        
        if result.assessments:
            print(f"\n💭 Opinion Mining - Assessments:")
            for assessment in result.assessments:
                negated = " (negated)" if assessment['is_negated'] else ""
                print(f"  • {assessment['text']} ({assessment['sentiment']}{negated}, {max(assessment['confidence_scores'].values()):.2%})")
    
    def display_comprehensive_analysis(self, result: TextAnalysisResult):
        """Display comprehensive analysis results."""
        print(f"\n" + "="*60)
        print(f"🔍 COMPREHENSIVE TEXT ANALYSIS")
        print(f"="*60)
        
        print(f"\n📝 Original Text:")
        print(f"  {result.original_text}")
        
        print(f"\n🌍 Language Detection:")
        print(f"  Language: {result.language}")
        print(f"  Confidence: {result.language_confidence:.2%}")
        
        # Sentiment analysis
        self.display_sentiment_analysis(result.sentiment)
        
        print(f"\n🔑 Key Phrases:")
        if result.key_phrases:
            for phrase in result.key_phrases:
                print(f"  • {phrase}")
        else:
            print("  No key phrases detected")
        
        print(f"\n🏷️ Named Entities:")
        if result.entities:
            for entity in result.entities:
                subcategory = f" ({entity['subcategory']})" if entity['subcategory'] else ""
                print(f"  • {entity['text']}: {entity['category']}{subcategory} ({entity['confidence_score']:.2%})")
        else:
            print("  No entities detected")
        
        print(f"\n⏰ Analysis Time: {result.analysis_timestamp}")
    
    def demonstrate_sentiment_analysis(self):
        """Demonstrate sentiment analysis with various examples."""
        print("\n" + "="*50)
        print("😊 SENTIMENT ANALYSIS DEMO")
        print("="*50)
        
        test_texts = [
            "I absolutely love this product! It's amazing and works perfectly.",
            "This service is terrible. I'm very disappointed and frustrated.",
            "The meeting is scheduled for 3 PM in conference room B.",
            "The food was delicious, but the service was slow and unprofessional.",
            "I'm not sure how I feel about this new update. Some features are great, others not so much."
        ]
        
        results = self.analyzer.analyze_sentiment(test_texts, show_opinion_mining=True)
        
        for result in results:
            self.display_sentiment_analysis(result)
            print("-" * 50)
    
    def demonstrate_entity_recognition(self):
        """Demonstrate named entity recognition."""
        print("\n" + "="*50)
        print("🏷️ NAMED ENTITY RECOGNITION DEMO")
        print("="*50)
        
        test_texts = [
            "Microsoft was founded by Bill Gates and Paul Allen on April 4, 1975, in Albuquerque, New Mexico.",
            "Please contact John Smith at john.smith@example.com or call +1-555-123-4567 for more information.",
            "The meeting with Apple Inc. is scheduled for January 15, 2024, at 2:30 PM PST."
        ]
        
        for text in test_texts:
            print(f"\nText: {text}")
            results = self.analyzer.recognize_entities([text])
            
            if results and results[0].get('entities'):
                print("Entities found:")
                for entity in results[0]['entities']:
                    subcategory = f" ({entity['subcategory']})" if entity['subcategory'] else ""
                    print(f"  • {entity['text']}: {entity['category']}{subcategory} ({entity['confidence_score']:.2%})")
            else:
                print("No entities found")
            print("-" * 40)
    
    def demonstrate_key_phrase_extraction(self):
        """Demonstrate key phrase extraction."""
        print("\n" + "="*50)
        print("🔑 KEY PHRASE EXTRACTION DEMO")
        print("="*50)
        
        test_texts = [
            "Artificial intelligence and machine learning are transforming the way businesses operate. Companies are investing heavily in AI technologies to improve efficiency and customer experience.",
            "The new smartphone features an advanced camera system with multiple lenses, 5G connectivity, and an all-day battery life. The device also includes facial recognition and wireless charging capabilities.",
            "Climate change is one of the most pressing issues of our time. Rising temperatures, melting ice caps, and extreme weather events are affecting ecosystems worldwide."
        ]
        
        for text in test_texts:
            print(f"\nText: {text[:100]}...")
            results = self.analyzer.extract_key_phrases([text])
            
            if results and results[0].get('key_phrases'):
                print("Key phrases:")
                for phrase in results[0]['key_phrases']:
                    print(f"  • {phrase}")
            else:
                print("No key phrases found")
            print("-" * 40)
    
    def demonstrate_language_detection(self):
        """Demonstrate language detection."""
        print("\n" + "="*50)
        print("🌍 LANGUAGE DETECTION DEMO")
        print("="*50)
        
        multilingual_texts = [
            "Hello, how are you today?",
            "Bonjour, comment allez-vous?",
            "Hola, ¿cómo estás?",
            "Guten Tag, wie geht es Ihnen?",
            "こんにちは、元気ですか？",
            "Привет, как дела?",
            "مرحبا، كيف حالك؟"
        ]
        
        results = self.analyzer.detect_language(multilingual_texts)
        
        for result in results:
            print(f"Text: {result['text']}")
            print(f"Language: {result.get('language_name', 'Unknown')} ({result.get('language', 'N/A')})")
            print(f"Confidence: {result.get('confidence', 0):.2%}")
            print("-" * 40)
    
    def demonstrate_comprehensive_analysis(self):
        """Demonstrate comprehensive text analysis."""
        print("\n" + "="*50)
        print("🔍 COMPREHENSIVE ANALYSIS DEMO")
        print("="*50)
        
        test_texts = [
            "I recently purchased the new iPhone 15 Pro from Apple Store in New York. The camera quality is outstanding and the battery life is impressive, but the price is quite expensive. Overall, I'm satisfied with my purchase.",
            "Microsoft announced today that they will be releasing a new version of Azure AI services next month. The update includes improved natural language processing capabilities and better integration with OpenAI models."
        ]
        
        for text in test_texts:
            result = self.analyzer.comprehensive_analysis(text)
            self.display_comprehensive_analysis(result)
            self.analysis_history.append(result)
    
    async def demonstrate_batch_analysis(self):
        """Demonstrate batch processing capabilities."""
        print("\n" + "="*50)
        print("⚡ BATCH ANALYSIS DEMO")
        print("="*50)
        
        batch_texts = [
            "The customer service was excellent and very helpful.",
            "I'm disappointed with the product quality and delivery time.",
            "The new features are innovative but the interface is confusing.",
            "Great value for money! Highly recommend this product.",
            "Technical support resolved my issue quickly and professionally."
        ]
        
        print("Processing batch of texts...")
        results = await self.analyzer.batch_analysis(batch_texts)
        
        print(f"\nBatch analysis completed! Processed {len(results)} texts.")
        
        # Display summary
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0}
        for result in results:
            sentiment_counts[result.sentiment.sentiment] += 1
        
        print(f"\nSentiment Distribution:")
        for sentiment, count in sentiment_counts.items():
            percentage = (count / len(results)) * 100
            print(f"  {sentiment.capitalize()}: {count} ({percentage:.1f}%)")
        
        # Display detailed results
        print(f"\nDetailed Results:")
        for i, result in enumerate(results, 1):
            print(f"\n{i}. {result.original_text}")
            print(f"   Sentiment: {result.sentiment.sentiment} ({result.sentiment.overall_confidence:.2%})")
            print(f"   Key Phrases: {', '.join(result.key_phrases[:3])}...")
    
    def demonstrate_business_scenarios(self):
        """Demonstrate real-world business scenarios."""
        print("\n" + "="*50)
        print("💼 BUSINESS SCENARIOS DEMO")
        print("="*50)
        
        # Customer feedback analysis
        print("\n📞 Customer Feedback Analysis:")
        customer_feedback = [
            "The new app update is fantastic! The user interface is much cleaner and the performance is significantly better.",
            "I've been trying to contact support for three days with no response. This is unacceptable customer service.",
            "The product works as advertised but the setup process was complicated and time-consuming."
        ]
        
        for feedback in customer_feedback:
            result = self.analyzer.comprehensive_analysis(feedback)
            print(f"\nFeedback: {feedback}")
            print(f"Sentiment: {result.sentiment.sentiment} ({result.sentiment.overall_confidence:.2%})")
            
            # Business recommendations
            if result.sentiment.sentiment == "negative" and result.sentiment.overall_confidence > 0.7:
                print("🚨 Action Required: High-confidence negative feedback detected")
            elif result.sentiment.sentiment == "positive" and result.sentiment.overall_confidence > 0.8:
                print("✅ Success Story: Consider featuring this as a testimonial")
            
            if result.sentiment.targets:
                print(f"Focus Areas: {', '.join([t['text'] for t in result.sentiment.targets])}")
        
        # Social media monitoring
        print("\n📱 Social Media Monitoring:")
        social_posts = [
            "@BrandName just launched their new product and it's amazing! #innovation #tech",
            "Disappointed with @BrandName's latest update. Lots of bugs and crashes. #fail",
            "Thinking about switching to @BrandName. Anyone have experience with their products?"
        ]
        
        for post in social_posts:
            result = self.analyzer.analyze_sentiment([post])[0]
            print(f"\nPost: {post}")
            print(f"Sentiment: {result.sentiment} ({result.overall_confidence:.2%})")
            
            # Social media insights
            if "amazing" in post.lower() or "love" in post.lower():
                print("💡 Insight: Positive brand mention - consider engaging")
            elif "disappointed" in post.lower() or "fail" in post.lower():
                print("⚠️ Insight: Negative mention - customer service follow-up recommended")
    
    def interactive_analysis(self):
        """Run interactive text analysis mode."""
        print("\n" + "="*50)
        print("🎯 INTERACTIVE TEXT ANALYSIS")
        print("="*50)
        print("Commands:")
        print("  - Type text to analyze")
        print("  - 'batch' to analyze multiple texts")
        print("  - 'history' to show analysis history")
        print("  - 'quit' to exit")
        
        while True:
            try:
                user_input = input("\nEnter text to analyze: ").strip()
                
                if user_input.lower() == 'quit':
                    break
                elif user_input.lower() == 'history':
                    self.show_analysis_history()
                elif user_input.lower() == 'batch':
                    self.interactive_batch_analysis()
                elif user_input:
                    result = self.analyzer.comprehensive_analysis(user_input)
                    self.display_comprehensive_analysis(result)
                    self.analysis_history.append(result)
                
            except KeyboardInterrupt:
                print("\nExiting interactive mode...")
                break
            except Exception as e:
                print(f"Error: {e}")
    
    def interactive_batch_analysis(self):
        """Interactive batch analysis mode."""
        print("\nEnter multiple texts (empty line to finish):")
        texts = []
        while True:
            text = input(f"Text {len(texts) + 1}: ").strip()
            if not text:
                break
            texts.append(text)
        
        if texts:
            print(f"\nAnalyzing {len(texts)} texts...")
            try:
                results = asyncio.run(self.analyzer.batch_analysis(texts))
                
                for i, result in enumerate(results, 1):
                    print(f"\n--- Analysis {i} ---")
                    self.display_comprehensive_analysis(result)
                    self.analysis_history.append(result)
                    
            except Exception as e:
                print(f"Error in batch analysis: {e}")
    
    def show_analysis_history(self):
        """Display analysis history."""
        print("\n" + "="*50)
        print("📚 ANALYSIS HISTORY")
        print("="*50)
        
        if not self.analysis_history:
            print("No analysis history available.")
            return
        
        for i, result in enumerate(self.analysis_history[-5:], 1):  # Show last 5
            print(f"\n{i}. [{result.analysis_timestamp[:19]}]")
            print(f"   Text: {result.original_text[:50]}{'...' if len(result.original_text) > 50 else ''}")
            print(f"   Sentiment: {result.sentiment.sentiment} ({result.sentiment.overall_confidence:.2%})")
            print(f"   Language: {result.language}")
            print(f"   Key Phrases: {len(result.key_phrases)}, Entities: {len(result.entities)}")

def main():
    """Main function demonstrating Azure AI Language text analysis capabilities."""
    print("🔍 Azure AI Language - Text Analysis and Sentiment Demo")
    print("=" * 60)
    
    try:
        # Initialize the application
        app = TextAnalysisApp()
        
        # Test connection
        test_result = app.analyzer.detect_language(["Hello world"])
        if test_result:
            print("✅ Connected to Azure AI Language service successfully!")
        else:
            print("❌ Failed to connect to Azure AI Language service")
            return
        
        # Run demonstrations
        app.demonstrate_sentiment_analysis()
        app.demonstrate_entity_recognition()
        app.demonstrate_key_phrase_extraction()
        app.demonstrate_language_detection()
        app.demonstrate_comprehensive_analysis()
        
        # Async batch demo
        print("\nRunning batch analysis demo...")
        asyncio.run(app.demonstrate_batch_analysis())
        
        app.demonstrate_business_scenarios()
        
        # Ask if user wants interactive mode
        print("\n" + "="*50)
        response = input("Would you like to try interactive analysis mode? (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            app.interactive_analysis()
        
        print("\n🎉 Demo completed successfully!")
        print("\nKey takeaways:")
        print("✅ Comprehensive sentiment analysis with opinion mining")
        print("✅ Multi-language support and detection")
        print("✅ Named entity recognition and key phrase extraction")
        print("✅ Batch processing for efficiency")
        print("✅ Real-world business scenario applications")
        
    except Exception as e:
        print(f"❌ Error running demo: {e}")
        print("\nPlease check your environment variables:")
        print("- LANGUAGE_KEY")
        print("- LANGUAGE_ENDPOINT")

if __name__ == "__main__":
    main() 