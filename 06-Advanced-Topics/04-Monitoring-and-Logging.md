# Lesson 4: Monitoring and Logging - Comprehensive Observability for Azure AI Models

Welcome to our fourth lesson in Advanced Topics! Today we'll explore comprehensive monitoring strategies for Azure AI models in production. You'll learn how to implement robust observability, track performance metrics, and proactively identify issues before they impact users.

## Learning Objectives

By the end of this lesson, you will:
- Implement comprehensive monitoring for Azure AI services
- Set up custom dashboards and alerts for AI workloads
- Track performance metrics and cost optimization
- Configure logging and auditing for compliance requirements
- Use Azure Monitor and Application Insights for AI observability

## Introduction to AI Monitoring

Monitoring AI systems requires a multi-layered approach covering performance, accuracy, cost, and user experience. Unlike traditional applications, AI services have unique metrics like model accuracy, prompt token usage, and content filtering actions.

### Why AI Monitoring Matters

AI monitoring addresses critical business needs:
- **Performance**: Ensure consistent response times and availability
- **Accuracy**: Track model performance degradation over time
- **Cost Control**: Monitor token consumption and service usage
- **Compliance**: Maintain audit trails for regulatory requirements
- **User Experience**: Detect and resolve issues proactively

## Azure Monitor for AI Services

Azure Monitor provides comprehensive monitoring capabilities specifically designed for AI workloads, including custom metrics, alerts, and dashboards.

### Setting Up Basic Monitoring

```python
# Configure Azure Monitor for Azure OpenAI
from azure.monitor.opentelemetry import configure_azure_monitor
from opentelemetry import trace, metrics
from opentelemetry.instrumentation.requests import RequestsInstrumentor
import time

# Initialize monitoring
configure_azure_monitor(
    connection_string="InstrumentationKey=your-instrumentation-key"
)

# Enable automatic instrumentation
RequestsInstrumentor().instrument()

# Create custom tracer and meter
tracer = trace.get_tracer(__name__)
meter = metrics.get_meter(__name__)

# Custom metrics
request_counter = meter.create_counter(
    "ai_requests_total",
    description="Total number of AI requests"
)
token_usage_counter = meter.create_counter(
    "ai_tokens_used_total", 
    description="Total tokens consumed"
)
response_time_histogram = meter.create_histogram(
    "ai_response_time_seconds",
    description="AI response time in seconds"
)

class AIMonitor:
    def __init__(self, service_name="azure-ai-service"):
        self.service_name = service_name
        
    def monitored_ai_call(self, prompt, model="gpt-35-turbo", **kwargs):
        """AI service call with comprehensive monitoring"""
        start_time = time.time()
        
        with tracer.start_as_current_span("azure_ai_completion") as span:
            # Set span attributes
            span.set_attribute("ai.model", model)
            span.set_attribute("ai.prompt_length", len(prompt))
            span.set_attribute("ai.service", self.service_name)
            
            try:
                # Make the AI service call
                response = self._make_ai_call(prompt, model, **kwargs)
                
                # Calculate response time
                response_time = time.time() - start_time
                
                # Track metrics
                self._track_success_metrics(response, model, response_time)
                
                # Set span attributes for successful response
                span.set_attribute("ai.usage.prompt_tokens", response.usage.prompt_tokens)
                span.set_attribute("ai.usage.completion_tokens", response.usage.completion_tokens)
                span.set_attribute("ai.usage.total_tokens", response.usage.total_tokens)
                span.set_attribute("ai.response_time", response_time)
                
                return response
                
            except Exception as e:
                # Track error metrics
                self._track_error_metrics(model, str(e))
                
                # Record exception in span
                span.record_exception(e)
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                raise
    
    def _make_ai_call(self, prompt, model, **kwargs):
        """Make the actual AI service call"""
        # This would be your actual Azure OpenAI call
        # Using client.chat.completions.create() or similar
        pass
    
    def _track_success_metrics(self, response, model, response_time):
        """Track success metrics"""
        # Increment request counter
        request_counter.add(1, {"model": model, "status": "success"})
        
        # Track token usage
        token_usage_counter.add(
            response.usage.prompt_tokens, 
            {"model": model, "token_type": "prompt"}
        )
        token_usage_counter.add(
            response.usage.completion_tokens,
            {"model": model, "token_type": "completion"}
        )
        
        # Track response time
        response_time_histogram.record(response_time, {"model": model})
    
    def _track_error_metrics(self, model, error_message):
        """Track error metrics"""
        request_counter.add(1, {"model": model, "status": "error"})
        
        # You could also track specific error types
        error_type = self._classify_error(error_message)
        request_counter.add(1, {"model": model, "error_type": error_type})
    
    def _classify_error(self, error_message):
        """Classify error types for better monitoring"""
        if "rate limit" in error_message.lower():
            return "rate_limit"
        elif "timeout" in error_message.lower():
            return "timeout"
        elif "unauthorized" in error_message.lower():
            return "authentication"
        else:
            return "unknown"
```

### JavaScript Implementation

```javascript
// JavaScript implementation with Application Insights
const { ApplicationInsights } = require('@microsoft/applicationinsights-web');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// Initialize Application Insights
const appInsights = new ApplicationInsights({
    config: {
        connectionString: 'your-connection-string'
    }
});
appInsights.loadAppInsights();

class AITelemetryTracker {
    constructor() {
        this.appInsights = appInsights;
    }
    
    async trackAIRequest(requestData) {
        const startTime = Date.now();
        
        try {
            // Make AI service call
            const response = await this.makeAICall(requestData);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Track successful request
            this.appInsights.trackEvent({
                name: 'AI_Request_Success',
                properties: {
                    model: requestData.model,
                    userId: requestData.userId,
                    sessionId: requestData.sessionId,
                    promptCategory: this.categorizePrompt(requestData.prompt)
                },
                measurements: {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens,
                    responseTimeMs: responseTime,
                    estimatedCost: this.calculateCost(response.usage, requestData.model)
                }
            });
            
            return response;
            
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Track failed request
            this.appInsights.trackEvent({
                name: 'AI_Request_Error',
                properties: {
                    model: requestData.model,
                    errorType: this.classifyError(error.message),
                    errorMessage: error.message
                },
                measurements: {
                    responseTimeMs: responseTime
                }
            });
            
            // Track exception
            this.appInsights.trackException({
                exception: error,
                properties: {
                    model: requestData.model,
                    operation: 'ai_request'
                }
            });
            
            throw error;
        }
    }
    
    trackModelPerformance(performanceData) {
        // Track model accuracy and quality metrics
        this.appInsights.trackMetric({
            name: 'AI_Model_Accuracy',
            average: performanceData.accuracy,
            properties: {
                model: performanceData.model,
                evaluationDataset: performanceData.dataset,
                evaluationDate: new Date().toISOString()
            }
        });
        
        this.appInsights.trackMetric({
            name: 'AI_Response_Quality',
            average: performanceData.qualityScore,
            properties: {
                model: performanceData.model,
                qualityMetric: performanceData.metricType
            }
        });
    }
    
    trackUserFeedback(feedbackData) {
        // Track user satisfaction and feedback
        this.appInsights.trackEvent({
            name: 'AI_User_Feedback',
            properties: {
                sessionId: feedbackData.sessionId,
                feedbackType: feedbackData.type,
                rating: feedbackData.rating.toString(),
                hasComments: (!!feedbackData.comments).toString()
            },
            measurements: {
                responseHelpfulness: feedbackData.helpfulness || 0,
                responseAccuracy: feedbackData.accuracy || 0
            }
        });
    }
    
    categorizePrompt(prompt) {
        // Simple prompt categorization
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('code') || lowerPrompt.includes('programming')) {
            return 'coding';
        } else if (lowerPrompt.includes('translate') || lowerPrompt.includes('language')) {
            return 'translation';
        } else if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
            return 'summarization';
        } else {
            return 'general';
        }
    }
    
    calculateCost(usage, model) {
        // Simple cost calculation
        const pricing = {
            'gpt-35-turbo': { input: 0.001, output: 0.002 },
            'gpt-4': { input: 0.03, output: 0.06 },
            'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
        };
        
        if (!pricing[model]) return 0;
        
        const inputCost = (usage.prompt_tokens / 1000) * pricing[model].input;
        const outputCost = (usage.completion_tokens / 1000) * pricing[model].output;
        
        return inputCost + outputCost;
    }
    
    classifyError(errorMessage) {
        const message = errorMessage.toLowerCase();
        if (message.includes('rate limit')) return 'rate_limit';
        if (message.includes('timeout')) return 'timeout';
        if (message.includes('unauthorized') || message.includes('authentication')) return 'auth_error';
        if (message.includes('quota')) return 'quota_exceeded';
        return 'unknown_error';
    }
}
```

### C# Implementation

```csharp
// C# implementation with Application Insights
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using System.Diagnostics;
using Microsoft.Extensions.Logging;

public class AIPerformanceMonitor
{
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<AIPerformanceMonitor> _logger;
    
    public AIPerformanceMonitor(TelemetryClient telemetryClient, ILogger<AIPerformanceMonitor> logger)
    {
        _telemetryClient = telemetryClient;
        _logger = logger;
    }
    
    public async Task<T> MonitorAIOperation<T>(
        string operationName, 
        Func<Task<T>> operation, 
        Dictionary<string, string> properties = null)
    {
        using var operationTelemetry = _telemetryClient.StartOperation<RequestTelemetry>(operationName);
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            // Add custom properties
            if (properties != null)
            {
                foreach (var prop in properties)
                {
                    operationTelemetry.Telemetry.Properties[prop.Key] = prop.Value;
                }
            }
            
            var result = await operation();
            
            // Track success metrics
            _telemetryClient.TrackMetric("AI.Operation.Duration", stopwatch.ElapsedMilliseconds, properties);
            _telemetryClient.TrackMetric("AI.Operation.Success", 1, properties);
            
            operationTelemetry.Telemetry.Success = true;
            return result;
            
        }
        catch (Exception ex)
        {
            // Track failure metrics
            _telemetryClient.TrackException(ex, properties);
            _telemetryClient.TrackMetric("AI.Operation.Failure", 1, properties);
            
            operationTelemetry.Telemetry.Success = false;
            operationTelemetry.Telemetry.ResponseCode = "500";
            
            _logger.LogError(ex, "AI operation {OperationName} failed", operationName);
            throw;
        }
        finally
        {
            stopwatch.Stop();
            operationTelemetry.Telemetry.Duration = stopwatch.Elapsed;
        }
    }
    
    public void TrackTokenUsage(string model, int promptTokens, int completionTokens, double cost)
    {
        var properties = new Dictionary<string, string>
        {
            {"Model", model},
            {"Timestamp", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")}
        };
        
        _telemetryClient.TrackMetric("AI.Tokens.Prompt", promptTokens, properties);
        _telemetryClient.TrackMetric("AI.Tokens.Completion", completionTokens, properties);
        _telemetryClient.TrackMetric("AI.Tokens.Total", promptTokens + completionTokens, properties);
        _telemetryClient.TrackMetric("AI.Cost.Request", cost, properties);
    }
    
    public void TrackModelQuality(string model, double accuracy, double relevance, string evaluationSet)
    {
        var properties = new Dictionary<string, string>
        {
            {"Model", model},
            {"EvaluationSet", evaluationSet},
            {"EvaluationDate", DateTime.UtcNow.ToString("yyyy-MM-dd")}
        };
        
        _telemetryClient.TrackMetric("AI.Quality.Accuracy", accuracy, properties);
        _telemetryClient.TrackMetric("AI.Quality.Relevance", relevance, properties);
    }
    
    public void TrackContentSafety(string model, bool wasFiltered, string filterReason = null)
    {
        var properties = new Dictionary<string, string>
        {
            {"Model", model},
            {"WasFiltered", wasFiltered.ToString()},
            {"FilterReason", filterReason ?? "none"}
        };
        
        _telemetryClient.TrackEvent("AI.ContentSafety.Check", properties);
        
        if (wasFiltered)
        {
            _telemetryClient.TrackMetric("AI.ContentSafety.Filtered", 1, properties);
        }
    }
}
```

## Custom Dashboards and Alerting

### Creating AI-Specific Dashboards

```python
# Create comprehensive AI monitoring dashboard using Azure REST APIs
import json
import requests
from azure.identity import DefaultAzureCredential

class AIDashboardCreator:
    def __init__(self, subscription_id, resource_group, workspace_name):
        self.subscription_id = subscription_id
        self.resource_group = resource_group
        self.workspace_name = workspace_name
        self.credential = DefaultAzureCredential()
    
    def create_ai_dashboard(self):
        """Create comprehensive AI monitoring dashboard"""
        dashboard_config = {
            "properties": {
                "lenses": {
                    "0": {
                        "order": 0,
                        "parts": {
                            "0": self._create_request_volume_chart(),
                            "1": self._create_response_time_chart(),
                            "2": self._create_token_usage_chart(),
                            "3": self._create_cost_analysis_chart(),
                            "4": self._create_error_rate_chart(),
                            "5": self._create_model_performance_chart(),
                            "6": self._create_content_safety_chart()
                        }
                    }
                },
                "metadata": {
                    "model": {
                        "timeRange": {
                            "value": {
                                "relative": {
                                    "duration": 24,
                                    "timeUnit": 1
                                }
                            },
                            "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
                        }
                    }
                }
            },
            "name": "AI Services Monitoring Dashboard",
            "type": "Microsoft.Portal/dashboards",
            "location": "global"
        }
        
        return dashboard_config
    
    def _create_request_volume_chart(self):
        """Create request volume chart configuration"""
        return {
            "position": {"x": 0, "y": 0, "rowSpan": 2, "colSpan": 4},
            "metadata": {
                "inputs": [{
                    "name": "query",
                    "value": """
                    AppEvents
                    | where Name == "AI_Request_Success" or Name == "AI_Request_Error"
                    | summarize RequestCount = count() by bin(TimeGenerated, 1h), Name
                    | render timechart with (title="AI Request Volume by Status")
                    """
                }],
                "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart"
            }
        }
    
    def _create_response_time_chart(self):
        """Create response time analysis chart"""
        return {
            "position": {"x": 4, "y": 0, "rowSpan": 2, "colSpan": 4},
            "metadata": {
                "inputs": [{
                    "name": "query", 
                    "value": """
                    AppEvents
                    | where Name == "AI_Request_Success"
                    | extend ResponseTime = todouble(Measurements.responseTimeMs)
                    | summarize 
                        P50 = percentile(ResponseTime, 50),
                        P90 = percentile(ResponseTime, 90),
                        P95 = percentile(ResponseTime, 95),
                        P99 = percentile(ResponseTime, 99)
                    by bin(TimeGenerated, 1h)
                    | render timechart with (title="Response Time Percentiles")
                    """
                }]
            }
        }
    
    def _create_token_usage_chart(self):
        """Create token usage analysis chart"""
        return {
            "position": {"x": 8, "y": 0, "rowSpan": 2, "colSpan": 4},
            "metadata": {
                "inputs": [{
                    "name": "query",
                    "value": """
                    AppEvents
                    | where Name == "AI_Request_Success"
                    | extend 
                        Model = tostring(Properties.model),
                        TotalTokens = todouble(Measurements.totalTokens)
                    | summarize TokensUsed = sum(TotalTokens) by bin(TimeGenerated, 1h), Model
                    | render timechart with (title="Token Usage by Model")
                    """
                }]
            }
        }
    
    def _create_cost_analysis_chart(self):
        """Create cost analysis chart"""
        return {
            "position": {"x": 0, "y": 2, "rowSpan": 2, "colSpan": 6},
            "metadata": {
                "inputs": [{
                    "name": "query",
                    "value": """
                    AppEvents
                    | where Name == "AI_Request_Success"
                    | extend 
                        Model = tostring(Properties.model),
                        Cost = todouble(Measurements.estimatedCost)
                    | summarize TotalCost = sum(Cost) by bin(TimeGenerated, 1h), Model
                    | render timechart with (title="Cost Analysis by Model")
                    """
                }]
            }
        }
    
    def _create_error_rate_chart(self):
        """Create error rate analysis chart"""
        return {
            "position": {"x": 6, "y": 2, "rowSpan": 2, "colSpan": 6},
            "metadata": {
                "inputs": [{
                    "name": "query",
                    "value": """
                    AppEvents
                    | where Name == "AI_Request_Success" or Name == "AI_Request_Error"
                    | summarize 
                        TotalRequests = count(),
                        ErrorRequests = countif(Name == "AI_Request_Error"),
                        ErrorRate = (countif(Name == "AI_Request_Error") * 100.0) / count()
                    by bin(TimeGenerated, 1h)
                    | render timechart with (title="Error Rate Percentage")
                    """
                }]
            }
        }
    
    def _create_model_performance_chart(self):
        """Create model performance chart"""
        return {
            "position": {"x": 0, "y": 4, "rowSpan": 2, "colSpan": 6},
            "metadata": {
                "inputs": [{
                    "name": "query",
                    "value": """
                    AppMetrics
                    | where Name == "AI_Model_Accuracy" or Name == "AI_Response_Quality"
                    | summarize AvgValue = avg(Value) by bin(TimeGenerated, 1d), Name, tostring(Properties.model)
                    | render timechart with (title="Model Performance Metrics")
                    """
                }]
            }
        }
    
    def _create_content_safety_chart(self):
        """Create content safety monitoring chart"""
        return {
            "position": {"x": 6, "y": 4, "rowSpan": 2, "colSpan": 6},
            "metadata": {
                "inputs": [{
                    "name": "query",
                    "value": """
                    AppEvents
                    | where Name == "AI.ContentSafety.Check"
                    | extend WasFiltered = tobool(Properties.WasFiltered)
                    | summarize 
                        TotalChecks = count(),
                        FilteredCount = countif(WasFiltered),
                        FilterRate = (countif(WasFiltered) * 100.0) / count()
                    by bin(TimeGenerated, 1h)
                    | render timechart with (title="Content Safety Filter Rate")
                    """
                }]
            }
        }
```

### Advanced Alerting Rules

```python
# Advanced alerting system for AI services
class AIAlertManager:
    def __init__(self, subscription_id, resource_group):
        self.subscription_id = subscription_id
        self.resource_group = resource_group
        self.credential = DefaultAzureCredential()
    
    def create_ai_alert_rules(self):
        """Create comprehensive alert rules for AI services"""
        
        alert_rules = [
            self._create_high_error_rate_alert(),
            self._create_slow_response_alert(),
            self._create_high_cost_alert(),
            self._create_token_quota_alert(),
            self._create_model_performance_alert(),
            self._create_content_safety_alert()
        ]
        
        return alert_rules
    
    def _create_high_error_rate_alert(self):
        """Alert when error rate exceeds threshold"""
        return {
            "name": "AI-High-Error-Rate",
            "description": "Alert when AI error rate exceeds 5%",
            "severity": 1,  # Critical
            "query": """
            AppEvents
            | where Name == "AI_Request_Success" or Name == "AI_Request_Error"
            | where TimeGenerated > ago(10m)
            | summarize 
                TotalRequests = count(),
                ErrorRequests = countif(Name == "AI_Request_Error"),
                ErrorRate = (countif(Name == "AI_Request_Error") * 100.0) / count()
            | where ErrorRate > 5
            """,
            "threshold": 0,
            "frequency": "PT5M",
            "time_window": "PT10M",
            "actions": ["email", "sms", "webhook", "teams"]
        }
    
    def _create_slow_response_alert(self):
        """Alert when response times are too high"""
        return {
            "name": "AI-Slow-Response-Time",
            "description": "Alert when AI response time P95 exceeds 10 seconds",
            "severity": 2,  # Warning
            "query": """
            AppEvents
            | where Name == "AI_Request_Success"
            | where TimeGenerated > ago(15m)
            | extend ResponseTime = todouble(Measurements.responseTimeMs)
            | summarize P95ResponseTime = percentile(ResponseTime, 95)
            | where P95ResponseTime > 10000
            """,
            "threshold": 0,
            "frequency": "PT5M",
            "time_window": "PT15M",
            "actions": ["email", "teams"]
        }
    
    def _create_high_cost_alert(self):
        """Alert when costs spike unexpectedly"""
        return {
            "name": "AI-High-Cost-Spike",
            "description": "Alert when hourly AI costs exceed budget",
            "severity": 2,
            "query": """
            AppEvents
            | where Name == "AI_Request_Success"
            | where TimeGenerated > ago(1h)
            | extend Cost = todouble(Measurements.estimatedCost)
            | summarize HourlyCost = sum(Cost)
            | where HourlyCost > 50  // Adjust threshold as needed
            """,
            "threshold": 0,
            "frequency": "PT15M",
            "time_window": "PT1H",
            "actions": ["email", "teams"]
        }
    
    def _create_token_quota_alert(self):
        """Alert when approaching token quota limits"""
        return {
            "name": "AI-Token-Quota-Warning",
            "description": "Alert when token usage approaches quota limits",
            "severity": 3,  # Informational
            "query": """
            AppEvents
            | where Name == "AI_Request_Success"
            | where TimeGenerated > ago(1h)
            | extend TotalTokens = todouble(Measurements.totalTokens)
            | summarize HourlyTokens = sum(TotalTokens)
            | extend QuotaUsagePercent = (HourlyTokens / 1000000) * 100  // Assuming 1M token/hour quota
            | where QuotaUsagePercent > 80
            """,
            "threshold": 0,
            "frequency": "PT15M",
            "time_window": "PT1H",
            "actions": ["email"]
        }
    
    def _create_model_performance_alert(self):
        """Alert when model performance degrades"""
        return {
            "name": "AI-Model-Performance-Degradation",
            "description": "Alert when model accuracy drops below threshold",
            "severity": 2,
            "query": """
            AppMetrics
            | where Name == "AI_Model_Accuracy"
            | where TimeGenerated > ago(6h)
            | summarize AvgAccuracy = avg(Value) by tostring(Properties.model)
            | where AvgAccuracy < 0.85  // 85% accuracy threshold
            """,
            "threshold": 0,
            "frequency": "PT1H",
            "time_window": "PT6H",
            "actions": ["email", "teams"]
        }
    
    def _create_content_safety_alert(self):
        """Alert when content safety filter rate is unusually high"""
        return {
            "name": "AI-High-Content-Filter-Rate",
            "description": "Alert when content filter rate exceeds normal threshold",
            "severity": 3,
            "query": """
            AppEvents
            | where Name == "AI.ContentSafety.Check"
            | where TimeGenerated > ago(1h)
            | extend WasFiltered = tobool(Properties.WasFiltered)
            | summarize 
                TotalChecks = count(),
                FilteredCount = countif(WasFiltered),
                FilterRate = (countif(WasFiltered) * 100.0) / count()
            | where FilterRate > 10  // 10% filter rate threshold
            """,
            "threshold": 0,
            "frequency": "PT30M",
            "time_window": "PT1H",
            "actions": ["email"]
        }
```

## Compliance and Audit Logging

### Comprehensive Audit System

```python
# Comprehensive audit logging for AI services with latest compliance features
import hashlib
import json
from datetime import datetime
from azure.storage.blob import BlobServiceClient
from azure.keyvault.secrets import SecretClient

class AIAuditLogger:
    def __init__(self, storage_connection_string, container_name, key_vault_url=None):
        self.blob_service = BlobServiceClient.from_connection_string(storage_connection_string)
        self.container_name = container_name
        self.key_vault_client = SecretClient(vault_url=key_vault_url, credential=DefaultAzureCredential()) if key_vault_url else None
        self._ensure_container_exists()
    
    def _ensure_container_exists(self):
        """Ensure audit log container exists"""
        try:
            self.blob_service.create_container(self.container_name)
        except Exception:
            pass  # Container already exists
    
    def log_ai_interaction(self, request_data, response_data, user_context, compliance_context=None):
        """Log AI interaction with enhanced compliance features"""
        
        # Create privacy-preserving hash of sensitive content
        content_hash = self._create_content_hash(request_data.get('prompt', ''))
        
        # Determine data classification
        data_classification = self._classify_data_sensitivity(request_data, user_context)
        
        audit_record = {
            'audit_version': '2.0',
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'ai_interaction',
            'request_id': request_data.get('request_id', ''),
            'trace_id': request_data.get('trace_id', ''),
            
            # User context with privacy protection
            'user_context': {
                'user_id_hash': self._hash_pii(user_context.get('user_id', '')),
                'session_id': user_context.get('session_id', ''),
                'tenant_id': user_context.get('tenant_id', ''),
                'client_ip_hash': self._hash_pii(user_context.get('client_ip', '')),
                'user_agent': user_context.get('user_agent', ''),
                'geographic_region': user_context.get('region', '')
            },
            
            # Request metadata
            'request_metadata': {
                'model': request_data.get('model', ''),
                'content_hash': content_hash,
                'prompt_length': len(request_data.get('prompt', '')),
                'parameters': {k: v for k, v in request_data.items() 
                             if k not in ['prompt', 'messages', 'context']},
                'content_classification': self._classify_content_type(request_data.get('prompt', '')),
                'data_sensitivity': data_classification,
                'request_source': request_data.get('source', 'api')
            },
            
            # Response metadata
            'response_metadata': {
                'response_length': len(response_data.get('content', '')),
                'finish_reason': response_data.get('finish_reason', ''),
                'usage': response_data.get('usage', {}),
                'response_time_ms': response_data.get('response_time_ms', 0),
                'estimated_cost': response_data.get('estimated_cost', 0),
                'model_version': response_data.get('model_version', '')
            },
            
            # Safety and compliance
            'safety_metadata': {
                'content_filter_results': response_data.get('content_filter_results', {}),
                'prompt_shields_results': response_data.get('prompt_shields_results', {}),
                'content_safety_score': response_data.get('content_safety_score', 0),
                'compliance_flags': self._check_compliance_flags(request_data, response_data, compliance_context)
            },
            
            # Technical metadata
            'technical_metadata': {
                'api_version': request_data.get('api_version', ''),
                'deployment_id': request_data.get('deployment_id', ''),
                'region': request_data.get('region', ''),
                'data_residency': response_data.get('processing_region', 'unknown'),
                'encryption_status': 'encrypted_at_rest_and_transit'
            },
            
            # Compliance specific
            'compliance_metadata': {
                'retention_period_days': self._get_retention_period(data_classification),
                'requires_data_masking': data_classification in ['sensitive', 'restricted'],
                'audit_level': self._get_audit_level(data_classification),
                'regulatory_requirements': self._get_regulatory_requirements(user_context, compliance_context)
            }
        }
        
        # Store audit record with appropriate security
        self._store_audit_record(audit_record)
        
        return audit_record
    
    def _classify_data_sensitivity(self, request_data, user_context):
        """Classify data sensitivity level"""
        prompt = request_data.get('prompt', '').lower()
        
        # Check for highly sensitive data
        if any(keyword in prompt for keyword in ['ssn', 'social security', 'credit card', 'bank account']):
            return 'restricted'
        
        # Check for sensitive data
        if any(keyword in prompt for keyword in ['medical', 'health', 'personal', 'confidential']):
            return 'sensitive'
        
        # Check for internal data
        if user_context.get('tenant_id') and any(keyword in prompt for keyword in ['internal', 'company', 'proprietary']):
            return 'internal'
        
        return 'public'
    
    def _check_compliance_flags(self, request_data, response_data, compliance_context):
        """Enhanced compliance checking"""
        flags = []
        
        # Check for potential PII
        if self._contains_potential_pii(request_data.get('prompt', '')):
            flags.append('potential_pii_detected')
        
        # Check content filtering
        if response_data.get('content_filter_results', {}).get('filtered', False):
            flags.append('content_filtered')
        
        # Check prompt shields
        if response_data.get('prompt_shields_results', {}).get('jailbreak_detected', False):
            flags.append('jailbreak_attempt_detected')
        
        # Check for high-risk operations
        if self._is_high_risk_operation(request_data):
            flags.append('high_risk_operation')
        
        # Regulatory compliance checks
        if compliance_context:
            if compliance_context.get('gdpr_applicable', False):
                flags.append('gdpr_applicable')
            if compliance_context.get('hipaa_applicable', False):
                flags.append('hipaa_applicable')
            if compliance_context.get('sox_applicable', False):
                flags.append('sox_applicable')
        
        return flags
    
    def _get_regulatory_requirements(self, user_context, compliance_context):
        """Determine applicable regulatory requirements"""
        requirements = []
        
        # Geographic-based regulations
        region = user_context.get('region', '').lower()
        if region in ['eu', 'europe', 'european-union']:
            requirements.append('GDPR')
        if region in ['us', 'united-states']:
            requirements.extend(['CCPA', 'SOX'])
        
        # Industry-specific regulations
        if compliance_context:
            industry = compliance_context.get('industry', '').lower()
            if industry in ['healthcare', 'medical']:
                requirements.append('HIPAA')
            if industry in ['financial', 'banking']:
                requirements.extend(['SOX', 'PCI-DSS'])
        
        return requirements
    
    def _store_audit_record(self, audit_record):
        """Store audit record with appropriate security measures"""
        # Create blob name with date partitioning
        timestamp = datetime.utcnow()
        blob_name = f"audit-logs/{timestamp.strftime('%Y/%m/%d')}/ai-audit-{audit_record['request_id']}-{timestamp.strftime('%H%M%S')}.json"
        
        # Encrypt sensitive data if needed
        if audit_record['compliance_metadata']['requires_data_masking']:
            audit_record = self._mask_sensitive_data(audit_record)
        
        # Upload to blob storage with metadata
        blob_client = self.blob_service.get_blob_client(
            container=self.container_name,
            blob=blob_name
        )
        
        metadata = {
            'event_type': audit_record['event_type'],
            'data_classification': audit_record['request_metadata']['data_sensitivity'],
            'compliance_flags': ','.join(audit_record['safety_metadata']['compliance_flags']),
            'retention_period': str(audit_record['compliance_metadata']['retention_period_days'])
        }
        
        blob_client.upload_blob(
            json.dumps(audit_record, indent=2),
            overwrite=True,
            metadata=metadata
        )
    
    def generate_compliance_report(self, start_date, end_date, regulatory_framework=None):
        """Generate comprehensive compliance report"""
        
        report = {
            'report_metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'period': {'start': start_date, 'end': end_date},
                'regulatory_framework': regulatory_framework,
                'report_version': '2.0'
            },
            'executive_summary': self._generate_executive_summary(start_date, end_date),
            'usage_statistics': self._get_usage_statistics(start_date, end_date),
            'compliance_events': self._get_compliance_events(start_date, end_date),
            'data_protection_summary': self._get_data_protection_summary(start_date, end_date),
            'security_incidents': self._get_security_incidents(start_date, end_date),
            'recommendations': self._generate_compliance_recommendations()
        }
        
        return report
```

## Best Practices and Recommendations

### 1. Monitoring Strategy
- **Multi-layered approach**: Monitor infrastructure, application, business, and compliance metrics
- **Proactive alerting**: Set up predictive alerts before issues impact users
- **Baseline establishment**: Use ML-based anomaly detection for dynamic baselines
- **Context-aware monitoring**: Include business context in technical metrics

### 2. Privacy and Security
- **Zero-trust architecture**: Assume breach and verify every access
- **Data minimization**: Log only what's necessary for operations and compliance
- **Encryption everywhere**: Encrypt data at rest, in transit, and in processing
- **Regular audits**: Automated compliance scanning and reporting

### 3. Performance Optimization
- **Intelligent sampling**: Use adaptive sampling based on traffic patterns
- **Edge processing**: Process monitoring data closer to sources
- **Automated remediation**: Self-healing systems for common issues
- **Capacity planning**: Predictive scaling based on usage patterns

### 4. Compliance and Governance
- **Regulatory alignment**: Map monitoring to specific compliance requirements
- **Audit trails**: Immutable, tamper-evident logging
- **Data sovereignty**: Ensure monitoring data respects regional requirements
- **Regular assessments**: Automated compliance posture evaluation

## Real-World Implementation Examples

### Healthcare AI Monitoring

```python
# Healthcare-specific monitoring with HIPAA compliance
class HealthcareAIMonitor(AIMonitor):
    def __init__(self):
        super().__init__("healthcare-ai-service")
        self.hipaa_logger = HIPAAComplianceLogger()
    
    def monitor_diagnostic_ai(self, patient_context, diagnostic_request, response):
        """Monitor diagnostic AI with healthcare compliance"""
        
        # Enhanced monitoring for healthcare
        with tracer.start_as_current_span("healthcare_diagnostic_ai") as span:
            span.set_attribute("healthcare.patient_id_hash", 
                             hashlib.sha256(patient_context['patient_id'].encode()).hexdigest())
            span.set_attribute("healthcare.provider_id", patient_context['provider_id'])
            span.set_attribute("healthcare.diagnosis_confidence", response.get('confidence', 0))
            
            # HIPAA compliance tracking
            self.hipaa_logger.log_phi_access(
                patient_context, diagnostic_request, response
            )
            
            # Track diagnostic accuracy
            if 'ground_truth' in patient_context:
                accuracy = self._calculate_diagnostic_accuracy(response, patient_context['ground_truth'])
                span.set_attribute("healthcare.diagnostic_accuracy", accuracy)
```

### Financial Services Monitoring

```python
# Financial services monitoring with regulatory compliance
class FinancialAIMonitor(AIMonitor):
    def monitor_credit_decision(self, customer_context, decision_request, response):
        """Monitor credit decision AI with financial compliance"""
        
        with tracer.start_as_current_span("financial_credit_decision") as span:
            # Track model fairness
            fairness_metrics = self._calculate_fairness_metrics(
                customer_context, response
            )
            
            for metric, value in fairness_metrics.items():
                span.set_attribute(f"fairness.{metric}", value)
            
            # SOX compliance
            self._log_financial_decision(customer_context, decision_request, response)
            
            # Model explainability
            if 'explanation' in response:
                span.set_attribute("explainability.provided", True)
                span.set_attribute("explainability.confidence", 
                                 response['explanation'].get('confidence', 0))
```

## Next Steps

With comprehensive monitoring and logging in place, you're ready to:
1. **Implement cost optimization strategies** - Use monitoring data for intelligent cost management
2. **Enhance security practices** - Leverage audit logs for threat detection
3. **Optimize performance** - Use metrics for continuous improvement
4. **Establish governance frameworks** - Create data-driven AI policies

## References

1. [Azure Monitor Documentation](https://learn.microsoft.com/en-us/azure/azure-monitor/) - Official Azure monitoring guide
2. [Application Insights for AI Services](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) - Detailed telemetry setup
3. [Azure OpenAI Monitoring](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/monitoring) - Service-specific monitoring
4. [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) - Content filtering and safety
5. [Responsible AI with Azure](https://learn.microsoft.com/en-us/azure/machine-learning/concept-responsible-ai) - Ethics and compliance in AI
6. [Azure Security Best Practices](https://learn.microsoft.com/en-us/azure/security/) - Security monitoring guidelines 