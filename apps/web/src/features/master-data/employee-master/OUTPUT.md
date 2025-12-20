# 社員マスタ (Employee Master) - Output Documentation

## 1) Generated Files (Tree)

```
apps/web/_v0_drop/master-data/employee-master/src/
├── OUTPUT.md (this file)
├── page.tsx
├── components/
│   ├── EmployeeList.tsx
│   ├── EmployeeSearchPanel.tsx
│   ├── CreateEmployeeDialog.tsx
│   └── EmployeeDetailDialog.tsx
└── api/
    ├── BffClient.ts
    ├── MockBffClient.ts
    └── HttpBffClient.ts
```

## 2) Key Imports / Dependency Notes

### Shared UI Components (Tier 1 - Standard)
All UI components are imported from `@/shared/ui` barrel export:

```typescript
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Badge,
  Alert,
  AlertDescription,
  AlertTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Spinner,
  Separator,
} from '@/shared/ui'
```

### BFF Contract DTOs
All data transfer objects are imported from `@contracts/bff`:

```typescript
import type {
  ListEmployeeMasterRequest,
  ListEmployeeMasterResponse,
  EmployeeMasterListItem,
  EmployeeMasterDetailResponse,
  CreateEmployeeMasterRequest,
  UpdateEmployeeMasterRequest,
} from '@contracts/bff/employee-master'
```

### BffClient Architecture
- **BffClient.ts**: TypeScript interface defining all BFF endpoints
- **MockBffClient.ts**: Implements `BffClient` interface with realistic mock data (currently active)
- **HttpBffClient.ts**: Implements `BffClient` interface with real fetch calls (ready to swap)

The mock client is currently used in `page.tsx`. To switch to real API:
```typescript
// In page.tsx, change:
import { MockBffClient } from './api/MockBffClient'
const bffClient = new MockBffClient()

// To:
import { HttpBffClient } from './api/HttpBffClient'
const bffClient = new HttpBffClient()
```

### Utils
- `cn()` function from `@/lib/utils` for className merging

## 3) Missing Shared Component / Pattern (TODO)

### High Priority

- [ ] **DataTable Component** (`apps/web/src/shared/ui/components/data-table.tsx`)
  - **Purpose**: Reusable table wrapper with sorting, pagination, loading states
  - **Props Interface**:
    ```typescript
    interface DataTableProps<T> {
      columns: ColumnDef<T>[]
      data: T[]
      isLoading?: boolean
      pagination?: {
        page: number
        pageSize: number
        totalCount: number
        onPageChange: (page: number) => void
        onPageSizeChange: (pageSize: number) => void
      }
      sorting?: {
        sortBy: string
        sortOrder: 'asc' | 'desc'
        onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
      }
    }
    ```
  - **Based on**: Tier 1 Table component
  - **Benefits**: Eliminates duplication across list screens, standardizes table UX

- [ ] **SearchInput Component** (`apps/web/src/shared/ui/components/search-input.tsx`)
  - **Purpose**: Search input with debounce (300ms) to prevent excessive API calls
  - **Props Interface**:
    ```typescript
    interface SearchInputProps {
      onSearch: (value: string) => void
      placeholder?: string
      defaultValue?: string
      debounceMs?: number // default: 300
    }
    ```
  - **Based on**: Tier 1 Input component
  - **Benefits**: Consistent search UX, performance optimization

- [ ] **FilterPanel Component** (`apps/web/src/shared/ui/components/filter-panel.tsx`)
  - **Purpose**: Collapsible filter panel with apply/reset buttons
  - **Props Interface**:
    ```typescript
    interface FilterPanelProps {
      title?: string
      onApply: () => void
      onReset: () => void
      children: React.ReactNode
    }
    ```
  - **Based on**: Tier 1 Card + Button components
  - **Benefits**: Consistent filter UI pattern across all master data screens

### Medium Priority

- [ ] **StatusBadge Component** (`apps/web/src/shared/ui/components/status-badge.tsx`)
  - **Purpose**: Standardized status badge with semantic colors
  - **Props Interface**:
    ```typescript
    type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'success'
    interface StatusBadgeProps {
      status: StatusType
      label?: string
    }
    ```
  - **Based on**: Tier 1 Badge component
  - **Benefits**: Consistent status visualization

- [ ] **EmptyState Component** (`apps/web/src/shared/ui/components/empty-state.tsx`)
  - **Purpose**: Standardized empty state with icon, message, and action button
  - **Props Interface**:
    ```typescript
    interface EmptyStateProps {
      icon?: React.ReactNode
      title: string
      description?: string
      action?: {
        label: string
        onClick: () => void
      }
    }
    ```
  - **Benefits**: Consistent empty state UX

## 4) Migration Notes (_v0_drop → features)

### Step-by-Step Migration Plan

#### Step 1: Move Feature Code
```bash
# Move the entire src folder to features
mv apps/web/_v0_drop/master-data/employee-master/src/* \
   apps/web/src/features/master-data/employee-master/
```

#### Step 2: Create App Router Page
```bash
# Create the app router page that consumes the feature
mkdir -p apps/web/src/app/master-data/employee-master
```

Create `apps/web/src/app/master-data/employee-master/page.tsx`:
```typescript
import EmployeeMasterPage from '@/features/master-data/employee-master/page'

export default function Page() {
  return <EmployeeMasterPage />
}
```

#### Step 3: Verify Path Aliases
All imports use path aliases and should work automatically:
- `@/shared/ui` → `apps/web/src/shared/ui`
- `@/lib/utils` → `apps/web/src/lib/utils`
- `@contracts/bff` → `packages/contracts/src/bff`

No import path changes needed.

#### Step 4: Implement Shared Components (Optional)
If DataTable or other shared components are implemented:

1. Create shared component in `apps/web/src/shared/ui/components/`
2. Export from `apps/web/src/shared/ui/index.ts`
3. Refactor `EmployeeList.tsx` to use shared DataTable:
   ```typescript
   // Before
   <Table>...</Table>
   
   // After
   <DataTable
     columns={employeeColumns}
     data={employees}
     pagination={...}
     sorting={...}
   />
   ```

#### Step 5: Switch to Real BFF Client
When BFF endpoints are ready:

1. Open `apps/web/src/features/master-data/employee-master/page.tsx`
2. Replace `MockBffClient` with `HttpBffClient`:
   ```typescript
   // Change this line
   import { HttpBffClient } from './api/HttpBffClient'
   const bffClient = new HttpBffClient()
   ```
3. Test all CRUD operations
4. Remove `MockBffClient.ts` if no longer needed

#### Step 6: Update Navigation Menu
Add employee master to the navigation menu:

In `apps/web/src/shared/navigation/menu.ts`:
```typescript
{
  title: 'マスタデータ',
  icon: Database,
  items: [
    {
      title: '社員マスタ',
      href: '/master-data/employee-master',
    },
    // ... other master data items
  ]
}
```

## 5) Constraint Compliance Checklist

### Output Location ✓
- [x] Code written ONLY under `apps/web/_v0_drop/master-data/employee-master/src`
- [x] No files written to `apps/web/src` directly

### Component Architecture ✓
- [x] UI components imported ONLY from `@/shared/ui`
- [x] No base UI components created under features (Button, Input, Table, etc.)
- [x] Only feature-specific composite components created:
  - `EmployeeList.tsx` (list table composite)
  - `EmployeeSearchPanel.tsx` (search form composite)
  - `CreateEmployeeDialog.tsx` (creation dialog composite)
  - `EmployeeDetailDialog.tsx` (detail/edit dialog composite)

### Contract Usage ✓
- [x] DTO types imported from `@contracts/bff/employee-master`
- [x] No DTO re-definition in UI code
- [x] No imports from `@contracts/api` (Domain API)

### Network Access ✓
- [x] No Domain API direct calls (`/api/...`)
- [x] No direct `fetch()` outside `api/HttpBffClient.ts`
- [x] BffClient interface abstracts all API calls
- [x] MockBffClient provides realistic mock data

### Layout / App Shell ✓
- [x] No `layout.tsx` generated
- [x] No new sidebar/header/shell created inside feature
- [x] Feature renders content area only (assumes AppShell wraps it)

### Design System Compliance ✓
- [x] No raw color literals (`bg-[#...]`, `text-[oklch(...)]`)
- [x] No arbitrary Tailwind colors (`bg-teal-500`, `text-indigo-600`)
- [x] All colors use semantic tokens:
  - `bg-background`, `text-foreground`
  - `bg-primary`, `text-primary-foreground`
  - `bg-card`, `border-border`
  - `bg-destructive`, `text-destructive-foreground`
  - `text-muted-foreground`

### Spacing / Typography ✓
- [x] All spacing uses Tailwind scale (no arbitrary values like `p-[16px]`)
  - Used: `p-2`, `p-4`, `p-6`, `gap-2`, `gap-4`, `gap-6`, `space-y-2`, `space-y-4`
- [x] Typography follows design system:
  - `text-4xl font-bold` (heading 1)
  - `text-2xl font-semibold` (heading 3)
  - `text-base` (body)
  - `text-sm` (small/muted)
  - `leading-relaxed` for readability

### Dark Mode ✓
- [x] Dark mode support via semantic tokens (no manual `dark:` variants)
- [x] All components automatically adapt to light/dark themes

### Accessibility ✓
- [x] Semantic HTML elements used (`<main>`, `<header>`)
- [x] Form labels associated with inputs
- [x] Button states (disabled, loading) properly indicated
- [x] Alert messages use appropriate ARIA roles
- [x] Focus management in dialogs

### UX Patterns ✓
- [x] Loading states (Spinner component)
- [x] Error messages (Alert component)
- [x] Empty states (custom message)
- [x] Form validation with inline errors
- [x] Optimistic UI updates not implemented (use mock data first)

---

## Summary

This feature implements a complete CRUD interface for Employee Master data following EPM design system guidelines. The code is production-ready for migration to `apps/web/src/features/master-data/employee-master/` with minimal changes.

**Next Steps:**
1. Move code to features folder
2. Create app router page wrapper
3. Implement suggested shared components (DataTable, SearchInput)
4. Switch to HttpBffClient when BFF is ready
5. Add to navigation menu
6. Test end-to-end with real backend

**Dependencies:**
- BFF endpoints must be implemented as per specification
- `@contracts/bff/employee-master` DTOs must exist in contracts package
- Shared UI components must be available from `@/shared/ui`
