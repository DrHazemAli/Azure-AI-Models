#!/usr/bin/env node
/**
 * Your First AI Project - Text Analyzer
 * =====================================
 * 
 * This application demonstrates how to use Azure AI Language services to:
 * - Detect the language of input text
 * - Analyze sentiment (positive, negative, neutral)
 * - Extract key phrases and important information
 * 
 * Prerequisites:
 * - Azure AI Language service created
 * - Environment variables set:
 *   - AZURE_LANGUAGE_ENDPOINT
 *   - AZURE_LANGUAGE_KEY
 * 
 * Usage:
 *     node first-ai-project.js
 */

const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const readline = require('readline');

function createClient() {
    const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT;
    const key = process.env.AZURE_LANGUAGE_KEY;
    
    if (!endpoint || !key) {
        console.error("❌ Error: Missing environment variables");
        console.error("Please set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY");
        console.error("\nExample:");
        console.error("export AZURE_LANGUAGE_ENDPOINT='https://your-resource.cognitiveservices.azure.com/'");
        console.error("export AZURE_LANGUAGE_KEY='your-api-key-here'");
        process.exit(1);
    }
    
    try {
        return new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));
    } catch (error) {
        console.error(`❌ Error creating client: ${error.message}`);
        process.exit(1);
    }
}

async function analyzeText(client, text) {
    if (!text || !text.trim()) {
        console.log("⚠️  Warning: Empty text provided");
        return;
    }
    
    // Truncate text if too long
    if (text.length > 5000) {
        text = text.substring(0, 5000);
        console.log("⚠️  Warning: Text truncated to 5000 characters");
    }
    
    const displayText = text.length > 50 ? text.substring(0, 50) + '...' : text;
    console.log(`\nAnalyzing: '${displayText}'`);
    console.log("-".repeat(60));
    
    try {
        // Language Detection
        console.log("🔍 Detecting language...");
        const languageResults = await client.detectLanguage([text]);
        const language = languageResults[0].primaryLanguage;
        console.log(`🌍 Language: ${language.name} (Confidence: ${language.confidenceScore.toFixed(2)})`);
        
        // Sentiment Analysis
        console.log("\n😊 Analyzing sentiment...");
        const sentimentResults = await client.analyzeSentiment([text]);
        const sentiment = sentimentResults[0];
        
        // Choose appropriate emoji based on sentiment
        const sentimentEmojis = {
            'positive': '😊',
            'negative': '😞',
            'neutral': '😐'
        };
        const emoji = sentimentEmojis[sentiment.sentiment] || '🤔';
        
        console.log(`${emoji} Overall Sentiment: ${sentiment.sentiment.toUpperCase()}`);
        console.log(`   📈 Positive: ${sentiment.confidenceScores.positive.toFixed(2)}`);
        console.log(`   ⚖️  Neutral:  ${sentiment.confidenceScores.neutral.toFixed(2)}`);
        console.log(`   📉 Negative: ${sentiment.confidenceScores.negative.toFixed(2)}`);
        
        // Key Phrase Extraction
        console.log("\n🔑 Extracting key phrases...");
        const keyPhraseResults = await client.extractKeyPhrases([text]);
        const keyPhrases = keyPhraseResults[0].keyPhrases;
        
        if (keyPhrases.length > 0) {
            console.log(`🎯 Key Phrases: ${keyPhrases.join(', ')}`);
        } else {
            console.log("🎯 No key phrases detected");
        }
        
        console.log("=".repeat(60));
        
    } catch (error) {
        if (error.statusCode === 429) {
            console.log("⏰ Rate limit exceeded. Please wait a moment and try again.");
        } else if (error.statusCode === 401) {
            console.log("🔐 Authentication failed. Please check your API key and endpoint.");
        } else {
            console.log(`❌ API Error: ${error.message}`);
        }
    }
}

async function runSampleAnalysis(client) {
    console.log("🚀 Running sample text analysis...");
    
    const sampleTexts = [
        "I absolutely love using Azure AI services! They make building intelligent applications incredibly easy and fun.",
        "The weather today is absolutely terrible and I'm feeling quite frustrated about the cancelled outdoor event.",
        "Microsoft Azure provides comprehensive cloud computing services including artificial intelligence, machine learning, and data analytics for businesses of all sizes.",
        "¡Hola! Me encanta la inteligencia artificial y todas sus aplicaciones innovadoras en el mundo moderno.",
        "こんにちは！AIサービスは本当に素晴らしいテクノロジーだと思います。",
        "This product is okay, nothing special but not bad either. It does what it's supposed to do."
    ];
    
    for (let i = 0; i < sampleTexts.length; i++) {
        console.log(`\n📝 Sample ${i + 1}/${sampleTexts.length}:`);
        await analyzeText(client, sampleTexts[i]);
        
        // Add small delay between requests to avoid rate limiting
        if (i < sampleTexts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function interactiveMode(client) {
    console.log("\n🎯 Interactive Mode - Try your own text!");
    console.log("Enter text to analyze, or type 'quit' to exit.");
    console.log("Tip: Try different languages, sentiments, and topics!");
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const askForInput = () => {
        rl.question("\n💬 Enter text: ", async (input) => {
            const userInput = input.trim();
            
            if (['quit', 'exit', 'q'].includes(userInput.toLowerCase())) {
                console.log("👋 Thanks for trying your first AI project!");
                rl.close();
                return;
            }
            
            if (!userInput) {
                console.log("⚠️  Please enter some text to analyze.");
                askForInput();
                return;
            }
            
            try {
                await analyzeText(client, userInput);
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
            
            askForInput();
        });
    };
    
    askForInput();
}

async function main() {
    console.log("=".repeat(60));
    console.log("🚀 Welcome to Your First AI Project!");
    console.log("   Text Analyzer using Azure AI Language Services");
    console.log("=".repeat(60));
    console.log("\nThis application will demonstrate:");
    console.log("✨ Language detection");
    console.log("✨ Sentiment analysis");
    console.log("✨ Key phrase extraction");
    console.log();
    
    try {
        // Create the client
        console.log("🔧 Initializing Azure AI client...");
        const client = createClient();
        console.log("✅ Client created successfully!");
        
        // Run sample analysis
        await runSampleAnalysis(client);
        
        // Interactive mode
        await interactiveMode(client);
        
    } catch (error) {
        console.error(`❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log("\n\n👋 Program interrupted by user.");
    process.exit(0);
});

// Run the application
main().catch(error => {
    console.error(`❌ Unhandled error: ${error.message}`);
    process.exit(1);
}); 