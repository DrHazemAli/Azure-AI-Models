#!/usr/bin/env node

/**
 * Azure AI Translator - Text Translation Example
 * 
 * This example demonstrates how to use Azure AI Translator service to:
 * - Detect language of input text
 * - Translate text to multiple target languages
 * - Handle various translation scenarios
 * - Implement best practices for production use
 * 
 * Prerequisites:
 * - Node.js 16+ installed
 * - npm install axios dotenv readline
 * 
 * Set environment variables:
 * - TRANSLATOR_KEY: Your Translator resource key
 * - TRANSLATOR_ENDPOINT: Your Translator resource endpoint
 * - TRANSLATOR_REGION: Your Translator resource region
 */

const axios = require('axios');
const readline = require('readline');
require('dotenv').config();

class AzureTranslator {
    /**
     * Azure AI Translator client for text translation operations.
     */
    constructor() {
        this.key = process.env.TRANSLATOR_KEY;
        this.endpoint = process.env.TRANSLATOR_ENDPOINT;
        this.region = process.env.TRANSLATOR_REGION;
        
        if (!this.key || !this.endpoint || !this.region) {
            throw new Error('Missing required environment variables. Please set TRANSLATOR_KEY, TRANSLATOR_ENDPOINT, and TRANSLATOR_REGION');
        }
        
        // Ensure endpoint ends with /
        if (!this.endpoint.endsWith('/')) {
            this.endpoint += '/';
        }
        
        // Create axios instance with default headers
        this.client = axios.create({
            baseURL: this.endpoint,
            headers: {
                'Ocp-Apim-Subscription-Key': this.key,
                'Ocp-Apim-Subscription-Region': this.region,
                'Content-Type': 'application/json',
                'X-ClientTraceId': this.generateUUID()
            },
            timeout: 30000 // 30 seconds timeout
        });
    }
    
    /**
     * Generate a UUID for request tracing.
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Detect the language of input text(s).
     * 
     * @param {string|string[]} texts - String or array of strings to detect language for
     * @returns {Promise<Object[]>} Array of detection results
     */
    async detectLanguage(texts) {
        if (typeof texts === 'string') {
            texts = [texts];
        }
        
        const body = texts.map(text => ({ text }));
        
        try {
            const response = await this.client.post('detect?api-version=3.0', body);
            return response.data;
        } catch (error) {
            console.error('Error detecting language:', error.message);
            return [];
        }
    }
    
    /**
     * Translate text to target language(s).
     * 
     * @param {string|string[]} texts - String or array of strings to translate
     * @param {string|string[]} targetLanguages - Target language code(s)
     * @param {Object} options - Translation options
     * @returns {Promise<Object[]>} Array of translation results
     */
    async translateText(texts, targetLanguages, options = {}) {
        if (typeof texts === 'string') {
            texts = [texts];
        }
        if (typeof targetLanguages === 'string') {
            targetLanguages = [targetLanguages];
        }
        
        const {
            sourceLanguage = null,
            textType = 'plain',
            profanityAction = 'NoAction',
            includeAlignment = false,
            includeSentenceLength = false
        } = options;
        
        // Build query parameters
        const params = new URLSearchParams({
            'api-version': '3.0',
            textType,
            profanityAction
        });
        
        // Add target languages
        targetLanguages.forEach(lang => params.append('to', lang));
        
        // Add optional parameters
        if (sourceLanguage) params.set('from', sourceLanguage);
        if (includeAlignment) params.set('includeAlignment', 'true');
        if (includeSentenceLength) params.set('includeSentenceLength', 'true');
        
        const body = texts.map(text => ({ text }));
        
        try {
            const response = await this.client.post(`translate?${params}`, body);
            return response.data;
        } catch (error) {
            console.error('Error translating text:', error.message);
            return [];
        }
    }
    
    /**
     * Get list of supported languages.
     * 
     * @param {string} scope - 'translation', 'transliteration', or 'dictionary'
     * @returns {Promise<Object>} Dictionary of supported languages
     */
    async getSupportedLanguages(scope = 'translation') {
        try {
            const response = await this.client.get(`languages?api-version=3.0&scope=${scope}`);
            return response.data;
        } catch (error) {
            console.error('Error getting supported languages:', error.message);
            return {};
        }
    }
    
    /**
     * Transliterate text from one script to another.
     * 
     * @param {string|string[]} texts - String or array of strings to transliterate
     * @param {string} language - Language code
     * @param {string} fromScript - Source script code
     * @param {string} toScript - Target script code
     * @returns {Promise<Object[]>} Array of transliteration results
     */
    async transliterateText(texts, language, fromScript, toScript) {
        if (typeof texts === 'string') {
            texts = [texts];
        }
        
        const body = texts.map(text => ({ text }));
        const params = new URLSearchParams({
            'api-version': '3.0',
            language,
            fromScript,
            toScript
        });
        
        try {
            const response = await this.client.post(`transliterate?${params}`, body);
            return response.data;
        } catch (error) {
            console.error('Error transliterating text:', error.message);
            return [];
        }
    }
}

class TranslationApp {
    /**
     * Interactive translation application demonstrating various scenarios.
     */
    constructor() {
        this.translator = new AzureTranslator();
        this.translationHistory = [];
    }
    
    /**
     * Detect and display language information for text.
     */
    async detectAndDisplayLanguage(text) {
        console.log(`\n🔍 Detecting language for: '${text.substring(0, 50)}${text.length > 50 ? '...' : ''}'`);
        
        const results = await this.translator.detectLanguage(text);
        if (results.length > 0) {
            const detection = results[0];
            const language = detection.language || 'unknown';
            const confidence = detection.score || 0;
            
            console.log(`   Language: ${language}`);
            console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
            
            // Show alternatives if available
            if (detection.alternatives) {
                console.log('   Alternatives:');
                detection.alternatives.slice(0, 3).forEach(alt => {
                    console.log(`     - ${alt.language}: ${(alt.score * 100).toFixed(1)}%`);
                });
            }
            
            return language;
        }
        return null;
    }
    
    /**
     * Translate text and display results.
     */
    async translateAndDisplay(text, targetLanguages, sourceLanguage = null) {
        console.log(`\n🌍 Translating to: ${targetLanguages.join(', ')}`);
        
        const results = await this.translator.translateText(
            text, 
            targetLanguages, 
            { 
                sourceLanguage,
                includeAlignment: true 
            }
        );
        
        if (results.length > 0) {
            for (const result of results) {
                const detectedLang = result.detectedLanguage;
                if (detectedLang) {
                    console.log(`   Detected: ${detectedLang.language} (confidence: ${(detectedLang.score * 100).toFixed(1)}%)`);
                }
                
                console.log(`   Original: ${text}`);
                
                for (const translation of result.translations || []) {
                    const targetLang = translation.to || 'unknown';
                    const translatedText = translation.text || '';
                    
                    console.log(`   ${targetLang.toUpperCase()}: ${translatedText}`);
                    
                    // Store in history
                    this.translationHistory.push({
                        original: text,
                        translated: translatedText,
                        sourceLang: sourceLanguage || detectedLang?.language,
                        targetLang: targetLang,
                        timestamp: new Date().toISOString().substring(0, 19)
                    });
                }
            }
        }
    }
    
    /**
     * Demonstrate basic text translation.
     */
    async demonstrateBasicTranslation() {
        console.log('\n' + '='.repeat(50));
        console.log('🚀 BASIC TRANSLATION DEMO');
        console.log('='.repeat(50));
        
        // Single language translation
        const text = "Hello, how are you today?";
        await this.translateAndDisplay(text, ['es', 'fr', 'de']);
        
        // Multiple texts
        const texts = [
            "Good morning!",
            "Thank you for your help.",
            "See you later!"
        ];
        
        console.log('\n📝 Translating multiple texts to Spanish:');
        for (const text of texts) {
            const results = await this.translator.translateText(text, 'es');
            if (results.length > 0) {
                const translation = results[0].translations[0].text;
                console.log(`   EN: ${text}`);
                console.log(`   ES: ${translation}`);
            }
        }
    }
    
    /**
     * Demonstrate language detection capabilities.
     */
    async demonstrateLanguageDetection() {
        console.log('\n' + '='.repeat(50));
        console.log('🔍 LANGUAGE DETECTION DEMO');
        console.log('='.repeat(50));
        
        const multilingualTexts = [
            "Hello, how are you?",
            "Bonjour, comment allez-vous?",
            "Hola, ¿cómo estás?",
            "Guten Tag, wie geht es Ihnen?",
            "こんにちは、元気ですか？",
            "Привет, как дела?",
            "مرحبا، كيف حالك؟"
        ];
        
        for (const text of multilingualTexts) {
            await this.detectAndDisplayLanguage(text);
        }
    }
    
    /**
     * Demonstrate HTML content translation.
     */
    async demonstrateHtmlTranslation() {
        console.log('\n' + '='.repeat(50));
        console.log('🌐 HTML TRANSLATION DEMO');
        console.log('='.repeat(50));
        
        const htmlContent = `
        <h1>Welcome to our website!</h1>
        <p>We offer <strong>amazing products</strong> at great prices.</p>
        <p>Contact us at <a href="mailto:info@example.com">info@example.com</a></p>
        `;
        
        console.log('Original HTML:');
        console.log(htmlContent);
        
        const results = await this.translator.translateText(
            htmlContent, 
            ['es'], 
            { textType: 'html' }
        );
        
        if (results.length > 0) {
            const translatedHtml = results[0].translations[0].text;
            console.log('\nTranslated HTML (Spanish):');
            console.log(translatedHtml);
        }
    }
    
    /**
     * Demonstrate real-world business scenarios.
     */
    async demonstrateBusinessScenarios() {
        console.log('\n' + '='.repeat(50));
        console.log('💼 BUSINESS SCENARIOS DEMO');
        console.log('='.repeat(50));
        
        // Customer support scenario
        console.log('\n📞 Customer Support Scenario:');
        const customerMessage = "I'm having trouble with my order. Can you help me track it?";
        await this.translateAndDisplay(customerMessage, ['es', 'fr', 'de']);
        
        // Product description scenario
        console.log('\n🛍️ Product Description Scenario:');
        const productDesc = "Premium wireless headphones with noise cancellation and 30-hour battery life.";
        await this.translateAndDisplay(productDesc, ['ja', 'ko', 'zh']);
        
        // Legal disclaimer scenario
        console.log('\n⚖️ Legal Disclaimer Scenario:');
        const disclaimer = "By using this service, you agree to our terms and conditions.";
        await this.translateAndDisplay(disclaimer, ['pt', 'it', 'nl']);
    }
    
    /**
     * Demonstrate error handling scenarios.
     */
    async demonstrateErrorHandling() {
        console.log('\n' + '='.repeat(50));
        console.log('⚠️ ERROR HANDLING DEMO');
        console.log('='.repeat(50));
        
        // Invalid language code
        console.log('\n❌ Testing invalid language code:');
        const results1 = await this.translator.translateText("Hello", ['invalid_lang']);
        if (results1.length === 0) {
            console.log('   Handled invalid language code gracefully');
        }
        
        // Empty text
        console.log('\n❌ Testing empty text:');
        const results2 = await this.translator.translateText("", ['es']);
        console.log(`   Empty text result: ${JSON.stringify(results2)}`);
        
        // Very long text (testing limits)
        console.log('\n❌ Testing very long text:');
        const longText = "This is a test. ".repeat(1000);
        console.log(`   Text length: ${longText.length} characters`);
        const results3 = await this.translator.translateText(longText.substring(0, 5000), ['es']);
        if (results3.length > 0) {
            console.log('   Successfully handled long text');
        }
    }
    
    /**
     * Display translation history.
     */
    showTranslationHistory() {
        console.log('\n' + '='.repeat(50));
        console.log('📚 TRANSLATION HISTORY');
        console.log('='.repeat(50));
        
        if (this.translationHistory.length === 0) {
            console.log('No translations in history.');
            return;
        }
        
        const recentHistory = this.translationHistory.slice(-5); // Show last 5
        recentHistory.forEach((translation, index) => {
            console.log(`\n${index + 1}. [${translation.timestamp}]`);
            console.log(`   ${translation.sourceLang} → ${translation.targetLang}`);
            const originalPreview = translation.original.length > 50 
                ? translation.original.substring(0, 50) + '...' 
                : translation.original;
            const translatedPreview = translation.translated.length > 50 
                ? translation.translated.substring(0, 50) + '...' 
                : translation.translated;
            console.log(`   Original: ${originalPreview}`);
            console.log(`   Translation: ${translatedPreview}`);
        });
    }
    
    /**
     * Run interactive translation mode.
     */
    async interactiveMode() {
        console.log('\n' + '='.repeat(50));
        console.log('🎯 INTERACTIVE TRANSLATION MODE');
        console.log('='.repeat(50));
        console.log('Commands:');
        console.log('  - Type text to translate');
        console.log('  - "lang:XX" to set target language (e.g., "lang:es")');
        console.log('  - "detect" to detect language of next input');
        console.log('  - "history" to show translation history');
        console.log('  - "quit" to exit');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        let targetLang = 'es'; // Default to Spanish
        let detectMode = false;
        
        const promptUser = () => {
            rl.question(`\n[Target: ${targetLang}] Enter text: `, async (userInput) => {
                const input = userInput.trim();
                
                if (input.toLowerCase() === 'quit') {
                    rl.close();
                    return;
                } else if (input.toLowerCase() === 'history') {
                    this.showTranslationHistory();
                    promptUser();
                } else if (input.toLowerCase() === 'detect') {
                    detectMode = true;
                    console.log('Language detection mode enabled for next input.');
                    promptUser();
                } else if (input.startsWith('lang:')) {
                    targetLang = input.substring(5).trim();
                    console.log(`Target language set to: ${targetLang}`);
                    promptUser();
                } else if (input) {
                    try {
                        if (detectMode) {
                            await this.detectAndDisplayLanguage(input);
                            detectMode = false;
                        } else {
                            await this.translateAndDisplay(input, [targetLang]);
                        }
                    } catch (error) {
                        console.error(`Error: ${error.message}`);
                    }
                    promptUser();
                } else {
                    promptUser();
                }
            });
        };
        
        promptUser();
    }
}

/**
 * Main function demonstrating Azure AI Translator capabilities.
 */
async function main() {
    console.log('🌍 Azure AI Translator - Text Translation Demo');
    console.log('='.repeat(60));
    
    try {
        // Initialize the translation app
        const app = new TranslationApp();
        
        // Check if we can connect to the service
        const languages = await app.translator.getSupportedLanguages();
        if (languages.translation) {
            const translationLangs = Object.keys(languages.translation);
            console.log(`✅ Connected! Supports ${translationLangs.length} languages for translation`);
        } else {
            console.log('❌ Failed to connect to Azure Translator service');
            return;
        }
        
        // Run demonstrations
        await app.demonstrateBasicTranslation();
        await app.demonstrateLanguageDetection();
        await app.demonstrateHtmlTranslation();
        await app.demonstrateBusinessScenarios();
        await app.demonstrateErrorHandling();
        app.showTranslationHistory();
        
        // Ask if user wants interactive mode
        console.log('\n' + '='.repeat(50));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('Would you like to try interactive mode? (y/n): ', (response) => {
            if (response.trim().toLowerCase() === 'y' || response.trim().toLowerCase() === 'yes') {
                rl.close();
                app.interactiveMode();
            } else {
                rl.close();
                console.log('\n🎉 Demo completed successfully!');
                console.log('\nKey takeaways:');
                console.log('✅ Text translation to multiple languages');
                console.log('✅ Automatic language detection');
                console.log('✅ HTML content translation');
                console.log('✅ Error handling and edge cases');
                console.log('✅ Production-ready patterns');
            }
        });
        
    } catch (error) {
        console.error(`❌ Error running demo: ${error.message}`);
        console.log('\nPlease check your environment variables:');
        console.log('- TRANSLATOR_KEY');
        console.log('- TRANSLATOR_ENDPOINT');
        console.log('- TRANSLATOR_REGION');
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { AzureTranslator, TranslationApp }; 