#!/usr/bin/env node

/**
 * Azure AI Language - Text Analysis and Sentiment Example
 * 
 * This example demonstrates how to use Azure AI Language service for:
 * - Sentiment analysis with confidence scores
 * - Opinion mining (targets and assessments)
 * - Key phrase extraction
 * - Named entity recognition (NER)
 * - Language detection
 * - Comprehensive text understanding
 * 
 * Prerequisites:
 * - Node.js 16+ installed
 * - npm install @azure/ai-text-analytics dotenv readline
 * 
 * Set environment variables:
 * - LANGUAGE_KEY: Your Language resource key
 * - LANGUAGE_ENDPOINT: Your Language resource endpoint
 */

const { TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics');
const readline = require('readline');
require('dotenv').config();

class AzureTextAnalyzer {
    /**
     * Azure AI Language client for comprehensive text analysis.
     */
    constructor() {
        this.key = process.env.LANGUAGE_KEY;
        this.endpoint = process.env.LANGUAGE_ENDPOINT;
        
        if (!this.key || !this.endpoint) {
            throw new Error('Missing required environment variables. Please set LANGUAGE_KEY and LANGUAGE_ENDPOINT');
        }
        
        this.client = new TextAnalyticsClient(
            this.endpoint,
            new AzureKeyCredential(this.key)
        );
    }
    
    /**
     * Detect the language of input texts.
     * @param {string[]} texts - Array of texts to analyze
     * @returns {Promise<Object[]>} Array of language detection results
     */
    async detectLanguage(texts) {
        try {
            const results = await this.client.detectLanguage(texts);
            
            return results.map((result, index) => {
                if (!result.error) {
                    return {
                        text: texts[index],
                        language: result.primaryLanguage.iso6391Name,
                        languageName: result.primaryLanguage.name,
                        confidence: result.primaryLanguage.confidenceScore,
                        warnings: result.warnings.map(w => w.message)
                    };
                } else {
                    return {
                        text: texts[index],
                        error: result.error.message,
                        language: 'unknown',
                        confidence: 0.0
                    };
                }
            });
        } catch (error) {
            console.error('Error detecting language:', error.message);
            return [];
        }
    }
    
    /**
     * Analyze sentiment with optional opinion mining.
     * @param {string[]} texts - Array of texts to analyze
     * @param {boolean} showOpinionMining - Whether to include opinion mining results
     * @returns {Promise<Object[]>} Array of sentiment analysis results
     */
    async analyzeSentiment(texts, showOpinionMining = true) {
        try {
            const results = await this.client.analyzeSentiment(texts, {
                includeOpinionMining: showOpinionMining
            });
            
            return results.map((result, index) => {
                if (!result.error) {
                    // Extract targets and assessments from opinion mining
                    const targets = [];
                    const assessments = [];
                    
                    if (showOpinionMining && result.sentences) {
                        result.sentences.forEach(sentence => {
                            if (sentence.targets) {
                                sentence.targets.forEach(target => {
                                    targets.push({
                                        text: target.text,
                                        sentiment: target.sentiment,
                                        confidenceScores: target.confidenceScores,
                                        offset: target.offset,
                                        length: target.length
                                    });
                                });
                            }
                            
                            if (sentence.assessments) {
                                sentence.assessments.forEach(assessment => {
                                    assessments.push({
                                        text: assessment.text,
                                        sentiment: assessment.sentiment,
                                        confidenceScores: assessment.confidenceScores,
                                        offset: assessment.offset,
                                        length: assessment.length,
                                        isNegated: assessment.isNegated
                                    });
                                });
                            }
                        });
                    }
                    
                    // Calculate overall confidence
                    const confidenceScores = result.confidenceScores;
                    const overallConfidence = Math.max(
                        confidenceScores.positive,
                        confidenceScores.neutral,
                        confidenceScores.negative
                    );
                    
                    return {
                        text: texts[index],
                        sentiment: result.sentiment,
                        confidenceScores: confidenceScores,
                        targets: targets,
                        assessments: assessments,
                        overallConfidence: overallConfidence,
                        warnings: result.warnings.map(w => w.message)
                    };
                } else {
                    return {
                        text: texts[index],
                        sentiment: 'error',
                        confidenceScores: { positive: 0.0, neutral: 0.0, negative: 0.0 },
                        targets: [],
                        assessments: [],
                        overallConfidence: 0.0,
                        error: result.error.message
                    };
                }
            });
        } catch (error) {
            console.error('Error analyzing sentiment:', error.message);
            return [];
        }
    }
    
    /**
     * Extract key phrases from texts.
     * @param {string[]} texts - Array of texts to analyze
     * @returns {Promise<Object[]>} Array of key phrase extraction results
     */
    async extractKeyPhrases(texts) {
        try {
            const results = await this.client.extractKeyPhrases(texts);
            
            return results.map((result, index) => {
                if (!result.error) {
                    return {
                        text: texts[index],
                        keyPhrases: result.keyPhrases,
                        warnings: result.warnings.map(w => w.message)
                    };
                } else {
                    return {
                        text: texts[index],
                        keyPhrases: [],
                        error: result.error.message
                    };
                }
            });
        } catch (error) {
            console.error('Error extracting key phrases:', error.message);
            return [];
        }
    }
    
    /**
     * Recognize named entities in texts.
     * @param {string[]} texts - Array of texts to analyze
     * @returns {Promise<Object[]>} Array of entity recognition results
     */
    async recognizeEntities(texts) {
        try {
            const results = await this.client.recognizeEntities(texts);
            
            return results.map((result, index) => {
                if (!result.error) {
                    const entities = result.entities.map(entity => ({
                        text: entity.text,
                        category: entity.category,
                        subcategory: entity.subcategory,
                        confidenceScore: entity.confidenceScore,
                        offset: entity.offset,
                        length: entity.length
                    }));
                    
                    return {
                        text: texts[index],
                        entities: entities,
                        warnings: result.warnings.map(w => w.message)
                    };
                } else {
                    return {
                        text: texts[index],
                        entities: [],
                        error: result.error.message
                    };
                }
            });
        } catch (error) {
            console.error('Error recognizing entities:', error.message);
            return [];
        }
    }
    
    /**
     * Perform comprehensive text analysis including all features.
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>} Comprehensive analysis result
     */
    async comprehensiveAnalysis(text) {
        try {
            // Run all analyses in parallel
            const [
                languageResults,
                sentimentResults,
                keyPhrasesResults,
                entitiesResults
            ] = await Promise.all([
                this.detectLanguage([text]),
                this.analyzeSentiment([text], true),
                this.extractKeyPhrases([text]),
                this.recognizeEntities([text])
            ]);
            
            return {
                originalText: text,
                language: languageResults[0]?.language || 'unknown',
                languageConfidence: languageResults[0]?.confidence || 0.0,
                sentiment: sentimentResults[0] || {
                    sentiment: 'unknown',
                    confidenceScores: { positive: 0, neutral: 0, negative: 0 },
                    targets: [],
                    assessments: [],
                    overallConfidence: 0
                },
                keyPhrases: keyPhrasesResults[0]?.keyPhrases || [],
                entities: entitiesResults[0]?.entities || [],
                analysisTimestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error in comprehensive analysis:', error.message);
            throw error;
        }
    }
    
    /**
     * Perform batch analysis on multiple texts.
     * @param {string[]} texts - Array of texts to analyze
     * @returns {Promise<Object[]>} Array of comprehensive analysis results
     */
    async batchAnalysis(texts) {
        try {
            // Run all analyses in parallel for all texts
            const [
                languageResults,
                sentimentResults,
                keyPhrasesResults,
                entitiesResults
            ] = await Promise.all([
                this.detectLanguage(texts),
                this.analyzeSentiment(texts, true),
                this.extractKeyPhrases(texts),
                this.recognizeEntities(texts)
            ]);
            
            // Combine results
            return texts.map((text, index) => ({
                originalText: text,
                language: languageResults[index]?.language || 'unknown',
                languageConfidence: languageResults[index]?.confidence || 0.0,
                sentiment: sentimentResults[index] || {
                    sentiment: 'unknown',
                    confidenceScores: { positive: 0, neutral: 0, negative: 0 },
                    targets: [],
                    assessments: [],
                    overallConfidence: 0
                },
                keyPhrases: keyPhrasesResults[index]?.keyPhrases || [],
                entities: entitiesResults[index]?.entities || [],
                analysisTimestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error in batch analysis:', error.message);
            throw error;
        }
    }
}

class TextAnalysisApp {
    /**
     * Interactive application demonstrating text analysis capabilities.
     */
    constructor() {
        this.analyzer = new AzureTextAnalyzer();
        this.analysisHistory = [];
    }
    
    /**
     * Display sentiment analysis results in a formatted way.
     */
    displaySentimentAnalysis(result) {
        console.log('\n📊 SENTIMENT ANALYSIS');
        console.log(`Text: ${result.text}`);
        console.log(`Overall Sentiment: ${result.sentiment.toUpperCase()}`);
        console.log(`Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
        
        console.log('\nConfidence Scores:');
        Object.entries(result.confidenceScores).forEach(([sentiment, score]) => {
            console.log(`  ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}: ${(score * 100).toFixed(1)}%`);
        });
        
        if (result.targets && result.targets.length > 0) {
            console.log('\n🎯 Opinion Mining - Targets:');
            result.targets.forEach(target => {
                const maxConfidence = Math.max(...Object.values(target.confidenceScores));
                console.log(`  • ${target.text} (${target.sentiment}, ${(maxConfidence * 100).toFixed(1)}%)`);
            });
        }
        
        if (result.assessments && result.assessments.length > 0) {
            console.log('\n💭 Opinion Mining - Assessments:');
            result.assessments.forEach(assessment => {
                const negated = assessment.isNegated ? ' (negated)' : '';
                const maxConfidence = Math.max(...Object.values(assessment.confidenceScores));
                console.log(`  • ${assessment.text} (${assessment.sentiment}${negated}, ${(maxConfidence * 100).toFixed(1)}%)`);
            });
        }
    }
    
    /**
     * Display comprehensive analysis results.
     */
    displayComprehensiveAnalysis(result) {
        console.log('\n' + '='.repeat(60));
        console.log('🔍 COMPREHENSIVE TEXT ANALYSIS');
        console.log('='.repeat(60));
        
        console.log('\n📝 Original Text:');
        console.log(`  ${result.originalText}`);
        
        console.log('\n🌍 Language Detection:');
        console.log(`  Language: ${result.language}`);
        console.log(`  Confidence: ${(result.languageConfidence * 100).toFixed(1)}%`);
        
        // Sentiment analysis
        this.displaySentimentAnalysis(result.sentiment);
        
        console.log('\n🔑 Key Phrases:');
        if (result.keyPhrases.length > 0) {
            result.keyPhrases.forEach(phrase => {
                console.log(`  • ${phrase}`);
            });
        } else {
            console.log('  No key phrases detected');
        }
        
        console.log('\n🏷️ Named Entities:');
        if (result.entities.length > 0) {
            result.entities.forEach(entity => {
                const subcategory = entity.subcategory ? ` (${entity.subcategory})` : '';
                console.log(`  • ${entity.text}: ${entity.category}${subcategory} (${(entity.confidenceScore * 100).toFixed(1)}%)`);
            });
        } else {
            console.log('  No entities detected');
        }
        
        console.log(`\n⏰ Analysis Time: ${result.analysisTimestamp}`);
    }
    
    /**
     * Demonstrate sentiment analysis with various examples.
     */
    async demonstrateSentimentAnalysis() {
        console.log('\n' + '='.repeat(50));
        console.log('😊 SENTIMENT ANALYSIS DEMO');
        console.log('='.repeat(50));
        
        const testTexts = [
            "I absolutely love this product! It's amazing and works perfectly.",
            "This service is terrible. I'm very disappointed and frustrated.",
            "The meeting is scheduled for 3 PM in conference room B.",
            "The food was delicious, but the service was slow and unprofessional.",
            "I'm not sure how I feel about this new update. Some features are great, others not so much."
        ];
        
        const results = await this.analyzer.analyzeSentiment(testTexts, true);
        
        results.forEach(result => {
            this.displaySentimentAnalysis(result);
            console.log('-'.repeat(50));
        });
    }
    
    /**
     * Demonstrate named entity recognition.
     */
    async demonstrateEntityRecognition() {
        console.log('\n' + '='.repeat(50));
        console.log('🏷️ NAMED ENTITY RECOGNITION DEMO');
        console.log('='.repeat(50));
        
        const testTexts = [
            "Microsoft was founded by Bill Gates and Paul Allen on April 4, 1975, in Albuquerque, New Mexico.",
            "Please contact John Smith at john.smith@example.com or call +1-555-123-4567 for more information.",
            "The meeting with Apple Inc. is scheduled for January 15, 2024, at 2:30 PM PST."
        ];
        
        for (const text of testTexts) {
            console.log(`\nText: ${text}`);
            const results = await this.analyzer.recognizeEntities([text]);
            
            if (results.length > 0 && results[0].entities.length > 0) {
                console.log('Entities found:');
                results[0].entities.forEach(entity => {
                    const subcategory = entity.subcategory ? ` (${entity.subcategory})` : '';
                    console.log(`  • ${entity.text}: ${entity.category}${subcategory} (${(entity.confidenceScore * 100).toFixed(1)}%)`);
                });
            } else {
                console.log('No entities found');
            }
            console.log('-'.repeat(40));
        }
    }
    
    /**
     * Demonstrate key phrase extraction.
     */
    async demonstrateKeyPhraseExtraction() {
        console.log('\n' + '='.repeat(50));
        console.log('🔑 KEY PHRASE EXTRACTION DEMO');
        console.log('='.repeat(50));
        
        const testTexts = [
            "Artificial intelligence and machine learning are transforming the way businesses operate. Companies are investing heavily in AI technologies to improve efficiency and customer experience.",
            "The new smartphone features an advanced camera system with multiple lenses, 5G connectivity, and an all-day battery life. The device also includes facial recognition and wireless charging capabilities.",
            "Climate change is one of the most pressing issues of our time. Rising temperatures, melting ice caps, and extreme weather events are affecting ecosystems worldwide."
        ];
        
        for (const text of testTexts) {
            console.log(`\nText: ${text.substring(0, 100)}...`);
            const results = await this.analyzer.extractKeyPhrases([text]);
            
            if (results.length > 0 && results[0].keyPhrases.length > 0) {
                console.log('Key phrases:');
                results[0].keyPhrases.forEach(phrase => {
                    console.log(`  • ${phrase}`);
                });
            } else {
                console.log('No key phrases found');
            }
            console.log('-'.repeat(40));
        }
    }
    
    /**
     * Demonstrate language detection.
     */
    async demonstrateLanguageDetection() {
        console.log('\n' + '='.repeat(50));
        console.log('🌍 LANGUAGE DETECTION DEMO');
        console.log('='.repeat(50));
        
        const multilingualTexts = [
            "Hello, how are you today?",
            "Bonjour, comment allez-vous?",
            "Hola, ¿cómo estás?",
            "Guten Tag, wie geht es Ihnen?",
            "こんにちは、元気ですか？",
            "Привет, как дела?",
            "مرحبا، كيف حالك؟"
        ];
        
        const results = await this.analyzer.detectLanguage(multilingualTexts);
        
        results.forEach(result => {
            console.log(`Text: ${result.text}`);
            console.log(`Language: ${result.languageName || 'Unknown'} (${result.language || 'N/A'})`);
            console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            console.log('-'.repeat(40));
        });
    }
    
    /**
     * Demonstrate comprehensive text analysis.
     */
    async demonstrateComprehensiveAnalysis() {
        console.log('\n' + '='.repeat(50));
        console.log('🔍 COMPREHENSIVE ANALYSIS DEMO');
        console.log('='.repeat(50));
        
        const testTexts = [
            "I recently purchased the new iPhone 15 Pro from Apple Store in New York. The camera quality is outstanding and the battery life is impressive, but the price is quite expensive. Overall, I'm satisfied with my purchase.",
            "Microsoft announced today that they will be releasing a new version of Azure AI services next month. The update includes improved natural language processing capabilities and better integration with OpenAI models."
        ];
        
        for (const text of testTexts) {
            const result = await this.analyzer.comprehensiveAnalysis(text);
            this.displayComprehensiveAnalysis(result);
            this.analysisHistory.push(result);
        }
    }
    
    /**
     * Demonstrate batch processing capabilities.
     */
    async demonstrateBatchAnalysis() {
        console.log('\n' + '='.repeat(50));
        console.log('⚡ BATCH ANALYSIS DEMO');
        console.log('='.repeat(50));
        
        const batchTexts = [
            "The customer service was excellent and very helpful.",
            "I'm disappointed with the product quality and delivery time.",
            "The new features are innovative but the interface is confusing.",
            "Great value for money! Highly recommend this product.",
            "Technical support resolved my issue quickly and professionally."
        ];
        
        console.log('Processing batch of texts...');
        const results = await this.analyzer.batchAnalysis(batchTexts);
        
        console.log(`\nBatch analysis completed! Processed ${results.length} texts.`);
        
        // Display summary
        const sentimentCounts = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
        results.forEach(result => {
            sentimentCounts[result.sentiment.sentiment] = (sentimentCounts[result.sentiment.sentiment] || 0) + 1;
        });
        
        console.log('\nSentiment Distribution:');
        Object.entries(sentimentCounts).forEach(([sentiment, count]) => {
            const percentage = (count / results.length) * 100;
            console.log(`  ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}: ${count} (${percentage.toFixed(1)}%)`);
        });
        
        // Display detailed results
        console.log('\nDetailed Results:');
        results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.originalText}`);
            console.log(`   Sentiment: ${result.sentiment.sentiment} (${(result.sentiment.overallConfidence * 100).toFixed(1)}%)`);
            console.log(`   Key Phrases: ${result.keyPhrases.slice(0, 3).join(', ')}...`);
        });
    }
    
    /**
     * Demonstrate real-world business scenarios.
     */
    async demonstrateBusinessScenarios() {
        console.log('\n' + '='.repeat(50));
        console.log('💼 BUSINESS SCENARIOS DEMO');
        console.log('='.repeat(50));
        
        // Customer feedback analysis
        console.log('\n📞 Customer Feedback Analysis:');
        const customerFeedback = [
            "The new app update is fantastic! The user interface is much cleaner and the performance is significantly better.",
            "I've been trying to contact support for three days with no response. This is unacceptable customer service.",
            "The product works as advertised but the setup process was complicated and time-consuming."
        ];
        
        for (const feedback of customerFeedback) {
            const result = await this.analyzer.comprehensiveAnalysis(feedback);
            console.log(`\nFeedback: ${feedback}`);
            console.log(`Sentiment: ${result.sentiment.sentiment} (${(result.sentiment.overallConfidence * 100).toFixed(1)}%)`);
            
            // Business recommendations
            if (result.sentiment.sentiment === 'negative' && result.sentiment.overallConfidence > 0.7) {
                console.log('🚨 Action Required: High-confidence negative feedback detected');
            } else if (result.sentiment.sentiment === 'positive' && result.sentiment.overallConfidence > 0.8) {
                console.log('✅ Success Story: Consider featuring this as a testimonial');
            }
            
            if (result.sentiment.targets.length > 0) {
                console.log(`Focus Areas: ${result.sentiment.targets.map(t => t.text).join(', ')}`);
            }
        }
        
        // Social media monitoring
        console.log('\n📱 Social Media Monitoring:');
        const socialPosts = [
            "@BrandName just launched their new product and it's amazing! #innovation #tech",
            "Disappointed with @BrandName's latest update. Lots of bugs and crashes. #fail",
            "Thinking about switching to @BrandName. Anyone have experience with their products?"
        ];
        
        for (const post of socialPosts) {
            const results = await this.analyzer.analyzeSentiment([post]);
            const result = results[0];
            console.log(`\nPost: ${post}`);
            console.log(`Sentiment: ${result.sentiment} (${(result.overallConfidence * 100).toFixed(1)}%)`);
            
            // Social media insights
            if (post.toLowerCase().includes('amazing') || post.toLowerCase().includes('love')) {
                console.log('💡 Insight: Positive brand mention - consider engaging');
            } else if (post.toLowerCase().includes('disappointed') || post.toLowerCase().includes('fail')) {
                console.log('⚠️ Insight: Negative mention - customer service follow-up recommended');
            }
        }
    }
    
    /**
     * Run interactive text analysis mode.
     */
    async interactiveAnalysis() {
        console.log('\n' + '='.repeat(50));
        console.log('🎯 INTERACTIVE TEXT ANALYSIS');
        console.log('='.repeat(50));
        console.log('Commands:');
        console.log('  - Type text to analyze');
        console.log('  - "batch" to analyze multiple texts');
        console.log('  - "history" to show analysis history');
        console.log('  - "quit" to exit');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const promptUser = () => {
            rl.question('\nEnter text to analyze: ', async (userInput) => {
                const input = userInput.trim();
                
                if (input.toLowerCase() === 'quit') {
                    rl.close();
                    return;
                } else if (input.toLowerCase() === 'history') {
                    this.showAnalysisHistory();
                    promptUser();
                } else if (input.toLowerCase() === 'batch') {
                    await this.interactiveBatchAnalysis(rl);
                    promptUser();
                } else if (input) {
                    try {
                        const result = await this.analyzer.comprehensiveAnalysis(input);
                        this.displayComprehensiveAnalysis(result);
                        this.analysisHistory.push(result);
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
    
    /**
     * Interactive batch analysis mode.
     */
    async interactiveBatchAnalysis(rl) {
        return new Promise((resolve) => {
            console.log('\nEnter multiple texts (empty line to finish):');
            const texts = [];
            
            const collectTexts = () => {
                rl.question(`Text ${texts.length + 1}: `, (text) => {
                    if (text.trim()) {
                        texts.push(text.trim());
                        collectTexts();
                    } else {
                        if (texts.length > 0) {
                            console.log(`\nAnalyzing ${texts.length} texts...`);
                            this.analyzer.batchAnalysis(texts)
                                .then(results => {
                                    results.forEach((result, index) => {
                                        console.log(`\n--- Analysis ${index + 1} ---`);
                                        this.displayComprehensiveAnalysis(result);
                                        this.analysisHistory.push(result);
                                    });
                                    resolve();
                                })
                                .catch(error => {
                                    console.error(`Error in batch analysis: ${error.message}`);
                                    resolve();
                                });
                        } else {
                            resolve();
                        }
                    }
                });
            };
            
            collectTexts();
        });
    }
    
    /**
     * Display analysis history.
     */
    showAnalysisHistory() {
        console.log('\n' + '='.repeat(50));
        console.log('📚 ANALYSIS HISTORY');
        console.log('='.repeat(50));
        
        if (this.analysisHistory.length === 0) {
            console.log('No analysis history available.');
            return;
        }
        
        const recentHistory = this.analysisHistory.slice(-5); // Show last 5
        recentHistory.forEach((result, index) => {
            console.log(`\n${index + 1}. [${result.analysisTimestamp.substring(0, 19)}]`);
            const textPreview = result.originalText.length > 50 
                ? result.originalText.substring(0, 50) + '...' 
                : result.originalText;
            console.log(`   Text: ${textPreview}`);
            console.log(`   Sentiment: ${result.sentiment.sentiment} (${(result.sentiment.overallConfidence * 100).toFixed(1)}%)`);
            console.log(`   Language: ${result.language}`);
            console.log(`   Key Phrases: ${result.keyPhrases.length}, Entities: ${result.entities.length}`);
        });
    }
}

/**
 * Main function demonstrating Azure AI Language text analysis capabilities.
 */
async function main() {
    console.log('🔍 Azure AI Language - Text Analysis and Sentiment Demo');
    console.log('='.repeat(60));
    
    try {
        // Initialize the application
        const app = new TextAnalysisApp();
        
        // Test connection
        const testResult = await app.analyzer.detectLanguage(['Hello world']);
        if (testResult.length > 0) {
            console.log('✅ Connected to Azure AI Language service successfully!');
        } else {
            console.log('❌ Failed to connect to Azure AI Language service');
            return;
        }
        
        // Run demonstrations
        await app.demonstrateSentimentAnalysis();
        await app.demonstrateEntityRecognition();
        await app.demonstrateKeyPhraseExtraction();
        await app.demonstrateLanguageDetection();
        await app.demonstrateComprehensiveAnalysis();
        await app.demonstrateBatchAnalysis();
        await app.demonstrateBusinessScenarios();
        
        // Ask if user wants interactive mode
        console.log('\n' + '='.repeat(50));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('Would you like to try interactive analysis mode? (y/n): ', (response) => {
            if (response.trim().toLowerCase() === 'y' || response.trim().toLowerCase() === 'yes') {
                rl.close();
                app.interactiveAnalysis();
            } else {
                rl.close();
                console.log('\n🎉 Demo completed successfully!');
                console.log('\nKey takeaways:');
                console.log('✅ Comprehensive sentiment analysis with opinion mining');
                console.log('✅ Multi-language support and detection');
                console.log('✅ Named entity recognition and key phrase extraction');
                console.log('✅ Batch processing for efficiency');
                console.log('✅ Real-world business scenario applications');
            }
        });
        
    } catch (error) {
        console.error(`❌ Error running demo: ${error.message}`);
        console.log('\nPlease check your environment variables:');
        console.log('- LANGUAGE_KEY');
        console.log('- LANGUAGE_ENDPOINT');
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { AzureTextAnalyzer, TextAnalysisApp }; 