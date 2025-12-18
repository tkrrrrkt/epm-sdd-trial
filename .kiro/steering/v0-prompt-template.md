<!-- Source of truth: .kiro/steering/v0-workflow.md -->
# v0 Prompt Template（<...> を埋めて v0 に貼る）

# Context
You are generating UI for an EPM SaaS. The project uses SDD/CCSDD.
UI must follow boundary rules and must be easy to hand off to Cursor for implementation.

# Non-Negotiable Rules
- UI must call ONLY BFF endpoints (never call Domain API directly).
- UI must use ONLY `packages/contracts/src/bff` DTOs and errors.
- UI must NOT import or reference `packages/contracts/src/api`.
- Implement UI behavior, state, validation, and UX only. No business rules or domain authority in UI.
- Start with mock data (in the same shape as BFF DTOs). Later we will swap to real BFF calls.

# Feature
<feature-name>: <short description>

# Screens to build
- <screen-1>: purpose, main interactions
- <screen-2>: ...

# BFF Specification (from design.md)
## Endpoints (UI -> BFF)
| Method | Endpoint | Purpose | Request DTO | Response DTO |
|---|---|---|---|---|
| <GET/POST> | </...> | <...> | <BffXxxRequest> | <BffXxxResponse> |

## DTOs to use (contracts/bff)
- Request: <...>
- Response: <...>
- Errors: <...>

## Error UI behavior
- Show validation errors inline per field
- Show API/business errors in a top alert panel
- Map error codes to user-friendly messages (no hard-coded domain logic)

# UI Output Requirements
Generate Next.js (App Router) + TypeScript + Tailwind UI.
Include:
1) Routes/pages for the screens
2) A typed BffClient interface (methods correspond to endpoints above)
3) MockBffClient returning sample DTO-shaped data
4) HttpBffClient with fetch wrappers (but keep it unused initially, easy to switch)
5) Data models in UI must be the DTO types from contracts/bff
6) Minimal but production-like UI (tables, forms, search, pagination if needed)

# Mock Data Requirements
Provide mock data sets that:
- cover empty state, typical state, and error state
- use realistic values for EPM domain (period, org, version, amounts)
- strictly match the BFF response DTO shape

# Authentication / Tenant
- UI only attaches auth token to BFF requests.
- UI must not handle tenant_id directly.
