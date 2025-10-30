# Production Deployment and DNS Configuration

## Problem

The application is currently deployed to staging only. To make PeoplePerson publicly accessible, we need to:

1. Deploy to the production environment
2. Configure custom domains in Porkbun DNS
3. Set up SSL certificates and domain mapping in Google Cloud

**Current State:**
- ✅ Staging environment deployed and working
  - Frontend: `https://peopleperson-frontend-staging-1076925812481.us-central1.run.app`
  - API: `https://peopleperson-api-staging-1076925812481.us-central1.run.app`
  - Domain configured: `staging.peopleperson.klazr.com`

- ❌ Production environment not yet deployed
  - Domain configured: `peopleperson.reedklaeser.com`
  - Services not running with latest code

- ❌ Custom domains not configured in Porkbun
  - Need DNS records for staging domain
  - Need DNS records for production domain

---

## Current Status

✅ **Working**:
- Cloud Build pipeline with automatic deployments
- Firebase configuration in build process
- Staging environment functional

❌ **Missing**:
- Production deployment
- Porkbun DNS configuration
- Custom domain mapping in Cloud Run

---

## Proposed Solution

### 1. Deploy to Production

#### Push to main branch
```bash
# Ensure staging is fully tested first
git checkout main
git merge staging
git push origin main
```

This will trigger Cloud Build to:
- Build Docker images with Firebase config
- Push images to GCR with `:latest` tag
- Deploy to `peopleperson-api-production` and `peopleperson-frontend-production`
- Use `_ENVIRONMENT=production` substitution variable

#### Verify deployment
```bash
# Check production services
gcloud run services list --region=us-central1 --project=peopleperson-app --filter="metadata.name:production"

# Test production URLs
curl https://peopleperson-api-production-1076925812481.us-central1.run.app/health
curl https://peopleperson-frontend-production-1076925812481.us-central1.run.app
```

---

### 2. Configure DNS in Porkbun

#### Staging Domain: `staging.peopleperson.klazr.com`

**Get Cloud Run domain mapping info:**
```bash
gcloud run domain-mappings describe staging.peopleperson.klazr.com \
  --platform=managed \
  --region=us-central1 \
  --project=peopleperson-app
```

**Add DNS records in Porkbun (for klazr.com):**

1. **Frontend** (`staging.peopleperson.klazr.com`):
   - Type: `CNAME`
   - Host: `staging.peopleperson`
   - Answer: `ghs.googlehosted.com`
   - TTL: 600

2. **API** (`api.staging.peopleperson.klazr.com`):
   - Type: `CNAME`
   - Host: `api.staging.peopleperson`
   - Answer: `ghs.googlehosted.com`
   - TTL: 600

#### Production Domain: `peopleperson.reedklaeser.com`

**Add DNS records in Porkbun (for reedklaeser.com):**

1. **Frontend** (`peopleperson.reedklaeser.com`):
   - Type: `CNAME`
   - Host: `peopleperson`
   - Answer: `ghs.googlehosted.com`
   - TTL: 600

2. **API** (`api.peopleperson.reedklaeser.com`):
   - Type: `CNAME`
   - Host: `api.peopleperson`
   - Answer: `ghs.googlehosted.com`
   - TTL: 600

---

### 3. Map Custom Domains in Cloud Run

**Note:** Terraform already has the domain mapping configuration in `networking.tf`, but you may need to verify or manually create mappings:

```bash
# Map staging frontend
gcloud run domain-mappings create \
  --service=peopleperson-frontend-staging \
  --domain=staging.peopleperson.klazr.com \
  --region=us-central1 \
  --project=peopleperson-app

# Map staging API
gcloud run domain-mappings create \
  --service=peopleperson-api-staging \
  --domain=api.staging.peopleperson.klazr.com \
  --region=us-central1 \
  --project=peopleperson-app

# Map production frontend
gcloud run domain-mappings create \
  --service=peopleperson-frontend-production \
  --domain=peopleperson.reedklaeser.com \
  --region=us-central1 \
  --project=peopleperson-app

# Map production API
gcloud run domain-mappings create \
  --service=peopleperson-api-production \
  --domain=api.peopleperson.reedklaeser.com \
  --region=us-central1 \
  --project=peopleperson-app
```

**Verify domain mapping:**
```bash
gcloud run domain-mappings list --region=us-central1 --project=peopleperson-app
```

---

### 4. Wait for SSL Provisioning

Google Cloud automatically provisions SSL certificates for custom domains. This can take 15 minutes to a few hours.

**Check certificate status:**
```bash
gcloud run domain-mappings describe staging.peopleperson.klazr.com \
  --region=us-central1 \
  --project=peopleperson-app \
  --format="value(status.resourceRecords,status.certificateStatus)"
```

Status should show: `CERTIFICATE_STATUS_ACTIVE`

---

## Testing Plan

### Staging Environment
1. Visit `https://staging.peopleperson.klazr.com`
2. Verify Firebase authentication works
3. Test API at `https://api.staging.peopleperson.klazr.com/health`
4. Check SSL certificate is valid (green lock icon)

### Production Environment
1. Visit `https://peopleperson.reedklaeser.com`
2. Create test account with Firebase auth
3. Add test person and verify data persistence
4. Test all major features (chat, map, profiles)
5. Verify API at `https://api.peopleperson.reedklaeser.com`

---

## Rollback Plan

If production deployment fails:

```bash
# Check recent builds
gcloud builds list --project=peopleperson-app --limit=5

# Roll back to previous image if needed
gcloud run deploy peopleperson-frontend-production \
  --image=gcr.io/peopleperson-app/peopleperson-frontend@sha256:PREVIOUS_SHA \
  --region=us-central1 \
  --project=peopleperson-app
```

---

## Monitoring

After deployment, monitor:

1. **Cloud Run Logs:**
   ```bash
   gcloud run services logs read peopleperson-api-production --region=us-central1
   gcloud run services logs read peopleperson-frontend-production --region=us-central1
   ```

2. **Error Reporting:**
   - https://console.cloud.google.com/errors?project=peopleperson-app

3. **Uptime Checks:**
   - Consider setting up Cloud Monitoring uptime checks for production

---

## Security Checklist

Before going live:
- [ ] Verify Firebase rules are properly configured
- [ ] Check that only authenticated users can access API endpoints
- [ ] Ensure database has proper access controls
- [ ] Review secret management (no secrets in code)
- [ ] Test with incognito/different browser to verify auth flow
- [ ] Check CORS configuration for production domain

---

## Future Improvements

- Set up CI/CD branch protection (require tests before merging to main)
- Add health check endpoints for monitoring
- Set up alerting for service downtime
- Consider blue-green deployments for zero-downtime updates
- Add terraform workspace for better environment isolation
