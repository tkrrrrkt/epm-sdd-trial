"use client"

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui"
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react"
import type { EmployeeMasterListItem } from "@contracts/bff/employee-master"

interface EmployeeListProps {
  employees: EmployeeMasterListItem[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    totalCount: number
  }
  sorting: {
    sortBy: "employeeCode" | "employeeName"
    sortOrder: "asc" | "desc"
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSort: (sortBy: "employeeCode" | "employeeName", sortOrder: "asc" | "desc") => void
  onRowClick: (employeeId: string) => void
}

export function EmployeeList({
  employees,
  isLoading,
  error,
  pagination,
  sorting,
  onPageChange,
  onPageSizeChange,
  onSort,
  onRowClick,
}: EmployeeListProps) {
  const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize)
  const startIndex = (pagination.page - 1) * pagination.pageSize + 1
  const endIndex = Math.min(pagination.page * pagination.pageSize, pagination.totalCount)

  const handleSortClick = (column: "employeeCode" | "employeeName") => {
    if (sorting.sortBy === column) {
      // Toggle order
      onSort(column, sorting.sortOrder === "asc" ? "desc" : "asc")
    } else {
      // New column, default to asc
      onSort(column, "asc")
    }
  }

  const renderSortIcon = (column: "employeeCode" | "employeeName") => {
    if (sorting.sortBy !== column) return null
    return sorting.sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 inline ml-1" />
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
        <span className="ml-2 text-muted-foreground">読み込み中...</span>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">社員が見つかりませんでした</p>
        <p className="text-sm text-muted-foreground mt-1">検索条件を変更するか、新しい社員を登録してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSortClick("employeeCode")}>
                社員コード {renderSortIcon("employeeCode")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSortClick("employeeName")}>
                社員名 {renderSortIcon("employeeName")}
              </TableHead>
              <TableHead>組織キー</TableHead>
              <TableHead>ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow
                key={employee.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick(employee.id)}
              >
                <TableCell className="font-mono">{employee.employeeCode}</TableCell>
                <TableCell className="font-medium">{employee.employeeName}</TableCell>
                <TableCell>
                  {employee.organizationKey ? (
                    <span className="text-sm">{employee.organizationKey}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">未設定</span>
                  )}
                </TableCell>
                <TableCell>
                  {employee.isActive ? (
                    <Badge variant="default" className="bg-primary">
                      有効
                    </Badge>
                  ) : (
                    <Badge variant="secondary">無効</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {startIndex} - {endIndex} / {pagination.totalCount}件
          </span>
          <span>|</span>
          <span>ページサイズ:</span>
          <Select value={pagination.pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            前へ
          </Button>
          <span className="text-sm">
            ページ {pagination.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
          >
            次へ
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
