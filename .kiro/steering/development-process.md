# SDD（Specification-Driven Development）

## 全体工程とドキュメント体系（EPMSaaS / CCSDD版）

本ドキュメントは、購買管理SaaS開発における 
本ドキュメントは、EPM（予算実績管理・FP&A）SaaSのTrial開発において  **CCSDD（Cursor + Kiro + v0 を前提とした Specification-Driven Development）** を活用して
CCSDD（Cursor + Kiro + v0）を用いたSpecification-Driven Developmentを適用するための  
プロジェクト共通の開発憲法である。

本ファイルは **プロジェクト全体の「開発憲法」** に位置づけられ、  
すべての Feature 開発・AI実装・レビューは、本定義に従う。

---

## 1. 全体工程一覧（STEPサマリ）

|No.|工程名|主な目的|主なINPUT|何で作るか / ツール|主なOUTPUT（ドキュメント）|従来ドキュメントでいうと|備考|
|---|---|---|---|---|---|---|---|
|0|プロジェクトルール・ドメイン定義|全体の共通前提・用語・設計ルールを確定|事業戦略、業務知識、既存仕様|手作業＋AI補助|`.kiro/steering/product.md`<br>`.kiro/steering/tech.md`<br>`.kiro/steering/structure.md`<br>`.kiro/steering/glossary.md`<br>`.kiro/steering/cross-domain-contracts.md`<br>`.kiro/steering/adr/ADR-001.md`<br>`.kiro/specs/domain/*.md`（最低1本）|全体設計方針書、共通設計標準|すべてのSTEPの前提条件（憲法）|
|1|要求仕様定義|何を実現するか（振る舞い・受入条件）を明確化|ビジネス要求、業務フロー、帳票、STEP0の成果物|cc-sdd / Kiro|`.kiro/specs/<context>/<feature>/requirements.md`|要件定義書|EARS + Given/When/Then|
|2|機能・技術設計|構造・API・データ契約を確定|requirements.md / domain / ADR|cc-sdd / Kiro|`.kiro/specs/<context>/<feature>/design.md`|基本設計（内部）|UIより先にContractを確定|
|3|UI実装・v0生成|Contractに基づくUI生成|design.md|Cursor + v0|`v0.md` / `ui-*.md`|画面設計書|Schema-First原則|
|4|タスク分解|実装作業への分解|design.md|Kiro|`.kiro/specs/<context>/<feature>/tasks.md`|WBS|AI実装の単位|
|5|実装|コード・テスト作成|tasks.md / design.md|Cursor / AI|ソースコード、テスト|実装|Spec準拠が必須|
|6|テスト・リリース|要件通り動作確認|requirements.md|CI / E2E|テスト結果|結合・総合テスト|GWT活用|
|7|継続更新|学びを仕様へ反映|運用結果|手作業＋AI|各md更新|保守設計|DocがSSoT|

---

## 2. STEP別 詳細定義

### STEP0：プロジェクトルール・ドメイン定義

**目的**

- プロジェクト全体の共通前提・用語・設計ルールを確定し、すべてのFeature開発の基盤を整える
- AIと人間が同一の意味で仕様を解釈できる共通言語を確立する
- 技術方針・アーキテクチャ判断を文書化し、一貫性を保つ

**OUTPUT**

- `.kiro/steering/product.md` - プロダクトビジョン・対象ユーザー・提供価値・MVP範囲
- `.kiro/steering/tech.md` - 技術スタック・セキュリティ・マルチテナント・金額Decimal・非同期処理・テスト戦略
- `.kiro/steering/structure.md` - コンテキスト分割・ディレクトリ構造・命名規約・層構造
- `.kiro/steering/glossary.md` - 業務用語集（MVP対象領域の用語定義）
- `.kiro/steering/cross-domain-contracts.md` - 全ドメイン共通の不変条件（tenant_id、RLS、Repository、監査ログ等）
- `.kiro/steering/adr/ADR-001.md` - 重要なアーキテクチャ判断記録（最低限1本）
- `.kiro/specs/domain/*.md` - ドメイン仕様（最低限1本、MVP対象のCore Domain）

**Definition of Done（完了基準）**

STEP0は、STEP1以降のFeature開発を開始するための**必須前提条件**を整える工程である。  
以下の基準を満たした時点で、STEP0は完了とみなす。

**必須完成項目（STEP1以降への引き渡しに必要）**

- [ ] `.kiro/steering/product.md` - プロダクトビジョン・MVP範囲が明確化されている
- [ ] `.kiro/steering/tech.md` - 技術スタック・アーキテクチャ方針・セキュリティポリシーが確定している
- [ ] `.kiro/steering/structure.md` - コンテキスト分割・ディレクトリ構造・命名規約が定義されている
- [ ] `.kiro/steering/glossary.md` - MVP対象領域（Procurement Core Domain、Cross-Domain共通概念）の用語定義が完了している
- [ ] `.kiro/steering/cross-domain-contracts.md` - 全ドメイン共通の不変条件（tenant_id、RLS、Repository、監査ログ、金額Decimal等）が定義されている
- [ ] `.kiro/steering/adr/ADR-001.md` - 最低限1本のADRが記録されている（マルチテナント方針、RLS採用等の重要判断）
- [ ] `.kiro/specs/domain/*.md` - 最低限1本のドメイン仕様が完成している（MVP対象のCore Domain、例：`procurement-core.md`）

**未完成でも可（必要に応じて段階的に拡張）**

- `.kiro/steering/glossary.md` - MVP対象外のDomain用語（Master Data Domain拡張領域、Finance Domain、Integration Domain等）は、該当Feature開発時に追加
- `.kiro/specs/standards/*.md` - 共通規約（命名規約詳細、API設計標準等）は、必要に応じて段階的に作成
- `.kiro/steering/adr/ADR-002.md` 以降 - 追加のADRは、重要な判断が発生した時点で随時作成

**引き渡し条件（STEP1以降への移行基準）**

STEP0が完了し、STEP1以降のFeature開発に移行できる条件は以下である：

> **「STEP0の必須完成項目がすべて揃い、AIと人間が同一の前提でFeature仕様を作成・実装できる状態になっていること」**

具体的には、STEP1の`requirements.md`作成時に、STEP0の成果物（product.md、tech.md、structure.md、glossary.md、cross-domain-contracts.md、ADR-001、domain core spec）を参照して一貫性のある仕様を記述できる状態を指す。

---

### STEP1：要求仕様定義（requirements.md）

**目的**

- ビジネス要求を、AIと人が誤解なく理解できる形に落とす
    

**OUTPUT**

- `.kiro/specs/<context>/<feature>/requirements.md`
    

**主な構成**

- Context / Scope
- EARS形式 要件
- Given / When / Then（受入条件）
- ビジネスルール
- 非機能要件（性能・監査・セキュリティ等）

**引き渡し条件（STEP2への移行基準）**

> **「requirements.mdが完成し、ビジネス要求がEARS形式とGWT形式で明確化され、AIと人間が同一の理解で設計に進める状態になっていること」**

---

### STEP2：機能・データ設計（design.md）

**目的**

- UI生成前に、API・データ構造・ロジックの「契約」を確定する
    

**OUTPUT**

- `.kiro/specs/<context>/<feature>/design.md`
    

**主な構成**

- Architecture Overview
    
- Data Contracts（TypeScript Interface）
    
- API仕様
    
- 状態遷移・業務ロジック
    
- ER図（Mermaid可）
    
- テスト観点
    

**重要原則**

- design.md に定義された型・APIが **唯一の契約（SSoT）**
- UI都合でのデータ構造変更は禁止（必ずSTEP2に戻る）

**引き渡し条件（STEP3への移行基準）**

> **「design.mdが完成し、API・データ構造・状態遷移が確定し、packages/contractsに型定義が反映され、UI生成に必要な契約が揃っていること」**

---

### STEP3：UI実装・v0生成

**目的**

- 確定した Contract を v0 に正確に伝え、型安全なUIを生成する
    

**OUTPUT**

- `v0.md` / `ui-<screen>.md`
    
- 型安全なUIコンポーネント
    

**ルール**

- UIは表示・入力・バリデーションまで
- ビジネスロジックは実装しない
- API契約は design.md に完全準拠

**引き渡し条件（STEP4への移行基準）**

> **「UIが生成され、design.mdの契約に準拠していることが確認され、実装タスクに分解できる状態になっていること」**

---

### STEP4：タスク分解（tasks.md）

**目的**

- 実装作業をAIと人が実行可能な単位に分解
    

**OUTPUT**

- `.kiro/specs/<context>/<feature>/tasks.md`
    

**記載内容**

- タスクID
- 対応要件ID
- 対象ファイル / モジュール
- 完了条件

**引き渡し条件（STEP5への移行基準）**

> **「tasks.mdが完成し、実装可能な粒度に分解され、依存関係が明確になっていること」**

---

### STEP5：実装（Implementation）

**目的**

- 仕様に従い、コードとテストを実装
    

**原則**

- Specに書いていない実装は禁止
- 金額・数量は Decimal / ValueObject
- Prismaは Repository 経由のみ

**引き渡し条件（STEP6への移行基準）**

> **「tasks.mdの全タスクが完了し、コードが実装され、単体テストが通過していること」**

---

### STEP6：テスト・リリース

**目的**

- 仕様通りに動作することを保証
    

**観点**

- 単体 / 結合 / E2E
- Given / When / Then ベース

**引き渡し条件（STEP7への移行基準）**

> **「requirements.mdの受入条件（GWT）がすべて満たされ、リリース可能な品質に達していること」**

---

## 3. 従来ドキュメントとの対応表

|従来成果物|SDD成果物|STEP|
|---|---|---|
|要件定義書|requirements.md|STEP1|
|基本設計（外部）|requirements.md + ui-*.md|STEP1,3|
|基本設計（内部）|design.md|STEP2|
|詳細設計|design.md + tasks.md|STEP2,4|
|データ定義書|domain/*.md|STEP0|
|共通設計標準|standards/*.md|STEP0|
|アーキ判断|steering/adr/*.md|STEP0〜|

---

## 4. ルールファイル体系（SSoT）

|パス|役割|
|---|---|
|`.kiro/steering/product.md`|プロダクト定義|
|`.kiro/steering/tech.md`|技術方針|
|`.kiro/steering/structure.md`|構造定義|
|`.kiro/steering/v0-workflow.md`|v0運用|
|`.kiro/steering/development-process.md`|★本ファイル|
|`.kiro/steering/adr/ADR-*.md`|意思決定記録|
|`.kiro/specs/domain/*.md`|ドメイン定義|
|`.kiro/specs/standards/*.md`|共通規約|
|`.kiro/specs/<context>/<feature>/`|機能仕様|
|`.cursor/rules/*.mdc`|★AI実装制約（CursorルールのSSoT）|

**重要：Cursorルールの置き場**

- **SSoT**: `.cursor/rules/*.mdc` が唯一の正（ルールファイルの置き場）
- **旧形式**: `.cursorrules`（ルート直下の単一ファイル）は使用しない
- **理由**: チームで分割管理しやすく、複数ファイルに分けて整理できるため
- **運用**: ルールは `.cursor/rules/` 配下に `.mdc` 拡張子で配置し、必要に応じて複数ファイルに分割可能

---

## 5. 日常的にAIへ渡す最小コンテキストセット

AI（Cursor / cc-sdd）にコード生成・仕様作成・実装を依頼する際は、**必ず以下のコンテキストセットを参照させる**ことで、  
一貫性のある出力を保証する。

### 5.1 基本コンテキストセット（全Feature共通）

すべてのAI依頼時に、以下のファイルをコンテキストとして含める：

1. **`.kiro/steering/product.md`** - プロダクトビジョン・対象ユーザー・MVP範囲
2. **`.kiro/steering/tech.md`** - 技術スタック・アーキテクチャ方針・セキュリティポリシー
3. **`.kiro/steering/structure.md`** - コンテキスト分割・ディレクトリ構造・命名規約
4. **`.kiro/steering/glossary.md`** - 業務用語集（用語の正式名称・定義）
5. **`.kiro/steering/cross-domain-contracts.md`** - 全ドメイン共通の不変条件（tenant_id、RLS、Repository、監査ログ等）

### 5.2 Feature固有コンテキスト（対象Featureがある場合）

特定のFeatureを実装・設計する場合は、上記基本セットに加えて以下を含める：

6. **`.kiro/specs/domain/<domain-name>.md`** - 対象Domainの仕様（例：`procurement-core.md`）
7. **`.kiro/specs/<context>/<feature>/requirements.md`** - 対象Featureの要求仕様（存在する場合）
8. **`.kiro/specs/<context>/<feature>/design.md`** - 対象Featureの設計仕様（存在する場合）

### 5.3 関連ADR（必要に応じて）

重要なアーキテクチャ判断が関係する場合は、関連ADRも含める：

9. **`.kiro/steering/adr/ADR-*.md`** - 関連するADR（例：マルチテナント方針、RLS採用等）

### 5.4 運用ルール

- **Cursorでの利用**: `.cursor/rules/*.mdc` に上記コンテキストへの参照を記載し、AIが自動的に読み込むようにする
- **手動指定**: 明示的にAI依頼する際は、上記ファイルパスを明示する
- **段階的拡張**: 新規Feature開発時は、まず基本コンテキストセットで開始し、必要に応じてFeature固有コンテキストを追加する

### 5.5 コンテキストセットの目的

この最小コンテキストセットにより、以下を保証する：

- **用語の一貫性**: Glossaryで定義された用語を正として使用する
- **技術方針の遵守**: tech.mdで定義された方針（Decimal使用、Repository経由、RLS必須等）に従う
- **構造の整合性**: structure.mdで定義されたディレクトリ構造・命名規約に従う
- **不変条件の遵守**: cross-domain-contracts.mdで定義された不変条件を破らない

---

## 6. 運用上の最重要原則

- **仕様がSSoT、コードは従属物**
- Specを変えずにコードを変えない
- 判断はADRに残す
- AIは「速くする道具」、決定権は人間

---

## 7. STEP0 Definition of Done チェックリスト（再掲）

STEP0は、STEP1以降のFeature開発を開始するための**必須前提条件**を整える工程である。  
以下のチェックリストをすべて満たした時点で、STEP0は完了とみなす。

### 必須完成項目（STEP1以降への引き渡しに必要）

- [ ] `.kiro/steering/product.md` - プロダクトビジョン・MVP範囲が明確化されている
- [ ] `.kiro/steering/tech.md` - 技術スタック・アーキテクチャ方針・セキュリティポリシーが確定している
- [ ] `.kiro/steering/structure.md` - コンテキスト分割・ディレクトリ構造・命名規約が定義されている
- [ ] `.kiro/steering/glossary.md` - MVP対象領域（Procurement Core Domain、Cross-Domain共通概念）の用語定義が完了している
- [ ] `.kiro/steering/cross-domain-contracts.md` - 全ドメイン共通の不変条件（tenant_id、RLS、Repository、監査ログ、金額Decimal等）が定義されている
- [ ] `.kiro/steering/adr/ADR-001.md` - 最低限1本のADRが記録されている（マルチテナント方針、RLS採用等の重要判断）
- [ ] `.kiro/specs/domain/*.md` - 最低限1本のドメイン仕様が完成している（MVP対象のCore Domain、例：`procurement-core.md`）

### 未完成でも可（必要に応じて段階的に拡張）

- `.kiro/steering/glossary.md` - MVP対象外のDomain用語（Master Data Domain拡張領域、Finance Domain、Integration Domain等）は、該当Feature開発時に追加
- `.kiro/specs/standards/*.md` - 共通規約（命名規約詳細、API設計標準等）は、必要に応じて段階的に作成
- `.kiro/steering/adr/ADR-002.md` 以降 - 追加のADRは、重要な判断が発生した時点で随時作成

### 引き渡し条件（STEP1以降への移行基準）

> **「STEP0の必須完成項目がすべて揃い、AIと人間が同一の前提でFeature仕様を作成・実装できる状態になっていること」**

具体的には、STEP1の`requirements.md`作成時に、STEP0の成果物（product.md、tech.md、structure.md、glossary.md、cross-domain-contracts.md、ADR-001、domain core spec）を参照して一貫性のある仕様を記述できる状態を指す。

## 8. cc-sddの活用、SDD開発方法論の理論的背景
本方法論の理論的背景は .kiro/notes/SDD-CCSDD統合版.md を参照