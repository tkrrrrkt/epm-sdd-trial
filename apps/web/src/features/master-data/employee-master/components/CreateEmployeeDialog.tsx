"use client"

import { useState } from "react"
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
  Spinner,
} from "@/shared/ui"
import { AlertCircle } from "lucide-react"
import type { BffClient } from "../api/BffClient"
import type { CreateEmployeeMasterRequest, EmployeeMasterDetailResponse } from "@contracts/bff/employee-master"

interface CreateEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (employee: EmployeeMasterDetailResponse) => void
  bffClient: BffClient
}

export function CreateEmployeeDialog({ open, onOpenChange, onSuccess, bffClient }: CreateEmployeeDialogProps) {
  const [formData, setFormData] = useState<CreateEmployeeMasterRequest>({
    employeeCode: "",
    employeeName: "",
    organizationKey: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof CreateEmployeeMasterRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.employeeCode.trim()) {
      newErrors.employeeCode = "社員コードを入力してください"
    }

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = "社員名を入力してください"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const payload: CreateEmployeeMasterRequest = {
        employeeCode: formData.employeeCode.trim(),
        employeeName: formData.employeeName.trim(),
        organizationKey: formData.organizationKey?.trim() || null,
      }

      const newEmployee = await bffClient.create(payload)
      onSuccess(newEmployee)

      // Reset form
      setFormData({
        employeeCode: "",
        employeeName: "",
        organizationKey: "",
      })
      setErrors({})
    } catch (err) {
      if (err instanceof Error) {
        // Handle specific error codes
        if (err.message.includes("EMPLOYEE_CODE_DUPLICATE")) {
          setSubmitError("この社員コードは既に使用されています")
        } else if (err.message.includes("422")) {
          setSubmitError("入力内容に誤りがあります")
        } else {
          setSubmitError(err.message)
        }
      } else {
        setSubmitError("社員の作成に失敗しました")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      employeeCode: "",
      employeeName: "",
      organizationKey: "",
    })
    setErrors({})
    setSubmitError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規社員登録</DialogTitle>
          <DialogDescription>新しい社員情報を入力してください</DialogDescription>
        </DialogHeader>

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="create-employee-code">
              社員コード <span className="text-destructive">*</span>
            </Label>
            <Input
              id="create-employee-code"
              placeholder="EMP001"
              value={formData.employeeCode}
              onChange={(e) => handleChange("employeeCode", e.target.value)}
              className={errors.employeeCode ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.employeeCode && <p className="text-sm text-destructive">{errors.employeeCode}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-employee-name">
              社員名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="create-employee-name"
              placeholder="田中 太郎"
              value={formData.employeeName}
              onChange={(e) => handleChange("employeeName", e.target.value)}
              className={errors.employeeName ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.employeeName && <p className="text-sm text-destructive">{errors.employeeName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-organization-key">組織キー</Label>
            <Input
              id="create-organization-key"
              placeholder="SALES"
              value={formData.organizationKey || ""}
              onChange={(e) => handleChange("organizationKey", e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">任意項目です</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                作成中...
              </>
            ) : (
              "作成"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
