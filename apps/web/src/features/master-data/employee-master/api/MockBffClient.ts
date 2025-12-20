import type { BffClient } from "./BffClient"
import type {
  ListEmployeeMasterRequest,
  ListEmployeeMasterResponse,
  EmployeeMasterDetailResponse,
  CreateEmployeeMasterRequest,
  UpdateEmployeeMasterRequest,
} from "@contracts/bff/employee-master"

/**
 * Mock BFF Client
 *
 * Provides realistic mock data for development and testing.
 * Simulates all BFF operations including validation errors.
 */
export class MockBffClient implements BffClient {
  private employees: EmployeeMasterDetailResponse[] = [
    {
      id: "1",
      employeeCode: "EMP001",
      employeeName: "田中 太郎",
      organizationKey: "SALES",
      isActive: true,
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T09:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "2",
      employeeCode: "EMP002",
      employeeName: "佐藤 花子",
      organizationKey: "ENGINEERING",
      isActive: true,
      createdAt: "2024-01-16T10:30:00Z",
      updatedAt: "2024-01-16T10:30:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "3",
      employeeCode: "EMP003",
      employeeName: "鈴木 一郎",
      organizationKey: "FINANCE",
      isActive: true,
      createdAt: "2024-01-17T11:00:00Z",
      updatedAt: "2024-01-17T11:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "4",
      employeeCode: "EMP004",
      employeeName: "高橋 美咲",
      organizationKey: "HR",
      isActive: false,
      createdAt: "2024-01-18T14:00:00Z",
      updatedAt: "2024-02-01T16:00:00Z",
      createdBy: "admin",
      updatedBy: "manager",
    },
    {
      id: "5",
      employeeCode: "EMP005",
      employeeName: "伊藤 健太",
      organizationKey: "SALES",
      isActive: true,
      createdAt: "2024-01-20T09:30:00Z",
      updatedAt: "2024-01-20T09:30:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "6",
      employeeCode: "EMP006",
      employeeName: "渡辺 真理子",
      organizationKey: "ENGINEERING",
      isActive: true,
      createdAt: "2024-01-22T10:00:00Z",
      updatedAt: "2024-01-22T10:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "7",
      employeeCode: "EMP007",
      employeeName: "山本 大輔",
      organizationKey: null,
      isActive: true,
      createdAt: "2024-01-23T11:30:00Z",
      updatedAt: "2024-01-23T11:30:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "8",
      employeeCode: "EMP008",
      employeeName: "中村 由美",
      organizationKey: "FINANCE",
      isActive: true,
      createdAt: "2024-01-24T13:00:00Z",
      updatedAt: "2024-01-24T13:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "9",
      employeeCode: "EMP009",
      employeeName: "小林 修",
      organizationKey: "SALES",
      isActive: false,
      createdAt: "2024-01-25T09:00:00Z",
      updatedAt: "2024-02-05T10:00:00Z",
      createdBy: "admin",
      updatedBy: "manager",
    },
    {
      id: "10",
      employeeCode: "EMP010",
      employeeName: "加藤 麻衣",
      organizationKey: "HR",
      isActive: true,
      createdAt: "2024-01-26T14:30:00Z",
      updatedAt: "2024-01-26T14:30:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "11",
      employeeCode: "EMP011",
      employeeName: "吉田 拓也",
      organizationKey: "ENGINEERING",
      isActive: true,
      createdAt: "2024-01-27T10:00:00Z",
      updatedAt: "2024-01-27T10:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
    {
      id: "12",
      employeeCode: "EMP012",
      employeeName: "山田 さくら",
      organizationKey: "SALES",
      isActive: true,
      createdAt: "2024-01-28T11:00:00Z",
      updatedAt: "2024-01-28T11:00:00Z",
      createdBy: "admin",
      updatedBy: "admin",
    },
  ]

  private delay(ms = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async list(params: ListEmployeeMasterRequest): Promise<ListEmployeeMasterResponse> {
    await this.delay()

    let filtered = [...this.employees]

    // Filter by includeInactive
    if (!params.includeInactive) {
      filtered = filtered.filter((e) => e.isActive)
    }

    // Filter by employeeCode (partial match)
    if (params.employeeCode) {
      const search = params.employeeCode.toLowerCase()
      filtered = filtered.filter((e) => e.employeeCode.toLowerCase().includes(search))
    }

    // Filter by employeeName (partial match)
    if (params.employeeName) {
      const search = params.employeeName.toLowerCase()
      filtered = filtered.filter((e) => e.employeeName.toLowerCase().includes(search))
    }

    // Sort
    const sortBy = params.sortBy || "employeeCode"
    const sortOrder = params.sortOrder || "asc"
    filtered.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    // Pagination
    const page = params.page || 1
    const pageSize = Math.min(params.pageSize || 50, 200)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const items = filtered.slice(startIndex, endIndex)

    return {
      items: items.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        employeeName: e.employeeName,
        organizationKey: e.organizationKey,
        isActive: e.isActive,
      })),
      page,
      pageSize,
      totalCount: filtered.length,
    }
  }

  async findById(id: string): Promise<EmployeeMasterDetailResponse> {
    await this.delay()

    const employee = this.employees.find((e) => e.id === id)
    if (!employee) {
      throw new Error("404: Employee not found")
    }

    return employee
  }

  async create(data: CreateEmployeeMasterRequest): Promise<EmployeeMasterDetailResponse> {
    await this.delay()

    // Validation
    if (!data.employeeCode.trim()) {
      throw new Error("422: employeeCode is required")
    }
    if (!data.employeeName.trim()) {
      throw new Error("422: employeeName is required")
    }

    // Check duplicate
    const exists = this.employees.some((e) => e.employeeCode.toLowerCase() === data.employeeCode.toLowerCase())
    if (exists) {
      throw new Error("409: EMPLOYEE_CODE_DUPLICATE")
    }

    // Create new employee
    const newEmployee: EmployeeMasterDetailResponse = {
      id: String(this.employees.length + 1),
      employeeCode: data.employeeCode.trim(),
      employeeName: data.employeeName.trim(),
      organizationKey: data.organizationKey || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current-user",
      updatedBy: "current-user",
    }

    this.employees.push(newEmployee)
    return newEmployee
  }

  async update(id: string, data: UpdateEmployeeMasterRequest): Promise<EmployeeMasterDetailResponse> {
    await this.delay()

    const employee = this.employees.find((e) => e.id === id)
    if (!employee) {
      throw new Error("404: Employee not found")
    }

    // Validation
    if (data.employeeName !== undefined && !data.employeeName.trim()) {
      throw new Error("422: employeeName is required")
    }

    // Update fields
    if (data.employeeName !== undefined) {
      employee.employeeName = data.employeeName.trim()
    }
    if (data.organizationKey !== undefined) {
      employee.organizationKey = data.organizationKey || null
    }

    employee.updatedAt = new Date().toISOString()
    employee.updatedBy = "current-user"

    return employee
  }

  async deactivate(id: string): Promise<EmployeeMasterDetailResponse> {
    await this.delay()

    const employee = this.employees.find((e) => e.id === id)
    if (!employee) {
      throw new Error("404: Employee not found")
    }

    if (!employee.isActive) {
      throw new Error("409: EMPLOYEE_ALREADY_INACTIVE")
    }

    employee.isActive = false
    employee.updatedAt = new Date().toISOString()
    employee.updatedBy = "current-user"

    return employee
  }

  async reactivate(id: string): Promise<EmployeeMasterDetailResponse> {
    await this.delay()

    const employee = this.employees.find((e) => e.id === id)
    if (!employee) {
      throw new Error("404: Employee not found")
    }

    if (employee.isActive) {
      throw new Error("409: EMPLOYEE_ALREADY_ACTIVE")
    }

    employee.isActive = true
    employee.updatedAt = new Date().toISOString()
    employee.updatedBy = "current-user"

    return employee
  }
}
