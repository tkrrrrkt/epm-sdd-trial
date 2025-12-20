"use client"

import { useState } from "react"
import { Button, Card, CardContent, Input, Label, Switch } from "@/shared/ui"
import { Search, Plus } from "lucide-react"
import type { ListEmployeeMasterRequest } from "@contracts/bff/employee-master"

interface EmployeeSearchPanelProps {
  onSearch: (params: Partial<ListEmployeeMasterRequest>) => void
  onCreateClick: () => void
  includeInactive: boolean
}

export function EmployeeSearchPanel({ onSearch, onCreateClick, includeInactive }: EmployeeSearchPanelProps) {
  const [employeeCode, setEmployeeCode] = useState("")
  const [employeeName, setEmployeeName] = useState("")
  const [localIncludeInactive, setLocalIncludeInactive] = useState(includeInactive)

  const handleSearch = () => {
    onSearch({
      employeeCode: employeeCode || undefined,
      employeeName: employeeName || undefined,
      includeInactive: localIncludeInactive,
    })
  }

  const handleReset = () => {
    setEmployeeCode("")
    setEmployeeName("")
    setLocalIncludeInactive(false)
    onSearch({
      employeeCode: undefined,
      employeeName: undefined,
      includeInactive: false,
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search-employee-code">社員コード</Label>
            <Input
              id="search-employee-code"
              placeholder="EMP001"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
            />
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="search-employee-name">社員名</Label>
            <Input
              id="search-employee-name"
              placeholder="田中 太郎"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="include-inactive" checked={localIncludeInactive} onCheckedChange={setLocalIncludeInactive} />
            <Label htmlFor="include-inactive" className="cursor-pointer">
              無効な社員を含む
            </Label>
          </div>

          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            検索
          </Button>

          <Button onClick={handleReset} variant="outline">
            リセット
          </Button>

          <Button onClick={onCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            新規登録
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
