#!/usr/bin/env node

/**
 * Azure AI Language Text Summarizer
 * Comprehensive Node.js implementation with extractive, abstractive, and conversation summarization
 */

const { TextAnalysisClient, AzureKeyCredential } = require("@azure/ai-language-text");
const axios = require('axios');
const readline = require('readline');
const fs = require('fs').promises;

// Configure logging
const logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    warn: (msg) => console.log(`[WARN] ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.log(`[ERROR] ${new Date().toISOString()} - ${msg}`)
};

/**
 * Data class for summarization results
 */
class SummaryResult {
    constructor(summaryType, summaryText, sentences = null, rankScores = null, processingTime = 0, characterCount = 0) {
        this.summaryType = summaryType;
        this.summaryText = summaryText;
        this.sentences = sentences;
        this.rankScores = rankScores;
        this.processingTime = processingTime;
        this.characterCount = characterCount;
    }
}

/**
 * Data class for conversation summarization results
 */
class ConversationSummary {
    constructor() {
        this.issue = "";
        this.resolution = "";
        this.recap = "";
        this.chapterTitles = null;
        this.narrativeSummaries = null;
    }
}

/**
 * Comprehensive Azure AI Language Text Summarizer
 */
class AzureTextSummarizer {
    constructor(endpoint = null, apiKey = null) {
        this.endpoint = endpoint || process.env.AZURE_LANGUAGE_ENDPOINT;
        this.apiKey = apiKey || process.env.AZURE_LANGUAGE_KEY;
        
        if (!this.endpoint || !this.apiKey) {
            throw new Error("Azure Language endpoint and API key are required");
        }
        
        // Initialize Azure Text Analytics client
        this.credential = new AzureKeyCredential(this.apiKey);
        this.client = new TextAnalysisClient(this.endpoint, this.credential);
        
        // Configuration
        this.maxRetries = 3;
        this.retryDelay = 1000; // milliseconds
        this.rateLimitDelay = 2000; // milliseconds
        
        // Statistics tracking
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalCharactersProcessed: 0,
            averageProcessingTime: 0.0
        };
        
        logger.info("Azure Text Summarizer initialized successfully");
    }

    /**
     * Perform extractive summarization
     * @param {string} text - Input text to summarize
     * @param {number} sentenceCount - Number of sentences to extract (1-20)
     * @param {string} sortBy - Sort order - "Rank" or "Offset"
     * @returns {Promise<SummaryResult>}
     */
    async extractiveSummarization(text, sentenceCount = 3, sortBy = "Rank") {
        const startTime = Date.now();
        
        try {
            // Validate inputs
            if (!text || text.trim().length === 0) {
                throw new Error("Input text cannot be empty");
            }
            
            if (sentenceCount < 1 || sentenceCount > 20) {
                throw new Error("Sentence count must be between 1 and 20");
            }
            
            // Prepare analysis actions
            const actions = [
                {
                    kind: "ExtractiveSummarization",
                    maxSentenceCount: sentenceCount,
                    sortBy: sortBy
                }
            ];
            
            // Process with retry logic
            for (let attempt = 0; attempt < this.maxRetries; attempt++) {
                try {
                    // Start analysis
                    const poller = await this.client.beginAnalyzeBatch(actions, [text], "en");
                    
                    // Wait for completion
                    const results = await poller.pollUntilDone();
                    
                    // Extract results
                    for await (const actionResult of results) {
                        if (actionResult.kind !== "ExtractiveSummarization") {
                            throw new Error(`Expected extractive summarization results but got: ${actionResult.kind}`);
                        }
                        
                        if (actionResult.error) {
                            throw new Error(`Analysis error: ${actionResult.error.message}`);
                        }
                        
                        for (const result of actionResult.results) {
                            if (result.error) {
                                throw new Error(`Document error: ${result.error.message}`);
                            }
                            
                            // Build result
                            const sentences = result.sentences.map(s => s.text);
                            const rankScores = result.sentences.map(s => s.rankScore);
                            const summaryText = sentences.join(" ");
                            
                            const processingTime = (Date.now() - startTime) / 1000;
                            
                            // Update statistics
                            this._updateStats(text.length, processingTime, true);
                            
                            return new SummaryResult(
                                "extractive",
                                summaryText,
                                sentences,
                                rankScores,
                                processingTime,
                                text.length
                            );
                        }
                    }
                    
                    break;
                    
                } catch (error) {
                    if (error.statusCode === 429) { // Rate limit
                        logger.warn(`Rate limit hit, attempt ${attempt + 1}`);
                        await this._sleep(this.rateLimitDelay * Math.pow(2, attempt));
                    } else if (attempt === this.maxRetries - 1) {
                        throw error;
                    } else {
                        logger.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
                        await this._sleep(this.retryDelay * Math.pow(2, attempt));
                    }
                }
            }
            
        } catch (error) {
            const processingTime = (Date.now() - startTime) / 1000;
            this._updateStats(text.length, processingTime, false);
            logger.error(`Extractive summarization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Perform abstractive summarization
     * @param {string} text - Input text to summarize
     * @param {string} summaryLength - Length of summary - "short", "medium", "long"
     * @returns {Promise<SummaryResult>}
     */
    async abstractiveSummarization(text, summaryLength = "medium") {
        const startTime = Date.now();
        
        try {
            // Validate inputs
            if (!text || text.trim().length === 0) {
                throw new Error("Input text cannot be empty");
            }
            
            if (!["short", "medium", "long"].includes(summaryLength)) {
                throw new Error("Summary length must be 'short', 'medium', or 'long'");
            }
            
            // Prepare analysis actions
            const actions = [
                {
                    kind: "AbstractiveSummarization",
                    summaryLength: summaryLength
                }
            ];
            
            // Process with retry logic
            for (let attempt = 0; attempt < this.maxRetries; attempt++) {
                try {
                    // Start analysis
                    const poller = await this.client.beginAnalyzeBatch(actions, [text], "en");
                    
                    // Wait for completion
                    const results = await poller.pollUntilDone();
                    
                    // Extract results
                    for await (const actionResult of results) {
                        if (actionResult.kind !== "AbstractiveSummarization") {
                            throw new Error(`Expected abstractive summarization results but got: ${actionResult.kind}`);
                        }
                        
                        if (actionResult.error) {
                            throw new Error(`Analysis error: ${actionResult.error.message}`);
                        }
                        
                        for (const result of actionResult.results) {
                            if (result.error) {
                                throw new Error(`Document error: ${result.error.message}`);
                            }
                            
                            // Build result
                            const summaries = result.summaries.map(s => s.text);
                            const summaryText = summaries.join(" ");
                            
                            const processingTime = (Date.now() - startTime) / 1000;
                            
                            // Update statistics
                            this._updateStats(text.length, processingTime, true);
                            
                            return new SummaryResult(
                                "abstractive",
                                summaryText,
                                null,
                                null,
                                processingTime,
                                text.length
                            );
                        }
                    }
                    
                    break;
                    
                } catch (error) {
                    if (error.statusCode === 429) { // Rate limit
                        logger.warn(`Rate limit hit, attempt ${attempt + 1}`);
                        await this._sleep(this.rateLimitDelay * Math.pow(2, attempt));
                    } else if (attempt === this.maxRetries - 1) {
                        throw error;
                    } else {
                        logger.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
                        await this._sleep(this.retryDelay * Math.pow(2, attempt));
                    }
                }
            }
            
        } catch (error) {
            const processingTime = (Date.now() - startTime) / 1000;
            this._updateStats(text.length, processingTime, false);
            logger.error(`Abstractive summarization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Perform conversation summarization
     * @param {Array} conversationItems - List of conversation items with 'text', 'role', 'participantId'
     * @param {Array} summaryAspects - List of aspects to summarize
     * @returns {Promise<ConversationSummary>}
     */
    async conversationSummarization(conversationItems, summaryAspects = null) {
        const startTime = Date.now();
        
        try {
            if (!conversationItems || conversationItems.length === 0) {
                throw new Error("Conversation items cannot be empty");
            }
            
            if (summaryAspects === null) {
                summaryAspects = ["issue", "resolution", "recap"];
            }
            
            // Prepare conversation data
            const conversationData = {
                displayName: "Conversation Summarization",
                analysisInput: {
                    conversations: [{
                        conversationItems: conversationItems.map((item, i) => ({
                            text: item.text,
                            id: (i + 1).toString(),
                            role: item.role || "Customer",
                            participantId: item.participantId || `Participant_${i + 1}`
                        })),
                        modality: "text",
                        id: "conversation1",
                        language: "en"
                    }]
                },
                tasks: summaryAspects.map(aspect => ({
                    taskName: `${aspect}_task`,
                    kind: "ConversationalSummarizationTask",
                    parameters: { summaryAspects: [aspect] }
                }))
            };
            
            // Configure request headers
            const headers = {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": this.apiKey
            };
            
            const url = `${this.endpoint}/language/analyze-conversations/jobs?api-version=2023-04-01`;
            
            // Process with retry logic
            for (let attempt = 0; attempt < this.maxRetries; attempt++) {
                try {
                    // Submit job
                    const response = await axios.post(url, conversationData, { headers });
                    
                    // Get operation location
                    const operationLocation = response.headers["operation-location"];
                    if (!operationLocation) {
                        throw new Error("No operation location in response");
                    }
                    
                    // Poll for results
                    while (true) {
                        const resultResponse = await axios.get(operationLocation, { headers });
                        const resultData = resultResponse.data;
                        
                        if (resultData.status === "succeeded") {
                            // Parse results
                            const conversationSummary = new ConversationSummary();
                            
                            for (const task of resultData.tasks.items) {
                                if (task.status === "succeeded") {
                                    const conversations = task.results.conversations;
                                    for (const conv of conversations) {
                                        for (const summary of conv.summaries) {
                                            const aspect = summary.aspect;
                                            const text = summary.text;
                                            
                                            switch (aspect) {
                                                case "issue":
                                                    conversationSummary.issue = text;
                                                    break;
                                                case "resolution":
                                                    conversationSummary.resolution = text;
                                                    break;
                                                case "recap":
                                                    conversationSummary.recap = text;
                                                    break;
                                                case "chapterTitle":
                                                    if (!conversationSummary.chapterTitles) {
                                                        conversationSummary.chapterTitles = [];
                                                    }
                                                    conversationSummary.chapterTitles.push(text);
                                                    break;
                                                case "narrative":
                                                    if (!conversationSummary.narrativeSummaries) {
                                                        conversationSummary.narrativeSummaries = [];
                                                    }
                                                    conversationSummary.narrativeSummaries.push(text);
                                                    break;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            const processingTime = (Date.now() - startTime) / 1000;
                            const totalChars = conversationItems.reduce((sum, item) => sum + item.text.length, 0);
                            this._updateStats(totalChars, processingTime, true);
                            
                            return conversationSummary;
                            
                        } else if (resultData.status === "failed") {
                            throw new Error("Conversation analysis failed");
                        }
                        
                        await this._sleep(2000); // Wait before polling again
                    }
                    
                } catch (error) {
                    if (error.response && error.response.status === 429) { // Rate limit
                        logger.warn(`Rate limit hit, attempt ${attempt + 1}`);
                        await this._sleep(this.rateLimitDelay * Math.pow(2, attempt));
                    } else if (attempt === this.maxRetries - 1) {
                        throw error;
                    } else {
                        logger.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
                        await this._sleep(this.retryDelay * Math.pow(2, attempt));
                    }
                }
            }
            
        } catch (error) {
            const processingTime = (Date.now() - startTime) / 1000;
            const totalChars = conversationItems.reduce((sum, item) => sum + item.text.length, 0);
            this._updateStats(totalChars, processingTime, false);
            logger.error(`Conversation summarization failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Process multiple documents in batch
     * @param {Array} documents - List of text documents
     * @param {string} summarizationType - "extractive" or "abstractive"
     * @param {Object} options - Additional parameters for summarization
     * @returns {Promise<Array<SummaryResult>>}
     */
    async batchSummarization(documents, summarizationType = "extractive", options = {}) {
        const results = [];
        
        // Process documents with concurrency control
        const concurrencyLimit = 5;
        const chunks = [];
        
        for (let i = 0; i < documents.length; i += concurrencyLimit) {
            chunks.push(documents.slice(i, i + concurrencyLimit));
        }
        
        for (const chunk of chunks) {
            const promises = chunk.map(async (doc) => {
                try {
                    if (summarizationType === "extractive") {
                        return await this.extractiveSummarization(doc, options.sentenceCount, options.sortBy);
                    } else {
                        return await this.abstractiveSummarization(doc, options.summaryLength);
                    }
                } catch (error) {
                    logger.error(`Failed to process document: ${error.message}`);
                    return null;
                }
            });
            
            const chunkResults = await Promise.all(promises);
            results.push(...chunkResults);
        }
        
        // Filter out failed results
        const successfulResults = results.filter(r => r !== null);
        
        logger.info(`Batch processing completed: ${successfulResults.length}/${documents.length} successful`);
        
        return successfulResults;
    }

    /**
     * Update processing statistics
     * @param {number} characterCount 
     * @param {number} processingTime 
     * @param {boolean} success 
     */
    _updateStats(characterCount, processingTime, success) {
        this.stats.totalRequests += 1;
        this.stats.totalCharactersProcessed += characterCount;
        
        if (success) {
            this.stats.successfulRequests += 1;
        } else {
            this.stats.failedRequests += 1;
        }
        
        // Update average processing time
        const totalTime = this.stats.averageProcessingTime * (this.stats.totalRequests - 1);
        this.stats.averageProcessingTime = (totalTime + processingTime) / this.stats.totalRequests;
    }

    /**
     * Get processing statistics
     * @returns {Object}
     */
    getStatistics() {
        const successRate = this.stats.totalRequests > 0 
            ? (this.stats.successfulRequests / this.stats.totalRequests) * 100 
            : 0;
        
        return {
            ...this.stats,
            successRatePercent: Math.round(successRate * 100) / 100,
            estimatedCostUsd: this._estimateCost()
        };
    }

    /**
     * Estimate processing cost based on character usage
     * @returns {number}
     */
    _estimateCost() {
        // Approximate pricing: $2 per 1M characters for standard tier
        const textRecords = this.stats.totalCharactersProcessed / 1000;
        const estimatedCost = textRecords * 0.002; // $2 per 1000 text records
        return Math.round(estimatedCost * 10000) / 10000;
    }

    /**
     * Save summary processing history
     * @param {string} filename 
     */
    async saveSummaryHistory(filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `summary_history_${timestamp}.json`;
        }
        
        const historyData = {
            timestamp: new Date().toISOString(),
            statistics: this.getStatistics(),
            configuration: {
                endpoint: this.endpoint,
                maxRetries: this.maxRetries,
                retryDelay: this.retryDelay,
                rateLimitDelay: this.rateLimitDelay
            }
        };
        
        await fs.writeFile(filename, JSON.stringify(historyData, null, 2));
        logger.info(`Summary history saved to ${filename}`);
    }

    /**
     * Sleep utility function
     * @param {number} ms 
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Interactive command-line interface for text summarization
 */
class InteractiveSummarizer {
    constructor() {
        this.summarizer = new AzureTextSummarizer();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.running = true;
    }

    /**
     * Run the interactive summarizer
     */
    async run() {
        console.log("\n🤖 Azure AI Text Summarizer");
        console.log("=".repeat(50));
        console.log("Choose an option:");
        console.log("1. Extractive Summarization");
        console.log("2. Abstractive Summarization");
        console.log("3. Conversation Summarization");
        console.log("4. Batch Processing");
        console.log("5. View Statistics");
        console.log("6. Exit");
        
        while (this.running) {
            try {
                const choice = await this._question("\nEnter your choice (1-6): ");
                
                switch (choice.trim()) {
                    case "1":
                        await this._extractiveMode();
                        break;
                    case "2":
                        await this._abstractiveMode();
                        break;
                    case "3":
                        await this._conversationMode();
                        break;
                    case "4":
                        await this._batchMode();
                        break;
                    case "5":
                        this._showStatistics();
                        break;
                    case "6":
                        this.running = false;
                        console.log("Thank you for using Azure AI Text Summarizer!");
                        break;
                    default:
                        console.log("Invalid choice. Please try again.");
                }
                
            } catch (error) {
                console.error(`Error: ${error.message}`);
            }
        }
        
        this.rl.close();
    }

    /**
     * Interactive extractive summarization
     */
    async _extractiveMode() {
        console.log("\n📄 Extractive Summarization");
        console.log("-".repeat(30));
        
        const text = await this._question("Enter text to summarize: ");
        if (!text.trim()) {
            console.log("Text cannot be empty.");
            return;
        }
        
        try {
            const sentenceCountInput = await this._question("Number of sentences (1-20, default 3): ");
            const sentenceCount = parseInt(sentenceCountInput) || 3;
            
            const sortBy = await this._question("Sort by (Rank/Offset, default Rank): ") || "Rank";
            
            console.log("\nProcessing...");
            const result = await this.summarizer.extractiveSummarization(text, sentenceCount, sortBy);
            
            console.log("\n✅ Extractive Summary:");
            console.log(`Summary: ${result.summaryText}`);
            console.log(`Processing time: ${result.processingTime.toFixed(2)}s`);
            console.log(`Character count: ${result.characterCount}`);
            
            if (result.sentences) {
                console.log("\nExtracted sentences:");
                result.sentences.forEach((sentence, i) => {
                    const score = result.rankScores[i];
                    console.log(`${i + 1}. ${sentence} (Score: ${score.toFixed(3)})`);
                });
            }
            
        } catch (error) {
            console.error(`Summarization failed: ${error.message}`);
        }
    }

    /**
     * Interactive abstractive summarization
     */
    async _abstractiveMode() {
        console.log("\n📝 Abstractive Summarization");
        console.log("-".repeat(30));
        
        const text = await this._question("Enter text to summarize: ");
        if (!text.trim()) {
            console.log("Text cannot be empty.");
            return;
        }
        
        try {
            const length = await this._question("Summary length (short/medium/long, default medium): ") || "medium";
            
            console.log("\nProcessing...");
            const result = await this.summarizer.abstractiveSummarization(text, length);
            
            console.log("\n✅ Abstractive Summary:");
            console.log(`Summary: ${result.summaryText}`);
            console.log(`Processing time: ${result.processingTime.toFixed(2)}s`);
            console.log(`Character count: ${result.characterCount}`);
            
        } catch (error) {
            console.error(`Summarization failed: ${error.message}`);
        }
    }

    /**
     * Interactive conversation summarization
     */
    async _conversationMode() {
        console.log("\n💬 Conversation Summarization");
        console.log("-".repeat(30));
        
        const conversationItems = [];
        
        console.log("Enter conversation (type 'done' when finished):");
        while (true) {
            const speaker = await this._question("Speaker (Agent/Customer): ");
            if (speaker.toLowerCase() === 'done') {
                break;
            }
            
            const text = await this._question("Text: ");
            if (!text.trim()) {
                continue;
            }
            
            conversationItems.push({
                text: text,
                role: speaker,
                participantId: `${speaker}_1`
            });
        }
        
        if (conversationItems.length === 0) {
            console.log("No conversation items entered.");
            return;
        }
        
        try {
            console.log("\nProcessing...");
            const result = await this.summarizer.conversationSummarization(conversationItems);
            
            console.log("\n✅ Conversation Summary:");
            if (result.issue) {
                console.log(`Issue: ${result.issue}`);
            }
            if (result.resolution) {
                console.log(`Resolution: ${result.resolution}`);
            }
            if (result.recap) {
                console.log(`Recap: ${result.recap}`);
            }
            
        } catch (error) {
            console.error(`Conversation summarization failed: ${error.message}`);
        }
    }

    /**
     * Interactive batch processing
     */
    async _batchMode() {
        console.log("\n📚 Batch Processing");
        console.log("-".repeat(30));
        
        const documents = [];
        console.log("Enter documents to summarize (type 'done' when finished):");
        
        let i = 1;
        while (true) {
            const text = await this._question(`Document ${i}: `);
            if (text.toLowerCase() === 'done') {
                break;
            }
            if (text.trim()) {
                documents.push(text);
                i++;
            }
        }
        
        if (documents.length === 0) {
            console.log("No documents entered.");
            return;
        }
        
        try {
            const summarizationType = await this._question("Summarization type (extractive/abstractive, default extractive): ") || "extractive";
            
            console.log(`\nProcessing ${documents.length} documents...`);
            const results = await this.summarizer.batchSummarization(documents, summarizationType);
            
            console.log("\n✅ Batch Processing Results:");
            results.forEach((result, i) => {
                if (result) {
                    console.log(`\nDocument ${i + 1}:`);
                    console.log(`Summary: ${result.summaryText.substring(0, 200)}...`);
                    console.log(`Processing time: ${result.processingTime.toFixed(2)}s`);
                }
            });
            
        } catch (error) {
            console.error(`Batch processing failed: ${error.message}`);
        }
    }

    /**
     * Show processing statistics
     */
    _showStatistics() {
        console.log("\n📊 Processing Statistics");
        console.log("-".repeat(30));
        
        const stats = this.summarizer.getStatistics();
        
        console.log(`Total requests: ${stats.totalRequests}`);
        console.log(`Successful requests: ${stats.successfulRequests}`);
        console.log(`Failed requests: ${stats.failedRequests}`);
        console.log(`Success rate: ${stats.successRatePercent}%`);
        console.log(`Total characters processed: ${stats.totalCharactersProcessed.toLocaleString()}`);
        console.log(`Average processing time: ${stats.averageProcessingTime.toFixed(2)}s`);
        console.log(`Estimated cost: $${stats.estimatedCostUsd}`);
    }

    /**
     * Utility function to prompt user input
     * @param {string} question 
     * @returns {Promise<string>}
     */
    _question(question) {
        return new Promise(resolve => {
            this.rl.question(question, resolve);
        });
    }
}

/**
 * Main function to run the interactive summarizer
 */
async function main() {
    console.log("Initializing Azure AI Text Summarizer...");
    
    try {
        // Check environment variables
        if (!process.env.AZURE_LANGUAGE_ENDPOINT || !process.env.AZURE_LANGUAGE_KEY) {
            console.error("Error: Please set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY environment variables");
            return;
        }
        
        // Run interactive summarizer
        const interactive = new InteractiveSummarizer();
        await interactive.run();
        
    } catch (error) {
        console.error(`Failed to initialize: ${error.message}`);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    AzureTextSummarizer,
    SummaryResult,
    ConversationSummary,
    InteractiveSummarizer
}; 