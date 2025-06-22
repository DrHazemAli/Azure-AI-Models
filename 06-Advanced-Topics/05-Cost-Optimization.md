# Lesson 5: Cost Optimization - Maximizing ROI from Azure AI Services

Welcome to our final lesson in Advanced Topics! Today we'll explore comprehensive cost optimization strategies for Azure AI services. You'll learn how to reduce expenses while maintaining performance, implement intelligent scaling, and maximize your return on investment.

## Learning Objectives

By the end of this lesson, you will:
- Understand Azure AI pricing models and cost factors
- Implement token optimization and prompt engineering strategies
- Configure intelligent scaling and resource management
- Use caching and batching techniques to reduce costs
- Monitor and optimize AI spending patterns
- Implement cost governance and budget controls

## Introduction to AI Cost Management

AI services can quickly become expensive without proper optimization. Understanding cost drivers and implementing strategic optimizations can reduce expenses by 30-70% while maintaining or improving performance.

### Azure AI Cost Factors

Key cost drivers include:
- **Token usage**: Input and output tokens for language models
- **API calls**: Number of requests and response complexity
- **Compute resources**: Processing power and memory usage
- **Storage**: Data storage and retrieval costs
- **Bandwidth**: Data transfer and network usage

## Token Optimization Strategies

### Prompt Engineering for Efficiency

```python
# Efficient prompt engineering
class PromptOptimizer:
    def __init__(self):
        self.token_costs = {
            'gpt-4': {'input': 0.03, 'output': 0.06},
            'gpt-3.5-turbo': {'input': 0.001, 'output': 0.002},
            'gpt-4o-mini': {'input': 0.00015, 'output': 0.0006}
        }
    
    def optimize_prompt(self, original_prompt, context_data):
        """Optimize prompt for token efficiency"""
        
        # Remove unnecessary words and redundancy
        optimized_prompt = self.remove_redundancy(original_prompt)
        
        # Use structured format for better parsing
        optimized_prompt = self.structure_prompt(optimized_prompt)
        
        # Add context efficiently
        optimized_prompt = self.add_efficient_context(optimized_prompt, context_data)
        
        return optimized_prompt
    
    def remove_redundancy(self, prompt):
        """Remove redundant words and phrases"""
        # Common redundant phrases to remove
        redundant_phrases = [
            'please', 'could you', 'I would like you to',
            'if you could', 'it would be great if'
        ]
        
        optimized = prompt
        for phrase in redundant_phrases:
            optimized = optimized.replace(phrase, '')
        
        # Remove extra whitespace
        optimized = ' '.join(optimized.split())
        
        return optimized
    
    def structure_prompt(self, prompt):
        """Structure prompt for better token efficiency"""
        # Use bullet points instead of sentences
        # Use abbreviations where appropriate
        # Organize information hierarchically
        
        structured = f"""
Task: {prompt}
Format: JSON
Requirements:
- Concise responses
- Structured output
- Key points only
"""
        return structured
    
    def calculate_token_cost(self, model, input_tokens, output_tokens):
        """Calculate cost for token usage"""
        input_cost = (input_tokens / 1000) * self.token_costs[model]['input']
        output_cost = (output_tokens / 1000) * self.token_costs[model]['output']
        
        return {
            'input_cost': input_cost,
            'output_cost': output_cost,
            'total_cost': input_cost + output_cost
        }
    
    def compare_optimization(self, original_prompt, optimized_prompt, model='gpt-3.5-turbo'):
        """Compare costs before and after optimization"""
        original_tokens = self.estimate_tokens(original_prompt)
        optimized_tokens = self.estimate_tokens(optimized_prompt)
        
        original_cost = self.calculate_token_cost(model, original_tokens, original_tokens)
        optimized_cost = self.calculate_token_cost(model, optimized_tokens, optimized_tokens)
        
        savings = original_cost['total_cost'] - optimized_cost['total_cost']
        savings_percentage = (savings / original_cost['total_cost']) * 100
        
        return {
            'original_cost': original_cost['total_cost'],
            'optimized_cost': optimized_cost['total_cost'],
            'savings': savings,
            'savings_percentage': savings_percentage
        }
```

### Model Selection Optimization

```python
# Intelligent model selection based on task complexity
class ModelSelector:
    def __init__(self):
        self.models = {
            'gpt-4': {'cost': 0.09, 'capability': 10, 'speed': 3},
            'gpt-3.5-turbo': {'cost': 0.003, 'capability': 7, 'speed': 8},
            'gpt-4o-mini': {'cost': 0.00075, 'capability': 6, 'speed': 9}
        }
    
    def select_optimal_model(self, task_complexity, speed_requirement, budget_constraint):
        """Select the most cost-effective model for the task"""
        
        suitable_models = []
        
        for model, specs in self.models.items():
            # Check if model meets requirements
            if (specs['capability'] >= task_complexity and 
                specs['speed'] >= speed_requirement and
                specs['cost'] <= budget_constraint):
                
                # Calculate efficiency score
                efficiency = specs['capability'] / specs['cost']
                suitable_models.append({
                    'model': model,
                    'efficiency': efficiency,
                    'cost': specs['cost'],
                    'capability': specs['capability']
                })
        
        # Sort by efficiency (capability per cost)
        suitable_models.sort(key=lambda x: x['efficiency'], reverse=True)
        
        return suitable_models[0] if suitable_models else None
    
    def batch_optimize_model_selection(self, tasks):
        """Optimize model selection for multiple tasks"""
        optimized_assignments = []
        
        for task in tasks:
            optimal_model = self.select_optimal_model(
                task['complexity'],
                task['speed_requirement'],
                task['budget']
            )
            
            if optimal_model:
                optimized_assignments.append({
                    'task_id': task['id'],
                    'model': optimal_model['model'],
                    'estimated_cost': optimal_model['cost'],
                    'efficiency_score': optimal_model['efficiency']
                })
        
        return optimized_assignments
```

## Caching and Batching Strategies

### Intelligent Caching System

```python
# Advanced caching for AI responses
import hashlib
import json
from datetime import datetime, timedelta
import redis

class AIResponseCache:
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.cache_ttl = 3600  # 1 hour default
        self.similarity_threshold = 0.85
    
    def generate_cache_key(self, prompt, model, parameters):
        """Generate consistent cache key"""
        cache_data = {
            'prompt': prompt.strip().lower(),
            'model': model,
            'parameters': sorted(parameters.items())
        }
        
        cache_string = json.dumps(cache_data, sort_keys=True)
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    def get_cached_response(self, prompt, model, parameters):
        """Retrieve cached response if available"""
        cache_key = self.generate_cache_key(prompt, model, parameters)
        
        cached_data = self.redis_client.get(cache_key)
        if cached_data:
            response_data = json.loads(cached_data)
            
            # Check if cache is still valid
            cache_time = datetime.fromisoformat(response_data['timestamp'])
            if datetime.now() - cache_time < timedelta(seconds=self.cache_ttl):
                return response_data['response']
        
        return None
    
    def cache_response(self, prompt, model, parameters, response):
        """Cache AI response for future use"""
        cache_key = self.generate_cache_key(prompt, model, parameters)
        
        cache_data = {
            'response': response,
            'timestamp': datetime.now().isoformat(),
            'model': model,
            'parameters': parameters
        }
        
        self.redis_client.setex(
            cache_key,
            self.cache_ttl,
            json.dumps(cache_data)
        )
    
    def find_similar_cached_response(self, prompt, model):
        """Find similar cached responses using semantic similarity"""
        # This would use embedding similarity in production
        # Simplified version for demonstration
        
        pattern = f"cache:{model}:*"
        cached_keys = self.redis_client.keys(pattern)
        
        for key in cached_keys:
            cached_data = json.loads(self.redis_client.get(key))
            cached_prompt = cached_data.get('prompt', '')
            
            # Simple similarity check (would use embeddings in production)
            similarity = self.calculate_similarity(prompt, cached_prompt)
            
            if similarity > self.similarity_threshold:
                return cached_data['response']
        
        return None
    
    def calculate_similarity(self, text1, text2):
        """Calculate similarity between texts (simplified)"""
        # In production, use proper embedding similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0
```

### Batch Processing for Cost Reduction

```javascript
// JavaScript batch processing implementation
class BatchProcessor {
    constructor(maxBatchSize = 10, maxWaitTime = 5000) {
        this.maxBatchSize = maxBatchSize;
        this.maxWaitTime = maxWaitTime;
        this.requestQueue = [];
        this.processingTimer = null;
    }
    
    async addRequest(prompt, options = {}) {
        return new Promise((resolve, reject) => {
            const request = {
                prompt,
                options,
                resolve,
                reject,
                timestamp: Date.now()
            };
            
            this.requestQueue.push(request);
            
            // Process if batch is full or start timer
            if (this.requestQueue.length >= this.maxBatchSize) {
                this.processBatch();
            } else if (!this.processingTimer) {
                this.processingTimer = setTimeout(() => {
                    this.processBatch();
                }, this.maxWaitTime);
            }
        });
    }
    
    async processBatch() {
        if (this.requestQueue.length === 0) return;
        
        // Clear timer
        if (this.processingTimer) {
            clearTimeout(this.processingTimer);
            this.processingTimer = null;
        }
        
        // Extract batch
        const batch = this.requestQueue.splice(0, this.maxBatchSize);
        
        try {
            // Process batch efficiently
            const results = await this.processAIBatch(batch);
            
            // Resolve individual requests
            batch.forEach((request, index) => {
                request.resolve(results[index]);
            });
            
        } catch (error) {
            // Reject all requests in batch
            batch.forEach(request => {
                request.reject(error);
            });
        }
        
        // Process remaining requests if any
        if (this.requestQueue.length > 0) {
            this.processingTimer = setTimeout(() => {
                this.processBatch();
            }, this.maxWaitTime);
        }
    }
    
    async processAIBatch(batch) {
        // Combine prompts for efficient processing
        const combinedPrompt = this.combinePrompts(batch);
        
        // Single API call for entire batch
        const response = await this.callAIService(combinedPrompt);
        
        // Split response back into individual results
        return this.splitBatchResponse(response, batch.length);
    }
    
    combinePrompts(batch) {
        // Efficiently combine multiple prompts
        const prompts = batch.map((req, index) => 
            `Request ${index + 1}: ${req.prompt}`
        ).join('\n\n');
        
        return `Process the following requests separately:\n\n${prompts}\n\nProvide responses in the same order, separated by "---RESPONSE---"`;
    }
    
    splitBatchResponse(response, batchSize) {
        // Split combined response back into individual responses
        const responses = response.split('---RESPONSE---');
        
        // Ensure we have the right number of responses
        if (responses.length !== batchSize) {
            throw new Error(`Expected ${batchSize} responses, got ${responses.length}`);
        }
        
        return responses.map(resp => resp.trim());
    }
}
```

## Resource Management and Scaling

### Auto-scaling Based on Demand

```csharp
// C# implementation for intelligent scaling
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

public class AIResourceScaler : BackgroundService
{
    private readonly ILogger<AIResourceScaler> _logger;
    private readonly IAIResourceManager _resourceManager;
    private readonly IMetricsCollector _metricsCollector;
    
    public AIResourceScaler(
        ILogger<AIResourceScaler> logger,
        IAIResourceManager resourceManager,
        IMetricsCollector metricsCollector)
    {
        _logger = logger;
        _resourceManager = resourceManager;
        _metricsCollector = metricsCollector;
    }
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await OptimizeResources();
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in resource optimization");
            }
        }
    }
    
    private async Task OptimizeResources()
    {
        // Get current metrics
        var metrics = await _metricsCollector.GetCurrentMetrics();
        
        // Analyze demand patterns
        var demandAnalysis = AnalyzeDemandPatterns(metrics);
        
        // Scale resources based on demand
        await ScaleResources(demandAnalysis);
        
        // Optimize costs
        await OptimizeCosts(demandAnalysis);
    }
    
    private DemandAnalysis AnalyzeDemandPatterns(ResourceMetrics metrics)
    {
        return new DemandAnalysis
        {
            CurrentLoad = metrics.RequestsPerMinute,
            PredictedLoad = PredictFutureLoad(metrics.HistoricalData),
            CostPerRequest = metrics.TotalCost / metrics.TotalRequests,
            ResourceUtilization = metrics.CpuUtilization,
            QueueLength = metrics.QueueLength
        };
    }
    
    private async Task ScaleResources(DemandAnalysis analysis)
    {
        // Scale up if needed
        if (analysis.PredictedLoad > analysis.CurrentCapacity * 0.8)
        {
            await _resourceManager.ScaleUp(
                targetCapacity: (int)(analysis.PredictedLoad * 1.2),
                reason: "High demand predicted"
            );
        }
        
        // Scale down if underutilized
        if (analysis.ResourceUtilization < 0.3 && analysis.QueueLength == 0)
        {
            await _resourceManager.ScaleDown(
                targetCapacity: Math.Max(1, (int)(analysis.CurrentCapacity * 0.7)),
                reason: "Low utilization detected"
            );
        }
    }
    
    private async Task OptimizeCosts(DemandAnalysis analysis)
    {
        // Switch to cheaper models during low-demand periods
        if (analysis.CurrentLoad < analysis.AverageLoad * 0.5)
        {
            await _resourceManager.SwitchToEconomyMode();
        }
        
        // Use spot instances for batch processing
        if (analysis.HasBatchWorkload)
        {
            await _resourceManager.UseSpotInstances();
        }
    }
}
```

### Cost-Aware Load Balancing

```python
# Cost-aware load balancing implementation
class CostAwareLoadBalancer:
    def __init__(self):
        self.endpoints = {}
        self.cost_tracking = {}
        self.performance_metrics = {}
    
    def register_endpoint(self, endpoint_id, model_type, cost_per_request, max_requests_per_minute):
        """Register an AI endpoint with cost information"""
        self.endpoints[endpoint_id] = {
            'model_type': model_type,
            'cost_per_request': cost_per_request,
            'max_rpm': max_requests_per_minute,
            'current_rpm': 0,
            'total_requests': 0,
            'total_cost': 0,
            'avg_response_time': 0,
            'success_rate': 1.0
        }
    
    def select_endpoint(self, request_type, budget_constraint=None, priority='balanced'):
        """Select optimal endpoint based on cost and performance"""
        
        suitable_endpoints = []
        
        for endpoint_id, endpoint in self.endpoints.items():
            # Check capacity
            if endpoint['current_rpm'] >= endpoint['max_rpm']:
                continue
            
            # Check budget constraint
            if budget_constraint and endpoint['cost_per_request'] > budget_constraint:
                continue
            
            # Check model capability
            if not self.model_supports_request(endpoint['model_type'], request_type):
                continue
            
            # Calculate selection score
            score = self.calculate_endpoint_score(endpoint, priority)
            
            suitable_endpoints.append({
                'endpoint_id': endpoint_id,
                'score': score,
                'cost': endpoint['cost_per_request'],
                'response_time': endpoint['avg_response_time']
            })
        
        if not suitable_endpoints:
            return None
        
        # Sort by score and return best endpoint
        suitable_endpoints.sort(key=lambda x: x['score'], reverse=True)
        selected_endpoint = suitable_endpoints[0]
        
        # Update usage tracking
        self.endpoints[selected_endpoint['endpoint_id']]['current_rpm'] += 1
        
        return selected_endpoint['endpoint_id']
    
    def calculate_endpoint_score(self, endpoint, priority):
        """Calculate endpoint selection score"""
        cost_score = 1.0 / endpoint['cost_per_request']
        performance_score = endpoint['success_rate'] / max(endpoint['avg_response_time'], 0.1)
        
        if priority == 'cost':
            return cost_score * 0.8 + performance_score * 0.2
        elif priority == 'performance':
            return cost_score * 0.2 + performance_score * 0.8
        else:  # balanced
            return cost_score * 0.5 + performance_score * 0.5
    
    def update_endpoint_metrics(self, endpoint_id, response_time, success, cost):
        """Update endpoint performance metrics"""
        endpoint = self.endpoints[endpoint_id]
        
        # Update averages
        total_requests = endpoint['total_requests']
        endpoint['avg_response_time'] = (
            (endpoint['avg_response_time'] * total_requests + response_time) 
            / (total_requests + 1)
        )
        
        endpoint['success_rate'] = (
            (endpoint['success_rate'] * total_requests + (1 if success else 0))
            / (total_requests + 1)
        )
        
        # Update counters
        endpoint['total_requests'] += 1
        endpoint['total_cost'] += cost
        endpoint['current_rpm'] = max(0, endpoint['current_rpm'] - 1)  # Decrement for next request
```

## Budget Controls and Governance

### Automated Budget Management

```python
# Comprehensive budget management system
class AIBudgetManager:
    def __init__(self, monthly_budget):
        self.monthly_budget = monthly_budget
        self.current_spending = 0
        self.daily_budget = monthly_budget / 30
        self.budget_alerts = []
        self.spending_limits = {}
    
    def set_spending_limits(self, limits):
        """Set spending limits by service/model"""
        self.spending_limits = limits
    
    def check_budget_before_request(self, estimated_cost, service_type):
        """Check if request fits within budget constraints"""
        
        # Check overall budget
        if self.current_spending + estimated_cost > self.monthly_budget:
            return {
                'approved': False,
                'reason': 'Monthly budget exceeded',
                'available_budget': self.monthly_budget - self.current_spending
            }
        
        # Check service-specific limits
        if service_type in self.spending_limits:
            service_spending = self.get_service_spending(service_type)
            if service_spending + estimated_cost > self.spending_limits[service_type]:
                return {
                    'approved': False,
                    'reason': f'{service_type} budget exceeded',
                    'available_budget': self.spending_limits[service_type] - service_spending
                }
        
        # Check daily budget
        daily_spending = self.get_daily_spending()
        if daily_spending + estimated_cost > self.daily_budget * 1.5:  # 50% buffer
            return {
                'approved': False,
                'reason': 'Daily spending limit exceeded',
                'available_budget': self.daily_budget * 1.5 - daily_spending
            }
        
        return {'approved': True, 'available_budget': self.monthly_budget - self.current_spending}
    
    def record_spending(self, amount, service_type, metadata=None):
        """Record spending and update budgets"""
        self.current_spending += amount
        
        # Record spending by service
        spending_record = {
            'amount': amount,
            'service_type': service_type,
            'timestamp': datetime.now(),
            'metadata': metadata or {}
        }
        
        # Check for budget alerts
        self.check_budget_alerts(amount)
        
        return spending_record
    
    def check_budget_alerts(self, new_spending):
        """Check if budget alerts should be triggered"""
        budget_percentage = (self.current_spending / self.monthly_budget) * 100
        
        alert_thresholds = [50, 75, 90, 100]
        
        for threshold in alert_thresholds:
            if budget_percentage >= threshold and threshold not in self.budget_alerts:
                self.send_budget_alert(threshold, self.current_spending)
                self.budget_alerts.append(threshold)
    
    def send_budget_alert(self, threshold, current_spending):
        """Send budget alert notification"""
        alert_message = f"""
        Budget Alert: {threshold}% of monthly budget used
        Current spending: ${current_spending:.2f}
        Monthly budget: ${self.monthly_budget:.2f}
        Remaining budget: ${self.monthly_budget - current_spending:.2f}
        """
        
        # Send notification (email, Slack, etc.)
        print(f"BUDGET ALERT: {alert_message}")
    
    def get_spending_recommendations(self):
        """Get recommendations for cost optimization"""
        recommendations = []
        
        # Analyze spending patterns
        daily_average = self.current_spending / datetime.now().day
        projected_monthly = daily_average * 30
        
        if projected_monthly > self.monthly_budget:
            recommendations.append({
                'type': 'budget_risk',
                'message': f'Projected monthly spending (${projected_monthly:.2f}) exceeds budget',
                'suggested_actions': [
                    'Optimize prompts to reduce token usage',
                    'Use caching to reduce API calls',
                    'Consider using smaller models for simple tasks'
                ]
            })
        
        return recommendations
    
    def generate_cost_report(self):
        """Generate comprehensive cost analysis report"""
        report = {
            'summary': {
                'total_spending': self.current_spending,
                'monthly_budget': self.monthly_budget,
                'budget_utilization': (self.current_spending / self.monthly_budget) * 100,
                'days_remaining': (30 - datetime.now().day),
                'projected_monthly': self.project_monthly_spending()
            },
            'by_service': self.get_spending_by_service(),
            'trends': self.analyze_spending_trends(),
            'recommendations': self.get_spending_recommendations()
        }
        
        return report
```

## Performance vs Cost Optimization

### Intelligent Trade-off Management

```python
# Balance performance and cost trade-offs
class PerformanceCostOptimizer:
    def __init__(self):
        self.performance_targets = {}
        self.cost_targets = {}
        self.optimization_strategies = {}
    
    def set_targets(self, service_type, performance_target, cost_target):
        """Set performance and cost targets"""
        self.performance_targets[service_type] = performance_target
        self.cost_targets[service_type] = cost_target
    
    def optimize_configuration(self, service_type, current_metrics):
        """Optimize configuration based on targets"""
        
        performance_gap = self.calculate_performance_gap(service_type, current_metrics)
        cost_gap = self.calculate_cost_gap(service_type, current_metrics)
        
        if performance_gap > 0 and cost_gap > 0:
            # Both performance and cost need improvement
            return self.optimize_both(service_type, current_metrics)
        elif performance_gap > 0:
            # Performance needs improvement
            return self.optimize_performance(service_type, current_metrics)
        elif cost_gap > 0:
            # Cost needs improvement
            return self.optimize_cost(service_type, current_metrics)
        else:
            # Targets are met
            return {'status': 'optimal', 'recommendations': []}
    
    def optimize_both(self, service_type, current_metrics):
        """Optimize both performance and cost"""
        strategies = [
            {
                'name': 'Implement caching',
                'performance_impact': 0.3,  # 30% improvement
                'cost_impact': -0.4,  # 40% cost reduction
                'implementation_effort': 'medium'
            },
            {
                'name': 'Optimize prompts',
                'performance_impact': 0.1,  # 10% improvement
                'cost_impact': -0.3,  # 30% cost reduction
                'implementation_effort': 'low'
            },
            {
                'name': 'Use model routing',
                'performance_impact': 0.2,  # 20% improvement
                'cost_impact': -0.2,  # 20% cost reduction
                'implementation_effort': 'high'
            }
        ]
        
        # Rank strategies by effectiveness
        ranked_strategies = self.rank_strategies(strategies, 'balanced')
        
        return {
            'status': 'optimization_needed',
            'recommendations': ranked_strategies[:3]  # Top 3 strategies
        }
    
    def rank_strategies(self, strategies, priority='balanced'):
        """Rank optimization strategies by effectiveness"""
        
        for strategy in strategies:
            if priority == 'performance':
                strategy['score'] = strategy['performance_impact'] * 0.8 + abs(strategy['cost_impact']) * 0.2
            elif priority == 'cost':
                strategy['score'] = abs(strategy['cost_impact']) * 0.8 + strategy['performance_impact'] * 0.2
            else:  # balanced
                strategy['score'] = (strategy['performance_impact'] + abs(strategy['cost_impact'])) / 2
            
            # Adjust for implementation effort
            effort_multiplier = {'low': 1.0, 'medium': 0.8, 'high': 0.6}
            strategy['score'] *= effort_multiplier[strategy['implementation_effort']]
        
        return sorted(strategies, key=lambda x: x['score'], reverse=True)
    
    def calculate_roi(self, strategy, current_metrics, timeframe_months=12):
        """Calculate ROI for optimization strategy"""
        
        # Calculate costs
        implementation_cost = self.estimate_implementation_cost(strategy)
        
        # Calculate benefits
        performance_benefit = current_metrics['performance_cost'] * strategy['performance_impact']
        cost_benefit = current_metrics['operational_cost'] * abs(strategy['cost_impact'])
        
        monthly_benefit = performance_benefit + cost_benefit
        total_benefit = monthly_benefit * timeframe_months
        
        roi = ((total_benefit - implementation_cost) / implementation_cost) * 100
        
        return {
            'implementation_cost': implementation_cost,
            'monthly_benefit': monthly_benefit,
            'total_benefit': total_benefit,
            'roi_percentage': roi,
            'payback_months': implementation_cost / monthly_benefit if monthly_benefit > 0 else float('inf')
        }
```

## Real-World Cost Optimization Examples

### E-commerce Chatbot Optimization

```python
# Real-world example: E-commerce chatbot cost optimization
class EcommerceChatbotOptimizer:
    def __init__(self):
        self.product_catalog = {}
        self.conversation_history = {}
        self.optimization_rules = {}
    
    def optimize_product_queries(self, user_query, user_id):
        """Optimize product-related queries"""
        
        # Check for cached product information
        cached_response = self.check_product_cache(user_query)
        if cached_response:
            return cached_response
        
        # Use cheaper model for simple product queries
        query_complexity = self.analyze_query_complexity(user_query)
        
        if query_complexity < 0.3:  # Simple query
            model = 'gpt-3.5-turbo'
        else:  # Complex query
            model = 'gpt-4'
        
        # Optimize prompt for product search
        optimized_prompt = self.create_product_search_prompt(user_query)
        
        # Make API call with optimization
        response = self.call_ai_service(optimized_prompt, model)
        
        # Cache response for similar queries
        self.cache_product_response(user_query, response)
        
        return response
    
    def create_product_search_prompt(self, query):
        """Create optimized prompt for product search"""
        
        # Use structured format to reduce tokens
        prompt = f"""
        Product search query: {query}
        
        Instructions:
        1. Search our catalog for relevant products
        2. Return top 3 matches
        3. Include: name, price, key features
        4. Format: JSON
        5. Be concise
        
        Response format:
        {{"products": [{{"name": "", "price": "", "features": []}}]}}
        """
        
        return prompt
    
    def analyze_conversation_costs(self, conversation_history):
        """Analyze costs of conversation patterns"""
        
        total_cost = 0
        token_usage = {}
        
        for message in conversation_history:
            total_cost += message.get('cost', 0)
            
            model = message.get('model', 'unknown')
            tokens = message.get('tokens', 0)
            
            if model not in token_usage:
                token_usage[model] = 0
            token_usage[model] += tokens
        
        # Identify optimization opportunities
        optimizations = []
        
        # Check for repetitive queries
        if self.has_repetitive_patterns(conversation_history):
            optimizations.append({
                'type': 'caching',
                'potential_savings': total_cost * 0.3,
                'description': 'Implement caching for repetitive queries'
            })
        
        # Check for over-complex model usage
        simple_queries = self.count_simple_queries(conversation_history)
        if simple_queries > len(conversation_history) * 0.6:
            optimizations.append({
                'type': 'model_optimization',
                'potential_savings': total_cost * 0.4,
                'description': 'Use simpler models for basic queries'
            })
        
        return {
            'total_cost': total_cost,
            'token_usage': token_usage,
            'optimizations': optimizations
        }
```

### Healthcare AI Cost Management

```python
# Healthcare AI implementation with cost controls
class HealthcareAICostManager:
    def __init__(self):
        self.compliance_requirements = {}
        self.cost_per_patient = {}
        self.quality_metrics = {}
    
    def process_patient_query(self, query, patient_id, priority='standard'):
        """Process patient query with cost optimization"""
        
        # Check for emergency priority
        if priority == 'emergency':
            # Use highest quality model regardless of cost
            return self.process_with_premium_model(query, patient_id)
        
        # For standard queries, optimize costs
        cost_estimate = self.estimate_query_cost(query)
        
        # Check patient's allocated budget
        if not self.check_patient_budget(patient_id, cost_estimate):
            # Use cost-effective approach
            return self.process_with_economy_model(query, patient_id)
        
        # Use standard processing
        return self.process_with_standard_model(query, patient_id)
    
    def optimize_diagnostic_assistance(self, symptoms, patient_history):
        """Optimize diagnostic assistance costs"""
        
        # Use tiered approach based on complexity
        complexity_score = self.calculate_diagnostic_complexity(symptoms, patient_history)
        
        if complexity_score < 0.3:
            # Simple case - use basic model
            model = 'gpt-3.5-turbo'
            confidence_threshold = 0.8
        elif complexity_score < 0.7:
            # Moderate case - use standard model
            model = 'gpt-4'
            confidence_threshold = 0.9
        else:
            # Complex case - use premium model
            model = 'gpt-4-turbo'
            confidence_threshold = 0.95
        
        # Process with selected model
        result = self.process_diagnostic_query(symptoms, patient_history, model)
        
        # Validate confidence level
        if result['confidence'] < confidence_threshold:
            # Escalate to higher model if confidence is low
            result = self.escalate_diagnostic_query(symptoms, patient_history, result)
        
        return result
    
    def track_outcome_based_costs(self, patient_id, treatment_plan, outcome):
        """Track costs based on patient outcomes"""
        
        total_cost = self.calculate_total_ai_cost(patient_id)
        
        outcome_metrics = {
            'ai_cost': total_cost,
            'outcome_score': self.calculate_outcome_score(outcome),
            'cost_effectiveness': self.calculate_cost_effectiveness(total_cost, outcome)
        }
        
        # Adjust future cost allocation based on outcomes
        if outcome_metrics['cost_effectiveness'] > 0.8:
            # Good outcome - maintain current allocation
            self.maintain_patient_budget(patient_id)
        else:
            # Poor outcome - review cost allocation
            self.review_patient_budget(patient_id)
        
        return outcome_metrics
```

## Best Practices and Recommendations

### 1. Prompt Optimization
- **Remove redundancy**: Eliminate unnecessary words and phrases
- **Use structured formats**: JSON, bullet points, tables
- **Limit context**: Include only relevant information
- **Test different models**: Find the right balance of cost and quality

### 2. Caching Strategy
- **Implement multilevel caching**: Memory, Redis, database
- **Use semantic similarity**: Cache similar queries
- **Set appropriate TTL**: Balance freshness with cost savings
- **Monitor cache hit rates**: Optimize cache strategy

### 3. Model Selection
- **Task-appropriate models**: Use simpler models for basic tasks
- **Dynamic model routing**: Route based on complexity
- **A/B testing**: Compare model performance and costs
- **Regular evaluation**: Reassess model choices

### 4. Resource Management
- **Auto-scaling**: Scale based on demand patterns
- **Spot instances**: Use for batch processing
- **Resource pooling**: Share resources across applications
- **Peak hour optimization**: Adjust capacity for demand

### 5. Budget Controls
- **Set spending limits**: Overall and per-service limits
- **Implement approvals**: For high-cost operations
- **Regular monitoring**: Track spending patterns
- **Automated alerts**: Proactive budget management

## Cost Monitoring Dashboard

```python
# Comprehensive cost monitoring implementation
class CostMonitoringDashboard:
    def __init__(self):
        self.metrics_collector = MetricsCollector()
        self.cost_analyzer = CostAnalyzer()
        self.alert_manager = AlertManager()
    
    def generate_cost_dashboard(self):
        """Generate comprehensive cost dashboard"""
        
        dashboard_data = {
            'summary': {
                'total_spend': self.get_total_spend(),
                'monthly_budget': self.get_monthly_budget(),
                'budget_utilization': self.calculate_budget_utilization(),
                'projected_monthly': self.project_monthly_spend()
            },
            'by_service': self.get_spend_by_service(),
            'by_model': self.get_spend_by_model(),
            'trends': self.analyze_spending_trends(),
            'optimization_opportunities': self.identify_optimization_opportunities(),
            'recommendations': self.get_cost_recommendations()
        }
        
        return dashboard_data
    
    def identify_optimization_opportunities(self):
        """Identify specific cost optimization opportunities"""
        
        opportunities = []
        
        # Analyze token usage patterns
        token_analysis = self.analyze_token_usage()
        if token_analysis['waste_percentage'] > 0.1:
            opportunities.append({
                'type': 'token_optimization',
                'potential_savings': token_analysis['potential_savings'],
                'description': 'Optimize prompts to reduce token usage',
                'effort': 'low'
            })
        
        # Analyze model usage
        model_analysis = self.analyze_model_usage()
        if model_analysis['over_engineered_percentage'] > 0.2:
            opportunities.append({
                'type': 'model_optimization',
                'potential_savings': model_analysis['potential_savings'],
                'description': 'Use simpler models for basic tasks',
                'effort': 'medium'
            })
        
        # Analyze caching opportunities
        cache_analysis = self.analyze_caching_potential()
        if cache_analysis['cache_hit_potential'] > 0.3:
            opportunities.append({
                'type': 'caching',
                'potential_savings': cache_analysis['potential_savings'],
                'description': 'Implement caching for repetitive queries',
                'effort': 'medium'
            })
        
        return opportunities
```

## Conclusion

Cost optimization for Azure AI services requires a comprehensive approach combining technical optimization, intelligent resource management, and governance controls. Key takeaways:

1. **Start with prompt optimization** - Often the highest ROI
2. **Implement intelligent caching** - Reduce redundant API calls
3. **Use appropriate models** - Match complexity to task requirements
4. **Monitor continuously** - Track spending patterns and optimize
5. **Set governance controls** - Prevent budget overruns

With these strategies, you can achieve 30-70% cost reduction while maintaining or improving performance.

## Next Steps

Continue your Azure AI journey by:
1. Implementing the optimization strategies in your applications
2. Setting up comprehensive monitoring and alerting
3. Exploring advanced AI patterns and architectures
4. Building cost-aware development practices

## References

1. [Azure AI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/) - Official pricing information
2. [Azure Cost Management](https://docs.microsoft.com/en-us/azure/cost-management-billing/) - Budget and cost control
3. [Azure Monitor](https://docs.microsoft.com/en-us/azure/azure-monitor/) - Monitoring and alerting
4. [Prompt Engineering Guide](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/concepts/prompt-engineering) - Optimization techniques 