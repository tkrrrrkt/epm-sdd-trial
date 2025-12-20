import type {
  ListEmployeeMasterRequest,
  ListEmployeeMasterResponse,
  EmployeeMasterDetailResponse,
  CreateEmployeeMasterRequest,
  UpdateEmployeeMasterRequest,
} from "@contracts/bff/employee-master"

/**
 * BFF Client Interface
 *
 * Defines all BFF endpoints for Employee Master operations.
 * Implementations: MockBffClient (dev), HttpBffClient (prod)
 */
export interface BffClient {
  /**
   * List employees with search, filter, sort, and pagination
   */
  list(params: ListEmployeeMasterRequest): Promise<ListEmployeeMasterResponse>

  /**
   * Get employee details by ID
   */
  findById(id: string): Promise<EmployeeMasterDetailResponse>

  /**
   * Create new employee
   */
  create(data: CreateEmployeeMasterRequest): Promise<EmployeeMasterDetailResponse>

  /**
   * Update employee (name and organizationKey only)
   */
  update(id: string, data: UpdateEmployeeMasterRequest): Promise<EmployeeMasterDetailResponse>

  /**
   * Deactivate employee
   */
  deactivate(id: string): Promise<EmployeeMasterDetailResponse>

  /**
   * Reactivate employee
   */
  reactivate(id: string): Promise<EmployeeMasterDetailResponse>
}
