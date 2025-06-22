#!/usr/bin/env node
/**
 * Azure AI Setup Test Script (JavaScript/Node.js)
 * ================================================
 * 
 * This script helps you test your Azure AI services setup and demonstrates
 * basic API calls to various Azure AI services using JavaScript/Node.js.
 * 
 * Prerequisites:
 * - Node.js 14+ installed
 * - Azure account with AI services created
 * - API keys and endpoints configured
 * - Required packages: npm install @azure/ai-text-analytics @azure/cognitiveservices-computervision @azure/openai dotenv
 * 
 * Usage:
 * 1. Copy your API keys and endpoints to a .env file
 * 2. Run: node setup-test.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import Azure AI SDKs
let TextAnalyticsClient, AzureKeyCredential, ComputerVisionClient, ApiKeyCredentials, OpenAIClient;

try {
    ({ TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics'));
    ({ ComputerVisionClient, ApiKeyCredentials } = require('@azure/cognitiveservices-computervision'));
    ({ OpenAIClient } = require('@azure/openai'));
} catch (error) {
    console.log('❌ Missing required packages. Please install them:');
    console.log('npm install @azure/ai-text-analytics @azure/cognitiveservices-computervision @azure/openai dotenv');
    console.log(`Error: ${error.message}`);
    process.exit(1);
}

class AzureAITester {
    constructor() {
        this.testResults = {};
        this.loadCredentials();
    }

    loadCredentials() {
        console.log('🔑 Loading credentials from environment...');
        
        // Language Service (Text Analytics)
        this.languageEndpoint = process.env.AZURE_LANGUAGE_ENDPOINT;
        this.languageKey = process.env.AZURE_LANGUAGE_KEY;
        
        // Computer Vision
        this.visionEndpoint = process.env.AZURE_VISION_ENDPOINT;
        this.visionKey = process.env.AZURE_VISION_KEY;
        
        // Azure OpenAI
        this.openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        this.openaiKey = process.env.AZURE_OPENAI_KEY;
        this.openaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';
        
        // Check which services are configured
        this.servicesConfigured = {
            'Language Service': !!(this.languageEndpoint && this.languageKey),
            'Computer Vision': !!(this.visionEndpoint && this.visionKey),
            'Azure OpenAI': !!(this.openaiEndpoint && this.openaiKey)
        };
        
        console.log('📋 Service Configuration Status:');
        Object.entries(this.servicesConfigured).forEach(([service, configured]) => {
            const status = configured ? '✅ Configured' : '❌ Not configured';
            console.log(`   ${service}: ${status}`);
        });
        console.log();
    }

    async testLanguageService() {
        if (!this.servicesConfigured['Language Service']) {
            return { status: 'skipped', reason: 'Not configured' };
        }

        try {
            console.log('🧠 Testing Language Service...');
            
            // Create client
            const credential = new AzureKeyCredential(this.languageKey);
            const client = new TextAnalyticsClient(this.languageEndpoint, credential);
            
            // Test data
            const testDocuments = [
                'I absolutely love using Azure AI services! They make development so much easier.',
                'The weather today is okay, nothing special.',
                'I\'m really frustrated with this slow internet connection.'
            ];
            
            console.log('   📊 Analyzing sentiment...');
            const sentimentResults = await client.analyzeSentiment(testDocuments);
            
            console.log('   🔍 Extracting key phrases...');
            const keyPhraseResults = await client.extractKeyPhrases(testDocuments);
            
            console.log('   🌐 Detecting language...');
            const languageResults = await client.detectLanguage([
                'Hello, how are you today?',
                'Bonjour, comment allez-vous?',
                'Hola, ¿cómo estás?'
            ]);
            
            // Compile results
            const results = {
                status: 'success',
                sentimentAnalysis: testDocuments.map((doc, index) => ({
                    text: doc.substring(0, 50) + '...',
                    sentiment: sentimentResults[index].sentiment,
                    confidence: {
                        positive: Math.round(sentimentResults[index].confidenceScores.positive * 100) / 100,
                        neutral: Math.round(sentimentResults[index].confidenceScores.neutral * 100) / 100,
                        negative: Math.round(sentimentResults[index].confidenceScores.negative * 100) / 100
                    }
                })),
                keyPhrases: testDocuments.map((doc, index) => ({
                    text: doc.substring(0, 50) + '...',
                    phrases: keyPhraseResults[index].keyPhrases
                })),
                languageDetection: languageResults.map(result => ({
                    text: result.primaryLanguage.name,
                    confidence: Math.round(result.primaryLanguage.confidenceScore * 100) / 100
                }))
            };
            
            console.log('   ✅ Language Service test completed successfully!');
            return results;
            
        } catch (error) {
            const errorMsg = `Language Service test failed: ${error.message}`;
            console.log(`   ❌ ${errorMsg}`);
            return { status: 'error', error: errorMsg };
        }
    }

    async testComputerVision() {
        if (!this.servicesConfigured['Computer Vision']) {
            return { status: 'skipped', reason: 'Not configured' };
        }

        try {
            console.log('👁️ Testing Computer Vision...');
            
            // Create client
            const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': this.visionKey } });
            const client = new ComputerVisionClient(credentials, this.visionEndpoint);
            
            // Test with a sample image URL
            const testImageUrl = 'https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/master/articles/cognitive-services/Computer-vision/Images/faces.jpg';
            
            console.log('   🖼️ Analyzing image content...');
            const analysis = await client.analyzeImage(testImageUrl, {
                visualFeatures: ['Categories', 'Description', 'Tags', 'Objects', 'Faces']
            });
            
            console.log('   📝 Reading text from image...');
            // OCR test with a different image
            const ocrImageUrl = 'https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/master/articles/cognitive-services/Computer-vision/Images/readsample.jpg';
            const readOperation = await client.read(ocrImageUrl);
            const operationId = readOperation.operationLocation.split('/').pop();
            
            // Wait for OCR to complete
            let readResult;
            do {
                await new Promise(resolve => setTimeout(resolve, 1000));
                readResult = await client.getReadResult(operationId);
            } while (readResult.status === 'running');
            
            // Extract text
            const extractedText = [];
            if (readResult.status === 'succeeded') {
                readResult.analyzeResult.readResults.forEach(result => {
                    result.lines.forEach(line => {
                        extractedText.push(line.text);
                    });
                });
            }
            
            const results = {
                status: 'success',
                imageAnalysis: {
                    description: analysis.description.captions.length > 0 ? analysis.description.captions[0].text : 'No description',
                    tags: analysis.tags.slice(0, 5).map(tag => tag.name),
                    objects: analysis.objects.slice(0, 3).map(obj => obj.object),
                    facesDetected: analysis.faces.length,
                    categories: analysis.categories.slice(0, 3).map(cat => cat.name)
                },
                textExtraction: {
                    linesDetected: extractedText.length,
                    sampleText: extractedText.slice(0, 3)
                }
            };
            
            console.log('   ✅ Computer Vision test completed successfully!');
            return results;
            
        } catch (error) {
            const errorMsg = `Computer Vision test failed: ${error.message}`;
            console.log(`   ❌ ${errorMsg}`);
            return { status: 'error', error: errorMsg };
        }
    }

    async testAzureOpenAI() {
        if (!this.servicesConfigured['Azure OpenAI']) {
            return { status: 'skipped', reason: 'Not configured' };
        }

        try {
            console.log('🤖 Testing Azure OpenAI...');
            
            // Create client
            const client = new OpenAIClient(
                this.openaiEndpoint,
                new AzureKeyCredential(this.openaiKey)
            );
            
            console.log('   💬 Testing chat completion...');
            const chatResponse = await client.getChatCompletions(
                this.openaiDeployment,
                [
                    { role: 'system', content: 'You are a helpful AI assistant. Respond concisely.' },
                    { role: 'user', content: 'What is Azure AI in one sentence?' }
                ],
                {
                    maxTokens: 100,
                    temperature: 0.7
                }
            );
            
            console.log('   📊 Testing embeddings...');
            let embeddingSuccess = false;
            let embeddingDimensions = 0;
            
            try {
                const embeddingResponse = await client.getEmbeddings(
                    'text-embedding-ada-002',
                    ['Azure AI makes artificial intelligence accessible to developers.']
                );
                embeddingSuccess = true;
                embeddingDimensions = embeddingResponse.data[0].embedding.length;
            } catch (embeddingError) {
                // Embeddings might not be available, continue without failing
                embeddingSuccess = false;
            }
            
            const results = {
                status: 'success',
                chatCompletion: {
                    prompt: 'What is Azure AI in one sentence?',
                    response: chatResponse.choices[0].message.content,
                    tokensUsed: chatResponse.usage.totalTokens
                },
                embeddings: {
                    available: embeddingSuccess,
                    dimensions: embeddingSuccess ? embeddingDimensions : 'N/A'
                }
            };
            
            console.log('   ✅ Azure OpenAI test completed successfully!');
            return results;
            
        } catch (error) {
            const errorMsg = `Azure OpenAI test failed: ${error.message}`;
            console.log(`   ❌ ${errorMsg}`);
            return { status: 'error', error: errorMsg };
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Azure AI Services Test Suite');
        console.log('='.repeat(50));
        console.log();
        
        // Run tests
        const tests = [
            ['Language Service', () => this.testLanguageService()],
            ['Computer Vision', () => this.testComputerVision()],
            ['Azure OpenAI', () => this.testAzureOpenAI()]
        ];
        
        for (const [serviceName, testFunc] of tests) {
            this.testResults[serviceName] = await testFunc();
            console.log();
        }
        
        // Display summary
        this.displaySummary();
        
        // Save results to file
        this.saveResults();
    }

    displaySummary() {
        console.log('📊 Test Summary');
        console.log('='.repeat(50));
        
        let successfulTests = 0;
        let totalConfigured = 0;
        
        Object.entries(this.testResults).forEach(([service, result]) => {
            if (result.status !== 'skipped') {
                totalConfigured++;
                if (result.status === 'success') {
                    successfulTests++;
                    console.log(`✅ ${service}: SUCCESS`);
                } else {
                    console.log(`❌ ${service}: FAILED - ${result.error || 'Unknown error'}`);
                }
            } else {
                console.log(`⚪ ${service}: SKIPPED - ${result.reason || 'Not configured'}`);
            }
        });
        
        console.log();
        if (totalConfigured > 0) {
            const successRate = (successfulTests / totalConfigured) * 100;
            console.log(`🎯 Success Rate: ${successfulTests}/${totalConfigured} (${successRate.toFixed(1)}%)`);
        } else {
            console.log('⚠️ No services were configured for testing.');
        }
        
        console.log();
        console.log('💡 Next Steps:');
        if (successfulTests === totalConfigured && totalConfigured > 0) {
            console.log('   🎉 All configured services are working perfectly!');
            console.log('   📚 You\'re ready to proceed with the Azure AI course.');
        } else {
            console.log('   🔧 Some services need attention. Check the error messages above.');
            console.log('   📖 Review the setup instructions in Lesson 2.');
        }
    }

    saveResults() {
        try {
            fs.writeFileSync('azure-ai-test-results.json', JSON.stringify(this.testResults, null, 2));
            console.log('💾 Test results saved to \'azure-ai-test-results.json\'');
        } catch (error) {
            console.log(`⚠️ Could not save results: ${error.message}`);
        }
    }
}

function createEnvTemplate() {
    const envTemplate = `# Azure AI Services Configuration
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
# 2. Save this file as .env in the same directory as setup-test.js
# 3. Run: node setup-test.js
`;
    
    if (!fs.existsSync('.env')) {
        fs.writeFileSync('.env.template', envTemplate);
        console.log('📄 Created .env.template file with configuration instructions.');
        return true;
    }
    return false;
}

async function main() {
    console.log('🔧 Azure AI Services Setup Tester (JavaScript)');
    console.log('='.repeat(50));
    console.log();
    
    // Check if .env file exists
    if (!fs.existsSync('.env')) {
        console.log('⚠️ No .env file found!');
        createEnvTemplate();
        console.log();
        console.log('📋 To get started:');
        console.log('1. Copy .env.template to .env');
        console.log('2. Fill in your Azure AI service credentials');
        console.log('3. Run this script again');
        console.log();
        console.log('💡 Need help getting credentials? Check Lesson 2 of the course!');
        return;
    }
    
    // Run tests
    const tester = new AzureAITester();
    await tester.runAllTests();
}

// Run the main function
if (require.main === module) {
    main().catch(error => {
        console.error('❌ An error occurred:', error.message);
        process.exit(1);
    });
} 