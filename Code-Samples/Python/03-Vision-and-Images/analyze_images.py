"""
Azure Computer Vision - Image Analysis
=====================================

This script demonstrates how to analyze images using Azure Computer Vision service.
It includes image tagging, content moderation, and image categorization.

Prerequisites:
- Azure Computer Vision service
- Python 3.7+
- Required packages: azure-cognitiveservices-vision-computervision, pillow

Author: Azure AI Models Course
Repository: https://github.com/DrHazemAli/Azure-AI-Models
"""

import os
import sys
from typing import List, Dict, Any
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import (
    VisualFeatureTypes, 
    ImageAnalysis,
    ImageTag,
    ImageCategory
)
from msrest.authentication import CognitiveServicesCredentials
from PIL import Image
import requests
from io import BytesIO

class ImageAnalyzer:
    """Azure Computer Vision Image Analyzer"""
    
    def __init__(self, endpoint: str, key: str):
        """
        Initialize the Image Analyzer
        
        Args:
            endpoint (str): Azure Computer Vision endpoint
            key (str): Azure Computer Vision API key
        """
        self.client = ComputerVisionClient(endpoint, CognitiveServicesCredentials(key))
        
    def analyze_image_from_url(self, image_url: str) -> Dict[str, Any]:
        """
        Analyze an image from URL
        
        Args:
            image_url (str): URL of the image to analyze
            
        Returns:
            Dict containing analysis results
        """
        try:
            # Define the features to extract
            features = [
                VisualFeatureTypes.tags,
                VisualFeatureTypes.categories,
                VisualFeatureTypes.description,
                VisualFeatureTypes.faces,
                VisualFeatureTypes.image_type,
                VisualFeatureTypes.color,
                VisualFeatureTypes.adult
            ]
            
            # Analyze the image
            analysis = self.client.analyze_image(image_url, features)
            
            return self._process_analysis_results(analysis)
            
        except Exception as e:
            print(f"Error analyzing image from URL: {e}")
            return {}
    
    def analyze_image_from_file(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze an image from local file
        
        Args:
            image_path (str): Path to the local image file
            
        Returns:
            Dict containing analysis results
        """
        try:
            # Open and read the image file
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
            
            # Define the features to extract
            features = [
                VisualFeatureTypes.tags,
                VisualFeatureTypes.categories,
                VisualFeatureTypes.description,
                VisualFeatureTypes.faces,
                VisualFeatureTypes.image_type,
                VisualFeatureTypes.color,
                VisualFeatureTypes.adult
            ]
            
            # Analyze the image
            analysis = self.client.analyze_image_in_stream(image_data, features)
            
            return self._process_analysis_results(analysis)
            
        except Exception as e:
            print(f"Error analyzing image from file: {e}")
            return {}
    
    def _process_analysis_results(self, analysis: ImageAnalysis) -> Dict[str, Any]:
        """
        Process and format the analysis results
        
        Args:
            analysis (ImageAnalysis): Raw analysis results
            
        Returns:
            Dict containing formatted results
        """
        results = {
            'tags': [],
            'categories': [],
            'description': '',
            'faces': [],
            'image_type': {},
            'colors': {},
            'adult_content': {},
            'confidence_scores': {}
        }
        
        # Process tags
        if analysis.tags:
            results['tags'] = [
                {
                    'name': tag.name,
                    'confidence': tag.confidence,
                    'hint': tag.hint if hasattr(tag, 'hint') else None
                }
                for tag in analysis.tags
            ]
        
        # Process categories
        if analysis.categories:
            results['categories'] = [
                {
                    'name': category.name,
                    'score': category.score,
                    'detail': category.detail if hasattr(category, 'detail') else None
                }
                for category in analysis.categories
            ]
        
        # Process description
        if analysis.description and analysis.description.captions:
            results['description'] = analysis.description.captions[0].text
            results['confidence_scores']['description'] = analysis.description.captions[0].confidence
        
        # Process faces
        if analysis.faces:
            results['faces'] = [
                {
                    'age': face.age,
                    'gender': face.gender,
                    'face_rectangle': {
                        'left': face.face_rectangle.left,
                        'top': face.face_rectangle.top,
                        'width': face.face_rectangle.width,
                        'height': face.face_rectangle.height
                    }
                }
                for face in analysis.faces
            ]
        
        # Process image type
        if analysis.image_type:
            results['image_type'] = {
                'clip_art_type': analysis.image_type.clip_art_type,
                'line_drawing_type': analysis.image_type.line_drawing_type
            }
        
        # Process colors
        if analysis.color:
            results['colors'] = {
                'dominant_colors': analysis.color.dominant_colors,
                'dominant_color_foreground': analysis.color.dominant_color_foreground,
                'dominant_color_background': analysis.color.dominant_color_background,
                'accent_color': analysis.color.accent_color,
                'is_bw_img': analysis.color.is_bw_img
            }
        
        # Process adult content
        if analysis.adult:
            results['adult_content'] = {
                'is_adult_content': analysis.adult.is_adult_content,
                'is_racy_content': analysis.adult.is_racy_content,
                'is_gory_content': analysis.adult.is_gory_content,
                'adult_score': analysis.adult.adult_score,
                'racy_score': analysis.adult.racy_score,
                'gore_score': analysis.adult.gore_score
            }
        
        return results
    
    def print_analysis_results(self, results: Dict[str, Any]):
        """
        Print formatted analysis results
        
        Args:
            results (Dict): Analysis results to print
        """
        print("=" * 60)
        print("AZURE COMPUTER VISION - IMAGE ANALYSIS RESULTS")
        print("=" * 60)
        
        # Print description
        if results.get('description'):
            print(f"\n📝 Description: {results['description']}")
            if 'confidence_scores' in results and 'description' in results['confidence_scores']:
                print(f"   Confidence: {results['confidence_scores']['description']:.2%}")
        
        # Print tags
        if results.get('tags'):
            print(f"\n🏷️  Tags ({len(results['tags'])} found):")
            for tag in results['tags'][:10]:  # Show top 10 tags
                print(f"   • {tag['name']} (Confidence: {tag['confidence']:.2%})")
        
        # Print categories
        if results.get('categories'):
            print(f"\n📂 Categories ({len(results['categories'])} found):")
            for category in results['categories'][:5]:  # Show top 5 categories
                print(f"   • {category['name']} (Score: {category['score']:.2%})")
        
        # Print faces
        if results.get('faces'):
            print(f"\n👥 Faces ({len(results['faces'])} detected):")
            for i, face in enumerate(results['faces'], 1):
                print(f"   Face {i}: {face['age']} years old, {face['gender']}")
        
        # Print colors
        if results.get('colors'):
            colors = results['colors']
            print(f"\n🎨 Colors:")
            print(f"   Dominant Colors: {', '.join(colors.get('dominant_colors', []))}")
            print(f"   Foreground: {colors.get('dominant_color_foreground', 'N/A')}")
            print(f"   Background: {colors.get('dominant_color_background', 'N/A')}")
            print(f"   Accent Color: {colors.get('accent_color', 'N/A')}")
            print(f"   Black & White: {colors.get('is_bw_img', False)}")
        
        # Print adult content warning
        if results.get('adult_content'):
            adult = results['adult_content']
            if adult.get('is_adult_content') or adult.get('is_racy_content') or adult.get('is_gory_content'):
                print(f"\n⚠️  Content Warning:")
                if adult.get('is_adult_content'):
                    print(f"   Adult Content: {adult.get('adult_score', 0):.2%}")
                if adult.get('is_racy_content'):
                    print(f"   Racy Content: {adult.get('racy_score', 0):.2%}")
                if adult.get('is_gory_content'):
                    print(f"   Gory Content: {adult.get('gore_score', 0):.2%}")
        
        print("\n" + "=" * 60)

def main():
    """Main function to demonstrate image analysis"""
    
    # Configuration - Replace with your Azure Computer Vision credentials
    ENDPOINT = os.getenv('AZURE_COMPUTER_VISION_ENDPOINT')
    KEY = os.getenv('AZURE_COMPUTER_VISION_KEY')
    
    if not ENDPOINT or not KEY:
        print("❌ Error: Please set AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY environment variables")
        print("You can get these from your Azure Computer Vision resource in the Azure portal")
        sys.exit(1)
    
    # Initialize the analyzer
    analyzer = ImageAnalyzer(ENDPOINT, KEY)
    
    # Example 1: Analyze image from URL
    print("🔍 Example 1: Analyzing image from URL")
    image_url = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/landmark.jpg"
    
    results = analyzer.analyze_image_from_url(image_url)
    analyzer.print_analysis_results(results)
    
    # Example 2: Analyze local image file (if available)
    local_image_path = "sample_image.jpg"
    if os.path.exists(local_image_path):
        print(f"\n🔍 Example 2: Analyzing local image file: {local_image_path}")
        results = analyzer.analyze_image_from_file(local_image_path)
        analyzer.print_analysis_results(results)
    else:
        print(f"\n📝 Note: Local image file '{local_image_path}' not found. Skipping local file analysis.")
        print("   You can add your own image file to test local analysis.")
    
    # Example 3: Interactive analysis
    print("\n🔍 Example 3: Interactive Image Analysis")
    print("Enter an image URL to analyze (or press Enter to skip):")
    user_url = input("Image URL: ").strip()
    
    if user_url:
        print(f"Analyzing: {user_url}")
        results = analyzer.analyze_image_from_url(user_url)
        analyzer.print_analysis_results(results)

if __name__ == "__main__":
    main() 