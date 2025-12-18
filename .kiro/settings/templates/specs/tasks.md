# Implementation Plan

## 0. Design Completeness Gate（Blocking）

> Implementation MUST NOT start until all items below are checked.
> These checks are used to prevent “empty design sections” from being silently interpreted by implementers/AI.

- [ ] 0.1 Designの「BFF Specification（apps/bff）」が埋まっている
  - BFF endpoints（UIが叩く）が記載されている
  - Request/Response DTO（packages/contracts/src/bff）が列挙されている
  - 変換（api DTO → bff DTO）の方針が記載されている
  - エラー整形方針（contractsのerrorに準拠）が記載されている
  - tenant_id/user_id の取り回し（伝搬ルール）が記載されている

- [ ] 0.2 Designの「Service Specification（Domain / apps/api）」が埋まっている
  - Usecase（Create/Update/Inactivate等）が列挙されている
  - 主要ビジネスルールの所在（ここに置く／置かない）が記載されている
  - トランザクション境界が記載されている
  - 監査ログ記録ポイントが記載されている

- [ ] 0.3 Designの「Repository Specification（apps/api）」が埋まっている
  - 取得・更新メソッド一覧が記載されている（tenant_id必須）
  - where句二重ガードの方針が記載されている
  - RLS前提（set_config前提）が記載されている

- [ ] 0.4 Designの「Contracts Summary（This Feature）」が埋まっている
  - packages/contracts/src/bff 側の追加・変更DTOが列挙されている
  - packages/contracts/src/api 側の追加・変更DTOが列挙されている
  - 「UIは packages/contracts/src/api を参照しない」ルールが明記されている

- [ ] 0.5 Requirements Traceability（必要な場合）が更新されている
  - 主要Requirementが、BFF/API/Repo/Flows等の設計要素に紐づいている

- [ ] 0.6 v0生成物の受入・移植ルールが確認されている
  - v0生成物は必ず `apps/web/_v0_drop/<context>/<feature>/` に一次格納されている
  - v0出力はそのまま `apps/web/src` に配置されていない
  - UIは MockBffClient で動作確認されている（BFF未接続状態）
  - 移植時に以下を確認している
    - UIはBFFのみを呼び出している
    - `packages/contracts/src/api` をUIが参照していない
    - UIは `packages/contracts/src/bff` のみ参照している
    - 画面ロジックが Feature 配下に閉じている

- [ ] 0.7 Structure / Boundary Guard がパスしている
  - `npx tsx scripts/structure-guards.ts` が成功している
  - UI → Domain API の直接呼び出しが存在しない
  - UIでの直接 fetch() が存在しない
  - BFFがDBへ直接アクセスしていない

## 1. Scaffold / Structure Setup

- [ ] 1.0 Feature骨格生成（Scaffold）
  - 実行: `npx tsx scripts/scaffold-feature.ts <context> <feature>`
  - 例: `npx tsx scripts/scaffold-feature.ts master-data employee-master`
  - 目的: 正しい配置先を先に確定させる（v0混入防止）
  - 確認:
    - apps/web/src/features/<context>/<feature> が作成されている
    - apps/bff/src/modules/<context>/<feature> が作成されている
    - apps/api/src/modules/<context>/<feature> が作成されている
    - apps/web/_v0_drop/<context>/<feature> が作成されている

- [ ] 1.1 v0 UI生成（_v0_drop 一次格納）
  - v0プロンプトは design.md の Architecture Responsibilities を入力にしている

- [ ] 1.2 v0受入チェック & 移植
  - 移植: `npx tsx scripts/v0-migrate.ts <context> <feature>`
  - `npx tsx scripts/structure-guards.ts` が再実行されている

---

## Task Format Template

Use whichever pattern fits the work breakdown:

### Major task only
- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}} *(Include details only when needed. If the task stands alone, omit bullet items.)*
  - _Requirements: {{REQUIREMENT_IDS}}_

### Major + Sub-task structure
- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - _Requirements: {{REQUIREMENT_IDS}}_ *(IDs only; do not add descriptions or parentheses.)*

> **Parallel marker**: Append ` (P)` only to tasks that can be executed in parallel. Omit the marker when running in `--sequential` mode.
>
> **Optional test coverage**: When a sub-task is deferrable test work tied to acceptance criteria, mark the checkbox as `- [ ]*` and explain the referenced requirements in the detail bullets.
