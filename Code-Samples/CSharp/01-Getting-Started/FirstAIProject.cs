using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Azure;
using Azure.AI.TextAnalytics;

namespace FirstAIProject
{
    /// <summary>
    /// Your First AI Project - Text Analyzer
    /// =====================================
    /// 
    /// This application demonstrates how to use Azure AI Language services to:
    /// - Detect the language of input text
    /// - Analyze sentiment (positive, negative, neutral)
    /// - Extract key phrases and important information
    /// 
    /// Prerequisites:
    /// - Azure AI Language service created
    /// - Environment variables set:
    ///   - AZURE_LANGUAGE_ENDPOINT
    ///   - AZURE_LANGUAGE_KEY
    /// 
    /// Usage:
    ///     dotnet run
    /// </summary>
    class Program
    {
        private static TextAnalyticsClient CreateClient()
        {
            string endpoint = Environment.GetEnvironmentVariable("AZURE_LANGUAGE_ENDPOINT");
            string key = Environment.GetEnvironmentVariable("AZURE_LANGUAGE_KEY");
            
            if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(key))
            {
                Console.WriteLine("❌ Error: Missing environment variables");
                Console.WriteLine("Please set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY");
                Console.WriteLine("\nExample:");
                Console.WriteLine("set AZURE_LANGUAGE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/");
                Console.WriteLine("set AZURE_LANGUAGE_KEY=your-api-key-here");
                Environment.Exit(1);
            }
            
            try
            {
                return new TextAnalyticsClient(new Uri(endpoint), new AzureKeyCredential(key));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error creating client: {ex.Message}");
                Environment.Exit(1);
                return null; // This will never be reached
            }
        }
        
        private static async Task AnalyzeText(TextAnalyticsClient client, string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                Console.WriteLine("⚠️  Warning: Empty text provided");
                return;
            }
            
            // Truncate text if too long
            if (text.Length > 5000)
            {
                text = text.Substring(0, 5000);
                Console.WriteLine("⚠️  Warning: Text truncated to 5000 characters");
            }
            
            string displayText = text.Length > 50 ? text.Substring(0, 50) + "..." : text;
            Console.WriteLine($"\nAnalyzing: '{displayText}'");
            Console.WriteLine(new string('-', 60));
            
            try
            {
                // Language Detection
                Console.WriteLine("🔍 Detecting language...");
                Response<DetectedLanguage> languageResponse = await client.DetectLanguageAsync(text);
                DetectedLanguage language = languageResponse.Value;
                Console.WriteLine($"🌍 Language: {language.Name} (Confidence: {language.ConfidenceScore:F2})");
                
                // Sentiment Analysis
                Console.WriteLine("\n😊 Analyzing sentiment...");
                Response<DocumentSentiment> sentimentResponse = await client.AnalyzeSentimentAsync(text);
                DocumentSentiment sentiment = sentimentResponse.Value;
                
                // Choose appropriate emoji based on sentiment
                string emoji = sentiment.Sentiment switch
                {
                    TextSentiment.Positive => "😊",
                    TextSentiment.Negative => "😞",
                    TextSentiment.Neutral => "😐",
                    _ => "🤔"
                };
                
                Console.WriteLine($"{emoji} Overall Sentiment: {sentiment.Sentiment.ToString().ToUpper()}");
                Console.WriteLine($"   📈 Positive: {sentiment.ConfidenceScores.Positive:F2}");
                Console.WriteLine($"   ⚖️  Neutral:  {sentiment.ConfidenceScores.Neutral:F2}");
                Console.WriteLine($"   📉 Negative: {sentiment.ConfidenceScores.Negative:F2}");
                
                // Key Phrase Extraction
                Console.WriteLine("\n🔑 Extracting key phrases...");
                Response<KeyPhraseCollection> keyPhrasesResponse = await client.ExtractKeyPhrasesAsync(text);
                KeyPhraseCollection keyPhrases = keyPhrasesResponse.Value;
                
                if (keyPhrases.Count > 0)
                {
                    Console.WriteLine($"🎯 Key Phrases: {string.Join(", ", keyPhrases)}");
                }
                else
                {
                    Console.WriteLine("🎯 No key phrases detected");
                }
                
                Console.WriteLine(new string('=', 60));
            }
            catch (RequestFailedException ex)
            {
                if (ex.Status == 429)
                {
                    Console.WriteLine("⏰ Rate limit exceeded. Please wait a moment and try again.");
                }
                else if (ex.Status == 401)
                {
                    Console.WriteLine("🔐 Authentication failed. Please check your API key and endpoint.");
                }
                else
                {
                    Console.WriteLine($"❌ API Error: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Unexpected error: {ex.Message}");
            }
        }
        
        private static async Task RunSampleAnalysis(TextAnalyticsClient client)
        {
            Console.WriteLine("🚀 Running sample text analysis...");
            
            List<string> sampleTexts = new List<string>
            {
                "I absolutely love using Azure AI services! They make building intelligent applications incredibly easy and fun.",
                "The weather today is absolutely terrible and I'm feeling quite frustrated about the cancelled outdoor event.",
                "Microsoft Azure provides comprehensive cloud computing services including artificial intelligence, machine learning, and data analytics for businesses of all sizes.",
                "¡Hola! Me encanta la inteligencia artificial y todas sus aplicaciones innovadoras en el mundo moderno.",
                "こんにちは！AIサービスは本当に素晴らしいテクノロジーだと思います。",
                "This product is okay, nothing special but not bad either. It does what it's supposed to do."
            };
            
            for (int i = 0; i < sampleTexts.Count; i++)
            {
                Console.WriteLine($"\n📝 Sample {i + 1}/{sampleTexts.Count}:");
                await AnalyzeText(client, sampleTexts[i]);
                
                // Add small delay between requests to avoid rate limiting
                if (i < sampleTexts.Count - 1)
                {
                    await Task.Delay(1000);
                }
            }
        }
        
        private static async Task InteractiveMode(TextAnalyticsClient client)
        {
            Console.WriteLine("\n🎯 Interactive Mode - Try your own text!");
            Console.WriteLine("Enter text to analyze, or type 'quit' to exit.");
            Console.WriteLine("Tip: Try different languages, sentiments, and topics!");
            
            while (true)
            {
                try
                {
                    Console.Write("\n💬 Enter text: ");
                    string userInput = Console.ReadLine()?.Trim();
                    
                    if (string.IsNullOrEmpty(userInput))
                    {
                        Console.WriteLine("⚠️  Please enter some text to analyze.");
                        continue;
                    }
                    
                    if (userInput.ToLower() == "quit" || userInput.ToLower() == "exit" || userInput.ToLower() == "q")
                    {
                        Console.WriteLine("👋 Thanks for trying your first AI project!");
                        break;
                    }
                    
                    await AnalyzeText(client, userInput);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Error: {ex.Message}");
                }
            }
        }
        
        static async Task Main(string[] args)
        {
            Console.WriteLine(new string('=', 60));
            Console.WriteLine("🚀 Welcome to Your First AI Project!");
            Console.WriteLine("   Text Analyzer using Azure AI Language Services");
            Console.WriteLine(new string('=', 60));
            Console.WriteLine("\nThis application will demonstrate:");
            Console.WriteLine("✨ Language detection");
            Console.WriteLine("✨ Sentiment analysis");
            Console.WriteLine("✨ Key phrase extraction");
            Console.WriteLine();
            
            try
            {
                // Create the client
                Console.WriteLine("🔧 Initializing Azure AI client...");
                TextAnalyticsClient client = CreateClient();
                Console.WriteLine("✅ Client created successfully!");
                
                // Run sample analysis
                await RunSampleAnalysis(client);
                
                // Interactive mode
                await InteractiveMode(client);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Fatal error: {ex.Message}");
                Environment.Exit(1);
            }
        }
    }
} 