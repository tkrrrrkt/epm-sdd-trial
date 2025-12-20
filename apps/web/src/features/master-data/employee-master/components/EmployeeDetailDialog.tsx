"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Spinner,
  Separator,
} from "@/shared/ui"
import { AlertCircle, Edit, Save, X, Ban, CheckCircle } from "lucide-react"
import type { BffClient } from "../api/BffClient"
import type { EmployeeMasterDetailResponse, UpdateEmployeeMasterRequest } from "@contracts/bff/employee-master"

interface EmployeeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  onClose: () => void
  onUpdateSuccess: () => void
  bffClient: BffClient
}

export function EmployeeDetailDialog({
  open,
  onOpenChange,
  employeeId,
  onClose,
  onUpdateSuccess,
  bffClient,
}: EmployeeDetailDialogProps) {
  const [employee, setEmployee] = useState<EmployeeMasterDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    employeeName: "",
    organizationKey: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load employee details
  useEffect(() => {
    if (open && employeeId) {
      loadEmployee()
    }
  }, [open, employeeId])

  const loadEmployee = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const data = await bffClient.findById(employeeId)
      setEmployee(data)
      setFormData({
        employeeName: data.employeeName,
        organizationKey: data.organizationKey || "",
      })
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("404")) {
          setLoadError("社員が見つかりませんでした")
        } else if (err.message.includes("403")) {
          setLoadError("この操作を実行する権限がありません")
        } else {
          setLoadError(err.message)
        }
      } else {
        setLoadError("社員情報の取得に失敗しました")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = "社員名を入力してください"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setSubmitError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setErrors({})
    setSubmitError(null)
    // Reset form to original values
    if (employee) {
      setFormData({
        employeeName: employee.employeeName,
        organizationKey: employee.organizationKey || "",
      })
    }
  }

  const handleUpdate = async () => {
    if (!validate()) return

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const payload: UpdateEmployeeMasterRequest = {
        employeeName: formData.employeeName.trim(),
        organizationKey: formData.organizationKey.trim() || null,
      }

      const updatedEmployee = await bffClient.update(employeeId, payload)
      setEmployee(updatedEmployee)
      setIsEditing(false)
      onUpdateSuccess()
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("404")) {
          setSubmitError("社員が見つかりませんでした")
        } else if (err.message.includes("403")) {
          setSubmitError("この操作を実行する権限がありません")
        } else if (err.message.includes("422")) {
          setSubmitError("入力内容に誤りがあります")
        } else {
          setSubmitError(err.message)
        }
      } else {
        setSubmitError("社員情報の更新に失敗しました")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm("この社員を無効化しますか？")) return

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const updatedEmployee = await bffClient.deactivate(employeeId)
      setEmployee(updatedEmployee)
      onUpdateSuccess()
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("EMPLOYEE_ALREADY_INACTIVE")) {
          setSubmitError("この社員は既に無効化されています")
        } else if (err.message.includes("404")) {
          setSubmitError("社員が見つかりませんでした")
        } else if (err.message.includes("403")) {
          setSubmitError("この操作を実行する権限がありません")
        } else {
          setSubmitError(err.message)
        }
      } else {
        setSubmitError("社員の無効化に失敗しました")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReactivate = async () => {
    if (!confirm("この社員を再有効化しますか？")) return

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const updatedEmployee = await bffClient.reactivate(employeeId)
      setEmployee(updatedEmployee)
      onUpdateSuccess()
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("EMPLOYEE_ALREADY_ACTIVE")) {
          setSubmitError("この社員は既に有効化されています")
        } else if (err.message.includes("404")) {
          setSubmitError("社員が見つかりませんでした")
        } else if (err.message.includes("403")) {
          setSubmitError("この操作を実行する権限がありません")
        } else {
          setSubmitError(err.message)
        }
      } else {
        setSubmitError("社員の再有効化に失敗しました")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>社員詳細</DialogTitle>
          <DialogDescription>社員情報の詳細表示と編集</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
            <span className="ml-2 text-muted-foreground">読み込み中...</span>
          </div>
        ) : loadError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : employee ? (
          <>
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">社員コード</Label>
                  <p className="font-mono text-base">{employee.employeeCode}</p>
                  <p className="text-xs text-muted-foreground">※作成後に変更できません</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">ステータス</Label>
                  <div>
                    {employee.isActive ? (
                      <Badge variant="default" className="bg-primary">
                        有効
                      </Badge>
                    ) : (
                      <Badge variant="secondary">無効</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-employee-name">
                      社員名 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-employee-name"
                      value={formData.employeeName}
                      onChange={(e) => handleChange("employeeName", e.target.value)}
                      className={errors.employeeName ? "border-destructive" : ""}
                      disabled={isSubmitting}
                    />
                    {errors.employeeName && <p className="text-sm text-destructive">{errors.employeeName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-organization-key">組織キー</Label>
                    <Input
                      id="edit-organization-key"
                      value={formData.organizationKey}
                      onChange={(e) => handleChange("organizationKey", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">社員名</Label>
                    <p className="text-base">{employee.employeeName}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">組織キー</Label>
                    <p className="text-base">
                      {employee.organizationKey || <span className="text-muted-foreground">未設定</span>}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">作成日時</Label>
                  <p>{formatDate(employee.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">作成者</Label>
                  <p>{employee.createdBy}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">更新日時</Label>
                  <p>{formatDate(employee.updatedAt)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">更新者</Label>
                  <p>{employee.updatedBy}</p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between">
              <div className="flex gap-2">
                {employee.isActive ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeactivate}
                    disabled={isSubmitting || isEditing}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    無効化
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={handleReactivate} disabled={isSubmitting || isEditing}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    再有効化
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                      <X className="h-4 w-4 mr-2" />
                      キャンセル
                    </Button>
                    <Button onClick={handleUpdate} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          更新中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          更新
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={onClose}>
                      閉じる
                    </Button>
                    <Button onClick={handleEditClick}>
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
