# Security Policy (SECURITY.md)

This document outlines the security policies, vulnerability reporting channels, and production hardening guidelines for the DevTrack platform.

---

## 🛡️ Supported Versions

Only the latest release of DevTrack is actively supported with security updates and patches.

| Version | Supported | Security Patches |
| :--- | :--- | :--- |
| **v1.0.x** (Current) | ✅ Yes | ✅ Full Coverage |
| **< v1.0.0** (Beta) | ❌ No | ❌ Obsolete |

---

## ✉️ Reporting a Vulnerability

If you discover a potential security vulnerability in DevTrack (e.g., secret leaks, authorization bypasses, rate-limiting loopholes), please **do not open a public GitHub issue**. Instead, follow these steps:

1. Send a detailed report to the security contact at: **security@devtrack.run**
2. Include the following details in your email:
   - Description of the vulnerability and its potential impact.
   - Step-by-step instructions to reproduce the issue (proof-of-concept code or screenshots are highly appreciated).
   - Any proposed remediation steps or code modifications.

We will acknowledge receipt of your report within **24 hours** and provide a tracking status update. A fix or patch will be prioritized and released in coordination with a public disclosure.

---

## 🔒 Production Security Hardening

When deploying DevTrack in production, you must adhere to the following security protocols:

### 1. Unified Environment Config Limits
All sensitive secrets (e.g., `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_PASSWORD`) are validated strictly at startup. 
- In **production mode** (`NODE_ENV=production`), the application will immediately crash if any critical keys are missing or using development fallback defaults (such as `dev-access-secret`).
- You must generate cryptographic secrets using a secure random generator:
  ```bash
  openssl rand -base64 32
  ```

### 2. CORS Hardening
The API server restricts requests using a strict CORS origin configuration:
- In production, `CORS_ORIGIN` **must** be an `https://` origin. Development protocols like HTTP are automatically blocked.

### 3. Rate-Limiting Matrices
DevTrack has built-in rate-limiting layers targeting generic routes as well as strict brute-force prevention on authentication paths:
- **General Rate Limit**: Default is 100 requests per 15 minutes.
- **Auth Rate Limit**: Strict window of 5 login/registration requests per 15 minutes, with a secondary cap of 20 requests per hour.

### 4. Database Security
- Connect to MongoDB using a managed service (such as MongoDB Atlas) with strict **IP Access Lists** configured to only allow connections from your production web server's VPC or IP addresses.
- Ensure Mongoose schemas enforce validation and prevent raw queries that could lead to injection exploits.
