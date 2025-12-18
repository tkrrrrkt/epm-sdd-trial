# Design Document Template

---

**Purpose**: Provide sufficient detail to ensure implementation consistency across different implementers, preventing interpretation drift.

**Approach**:

* Include essential sections that directly inform implementation decisions
* Omit optional sections unless critical to preventing implementation errors
* Match detail level to feature complexity
* Use diagrams and tables over lengthy prose

## **Warning**: Approaching 1000 lines indicates excessive feature complexity that may require design simplification.

> Sections may be reordered (e.g., surfacing Requirements Traceability earlier or moving Data Models nearer Architecture) when it improves clarity. Within each section, keep the flow **Summary → Scope → Decisions → Impacts/Risks** so reviewers can scan consistently.
>
> **SDD / CCSDD 前提ルール**
>
> * requirements は「ユーザー価値単位（縦割り）」で記載し、責務分解は design で行う
> * 本 design は実装構造に引きずられるための資料ではなく、Steering で定義した境界と責務を守るための設計情報を記述する
> * UI / BFF / Domain API / Service / Repository の責務は、本ドキュメント内で明示的に分離して定義する
> * Contracts（DTO / Error / Enum）は境界の SSoT とし、design では参照のみを行う
> * Mermaid は任意（レンダラ差異があるため）。必要ならテキスト or 外部ファイル参照で代替可

## Overview

2-3 paragraphs max

**Purpose**: This feature delivers [specific value] to [target users].

**Users**: [Target user groups] will utilize this for [specific workflows].

**Impact** (if applicable): Changes the current [system state] by [specific modifications].

### Goals

* Primary objective 1
* Primary objective 2
* Success criteria

### Non-Goals

* Explicitly excluded functionality
* Future considerations outside current scope
* Integration points deferred

## Architecture

> Reference detailed discovery notes in `research.md` only for background; keep design.md self-contained for reviewers by capturing all decisions and contracts here.
> Capture key decisions in text and let diagrams carry structural detail—avoid repeating the same information in prose.

### Existing Architecture Analysis (if applicable)

When modifying existing systems:

* Current architecture patterns and constraints
* Existing domain boundaries to be respected
* Integration points that must be maintained
* Technical debt addressed or worked around

### Architecture Pattern & Boundary Map

**RECOMMENDED**: Include a Mermaid diagram showing the chosen architecture pattern and system boundaries (required for complex features, optional for simple additions)

**Architecture Integration**:

* Selected pattern: UI + BFF + Domain API（UI直APIは禁止、画面要件はBFFで吸収）
* Domain/feature boundaries: [how responsibilities are separated to avoid conflicts]
* Existing patterns preserved: [list key patterns]
* New components rationale: [why each is needed]
* Steering compliance: [principles maintained]

### Technology Stack

| Layer      | Choice / Version | Role in Feature  | Notes                                            |
| ---------- | ---------------- | ---------------- | ------------------------------------------------ |
| UI         | Next.js          | Presentation     | v0 output adapted here                           |
| BFF        | NestJS           | UI-oriented API  | No domain authority (aggregation/transform only) |
| Domain API | NestJS           | Domain authority | RLS / audit / final auth                         |
| DB         | PostgreSQL       | Persistence      | tenant_id + RLS                                  |
| Contracts  | TypeScript       | SSoT             | api / bff DTOs                                   |

> Keep rationale concise here and, when more depth is required (trade-offs, benchmarks), add a short summary plus pointer to the Supporting References section and `research.md` for raw investigation notes.

## System Flows

Provide only the diagrams needed to explain non-trivial flows. Use pure Mermaid syntax. Common patterns:

* Sequence (multi-party interactions)
* Process / state (branching logic or lifecycle)
* Data / event flow (pipelines, async messaging)

Skip this section entirely for simple CRUD changes.

> Describe flow-level decisions (e.g., gating conditions, retries) briefly after the diagram instead of restating each step.

## Requirements Traceability

Use this section for complex or compliance-sensitive features where requirements span multiple domains. Straightforward 1:1 mappings can rely on the Components summary table.

Map each requirement ID (e.g., `2.1`) to the design elements that realize it.

| Requirement | Summary | Components | Interfaces | Flows |
| ----------- | ------- | ---------- | ---------- | ----- |
| 1.1         |         |            |            |       |
| 1.2         |         |            |            |       |

> Omit this section only when a single component satisfies a single requirement without cross-cutting concerns.
>
> NOTE: 本セクションは requirements の縦割り構造を維持したまま設計要素との対応関係を示すためのものであり、責務分解そのものは **Architecture Responsibilities** に記載する。

## Architecture Responsibilities（Mandatory）

This section operationalizes Steering rules.
Each subsection MUST be filled before implementation begins.

### BFF Specification（apps/bff）

**Purpose**

* UI要件に最適化されたAPIを提供する（画面単位の Read Model / ViewModel を返す）
* Domain APIのレスポンスを集約・変換する
* ビジネスルールの正本は持たない（Domain APIに委譲）

**BFF Endpoints（UIが叩く）**

| Method | Endpoint | Purpose | Request DTO (contracts/bff) | Response DTO (contracts/bff) | Notes |
| ------ | -------- | ------- | --------------------------- | ---------------------------- | ----- |
|        |          |         |                             |                              |       |

**Request / Response DTO（contracts/bff）**

* [List the DTO names used by UI ↔ BFF]

**Transformation Rules（api DTO → bff DTO）**

* Mapping policy (field rename/omit/default)
* Rationale for UI-oriented shaping

**Error Handling（contracts errorに準拠）**

* Normalization rules to `contracts/bff/errors`
* Which errors are passed through vs rewritten
* Final reject authority remains Domain API

**Authentication / Tenant Context（tenant_id/user_id伝搬）**

* Where tenant_id/user_id are resolved
* How they are propagated to Domain API calls

---

### Service Specification（Domain / apps/api）

**Usecases（Create/Update/Inactivate 等）**

* CreateXxx
* UpdateXxx
* InactivateXxx
* ...

**Business Rules（主要なビジネスルールの所在）**

* Rules that MUST live in Domain API / Service
* Rules that MUST NOT live in BFF/UI (and why)

**Transaction Boundary**

* Transaction start/end per usecase
* Notes on idempotency / concurrency if relevant

**Audit Logging（監査ログ記録ポイント）**

* When audit_log is written
* Required fields (who/when/what/result and optional diff)

---

### Repository Specification（apps/api）

**Responsibilities**

* DBアクセスの唯一の窓口
* ドメインロジックを含まない

**Methods（取得・更新メソッド一覧）**

* findById(tenant_id, id)
* search(tenant_id, filters)
* insert(tenant_id, data)
* update(tenant_id, id, patch)
* ...

**Isolation & Guards**

* tenant_id 必須引数（全メソッド）
* where句の二重ガード方針（tenant_id を条件に必ず含める）

**RLS Assumptions（set_config 前提）**

* DB session requires set_config(app.tenant_id/app.user_id)
* RLS policies assumed enabled; disabling prohibited

---

### Contracts Summary（This Feature）

**BFF Contracts（UI ↔ BFF）**

* `packages/contracts/src/bff/...`

**API Contracts（BFF ↔ API）**

* `packages/contracts/src/api/...`

**Rules**

* DTO / Error / Enum は contracts 外に定義してはならない
* UI は `packages/contracts/src/api` を参照してはならない（境界の形骸化防止）

## Components and Interfaces

Provide a quick reference before diving into per-component details.

> NOTE: 本章は **Architecture Responsibilities** で定義した境界を前提に、個別コンポーネントの詳細を補足するためのセクションである。

* Summaries can be a table or compact list. Example table:

  | Component        | Domain/Layer | Intent       | Req Coverage | Key Dependencies (P0/P1)         | Contracts      |
  | ---------------- | ------------ | ------------ | ------------ | -------------------------------- | -------------- |
  | ExampleComponent | UI           | Displays XYZ | 1, 2         | GameProvider (P0), MapPanel (P1) | Service, State |
* Only components introducing new boundaries (e.g., logic hooks, external integrations, persistence) require full detail blocks. Simple presentation components can rely on the summary row plus a short Implementation Note.

Group detailed blocks by domain or architectural layer. For each detailed component, list requirement IDs as `2.1, 2.3` (omit “Requirement”). When multiple UI components share the same contract, reference a base interface/props definition instead of duplicating code blocks.

### [Domain / Layer]

#### [Component Name]

| Field             | Detail                                   |
| ----------------- | ---------------------------------------- |
| Intent            | 1-line description of the responsibility |
| Requirements      | 2.1, 2.3                                 |
| Owner / Reviewers | (optional)                               |

**Responsibilities & Constraints**

* Primary responsibility
* Domain boundary and transaction scope
* Data ownership / invariants

**Dependencies**

* Inbound: Component/service name — purpose (Criticality)
* Outbound: Component/service name — purpose (Criticality)
* External: Service/library — purpose (Criticality)

Summarize external dependency findings here; deeper investigation (API signatures, rate limits, migration notes) lives in `research.md`.

**Contracts**: Service [ ] / API [ ] / Event [ ] / Batch [ ] / State [ ]  ← check only the ones that apply.

##### Service Interface

(Use fenced code blocks only if your renderer supports them reliably. Otherwise, keep this as plain text.)

* Interface name:
* Methods:
* Preconditions:
* Postconditions:
* Invariants:

##### API Contract

| Method | Endpoint      | Request       | Response | Errors        |
| ------ | ------------- | ------------- | -------- | ------------- |
| POST   | /api/resource | CreateRequest | Resource | 400, 409, 500 |

##### Event Contract

* Published events:
* Subscribed events:
* Ordering / delivery guarantees:

##### Batch / Job Contract

* Trigger:
* Input / validation:
* Output / destination:
* Idempotency & recovery:

##### State Management

* State model:
* Persistence & consistency:
* Concurrency strategy:

**Implementation Notes**

* Integration:
* Validation:
* Risks:

## Data Models

Focus on the portions of the data landscape that change with this feature.

### Domain Model

* Aggregates and transactional boundaries
* Entities, value objects, domain events
* Business rules & invariants
* Optional Mermaid diagram for complex relationships

### Logical Data Model

**Structure Definition**:

* Entity relationships and cardinality
* Attributes and their types
* Natural keys and identifiers
* Referential integrity rules

**Consistency & Integrity**:

* Transaction boundaries
* Cascading rules
* Temporal aspects (versioning, audit)

### Physical Data Model

**When to include**: When implementation requires specific storage design decisions

**For Relational Databases**:

* Table definitions with data types
* Primary/foreign keys and constraints
* Indexes and performance optimizations
* Partitioning strategy for scale

**For Document Stores**:

* Collection structures
* Embedding vs referencing decisions
* Sharding key design
* Index definitions

**For Event Stores**:

* Event schema definitions
* Stream aggregation strategies
* Snapshot policies
* Projection definitions

**For Key-Value/Wide-Column Stores**:

* Key design patterns
* Column families or value structures
* TTL and compaction strategies

### Data Contracts & Integration

**API Data Transfer**

* Request/response schemas
* Validation rules
* Serialization format (JSON, Protobuf, etc.)

**Event Schemas**

* Published event structures
* Schema versioning strategy
* Backward/forward compatibility rules

**Cross-Service Data Management**

* Distributed transaction patterns (Saga, 2PC)
* Data synchronization strategies
* Eventual consistency handling

Skip subsections that are not relevant to this feature.

## Error Handling

### Error Strategy

Concrete error handling patterns and recovery mechanisms for each error type.

### Error Categories and Responses

**User Errors** (4xx): Invalid input → field-level validation; Unauthorized → auth guidance; Not found → navigation help
**System Errors** (5xx): Infrastructure failures → graceful degradation; Timeouts → circuit breakers; Exhaustion → rate limiting
**Business Logic Errors** (422): Rule violations → condition explanations; State conflicts → transition guidance

**Process Flow Visualization** (when complex business logic exists):
Include Mermaid flowchart only for complex error scenarios with business workflows.

### Monitoring

Error tracking, logging, and health monitoring implementation.

## Testing Strategy

### Default sections (adapt names/sections to fit the domain)

* Unit Tests: 3–5 items from core functions/modules (e.g., auth methods, subscription logic)
* Integration Tests: 3–5 cross-component flows (e.g., UI → BFF → API)
* E2E/UI Tests (if applicable): 3–5 critical user paths (e.g., forms, dashboards)
* Performance/Load (if applicable): 3–4 items (e.g., concurrency, high-volume ops)

## Optional Sections (include when relevant)

### Security Considerations

*Use this section for features handling auth, sensitive data, external integrations, or user permissions. Capture only decisions unique to this feature; defer baseline controls to steering docs.*

* Threat modeling, security controls, compliance requirements
* Authentication and authorization patterns
* Data protection and privacy considerations

### Performance & Scalability

*Use this section when performance targets, high load, or scaling concerns exist. Record only feature-specific targets or trade-offs and rely on steering documents for general practices.*

* Target metrics and measurement strategies
* Scaling approaches (horizontal/vertical)
* Caching strategies and optimization techniques

### Migration Strategy

Include a Mermaid flowchart showing migration phases when schema/data movement is required.

* Phase breakdown, rollback triggers, validation checkpoints

## Supporting References (Optional)

* Create this section only when keeping the information in the main body would hurt readability (e.g., very long TypeScript definitions, vendor option matrices, exhaustive schema tables). Keep decision-making context in the main sections so the design stays self-contained.
* Link to the supporting references from the main text instead of inlining large snippets.
* Background research notes and comparisons continue to live in `research.md`, but their conclusions must be summarized in the main design.
