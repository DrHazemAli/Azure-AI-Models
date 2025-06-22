# Lesson 5: Custom Vision Models

Welcome to the world of custom computer vision! In this lesson, you'll learn how to train your own AI models to recognize objects and classify images specific to your business needs. Using Azure AI Custom Vision, you'll discover how to create powerful, tailored solutions that go beyond general-purpose models.

## What You'll Learn

By the end of this lesson, you'll be able to:
- Understand when and why to create custom vision models
- Set up Azure AI Custom Vision service
- Train custom image classification models
- Build custom object detection models
- Deploy and integrate custom models in applications
- Optimize model performance and accuracy

## Understanding Custom Vision

Azure AI Custom Vision allows you to build custom image classification and object detection models using your own training data. Built on Azure's machine learning infrastructure, it provides an easy-to-use interface for creating sophisticated AI models without requiring deep machine learning expertise.

### Key Benefits

**Domain-Specific Recognition**: Train models to recognize objects, products, or scenarios specific to your industry or use case.

**Few-Shot Learning**: Achieve high accuracy with relatively few training images compared to traditional machine learning approaches.

**Easy-to-Use Interface**: Web-based portal and APIs make model training accessible to developers and domain experts.

**Scalable Deployment**: Deploy models to the cloud, edge devices, or containers for various deployment scenarios.

**Continuous Learning**: Improve model performance by adding new training data and retraining models.

## When to Use Custom Vision

### Scenarios for Custom Models

**Specialized Industry Applications**:
- Medical imaging analysis
- Manufacturing defect detection
- Agricultural crop monitoring
- Geological survey analysis

**Brand-Specific Recognition**:
- Product identification
- Logo detection
- Brand monitoring
- Trademark protection

**Unique Object Categories**:
- Rare or specialized objects
- Custom product catalogs
- Artistic or creative content
- Heritage and cultural artifacts

### Custom vs. Pre-built Models

**Use Pre-built Models When**:
- Recognizing common objects (cars, people, animals)
- General image analysis needs
- Proof-of-concept development
- Limited training data available

**Use Custom Models When**:
- Recognizing domain-specific objects
- High accuracy requirements for specific categories
- Unique visual characteristics
- Business-critical applications

## Custom Image Classification

Image classification models assign labels or categories to entire images. This is useful when you need to determine what type of content an image contains.

### Setting Up Classification Projects

**Project Configuration**:
- Choose "Classification" project type
- Select "Multiclass" or "Multilabel" classification
- Define your classification categories
- Set up training data structure

**Training Data Requirements**:
- Minimum 15 images per category
- Recommended 50+ images per category
- Diverse examples of each category
- Balanced dataset across categories

### Training Process

**Step 1: Data Preparation**
```json
{
  "categories": [
    {
      "name": "defective_product",
      "training_images": 75,
      "validation_images": 25
    },
    {
      "name": "acceptable_product", 
      "training_images": 80,
      "validation_images": 20
    }
  ]
}
```

**Step 2: Model Training**
- Upload and tag training images
- Configure training parameters
- Initiate training process
- Monitor training progress

**Step 3: Model Evaluation**
```json
{
  "performance": {
    "precision": 0.92,
    "recall": 0.89,
    "average_precision": 0.91
  },
  "per_category_performance": [
    {
      "category": "defective_product",
      "precision": 0.94,
      "recall": 0.87
    }
  ]
}
```

## Custom Object Detection

Object detection models identify and locate specific objects within images, providing bounding box coordinates for each detected item.

### Object Detection Setup

**Project Configuration**:
- Choose "Object Detection" project type
- Define object categories to detect
- Plan bounding box annotation strategy
- Set up collaborative annotation workflow

**Annotation Requirements**:
- Precise bounding box annotations
- Consistent annotation guidelines
- Multiple objects per image when possible
- Varied object sizes and positions

### Training Data Best Practices

**Image Diversity**:
- Various lighting conditions
- Different backgrounds and contexts
- Multiple angles and perspectives
- Range of object sizes and orientations

**Annotation Quality**:
- Tight, accurate bounding boxes
- Consistent labeling across annotators
- Complete object coverage
- Clear annotation guidelines

## Practical Implementation

### Creating a Custom Classification Model

**Step 1: Project Setup**
```http
POST https://your-region.api.cognitive.microsoft.com/customvision/v3.3/Training/projects
Content-Type: application/json
Training-Key: YOUR_TRAINING_KEY

{
  "name": "Product Quality Classifier",
  "description": "Classify products as defective or acceptable",
  "classificationType": "Multiclass",
  "domainId": "General"
}
```

**Step 2: Upload Training Images**
```http
POST https://your-region.api.cognitive.microsoft.com/customvision/v3.3/Training/projects/{projectId}/images/image
Content-Type: multipart/form-data
Training-Key: YOUR_TRAINING_KEY

Content-Disposition: form-data; name="imageData"; filename="product1.jpg"
Content-Type: image/jpeg

[Binary image data]
```

**Step 3: Train the Model**
```http
POST https://your-region.api.cognitive.microsoft.com/customvision/v3.3/Training/projects/{projectId}/train
Training-Key: YOUR_TRAINING_KEY

{
  "trainingType": "Regular",
  "reservedBudgetInHours": 1
}
```

### Making Predictions

**Classification Prediction**:
```http
POST https://your-region.api.cognitive.microsoft.com/customvision/v3.0/Prediction/{projectId}/classify/iterations/{iterationId}/image
Content-Type: application/octet-stream
Prediction-Key: YOUR_PREDICTION_KEY

[Binary image data]
```

**Response**:
```json
{
  "id": "prediction-id",
  "project": "project-id", 
  "iteration": "iteration-id",
  "created": "2024-01-15T10:30:00Z",
  "predictions": [
    {
      "probability": 0.943,
      "tagId": "tag-id",
      "tagName": "acceptable_product",
      "boundingBox": null
    },
    {
      "probability": 0.057,
      "tagId": "tag-id-2",
      "tagName": "defective_product",
      "boundingBox": null
    }
  ]
}
```

## Model Optimization and Improvement

### Performance Metrics

**Classification Metrics**:
- **Precision**: Percentage of correct positive predictions
- **Recall**: Percentage of actual positives correctly identified
- **Average Precision**: Overall model performance measure

**Object Detection Metrics**:
- **Mean Average Precision (mAP)**: Overall detection accuracy
- **Intersection over Union (IoU)**: Bounding box accuracy
- **Confidence Thresholds**: Optimal detection confidence levels

### Improving Model Performance

**Data Quality Enhancement**:
- Add more diverse training examples
- Improve annotation accuracy
- Balance dataset across categories
- Remove mislabeled examples

**Training Optimization**:
- Adjust training parameters
- Try different model architectures
- Experiment with data augmentation
- Use transfer learning effectively

**Iterative Improvement**:
```json
{
  "improvement_cycle": [
    "1. Analyze current performance",
    "2. Identify weak areas",
    "3. Collect targeted training data",
    "4. Retrain model",
    "5. Evaluate improvements",
    "6. Deploy updated model"
  ]
}
```

## Deployment Options

### Cloud Deployment

**Prediction API**:
- Hosted on Azure infrastructure
- Automatic scaling and load balancing
- Built-in monitoring and analytics
- Easy integration with web applications

**Performance Characteristics**:
- Low latency for single predictions
- High throughput for batch processing
- Global availability and redundancy
- Pay-per-use pricing model

### Edge Deployment

**Azure IoT Edge**:
- Deploy models to edge devices
- Reduce latency and bandwidth usage
- Enable offline operation
- Maintain data privacy and security

**Containers**:
- Docker containers for flexible deployment
- Support for various hardware platforms
- Easy scaling and orchestration
- Version control and rollback capabilities

## Real-World Applications

### Manufacturing Quality Control

**Defect Detection System**:
- Automated inspection of products
- Real-time quality assessment
- Reduced manual inspection time
- Consistent quality standards

**Implementation Example**:
```json
{
  "use_case": "electronics_manufacturing",
  "model_type": "object_detection",
  "detected_defects": [
    {
      "type": "solder_bridge",
      "confidence": 0.94,
      "location": {"x": 150, "y": 200, "w": 30, "h": 25}
    },
    {
      "type": "missing_component",
      "confidence": 0.87,
      "location": {"x": 300, "y": 180, "w": 40, "h": 35}
    }
  ]
}
```

### Retail Product Recognition

**Inventory Management**:
- Automated product identification
- Stock level monitoring
- Planogram compliance checking
- Price tag verification

**Customer Experience**:
- Visual search capabilities
- Product recommendation systems
- Augmented reality shopping
- Personalized marketing

### Healthcare and Medical Imaging

**Diagnostic Assistance**:
- Medical image analysis
- Anomaly detection
- Treatment planning support
- Quality assurance

**Compliance and Safety**:
- Regulatory compliance monitoring
- Patient safety protocols
- Equipment status verification
- Documentation automation

## Best Practices and Guidelines

### Training Data Management

**Data Collection Strategy**:
- Define clear collection criteria
- Ensure representative samples
- Maintain data quality standards
- Implement version control

**Annotation Guidelines**:
- Create detailed annotation standards
- Train annotators consistently
- Implement quality control processes
- Use collaborative annotation tools

### Model Lifecycle Management

**Version Control**:
- Track model iterations
- Document changes and improvements
- Maintain rollback capabilities
- Implement A/B testing

**Monitoring and Maintenance**:
- Monitor model performance
- Detect concept drift
- Schedule regular retraining
- Maintain training data pipelines

## Cost Optimization

### Training Costs

**Efficient Training**:
- Start with smaller datasets
- Use incremental training
- Optimize training parameters
- Monitor training time

**Resource Management**:
- Use appropriate compute resources
- Schedule training during off-peak hours
- Implement auto-scaling
- Monitor resource utilization

### Prediction Costs

**Usage Optimization**:
- Batch predictions when possible
- Cache frequent predictions
- Use appropriate confidence thresholds
- Implement client-side filtering

## Next Steps

Congratulations on completing Section 3: Vision and Images! In the next section, we'll explore **Speech and Audio**, where you'll learn to work with Azure AI Speech services for speech recognition, synthesis, and translation.

### Practice Projects

1. **Custom Product Classifier**: Build a model to classify your own product categories
2. **Defect Detection System**: Create an object detection model for quality control
3. **Brand Logo Recognition**: Train a model to detect and recognize specific logos
4. **Custom Content Moderation**: Develop a classification model for content filtering

## Key Takeaways

- Custom Vision enables domain-specific AI models tailored to your business needs
- Few-shot learning allows high accuracy with relatively small training datasets
- Both classification and object detection models can be created and deployed easily
- Iterative improvement and proper data management are crucial for model success
- Deployment options include cloud APIs, edge devices, and containerized solutions
- Real-world applications span manufacturing, retail, healthcare, and many other industries

## References

[1] [Azure AI Custom Vision Documentation](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/)
[2] [Custom Vision REST API Reference](https://learn.microsoft.com/en-us/rest/api/customvision/)
[3] [Custom Vision Best Practices](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/getting-started-improving-your-classifier)
[4] [Custom Vision Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/custom-vision-service/)
[5] [Custom Vision Limits and Quotas](https://learn.microsoft.com/en-us/azure/ai-services/custom-vision-service/limits-and-quotas) 