#!/usr/bin/env python3
"""
Azure AI Translator - Text Translation Example

This example demonstrates how to use Azure AI Translator service to:
- Detect language of input text
- Translate text to multiple target languages
- Handle various translation scenarios
- Implement best practices for production use

Prerequisites:
- Azure subscription with Translator resource
- pip install requests python-dotenv

Set environment variables:
- TRANSLATOR_KEY: Your Translator resource key
- TRANSLATOR_ENDPOINT: Your Translator resource endpoint
- TRANSLATOR_REGION: Your Translator resource region
"""

import os
import json
import requests
import uuid
from typing import List, Dict, Optional, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AzureTranslator:
    """Azure AI Translator client for text translation operations."""
    
    def __init__(self):
        """Initialize the translator client with Azure credentials."""
        self.key = os.getenv('TRANSLATOR_KEY')
        self.endpoint = os.getenv('TRANSLATOR_ENDPOINT')
        self.region = os.getenv('TRANSLATOR_REGION')
        
        if not all([self.key, self.endpoint, self.region]):
            raise ValueError("Missing required environment variables. Please set TRANSLATOR_KEY, TRANSLATOR_ENDPOINT, and TRANSLATOR_REGION")
        
        # Ensure endpoint ends with /
        if not self.endpoint.endswith('/'):
            self.endpoint += '/'
            
        self.session = requests.Session()
        self.session.headers.update({
            'Ocp-Apim-Subscription-Key': self.key,
            'Ocp-Apim-Subscription-Region': self.region,
            'Content-type': 'application/json',
            'X-ClientTraceId': str(uuid.uuid4())
        })
    
    def detect_language(self, texts: Union[str, List[str]]) -> List[Dict]:
        """
        Detect the language of input text(s).
        
        Args:
            texts: String or list of strings to detect language for
            
        Returns:
            List of detection results with language, confidence, and alternatives
        """
        if isinstance(texts, str):
            texts = [texts]
        
        body = [{'text': text} for text in texts]
        
        try:
            response = self.session.post(
                f"{self.endpoint}detect?api-version=3.0",
                json=body
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error detecting language: {e}")
            return []
    
    def translate_text(self, 
                      texts: Union[str, List[str]], 
                      target_languages: Union[str, List[str]],
                      source_language: Optional[str] = None,
                      text_type: str = 'plain',
                      profanity_action: str = 'NoAction',
                      include_alignment: bool = False,
                      include_sentence_length: bool = False) -> List[Dict]:
        """
        Translate text to target language(s).
        
        Args:
            texts: String or list of strings to translate
            target_languages: Target language code(s)
            source_language: Source language code (optional, auto-detected if not provided)
            text_type: 'plain' or 'html'
            profanity_action: 'NoAction', 'Marked', or 'Deleted'
            include_alignment: Include word alignment information
            include_sentence_length: Include sentence length information
            
        Returns:
            List of translation results
        """
        if isinstance(texts, str):
            texts = [texts]
        if isinstance(target_languages, str):
            target_languages = [target_languages]
        
        # Build query parameters
        params = {
            'api-version': '3.0',
            'textType': text_type,
            'profanityAction': profanity_action
        }
        
        # Add target languages
        for lang in target_languages:
            params[f'to'] = lang
        
        # Add source language if specified
        if source_language:
            params['from'] = source_language
        
        # Add optional parameters
        if include_alignment:
            params['includeAlignment'] = 'true'
        if include_sentence_length:
            params['includeSentenceLength'] = 'true'
        
        body = [{'text': text} for text in texts]
        
        try:
            # Build URL with multiple 'to' parameters
            url = f"{self.endpoint}translate?api-version=3.0"
            for lang in target_languages:
                url += f"&to={lang}"
            
            if source_language:
                url += f"&from={source_language}"
            if text_type != 'plain':
                url += f"&textType={text_type}"
            if profanity_action != 'NoAction':
                url += f"&profanityAction={profanity_action}"
            if include_alignment:
                url += "&includeAlignment=true"
            if include_sentence_length:
                url += "&includeSentenceLength=true"
            
            response = self.session.post(url, json=body)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error translating text: {e}")
            return []
    
    def get_supported_languages(self, scope: str = 'translation') -> Dict:
        """
        Get list of supported languages.
        
        Args:
            scope: 'translation', 'transliteration', or 'dictionary'
            
        Returns:
            Dictionary of supported languages
        """
        try:
            response = self.session.get(
                f"{self.endpoint}languages?api-version=3.0&scope={scope}"
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error getting supported languages: {e}")
            return {}
    
    def transliterate_text(self, 
                          texts: Union[str, List[str]], 
                          language: str, 
                          from_script: str, 
                          to_script: str) -> List[Dict]:
        """
        Transliterate text from one script to another.
        
        Args:
            texts: String or list of strings to transliterate
            language: Language code
            from_script: Source script code
            to_script: Target script code
            
        Returns:
            List of transliteration results
        """
        if isinstance(texts, str):
            texts = [texts]
        
        body = [{'text': text} for text in texts]
        
        try:
            response = self.session.post(
                f"{self.endpoint}transliterate?api-version=3.0&language={language}&fromScript={from_script}&toScript={to_script}",
                json=body
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error transliterating text: {e}")
            return []

class TranslationApp:
    """Interactive translation application demonstrating various scenarios."""
    
    def __init__(self):
        """Initialize the translation app."""
        self.translator = AzureTranslator()
        self.translation_history = []
    
    def detect_and_display_language(self, text: str):
        """Detect and display language information for text."""
        print(f"\n🔍 Detecting language for: '{text[:50]}{'...' if len(text) > 50 else ''}'")
        
        results = self.translator.detect_language(text)
        if results:
            detection = results[0]
            language = detection.get('language', 'unknown')
            confidence = detection.get('score', 0)
            
            print(f"   Language: {language}")
            print(f"   Confidence: {confidence:.2%}")
            
            # Show alternatives if available
            if 'alternatives' in detection:
                print("   Alternatives:")
                for alt in detection['alternatives'][:3]:  # Show top 3
                    print(f"     - {alt['language']}: {alt['score']:.2%}")
            
            return language
        return None
    
    def translate_and_display(self, text: str, target_languages: List[str], source_language: Optional[str] = None):
        """Translate text and display results."""
        print(f"\n🌍 Translating to: {', '.join(target_languages)}")
        
        results = self.translator.translate_text(
            text, 
            target_languages, 
            source_language=source_language,
            include_alignment=True
        )
        
        if results:
            for result in results:
                detected_lang = result.get('detectedLanguage', {})
                if detected_lang:
                    print(f"   Detected: {detected_lang.get('language', 'unknown')} (confidence: {detected_lang.get('score', 0):.2%})")
                
                print(f"   Original: {text}")
                
                for translation in result.get('translations', []):
                    target_lang = translation.get('to', 'unknown')
                    translated_text = translation.get('text', '')
                    
                    print(f"   {target_lang.upper()}: {translated_text}")
                    
                    # Store in history
                    self.translation_history.append({
                        'original': text,
                        'translated': translated_text,
                        'source_lang': source_language or detected_lang.get('language'),
                        'target_lang': target_lang,
                        'timestamp': str(uuid.uuid4())[:8]
                    })
    
    def demonstrate_basic_translation(self):
        """Demonstrate basic text translation."""
        print("\n" + "="*50)
        print("🚀 BASIC TRANSLATION DEMO")
        print("="*50)
        
        # Single language translation
        text = "Hello, how are you today?"
        self.translate_and_display(text, ['es', 'fr', 'de'])
        
        # Multiple texts
        texts = [
            "Good morning!",
            "Thank you for your help.",
            "See you later!"
        ]
        
        print(f"\n📝 Translating multiple texts to Spanish:")
        for text in texts:
            results = self.translator.translate_text(text, 'es')
            if results:
                translation = results[0]['translations'][0]['text']
                print(f"   EN: {text}")
                print(f"   ES: {translation}")
    
    def demonstrate_language_detection(self):
        """Demonstrate language detection capabilities."""
        print("\n" + "="*50)
        print("🔍 LANGUAGE DETECTION DEMO")
        print("="*50)
        
        multilingual_texts = [
            "Hello, how are you?",
            "Bonjour, comment allez-vous?",
            "Hola, ¿cómo estás?",
            "Guten Tag, wie geht es Ihnen?",
            "こんにちは、元気ですか？",
            "Привет, как дела?",
            "مرحبا، كيف حالك؟"
        ]
        
        for text in multilingual_texts:
            self.detect_and_display_language(text)
    
    def demonstrate_html_translation(self):
        """Demonstrate HTML content translation."""
        print("\n" + "="*50)
        print("🌐 HTML TRANSLATION DEMO")
        print("="*50)
        
        html_content = """
        <h1>Welcome to our website!</h1>
        <p>We offer <strong>amazing products</strong> at great prices.</p>
        <p>Contact us at <a href="mailto:info@example.com">info@example.com</a></p>
        """
        
        print("Original HTML:")
        print(html_content)
        
        results = self.translator.translate_text(
            html_content, 
            ['es'], 
            text_type='html'
        )
        
        if results:
            translated_html = results[0]['translations'][0]['text']
            print("\nTranslated HTML (Spanish):")
            print(translated_html)
    
    def demonstrate_business_scenarios(self):
        """Demonstrate real-world business scenarios."""
        print("\n" + "="*50)
        print("💼 BUSINESS SCENARIOS DEMO")
        print("="*50)
        
        # Customer support scenario
        print("\n📞 Customer Support Scenario:")
        customer_message = "I'm having trouble with my order. Can you help me track it?"
        self.translate_and_display(customer_message, ['es', 'fr', 'de'])
        
        # Product description scenario
        print("\n🛍️ Product Description Scenario:")
        product_desc = "Premium wireless headphones with noise cancellation and 30-hour battery life."
        self.translate_and_display(product_desc, ['ja', 'ko', 'zh'])
        
        # Legal disclaimer scenario
        print("\n⚖️ Legal Disclaimer Scenario:")
        disclaimer = "By using this service, you agree to our terms and conditions."
        self.translate_and_display(disclaimer, ['pt', 'it', 'nl'])
    
    def demonstrate_error_handling(self):
        """Demonstrate error handling scenarios."""
        print("\n" + "="*50)
        print("⚠️ ERROR HANDLING DEMO")
        print("="*50)
        
        # Invalid language code
        print("\n❌ Testing invalid language code:")
        results = self.translator.translate_text("Hello", ['invalid_lang'])
        if not results:
            print("   Handled invalid language code gracefully")
        
        # Empty text
        print("\n❌ Testing empty text:")
        results = self.translator.translate_text("", ['es'])
        print(f"   Empty text result: {results}")
        
        # Very long text (testing limits)
        print("\n❌ Testing very long text:")
        long_text = "This is a test. " * 1000  # Create long text
        print(f"   Text length: {len(long_text)} characters")
        results = self.translator.translate_text(long_text[:5000], ['es'])  # Limit to 5000 chars
        if results:
            print("   Successfully handled long text")
    
    def show_translation_history(self):
        """Display translation history."""
        print("\n" + "="*50)
        print("📚 TRANSLATION HISTORY")
        print("="*50)
        
        if not self.translation_history:
            print("No translations in history.")
            return
        
        for i, translation in enumerate(self.translation_history[-5:], 1):  # Show last 5
            print(f"\n{i}. [{translation['timestamp']}]")
            print(f"   {translation['source_lang']} → {translation['target_lang']}")
            print(f"   Original: {translation['original'][:50]}{'...' if len(translation['original']) > 50 else ''}")
            print(f"   Translation: {translation['translated'][:50]}{'...' if len(translation['translated']) > 50 else ''}")
    
    def interactive_mode(self):
        """Run interactive translation mode."""
        print("\n" + "="*50)
        print("🎯 INTERACTIVE TRANSLATION MODE")
        print("="*50)
        print("Commands:")
        print("  - Type text to translate")
        print("  - 'lang:XX' to set target language (e.g., 'lang:es')")
        print("  - 'detect' to detect language of next input")
        print("  - 'history' to show translation history")
        print("  - 'quit' to exit")
        
        target_lang = 'es'  # Default to Spanish
        detect_mode = False
        
        while True:
            try:
                user_input = input(f"\n[Target: {target_lang}] Enter text: ").strip()
                
                if user_input.lower() == 'quit':
                    break
                elif user_input.lower() == 'history':
                    self.show_translation_history()
                elif user_input.lower() == 'detect':
                    detect_mode = True
                    print("Language detection mode enabled for next input.")
                elif user_input.startswith('lang:'):
                    target_lang = user_input[5:].strip()
                    print(f"Target language set to: {target_lang}")
                elif user_input:
                    if detect_mode:
                        self.detect_and_display_language(user_input)
                        detect_mode = False
                    else:
                        self.translate_and_display(user_input, [target_lang])
                
            except KeyboardInterrupt:
                print("\nExiting interactive mode...")
                break
            except Exception as e:
                print(f"Error: {e}")

def main():
    """Main function demonstrating Azure AI Translator capabilities."""
    print("🌍 Azure AI Translator - Text Translation Demo")
    print("=" * 60)
    
    try:
        # Initialize the translation app
        app = TranslationApp()
        
        # Check if we can connect to the service
        languages = app.translator.get_supported_languages()
        if languages:
            translation_langs = languages.get('translation', {})
            print(f"✅ Connected! Supports {len(translation_langs)} languages for translation")
        else:
            print("❌ Failed to connect to Azure Translator service")
            return
        
        # Run demonstrations
        app.demonstrate_basic_translation()
        app.demonstrate_language_detection()
        app.demonstrate_html_translation()
        app.demonstrate_business_scenarios()
        app.demonstrate_error_handling()
        app.show_translation_history()
        
        # Ask if user wants interactive mode
        print("\n" + "="*50)
        response = input("Would you like to try interactive mode? (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            app.interactive_mode()
        
        print("\n🎉 Demo completed successfully!")
        print("\nKey takeaways:")
        print("✅ Text translation to multiple languages")
        print("✅ Automatic language detection")
        print("✅ HTML content translation")
        print("✅ Error handling and edge cases")
        print("✅ Production-ready patterns")
        
    except Exception as e:
        print(f"❌ Error running demo: {e}")
        print("\nPlease check your environment variables:")
        print("- TRANSLATOR_KEY")
        print("- TRANSLATOR_ENDPOINT") 
        print("- TRANSLATOR_REGION")

if __name__ == "__main__":
    main() 