# Lesson 5: Troubleshooting Common Issues

Even experienced developers encounter issues when working with AI services. This lesson covers the most common problems and their solutions to get you back on track quickly.

## Why Troubleshooting Matters

Learning to debug effectively will:
- Save hours of development time
- Help build more reliable applications  
- Give you confidence for complex projects
- Prepare you for production deployments

## Common Issue Categories

1. **Authentication and Access Issues**
2. **API and Network Problems**
3. **Rate Limiting and Quotas**
4. **Data Format and Input Issues**
5. **Performance and Latency Problems**

---

## 1. Authentication and Access Issues

### "Authentication Failed" or "Unauthorized" (401 Errors)

**Common Causes:**
- Wrong API key or endpoint
- Expired or regenerated keys
- Missing environment variables
- Incorrect service region

**Quick Fixes:**
```python
# Verify your credentials
import os

endpoint = os.getenv("AZURE_LANGUAGE_ENDPOINT")
key = os.getenv("AZURE_LANGUAGE_KEY")

print(f"Endpoint: {endpoint}")
print(f"Key: {key[:10]}..." if key else "Key: Not found")
```

**Checklist:**
- ✅ Check for extra spaces in environment variables
- ✅ Verify exact endpoint format from Azure Portal
- ✅ Ensure keys weren't recently regenerated
- ✅ Test with REST API to isolate SDK issues

### "Resource Not Found" (404 Errors)

**Solutions:**
- Double-check endpoint URL format
- Verify API version matches documentation
- Ensure service is deployed and running
- Check for typos in resource names

---

## 2. API and Network Problems

### Connection Timeouts

**Set Appropriate Timeouts:**
```python
# Python
from azure.core.pipeline.transport import RequestsTransport

client = TextAnalyticsClient(
    endpoint=endpoint,
    credential=AzureKeyCredential(key),
    transport=RequestsTransport(connection_timeout=30, read_timeout=60)
)
```

```javascript
// JavaScript
const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key), {
    requestOptions: { timeout: 30000 }
});
```

**Network Troubleshooting:**
- Check internet connectivity
- Verify firewall settings
- Test from different network
- Check corporate proxy settings

---

## 3. Rate Limiting and Quotas

### "Too Many Requests" (429 Errors)

**Rate Limits:**
- **Free Tier**: 5,000 transactions/month, 20 calls/minute
- **Standard Tier**: 1,000 calls/minute, pay per transaction

**Implement Retry Logic:**
```python
import time
import random
from azure.core.exceptions import HttpResponseError

def analyze_with_retry(client, text, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.analyze_sentiment([text])
        except HttpResponseError as e:
            if e.status_code == 429:
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                print(f"Rate limited. Waiting {wait_time:.2f}s...")
                time.sleep(wait_time)
            else:
                raise e
    raise Exception("Max retries exceeded")
```

**Solutions:**
- Upgrade to paid tier for higher limits
- Implement exponential backoff
- Use batch processing
- Add delays between requests

---

## 4. Data Format and Input Issues

### "Invalid Input Format"

**Common Problems:**
```python
# ❌ Wrong data types
client.analyze_sentiment(123)  # Should be string

# ❌ Empty values
client.analyze_sentiment([None, ""])

# ❌ Text too long (>5,120 characters)
very_long_text = "a" * 10000

# ❌ Invalid characters
text_with_nulls = "Hello\x00World"
```

**Input Validation:**
```python
def validate_text(text):
    if not text or not isinstance(text, str):
        return None
    
    # Remove null characters
    text = text.replace('\x00', '')
    
    # Check length limits
    if len(text) > 5120:
        text = text[:5120]
        print("Warning: Text truncated")
    
    return text.strip()
```

### Encoding Problems

```python
# Handle different encodings
import chardet

def read_file_safely(file_path):
    with open(file_path, 'rb') as file:
        raw_data = file.read()
        encoding = chardet.detect(raw_data)['encoding']
        return raw_data.decode(encoding)
```

---

## 5. Performance and Latency Problems

### Slow Response Times

**Use Async Processing:**
```python
import asyncio
from azure.ai.textanalytics.aio import TextAnalyticsClient

async def analyze_multiple_texts(texts):
    async with TextAnalyticsClient(endpoint, AzureKeyCredential(key)) as client:
        tasks = [client.analyze_sentiment([text]) for text in texts]
        return await asyncio.gather(*tasks)
```

**Batch Requests:**
```python
# Process multiple documents in single request
documents = [
    {"id": "1", "text": "I love Azure AI!"},
    {"id": "2", "text": "This is okay."}
]
results = client.analyze_sentiment(documents)
```

---

## Debugging Tools

### Enable Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('azure')
logger.setLevel(logging.DEBUG)
```

### Test with Simple Examples
```python
def test_basic_functionality():
    try:
        client = TextAnalyticsClient(endpoint, AzureKeyCredential(key))
        result = client.detect_language(["Hello world"])
        print("✅ Basic functionality works")
        return True
    except Exception as e:
        print(f"❌ Basic test failed: {e}")
        return False
```

---

## Production Readiness Checklist

### Security
- ✅ Store keys in Azure Key Vault
- ✅ Use managed identities
- ✅ Enable HTTPS only
- ✅ Set up monitoring

### Reliability  
- ✅ Implement retry logic
- ✅ Set appropriate timeouts
- ✅ Handle all error scenarios
- ✅ Monitor service health

### Performance
- ✅ Use connection pooling
- ✅ Implement caching
- ✅ Batch requests
- ✅ Use async programming

---

## Getting Help

### Official Resources
- [Azure AI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/)
- [API Reference](https://docs.microsoft.com/en-us/rest/api/cognitiveservices/)
- [Azure Status](https://status.azure.com/)

### Community Support
- [Microsoft Q&A](https://docs.microsoft.com/en-us/answers/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/azure-cognitive-services)
- [GitHub Issues](https://github.com/Azure/azure-sdk-for-python/issues)

---

## Summary

Key troubleshooting principles:

1. **Start with basics**: Check authentication and connectivity
2. **Read error messages**: They often contain the solution
3. **Test incrementally**: Simple examples before complex scenarios
4. **Monitor and log**: Implement logging from the start
5. **Plan for production**: Consider reliability and performance early

## What's Next?

🎉 **Congratulations!** You've completed the Getting Started section.

You now have:
- ✅ Understanding of Azure AI services
- ✅ Working Azure account and setup
- ✅ Knowledge of pricing and costs
- ✅ Complete AI project experience
- ✅ Troubleshooting skills

**Coming up in Section 2**: Text and Language AI services, where we'll build more sophisticated language processing applications!

---

*Every expert was once a beginner. Keep learning, practicing, and building!* 🚀

## References

[1] Azure AI Troubleshooting - https://docs.microsoft.com/en-us/azure/cognitive-services/troubleshooting
[2] Azure Status - https://status.azure.com/
[3] Azure Support - https://azure.microsoft.com/support/options/
[4] AI Security Best Practices - https://docs.microsoft.com/en-us/azure/cognitive-services/cognitive-services-security 