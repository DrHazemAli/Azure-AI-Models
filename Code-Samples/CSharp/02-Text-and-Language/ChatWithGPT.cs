using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure;
using Azure.AI.OpenAI;

namespace AzureOpenAI.TextAndLanguage
{
    /// <summary>
    /// Azure OpenAI Chat Completions Example
    /// =====================================
    /// 
    /// This program demonstrates how to build conversational AI applications using
    /// Azure OpenAI Service's Chat Completions API. It includes both streaming and
    /// non-streaming implementations with conversation memory.
    /// 
    /// Features:
    /// - Non-streaming chat completions
    /// - Streaming chat completions with real-time display
    /// - Conversation memory management
    /// - Configurable system prompts
    /// - Comprehensive error handling
    /// - Token usage tracking
    /// - Interactive chat interface
    /// 
    /// Requirements:
    /// - Azure OpenAI Service endpoint and API key
    /// - Azure.AI.OpenAI NuGet package
    /// </summary>
    
    /// <summary>
    /// Configuration class for chat parameters
    /// </summary>
    public class ChatConfiguration
    {
        public float Temperature { get; set; } = 0.7f;
        public int MaxTokens { get; set; } = 1000;
        public float TopP { get; set; } = 0.95f;
        public float FrequencyPenalty { get; set; } = 0.0f;
        public float PresencePenalty { get; set; } = 0.0f;
        public string SystemPrompt { get; set; } = 
            "You are a helpful, knowledgeable assistant specializing in Azure AI services. " +
            "You provide accurate, practical information and always maintain a friendly, " +
            "professional tone. Keep responses concise but comprehensive, and ask clarifying " +
            "questions when needed to provide the best help possible.";
    }

    /// <summary>
    /// Manages conversation history and context
    /// </summary>
    public class ConversationManager
    {
        private readonly List<ChatRequestMessage> _messages;
        private readonly int _maxHistory;
        public int TotalTokens { get; private set; }

        public ConversationManager(string systemPrompt, int maxHistory = 10)
        {
            _messages = new List<ChatRequestMessage>
            {
                new ChatRequestSystemMessage(systemPrompt)
            };
            _maxHistory = maxHistory;
            TotalTokens = 0;
        }

        public void AddUserMessage(string content)
        {
            _messages.Add(new ChatRequestUserMessage(content));
            TrimHistory();
        }

        public void AddAssistantMessage(string content)
        {
            _messages.Add(new ChatRequestAssistantMessage(content));
            TrimHistory();
        }

        private void TrimHistory()
        {
            // Keep system message + max_history messages
            if (_messages.Count > _maxHistory + 1)
            {
                // Keep system message and recent messages
                var systemMessage = _messages[0];
                var recentMessages = _messages.Skip(_messages.Count - _maxHistory).ToList();
                _messages.Clear();
                _messages.Add(systemMessage);
                _messages.AddRange(recentMessages);
            }
        }

        public List<ChatRequestMessage> GetMessages()
        {
            return new List<ChatRequestMessage>(_messages);
        }

        public void UpdateTokenCount(int tokens)
        {
            TotalTokens += tokens;
        }

        public string GetConversationSummary()
        {
            var userMessages = _messages.Count(m => m is ChatRequestUserMessage);
            var assistantMessages = _messages.Count(m => m is ChatRequestAssistantMessage);
            return $"Messages: {userMessages} user, {assistantMessages} assistant | Total tokens: {TotalTokens}";
        }
    }

    /// <summary>
    /// Response wrapper for chat completions
    /// </summary>
    public class ChatResponse
    {
        public string Content { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public ChatTokenUsage? Usage { get; set; }
        public CompletionsFinishReason? FinishReason { get; set; }
    }

    /// <summary>
    /// Token usage information
    /// </summary>
    public class ChatTokenUsage
    {
        public int PromptTokens { get; set; }
        public int CompletionTokens { get; set; }
        public int TotalTokens { get; set; }
    }

    /// <summary>
    /// Streaming response chunk
    /// </summary>
    public class ChatStreamChunk
    {
        public string? Content { get; set; }
        public string Role { get; set; } = "assistant";
        public ChatTokenUsage? Usage { get; set; }
        public CompletionsFinishReason? FinishReason { get; set; }
    }

    /// <summary>
    /// Azure OpenAI Chat Client with streaming and non-streaming support
    /// </summary>
    public class AzureChatClient
    {
        private readonly OpenAIClient _client;
        private readonly string _deploymentName;

        public AzureChatClient()
        {
            _client = InitializeClient();
            _deploymentName = Environment.GetEnvironmentVariable("AZURE_OPENAI_DEPLOYMENT_NAME") 
                ?? throw new InvalidOperationException("AZURE_OPENAI_DEPLOYMENT_NAME environment variable is required");
        }

        private OpenAIClient InitializeClient()
        {
            var endpoint = Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT") 
                ?? throw new InvalidOperationException("AZURE_OPENAI_ENDPOINT environment variable is required");
            var apiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY") 
                ?? throw new InvalidOperationException("AZURE_OPENAI_API_KEY environment variable is required");

            return new OpenAIClient(new Uri(endpoint), new AzureKeyCredential(apiKey));
        }

        /// <summary>
        /// Get a non-streaming chat completion
        /// </summary>
        /// <param name="messages">List of conversation messages</param>
        /// <param name="config">Chat configuration parameters</param>
        /// <returns>Response and usage information</returns>
        public async Task<ChatResponse> GetChatCompletionAsync(
            List<ChatRequestMessage> messages, 
            ChatConfiguration config)
        {
            try
            {
                Console.WriteLine($"Sending non-streaming chat request with {messages.Count} messages");

                var chatCompletionsOptions = new ChatCompletionsOptions(_deploymentName, messages)
                {
                    Temperature = config.Temperature,
                    MaxTokens = config.MaxTokens,
                    NucleusSamplingFactor = config.TopP,
                    FrequencyPenalty = config.FrequencyPenalty,
                    PresencePenalty = config.PresencePenalty
                };

                var response = await _client.GetChatCompletionsAsync(chatCompletionsOptions);

                return new ChatResponse
                {
                    Content = response.Value.Choices[0].Message.Content,
                    Role = response.Value.Choices[0].Message.Role.ToString(),
                    Usage = new ChatTokenUsage
                    {
                        PromptTokens = response.Value.Usage.PromptTokens,
                        CompletionTokens = response.Value.Usage.CompletionTokens,
                        TotalTokens = response.Value.Usage.TotalTokens
                    },
                    FinishReason = response.Value.Choices[0].FinishReason
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in chat completion: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Get a streaming chat completion
        /// </summary>
        /// <param name="messages">List of conversation messages</param>
        /// <param name="config">Chat configuration parameters</param>
        /// <returns>Stream of response chunks and usage information</returns>
        public async IAsyncEnumerable<ChatStreamChunk> GetStreamingChatCompletionAsync(
            List<ChatRequestMessage> messages, 
            ChatConfiguration config)
        {
            Console.WriteLine($"Starting streaming chat request with {messages.Count} messages");

            var chatCompletionsOptions = new ChatCompletionsOptions(_deploymentName, messages)
            {
                Temperature = config.Temperature,
                MaxTokens = config.MaxTokens,
                NucleusSamplingFactor = config.TopP,
                FrequencyPenalty = config.FrequencyPenalty,
                PresencePenalty = config.PresencePenalty
            };

            try
            {
                await foreach (var streamingChoice in _client.GetChatCompletionsStreaming(chatCompletionsOptions))
                {
                    if (streamingChoice.ContentUpdate != null)
                    {
                        yield return new ChatStreamChunk
                        {
                            Content = streamingChoice.ContentUpdate,
                            Role = "assistant",
                            FinishReason = streamingChoice.FinishReason
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in streaming chat completion: {ex.Message}");
                throw;
            }
        }
    }

    /// <summary>
    /// Interactive chat application with both streaming and non-streaming modes
    /// </summary>
    public class InteractiveChatApp
    {
        private readonly AzureChatClient _client;
        private readonly ChatConfiguration _config;
        private ConversationManager _conversation;
        private bool _streamingMode;

        public InteractiveChatApp()
        {
            _client = new AzureChatClient();
            _config = new ChatConfiguration();
            _conversation = new ConversationManager(_config.SystemPrompt);
            _streamingMode = true;
        }

        public void DisplayWelcome()
        {
            Console.WriteLine("\n" + new string('=', 60));
            Console.WriteLine("🤖 Azure OpenAI Chat Assistant");
            Console.WriteLine(new string('=', 60));
            Console.WriteLine("Commands:");
            Console.WriteLine("  /help     - Show this help message");
            Console.WriteLine("  /config   - Show current configuration");
            Console.WriteLine("  /stream   - Toggle streaming mode");
            Console.WriteLine("  /clear    - Clear conversation history");
            Console.WriteLine("  /stats    - Show conversation statistics");
            Console.WriteLine("  /quit     - Exit the application");
            Console.WriteLine(new string('=', 60));
            Console.WriteLine($"Mode: {(_streamingMode ? "Streaming" : "Non-streaming")}");
            Console.WriteLine("Type your message and press Enter to start chatting!\n");
        }

        public void DisplayConfig()
        {
            Console.WriteLine("\n📋 Current Configuration:");
            Console.WriteLine($"  Temperature: {_config.Temperature}");
            Console.WriteLine($"  Max Tokens: {_config.MaxTokens}");
            Console.WriteLine($"  Top P: {_config.TopP}");
            Console.WriteLine($"  Frequency Penalty: {_config.FrequencyPenalty}");
            Console.WriteLine($"  Presence Penalty: {_config.PresencePenalty}");
            Console.WriteLine($"  Streaming Mode: {_streamingMode}");
            Console.WriteLine($"  System Prompt: {_config.SystemPrompt.Substring(0, Math.Min(100, _config.SystemPrompt.Length))}...");
            Console.WriteLine();
        }

        public async Task HandleStreamingResponseAsync(string userInput)
        {
            _conversation.AddUserMessage(userInput);
            
            Console.Write("🤖 Assistant: ");
            
            var fullResponse = new StringBuilder();
            ChatTokenUsage? usageInfo = null;
            
            try
            {
                await foreach (var chunk in _client.GetStreamingChatCompletionAsync(
                    _conversation.GetMessages(),
                    _config))
                {
                    if (!string.IsNullOrEmpty(chunk.Content))
                    {
                        Console.Write(chunk.Content);
                        fullResponse.Append(chunk.Content);
                    }
                    
                    if (chunk.Usage != null)
                    {
                        usageInfo = chunk.Usage;
                    }
                }
                
                Console.WriteLine(); // New line after streaming
                
                // Add assistant response to conversation
                if (fullResponse.Length > 0)
                {
                    _conversation.AddAssistantMessage(fullResponse.ToString());
                }
                
                // Update token count (note: streaming doesn't always provide usage info)
                if (usageInfo != null)
                {
                    _conversation.UpdateTokenCount(usageInfo.TotalTokens);
                    Console.WriteLine($"💡 Tokens used: {usageInfo.TotalTokens} " +
                                    $"(prompt: {usageInfo.PromptTokens}, " +
                                    $"completion: {usageInfo.CompletionTokens})");
                }
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n❌ Error: {ex.Message}");
            }
        }

        public async Task HandleNonStreamingResponseAsync(string userInput)
        {
            _conversation.AddUserMessage(userInput);
            
            Console.WriteLine("🤖 Assistant: Thinking...");
            
            try
            {
                var response = await _client.GetChatCompletionAsync(
                    _conversation.GetMessages(),
                    _config);
                
                Console.WriteLine($"🤖 Assistant: {response.Content}");
                
                // Add assistant response to conversation
                _conversation.AddAssistantMessage(response.Content);
                
                // Update token count
                if (response.Usage != null)
                {
                    _conversation.UpdateTokenCount(response.Usage.TotalTokens);
                    Console.WriteLine($"💡 Tokens used: {response.Usage.TotalTokens} " +
                                    $"(prompt: {response.Usage.PromptTokens}, " +
                                    $"completion: {response.Usage.CompletionTokens})");
                }
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error: {ex.Message}");
            }
        }

        public async Task RunAsync()
        {
            DisplayWelcome();
            
            while (true)
            {
                try
                {
                    Console.Write("👤 You: ");
                    var userInput = Console.ReadLine()?.Trim();
                    
                    if (string.IsNullOrEmpty(userInput))
                    {
                        continue;
                    }
                    
                    // Handle commands
                    if (userInput.StartsWith("/"))
                    {
                        switch (userInput)
                        {
                            case "/help":
                                DisplayWelcome();
                                break;
                            case "/config":
                                DisplayConfig();
                                break;
                            case "/stream":
                                _streamingMode = !_streamingMode;
                                Console.WriteLine($"🔄 Switched to {(_streamingMode ? "streaming" : "non-streaming")} mode");
                                break;
                            case "/clear":
                                _conversation = new ConversationManager(_config.SystemPrompt);
                                Console.WriteLine("🗑️  Conversation history cleared");
                                break;
                            case "/stats":
                                Console.WriteLine($"📊 {_conversation.GetConversationSummary()}");
                                break;
                            case "/quit":
                                Console.WriteLine("👋 Goodbye!");
                                return;
                            default:
                                Console.WriteLine("❓ Unknown command. Type /help for available commands.");
                                break;
                        }
                        continue;
                    }
                    
                    // Handle chat messages
                    if (_streamingMode)
                    {
                        await HandleStreamingResponseAsync(userInput);
                    }
                    else
                    {
                        await HandleNonStreamingResponseAsync(userInput);
                    }
                    
                    Console.WriteLine(); // Add spacing between messages
                    
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Unexpected error: {ex.Message}");
                }
            }
        }
    }

    /// <summary>
    /// Main program class
    /// </summary>
    public class Program
    {
        /// <summary>
        /// Demonstrate various chat features programmatically
        /// </summary>
        public static async Task DemonstrateChatFeaturesAsync()
        {
            Console.WriteLine("🚀 Demonstrating Azure OpenAI Chat Features");
            Console.WriteLine(new string('=', 50));
            
            try
            {
                var client = new AzureChatClient();
                var config = new ChatConfiguration();
                var conversation = new ConversationManager(config.SystemPrompt);
                
                // Test non-streaming chat
                Console.WriteLine("\n1. Non-streaming Chat Example:");
                Console.WriteLine(new string('-', 30));
                
                conversation.AddUserMessage("What are the main benefits of using Azure OpenAI Service?");
                
                var response = await client.GetChatCompletionAsync(
                    conversation.GetMessages(),
                    config);
                
                Console.WriteLine("User: What are the main benefits of using Azure OpenAI Service?");
                Console.WriteLine($"Assistant: {response.Content}");
                Console.WriteLine($"Tokens: {response.Usage?.TotalTokens}");
                
                conversation.AddAssistantMessage(response.Content);
                if (response.Usage != null)
                {
                    conversation.UpdateTokenCount(response.Usage.TotalTokens);
                }
                
                // Test streaming chat
                Console.WriteLine("\n2. Streaming Chat Example:");
                Console.WriteLine(new string('-', 30));
                
                conversation.AddUserMessage("Can you explain how chat completions work?");
                
                Console.WriteLine("User: Can you explain how chat completions work?");
                Console.Write("Assistant: ");
                
                var fullResponse = new StringBuilder();
                await foreach (var chunk in client.GetStreamingChatCompletionAsync(
                    conversation.GetMessages(),
                    config))
                {
                    if (!string.IsNullOrEmpty(chunk.Content))
                    {
                        Console.Write(chunk.Content);
                        fullResponse.Append(chunk.Content);
                    }
                    else if (chunk.Usage != null)
                    {
                        Console.WriteLine($"\nTokens: {chunk.Usage.TotalTokens}");
                    }
                }
                
                if (fullResponse.Length > 0)
                {
                    conversation.AddAssistantMessage(fullResponse.ToString());
                }
                
                Console.WriteLine($"\n\n3. Conversation Summary:");
                Console.WriteLine(new string('-', 30));
                Console.WriteLine(conversation.GetConversationSummary());
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Demo error: {ex.Message}");
            }
        }

        /// <summary>
        /// Main entry point
        /// </summary>
        public static async Task Main(string[] args)
        {
            Console.WriteLine("Azure OpenAI Chat Application");
            Console.WriteLine("Choose mode:");
            Console.WriteLine("1. Interactive Chat");
            Console.WriteLine("2. Feature Demo");
            
            try
            {
                Console.Write("Enter choice (1 or 2): ");
                var choice = Console.ReadLine()?.Trim();
                
                switch (choice)
                {
                    case "1":
                        var app = new InteractiveChatApp();
                        await app.RunAsync();
                        break;
                    case "2":
                        await DemonstrateChatFeaturesAsync();
                        break;
                    default:
                        Console.WriteLine("Invalid choice. Please run the program again.");
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Application error: {ex.Message}");
            }
        }
    }
} 