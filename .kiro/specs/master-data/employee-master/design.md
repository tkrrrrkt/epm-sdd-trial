# 社員マスタ設計仕様（master-data/employee-master）

> **目的**: SDD/CCSDD前提で、実装者（人/AI）による解釈ブレを防ぎ、UI→BFF→Domain API→DB の責務と境界を固定する。
>
> **前提（Steering準拠）**
>
> * UI は **必ず BFF 経由**。UI が Domain API を直接呼ぶのは禁止。
> * UI は **packages/contracts/src/bff** のみ参照可。**packages/contracts/src/api の参照は禁止**。
> * Contracts（DTO / Error / Enum）は境界のSSoT。
> * 設計未完（Mandatory空欄）なら tasks の Gate で実装開始禁止。

---

## Overview

本Featureは、EPM SaaSにおいてテナントごとの社員情報を管理する「社員マスタ」機能を提供する。社員の登録・一覧・検索・編集・無効化を実現し、将来の権限管理や計画・実績入力機能の前提となるマスタデータを提供する。

**Purpose**: テナントごとの社員情報を安全かつ一貫して管理し、他機能の前提となるマスタデータを提供する。

**Users**: 経営企画部門、人事部門、FP&A担当者（管理者/準管理者）が社員情報を管理・参照する。

**Impact**: 新規機能として実装され、既存システムへの影響はない（ただし共通の権限/監査基盤を利用する）。

### Goals

* 社員の登録・一覧・検索・編集・無効化機能を提供する
* マルチテナント環境で安全に社員データを隔離する（RLS必須）
* 権限制御をUI/APIで一貫して実装する
* 監査ログにより操作履歴を追跡可能にする

### Non-Goals

* 認証基盤（Clerk）とのアカウント連携・SSO連携
* 申請・承認ワークフロー
* CSV/Excel一括取込・一括更新
* 組織マスタ・ロールマスタとの厳密な外部キー連動（参照キーのみ）
* 再有効化（reactivate）はMVP外

---

## Architecture

### Architecture Pattern & Boundary Map

本Featureは **UI + BFF + Domain API** パターンを採用する。

```
UI (apps/web)
  ↓ (contracts/bff)
BFF (apps/bff)
  ↓ (contracts/api)
Domain API (apps/api)
  ↓ (Repository)
DB (PostgreSQL + RLS)
```

**Architecture Integration**:

* Selected pattern: UI + BFF + Domain API（UI直APIは禁止、画面要件はBFFで吸収）
* Domain/feature boundaries: master-dataコンテキスト内で社員マスタを管理
* Existing patterns preserved: マルチテナント/RLS、権限設計、監査ログの共通パターンに従う
* New components rationale:

  * BFF: UI要件に最適化したAPI提供（ページング、ソート、検索条件の整形、DTO整形）
  * Domain API: ビジネスルールの正本、権限チェックの最終判断、監査ログ
  * Repository: DBアクセスの唯一の窓口、tenant_id必須
* Steering compliance: tech.md/structure.md のマルチテナント、権限、監査、Contracts-first原則に準拠

### Technology Stack

| Layer      | Choice / Version | Role in Feature     | Notes                                  |
| ---------- | ---------------- | ------------------- | -------------------------------------- |
| UI         | Next.js          | 社員一覧・編集画面           | TanStack Query + React Hook Form + Zod |
| BFF        | NestJS           | UI向けAPI（集約・変換）      | ドメイン権限の最終判断は行わない                       |
| Domain API | NestJS           | ドメイン権限の最終判断         | RLS / audit / final auth               |
| DB         | PostgreSQL       | 社員データの永続化           | tenant_id + RLS                        |
| Contracts  | TypeScript       | DTO/Error/EnumのSSoT | api / bff DTOs                         |

---

## System Flows（要点）

### 一覧取得（デフォルト：有効のみ）

1. UI → BFF: `GET /bff/employees?page=1&pageSize=50&includeInactive=false`
2. BFF → Domain API: `GET /api/employees?offset=0&limit=50&status=ACTIVE`
3. Domain API → Repo: tenant_id 二重ガード + RLS
4. BFF: api response を bff response に整形（page/pageSize/total）
5. UI: bff DTOに基づき表示

### 新規登録

1. UI → BFF: `POST /bff/employees`
2. BFF: 入力バリデーション（軽微）→ Domain APIへ
3. Domain API: 権限最終判断 → 一意性チェック → insert → audit_log → commit
4. BFF: エラー正規化（bff/errors）→ UIへ

---

## Requirements Traceability

| Requirement | Summary         | Components               | Interfaces              | Flows |
| ----------- | --------------- | ------------------------ | ----------------------- | ----- |
| 1.1         | 必須項目入力制御        | UI Form, BFF, Domain API | CreateEmployee*         | 新規登録  |
| 1.2         | 社員コード一意性チェック    | Domain API, Repository   | EmployeeCodeDuplicate   | 重複検証  |
| 1.3         | tenant_idを含めた保存 | Repository               | insert(tenant_id, data) | 登録    |
| 2.1         | テナントスコープ一覧表示    | BFF, Domain API, Repo    | ListEmployees*          | 一覧    |
| 2.2         | 検索条件フィルタリング     | BFF, Domain API, Repo    | SearchEmployees*        | 検索    |
| 2.3         | デフォルト有効社員のみ表示   | BFF, Domain API, Repo    | ListEmployees*          | 一覧    |
| 2.4         | ソート・ページング       | BFF, Domain API, Repo    | ListEmployees*          | 一覧    |
| 3.1         | 編集画面への最新情報表示    | BFF, Domain API, Repo    | GetEmployee*            | 詳細    |
| 3.2         | バリデーションと更新      | Domain API, Repository   | UpdateEmployee*         | 更新    |
| 3.3         | 社員コード変更時の一意性再検証 | Domain API, Repository   | EmployeeCodeDuplicate   | 更新    |
| 4.1         | 論理削除（無効化）       | Domain API, Repository   | InactivateEmployee*     | 無効化   |
| 4.2         | 無効社員の表示制御       | BFF, Domain API, Repo    | ListEmployees*          | 一覧    |
| 4.3         | 無効社員の編集制限       | Domain API               | UpdateEmployee*         | 更新    |
| 5.1         | 参照権限チェック        | UI, BFF, Domain API      | epm.user.read           | 権限    |
| 5.2         | 更新権限チェック        | UI, BFF, Domain API      | epm.user.update         | 権限    |
| 5.3         | UI/API一貫制御      | UI, BFF, Domain API      | Permission check        | 権限    |
| 6.1         | 監査情報保持          | Domain API, Audit Log    | audit_log               | 監査    |
| 6.2         | 監査ログ必須項目        | Domain API, Audit Log    | audit_log               | 監査    |
| 7.1         | tenant_idスコープ隔離 | Repository, RLS          | RLS policy              | 全フロー  |
| 7.2         | RLS前提での保存       | Repository, RLS          | RLS policy              | 全フロー  |

---

## Architecture Responsibilities（Mandatory）

### BFF Specification（apps/bff）

**Purpose**

* UI要件に最適化されたAPIを提供する（ページング、ソート、検索条件の整形）
* Domain APIのレスポンスを集約・変換する
* ビジネスルールの正本は持たない（Domain APIに委譲）

**BFF Endpoints（UIが叩く）**

| Method | Endpoint                               | Purpose      | Request DTO (contracts/bff)  | Response DTO (contracts/bff)  | Notes                       |
| ------ | -------------------------------------- | ------------ | ---------------------------- | ----------------------------- | --------------------------- |
| GET    | /bff/employees                         | 社員一覧・検索      | BffEmployeeListRequest       | BffEmployeeListResponse       | page/pageSize, sort, filter |
| GET    | /bff/employees/:employee_id            | 社員詳細取得       | BffEmployeeGetRequest        | BffEmployeeGetResponse        |                             |
| POST   | /bff/employees                         | 社員新規登録       | BffEmployeeCreateRequest     | BffEmployeeCreateResponse     |                             |
| PATCH  | /bff/employees/:employee_id            | 社員情報編集（部分更新） | BffEmployeeUpdateRequest     | BffEmployeeUpdateResponse     |                             |
| POST   | /bff/employees/:employee_id/inactivate | 社員無効化（コマンド）  | BffEmployeeInactivateRequest | BffEmployeeInactivateResponse | command                     |

**Request / Response DTO（contracts/bff）**

* `BffEmployeeListRequest`: filters（employeeCode?, name?, orgKey?, status?, includeInactive?）、paging（page, pageSize）、sort（sortBy, sortOrder）
* `BffEmployeeListResponse`: items（社員サマリ配列）, total, page, pageSize
* `BffEmployeeGetRequest`: employee_id（path）
* `BffEmployeeGetResponse`: 社員詳細
* `BffEmployeeCreateRequest`: employeeCode, familyName, givenName, displayName?, orgKey, email?, status, hiredAt?, remarks?
* `BffEmployeeCreateResponse`: 作成された社員
* `BffEmployeeUpdateRequest`: employee_id（path）, patch（部分更新）
* `BffEmployeeUpdateResponse`: 更新後社員
* `BffEmployeeInactivateRequest`: employee_id（path）, terminatedAt?
* `BffEmployeeInactivateResponse`: 無効化後社員

**Transformation Rules（api DTO → bff DTO）**

* Domain API は offset/limit、BFF は page/pageSize を採用し相互変換する
* UI表示に必要な形へ整形（例：displayName のデフォルト生成、null/空値の扱い）
* UI は bff DTO のみを扱い、api DTO を参照しない

**Error Handling（contracts errorに準拠）**

* Domain API のエラーをUIへ直送しない（UI契約を安定させるため）
* BFFで `contracts/bff/errors` へ正規化する

  * 社員コード重複 → `BFF_CONFLICT_ERROR`（code=`EMPLOYEE_CODE_DUPLICATE`）
  * バリデーション → `BFF_VALIDATION_ERROR`（fieldErrors）
  * 権限不足 → `BFF_FORBIDDEN`
  * 存在しない → `BFF_NOT_FOUND`
  * 予期しない → `BFF_INTERNAL_ERROR`
* Domain API は詳細原因を返してよいが、UIは bff error のみ参照する

**Authentication / Tenant Context（tenant_id/user_id伝搬）**

* BFFは認証情報（Clerkトークン）から `tenant_id` / `user_id` を解決
* Domain API 呼び出し時に `tenant_id` / `user_id` をヘッダーまたはリクエストコンテキストで伝搬
* BFFがDBへ直接接続することは禁止（DBアクセスはDomain APIの責務）

---

### Service Specification（Domain / apps/api）

**Usecases（Create/Update/Inactivate 等）**

* `CreateEmployee`: 社員新規登録
* `UpdateEmployee`: 社員情報編集
* `InactivateEmployee`: 社員無効化
* `GetEmployee`: 社員詳細取得
* `ListEmployees`: 社員一覧・検索

**Business Rules（主要なビジネスルールの所在）**

* **Domain API / Serviceに置くルール**

  * 社員コードのテナント内一意性チェック（Create/Update）
  * 無効社員の編集制限（MVPでは原則禁止：参照のみ）
  * 必須項目のバリデーション（Create/Update）
  * デフォルト一覧は ACTIVE のみ（includeInactive=false の場合）
* **BFF/UIに置かないルール**

  * ビジネスルールの正本はDomain APIに置き、BFF/UIは表示制御のみ

**Transaction Boundary**

* `CreateEmployee`: begin → unique check → insert → audit_log → commit
* `UpdateEmployee`: begin → exists check → unique check（employeeCode変更時） → update → audit_log → commit
* `InactivateEmployee`: begin → exists check → status update → audit_log → commit
* `ListEmployees` / `GetEmployee`: read-only（トランザクション不要）

**Audit Logging（監査ログ記録ポイント）**

* `CreateEmployee`: operation=`create`
* `UpdateEmployee`: operation=`update`（changes: before/after diff JSON）
* `InactivateEmployee`: operation=`inactivate`
* 必須: tenant_id, user_id, resource_type=`employee`, resource_id, operation, result, occurred_at
* 任意: changes

---

### Repository Specification（apps/api）

**Responsibilities**

* DBアクセスの唯一の窓口
* ドメインロジックを含まない
* tenant_id を必須引数として受け取る

**Methods（取得・更新メソッド一覧）**

* `findById(tenant_id: string, id: string): Promise<Employee | null>`
* `search(tenant_id: string, filters: EmployeeSearchFilters, pagination: PaginationOptions, sort: SortOptions): Promise<Employee[]>`
* `count(tenant_id: string, filters: EmployeeSearchFilters): Promise<number>`
* `insert(tenant_id: string, data: CreateEmployeeData): Promise<Employee>`
* `update(tenant_id: string, id: string, patch: UpdateEmployeeData): Promise<Employee>`
* `inactivate(tenant_id: string, id: string, terminatedAt?: string): Promise<Employee>`
* `checkEmployeeCodeUnique(tenant_id: string, employeeCode: string, excludeId?: string): Promise<boolean>`

**Isolation & Guards**

* 全メソッドで `tenant_id` 必須
* where句に `tenant_id` を必ず含める（二重ガード）
* RLSを前提とするが、アプリケーション側でもtenant境界を守る

**RLS Assumptions（set_config 前提）**

* DB sessionに `set_config('app.tenant_id', tenant_id, true)`
* DB sessionに `set_config('app.user_id', user_id, true)`
* RLS policy は `tenant_id = current_setting('app.tenant_id')::uuid`
* RLS無効化は禁止

---

### Contracts Summary（This Feature）

> **注意**: 下記のファイルパスは、リポジトリの実構造に合わせて調整する（この設計では「どの層がどの契約を持つか」を固定することが主目的）。

**BFF Contracts（UI ↔ BFF）**

* `packages/contracts/src/bff/employee/BffEmployeeListRequest.ts`
* `packages/contracts/src/bff/employee/BffEmployeeListResponse.ts`
* `packages/contracts/src/bff/employee/BffEmployeeGetRequest.ts`
* `packages/contracts/src/bff/employee/BffEmployeeGetResponse.ts`
* `packages/contracts/src/bff/employee/BffEmployeeCreateRequest.ts`
* `packages/contracts/src/bff/employee/BffEmployeeCreateResponse.ts`
* `packages/contracts/src/bff/employee/BffEmployeeUpdateRequest.ts`
* `packages/contracts/src/bff/employee/BffEmployeeUpdateResponse.ts`
* `packages/contracts/src/bff/employee/BffEmployeeInactivateRequest.ts`
* `packages/contracts/src/bff/employee/BffEmployeeInactivateResponse.ts`

**API Contracts（BFF ↔ API）**

* `packages/contracts/src/api/employee/EmployeeListApiRequest.ts`
* `packages/contracts/src/api/employee/EmployeeListApiResponse.ts`
* `packages/contracts/src/api/employee/EmployeeGetApiRequest.ts`
* `packages/contracts/src/api/employee/EmployeeGetApiResponse.ts`
* `packages/contracts/src/api/employee/EmployeeCreateApiRequest.ts`
* `packages/contracts/src/api/employee/EmployeeCreateApiResponse.ts`
* `packages/contracts/src/api/employee/EmployeeUpdateApiRequest.ts`
* `packages/contracts/src/api/employee/EmployeeUpdateApiResponse.ts`
* `packages/contracts/src/api/employee/EmployeeInactivateApiRequest.ts`
* `packages/contracts/src/api/employee/EmployeeInactivateApiResponse.ts`

**Enum Contracts**

* `packages/contracts/src/shared/enums/EmployeeStatus.ts`: `ACTIVE`, `INACTIVE`

**Error Contracts（BFF側で正規化してUIへ）**

* `packages/contracts/src/bff/errors/BffValidationError.ts`
* `packages/contracts/src/bff/errors/BffConflictError.ts`
* `packages/contracts/src/bff/errors/BffForbiddenError.ts`
* `packages/contracts/src/bff/errors/BffNotFoundError.ts`
* `packages/contracts/src/bff/errors/BffInternalError.ts`

**Rules**

* DTO / Error / Enum は contracts 外に定義してはならない
* UI は `packages/contracts/src/api` を参照してはならない

---

## Data Models

### Domain Model

**Employee Aggregate**

* **識別子**

  * 技術識別子: `id` (UUID)
  * ビジネス識別子: `employeeCode`（テナント内一意）
  * テナント識別子: `tenantId`（必須）
* **主な属性**

  * 氏名: `familyName`, `givenName`, `displayName?`
  * 所属組織: `orgKey`（参照キー）
  * 連絡先: `email?`（任意）
  * 在籍ステータス: `status`（ACTIVE/INACTIVE）
  * 補足: `remarks?`, `hiredAt?`, `terminatedAt?`
* **状態遷移**

  * ACTIVE → INACTIVE（無効化）
  * INACTIVE → ACTIVE（再有効化はMVP外）
* **不変条件**

  * employeeCode はテナント内一意
  * 物理削除は禁止（無効化のみ）

### Logical Data Model

* `employee` 単一テーブル
* 自然キー: (tenant_id, employee_code)
* 組織マスタ（org_key）への外部キー制約は設けない（参照キーのみ）

### Physical Data Model

**Table: employee**

| Column        | Type         | Constraints                | Notes           |
| ------------- | ------------ | -------------------------- | --------------- |
| id            | UUID         | PK, NOT NULL               | 技術的識別子          |
| tenant_id     | UUID         | NOT NULL, INDEX            | RLS用            |
| employee_code | VARCHAR(50)  | NOT NULL                   | テナント内一意         |
| family_name   | VARCHAR(100) | NOT NULL                   | 姓               |
| given_name    | VARCHAR(100) | NOT NULL                   | 名               |
| display_name  | VARCHAR(200) | NULL                       | 表示名（任意）         |
| org_key       | VARCHAR(100) | NOT NULL                   | 所属組織キー          |
| email         | VARCHAR(255) | NULL                       | 連絡先（任意）         |
| status        | VARCHAR(20)  | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE/INACTIVE |
| hired_at      | DATE         | NULL                       | 入社日             |
| terminated_at | DATE         | NULL                       | 無効化日            |
| remarks       | TEXT         | NULL                       | 備考              |
| created_at    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()    | 作成日時            |
| created_by    | VARCHAR(255) | NOT NULL                   | Clerk user_id   |
| updated_at    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()    | 更新日時            |
| updated_by    | VARCHAR(255) | NOT NULL                   | Clerk user_id   |

**Constraints**

* PRIMARY KEY: `id`
* UNIQUE: `(tenant_id, employee_code)`

**Indexes**

* `(tenant_id)`
* `(tenant_id, employee_code)`
* `(tenant_id, status)`
* `(tenant_id, org_key)`
* `(tenant_id, family_name, given_name)`

**RLS Policy（例）**

```sql
CREATE POLICY employee_tenant_isolation ON employee
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## Error Handling

### Error Strategy

* **User Errors (4xx)**: バリデーション、権限、リソース不存在
* **System Errors (5xx)**: 予期しない例外、DB障害
* **Business Logic Errors**: UIへはBFFで正規化し `contracts/bff/errors` に統一

### Error Categories and Responses（UI観点）

* 入力不備: `BFF_VALIDATION_ERROR`
* 権限不足: `BFF_FORBIDDEN`
* 不存在: `BFF_NOT_FOUND`
* 競合: `BFF_CONFLICT_ERROR`
* 予期しない: `BFF_INTERNAL_ERROR`

---

## Testing Strategy

### Unit Tests

* Repository: `findById`, `search`, `insert`, `update`, `inactivate`, `checkEmployeeCodeUnique`
* Service: `CreateEmployee`, `UpdateEmployee`, `InactivateEmployee`
* BFF: page/offset変換、DTO整形、エラー正規化

### Integration Tests

* UI → BFF → Domain API → Repo（主要フロー）
* 権限チェックの一貫性（UI/BFF/API）
* RLSによるテナント隔離

### E2E/UI Tests

* 社員一覧（デフォルト有効のみ／無効含む切替）
* 新規登録（正常／コード重複／必須不足）
* 編集（正常／コード重複）
* 無効化（反映／一覧非表示）
* 権限制御（参照のみは更新操作不可）

---

## Security Considerations

* 認証: Clerkトークンから tenant/user を解決
* 認可: `epm.user.read`, `epm.user.update` に基づく
* マルチテナント: RLS + where二重ガード
* 監査: create/update/inactivate を audit_log 記録

---

## Open Questions / Decision Tasks（確定事項）

### [D1] 社員コード（employee_code）の仕様

* 形式: 英数字・ハイフン・アンダースコア、最大50文字
* 採番: 完全手入力（自動採番はMVP外）
* 変更可否: 変更可能（変更時は一意性再検証）

### [D2] 必須項目

* 氏名: 姓/名分離（family_name, given_name 必須）、display_name 任意
* 所属組織: org_key 必須（未所属不可）
* 連絡先: email 任意

### [D3] 無効化社員の扱い（MVP）

* 無効社員の編集: MVPでは原則禁止（参照のみ）
* 再有効化: MVP外

---

## GO/NO-GO 判定

**判定: GO**

* requirements の全要件を設計要素へマッピング可能
* Mandatory（BFF/Service/Repo/Contracts）が埋まっている
* BFFエラー正規化により UI契約が安定し、v0/Cursor運用に適合
