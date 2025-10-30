# Issue: Alternative Implementation for Trailing Slash Routes

## Current Status
**Resolution:** Fixed on 2025-10-21 by adding trailing slashes in frontend API client

## Problem Summary
PeoplePerson API routes are defined as `@router.get("/", ...)` which requires trailing slashes in URLs (e.g., `/api/people/`). This differs from KarlCam's pattern and caused initial confusion.

## Current Implementation (What We Did)
Fixed in commit `7813230`:
- Added trailing slashes to frontend API calls in `webclient/src/lib/api-client.ts`
- `/api/people` → `/api/people/`
- Works correctly with current backend structure

## Alternative Implementation (For Future Consideration)

### Change Backend Routes to Match KarlCam Pattern

Instead of requiring trailing slashes, restructure routes to not need them.

**Current PeoplePerson Pattern:**
```python
# api/routers/people.py
@router.get("/", response_model=List[PersonRead])
async def get_people(...):
    ...

# api/main.py
app.include_router(people.router, prefix=f"{API_PREFIX}/people", tags=["people"])

# Result: Expects /api/people/ (with trailing slash)
```

**Proposed KarlCam Pattern:**
```python
# api/routers/people.py
router = APIRouter(prefix="/people", tags=["people"])

@router.get("", response_model=List[PersonRead])  # Use "" instead of "/"
async def get_people(...):
    ...

# OR use full path segments:
@router.get("/list", response_model=List[PersonRead])
async def get_people(...):
    ...

# api/main.py
app.include_router(people.router, prefix=API_PREFIX)

# Result: Works with /api/people (no trailing slash needed)
```

### Benefits of Alternative Approach
1. **Consistency with KarlCam**: Both projects follow same routing pattern
2. **Better URL aesthetics**: No trailing slashes in URLs
3. **Fewer redirects**: FastAPI won't need to redirect missing trailing slashes
4. **Frontend simplicity**: Frontend doesn't need to remember which endpoints need trailing slashes

### Migration Steps (If We Choose This Route)
1. Update all router definitions in `api/routers/` to use `""` instead of `"/"`
2. Move prefix definitions to router declarations where appropriate
3. Update all test files to match new URL patterns
4. Revert frontend trailing slash changes in `api-client.ts`
5. Test all endpoints thoroughly

### Files That Would Need Changes
- `api/routers/people.py`
- `api/routers/tags.py`
- `api/routers/auth.py`
- `api/routers/entries.py`
- `api/routers/associations.py`
- `api/main.py`
- All test files in `api/test_*.py`

## Decision
For now, we're keeping the current implementation (trailing slashes in frontend) because:
1. It's a smaller change (only frontend affected)
2. Lower risk of breaking existing functionality
3. Can migrate to alternative pattern in future refactor if desired

## References
- Fixed in commit: `7813230`
- Related commits: `9a4e2e8` (branch-specific images), `55cfdfe` (environment variables)
- KarlCam reference: `KarlCam/web/api/routers/cameras.py:58`
