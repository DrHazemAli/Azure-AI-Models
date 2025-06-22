using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.IO;
using Azure;
using Azure.AI.TextAnalytics;
using Azure.Core;

namespace AzureAI.TextSummarizer
{
    /// <summary>
    /// Data class for summarization results
    /// </summary>
    public class SummaryResult
    {
        public string SummaryType { get; set; }
        public string SummaryText { get; set; }
        public List<string> Sentences { get; set; }
        public List<double> RankScores { get; set; }
        public double ProcessingTime { get; set; }
        public int CharacterCount { get; set; }
        public double ConfidenceScore { get; set; }

        public SummaryResult(string summaryType, string summaryText, 
            List<string> sentences = null, List<double> rankScores = null, 
            double processingTime = 0.0, int characterCount = 0, double confidenceScore = 0.0)
        {
            SummaryType = summaryType;
            SummaryText = summaryText;
            Sentences = sentences ?? new List<string>();
            RankScores = rankScores ?? new List<double>();
            ProcessingTime = processingTime;
            CharacterCount = characterCount;
            ConfidenceScore = confidenceScore;
        }
    }

    /// <summary>
    /// Data class for conversation summarization results
    /// </summary>
    public class ConversationSummary
    {
        public string Issue { get; set; } = "";
        public string Resolution { get; set; } = "";
        public string Recap { get; set; } = "";
        public List<string> ChapterTitles { get; set; }
        public List<string> NarrativeSummaries { get; set; }

        public ConversationSummary()
        {
            ChapterTitles = new List<string>();
            NarrativeSummaries = new List<string>();
        }
    }

    /// <summary>
    /// Processing statistics for monitoring
    /// </summary>
    public class ProcessingStatistics
    {
        public int TotalRequests { get; set; }
        public int SuccessfulRequests { get; set; }
        public int FailedRequests { get; set; }
        public long TotalCharactersProcessed { get; set; }
        public double AverageProcessingTime { get; set; }
        public double SuccessRatePercent => TotalRequests > 0 ? (double)SuccessfulRequests / TotalRequests * 100 : 0;
        public double EstimatedCostUsd => TotalCharactersProcessed / 1000.0 * 0.002; // $2 per 1000 text records
    }

    /// <summary>
    /// Comprehensive Azure AI Language Text Summarizer
    /// </summary>
    public class AzureTextSummarizer
    {
        private readonly string _endpoint;
        private readonly string _apiKey;
        private readonly TextAnalyticsClient _client;
        private readonly HttpClient _httpClient;
        
        // Configuration
        private readonly int _maxRetries = 3;
        private readonly int _retryDelayMs = 1000;
        private readonly int _rateLimitDelayMs = 2000;
        
        // Statistics tracking
        private readonly ProcessingStatistics _stats = new ProcessingStatistics();
        private readonly object _statsLock = new object();

        public AzureTextSummarizer(string endpoint = null, string apiKey = null)
        {
            _endpoint = endpoint ?? Environment.GetEnvironmentVariable("AZURE_LANGUAGE_ENDPOINT");
            _apiKey = apiKey ?? Environment.GetEnvironmentVariable("AZURE_LANGUAGE_KEY");
            
            if (string.IsNullOrEmpty(_endpoint) || string.IsNullOrEmpty(_apiKey))
            {
                throw new ArgumentException("Azure Language endpoint and API key are required");
            }
            
            // Initialize Azure Text Analytics client
            var credential = new AzureKeyCredential(_apiKey);
            _client = new TextAnalyticsClient(new Uri(_endpoint), credential);
            
            // Initialize HTTP client for conversation summarization
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _apiKey);
            
            Console.WriteLine("Azure Text Summarizer initialized successfully");
        }

        /// <summary>
        /// Perform extractive summarization
        /// </summary>
        /// <param name="text">Input text to summarize</param>
        /// <param name="sentenceCount">Number of sentences to extract (1-20)</param>
        /// <param name="sortBy">Sort order - "Rank" or "Offset"</param>
        /// <returns>Extractive summary result</returns>
        public async Task<SummaryResult> ExtractiveSummarizationAsync(string text, int sentenceCount = 3, string sortBy = "Rank")
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                // Validate inputs
                if (string.IsNullOrWhiteSpace(text))
                {
                    throw new ArgumentException("Input text cannot be empty");
                }
                
                if (sentenceCount < 1 || sentenceCount > 20)
                {
                    throw new ArgumentException("Sentence count must be between 1 and 20");
                }
                
                // Create extractive summary action
                var actions = new List<TextAnalyticsAction>
                {
                    new ExtractiveSummarizeAction
                    {
                        MaxSentenceCount = sentenceCount,
                        OrderBy = sortBy == "Rank" ? ExtractiveSummarySentencesOrder.Rank : ExtractiveSummarySentencesOrder.Offset
                    }
                };
                
                // Process with retry logic
                for (int attempt = 0; attempt < _maxRetries; attempt++)
                {
                    try
                    {
                        // Start analysis
                        var operation = await _client.StartAnalyzeActionsAsync(new[] { text }, actions);
                        
                        // Wait for completion
                        await operation.WaitForCompletionAsync();
                        
                        // Extract results
                        await foreach (var actionResult in operation.Value)
                        {
                            var extractiveResults = actionResult.ExtractiveSummarizeResults;
                            
                            foreach (var result in extractiveResults)
                            {
                                if (result.HasError)
                                {
                                    throw new Exception($"Analysis error: {result.Error.ErrorCode} - {result.Error.Message}");
                                }
                                
                                // Build result
                                var sentences = result.Sentences.Select(s => s.Text).ToList();
                                var rankScores = result.Sentences.Select(s => s.RankScore).ToList();
                                var summaryText = string.Join(" ", sentences);
                                
                                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                                
                                // Update statistics
                                UpdateStats(text.Length, processingTime, true);
                                
                                return new SummaryResult(
                                    "extractive",
                                    summaryText,
                                    sentences,
                                    rankScores,
                                    processingTime,
                                    text.Length
                                );
                            }
                        }
                        
                        break;
                        
                    }
                    catch (RequestFailedException ex) when (ex.Status == 429) // Rate limit
                    {
                        Console.WriteLine($"Rate limit hit, attempt {attempt + 1}");
                        await Task.Delay(_rateLimitDelayMs * (int)Math.Pow(2, attempt));
                    }
                    catch (Exception ex)
                    {
                        if (attempt == _maxRetries - 1)
                        {
                            throw;
                        }
                        Console.WriteLine($"Attempt {attempt + 1} failed: {ex.Message}");
                        await Task.Delay(_retryDelayMs * (int)Math.Pow(2, attempt));
                    }
                }
                
                throw new Exception("Max retries exceeded");
                
            }
            catch (Exception ex)
            {
                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                UpdateStats(text.Length, processingTime, false);
                Console.WriteLine($"Extractive summarization failed: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Perform abstractive summarization
        /// </summary>
        /// <param name="text">Input text to summarize</param>
        /// <param name="summaryLength">Length of summary - "short", "medium", "long"</param>
        /// <returns>Abstractive summary result</returns>
        public async Task<SummaryResult> AbstractiveSummarizationAsync(string text, string summaryLength = "medium")
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                // Validate inputs
                if (string.IsNullOrWhiteSpace(text))
                {
                    throw new ArgumentException("Input text cannot be empty");
                }
                
                var validLengths = new[] { "short", "medium", "long" };
                if (!validLengths.Contains(summaryLength.ToLower()))
                {
                    throw new ArgumentException("Summary length must be 'short', 'medium', or 'long'");
                }
                
                // Create abstractive summary action
                var actions = new List<TextAnalyticsAction>
                {
                    new AbstractiveSummarizeAction
                    {
                        SentenceCount = summaryLength.ToLower() switch
                        {
                            "short" => 1,
                            "medium" => 3,
                            "long" => 5,
                            _ => 3
                        }
                    }
                };
                
                // Process with retry logic
                for (int attempt = 0; attempt < _maxRetries; attempt++)
                {
                    try
                    {
                        // Start analysis
                        var operation = await _client.StartAnalyzeActionsAsync(new[] { text }, actions);
                        
                        // Wait for completion
                        await operation.WaitForCompletionAsync();
                        
                        // Extract results
                        await foreach (var actionResult in operation.Value)
                        {
                            var abstractiveResults = actionResult.AbstractiveSummarizeResults;
                            
                            foreach (var result in abstractiveResults)
                            {
                                if (result.HasError)
                                {
                                    throw new Exception($"Analysis error: {result.Error.ErrorCode} - {result.Error.Message}");
                                }
                                
                                // Build result
                                var summaries = result.Summaries.Select(s => s.Text).ToList();
                                var summaryText = string.Join(" ", summaries);
                                
                                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                                
                                // Update statistics
                                UpdateStats(text.Length, processingTime, true);
                                
                                return new SummaryResult(
                                    "abstractive",
                                    summaryText,
                                    null,
                                    null,
                                    processingTime,
                                    text.Length
                                );
                            }
                        }
                        
                        break;
                        
                    }
                    catch (RequestFailedException ex) when (ex.Status == 429) // Rate limit
                    {
                        Console.WriteLine($"Rate limit hit, attempt {attempt + 1}");
                        await Task.Delay(_rateLimitDelayMs * (int)Math.Pow(2, attempt));
                    }
                    catch (Exception ex)
                    {
                        if (attempt == _maxRetries - 1)
                        {
                            throw;
                        }
                        Console.WriteLine($"Attempt {attempt + 1} failed: {ex.Message}");
                        await Task.Delay(_retryDelayMs * (int)Math.Pow(2, attempt));
                    }
                }
                
                throw new Exception("Max retries exceeded");
                
            }
            catch (Exception ex)
            {
                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                UpdateStats(text.Length, processingTime, false);
                Console.WriteLine($"Abstractive summarization failed: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Perform conversation summarization
        /// </summary>
        /// <param name="conversationItems">List of conversation items</param>
        /// <param name="summaryAspects">List of aspects to summarize</param>
        /// <returns>Conversation summary result</returns>
        public async Task<ConversationSummary> ConversationSummarizationAsync(
            List<ConversationItem> conversationItems, 
            List<string> summaryAspects = null)
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                if (conversationItems == null || !conversationItems.Any())
                {
                    throw new ArgumentException("Conversation items cannot be empty");
                }
                
                summaryAspects ??= new List<string> { "issue", "resolution", "recap" };
                
                // Prepare conversation data
                var conversationData = new
                {
                    displayName = "Conversation Summarization",
                    analysisInput = new
                    {
                        conversations = new[]
                        {
                            new
                            {
                                conversationItems = conversationItems.Select((item, i) => new
                                {
                                    text = item.Text,
                                    id = (i + 1).ToString(),
                                    role = item.Role ?? "Customer",
                                    participantId = item.ParticipantId ?? $"Participant_{i + 1}"
                                }).ToArray(),
                                modality = "text",
                                id = "conversation1",
                                language = "en"
                            }
                        }
                    },
                    tasks = summaryAspects.Select(aspect => new
                    {
                        taskName = $"{aspect}_task",
                        kind = "ConversationalSummarizationTask",
                        parameters = new { summaryAspects = new[] { aspect } }
                    }).ToArray()
                };
                
                var json = JsonSerializer.Serialize(conversationData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var url = $"{_endpoint}/language/analyze-conversations/jobs?api-version=2023-04-01";
                
                // Process with retry logic
                for (int attempt = 0; attempt < _maxRetries; attempt++)
                {
                    try
                    {
                        // Submit job
                        var response = await _httpClient.PostAsync(url, content);
                        
                        if (!response.IsSuccessStatusCode)
                        {
                            var errorContent = await response.Content.ReadAsStringAsync();
                            throw new Exception($"API request failed: {response.StatusCode} - {errorContent}");
                        }
                        
                        // Get operation location
                        var operationLocation = response.Headers.GetValues("operation-location").FirstOrDefault();
                        if (string.IsNullOrEmpty(operationLocation))
                        {
                            throw new Exception("No operation location in response");
                        }
                        
                        // Poll for results
                        while (true)
                        {
                            var resultResponse = await _httpClient.GetAsync(operationLocation);
                            var resultContent = await resultResponse.Content.ReadAsStringAsync();
                            var resultData = JsonSerializer.Deserialize<JsonElement>(resultContent);
                            
                            var status = resultData.GetProperty("status").GetString();
                            
                            if (status == "succeeded")
                            {
                                // Parse results
                                var conversationSummary = new ConversationSummary();
                                
                                var tasks = resultData.GetProperty("tasks").GetProperty("items");
                                foreach (var task in tasks.EnumerateArray())
                                {
                                    if (task.GetProperty("status").GetString() == "succeeded")
                                    {
                                        var conversations = task.GetProperty("results").GetProperty("conversations");
                                        foreach (var conv in conversations.EnumerateArray())
                                        {
                                            var summaries = conv.GetProperty("summaries");
                                            foreach (var summary in summaries.EnumerateArray())
                                            {
                                                var aspect = summary.GetProperty("aspect").GetString();
                                                var text = summary.GetProperty("text").GetString();
                                                
                                                switch (aspect)
                                                {
                                                    case "issue":
                                                        conversationSummary.Issue = text;
                                                        break;
                                                    case "resolution":
                                                        conversationSummary.Resolution = text;
                                                        break;
                                                    case "recap":
                                                        conversationSummary.Recap = text;
                                                        break;
                                                    case "chapterTitle":
                                                        conversationSummary.ChapterTitles.Add(text);
                                                        break;
                                                    case "narrative":
                                                        conversationSummary.NarrativeSummaries.Add(text);
                                                        break;
                                                }
                                            }
                                        }
                                    }
                                }
                                
                                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                                var totalChars = conversationItems.Sum(item => item.Text.Length);
                                UpdateStats(totalChars, processingTime, true);
                                
                                return conversationSummary;
                                
                            }
                            else if (status == "failed")
                            {
                                throw new Exception("Conversation analysis failed");
                            }
                            
                            await Task.Delay(2000); // Wait before polling again
                        }
                        
                    }
                    catch (HttpRequestException ex) when (ex.Message.Contains("429")) // Rate limit
                    {
                        Console.WriteLine($"Rate limit hit, attempt {attempt + 1}");
                        await Task.Delay(_rateLimitDelayMs * (int)Math.Pow(2, attempt));
                    }
                    catch (Exception ex)
                    {
                        if (attempt == _maxRetries - 1)
                        {
                            throw;
                        }
                        Console.WriteLine($"Attempt {attempt + 1} failed: {ex.Message}");
                        await Task.Delay(_retryDelayMs * (int)Math.Pow(2, attempt));
                    }
                }
                
                throw new Exception("Max retries exceeded");
                
            }
            catch (Exception ex)
            {
                var processingTime = (DateTime.UtcNow - startTime).TotalSeconds;
                var totalChars = conversationItems.Sum(item => item.Text.Length);
                UpdateStats(totalChars, processingTime, false);
                Console.WriteLine($"Conversation summarization failed: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Process multiple documents in batch
        /// </summary>
        /// <param name="documents">List of text documents</param>
        /// <param name="summarizationType">Type of summarization - "extractive" or "abstractive"</param>
        /// <param name="options">Additional options</param>
        /// <returns>List of summary results</returns>
        public async Task<List<SummaryResult>> BatchSummarizationAsync(
            List<string> documents, 
            string summarizationType = "extractive", 
            Dictionary<string, object> options = null)
        {
            var results = new List<SummaryResult>();
            options ??= new Dictionary<string, object>();
            
            // Process documents with concurrency control
            const int concurrencyLimit = 5;
            var chunks = documents.Chunk(concurrencyLimit);
            
            foreach (var chunk in chunks)
            {
                var tasks = chunk.Select(async doc =>
                {
                    try
                    {
                        if (summarizationType == "extractive")
                        {
                            var sentenceCount = options.ContainsKey("sentenceCount") ? (int)options["sentenceCount"] : 3;
                            var sortBy = options.ContainsKey("sortBy") ? (string)options["sortBy"] : "Rank";
                            return await ExtractiveSummarizationAsync(doc, sentenceCount, sortBy);
                        }
                        else
                        {
                            var summaryLength = options.ContainsKey("summaryLength") ? (string)options["summaryLength"] : "medium";
                            return await AbstractiveSummarizationAsync(doc, summaryLength);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to process document: {ex.Message}");
                        return null;
                    }
                });
                
                var chunkResults = await Task.WhenAll(tasks);
                results.AddRange(chunkResults.Where(r => r != null));
            }
            
            Console.WriteLine($"Batch processing completed: {results.Count}/{documents.Count} successful");
            
            return results;
        }

        /// <summary>
        /// Update processing statistics
        /// </summary>
        /// <param name="characterCount">Number of characters processed</param>
        /// <param name="processingTime">Processing time in seconds</param>
        /// <param name="success">Whether the operation was successful</param>
        private void UpdateStats(int characterCount, double processingTime, bool success)
        {
            lock (_statsLock)
            {
                _stats.TotalRequests++;
                _stats.TotalCharactersProcessed += characterCount;
                
                if (success)
                {
                    _stats.SuccessfulRequests++;
                }
                else
                {
                    _stats.FailedRequests++;
                }
                
                // Update average processing time
                var totalTime = _stats.AverageProcessingTime * (_stats.TotalRequests - 1);
                _stats.AverageProcessingTime = (totalTime + processingTime) / _stats.TotalRequests;
            }
        }

        /// <summary>
        /// Get processing statistics
        /// </summary>
        /// <returns>Processing statistics</returns>
        public ProcessingStatistics GetStatistics()
        {
            lock (_statsLock)
            {
                return new ProcessingStatistics
                {
                    TotalRequests = _stats.TotalRequests,
                    SuccessfulRequests = _stats.SuccessfulRequests,
                    FailedRequests = _stats.FailedRequests,
                    TotalCharactersProcessed = _stats.TotalCharactersProcessed,
                    AverageProcessingTime = _stats.AverageProcessingTime
                };
            }
        }

        /// <summary>
        /// Save summary processing history
        /// </summary>
        /// <param name="filename">Output filename</param>
        public async Task SaveSummaryHistoryAsync(string filename = null)
        {
            filename ??= $"summary_history_{DateTime.UtcNow:yyyy-MM-dd_HH-mm-ss}.json";
            
            var historyData = new
            {
                timestamp = DateTime.UtcNow.ToString("O"),
                statistics = GetStatistics(),
                configuration = new
                {
                    endpoint = _endpoint,
                    maxRetries = _maxRetries,
                    retryDelayMs = _retryDelayMs,
                    rateLimitDelayMs = _rateLimitDelayMs
                }
            };
            
            var json = JsonSerializer.Serialize(historyData, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filename, json);
            Console.WriteLine($"Summary history saved to {filename}");
        }

        /// <summary>
        /// Dispose resources
        /// </summary>
        public void Dispose()
        {
            _client?.Dispose();
            _httpClient?.Dispose();
        }
    }

    /// <summary>
    /// Conversation item for conversation summarization
    /// </summary>
    public class ConversationItem
    {
        public string Text { get; set; }
        public string Role { get; set; }
        public string ParticipantId { get; set; }

        public ConversationItem(string text, string role = null, string participantId = null)
        {
            Text = text;
            Role = role;
            ParticipantId = participantId;
        }
    }

    /// <summary>
    /// Interactive command-line interface for text summarization
    /// </summary>
    public class InteractiveSummarizer
    {
        private readonly AzureTextSummarizer _summarizer;
        private bool _running = true;

        public InteractiveSummarizer()
        {
            _summarizer = new AzureTextSummarizer();
        }

        /// <summary>
        /// Run the interactive summarizer
        /// </summary>
        public async Task RunAsync()
        {
            Console.WriteLine("\n🤖 Azure AI Text Summarizer");
            Console.WriteLine(new string('=', 50));
            Console.WriteLine("Choose an option:");
            Console.WriteLine("1. Extractive Summarization");
            Console.WriteLine("2. Abstractive Summarization");
            Console.WriteLine("3. Conversation Summarization");
            Console.WriteLine("4. Batch Processing");
            Console.WriteLine("5. View Statistics");
            Console.WriteLine("6. Exit");
            
            while (_running)
            {
                try
                {
                    Console.Write("\nEnter your choice (1-6): ");
                    var choice = Console.ReadLine()?.Trim();
                    
                    switch (choice)
                    {
                        case "1":
                            await ExtractiveModeAsync();
                            break;
                        case "2":
                            await AbstractiveModeAsync();
                            break;
                        case "3":
                            await ConversationModeAsync();
                            break;
                        case "4":
                            await BatchModeAsync();
                            break;
                        case "5":
                            ShowStatistics();
                            break;
                        case "6":
                            _running = false;
                            Console.WriteLine("Thank you for using Azure AI Text Summarizer!");
                            break;
                        default:
                            Console.WriteLine("Invalid choice. Please try again.");
                            break;
                    }
                    
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Interactive extractive summarization
        /// </summary>
        private async Task ExtractiveModeAsync()
        {
            Console.WriteLine("\n📄 Extractive Summarization");
            Console.WriteLine(new string('-', 30));
            
            Console.Write("Enter text to summarize: ");
            var text = Console.ReadLine();
            
            if (string.IsNullOrWhiteSpace(text))
            {
                Console.WriteLine("Text cannot be empty.");
                return;
            }
            
            try
            {
                Console.Write("Number of sentences (1-20, default 3): ");
                var sentenceCountInput = Console.ReadLine();
                var sentenceCount = int.TryParse(sentenceCountInput, out var count) ? count : 3;
                
                Console.Write("Sort by (Rank/Offset, default Rank): ");
                var sortBy = Console.ReadLine();
                if (string.IsNullOrWhiteSpace(sortBy)) sortBy = "Rank";
                
                Console.WriteLine("\nProcessing...");
                var result = await _summarizer.ExtractiveSummarizationAsync(text, sentenceCount, sortBy);
                
                Console.WriteLine("\n✅ Extractive Summary:");
                Console.WriteLine($"Summary: {result.SummaryText}");
                Console.WriteLine($"Processing time: {result.ProcessingTime:F2}s");
                Console.WriteLine($"Character count: {result.CharacterCount}");
                
                if (result.Sentences.Any())
                {
                    Console.WriteLine("\nExtracted sentences:");
                    for (int i = 0; i < result.Sentences.Count; i++)
                    {
                        var sentence = result.Sentences[i];
                        var score = result.RankScores[i];
                        Console.WriteLine($"{i + 1}. {sentence} (Score: {score:F3})");
                    }
                }
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Summarization failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Interactive abstractive summarization
        /// </summary>
        private async Task AbstractiveModeAsync()
        {
            Console.WriteLine("\n📝 Abstractive Summarization");
            Console.WriteLine(new string('-', 30));
            
            Console.Write("Enter text to summarize: ");
            var text = Console.ReadLine();
            
            if (string.IsNullOrWhiteSpace(text))
            {
                Console.WriteLine("Text cannot be empty.");
                return;
            }
            
            try
            {
                Console.Write("Summary length (short/medium/long, default medium): ");
                var length = Console.ReadLine();
                if (string.IsNullOrWhiteSpace(length)) length = "medium";
                
                Console.WriteLine("\nProcessing...");
                var result = await _summarizer.AbstractiveSummarizationAsync(text, length);
                
                Console.WriteLine("\n✅ Abstractive Summary:");
                Console.WriteLine($"Summary: {result.SummaryText}");
                Console.WriteLine($"Processing time: {result.ProcessingTime:F2}s");
                Console.WriteLine($"Character count: {result.CharacterCount}");
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Summarization failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Interactive conversation summarization
        /// </summary>
        private async Task ConversationModeAsync()
        {
            Console.WriteLine("\n💬 Conversation Summarization");
            Console.WriteLine(new string('-', 30));
            
            var conversationItems = new List<ConversationItem>();
            
            Console.WriteLine("Enter conversation (type 'done' when finished):");
            while (true)
            {
                Console.Write("Speaker (Agent/Customer): ");
                var speaker = Console.ReadLine();
                if (speaker?.ToLower() == "done") break;
                
                Console.Write("Text: ");
                var text = Console.ReadLine();
                if (string.IsNullOrWhiteSpace(text)) continue;
                
                conversationItems.Add(new ConversationItem(text, speaker, $"{speaker}_1"));
            }
            
            if (!conversationItems.Any())
            {
                Console.WriteLine("No conversation items entered.");
                return;
            }
            
            try
            {
                Console.WriteLine("\nProcessing...");
                var result = await _summarizer.ConversationSummarizationAsync(conversationItems);
                
                Console.WriteLine("\n✅ Conversation Summary:");
                if (!string.IsNullOrEmpty(result.Issue))
                {
                    Console.WriteLine($"Issue: {result.Issue}");
                }
                if (!string.IsNullOrEmpty(result.Resolution))
                {
                    Console.WriteLine($"Resolution: {result.Resolution}");
                }
                if (!string.IsNullOrEmpty(result.Recap))
                {
                    Console.WriteLine($"Recap: {result.Recap}");
                }
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Conversation summarization failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Interactive batch processing
        /// </summary>
        private async Task BatchModeAsync()
        {
            Console.WriteLine("\n📚 Batch Processing");
            Console.WriteLine(new string('-', 30));
            
            var documents = new List<string>();
            Console.WriteLine("Enter documents to summarize (type 'done' when finished):");
            
            int i = 1;
            while (true)
            {
                Console.Write($"Document {i}: ");
                var text = Console.ReadLine();
                if (text?.ToLower() == "done") break;
                
                if (!string.IsNullOrWhiteSpace(text))
                {
                    documents.Add(text);
                    i++;
                }
            }
            
            if (!documents.Any())
            {
                Console.WriteLine("No documents entered.");
                return;
            }
            
            try
            {
                Console.Write("Summarization type (extractive/abstractive, default extractive): ");
                var summarizationType = Console.ReadLine();
                if (string.IsNullOrWhiteSpace(summarizationType)) summarizationType = "extractive";
                
                Console.WriteLine($"\nProcessing {documents.Count} documents...");
                var results = await _summarizer.BatchSummarizationAsync(documents, summarizationType);
                
                Console.WriteLine("\n✅ Batch Processing Results:");
                for (int j = 0; j < results.Count; j++)
                {
                    var result = results[j];
                    Console.WriteLine($"\nDocument {j + 1}:");
                    var preview = result.SummaryText.Length > 200 
                        ? result.SummaryText.Substring(0, 200) + "..." 
                        : result.SummaryText;
                    Console.WriteLine($"Summary: {preview}");
                    Console.WriteLine($"Processing time: {result.ProcessingTime:F2}s");
                }
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Batch processing failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Show processing statistics
        /// </summary>
        private void ShowStatistics()
        {
            Console.WriteLine("\n📊 Processing Statistics");
            Console.WriteLine(new string('-', 30));
            
            var stats = _summarizer.GetStatistics();
            
            Console.WriteLine($"Total requests: {stats.TotalRequests}");
            Console.WriteLine($"Successful requests: {stats.SuccessfulRequests}");
            Console.WriteLine($"Failed requests: {stats.FailedRequests}");
            Console.WriteLine($"Success rate: {stats.SuccessRatePercent:F1}%");
            Console.WriteLine($"Total characters processed: {stats.TotalCharactersProcessed:N0}");
            Console.WriteLine($"Average processing time: {stats.AverageProcessingTime:F2}s");
            Console.WriteLine($"Estimated cost: ${stats.EstimatedCostUsd:F4}");
        }
    }

    /// <summary>
    /// Main program entry point
    /// </summary>
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("Initializing Azure AI Text Summarizer...");
            
            try
            {
                // Check environment variables
                var endpoint = Environment.GetEnvironmentVariable("AZURE_LANGUAGE_ENDPOINT");
                var apiKey = Environment.GetEnvironmentVariable("AZURE_LANGUAGE_KEY");
                
                if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(apiKey))
                {
                    Console.WriteLine("Error: Please set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY environment variables");
                    return;
                }
                
                // Run interactive summarizer
                var interactive = new InteractiveSummarizer();
                await interactive.RunAsync();
                
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize: {ex.Message}");
            }
        }
    }
}

// Extension method for chunking (for older .NET versions)
public static class EnumerableExtensions
{
    public static IEnumerable<T[]> Chunk<T>(this IEnumerable<T> source, int size)
    {
        var chunk = new List<T>(size);
        foreach (var item in source)
        {
            chunk.Add(item);
            if (chunk.Count == size)
            {
                yield return chunk.ToArray();
                chunk.Clear();
            }
        }
        if (chunk.Count > 0)
        {
            yield return chunk.ToArray();
        }
    }
} 