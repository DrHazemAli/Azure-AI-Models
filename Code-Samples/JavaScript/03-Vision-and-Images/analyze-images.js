/**
 * Azure Computer Vision - Image Analysis
 * =====================================
 * 
 * This script demonstrates how to analyze images using Azure Computer Vision service.
 * It includes image tagging, content moderation, and image categorization.
 * 
 * Prerequisites:
 * - Azure Computer Vision service
 * - Node.js 14+
 * - Required packages: @azure/cognitiveservices-computervision, axios
 * 
 * Author: Azure AI Models Course
 * Repository: https://github.com/DrHazemAli/Azure-AI-Models
 */

const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;
const fs = require('fs').promises;
const axios = require('axios');

class ImageAnalyzer {
    /**
     * Azure Computer Vision Image Analyzer
     * @param {string} endpoint - Azure Computer Vision endpoint
     * @param {string} key - Azure Computer Vision API key
     */
    constructor(endpoint, key) {
        const computerVisionClient = new ComputerVisionClient(
            new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }),
            endpoint
        );
        this.client = computerVisionClient;
    }

    /**
     * Analyze an image from URL
     * @param {string} imageUrl - URL of the image to analyze
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeImageFromUrl(imageUrl) {
        try {
            console.log(`🔍 Analyzing image from URL: ${imageUrl}`);

            // Define the features to extract
            const visualFeatures = [
                'Tags',
                'Categories',
                'Description',
                'Faces',
                'ImageType',
                'Color',
                'Adult'
            ];

            // Analyze the image
            const analysis = await this.client.analyzeImage(imageUrl, {
                visualFeatures: visualFeatures
            });

            return this.processAnalysisResults(analysis);
        } catch (error) {
            console.error('Error analyzing image from URL:', error.message);
            return {};
        }
    }

    /**
     * Analyze an image from local file
     * @param {string} imagePath - Path to the local image file
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeImageFromFile(imagePath) {
        try {
            console.log(`🔍 Analyzing local image file: ${imagePath}`);

            // Read the image file
            const imageBuffer = await fs.readFile(imagePath);

            // Define the features to extract
            const visualFeatures = [
                'Tags',
                'Categories',
                'Description',
                'Faces',
                'ImageType',
                'Color',
                'Adult'
            ];

            // Analyze the image
            const analysis = await this.client.analyzeImageInStream(imageBuffer, {
                visualFeatures: visualFeatures
            });

            return this.processAnalysisResults(analysis);
        } catch (error) {
            console.error('Error analyzing image from file:', error.message);
            return {};
        }
    }

    /**
     * Process and format the analysis results
     * @param {Object} analysis - Raw analysis results
     * @returns {Object} Formatted results
     */
    processAnalysisResults(analysis) {
        const results = {
            tags: [],
            categories: [],
            description: '',
            faces: [],
            imageType: {},
            colors: {},
            adultContent: {},
            confidenceScores: {}
        };

        // Process tags
        if (analysis.tags) {
            results.tags = analysis.tags.map(tag => ({
                name: tag.name,
                confidence: tag.confidence,
                hint: tag.hint || null
            }));
        }

        // Process categories
        if (analysis.categories) {
            results.categories = analysis.categories.map(category => ({
                name: category.name,
                score: category.score,
                detail: category.detail || null
            }));
        }

        // Process description
        if (analysis.description && analysis.description.captions && analysis.description.captions.length > 0) {
            results.description = analysis.description.captions[0].text;
            results.confidenceScores.description = analysis.description.captions[0].confidence;
        }

        // Process faces
        if (analysis.faces) {
            results.faces = analysis.faces.map(face => ({
                age: face.age,
                gender: face.gender,
                faceRectangle: {
                    left: face.faceRectangle.left,
                    top: face.faceRectangle.top,
                    width: face.faceRectangle.width,
                    height: face.faceRectangle.height
                }
            }));
        }

        // Process image type
        if (analysis.imageType) {
            results.imageType = {
                clipArtType: analysis.imageType.clipArtType,
                lineDrawingType: analysis.imageType.lineDrawingType
            };
        }

        // Process colors
        if (analysis.color) {
            results.colors = {
                dominantColors: analysis.color.dominantColors,
                dominantColorForeground: analysis.color.dominantColorForeground,
                dominantColorBackground: analysis.color.dominantColorBackground,
                accentColor: analysis.color.accentColor,
                isBwImg: analysis.color.isBwImg
            };
        }

        // Process adult content
        if (analysis.adult) {
            results.adultContent = {
                isAdultContent: analysis.adult.isAdultContent,
                isRacyContent: analysis.adult.isRacyContent,
                isGoryContent: analysis.adult.isGoryContent,
                adultScore: analysis.adult.adultScore,
                racyScore: analysis.adult.racyScore,
                goreScore: analysis.adult.goreScore
            };
        }

        return results;
    }

    /**
     * Print formatted analysis results
     * @param {Object} results - Analysis results to print
     */
    printAnalysisResults(results) {
        console.log('='.repeat(60));
        console.log('AZURE COMPUTER VISION - IMAGE ANALYSIS RESULTS');
        console.log('='.repeat(60));

        // Print description
        if (results.description) {
            console.log(`\n📝 Description: ${results.description}`);
            if (results.confidenceScores.description) {
                console.log(`   Confidence: ${(results.confidenceScores.description * 100).toFixed(1)}%`);
            }
        }

        // Print tags
        if (results.tags && results.tags.length > 0) {
            console.log(`\n🏷️  Tags (${results.tags.length} found):`);
            results.tags.slice(0, 10).forEach(tag => {
                console.log(`   • ${tag.name} (Confidence: ${(tag.confidence * 100).toFixed(1)}%)`);
            });
        }

        // Print categories
        if (results.categories && results.categories.length > 0) {
            console.log(`\n📂 Categories (${results.categories.length} found):`);
            results.categories.slice(0, 5).forEach(category => {
                console.log(`   • ${category.name} (Score: ${(category.score * 100).toFixed(1)}%)`);
            });
        }

        // Print faces
        if (results.faces && results.faces.length > 0) {
            console.log(`\n👥 Faces (${results.faces.length} detected):`);
            results.faces.forEach((face, index) => {
                console.log(`   Face ${index + 1}: ${face.age} years old, ${face.gender}`);
            });
        }

        // Print colors
        if (results.colors) {
            const colors = results.colors;
            console.log(`\n🎨 Colors:`);
            console.log(`   Dominant Colors: ${colors.dominantColors ? colors.dominantColors.join(', ') : 'N/A'}`);
            console.log(`   Foreground: ${colors.dominantColorForeground || 'N/A'}`);
            console.log(`   Background: ${colors.dominantColorBackground || 'N/A'}`);
            console.log(`   Accent Color: ${colors.accentColor || 'N/A'}`);
            console.log(`   Black & White: ${colors.isBwImg || false}`);
        }

        // Print adult content warning
        if (results.adultContent) {
            const adult = results.adultContent;
            if (adult.isAdultContent || adult.isRacyContent || adult.isGoryContent) {
                console.log(`\n⚠️  Content Warning:`);
                if (adult.isAdultContent) {
                    console.log(`   Adult Content: ${(adult.adultScore * 100).toFixed(1)}%`);
                }
                if (adult.isRacyContent) {
                    console.log(`   Racy Content: ${(adult.racyScore * 100).toFixed(1)}%`);
                }
                if (adult.isGoryContent) {
                    console.log(`   Gory Content: ${(adult.goreScore * 100).toFixed(1)}%`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
    }

    /**
     * Get image analysis with detailed error handling
     * @param {string} imageSource - URL or file path
     * @param {boolean} isUrl - Whether the source is a URL
     * @returns {Promise<Object>} Analysis results
     */
    async getImageAnalysis(imageSource, isUrl = true) {
        try {
            if (isUrl) {
                return await this.analyzeImageFromUrl(imageSource);
            } else {
                return await this.analyzeImageFromFile(imageSource);
            }
        } catch (error) {
            console.error(`❌ Error analyzing image: ${error.message}`);
            return {};
        }
    }
}

/**
 * Main function to demonstrate image analysis
 */
async function main() {
    // Configuration - Replace with your Azure Computer Vision credentials
    const ENDPOINT = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
    const KEY = process.env.AZURE_COMPUTER_VISION_KEY;

    if (!ENDPOINT || !KEY) {
        console.error('❌ Error: Please set AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY environment variables');
        console.log('You can get these from your Azure Computer Vision resource in the Azure portal');
        process.exit(1);
    }

    // Initialize the analyzer
    const analyzer = new ImageAnalyzer(ENDPOINT, KEY);

    // Example 1: Analyze image from URL
    console.log('🔍 Example 1: Analyzing image from URL');
    const imageUrl = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/landmark.jpg';
    
    const results = await analyzer.analyzeImageFromUrl(imageUrl);
    analyzer.printAnalysisResults(results);

    // Example 2: Analyze local image file (if available)
    const localImagePath = 'sample_image.jpg';
    try {
        await fs.access(localImagePath);
        console.log(`\n🔍 Example 2: Analyzing local image file: ${localImagePath}`);
        const localResults = await analyzer.analyzeImageFromFile(localImagePath);
        analyzer.printAnalysisResults(localResults);
    } catch (error) {
        console.log(`\n📝 Note: Local image file '${localImagePath}' not found. Skipping local file analysis.`);
        console.log('   You can add your own image file to test local analysis.');
    }

    // Example 3: Batch analysis of multiple images
    console.log('\n🔍 Example 3: Batch Image Analysis');
    const sampleImages = [
        'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/landmark.jpg',
        'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/faces.jpg'
    ];

    for (let i = 0; i < sampleImages.length; i++) {
        console.log(`\n--- Analyzing Image ${i + 1}/${sampleImages.length} ---`);
        const batchResults = await analyzer.analyzeImageFromUrl(sampleImages[i]);
        analyzer.printAnalysisResults(batchResults);
        
        // Add delay between requests to avoid rate limiting
        if (i < sampleImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Export the class for use in other modules
module.exports = ImageAnalyzer;

// Run the main function if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
} 