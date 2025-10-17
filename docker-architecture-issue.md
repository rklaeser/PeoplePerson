# Docker Architecture Issue Summary

## Problem

The PeoplePerson API deployment is failing with the following error:
```
ERROR: terminated: Application failed to start: failed to load /usr/local/bin/python: exec format error
```

## Root Cause

The Docker image `gcr.io/peopleperson-app/peopleperson-api:latest` was built on ARM64 architecture (Apple Silicon Mac) but Google Cloud Run requires AMD64/x86_64 architecture.

**Evidence:**
- Local image shows: `arm64 linux` architecture
- Cloud Run logs show "exec format error" (classic architecture mismatch)
- Image was built locally and pushed, not via Cloud Build

## Current Infrastructure Status

✅ **Terraform Infrastructure**: Working correctly
- All secrets created and populated via `terraform.tfvars`
- Database, service accounts, IAM permissions all configured
- Secret management fully functional

✅ **Secret Management**: Complete
- `database-url-production`: ✅ Created with actual connection string
- `database-url-staging`: ✅ Created with actual connection string  
- `twilio-account-sid`: ✅ Created with actual value
- `twilio-auth-token`: ✅ Created with actual value
- `twilio-phone-number`: ✅ Created with actual value

❌ **Docker Image**: Wrong architecture
- Current: ARM64 (incompatible with Cloud Run)
- Required: AMD64

## Solution Options

### Option A: Use Existing cloudbuild.yaml (Quick Fix)

**Command:**
```bash
gcloud builds submit --config cloudbuild.yaml --project=peopleperson-app .
```

**Pros:**
- Fastest solution
- Will rebuild with correct AMD64 architecture
- Uses existing configuration

**Cons:**
- cloudbuild.yaml tries to deploy services directly (conflicts with Terraform)
- Has mismatched port configuration (8000 vs 8080)
- References non-existent secrets (`database-url` vs `database-url-production`)
- May cause deployment conflicts

### Option B: Create Build-Only Configuration (Clean Approach)

**Steps:**
1. Create `cloudbuild-build-only.yaml` with just build/push steps
2. Remove deployment steps to avoid Terraform conflicts
3. Fix port and secret mismatches

**Command:**
```bash
gcloud builds submit --config cloudbuild-build-only.yaml --project=peopleperson-app .
```

**Pros:**
- Clean separation: Cloud Build handles images, Terraform handles deployment
- No deployment conflicts
- More maintainable long-term

**Cons:**
- Requires creating new config file
- Slightly more work upfront

### Option C: Local Build with Platform Flag (Immediate Fix)

**Command:**
```bash
docker build --platform linux/amd64 -t gcr.io/peopleperson-app/peopleperson-api:latest -f api/Dockerfile.prod .
docker push gcr.io/peopleperson-app/peopleperson-api:latest
```

**Pros:**
- Immediate fix
- No config changes needed
- Fastest to execute

**Cons:**
- Doesn't fix underlying build process
- Would need to repeat for future builds
- Local builds are less reliable than Cloud Build

## Next Steps After Image Fix

Once the AMD64 image is available:

1. **Terraform will automatically use the new image** (references `:latest` tag)
2. **Run terraform apply** to deploy with correct architecture
3. **Cloud Run should start successfully** with proper secret access

## Recommendation

**Option B (Build-Only Configuration)** is recommended for production setup because:
- Establishes clean build/deploy separation
- Prevents future conflicts between Cloud Build and Terraform
- More maintainable and predictable

However, **Option A** works fine if you want the quickest fix and can tolerate some deployment warnings/conflicts.