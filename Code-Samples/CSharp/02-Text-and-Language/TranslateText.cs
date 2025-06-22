using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Linq;

namespace AzureAI.TextTranslation
{
    /// <summary>
    /// Azure AI Translator - Text Translation Example
    /// 
    /// This example demonstrates how to use Azure AI Translator service to:
    /// - Detect language of input text
    /// - Translate text to multiple target languages
    /// - Handle various translation scenarios
    /// - Implement best practices for production use
    /// 
    /// Prerequisites:
    /// - .NET 6.0 or later
    /// - Set environment variables:
    ///   - TRANSLATOR_KEY: Your Translator resource key
    ///   - TRANSLATOR_ENDPOINT: Your Translator resource endpoint
    ///   - TRANSLATOR_REGION: Your Translator resource region
    /// </summary>
    
    public class DetectionResult
    {
        public string Language { get; set; } = string.Empty;
        public double Score { get; set; }
        public DetectionAlternative[]? Alternatives { get; set; }
    }
    
    public class DetectionAlternative
    {
        public string Language { get; set; } = string.Empty;
        public double Score { get; set; }
    }
    
    public class TranslationResult
    {
        public DetectedLanguage? DetectedLanguage { get; set; }
        public Translation[] Translations { get; set; } = Array.Empty<Translation>();
    }
    
    public class DetectedLanguage
    {
        public string Language { get; set; } = string.Empty;
        public double Score { get; set; }
    }
    
    public class Translation
    {
        public string Text { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public Alignment? Alignment { get; set; }
        public SentenceLength? SentLen { get; set; }
    }
    
    public class Alignment
    {
        public string Proj { get; set; } = string.Empty;
    }
    
    public class SentenceLength
    {
        public int[] SrcSentLen { get; set; } = Array.Empty<int>();
        public int[] TransSentLen { get; set; } = Array.Empty<int>();
    }
    
    public class TranslationHistory
    {
        public string Original { get; set; } = string.Empty;
        public string Translated { get; set; } = string.Empty;
        public string SourceLang { get; set; } = string.Empty;
        public string TargetLang { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
    
    public class AzureTranslator : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _key;
        private readonly string _endpoint;
        private readonly string _region;
        
        public AzureTranslator()
        {
            _key = Environment.GetEnvironmentVariable("TRANSLATOR_KEY") 
                ?? throw new InvalidOperationException("TRANSLATOR_KEY environment variable is required");
            _endpoint = Environment.GetEnvironmentVariable("TRANSLATOR_ENDPOINT") 
                ?? throw new InvalidOperationException("TRANSLATOR_ENDPOINT environment variable is required");
            _region = Environment.GetEnvironmentVariable("TRANSLATOR_REGION") 
                ?? throw new InvalidOperationException("TRANSLATOR_REGION environment variable is required");
            
            // Ensure endpoint ends with /
            if (!_endpoint.EndsWith("/"))
                _endpoint += "/";
            
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(_endpoint),
                Timeout = TimeSpan.FromSeconds(30)
            };
            
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _key);
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Region", _region);
            _httpClient.DefaultRequestHeaders.Add("X-ClientTraceId", Guid.NewGuid().ToString());
        }
        
        /// <summary>
        /// Detect the language of input text(s).
        /// </summary>
        /// <param name="texts">Text(s) to detect language for</param>
        /// <returns>Array of detection results</returns>
        public async Task<DetectionResult[]> DetectLanguageAsync(params string[] texts)
        {
            var body = texts.Select(text => new { text }).ToArray();
            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            try
            {
                var response = await _httpClient.PostAsync("detect?api-version=3.0", content);
                response.EnsureSuccessStatusCode();
                
                var responseBody = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<DetectionResult[]>(responseBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? Array.Empty<DetectionResult>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error detecting language: {ex.Message}");
                return Array.Empty<DetectionResult>();
            }
        }
        
        /// <summary>
        /// Translate text to target language(s).
        /// </summary>
        /// <param name="texts">Text(s) to translate</param>
        /// <param name="targetLanguages">Target language codes</param>
        /// <param name="sourceLanguage">Source language code (optional)</param>
        /// <param name="textType">Text type: 'plain' or 'html'</param>
        /// <param name="includeAlignment">Include word alignment information</param>
        /// <returns>Array of translation results</returns>
        public async Task<TranslationResult[]> TranslateTextAsync(
            string[] texts,
            string[] targetLanguages,
            string? sourceLanguage = null,
            string textType = "plain",
            bool includeAlignment = false)
        {
            var body = texts.Select(text => new { text }).ToArray();
            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            // Build query parameters
            var queryParams = new List<string>
            {
                "api-version=3.0"
            };
            
            foreach (var lang in targetLanguages)
            {
                queryParams.Add($"to={lang}");
            }
            
            if (!string.IsNullOrEmpty(sourceLanguage))
                queryParams.Add($"from={sourceLanguage}");
            
            if (textType != "plain")
                queryParams.Add($"textType={textType}");
            
            if (includeAlignment)
                queryParams.Add("includeAlignment=true");
            
            var queryString = string.Join("&", queryParams);
            
            try
            {
                var response = await _httpClient.PostAsync($"translate?{queryString}", content);
                response.EnsureSuccessStatusCode();
                
                var responseBody = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<TranslationResult[]>(responseBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? Array.Empty<TranslationResult>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error translating text: {ex.Message}");
                return Array.Empty<TranslationResult>();
            }
        }
        
        /// <summary>
        /// Get list of supported languages.
        /// </summary>
        /// <param name="scope">Scope: 'translation', 'transliteration', or 'dictionary'</param>
        /// <returns>Dictionary of supported languages</returns>
        public async Task<Dictionary<string, object>?> GetSupportedLanguagesAsync(string scope = "translation")
        {
            try
            {
                var response = await _httpClient.GetAsync($"languages?api-version=3.0&scope={scope}");
                response.EnsureSuccessStatusCode();
                
                var responseBody = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<Dictionary<string, object>>(responseBody);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting supported languages: {ex.Message}");
                return null;
            }
        }
        
        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
    
    public class TranslationApp
    {
        private readonly AzureTranslator _translator;
        private readonly List<TranslationHistory> _translationHistory;
        
        public TranslationApp()
        {
            _translator = new AzureTranslator();
            _translationHistory = new List<TranslationHistory>();
        }
        
        /// <summary>
        /// Detect and display language information for text.
        /// </summary>
        public async Task<string?> DetectAndDisplayLanguageAsync(string text)
        {
            var preview = text.Length > 50 ? text[..50] + "..." : text;
            Console.WriteLine($"\n🔍 Detecting language for: '{preview}'");
            
            var results = await _translator.DetectLanguageAsync(text);
            if (results.Length > 0)
            {
                var detection = results[0];
                Console.WriteLine($"   Language: {detection.Language}");
                Console.WriteLine($"   Confidence: {detection.Score:P1}");
                
                if (detection.Alternatives?.Length > 0)
                {
                    Console.WriteLine("   Alternatives:");
                    foreach (var alt in detection.Alternatives.Take(3))
                    {
                        Console.WriteLine($"     - {alt.Language}: {alt.Score:P1}");
                    }
                }
                
                return detection.Language;
            }
            return null;
        }
        
        /// <summary>
        /// Translate text and display results.
        /// </summary>
        public async Task TranslateAndDisplayAsync(string text, string[] targetLanguages, string? sourceLanguage = null)
        {
            Console.WriteLine($"\n🌍 Translating to: {string.Join(", ", targetLanguages)}");
            
            var results = await _translator.TranslateTextAsync(
                new[] { text },
                targetLanguages,
                sourceLanguage,
                includeAlignment: true
            );
            
            if (results.Length > 0)
            {
                foreach (var result in results)
                {
                    if (result.DetectedLanguage != null)
                    {
                        Console.WriteLine($"   Detected: {result.DetectedLanguage.Language} (confidence: {result.DetectedLanguage.Score:P1})");
                    }
                    
                    Console.WriteLine($"   Original: {text}");
                    
                    foreach (var translation in result.Translations)
                    {
                        Console.WriteLine($"   {translation.To.ToUpper()}: {translation.Text}");
                        
                        // Store in history
                        _translationHistory.Add(new TranslationHistory
                        {
                            Original = text,
                            Translated = translation.Text,
                            SourceLang = sourceLanguage ?? result.DetectedLanguage?.Language ?? "unknown",
                            TargetLang = translation.To,
                            Timestamp = DateTime.Now
                        });
                    }
                }
            }
        }
        
        /// <summary>
        /// Demonstrate basic text translation.
        /// </summary>
        public async Task DemonstrateBasicTranslationAsync()
        {
            Console.WriteLine("\n" + new string('=', 50));
            Console.WriteLine("🚀 BASIC TRANSLATION DEMO");
            Console.WriteLine(new string('=', 50));
            
            // Single language translation
            var text = "Hello, how are you today?";
            await TranslateAndDisplayAsync(text, new[] { "es", "fr", "de" });
            
            // Multiple texts
            var texts = new[]
            {
                "Good morning!",
                "Thank you for your help.",
                "See you later!"
            };
            
            Console.WriteLine("\n📝 Translating multiple texts to Spanish:");
            foreach (var testText in texts)
            {
                var results = await _translator.TranslateTextAsync(new[] { testText }, new[] { "es" });
                if (results.Length > 0 && results[0].Translations.Length > 0)
                {
                    var translation = results[0].Translations[0].Text;
                    Console.WriteLine($"   EN: {testText}");
                    Console.WriteLine($"   ES: {translation}");
                }
            }
        }
        
        /// <summary>
        /// Demonstrate language detection capabilities.
        /// </summary>
        public async Task DemonstrateLanguageDetectionAsync()
        {
            Console.WriteLine("\n" + new string('=', 50));
            Console.WriteLine("🔍 LANGUAGE DETECTION DEMO");
            Console.WriteLine(new string('=', 50));
            
            var multilingualTexts = new[]
            {
                "Hello, how are you?",
                "Bonjour, comment allez-vous?",
                "Hola, ¿cómo estás?",
                "Guten Tag, wie geht es Ihnen?",
                "こんにちは、元気ですか？",
                "Привет, как дела?",
                "مرحبا، كيف حالك؟"
            };
            
            foreach (var text in multilingualTexts)
            {
                await DetectAndDisplayLanguageAsync(text);
            }
        }
        
        /// <summary>
        /// Demonstrate HTML content translation.
        /// </summary>
        public async Task DemonstrateHtmlTranslationAsync()
        {
            Console.WriteLine("\n" + new string('=', 50));
            Console.WriteLine("🌐 HTML TRANSLATION DEMO");
            Console.WriteLine(new string('=', 50));
            
            var htmlContent = @"
        <h1>Welcome to our website!</h1>
        <p>We offer <strong>amazing products</strong> at great prices.</p>
        <p>Contact us at <a href=""mailto:info@example.com"">info@example.com</a></p>
        ";
            
            Console.WriteLine("Original HTML:");
            Console.WriteLine(htmlContent);
            
            var results = await _translator.TranslateTextAsync(
                new[] { htmlContent },
                new[] { "es" },
                textType: "html"
            );
            
            if (results.Length > 0 && results[0].Translations.Length > 0)
            {
                var translatedHtml = results[0].Translations[0].Text;
                Console.WriteLine("\nTranslated HTML (Spanish):");
                Console.WriteLine(translatedHtml);
            }
        }
        
        /// <summary>
        /// Demonstrate real-world business scenarios.
        /// </summary>
        public async Task DemonstrateBusinessScenariosAsync()
        {
            Console.WriteLine("\n" + new string('=', 50));
            Console.WriteLine("💼 BUSINESS SCENARIOS DEMO");
            Console.WriteLine(new string('=', 50));
            
            // Customer support scenario
            Console.WriteLine("\n📞 Customer Support Scenario:");
            var customerMessage = "I'm having trouble with my order. Can you help me track it?";
            await TranslateAndDisplayAsync(customerMessage, new[] { "es", "fr", "de" });
            
            // Product description scenario
            Console.WriteLine("\n🛍️ Product Description Scenario:");
            var productDesc = "Premium wireless headphones with noise cancellation and 30-hour battery life.";
            await TranslateAndDisplayAsync(productDesc, new[] { "ja", "ko", "zh" });
            
            // Legal disclaimer scenario
            Console.WriteLine("\n⚖️ Legal Disclaimer Scenario:");
            var disclaimer = "By using this service, you agree to our terms and conditions.";
            await TranslateAndDisplayAsync(disclaimer, new[] { "pt", "it", "nl" });
        }
        
        /// <summary>
        /// Demonstrate error handling scenarios.
        /// </summary>
        public async Task DemonstrateErrorHandlingAsync()
        {
            Console.WriteLine("\n" + new string('=', 50));
            Console.WriteLine("⚠️ ERROR HANDLING DEMO");
            Console.WriteLine(new string('=', 50));
            
            // Invalid language code
            Console.WriteLine("\n❌ Testing invalid language code:");
            var results1 = await _translator.TranslateTextAsync(new[] { "Hello" }, new[] { "invalid_lang" });
            if (results1.Length == 0)
            {
                Console.WriteLine("   Handled invalid language code gracefully");
            }
            
            // Empty text
            Console.WriteLine("\n❌ Testing empty text:");
            var results2 = await _translator.TranslateTextAsync(new[] { "" }, new[] { "es" });
            Console.WriteLine($"   Empty text result: {JsonSerializer.Serialize(results2)}");
            
            // Very long text (testing limits)
            Console.WriteLine("\n❌ Testing very long text:");
            var longText = string.Concat(Enumerable.Repeat("This is a test. ", 1000));
            Console.WriteLine($"   Text length: {longText.Length} characters");
            var results3 = await _translator.TranslateTextAsync(new[] { longText[..5000] }, new[] { "es" });
            if (results3.Length > 0)
            {
                Console.WriteLine("   Successfully handled long text");
            }
        }
        
        /// <summary>
        /// Display translation history.
        /// </summary>
        public void ShowTranslationHistory()
        {
            Console.WriteLine("\n" + new string('=', 50));
            Console.WriteLine("📚 TRANSLATION HISTORY");
            Console.WriteLine(new string('=', 50));
            
            if (_translationHistory.Count == 0)
            {
                Console.WriteLine("No translations in history.");
                return;
            }
            
            var recentHistory = _translationHistory.TakeLast(5).ToList();
            for (int i = 0; i < recentHistory.Count; i++)
            {
                var translation = recentHistory[i];
                Console.WriteLine($"\n{i + 1}. [{translation.Timestamp:yyyy-MM-dd HH:mm:ss}]");
                Console.WriteLine($"   {translation.SourceLang} → {translation.TargetLang}");
                
                var originalPreview = translation.Original.Length > 50 
                    ? translation.Original[..50] + "..." 
                    : translation.Original;
                var translatedPreview = translation.Translated.Length > 50 
                    ? translation.Translated[..50] + "..." 
                    : translation.Translated;
                
                Console.WriteLine($"   Original: {originalPreview}");
                Console.WriteLine($"   Translation: {translatedPreview}");
            }
        }
        
        /// <summary>
        /// Run interactive translation mode.
        /// </summary>
        public async Task InteractiveModeAsync()
        {
            Console.WriteLine("\n" + new string('=', 50));
            Console.WriteLine("🎯 INTERACTIVE TRANSLATION MODE");
            Console.WriteLine(new string('=', 50));
            Console.WriteLine("Commands:");
            Console.WriteLine("  - Type text to translate");
            Console.WriteLine("  - 'lang:XX' to set target language (e.g., 'lang:es')");
            Console.WriteLine("  - 'detect' to detect language of next input");
            Console.WriteLine("  - 'history' to show translation history");
            Console.WriteLine("  - 'quit' to exit");
            
            var targetLang = "es"; // Default to Spanish
            var detectMode = false;
            
            while (true)
            {
                try
                {
                    Console.Write($"\n[Target: {targetLang}] Enter text: ");
                    var userInput = Console.ReadLine()?.Trim();
                    
                    if (string.IsNullOrEmpty(userInput))
                        continue;
                    
                    if (userInput.Equals("quit", StringComparison.OrdinalIgnoreCase))
                        break;
                    
                    if (userInput.Equals("history", StringComparison.OrdinalIgnoreCase))
                    {
                        ShowTranslationHistory();
                        continue;
                    }
                    
                    if (userInput.Equals("detect", StringComparison.OrdinalIgnoreCase))
                    {
                        detectMode = true;
                        Console.WriteLine("Language detection mode enabled for next input.");
                        continue;
                    }
                    
                    if (userInput.StartsWith("lang:", StringComparison.OrdinalIgnoreCase))
                    {
                        targetLang = userInput[5..].Trim();
                        Console.WriteLine($"Target language set to: {targetLang}");
                        continue;
                    }
                    
                    if (detectMode)
                    {
                        await DetectAndDisplayLanguageAsync(userInput);
                        detectMode = false;
                    }
                    else
                    {
                        await TranslateAndDisplayAsync(userInput, new[] { targetLang });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error: {ex.Message}");
                }
            }
        }
        
        public void Dispose()
        {
            _translator?.Dispose();
        }
    }
    
    class Program
    {
        /// <summary>
        /// Main function demonstrating Azure AI Translator capabilities.
        /// </summary>
        static async Task Main(string[] args)
        {
            Console.WriteLine("🌍 Azure AI Translator - Text Translation Demo");
            Console.WriteLine(new string('=', 60));
            
            try
            {
                using var app = new TranslationApp();
                
                // Check if we can connect to the service
                var languages = await app._translator.GetSupportedLanguagesAsync();
                if (languages?.ContainsKey("translation") == true)
                {
                    var translationData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                        JsonSerializer.Serialize(languages["translation"]));
                    Console.WriteLine($"✅ Connected! Supports {translationData?.Count ?? 0} languages for translation");
                }
                else
                {
                    Console.WriteLine("❌ Failed to connect to Azure Translator service");
                    return;
                }
                
                // Run demonstrations
                await app.DemonstrateBasicTranslationAsync();
                await app.DemonstrateLanguageDetectionAsync();
                await app.DemonstrateHtmlTranslationAsync();
                await app.DemonstrateBusinessScenariosAsync();
                await app.DemonstrateErrorHandlingAsync();
                app.ShowTranslationHistory();
                
                // Ask if user wants interactive mode
                Console.WriteLine("\n" + new string('=', 50));
                Console.Write("Would you like to try interactive mode? (y/n): ");
                var response = Console.ReadLine()?.Trim().ToLower();
                if (response == "y" || response == "yes")
                {
                    await app.InteractiveModeAsync();
                }
                
                Console.WriteLine("\n🎉 Demo completed successfully!");
                Console.WriteLine("\nKey takeaways:");
                Console.WriteLine("✅ Text translation to multiple languages");
                Console.WriteLine("✅ Automatic language detection");
                Console.WriteLine("✅ HTML content translation");
                Console.WriteLine("✅ Error handling and edge cases");
                Console.WriteLine("✅ Production-ready patterns");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error running demo: {ex.Message}");
                Console.WriteLine("\nPlease check your environment variables:");
                Console.WriteLine("- TRANSLATOR_KEY");
                Console.WriteLine("- TRANSLATOR_ENDPOINT");
                Console.WriteLine("- TRANSLATOR_REGION");
            }
        }
    }
} 