# Scaling Your Azure AI Apps

Learn how to scale your Azure AI applications to handle growing user demands, global audiences, and varying workloads while maintaining performance and cost efficiency.

## Learning Objectives

By the end of this lesson, you will be able to:
- Design scalable architectures for AI applications
- Implement autoscaling strategies
- Configure load balancing and traffic distribution
- Deploy applications globally for better performance
- Optimize database and storage scaling
- Monitor and tune application performance

## Understanding Application Scaling

Scaling is the ability to increase or decrease resources to meet demand. There are two main types:

### Vertical Scaling (Scale Up/Down)
- Adding more power (CPU, memory) to existing machines
- Good for: Single-instance applications, legacy systems
- Limitations: Hardware limits, potential downtime

### Horizontal Scaling (Scale Out/In)
- Adding more machines to your resource pool
- Good for: Distributed applications, cloud-native apps
- Benefits: Better fault tolerance, potentially unlimited scaling

## Azure Scaling Services Overview

### Core Scaling Services
- **Azure App Service**: Built-in autoscaling for web apps
- **Azure Kubernetes Service (AKS)**: Container orchestration with scaling
- **Virtual Machine Scale Sets**: Auto-scaling VMs
- **Azure Functions**: Serverless autoscaling
- **Azure Container Apps**: Container scaling with Kubernetes abstraction

### AI-Specific Scaling Considerations
- **Azure OpenAI**: Tokens per minute (TPM) and requests per minute (RPM) limits
- **Azure AI Search**: Search units and replicas
- **Azure Cognitive Services**: Request rate limits and quotas
- **Custom Models**: Compute instance scaling for training and inference

## Implementing Azure App Service Autoscaling

### Basic Autoscaling Configuration

**REST API Example:**
```http
PUT https://management.azure.com/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/serverfarms/{app-service-plan}/autoscalesettings/default
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "properties": {
    "enabled": true,
    "profiles": [
      {
        "name": "Default",
        "capacity": {
          "minimum": "2",
          "maximum": "10",
          "default": "2"
        },
        "rules": [
          {
            "scaleAction": {
              "direction": "Increase",
              "type": "ChangeCount",
              "value": "1",
              "cooldown": "PT5M"
            },
            "metricTrigger": {
              "metricName": "CpuPercentage",
              "threshold": 70,
              "timeAggregation": "Average",
              "timeWindow": "PT5M",
              "operator": "GreaterThan"
            }
          }
        ]
      }
    ]
  }
}
```

**Python Configuration:**
```python
from azure.identity import DefaultAzureCredential
from azure.mgmt.monitor import MonitorManagementClient
from azure.mgmt.monitor.models import *

# Initialize client
credential = DefaultAzureCredential()
monitor_client = MonitorManagementClient(credential, subscription_id)

# Define autoscale settings
autoscale_settings = AutoscaleSettingResource(
    location="East US",
    profiles=[
        AutoscaleProfile(
            name="AI-App-Profile",
            capacity=ScaleCapacity(
                minimum="2",
                maximum="20",
                default="3"
            ),
            rules=[
                # Scale out rule
                ScaleRule(
                    metric_trigger=MetricTrigger(
                        metric_name="CpuPercentage",
                        metric_resource_uri=f"/subscriptions/{subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Web/serverfarms/{app_service_plan}",
                        time_grain="PT1M",
                        statistic="Average",
                        time_window="PT5M",
                        time_aggregation="Average",
                        operator="GreaterThan",
                        threshold=75
                    ),
                    scale_action=ScaleAction(
                        direction="Increase",
                        type="ChangeCount",
                        value="2",
                        cooldown="PT5M"
                    )
                ),
                # Scale in rule
                ScaleRule(
                    metric_trigger=MetricTrigger(
                        metric_name="CpuPercentage",
                        metric_resource_uri=f"/subscriptions/{subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Web/serverfarms/{app_service_plan}",
                        time_grain="PT1M",
                        statistic="Average",
                        time_window="PT10M",
                        time_aggregation="Average",
                        operator="LessThan",
                        threshold=25
                    ),
                    scale_action=ScaleAction(
                        direction="Decrease",
                        type="ChangeCount",
                        value="1",
                        cooldown="PT10M"
                    )
                )
            ]
        )
    ],
    enabled=True,
    target_resource_uri=f"/subscriptions/{subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Web/serverfarms/{app_service_plan}"
)

# Create autoscale setting
result = monitor_client.autoscale_settings.create_or_update(
    resource_group_name=resource_group,
    autoscale_setting_name="ai-app-autoscale",
    parameters=autoscale_settings
)
```

**C# Implementation:**
```csharp
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Monitor;
using Azure.ResourceManager.Monitor.Models;

public async Task ConfigureAutoscaling()
{
    var credential = new DefaultAzureCredential();
    var armClient = new ArmClient(credential);
    
    var subscription = await armClient.GetDefaultSubscriptionAsync();
    var resourceGroup = await subscription.GetResourceGroupAsync("my-ai-app-rg");
    
    var autoscaleSettings = new AutoscaleSettingData(AzureLocation.EastUS)
    {
        IsEnabled = true,
        Profiles = 
        {
            new AutoscaleProfile("AIAppProfile")
            {
                Capacity = new ScaleCapacity("2", "15", "3"),
                Rules = 
                {
                    // Scale out when CPU > 70%
                    new ScaleRule(
                        new MonitorMetricTrigger(
                            "CpuPercentage",
                            new ResourceIdentifier($"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Web/serverfarms/{appServicePlan}"))
                        {
                            TimeGrain = TimeSpan.FromMinutes(1),
                            Statistic = MonitorMetricStatistic.Average,
                            TimeWindow = TimeSpan.FromMinutes(5),
                            TimeAggregation = TimeAggregationType.Average,
                            Operator = ComparisonOperationType.GreaterThan,
                            Threshold = 70
                        },
                        new ScaleAction(ScaleDirection.Increase)
                        {
                            ActionType = ScaleType.ChangeCount,
                            Value = "2",
                            Cooldown = TimeSpan.FromMinutes(5)
                        })
                }
            }
        },
        TargetResourceUri = new ResourceIdentifier($"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Web/serverfarms/{appServicePlan}")
    };
    
    await resourceGroup.Value.GetAutoscaleSettings()
        .CreateOrUpdateAsync(WaitUntil.Completed, "ai-app-autoscale", autoscaleSettings);
}
```

**JavaScript/Node.js Setup:**
```javascript
const { DefaultAzureCredential } = require('@azure/identity');
const { MonitorManagementClient } = require('@azure/arm-monitor');

async function configureAutoscaling() {
    const credential = new DefaultAzureCredential();
    const monitorClient = new MonitorManagementClient(credential, subscriptionId);
    
    const autoscaleSettings = {
        location: 'East US',
        enabled: true,
        profiles: [{
            name: 'AIAppProfile',
            capacity: {
                minimum: '2',
                maximum: '12',
                default: '3'
            },
            rules: [{
                metricTrigger: {
                    metricName: 'CpuPercentage',
                    metricResourceUri: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Web/serverfarms/${appServicePlan}`,
                    timeGrain: 'PT1M',
                    statistic: 'Average',
                    timeWindow: 'PT5M',
                    timeAggregation: 'Average',
                    operator: 'GreaterThan',
                    threshold: 70
                },
                scaleAction: {
                    direction: 'Increase',
                    type: 'ChangeCount',
                    value: '2',
                    cooldown: 'PT5M'
                }
            }]
        }],
        targetResourceUri: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Web/serverfarms/${appServicePlan}`
    };
    
    await monitorClient.autoscaleSettings.createOrUpdate(
        resourceGroup,
        'ai-app-autoscale',
        autoscaleSettings
    );
}
```

## Azure Kubernetes Service (AKS) Scaling

### Horizontal Pod Autoscaler (HPA)

**YAML Configuration:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-chat-app-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-chat-app
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: ai_requests_per_second
      target:
        type: AverageValue
        averageValue: "30"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 25
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 60
      selectPolicy: Max
```

### Cluster Autoscaler Configuration

**Node Pool Autoscaling:**
```bash
# Enable cluster autoscaler
az aks update \
  --resource-group myResourceGroup \
  --name myAKSCluster \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 20

# Create additional node pool for AI workloads
az aks nodepool add \
  --resource-group myResourceGroup \
  --cluster-name myAKSCluster \
  --name gpunodepool \
  --node-count 1 \
  --min-count 0 \
  --max-count 5 \
  --node-vm-size Standard_NC6s_v3 \
  --enable-cluster-autoscaler \
  --node-taints sku=gpu:NoSchedule
```

### Custom Metrics Scaling

**Python Custom Metrics Example:**
```python
from kubernetes import client, config
import json

def create_custom_metric_hpa():
    # Load Kubernetes config
    config.load_incluster_config()  # or load_kube_config() for local
    
    v2_api = client.AutoscalingV2Api()
    
    hpa_manifest = {
        "apiVersion": "autoscaling/v2",
        "kind": "HorizontalPodAutoscaler",
        "metadata": {
            "name": "ai-app-custom-hpa",
            "namespace": "default"
        },
        "spec": {
            "scaleTargetRef": {
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "name": "ai-chat-deployment"
            },
            "minReplicas": 2,
            "maxReplicas": 30,
            "metrics": [
                {
                    "type": "External",
                    "external": {
                        "metric": {
                            "name": "azure_openai_request_rate",
                            "selector": {
                                "matchLabels": {
                                    "app": "ai-chat-app"
                                }
                            }
                        },
                        "target": {
                            "type": "AverageValue",
                            "averageValue": "50"
                        }
                    }
                }
            ]
        }
    }
    
    v2_api.create_namespaced_horizontal_pod_autoscaler(
        namespace="default",
        body=hpa_manifest
    )
```

## Load Balancing Strategies

### Azure Application Gateway with AI Apps

**ARM Template for Application Gateway:**
```json
{
  "type": "Microsoft.Network/applicationGateways",
  "apiVersion": "2021-03-01",
  "name": "ai-app-gateway",
  "location": "[resourceGroup().location]",
  "properties": {
    "sku": {
      "name": "WAF_v2",
      "tier": "WAF_v2",
      "capacity": 2
    },
    "autoscaleConfiguration": {
      "minCapacity": 2,
      "maxCapacity": 20
    },
    "gatewayIPConfigurations": [
      {
        "name": "appGatewayIpConfig",
        "properties": {
          "subnet": {
            "id": "[variables('subnetRef')]"
          }
        }
      }
    ],
    "frontendIPConfigurations": [
      {
        "name": "appGwPublicFrontendIp",
        "properties": {
          "privateIPAllocationMethod": "Dynamic",
          "publicIPAddress": {
            "id": "[resourceId('Microsoft.Network/publicIPAddresses', 'ai-app-pip')]"
          }
        }
      }
    ],
    "backendAddressPools": [
      {
        "name": "ai-backend-pool",
        "properties": {
          "backendAddresses": [
            {
              "fqdn": "ai-app-primary.azurewebsites.net"
            },
            {
              "fqdn": "ai-app-secondary.azurewebsites.net"
            }
          ]
        }
      }
    ],
    "loadDistributionPolicies": [
      {
        "name": "roundRobinPolicy",
        "properties": {
          "loadDistributionTargets": [
            {
              "name": "primary",
              "weight": 70
            },
            {
              "name": "secondary", 
              "weight": 30
            }
          ],
          "loadDistributionAlgorithm": "RoundRobin"
        }
      }
    ],
    "httpListeners": [
      {
        "name": "appGwHttpsListener",
        "properties": {
          "frontendIPConfiguration": {
            "id": "[concat(variables('applicationGatewayID'), '/frontendIPConfigurations/appGwPublicFrontendIp')]"
          },
          "frontendPort": {
            "id": "[concat(variables('applicationGatewayID'), '/frontendPorts/port_443')]"
          },
          "protocol": "Https",
          "sslCertificate": {
            "id": "[concat(variables('applicationGatewayID'), '/sslCertificates/ai-app-cert')]"
          }
        }
      }
    ]
  }
}
```

### Azure Front Door for Global Distribution

**Python Configuration for Azure Front Door:**
```python
from azure.identity import DefaultAzureCredential
from azure.mgmt.frontdoor import FrontDoorManagementClient
from azure.mgmt.frontdoor.models import *

def create_front_door_profile():
    credential = DefaultAzureCredential()
    front_door_client = FrontDoorManagementClient(credential, subscription_id)
    
    front_door_config = FrontDoor(
        location='global',
        friendly_name='AI-App-Global-Distribution',
        routing_rules=[
            RoutingRule(
                name='ai-app-routing',
                patterns_to_match=['/*'],
                frontend_endpoints=[
                    SubResource(id='/subscriptions/{}/resourceGroups/{}/providers/Microsoft.Network/frontDoors/{}/frontendEndpoints/ai-app-frontend'.format(
                        subscription_id, resource_group, front_door_name))
                ],
                accepted_protocols=['Http', 'Https'],
                route_configuration=ForwardingConfiguration(
                    forwarding_protocol='HttpsOnly',
                    backend_pool=SubResource(id='/subscriptions/{}/resourceGroups/{}/providers/Microsoft.Network/frontDoors/{}/backendPools/ai-backend-pool'.format(
                        subscription_id, resource_group, front_door_name))
                )
            )
        ],
        backend_pools=[
            BackendPool(
                name='ai-backend-pool',
                backends=[
                    Backend(
                        address='ai-app-eastus.azurewebsites.net',
                        http_port=80,
                        https_port=443,
                        weight=100,
                        priority=1,
                        enabled_state='Enabled'
                    ),
                    Backend(
                        address='ai-app-westus.azurewebsites.net',
                        http_port=80,
                        https_port=443,
                        weight=100,
                        priority=2,
                        enabled_state='Enabled'
                    ),
                    Backend(
                        address='ai-app-europe.azurewebsites.net',
                        http_port=80,
                        https_port=443,
                        weight=100,
                        priority=3,
                        enabled_state='Enabled'
                    )
                ],
                load_balancing_settings=SubResource(id='/subscriptions/{}/resourceGroups/{}/providers/Microsoft.Network/frontDoors/{}/loadBalancingSettings/default'.format(
                    subscription_id, resource_group, front_door_name)),
                health_probe_settings=SubResource(id='/subscriptions/{}/resourceGroups/{}/providers/Microsoft.Network/frontDoors/{}/healthProbeSettings/default'.format(
                    subscription_id, resource_group, front_door_name))
            )
        ],
        frontend_endpoints=[
            FrontendEndpoint(
                name='ai-app-frontend',
                host_name=f'{front_door_name}.azurefd.net',
                session_affinity_enabled_state='Disabled'
            )
        ],
        load_balancing_settings=[
            LoadBalancingSettingsModel(
                name='default',
                sample_size=4,
                successful_samples_required=2,
                additional_latency_milliseconds=0
            )
        ],
        health_probe_settings=[
            HealthProbeSettingsModel(
                name='default',
                path='/health',
                protocol='Https',
                interval_in_seconds=30,
                health_probe_method='HEAD'
            )
        ]
    )
    
    operation = front_door_client.front_doors.begin_create_or_update(
        resource_group_name=resource_group,
        front_door_name=front_door_name,
        front_door_parameters=front_door_config
    )
    
    return operation.result()
```

## Database and Storage Scaling

### Azure Cosmos DB Autoscale

**C# Configuration:**
```csharp
using Microsoft.Azure.Cosmos;

public async Task ConfigureCosmosDBAutoscale()
{
    var cosmosClient = new CosmosClient(connectionString);
    var database = cosmosClient.GetDatabase("AIAppDB");
    
    // Create container with autoscale
    var containerProperties = new ContainerProperties
    {
        Id = "ChatHistory",
        PartitionKeyPath = "/userId"
    };
    
    // Set autoscale throughput (4000 RU/s max, scales down to 400 RU/s)
    var throughputProperties = ThroughputProperties.CreateAutoscaleThroughput(4000);
    
    await database.CreateContainerAsync(
        containerProperties, 
        throughputProperties
    );
    
    // Update existing container to autoscale
    var container = database.GetContainer("ExistingContainer");
    await container.ReplaceThroughputAsync(throughputProperties);
}
```

**REST API for Cosmos DB Scaling:**
```http
PUT https://management.azure.com/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.DocumentDB/databaseAccounts/{account}/sqlDatabases/{database}/containers/{container}/throughputSettings/default
Authorization: Bearer {access-token}
Content-Type: application/json

{
  "properties": {
    "resource": {
      "autoscaleSettings": {
        "maxThroughput": 10000
      }
    }
  }
}
```

### Azure SQL Database Scaling

**Python Example:**
```python
from azure.identity import DefaultAzureCredential
from azure.mgmt.sql import SqlManagementClient

def scale_sql_database():
    credential = DefaultAzureCredential()
    sql_client = SqlManagementClient(credential, subscription_id)
    
    # Scale up to higher tier during peak hours
    database_update = {
        'sku': {
            'name': 'S2',  # Standard tier
            'tier': 'Standard',
            'capacity': 50  # DTUs
        }
    }
    
    operation = sql_client.databases.begin_update(
        resource_group_name=resource_group,
        server_name=sql_server,
        database_name=database_name,
        parameters=database_update
    )
    
    return operation.result()

def enable_auto_scaling():
    # Enable automatic tuning
    auto_tuning_settings = {
        'desired_state': 'Auto',
        'actual_state': 'Auto',
        'options': {
            'createIndex': {'desired_state': 'On'},
            'dropIndex': {'desired_state': 'On'},
            'forceLastGoodPlan': {'desired_state': 'On'}
        }
    }
    
    sql_client.database_automatic_tuning.update(
        resource_group_name=resource_group,
        server_name=sql_server,
        database_name=database_name,
        parameters=auto_tuning_settings
    )
```

## Global Distribution Strategies

### Multi-Region Deployment with Traffic Manager

**ARM Template for Traffic Manager:**
```json
{
  "type": "Microsoft.Network/trafficmanagerprofiles",
  "apiVersion": "2018-08-01",
  "name": "ai-app-traffic-manager",
  "location": "global",
  "properties": {
    "profileStatus": "Enabled",
    "trafficRoutingMethod": "Performance",
    "dnsConfig": {
      "relativeName": "ai-app-global",
      "ttl": 30
    },
    "monitorConfig": {
      "protocol": "HTTPS",
      "port": 443,
      "path": "/health",
      "intervalInSeconds": 30,
      "timeoutInSeconds": 10,
      "toleratedNumberOfFailures": 3
    },
    "endpoints": [
      {
        "name": "ai-app-eastus",
        "type": "Microsoft.Network/trafficManagerProfiles/azureEndpoints",
        "properties": {
          "targetResourceId": "[resourceId('Microsoft.Web/sites', 'ai-app-eastus')]",
          "endpointStatus": "Enabled",
          "weight": 100,
          "priority": 1,
          "endpointLocation": "East US"
        }
      },
      {
        "name": "ai-app-westeurope", 
        "type": "Microsoft.Network/trafficManagerProfiles/azureEndpoints",
        "properties": {
          "targetResourceId": "[resourceId('Microsoft.Web/sites', 'ai-app-westeurope')]",
          "endpointStatus": "Enabled",
          "weight": 100,
          "priority": 2,
          "endpointLocation": "West Europe"
        }
      }
    ]
  }
}
```

### CDN Integration for Static Assets

**JavaScript Configuration:**
```javascript
const { DefaultAzureCredential } = require('@azure/identity');
const { CdnManagementClient } = require('@azure/arm-cdn');

async function setupCDN() {
    const credential = new DefaultAzureCredential();
    const cdnClient = new CdnManagementClient(credential, subscriptionId);
    
    // Create CDN profile
    const cdnProfile = {
        location: 'global',
        sku: {
            name: 'Standard_Microsoft'
        },
        kind: 'cdn'
    };
    
    await cdnClient.profiles.beginCreateAndWait(
        resourceGroupName,
        'ai-app-cdn-profile',
        cdnProfile
    );
    
    // Create CDN endpoint
    const cdnEndpoint = {
        location: 'global',
        origins: [{
            name: 'ai-app-origin',
            hostName: 'aiappstorage.blob.core.windows.net',
            httpPort: 80,
            httpsPort: 443
        }],
        isHttpAllowed: false,
        isHttpsAllowed: true,
        optimizationType: 'GeneralWebDelivery',
        originHostHeader: 'aiappstorage.blob.core.windows.net',
        deliveryPolicy: {
            rules: [{
                name: 'CacheStaticAssets',
                order: 1,
                conditions: [{
                    name: 'UrlFileExtension',
                    parameters: {
                        operator: 'Equal',
                        matchValues: ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg']
                    }
                }],
                actions: [{
                    name: 'CacheExpiration',
                    parameters: {
                        cacheBehavior: 'SetIfMissing',
                        cacheType: 'All',
                        cacheDuration: '30.00:00:00'  // 30 days
                    }
                }]
            }]
        }
    };
    
    await cdnClient.endpoints.beginCreateAndWait(
        resourceGroupName,
        'ai-app-cdn-profile',
        'ai-app-endpoint',
        cdnEndpoint
    );
}
```

## Performance Monitoring and Optimization

### Application Insights Integration

**Python Application Monitoring:**
```python
from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.ext.azure import metrics_exporter
from opencensus.stats import aggregation as aggregation_module
from opencensus.stats import measure as measure_module
from opencensus.stats import stats as stats_module
from opencensus.stats import view as view_module
from opencensus.tags import tag_map as tag_map_module
import logging
import time

# Configure Application Insights
logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(connection_string='InstrumentationKey=your-key'))

# Custom metrics for AI performance
stats = stats_module.stats
view_manager = stats.view_manager
stats_recorder = stats.stats_recorder

# Define custom measures
ai_request_latency = measure_module.MeasureFloat(
    "ai_request_latency", 
    "Latency of AI requests", 
    "ms"
)

ai_token_usage = measure_module.MeasureInt(
    "ai_token_usage",
    "Number of tokens used in AI requests",
    "tokens"
)

# Create views for the measures
latency_view = view_module.View(
    "ai_request_latency_view",
    "Distribution of AI request latencies",
    [],
    ai_request_latency,
    aggregation_module.DistributionAggregation([0, 100, 500, 1000, 2000, 5000])
)

token_view = view_module.View(
    "ai_token_usage_view", 
    "Sum of AI tokens used",
    [],
    ai_token_usage,
    aggregation_module.SumAggregation()
)

view_manager.register_view(latency_view)
view_manager.register_view(token_view)

# Configure metrics exporter
exporter = metrics_exporter.new_metrics_exporter(
    connection_string='InstrumentationKey=your-key'
)
view_manager.register_exporter(exporter)

class AIPerformanceMonitor:
    def __init__(self):
        self.tag_map = tag_map_module.TagMap()
    
    def track_ai_request(self, func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                
                # Track successful request
                latency = (time.time() - start_time) * 1000  # Convert to ms
                stats_recorder.new_measurement_map().measure_float_put(
                    ai_request_latency, latency
                ).record(self.tag_map)
                
                # Track token usage if available
                if hasattr(result, 'usage') and hasattr(result.usage, 'total_tokens'):
                    stats_recorder.new_measurement_map().measure_int_put(
                        ai_token_usage, result.usage.total_tokens
                    ).record(self.tag_map)
                
                logger.info(f"AI request completed successfully. Latency: {latency}ms")
                return result
                
            except Exception as e:
                logger.error(f"AI request failed: {str(e)}")
                raise
        
        return wrapper

# Usage example
monitor = AIPerformanceMonitor()

@monitor.track_ai_request
def call_openai_api(prompt):
    # Your OpenAI API call here
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response
```

### Custom Dashboards and Alerting

**Azure Monitor Alert Rules (ARM Template):**
```json
{
  "type": "Microsoft.Insights/metricAlerts",
  "apiVersion": "2018-03-01",
  "name": "AI-App-High-Response-Time",
  "location": "global",
  "properties": {
    "description": "Alert when AI app response time exceeds threshold",
    "severity": 2,
    "enabled": true,
    "scopes": [
      "[resourceId('Microsoft.Web/sites', 'ai-app-webapp')]"
    ],
    "evaluationFrequency": "PT1M",
    "windowSize": "PT5M",
    "criteria": {
      "odata.type": "Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria",
      "allOf": [
        {
          "name": "HighResponseTime",
          "metricName": "HttpResponseTime",
          "operator": "GreaterThan",
          "threshold": 5000,
          "timeAggregation": "Average",
          "criterionType": "StaticThresholdCriterion"
        }
      ]
    },
    "actions": [
      {
        "actionGroupId": "[resourceId('Microsoft.Insights/actionGroups', 'ai-app-alerts')]"
      }
    ]
  }
}
```

## Best Practices and Real-World Examples

### E-Commerce AI Recommendation Engine

**Scenario**: An e-commerce platform needs to scale their AI-powered recommendation engine during Black Friday sales.

**Implementation**:
```python
# Scaling strategy implementation
class ECommerceAIScaler:
    def __init__(self):
        self.current_load = 0
        self.prediction_cache = {}
        
    def configure_scaling_strategy(self):
        """Configure multi-tier scaling strategy"""
        
        # Tier 1: Cache popular recommendations
        self.setup_redis_cache()
        
        # Tier 2: Horizontal scaling of API instances
        self.configure_app_service_scaling()
        
        # Tier 3: Scale ML model inference
        self.setup_aks_model_scaling()
        
        # Tier 4: Database read replicas
        self.configure_database_scaling()
    
    def setup_redis_cache(self):
        """Configure Redis for recommendation caching"""
        redis_config = {
            "sku": {"name": "Premium", "family": "P", "capacity": 1},
            "redis_configuration": {
                "maxclients": "7500",
                "maxmemory-reserved": "200",
                "maxfragmentationmemory-reserved": "300"
            },
            "enable_non_ssl_port": False,
            "minimum_tls_version": "1.2"
        }
        return redis_config
    
    def predict_scaling_needs(self, current_metrics):
        """Use ML to predict scaling needs"""
        features = [
            current_metrics['requests_per_second'],
            current_metrics['cpu_usage'],
            current_metrics['memory_usage'],
            current_metrics['queue_length']
        ]
        
        # Simplified prediction logic
        predicted_load = sum(features) / len(features) * 1.2
        
        if predicted_load > 80:
            return "scale_up"
        elif predicted_load < 30:
            return "scale_down"
        else:
            return "maintain"
```

### Healthcare AI Diagnostics Platform

**Scenario**: A healthcare platform needs to ensure high availability and compliance while scaling their AI diagnostics service.

**Key Considerations**:
- HIPAA compliance requirements
- 99.99% uptime SLA
- Data residency requirements
- Audit logging for all AI decisions

```csharp
public class HealthcareAIScaler
{
    public async Task<ScalingStrategy> DetermineScalingStrategy(
        HealthMetrics metrics, 
        ComplianceRequirements requirements)
    {
        var strategy = new ScalingStrategy();
        
        // Ensure compliance during scaling
        if (requirements.RequiresDataResidency)
        {
            strategy.RestrictToRegions(requirements.AllowedRegions);
        }
        
        // Configure health checks for medical AI
        strategy.HealthChecks.Add(new HealthCheck
        {
            Endpoint = "/health/ai-model",
            Interval = TimeSpan.FromSeconds(30),
            Timeout = TimeSpan.FromSeconds(10),
            HealthyThreshold = 2,
            UnhealthyThreshold = 3
        });
        
        // Set conservative scaling to prevent service disruption
        strategy.ScaleUpPolicy = new ScalePolicy
        {
            MetricThreshold = 60, // Lower threshold for critical systems
            CooldownPeriod = TimeSpan.FromMinutes(10),
            ScaleIncrement = 1 // Scale gradually
        };
        
        // Ensure audit logging during scaling events
        strategy.OnScaleEvent += LogScalingEvent;
        
        return strategy;
    }
    
    private void LogScalingEvent(ScalingEventArgs args)
    {
        // Log for compliance audit trail
        var auditLog = new AuditLogEntry
        {
            Timestamp = DateTime.UtcNow,
            EventType = "AutoScale",
            Description = $"Scaled {args.Direction} from {args.PreviousCount} to {args.NewCount} instances",
            UserId = "system",
            ComplianceFlags = new[] { "HIPAA", "SOC2" }
        };
        
        _auditLogger.LogEvent(auditLog);
    }
}
```

## Troubleshooting Common Scaling Issues

### Issue 1: Slow Scale-Out Response

**Problem**: Application takes too long to scale out during traffic spikes.

**Solution**:
```python
def optimize_scale_out_time():
    """Strategies to reduce scale-out time"""
    
    # 1. Pre-warm instances
    pre_warm_config = {
        "always_on": True,
        "app_settings": {
            "WEBSITE_SWAP_WARMUP_PING_PATH": "/warmup",
            "WEBSITE_SWAP_WARMUP_PING_STATUSES": "200,202"
        }
    }
    
    # 2. Use smaller scale increments more frequently
    scale_settings = {
        "scale_out_increment": 2,  # Instead of 5
        "scale_out_interval": "PT2M",  # Every 2 minutes
        "cooldown_period": "PT3M"  # 3 minute cooldown
    }
    
    # 3. Implement readiness probes
    readiness_probe = {
        "path": "/ready",
        "initial_delay_seconds": 10,
        "period_seconds": 5,
        "timeout_seconds": 3,
        "success_threshold": 1,
        "failure_threshold": 3
    }
    
    return {
        "pre_warm": pre_warm_config,
        "scaling": scale_settings,
        "readiness": readiness_probe
    }
```

### Issue 2: Database Bottlenecks During Scale

**Problem**: Database becomes a bottleneck as application scales.

**Solution**:
```sql
-- Optimize database for scaling
-- 1. Add read replicas
CREATE DATABASE [AIApp_ReadReplica] AS COPY OF [AIApp]
(
    SERVICE_OBJECTIVE = 'S2'
);

-- 2. Implement connection pooling
-- Application configuration
{
  "ConnectionStrings": {
    "Primary": "Server=aiapp-primary.database.windows.net;Database=AIApp;Connection Timeout=30;Max Pool Size=50;",
    "ReadOnly": "Server=aiapp-readonly.database.windows.net;Database=AIApp;Connection Timeout=30;Max Pool Size=30;"
  }
}

-- 3. Optimize queries for scale
CREATE INDEX IX_UserSessions_UserId_CreatedDate 
ON UserSessions (UserId, CreatedDate DESC) 
INCLUDE (SessionData);

-- 4. Implement caching strategy
```

## Key Takeaways

1. **Plan for Scale**: Design your application architecture with scaling in mind from the beginning
2. **Use Multiple Strategies**: Combine vertical and horizontal scaling, caching, and optimization
3. **Monitor Continuously**: Implement comprehensive monitoring and alerting
4. **Test Scaling**: Regularly test your scaling scenarios under load
5. **Consider Costs**: Balance performance needs with cost optimization
6. **Plan for Global**: Consider global distribution for better user experience
7. **Automate Everything**: Use automation for scaling decisions and responses

## Next Steps

- Implement monitoring and logging strategies
- Learn about cost optimization techniques
- Practice with different scaling scenarios
- Set up automated scaling for your applications

## References

[1] [Azure App Service Autoscaling](https://docs.microsoft.com/en-us/azure/app-service/manage-scale-up)
[2] [AKS Cluster Autoscaler](https://docs.microsoft.com/en-us/azure/aks/cluster-autoscaler)
[3] [Azure Front Door](https://docs.microsoft.com/en-us/azure/frontdoor/)
[4] [Application Gateway](https://docs.microsoft.com/en-us/azure/application-gateway/)
[5] [Traffic Manager](https://docs.microsoft.com/en-us/azure/traffic-manager/)
[6] [Azure Monitor Autoscale](https://docs.microsoft.com/en-us/azure/azure-monitor/autoscale/) 