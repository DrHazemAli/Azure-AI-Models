#!/usr/bin/env node

/**
 * Azure OpenAI Chat Completions Example
 * =====================================
 * 
 * This script demonstrates how to build conversational AI applications using
 * Azure OpenAI Service's Chat Completions API. It includes both streaming and
 * non-streaming implementations with conversation memory.
 * 
 * Features:
 * - Non-streaming chat completions
 * - Streaming chat completions with real-time display
 * - Conversation memory management
 * - Configurable system prompts
 * - Comprehensive error handling
 * - Token usage tracking
 * - Interactive chat interface
 * 
 * Requirements:
 * - Azure OpenAI Service endpoint and API key
 * - @azure/openai
 * - dotenv
 * - readline
 */

const { AzureOpenAI } = require('@azure/openai');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Configuration class for chat parameters
 */
class ChatConfiguration {
    constructor() {
        this.temperature = 0.7;
        this.maxTokens = 1000;
        this.topP = 0.95;
        this.frequencyPenalty = 0.0;
        this.presencePenalty = 0.0;
        this.systemPrompt = 
            "You are a helpful, knowledgeable assistant specializing in Azure AI services. " +
            "You provide accurate, practical information and always maintain a friendly, " +
            "professional tone. Keep responses concise but comprehensive, and ask clarifying " +
            "questions when needed to provide the best help possible.";
    }
}

/**
 * Manages conversation history and context
 */
class ConversationManager {
    constructor(systemPrompt, maxHistory = 10) {
        this.messages = [
            { role: "system", content: systemPrompt }
        ];
        this.maxHistory = maxHistory;
        this.totalTokens = 0;
    }

    addUserMessage(content) {
        this.messages.push({ role: "user", content: content });
        this._trimHistory();
    }

    addAssistantMessage(content) {
        this.messages.push({ role: "assistant", content: content });
        this._trimHistory();
    }

    _trimHistory() {
        // Keep system message + max_history messages
        if (this.messages.length > this.maxHistory + 1) {
            // Keep system message and recent messages
            this.messages = [this.messages[0], ...this.messages.slice(-(this.maxHistory))];
        }
    }

    getMessages() {
        return [...this.messages];
    }

    updateTokenCount(tokens) {
        this.totalTokens += tokens;
    }

    getConversationSummary() {
        const userMessages = this.messages.filter(m => m.role === "user").length;
        const assistantMessages = this.messages.filter(m => m.role === "assistant").length;
        return `Messages: ${userMessages} user, ${assistantMessages} assistant | Total tokens: ${this.totalTokens}`;
    }
}

/**
 * Azure OpenAI Chat Client with streaming and non-streaming support
 */
class AzureChatClient {
    constructor() {
        this.client = this._initializeClient();
        this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
        
        if (!this.deploymentName) {
            throw new Error("AZURE_OPENAI_DEPLOYMENT_NAME environment variable is required");
        }
    }

    _initializeClient() {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";

        if (!endpoint || !apiKey) {
            throw new Error(
                "AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables are required"
            );
        }

        return new AzureOpenAI({
            endpoint: endpoint,
            apiKey: apiKey,
            apiVersion: apiVersion
        });
    }

    /**
     * Get a non-streaming chat completion
     * 
     * @param {Array} messages - List of conversation messages
     * @param {ChatConfiguration} config - Chat configuration parameters
     * @returns {Object} Response and usage information
     */
    async chatCompletion(messages, config) {
        try {
            console.log(`Sending non-streaming chat request with ${messages.length} messages`);
            
            const response = await this.client.getChatCompletions(
                this.deploymentName,
                messages,
                {
                    temperature: config.temperature,
                    maxTokens: config.maxTokens,
                    topP: config.topP,
                    frequencyPenalty: config.frequencyPenalty,
                    presencePenalty: config.presencePenalty
                }
            );

            return {
                content: response.choices[0].message.content,
                role: response.choices[0].message.role,
                usage: {
                    promptTokens: response.usage.promptTokens,
                    completionTokens: response.usage.completionTokens,
                    totalTokens: response.usage.totalTokens
                },
                finishReason: response.choices[0].finishReason
            };
            
        } catch (error) {
            console.error(`Error in chat completion: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get a streaming chat completion
     * 
     * @param {Array} messages - List of conversation messages
     * @param {ChatConfiguration} config - Chat configuration parameters
     * @returns {AsyncGenerator} Stream of response chunks and usage information
     */
    async* streamChatCompletion(messages, config) {
        try {
            console.log(`Starting streaming chat request with ${messages.length} messages`);
            
            const events = await this.client.streamChatCompletions(
                this.deploymentName,
                messages,
                {
                    temperature: config.temperature,
                    maxTokens: config.maxTokens,
                    topP: config.topP,
                    frequencyPenalty: config.frequencyPenalty,
                    presencePenalty: config.presencePenalty
                }
            );

            for await (const event of events) {
                if (event.choices && event.choices[0] && event.choices[0].delta && event.choices[0].delta.content) {
                    yield {
                        content: event.choices[0].delta.content,
                        role: "assistant",
                        finishReason: event.choices[0].finishReason
                    };
                }
                
                // Handle usage information in streaming (when available)
                if (event.usage) {
                    yield {
                        usage: {
                            promptTokens: event.usage.promptTokens,
                            completionTokens: event.usage.completionTokens,
                            totalTokens: event.usage.totalTokens
                        }
                    };
                }
            }
            
        } catch (error) {
            console.error(`Error in streaming chat completion: ${error.message}`);
            throw error;
        }
    }
}

/**
 * Interactive chat application with both streaming and non-streaming modes
 */
class InteractiveChatApp {
    constructor() {
        this.client = new AzureChatClient();
        this.config = new ChatConfiguration();
        this.conversation = new ConversationManager(this.config.systemPrompt);
        this.streamingMode = true;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    displayWelcome() {
        console.log("\n" + "=".repeat(60));
        console.log("🤖 Azure OpenAI Chat Assistant");
        console.log("=".repeat(60));
        console.log("Commands:");
        console.log("  /help     - Show this help message");
        console.log("  /config   - Show current configuration");
        console.log("  /stream   - Toggle streaming mode");
        console.log("  /clear    - Clear conversation history");
        console.log("  /stats    - Show conversation statistics");
        console.log("  /quit     - Exit the application");
        console.log("=".repeat(60));
        console.log(`Mode: ${this.streamingMode ? 'Streaming' : 'Non-streaming'}`);
        console.log("Type your message and press Enter to start chatting!\n");
    }

    displayConfig() {
        console.log("\n📋 Current Configuration:");
        console.log(`  Temperature: ${this.config.temperature}`);
        console.log(`  Max Tokens: ${this.config.maxTokens}`);
        console.log(`  Top P: ${this.config.topP}`);
        console.log(`  Frequency Penalty: ${this.config.frequencyPenalty}`);
        console.log(`  Presence Penalty: ${this.config.presencePenalty}`);
        console.log(`  Streaming Mode: ${this.streamingMode}`);
        console.log(`  System Prompt: ${this.config.systemPrompt.substring(0, 100)}...`);
        console.log();
    }

    async handleStreamingResponse(userInput) {
        this.conversation.addUserMessage(userInput);
        
        process.stdout.write("🤖 Assistant: ");
        
        let fullResponse = "";
        let usageInfo = null;
        
        try {
            for await (const chunk of this.client.streamChatCompletion(
                this.conversation.getMessages(),
                this.config
            )) {
                if (chunk.content) {
                    process.stdout.write(chunk.content);
                    fullResponse += chunk.content;
                }
                
                if (chunk.usage) {
                    usageInfo = chunk.usage;
                }
            }
            
            console.log(); // New line after streaming
            
            // Add assistant response to conversation
            if (fullResponse) {
                this.conversation.addAssistantMessage(fullResponse);
            }
            
            // Update token count
            if (usageInfo) {
                this.conversation.updateTokenCount(usageInfo.totalTokens);
                console.log(`💡 Tokens used: ${usageInfo.totalTokens} ` +
                          `(prompt: ${usageInfo.promptTokens}, ` +
                          `completion: ${usageInfo.completionTokens})`);
            }
            
        } catch (error) {
            console.log(`\n❌ Error: ${error.message}`);
        }
    }

    async handleNonStreamingResponse(userInput) {
        this.conversation.addUserMessage(userInput);
        
        console.log("🤖 Assistant: Thinking...");
        
        try {
            const response = await this.client.chatCompletion(
                this.conversation.getMessages(),
                this.config
            );
            
            console.log(`🤖 Assistant: ${response.content}`);
            
            // Add assistant response to conversation
            this.conversation.addAssistantMessage(response.content);
            
            // Update token count
            this.conversation.updateTokenCount(response.usage.totalTokens);
            console.log(`💡 Tokens used: ${response.usage.totalTokens} ` +
                      `(prompt: ${response.usage.promptTokens}, ` +
                      `completion: ${response.usage.completionTokens})`);
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }

    async promptUser(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    async run() {
        this.displayWelcome();
        
        while (true) {
            try {
                const userInput = await this.promptUser("👤 You: ");
                
                if (!userInput) {
                    continue;
                }
                
                // Handle commands
                if (userInput.startsWith('/')) {
                    if (userInput === '/help') {
                        this.displayWelcome();
                    } else if (userInput === '/config') {
                        this.displayConfig();
                    } else if (userInput === '/stream') {
                        this.streamingMode = !this.streamingMode;
                        console.log(`🔄 Switched to ${this.streamingMode ? 'streaming' : 'non-streaming'} mode`);
                    } else if (userInput === '/clear') {
                        this.conversation = new ConversationManager(this.config.systemPrompt);
                        console.log("🗑️  Conversation history cleared");
                    } else if (userInput === '/stats') {
                        console.log(`📊 ${this.conversation.getConversationSummary()}`);
                    } else if (userInput === '/quit') {
                        console.log("👋 Goodbye!");
                        break;
                    } else {
                        console.log("❓ Unknown command. Type /help for available commands.");
                    }
                    continue;
                }
                
                // Handle chat messages
                if (this.streamingMode) {
                    await this.handleStreamingResponse(userInput);
                } else {
                    await this.handleNonStreamingResponse(userInput);
                }
                
                console.log(); // Add spacing between messages
                
            } catch (error) {
                if (error.message === 'SIGINT') {
                    console.log("\n👋 Goodbye!");
                    break;
                }
                console.log(`❌ Unexpected error: ${error.message}`);
            }
        }
        
        this.rl.close();
    }
}

/**
 * Demonstrate various chat features programmatically
 */
async function demonstrateChatFeatures() {
    console.log("🚀 Demonstrating Azure OpenAI Chat Features");
    console.log("=".repeat(50));
    
    try {
        const client = new AzureChatClient();
        const config = new ChatConfiguration();
        const conversation = new ConversationManager(config.systemPrompt);
        
        // Test non-streaming chat
        console.log("\n1. Non-streaming Chat Example:");
        console.log("-".repeat(30));
        
        conversation.addUserMessage("What are the main benefits of using Azure OpenAI Service?");
        
        const response = await client.chatCompletion(
            conversation.getMessages(),
            config
        );
        
        console.log("User: What are the main benefits of using Azure OpenAI Service?");
        console.log(`Assistant: ${response.content}`);
        console.log(`Tokens: ${response.usage.totalTokens}`);
        
        conversation.addAssistantMessage(response.content);
        conversation.updateTokenCount(response.usage.totalTokens);
        
        // Test streaming chat
        console.log("\n2. Streaming Chat Example:");
        console.log("-".repeat(30));
        
        conversation.addUserMessage("Can you explain how chat completions work?");
        
        console.log("User: Can you explain how chat completions work?");
        process.stdout.write("Assistant: ");
        
        let fullResponse = "";
        for await (const chunk of client.streamChatCompletion(
            conversation.getMessages(),
            config
        )) {
            if (chunk.content) {
                process.stdout.write(chunk.content);
                fullResponse += chunk.content;
            } else if (chunk.usage) {
                console.log(`\nTokens: ${chunk.usage.totalTokens}`);
            }
        }
        
        if (fullResponse) {
            conversation.addAssistantMessage(fullResponse);
        }
        
        console.log(`\n\n3. Conversation Summary:`);
        console.log("-".repeat(30));
        console.log(conversation.getConversationSummary());
        
    } catch (error) {
        console.log(`❌ Demo error: ${error.message}`);
    }
}

/**
 * Main function to run the chat application
 */
async function main() {
    console.log("Azure OpenAI Chat Application");
    console.log("Choose mode:");
    console.log("1. Interactive Chat");
    console.log("2. Feature Demo");
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    try {
        const choice = await new Promise((resolve) => {
            rl.question("Enter choice (1 or 2): ", (answer) => {
                resolve(answer.trim());
            });
        });
        
        rl.close();
        
        if (choice === "1") {
            const app = new InteractiveChatApp();
            await app.run();
        } else if (choice === "2") {
            await demonstrateChatFeatures();
        } else {
            console.log("Invalid choice. Please run the script again.");
        }
    } catch (error) {
        console.log(`❌ Application error: ${error.message}`);
    }
}

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
    console.log("\n👋 Goodbye!");
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    ChatConfiguration,
    ConversationManager,
    AzureChatClient,
    InteractiveChatApp
}; 