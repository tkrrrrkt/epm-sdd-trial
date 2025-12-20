# v0.dev の使い方 - EPM SaaS プロジェクト

## 🚀 今すぐ使える！v0 での UI 生成手順

### Step 1: プロンプトをコピー

`.kiro/steering/v0-prompt-template-enhanced.md` を開いて、
<feature-name> などの部分を埋める:

```markdown
## Feature
従業員マスタ CRUD

## Screens to build
* 従業員一覧: テーブル、検索、ページネーション
* 従業員登録: ダイアログフォーム
* 従業員編集: ダイアログフォーム

## BFF Endpoints (UI -> BFF)
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| GET | /api/bff/master-data/employees | EmployeeListRequest | EmployeeListResponse |
| POST | /api/bff/master-data/employees | EmployeeCreateRequest | EmployeeCreateResponse |

## Use Tier 1 components from @/shared/ui:
Button, Table, Card, Dialog, Input, Badge

## Output to:
apps/web/_v0_drop/master-data/employee-master/src
```

### Step 2: v0.dev で生成

1. https://v0.dev にアクセス
2. 上記プロンプトを貼り付け
3. "Generate" ボタンをクリック
4. 生成されたコードを確認

### Step 3: CLI で取得

生成完了後、v0 の URL をコピー (例: https://v0.dev/chat/abc123)

```bash
cd /Users/ktkrr/root/10_dev/epm-sdd-trial

# 取得
./scripts/v0-fetch.sh "https://v0.dev/chat/abc123" master-data/employee-master

# または完全ワークフロー
./scripts/v0-integrate.sh "https://v0.dev/chat/abc123" master-data/employee-master
```

### Step 4: 確認 & 統合

```bash
# OUTPUT.md を確認
cat apps/web/_v0_drop/master-data/employee-master/src/OUTPUT.md

# features へ移行
mv apps/web/_v0_drop/master-data/employee-master/src \
   apps/web/src/features/master-data/employee-master

# Route 登録
mkdir -p apps/web/src/app/master-data/employee-master
echo "import Page from '@/features/master-data/employee-master/page'; export default Page;" \
  > apps/web/src/app/master-data/employee-master/page.tsx
```

---

## 📝 v0 が生成するコード例

```typescript
// components/EmployeeList.tsx
import { Button, Table, Badge } from '@/shared/ui'

export function EmployeeList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">従業員一覧</h1>
        <Button className="bg-primary text-primary-foreground">
          新規登録
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>氏名</TableHead>
            <TableHead>ステータス</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>田中 太郎</TableCell>
            <TableCell>
              <Badge className="bg-success">在籍</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
```

**✅ ポイント:**
- `@/shared/ui` から import
- `bg-primary`, `bg-success` などの semantic tokens 使用
- EPM カラー (Deep Teal/Royal Indigo) 自動適用
- ダークモード対応

---

## ❓ よくある質問

### Q1: Registry URL は必要ないの？

**A:** 現時点では不要です。

理由:
- v0.dev には Registry URL を設定する UI が無い
- 代わりに**プロンプトに色とコンポーネントを明記**すれば OK
- v0 は shadcn/ui ベースなので、同じ構造なら理解できる

### Q2: "Open in v0" ボタンとは？

**A:** Registry から直接 v0 を開く機能ですが、**今は使わなくて OK**。

理由:
- Registry をローカルに再構築する必要がある
- プロンプトで指定する方が簡単
- 結果は同じ

### Q3: v0 が EPM カラーを使ってくれるか不安...

**A:** プロンプトに明記すれば確実に使います！

必ず含めるべき文言:
```
Use EPM Design System colors:
Primary: Deep Teal oklch(0.52 0.13 195)
Secondary: Royal Indigo oklch(0.48 0.15 280)

Use semantic tokens: bg-primary, text-secondary, border-error
NO raw color literals like bg-[#14b8a6]
```

---

## 🎯 まとめ

### ✅ 今すぐできること:

1. v0.dev を開く
2. プロンプトテンプレートをコピー
3. Feature 名を埋める
4. Generate!

### ✅ 設定不要:

- ❌ Registry URL の登録 (不要)
- ❌ v0.dev の設定画面 (存在しない)
- ❌ 認証トークン (不要)
- ❌ Open in v0 ボタン (任意)

### ✅ あるもの:

- ✅ プロンプトテンプレート (.kiro/steering/v0-prompt-template-enhanced.md)
- ✅ デザインシステム定義 (apps/web/src/shared/ui/README.md)
- ✅ 67個のコンポーネント (apps/web/src/shared/ui/components/)
- ✅ CLI スクリプト (scripts/v0-fetch.sh, v0-integrate.sh)

**今日から v0 で EPM SaaS の UI を生成できます！** 🎉
