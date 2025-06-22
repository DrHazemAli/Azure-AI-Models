using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Azure.CognitiveServices.Vision.ComputerVision;
using Microsoft.Azure.CognitiveServices.Vision.ComputerVision.Models;

namespace AzureAIModels.VisionAndImages
{
    /// <summary>
    /// Azure Computer Vision - Image Analysis
    /// =====================================
    /// 
    /// This class demonstrates how to analyze images using Azure Computer Vision service.
    /// It includes image tagging, content moderation, and image categorization.
    /// 
    /// Prerequisites:
    /// - Azure Computer Vision service
    /// - .NET 6.0+
    /// - Required packages: Microsoft.Azure.CognitiveServices.Vision.ComputerVision
    /// 
    /// Author: Azure AI Models Course
    /// Repository: https://github.com/DrHazemAli/Azure-AI-Models
    /// </summary>
    public class ImageAnalyzer
    {
        private readonly ComputerVisionClient _client;

        /// <summary>
        /// Azure Computer Vision Image Analyzer
        /// </summary>
        /// <param name="endpoint">Azure Computer Vision endpoint</param>
        /// <param name="key">Azure Computer Vision API key</param>
        public ImageAnalyzer(string endpoint, string key)
        {
            _client = new ComputerVisionClient(new ApiKeyServiceClientCredentials(key))
            {
                Endpoint = endpoint
            };
        }

        /// <summary>
        /// Analyze an image from URL
        /// </summary>
        /// <param name="imageUrl">URL of the image to analyze</param>
        /// <returns>Analysis results</returns>
        public async Task<ImageAnalysisResult> AnalyzeImageFromUrlAsync(string imageUrl)
        {
            try
            {
                Console.WriteLine($"🔍 Analyzing image from URL: {imageUrl}");

                // Define the features to extract
                var visualFeatures = new List<VisualFeatureTypes?>
                {
                    VisualFeatureTypes.Tags,
                    VisualFeatureTypes.Categories,
                    VisualFeatureTypes.Description,
                    VisualFeatureTypes.Faces,
                    VisualFeatureTypes.ImageType,
                    VisualFeatureTypes.Color,
                    VisualFeatureTypes.Adult
                };

                // Analyze the image
                var analysis = await _client.AnalyzeImageAsync(imageUrl, visualFeatures);

                return ProcessAnalysisResults(analysis);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error analyzing image from URL: {ex.Message}");
                return new ImageAnalysisResult();
            }
        }

        /// <summary>
        /// Analyze an image from local file
        /// </summary>
        /// <param name="imagePath">Path to the local image file</param>
        /// <returns>Analysis results</returns>
        public async Task<ImageAnalysisResult> AnalyzeImageFromFileAsync(string imagePath)
        {
            try
            {
                Console.WriteLine($"🔍 Analyzing local image file: {imagePath}");

                // Read the image file
                using var imageStream = File.OpenRead(imagePath);

                // Define the features to extract
                var visualFeatures = new List<VisualFeatureTypes?>
                {
                    VisualFeatureTypes.Tags,
                    VisualFeatureTypes.Categories,
                    VisualFeatureTypes.Description,
                    VisualFeatureTypes.Faces,
                    VisualFeatureTypes.ImageType,
                    VisualFeatureTypes.Color,
                    VisualFeatureTypes.Adult
                };

                // Analyze the image
                var analysis = await _client.AnalyzeImageInStreamAsync(imageStream, visualFeatures);

                return ProcessAnalysisResults(analysis);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error analyzing image from file: {ex.Message}");
                return new ImageAnalysisResult();
            }
        }

        /// <summary>
        /// Process and format the analysis results
        /// </summary>
        /// <param name="analysis">Raw analysis results</param>
        /// <returns>Formatted results</returns>
        private ImageAnalysisResult ProcessAnalysisResults(ImageAnalysis analysis)
        {
            var result = new ImageAnalysisResult();

            // Process tags
            if (analysis.Tags != null)
            {
                result.Tags = analysis.Tags.Select(tag => new ImageTag
                {
                    Name = tag.Name,
                    Confidence = tag.Confidence,
                    Hint = tag.Hint
                }).ToList();
            }

            // Process categories
            if (analysis.Categories != null)
            {
                result.Categories = analysis.Categories.Select(category => new ImageCategory
                {
                    Name = category.Name,
                    Score = category.Score,
                    Detail = category.Detail
                }).ToList();
            }

            // Process description
            if (analysis.Description?.Captions != null && analysis.Description.Captions.Any())
            {
                var caption = analysis.Description.Captions.First();
                result.Description = caption.Text;
                result.DescriptionConfidence = caption.Confidence;
            }

            // Process faces
            if (analysis.Faces != null)
            {
                result.Faces = analysis.Faces.Select(face => new DetectedFace
                {
                    Age = face.Age,
                    Gender = face.Gender,
                    FaceRectangle = new FaceRectangle
                    {
                        Left = face.FaceRectangle.Left,
                        Top = face.FaceRectangle.Top,
                        Width = face.FaceRectangle.Width,
                        Height = face.FaceRectangle.Height
                    }
                }).ToList();
            }

            // Process image type
            if (analysis.ImageType != null)
            {
                result.ImageType = new ImageTypeInfo
                {
                    ClipArtType = analysis.ImageType.ClipArtType,
                    LineDrawingType = analysis.ImageType.LineDrawingType
                };
            }

            // Process colors
            if (analysis.Color != null)
            {
                result.Colors = new ColorInfo
                {
                    DominantColors = analysis.Color.DominantColors?.ToList(),
                    DominantColorForeground = analysis.Color.DominantColorForeground,
                    DominantColorBackground = analysis.Color.DominantColorBackground,
                    AccentColor = analysis.Color.AccentColor,
                    IsBlackAndWhite = analysis.Color.IsBwImg ?? false
                };
            }

            // Process adult content
            if (analysis.Adult != null)
            {
                result.AdultContent = new AdultContentInfo
                {
                    IsAdultContent = analysis.Adult.IsAdultContent ?? false,
                    IsRacyContent = analysis.Adult.IsRacyContent ?? false,
                    IsGoryContent = analysis.Adult.IsGoryContent ?? false,
                    AdultScore = analysis.Adult.AdultScore ?? 0,
                    RacyScore = analysis.Adult.RacyScore ?? 0,
                    GoreScore = analysis.Adult.GoreScore ?? 0
                };
            }

            return result;
        }

        /// <summary>
        /// Print formatted analysis results
        /// </summary>
        /// <param name="results">Analysis results to print</param>
        public void PrintAnalysisResults(ImageAnalysisResult results)
        {
            Console.WriteLine(new string('=', 60));
            Console.WriteLine("AZURE COMPUTER VISION - IMAGE ANALYSIS RESULTS");
            Console.WriteLine(new string('=', 60));

            // Print description
            if (!string.IsNullOrEmpty(results.Description))
            {
                Console.WriteLine($"\n📝 Description: {results.Description}");
                if (results.DescriptionConfidence.HasValue)
                {
                    Console.WriteLine($"   Confidence: {results.DescriptionConfidence:P1}");
                }
            }

            // Print tags
            if (results.Tags?.Any() == true)
            {
                Console.WriteLine($"\n🏷️  Tags ({results.Tags.Count} found):");
                foreach (var tag in results.Tags.Take(10))
                {
                    Console.WriteLine($"   • {tag.Name} (Confidence: {tag.Confidence:P1})");
                }
            }

            // Print categories
            if (results.Categories?.Any() == true)
            {
                Console.WriteLine($"\n📂 Categories ({results.Categories.Count} found):");
                foreach (var category in results.Categories.Take(5))
                {
                    Console.WriteLine($"   • {category.Name} (Score: {category.Score:P1})");
                }
            }

            // Print faces
            if (results.Faces?.Any() == true)
            {
                Console.WriteLine($"\n👥 Faces ({results.Faces.Count} detected):");
                for (int i = 0; i < results.Faces.Count; i++)
                {
                    var face = results.Faces[i];
                    Console.WriteLine($"   Face {i + 1}: {face.Age} years old, {face.Gender}");
                }
            }

            // Print colors
            if (results.Colors != null)
            {
                Console.WriteLine($"\n🎨 Colors:");
                Console.WriteLine($"   Dominant Colors: {(results.Colors.DominantColors?.Any() == true ? string.Join(", ", results.Colors.DominantColors) : "N/A")}");
                Console.WriteLine($"   Foreground: {results.Colors.DominantColorForeground ?? "N/A"}");
                Console.WriteLine($"   Background: {results.Colors.DominantColorBackground ?? "N/A"}");
                Console.WriteLine($"   Accent Color: {results.Colors.AccentColor ?? "N/A"}");
                Console.WriteLine($"   Black & White: {results.Colors.IsBlackAndWhite}");
            }

            // Print adult content warning
            if (results.AdultContent != null)
            {
                var adult = results.AdultContent;
                if (adult.IsAdultContent || adult.IsRacyContent || adult.IsGoryContent)
                {
                    Console.WriteLine($"\n⚠️  Content Warning:");
                    if (adult.IsAdultContent)
                    {
                        Console.WriteLine($"   Adult Content: {adult.AdultScore:P1}");
                    }
                    if (adult.IsRacyContent)
                    {
                        Console.WriteLine($"   Racy Content: {adult.RacyScore:P1}");
                    }
                    if (adult.IsGoryContent)
                    {
                        Console.WriteLine($"   Gory Content: {adult.GoreScore:P1}");
                    }
                }
            }

            Console.WriteLine($"\n{new string('=', 60)}");
        }

        /// <summary>
        /// Get image analysis with detailed error handling
        /// </summary>
        /// <param name="imageSource">URL or file path</param>
        /// <param name="isUrl">Whether the source is a URL</param>
        /// <returns>Analysis results</returns>
        public async Task<ImageAnalysisResult> GetImageAnalysisAsync(string imageSource, bool isUrl = true)
        {
            try
            {
                return isUrl 
                    ? await AnalyzeImageFromUrlAsync(imageSource)
                    : await AnalyzeImageFromFileAsync(imageSource);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error analyzing image: {ex.Message}");
                return new ImageAnalysisResult();
            }
        }
    }

    /// <summary>
    /// Result models for image analysis
    /// </summary>
    public class ImageAnalysisResult
    {
        public List<ImageTag> Tags { get; set; } = new();
        public List<ImageCategory> Categories { get; set; } = new();
        public string Description { get; set; } = string.Empty;
        public double? DescriptionConfidence { get; set; }
        public List<DetectedFace> Faces { get; set; } = new();
        public ImageTypeInfo ImageType { get; set; } = new();
        public ColorInfo Colors { get; set; } = new();
        public AdultContentInfo AdultContent { get; set; } = new();
    }

    public class ImageTag
    {
        public string Name { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string Hint { get; set; } = string.Empty;
    }

    public class ImageCategory
    {
        public string Name { get; set; } = string.Empty;
        public double Score { get; set; }
        public CategoryDetail Detail { get; set; } = new();
    }

    public class CategoryDetail
    {
        public List<Celebrity> Celebrities { get; set; } = new();
        public List<Landmark> Landmarks { get; set; } = new();
    }

    public class Celebrity
    {
        public string Name { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public FaceRectangle FaceRectangle { get; set; } = new();
    }

    public class Landmark
    {
        public string Name { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }

    public class DetectedFace
    {
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        public FaceRectangle FaceRectangle { get; set; } = new();
    }

    public class FaceRectangle
    {
        public int Left { get; set; }
        public int Top { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
    }

    public class ImageTypeInfo
    {
        public int ClipArtType { get; set; }
        public int LineDrawingType { get; set; }
    }

    public class ColorInfo
    {
        public List<string> DominantColors { get; set; } = new();
        public string DominantColorForeground { get; set; } = string.Empty;
        public string DominantColorBackground { get; set; } = string.Empty;
        public string AccentColor { get; set; } = string.Empty;
        public bool IsBlackAndWhite { get; set; }
    }

    public class AdultContentInfo
    {
        public bool IsAdultContent { get; set; }
        public bool IsRacyContent { get; set; }
        public bool IsGoryContent { get; set; }
        public double AdultScore { get; set; }
        public double RacyScore { get; set; }
        public double GoreScore { get; set; }
    }

    /// <summary>
    /// Main program class
    /// </summary>
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // Configuration - Replace with your Azure Computer Vision credentials
            var endpoint = Environment.GetEnvironmentVariable("AZURE_COMPUTER_VISION_ENDPOINT");
            var key = Environment.GetEnvironmentVariable("AZURE_COMPUTER_VISION_KEY");

            if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(key))
            {
                Console.WriteLine("❌ Error: Please set AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY environment variables");
                Console.WriteLine("You can get these from your Azure Computer Vision resource in the Azure portal");
                return;
            }

            // Initialize the analyzer
            var analyzer = new ImageAnalyzer(endpoint, key);

            // Example 1: Analyze image from URL
            Console.WriteLine("🔍 Example 1: Analyzing image from URL");
            var imageUrl = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/landmark.jpg";
            
            var results = await analyzer.AnalyzeImageFromUrlAsync(imageUrl);
            analyzer.PrintAnalysisResults(results);

            // Example 2: Analyze local image file (if available)
            var localImagePath = "sample_image.jpg";
            if (File.Exists(localImagePath))
            {
                Console.WriteLine($"\n🔍 Example 2: Analyzing local image file: {localImagePath}");
                var localResults = await analyzer.AnalyzeImageFromFileAsync(localImagePath);
                analyzer.PrintAnalysisResults(localResults);
            }
            else
            {
                Console.WriteLine($"\n📝 Note: Local image file '{localImagePath}' not found. Skipping local file analysis.");
                Console.WriteLine("   You can add your own image file to test local analysis.");
            }

            // Example 3: Batch analysis of multiple images
            Console.WriteLine("\n🔍 Example 3: Batch Image Analysis");
            var sampleImages = new[]
            {
                "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/landmark.jpg",
                "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/faces.jpg"
            };

            for (int i = 0; i < sampleImages.Length; i++)
            {
                Console.WriteLine($"\n--- Analyzing Image {i + 1}/{sampleImages.Length} ---");
                var batchResults = await analyzer.AnalyzeImageFromUrlAsync(sampleImages[i]);
                analyzer.PrintAnalysisResults(batchResults);
                
                // Add delay between requests to avoid rate limiting
                if (i < sampleImages.Length - 1)
                {
                    await Task.Delay(1000);
                }
            }
        }
    }
} 