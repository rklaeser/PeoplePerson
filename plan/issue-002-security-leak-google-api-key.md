# Issue #002: Security Leak - Google API Key

## ⚠️ CRITICAL SECURITY ISSUE ⚠️

## Overview
**IMMEDIATE ACTION REQUIRED**: Google API Key has been publicly exposed in the codebase and potentially committed to version control.

## Exposed Credential
- **Type**: Google Firebase API Key
- **Value**: `AIzaSyAuuFSDPSASTvk9FNdpTAfetoAmZrT4cw4`
- **Location**: `frontend/src/config/firebase.ts:6`
- **Status**: Public leak detected

## Risk Assessment
- **Severity**: HIGH
- **Impact**: Unauthorized access to Firebase project
- **Exposure**: Publicly accessible in source code
- **Potential Damage**: 
  - Unauthorized API usage and billing
  - Data access/manipulation
  - Service disruption
  - Quota exhaustion attacks

## Immediate Actions Required

### 1. Revoke Compromised Key (URGENT - within 1 hour)
- [ ] Log into Google Cloud Console
- [ ] Navigate to APIs & Services > Credentials
- [ ] Locate and DELETE the exposed API key
- [ ] Generate new API key with proper restrictions

### 2. Secure New Credentials (URGENT)
- [ ] Create new Firebase API key
- [ ] Set proper API restrictions (HTTP referrers, IP addresses)
- [ ] Configure application restrictions
- [ ] Set quota limits to prevent abuse

### 3. Clean Version Control History
- [ ] Check if key was committed to git
- [ ] If committed, perform git history rewrite:
  ```bash
  git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch frontend/src/config/firebase.ts' \
  --prune-empty --tag-name-filter cat -- --all
  ```
- [ ] Force push cleaned history (DESTRUCTIVE - coordinate with team)

### 4. Update Codebase Security
- [ ] Move API key to environment variables
- [ ] Add `.env` files to `.gitignore`
- [ ] Update firebase config to use environment variables
- [ ] Verify no other secrets are exposed

## Implementation Steps

### Step 1: Emergency Response (Now)
```bash
# 1. Immediately revoke the key in Google Cloud Console
# 2. Generate new restricted key
# 3. Update local environment
```

### Step 2: Secure Configuration
```typescript
// frontend/src/config/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... other config from environment
}
```

### Step 3: Environment Setup
```bash
# Create .env file (NOT committed)
VITE_FIREBASE_API_KEY=new_restricted_key_here
VITE_FIREBASE_AUTH_DOMAIN=peopleperson-d189e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=peopleperson-d189e
# ... other config
```

### Step 4: Security Audit
- [ ] Scan entire codebase for other exposed secrets
- [ ] Review all configuration files
- [ ] Check environment variable usage
- [ ] Audit `.gitignore` completeness

## Prevention Measures

### Git Hooks
- [ ] Install pre-commit hooks to detect secrets
- [ ] Configure automated secret scanning
- [ ] Set up commit message validation

### Development Process
- [ ] Mandatory environment variable usage for all secrets
- [ ] Code review checklist including security
- [ ] Regular security audits
- [ ] Developer security training

### Monitoring
- [ ] Set up API key usage monitoring
- [ ] Configure billing alerts
- [ ] Implement rate limiting
- [ ] Monitor for suspicious activity

## Files to Update
- [ ] `frontend/src/config/firebase.ts` - Remove hardcoded key
- [ ] `frontend/.env.example` - Add template
- [ ] `frontend/.env` - Add actual values (not committed)
- [ ] `.gitignore` - Ensure .env files excluded
- [ ] `README.md` - Add setup instructions

## Success Criteria
- [ ] Old API key completely revoked
- [ ] New restricted key operational
- [ ] No secrets in version control
- [ ] Environment-based configuration working
- [ ] Security monitoring in place
- [ ] Team educated on secure practices

## Timeline
- **Hour 1**: Revoke key, generate new one
- **Hour 2-4**: Clean codebase, update configuration
- **Day 1**: Complete security audit and prevention setup
- **Ongoing**: Monitor for suspicious activity

## Stakeholder Communication
- [ ] Notify team of security incident
- [ ] Document lessons learned
- [ ] Update security policies
- [ ] Schedule security review meeting

## Related Issues
- Links to #001 (Google Cloud setup should include proper secret management)

---

**⚠️ PRIORITY: This issue takes precedence over all other work until resolved**