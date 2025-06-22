# Setup Your Azure Account: Your Gateway to AI

Now that you understand what Azure AI can do, it's time to get your hands dirty! In this lesson, we'll walk through setting up your Azure account and creating your first AI resource. Don't worry – it's easier than you might think, and you'll be up and running in no time.

## What You'll Learn in This Lesson

By the end of this lesson, you'll have:
- A fully configured Azure account
- Your first Azure AI resource created
- API keys and endpoints ready to use
- A clear understanding of the Azure portal
- Knowledge of best practices for resource management

## Prerequisites

Before we start, make sure you have:
- A valid email address
- A credit card (for identity verification - many services have free tiers)
- About 15-20 minutes of time

## Step 1: Create Your Azure Account

### Option 1: Free Azure Account (Recommended for Beginners)

Microsoft offers a generous free tier that's perfect for learning and small projects:

1. **Visit the Azure Free Account Page**
   - Go to [azure.microsoft.com/free](https://azure.microsoft.com/free)
   - Click "Start free"

2. **Sign in or Create a Microsoft Account**
   - Use an existing Microsoft account, or
   - Create a new one with your email address

3. **Verify Your Identity**
   - Provide your phone number for SMS verification
   - Enter your credit card information (for identity verification only)
   - Don't worry – you won't be charged unless you explicitly upgrade

4. **Complete the Agreement**
   - Read and accept the terms
   - Complete the setup process

### What You Get with Azure Free Account

🎉 **$200 in Azure credits** for the first 30 days  
🎉 **12 months of popular services for free** (including AI services)  
🎉 **Always free services** that never expire  

### Option 2: Pay-As-You-Go Account

If you're ready to dive deeper or are setting this up for business use:

1. Visit [azure.microsoft.com](https://azure.microsoft.com)
2. Click "Start free" or "Pay as you go"
3. Follow the same verification process
4. You'll have immediate access to all Azure services

## Step 2: Navigate the Azure Portal

Once your account is set up, let's get familiar with the Azure portal:

1. **Access the Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Sign in with your Microsoft account

2. **Key Areas to Know**
   - **Dashboard**: Your personalized overview
   - **All services**: Complete list of Azure services
   - **Resource groups**: Containers for organizing resources
   - **Subscriptions**: Billing and resource management

3. **Customize Your Experience**
   - Pin frequently used services to your dashboard
   - Set up favorites for quick access
   - Configure notifications and alerts

## Step 3: Create Your First AI Resource

Now for the exciting part – creating your first Azure AI resource! We'll start with Azure OpenAI Service as it's one of the most versatile.

### Create an Azure OpenAI Resource

1. **Search for Azure OpenAI**
   - In the Azure portal, click "Create a resource"
   - Search for "Azure OpenAI"
   - Select "Azure OpenAI" from the results

2. **Configure Basic Settings**
   ```
   Subscription: Select your subscription
   Resource Group: Create new → "ai-learning-rg"
   Region: Choose a region near you (e.g., East US, West Europe)
   Name: "my-first-openai-resource"
   Pricing Tier: Standard S0
   ```

3. **Network and Security Settings**
   - For learning purposes, keep default settings
   - Enable "All networks" for easy access
   - We'll cover security best practices in advanced lessons

4. **Review and Create**
   - Review your configuration
   - Click "Create"
   - Wait for deployment (usually 2-5 minutes)

### Important Notes About Azure OpenAI Access

⚠️ **Access Requirements**: Azure OpenAI requires approval for access. You may need to:
- Complete an application form
- Wait for approval (usually 1-2 business days)
- Provide business justification for commercial use

If you don't have immediate access, don't worry! You can start with other AI services like Language Service or Computer Vision.

### Alternative: Create a Language Service Resource

If Azure OpenAI isn't immediately available, let's create a Language Service resource:

1. **Search for Language Service**
   - Create a resource → Search "Language"
   - Select "Language service"

2. **Configure Settings**
   ```
   Subscription: Your subscription
   Resource Group: "ai-learning-rg"
   Region: East US 2
   Name: "my-language-service"
   Pricing Tier: Free F0 (perfect for learning!)
   ```

3. **Create the Resource**
   - Review and create
   - Wait for deployment

## Step 4: Get Your API Keys and Endpoint

Once your resource is deployed, you need to collect the credentials:

1. **Navigate to Your Resource**
   - Go to "Resource groups" → "ai-learning-rg"
   - Click on your newly created resource

2. **Find Keys and Endpoint**
   - In the left menu, click "Keys and Endpoint"
   - You'll see:
     - **Endpoint URL**: Your service's web address
     - **Key 1** and **Key 2**: Your authentication keys

3. **Copy and Store Securely**
   ```
   Endpoint: https://your-resource.cognitiveservices.azure.com/
   Key: abc123def456ghi789...
   ```

   ⚠️ **Security Note**: Never share your API keys publicly or commit them to version control!

## Step 5: Test Your Setup

Let's verify everything is working with a simple test:

### Using curl (Command Line)

```bash
# Test Language Service (replace with your endpoint and key)
curl -X POST "https://your-resource.cognitiveservices.azure.com/language/:analyze-text?api-version=2022-05-01" \
-H "Ocp-Apim-Subscription-Key: YOUR_KEY_HERE" \
-H "Content-Type: application/json" \
-d '{
    "kind": "SentimentAnalysis",
    "parameters": {
        "modelVersion": "latest"
    },
    "analysisInput": {
        "documents": [
            {
                "id": "1",
                "language": "en",
                "text": "I love learning about Azure AI!"
            }
        ]
    }
}'
```

### Expected Response

```json
{
    "kind": "SentimentAnalysisResults",
    "results": {
        "documents": [
            {
                "id": "1",
                "sentiment": "positive",
                "confidenceScores": {
                    "positive": 0.99,
                    "neutral": 0.01,
                    "negative": 0.00
                }
            }
        ]
    }
}
```

If you see this response, congratulations! 🎉 Your Azure AI setup is working perfectly.

## Step 6: Best Practices for Resource Management

### Organization Tips

1. **Use Descriptive Names**
   - Good: `production-chatbot-openai`
   - Bad: `resource1`

2. **Leverage Resource Groups**
   - Group related resources together
   - Use consistent naming conventions
   - Example: `project-environment-purpose`

3. **Apply Tags**
   ```
   Environment: Development
   Project: AI Learning
   Owner: your-email@company.com
   ```

### Security Best Practices

1. **Rotate Keys Regularly**
   - Use Key 1 in production
   - Rotate to Key 2 when needed
   - Never use the same key across environments

2. **Use Environment Variables**
   ```bash
   export AZURE_AI_ENDPOINT="https://your-resource.cognitiveservices.azure.com/"
   export AZURE_AI_KEY="your-api-key-here"
   ```

3. **Consider Managed Identity**
   - For production applications
   - Eliminates need to manage keys
   - More secure authentication method

### Cost Management

1. **Monitor Usage**
   - Set up billing alerts
   - Review usage monthly
   - Use cost analysis tools

2. **Choose Appropriate Tiers**
   - Start with free tiers for learning
   - Scale up based on actual usage
   - Consider reserved capacity for predictable workloads

## Common Setup Issues and Solutions

### Issue 1: "Resource provider not registered"
**Solution**: 
1. Go to Subscriptions → Resource providers
2. Find and register `Microsoft.CognitiveServices`

### Issue 2: "Region not available"
**Solution**: 
- Try a different region (East US, West Europe usually work)
- Check service availability by region

### Issue 3: "Quota exceeded"
**Solution**: 
- Request quota increase through support
- Or try a different region with available quota

### Issue 4: API calls return 401 Unauthorized
**Solution**: 
- Verify your API key is correct
- Check that you're using the right endpoint
- Ensure the key hasn't expired

## What's Next?

Now that you have your Azure AI resources set up, you're ready to:
- Understand pricing and cost optimization (Lesson 3)
- Build your first AI project (Lesson 4)
- Learn troubleshooting techniques (Lesson 5)

## Quick Setup Checklist

✅ Azure account created and verified  
✅ First AI resource deployed  
✅ API keys and endpoint collected  
✅ Test API call successful  
✅ Resource organization set up  
✅ Security best practices understood  

## Practice Exercise

Before moving on, complete this hands-on exercise:

1. **Create a second AI resource** (try Computer Vision or Speech Service)
2. **Organize your resources** using tags and resource groups
3. **Test both resources** with simple API calls
4. **Set up a billing alert** for $10 to monitor costs

This will give you confidence in managing multiple AI services and help you understand the Azure ecosystem better.

Ready to dive into pricing and cost optimization? Let's move to **Lesson 3: Understanding Azure Pricing**!

---

## References

[1] [Azure Free Account](https://azure.microsoft.com/free/)  
[2] [Azure Portal Documentation](https://learn.microsoft.com/azure/azure-portal/)  
[3] [Azure OpenAI Service Setup](https://learn.microsoft.com/azure/ai-services/openai/how-to/create-resource)  
[4] [Azure AI Services Authentication](https://learn.microsoft.com/azure/ai-services/authentication)  
[5] [Azure Resource Management Best Practices](https://learn.microsoft.com/azure/azure-resource-manager/management/best-practices)  
[6] [Azure Cost Management](https://learn.microsoft.com/azure/cost-management-billing/) 