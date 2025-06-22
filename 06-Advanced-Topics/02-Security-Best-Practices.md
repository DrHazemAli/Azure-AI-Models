# Lesson 2: Security Best Practices - Protecting AI Systems and Data

In this lesson, we'll explore comprehensive security strategies for Azure AI systems. As AI becomes more prevalent in business-critical applications, securing these systems is paramount.

## Learning Objectives

By the end of this lesson, you will:
- Understand AI-specific security threats and vulnerabilities
- Implement robust authentication and authorization
- Secure data in transit and at rest
- Monitor and detect security threats
- Apply compliance frameworks to AI systems

## Introduction to AI Security

AI systems face unique security challenges beyond traditional application security, including model theft, adversarial attacks, data poisoning, and privacy violations.

### Common AI Security Threats

1. **Adversarial Attacks**: Malicious inputs designed to fool models
2. **Model Extraction**: Attempts to steal or reverse-engineer models
3. **Data Poisoning**: Contaminating training data
4. **Privacy Attacks**: Extracting sensitive information from models
5. **Model Inversion**: Reconstructing training data from outputs

## Authentication and Authorization

### Azure Active Directory Integration

```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import jwt
from functools import wraps

class AISecurityManager:
    def __init__(self):
        self.credential = DefaultAzureCredential()
        self.kv_client = SecretClient(
            vault_url="https://your-vault.vault.azure.net/",
            credential=self.credential
        )
    
    def verify_user_token(self, token):
        """Verify JWT token from Azure AD"""
        try:
            signing_key = self.get_azure_ad_signing_key()
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                audience="your-app-id"
            )
            return payload
        except jwt.InvalidTokenError:
            return None
    
    def check_model_permissions(self, user_id, model_name, action):
        """Check if user has permission for specific model action"""
        user_permissions = self.get_user_permissions(user_id)
        required_permission = f"model:{model_name}:{action}"
        return required_permission in user_permissions
```

### Role-Based Access Control (RBAC)

```python
from enum import Enum
from typing import List

class AIRole(Enum):
    MODEL_USER = "model_user"
    MODEL_DEVELOPER = "model_developer"
    MODEL_ADMIN = "model_admin"

class AIPermission(Enum):
    READ_MODEL = "read_model"
    INVOKE_MODEL = "invoke_model"
    DEPLOY_MODEL = "deploy_model"
    DELETE_MODEL = "delete_model"

class RBACManager:
    def __init__(self):
        self.role_permissions = {
            AIRole.MODEL_USER: [AIPermission.INVOKE_MODEL],
            AIRole.MODEL_DEVELOPER: [
                AIPermission.READ_MODEL,
                AIPermission.INVOKE_MODEL,
                AIPermission.DEPLOY_MODEL
            ],
            AIRole.MODEL_ADMIN: [
                AIPermission.READ_MODEL,
                AIPermission.INVOKE_MODEL,
                AIPermission.DEPLOY_MODEL,
                AIPermission.DELETE_MODEL
            ]
        }
    
    def has_permission(self, user_roles: List[AIRole], 
                      required_permission: AIPermission) -> bool:
        """Check if user has required permission"""
        for role in user_roles:
            if required_permission in self.role_permissions.get(role, []):
                return True
        return False

# Decorator for API endpoints
def require_permission(permission: AIPermission):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user_roles = get_user_roles_from_context()
            rbac = RBACManager()
            if not rbac.has_permission(user_roles, permission):
                return {"error": "Insufficient permissions"}, 403
            return func(*args, **kwargs)
        return wrapper
    return decorator
```

## Data Protection

### Encryption at Rest and in Transit

```python
from azure.storage.blob import BlobServiceClient
from azure.keyvault.keys import KeyClient
from cryptography.fernet import Fernet
import ssl
import requests

class DataEncryptionManager:
    def __init__(self):
        self.credential = DefaultAzureCredential()
        self.key_client = KeyClient(
            vault_url="https://your-vault.vault.azure.net/",
            credential=self.credential
        )
    
    def encrypt_training_data(self, data_path: str) -> str:
        """Encrypt training data before storage"""
        encryption_key = Fernet.generate_key()
        cipher_suite = Fernet(encryption_key)
        
        with open(data_path, 'rb') as file:
            file_data = file.read()
        
        encrypted_data = cipher_suite.encrypt(file_data)
        
        # Store encryption key in Azure Key Vault
        key_name = f"training-data-key-{os.path.basename(data_path)}"
        self.key_client.create_key(key_name, "RSA")
        
        return self._store_encrypted_data(encrypted_data)
    
    def create_secure_api_client(self, base_url: str):
        """Create API client with TLS 1.3"""
        session = requests.Session()
        
        # Configure TLS 1.3 minimum
        adapter = requests.adapters.HTTPAdapter()
        session.mount("https://", adapter)
        
        return session
```

## Input Validation and Sanitization

### Comprehensive Input Validation

```python
import re
from marshmallow import Schema, fields, validate, ValidationError
import numpy as np

class PredictionInputSchema(Schema):
    """Schema for validating prediction inputs"""
    text_input = fields.Str(
        required=False,
        validate=[
            validate.Length(min=1, max=10000),
            validate.Regexp(r'^[a-zA-Z0-9\s.,!?-]+$')
        ]
    )
    numerical_features = fields.List(
        fields.Float(validate=validate.Range(min=-1000, max=1000)),
        required=False,
        validate=validate.Length(max=100)
    )

class InputValidator:
    def __init__(self):
        self.schema = PredictionInputSchema()
        self.max_request_size = 10 * 1024 * 1024  # 10MB
    
    def validate_request(self, data: dict) -> dict:
        """Comprehensive input validation"""
        # Check request size
        if len(str(data)) > self.max_request_size:
            raise ValidationError("Request size exceeds limit")
        
        # Schema validation
        validated_data = self.schema.load(data)
        
        # Security checks
        self._check_for_malicious_content(validated_data)
        self._normalize_input(validated_data)
        
        return validated_data
    
    def _check_for_malicious_content(self, data: dict):
        """Check for potential security threats"""
        malicious_patterns = [
            r'<script.*?>.*?</script>',  # XSS
            r'union\s+select',           # SQL injection
            r'system\s*\(',             # Command injection
        ]
        
        text_content = str(data)
        for pattern in malicious_patterns:
            if re.search(pattern, text_content, re.IGNORECASE):
                raise ValidationError("Potentially malicious content detected")
    
    def _normalize_input(self, data: dict):
        """Normalize input data to prevent attacks"""
        if 'numerical_features' in data:
            data['numerical_features'] = np.clip(
                data['numerical_features'], -100, 100
            ).tolist()
        
        if 'text_input' in data:
            data['text_input'] = re.sub(r'[<>"\';]', '', data['text_input'])
```

## Threat Detection and Monitoring

### Real-time Threat Detection

```python
from azure.monitor.opentelemetry import configure_azure_monitor
from azure.ai.anomalydetector import AnomalyDetectorClient
from opentelemetry import trace
import time
import logging

class AIThreatDetector:
    def __init__(self):
        self.credential = DefaultAzureCredential()
        self.anomaly_client = AnomalyDetectorClient(
            endpoint="https://your-anomaly-detector.cognitiveservices.azure.com/",
            credential=self.credential
        )
        
        configure_azure_monitor(
            connection_string="InstrumentationKey=your-key"
        )
        self.tracer = trace.get_tracer(__name__)
        
        self.thresholds = {
            'max_requests_per_minute': 100,
            'max_failed_attempts': 5
        }
    
    def detect_rate_limiting_attacks(self, client_ip: str, 
                                   request_count: int) -> bool:
        """Detect potential DDoS or brute force attacks"""
        if request_count > self.thresholds['max_requests_per_minute']:
            self._log_security_event(
                "RATE_LIMIT_EXCEEDED",
                {"client_ip": client_ip, "request_count": request_count}
            )
            return True
        return False
    
    def detect_adversarial_inputs(self, input_data: dict) -> bool:
        """Detect potential adversarial attacks"""
        with self.tracer.start_as_current_span("adversarial_detection"):
            # Check for statistical anomalies
            if 'numerical_features' in input_data:
                is_anomaly = self._check_statistical_anomaly(
                    input_data['numerical_features']
                )
                if is_anomaly:
                    self._log_security_event(
                        "ADVERSARIAL_INPUT_DETECTED",
                        {"input_hash": hash(str(input_data))}
                    )
                    return True
        return False
    
    def _check_statistical_anomaly(self, features: list) -> bool:
        """Use Azure Anomaly Detector"""
        try:
            series_data = {
                "series": [
                    {"timestamp": time.time(), "value": f} for f in features
                ]
            }
            response = self.anomaly_client.detect_entire_series(series_data)
            return any(response.is_anomaly)
        except Exception as e:
            logging.error(f"Anomaly detection failed: {e}")
            return False
    
    def _log_security_event(self, event_type: str, details: dict):
        """Log security events"""
        security_event = {
            "timestamp": time.time(),
            "event_type": event_type,
            "details": details,
            "severity": "HIGH"
        }
        logging.warning(f"Security Event: {security_event}")
```

## Secure API Development

### Rate Limiting and Security Headers

```python
from flask import Flask, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis

app = Flask(__name__)

# Initialize rate limiter with Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"
)

@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response

@app.route('/predict', methods=['POST'])
@limiter.limit("5 per minute")
def secure_predict():
    """Secure prediction endpoint"""
    try:
        # Authentication check
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401
        
        # Input validation
        validator = InputValidator()
        data = request.get_json()
        validated_data = validator.validate_request(data)
        
        # Threat detection
        threat_detector = AIThreatDetector()
        if threat_detector.detect_adversarial_inputs(validated_data):
            return jsonify({'error': 'Adversarial input detected'}), 400
        
        # Make prediction
        result = model.predict(validated_data)
        
        return jsonify({
            'prediction': result,
            'model_version': '1.0.0',
            'request_id': request.headers.get('X-Request-ID')
        })
    
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logging.error(f"Prediction error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
```

## Model Protection

### Model Watermarking

```python
import hashlib
import time
import numpy as np

class ModelProtector:
    def __init__(self, model_id: str):
        self.model_id = model_id
        self.watermark_secret = self._generate_watermark_secret()
    
    def add_watermark(self, model):
        """Add invisible watermark to model"""
        trigger_inputs = self._generate_trigger_inputs()
        trigger_outputs = self._generate_trigger_outputs()
        
        watermark_info = {
            "model_id": self.model_id,
            "trigger_inputs": trigger_inputs,
            "trigger_outputs": trigger_outputs,
            "timestamp": time.time()
        }
        
        self._store_watermark_info(watermark_info)
        return self._embed_watermark(model, trigger_inputs, trigger_outputs)
    
    def verify_watermark(self, suspected_model) -> bool:
        """Verify if model contains our watermark"""
        watermark_info = self._retrieve_watermark_info()
        
        if not watermark_info:
            return False
        
        # Test model with trigger inputs
        for trigger_input, expected_output in zip(
            watermark_info["trigger_inputs"],
            watermark_info["trigger_outputs"]
        ):
            actual_output = suspected_model.predict(trigger_input)
            if not self._outputs_match(actual_output, expected_output):
                return False
        
        return True
    
    def _generate_watermark_secret(self) -> str:
        """Generate secret key for watermarking"""
        return hashlib.sha256(
            f"{self.model_id}{time.time()}".encode()
        ).hexdigest()
```

### Differential Privacy

```python
import numpy as np

class DifferentialPrivacyManager:
    def __init__(self, epsilon: float = 1.0, delta: float = 1e-5):
        self.epsilon = epsilon  # Privacy budget
        self.delta = delta      # Probability of privacy loss
    
    def add_laplace_noise(self, data: np.ndarray, 
                         sensitivity: float) -> np.ndarray:
        """Add Laplace noise for differential privacy"""
        scale = sensitivity / self.epsilon
        noise = np.random.laplace(0, scale, data.shape)
        return data + noise
    
    def add_gaussian_noise(self, data: np.ndarray, 
                          sensitivity: float) -> np.ndarray:
        """Add Gaussian noise for differential privacy"""
        c = np.sqrt(2 * np.log(1.25 / self.delta))
        sigma = c * sensitivity / self.epsilon
        noise = np.random.normal(0, sigma, data.shape)
        return data + noise
    
    def private_aggregation(self, values: list, 
                           sensitivity: float) -> float:
        """Compute private aggregation with noise"""
        true_sum = sum(values)
        noisy_sum = self.add_laplace_noise(
            np.array([true_sum]), sensitivity
        )[0]
        return noisy_sum
```

## Security Monitoring Dashboard

### Comprehensive Security Monitoring

```python
from azure.monitor.query import LogsQueryClient
from datetime import datetime, timedelta

class SecurityDashboard:
    def __init__(self):
        self.credential = DefaultAzureCredential()
        self.logs_client = LogsQueryClient(self.credential)
    
    def get_security_summary(self, time_range: str = "PT24H") -> dict:
        """Get comprehensive security summary"""
        summary = {}
        
        # Query authentication failures
        auth_failures = self._query_authentication_failures(time_range)
        summary["authentication_failures"] = auth_failures
        
        # Query threat detections
        threat_detections = self._query_threat_detections(time_range)
        summary["threat_detections"] = threat_detections
        
        # Calculate security score
        summary["security_score"] = self._calculate_security_score(summary)
        
        return summary
    
    def _query_authentication_failures(self, time_range: str) -> dict:
        """Query authentication failure logs"""
        query = f"""
        AppTraces
        | where TimeGenerated >= ago({time_range})
        | where Message contains "authentication_failed"
        | summarize count() by bin(TimeGenerated, 1h)
        | order by TimeGenerated desc
        """
        
        response = self.logs_client.query_workspace(
            workspace_id="your-workspace-id",
            query=query,
            timespan=time_range
        )
        
        return self._process_log_results(response)
    
    def _calculate_security_score(self, summary: dict) -> float:
        """Calculate overall security score (0-100)"""
        base_score = 100.0
        
        auth_failures = summary.get("authentication_failures", {}).get("total", 0)
        threat_detections = summary.get("threat_detections", {}).get("total", 0)
        
        score = base_score
        score -= min(auth_failures * 5, 30)
        score -= min(threat_detections * 10, 40)
        
        return max(score, 0)
```

## Compliance and Governance

### GDPR Compliance for AI

```python
from datetime import datetime

class GDPRComplianceManager:
    def __init__(self):
        self.data_catalog = {}
    
    def register_personal_data_usage(self, data_id: str, 
                                   purpose: str, 
                                   retention_period: int):
        """Register personal data usage for GDPR compliance"""
        self.data_catalog[data_id] = {
            "purpose": purpose,
            "registered_date": datetime.now(),
            "retention_period_days": retention_period,
            "consent_status": "pending"
        }
    
    def process_deletion_request(self, subject_id: str) -> dict:
        """Handle right to be forgotten requests"""
        deletion_log = []
        
        # Remove from training data
        training_removed = self._remove_from_training_data(subject_id)
        deletion_log.append(f"Training data: {training_removed}")
        
        # Remove from prediction cache
        cache_removed = self._remove_from_prediction_cache(subject_id)
        deletion_log.append(f"Prediction cache: {cache_removed}")
        
        return {
            "status": "completed",
            "deletion_log": deletion_log,
            "completion_date": datetime.now().isoformat()
        }
    
    def audit_data_usage(self) -> dict:
        """Audit personal data usage for compliance"""
        audit_report = {
            "audit_date": datetime.now().isoformat(),
            "total_data_subjects": len(self.data_catalog),
            "compliance_issues": []
        }
        
        for data_id, info in self.data_catalog.items():
            days_stored = (datetime.now() - info["registered_date"]).days
            if days_stored > info["retention_period_days"]:
                audit_report["compliance_issues"].append({
                    "data_id": data_id,
                    "issue": "Retention period exceeded",
                    "days_over": days_stored - info["retention_period_days"]
                })
        
        return audit_report
```

## Best Practices Summary

### Security Architecture Principles

1. **Zero Trust**: Never trust, always verify
2. **Defense in Depth**: Multiple layers of security
3. **Least Privilege**: Minimum necessary access
4. **Privacy by Design**: Built-in privacy protection
5. **Continuous Monitoring**: Real-time threat detection

### Implementation Checklist

- [ ] Implement Azure AD authentication with MFA
- [ ] Configure RBAC for model access
- [ ] Encrypt data at rest and in transit
- [ ] Validate and sanitize all inputs
- [ ] Monitor for adversarial attacks
- [ ] Implement rate limiting
- [ ] Set up security alerts
- [ ] Ensure GDPR compliance
- [ ] Regular security audits
- [ ] Model watermarking

### Security Monitoring KPIs

1. **Authentication Success Rate**: > 99%
2. **Mean Time to Detect (MTTD)**: < 5 minutes
3. **Mean Time to Respond (MTTR)**: < 30 minutes
4. **False Positive Rate**: < 1%
5. **Security Score**: > 90%

## Real-World Security Example

### Financial AI Security Implementation

```python
class FinancialAISecurity:
    def __init__(self):
        self.pci_compliance = PCIComplianceManager()
        self.threat_detector = AIThreatDetector()
        self.audit_logger = SecurityAuditLogger()
    
    def secure_fraud_prediction(self, transaction_data: dict) -> dict:
        """Secure fraud detection with compliance"""
        # PCI DSS compliance checks
        if not self.pci_compliance.validate_transaction_data(transaction_data):
            raise ComplianceError("PCI DSS validation failed")
        
        # Mask sensitive data
        masked_data = self._mask_sensitive_fields(transaction_data)
        
        # Threat detection
        if self.threat_detector.detect_adversarial_inputs(masked_data):
            self.audit_logger.log_security_event("ADVERSARIAL_ATTACK")
            raise SecurityError("Adversarial input detected")
        
        # Make prediction with audit trail
        with self.audit_logger.audit_context("fraud_prediction"):
            result = self.fraud_model.predict(transaction_data)
        
        return {
            "fraud_probability": result,
            "model_version": "v2.1",
            "audit_id": self.audit_logger.get_current_audit_id()
        }
    
    def _mask_sensitive_fields(self, data: dict) -> dict:
        """Mask PII for logging"""
        masked = data.copy()
        if 'credit_card_number' in masked:
            masked['credit_card_number'] = '*' * 12 + masked['credit_card_number'][-4:]
        return masked
```

## Conclusion

Security in AI systems requires a comprehensive approach addressing both traditional cybersecurity and AI-specific threats. Key takeaways:

- **Implement multiple layers of security** - authentication, authorization, encryption
- **Monitor continuously** for threats and anomalies
- **Validate all inputs** to prevent adversarial attacks
- **Maintain compliance** with regulations like GDPR
- **Protect models** from theft and misuse
- **Plan incident response** procedures

In the next lesson, we'll explore scaling strategies for AI applications to handle enterprise workloads.

## Additional Resources

- [Azure AI Security Features](https://learn.microsoft.com/azure/ai-services/security-features) [1]
- [OWASP AI Security Guidelines](https://owasp.org/www-project-machine-learning-security-top-10/) [2]
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) [3]

## References

[1] Microsoft Learn. "Security for Azure AI services." https://learn.microsoft.com/azure/ai-services/security-features

[2] OWASP. "Machine Learning Security Top 10." https://owasp.org/www-project-machine-learning-security-top-10/

[3] NIST. "AI Risk Management Framework." https://www.nist.gov/itl/ai-risk-management-framework 