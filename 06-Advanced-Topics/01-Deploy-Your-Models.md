# Lesson 1: Deploy Your Models - Production Deployment Strategies

Welcome to the Advanced Topics section! In this lesson, we'll explore enterprise-grade deployment strategies for Azure AI models. You'll learn how to move from development to production with confidence.

## Learning Objectives

By the end of this lesson, you will:
- Understand different deployment patterns for Azure AI models
- Learn containerization and scaling strategies
- Master blue-green and canary deployments
- Implement monitoring and security best practices

## Introduction to Model Deployment

Model deployment is the process of integrating a machine learning model into production where it can serve real-world requests. This is where your AI models become valuable business assets.

### Why Production Deployment Matters

Deploying AI models involves unique challenges:
- **Scale**: Handle thousands of concurrent requests
- **Reliability**: Ensure 99.9% uptime
- **Security**: Protect sensitive data and models
- **Performance**: Minimize latency while maximizing throughput

## Azure AI Deployment Options

### 1. Real-time Endpoints
Perfect for immediate responses like chatbots and image recognition.

### 2. Batch Endpoints  
Ideal for processing large volumes of data in scheduled jobs.

### 3. Managed Endpoints
Azure handles infrastructure with auto-scaling and monitoring.

### 4. Edge Deployment
Deploy models on IoT devices and mobile applications.

## Deployment Patterns

### Blue-Green Deployment

Maintain two identical environments for zero-downtime deployments:

```python
# Blue-Green deployment script
import requests
import time

def deploy_green_environment(model_version):
    """Deploy new version to green environment"""
    config = {
        "model_version": model_version,
        "environment": "green",
        "replicas": 3
    }
    
    # Deploy to green environment
    response = requests.post(
        "https://api.azureml.net/deploy",
        json=config,
        headers={"Authorization": "Bearer your-token"}
    )
    
    return response.json()

def switch_traffic_to_green():
    """Switch traffic from blue to green"""
    traffic_config = {
        "blue_weight": 0,
        "green_weight": 100
    }
    
    response = requests.put(
        "https://api.azureml.net/traffic",
        json=traffic_config
    )
    
    return response.status_code == 200
```

### Canary Deployment

Gradually roll out to a subset of users:

```python
def canary_deployment(model_version, traffic_percentage=10):
    """Deploy to small percentage of traffic"""
    config = {
        "model_version": model_version,
        "traffic_split": {
            "current": 100 - traffic_percentage,
            "canary": traffic_percentage
        }
    }
    
    response = requests.post(
        "https://api.azureml.net/canary",
        json=config
    )
    
    # Monitor metrics for 30 minutes
    time.sleep(1800)
    
    # Check error rates
    metrics = get_canary_metrics()
    if metrics["error_rate"] < 0.01:
        return promote_canary()
    else:
        return rollback_canary()
```

## Containerization with Docker

### Basic Dockerfile for AI Models

```dockerfile
FROM mcr.microsoft.com/azureml/base:latest

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy model files
COPY model/ /opt/ml/model/
COPY src/ /opt/ml/code/

# Set environment variables
ENV AZUREML_MODEL_DIR=/opt/ml/model
ENV AZUREML_ENTRY_SCRIPT=score.py

# Expose port and run
EXPOSE 8080
CMD ["python", "/opt/ml/code/score.py"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-model-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-model
  template:
    metadata:
      labels:
        app: ai-model
    spec:
      containers:
      - name: ai-model
        image: myregistry.azurecr.io/ai-model:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## Auto-scaling Implementation

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-model-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-model-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Custom Metrics Scaling

```python
from azure.monitor.query import MetricsQueryClient

def auto_scale_based_on_queue():
    """Scale based on queue length"""
    client = MetricsQueryClient(credential)
    
    queue_length = get_queue_metrics()
    
    if queue_length > 100:
        scale_up(target_replicas=10)
    elif queue_length < 10:
        scale_down(target_replicas=2)

def get_queue_metrics():
    """Get current queue length"""
    response = client.query_metrics(
        resource_uri=QUEUE_RESOURCE_URI,
        metric_names=["ActiveMessageCount"],
        timespan="PT5M"
    )
    return response.metrics[0].timeseries[0].data[-1].average
```

## Monitoring and Observability

### Application Insights Integration

```python
from azure.monitor.opentelemetry import configure_azure_monitor
from opentelemetry import trace, metrics
import time

# Configure monitoring
configure_azure_monitor(
    connection_string="InstrumentationKey=your-key"
)

tracer = trace.get_tracer(__name__)
meter = metrics.get_meter(__name__)

# Create custom metrics
prediction_counter = meter.create_counter(
    "model_predictions_total",
    description="Total predictions made"
)

latency_histogram = meter.create_histogram(
    "prediction_latency_seconds", 
    description="Prediction latency"
)

def predict_with_monitoring(input_data):
    """Make prediction with full monitoring"""
    with tracer.start_as_current_span("model_prediction") as span:
        start_time = time.time()
        
        try:
            result = model.predict(input_data)
            
            # Record success metrics
            prediction_counter.add(1, {"status": "success"})
            latency = time.time() - start_time
            latency_histogram.record(latency)
            
            span.set_attribute("model_version", "v1.0")
            return result
            
        except Exception as e:
            prediction_counter.add(1, {"status": "error"})
            span.set_status(trace.Status(trace.StatusCode.ERROR))
            raise
```

## Security Best Practices

### Secure API Endpoints

```python
from flask import Flask, request, jsonify
from azure.keyvault.secrets import SecretClient
import jwt

app = Flask(__name__)

def verify_token(token):
    """Verify JWT token using Azure Key Vault"""
    kv_client = SecretClient(
        vault_url="https://your-vault.vault.azure.net/",
        credential=DefaultAzureCredential()
    )
    
    secret = kv_client.get_secret("jwt-secret").value
    
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        return None

@app.route('/predict', methods=['POST'])
def secure_predict():
    # Verify authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    token = auth_header.split(' ')[1]
    payload = verify_token(token)
    if not payload:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Validate input
    data = request.get_json()
    if not validate_input(data):
        return jsonify({'error': 'Invalid input'}), 400
    
    # Make prediction
    result = model.predict(data)
    return jsonify({'prediction': result})

def validate_input(data):
    """Validate input data format"""
    required_fields = ['feature1', 'feature2']
    return all(field in data for field in required_fields)
```

## Edge Deployment

### Azure IoT Edge Module

```json
{
  "modulesContent": {
    "$edgeAgent": {
      "properties.desired": {
        "modules": {
          "aiModule": {
            "version": "1.0",
            "type": "docker",
            "status": "running",
            "restartPolicy": "always",
            "settings": {
              "image": "myregistry.azurecr.io/ai-edge:latest"
            }
          }
        }
      }
    }
  }
}
```

### Mobile Deployment (ONNX)

```python
import torch
import torch.onnx

# Convert PyTorch model to ONNX
def convert_to_onnx(model, input_shape):
    model.eval()
    dummy_input = torch.randn(input_shape)
    
    torch.onnx.export(
        model,
        dummy_input,
        "model.onnx",
        export_params=True,
        opset_version=11,
        input_names=['input'],
        output_names=['output']
    )
    
    print("Model converted to ONNX format")
```

## Performance Optimization

### Model Optimization Techniques

```python
import torch
import torch.quantization as quantization

def optimize_model(model):
    """Apply various optimization techniques"""
    
    # 1. Quantization (reduce precision)
    model.qconfig = quantization.get_default_qconfig('fbgemm')
    quantized_model = quantization.prepare(model, inplace=False)
    quantized_model = quantization.convert(quantized_model, inplace=False)
    
    # 2. TorchScript (JIT compilation)
    scripted_model = torch.jit.script(model)
    
    # 3. Model pruning (remove unnecessary parameters)
    import torch.nn.utils.prune as prune
    for module in model.modules():
        if isinstance(module, torch.nn.Linear):
            prune.l1_unstructured(module, name='weight', amount=0.3)
    
    return scripted_model

# Caching for frequently accessed predictions
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
def cached_predict(input_hash):
    """Cache predictions for identical inputs"""
    # This would be implemented with your actual model
    return model.predict(input_data)

def predict_with_cache(input_data):
    """Predict with caching support"""
    input_str = str(sorted(input_data.items()))
    input_hash = hashlib.md5(input_str.encode()).hexdigest()
    return cached_predict(input_hash)
```

## Testing Production Deployments

### Integration Testing

```python
import pytest
import requests

class TestModelAPI:
    def setup_class(self):
        self.base_url = "https://your-api.com"
        self.auth_token = "test-token"
    
    def test_health_endpoint(self):
        response = requests.get(f"{self.base_url}/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_prediction_endpoint(self):
        test_data = {"feature1": 1.0, "feature2": 2.0}
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        response = requests.post(
            f"{self.base_url}/predict",
            json=test_data,
            headers=headers
        )
        
        assert response.status_code == 200
        assert "prediction" in response.json()
```

### Load Testing with Locust

```python
from locust import HttpUser, task, between

class ModelLoadTest(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        self.headers = {"Authorization": "Bearer test-token"}
        self.test_data = {"feature1": 1.0, "feature2": 2.0}
    
    @task(10)
    def predict(self):
        self.client.post(
            "/predict",
            json=self.test_data,
            headers=self.headers
        )
    
    @task(1) 
    def health_check(self):
        self.client.get("/health")
```

## Disaster Recovery

### Backup and Recovery

```python
from azure.storage.blob import BlobServiceClient

class ModelBackupService:
    def __init__(self):
        self.blob_client = BlobServiceClient(
            account_url="https://backup.blob.core.windows.net",
            credential=DefaultAzureCredential()
        )
    
    def backup_model(self, model_path, version):
        """Backup model to multiple regions"""
        regions = ["eastus", "westus", "centralus"]
        
        for region in regions:
            container = f"models-backup-{region}"
            blob_name = f"model-v{version}.pkl"
            
            with open(model_path, "rb") as data:
                self.blob_client.get_blob_client(
                    container=container,
                    blob=blob_name
                ).upload_blob(data, overwrite=True)
    
    def restore_model(self, version, region="eastus"):
        """Restore model from backup"""
        container = f"models-backup-{region}"
        blob_name = f"model-v{version}.pkl"
        
        blob_client = self.blob_client.get_blob_client(
            container=container,
            blob=blob_name
        )
        
        with open(f"restored-model-v{version}.pkl", "wb") as file:
            file.write(blob_client.download_blob().readall())
```

## Best Practices Summary

### Deployment Best Practices
1. **Use Infrastructure as Code** - Version control everything
2. **Implement CI/CD** - Automate testing and deployment
3. **Monitor Comprehensively** - Track all metrics and logs
4. **Plan for Failure** - Implement redundancy and recovery
5. **Security First** - Secure APIs and protect data
6. **Test Thoroughly** - Integration, load, and security testing

### Performance Best Practices
1. **Optimize Models** - Use quantization and pruning
2. **Implement Caching** - Cache frequent predictions
3. **Auto-scale** - Scale based on demand
4. **Monitor Latency** - Track response times
5. **Batch Processing** - Group requests efficiently

## Troubleshooting Common Issues

### Deployment Failures
- **Resource Constraints**: Check CPU/memory limits
- **Network Issues**: Verify connectivity and firewall rules
- **Authentication**: Validate credentials and permissions

### Performance Issues
- **High Latency**: Optimize model or increase resources
- **Low Throughput**: Check for bottlenecks and scale up
- **Memory Leaks**: Monitor resource usage patterns

## Real-World Example: E-commerce Recommendations

```python
# Production deployment configuration
deployment_config = {
    "model_name": "recommendation-engine",
    "version": "v2.1.0",
    "replicas": 5,
    "resources": {
        "cpu": "1000m",
        "memory": "2Gi",
        "gpu": "1"
    },
    "auto_scaling": {
        "min_replicas": 3,
        "max_replicas": 20,
        "cpu_threshold": 70
    },
    "monitoring": {
        "health_check": "/health",
        "metrics_endpoint": "/metrics",
        "log_level": "INFO"
    }
}

# Deploy with blue-green strategy
def deploy_recommendation_engine():
    # Deploy to green environment
    green_deployment = deploy_green_environment(deployment_config)
    
    # Run validation tests
    if validate_deployment(green_deployment):
        # Switch traffic gradually
        switch_traffic_gradually(green_deployment)
        return True
    else:
        # Rollback on failure
        rollback_deployment(green_deployment)
        return False
```

## Conclusion

Deploying AI models in production requires careful planning, robust infrastructure, and comprehensive monitoring. Key takeaways:

- **Choose the right deployment pattern** for your use case
- **Implement proper monitoring** and alerting
- **Plan for failure** with redundancy and recovery
- **Optimize for performance** and cost
- **Secure deployments** end-to-end
- **Test thoroughly** before production

In the next lesson, we'll explore security best practices for AI systems.

## Additional Resources

- [Azure Machine Learning Deployment Guide](https://learn.microsoft.com/azure/machine-learning/how-to-deploy-models) [1]
- [Kubernetes for AI Workloads](https://kubernetes.io/docs/concepts/workloads/) [2]
- [Azure Container Registry](https://learn.microsoft.com/azure/container-registry/) [3]

## References

[1] Microsoft Learn. "Deploy machine learning models to Azure." https://learn.microsoft.com/azure/machine-learning/how-to-deploy-models

[2] Kubernetes Documentation. "Workloads." https://kubernetes.io/docs/concepts/workloads/

[3] Microsoft Learn. "Azure Container Registry documentation." https://learn.microsoft.com/azure/container-registry/ 