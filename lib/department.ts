/**
 * 部门管理相关类型定义和服务
 */

import { apiClient, ApiResponse } from './api'

// 部门信息接口
export interface Department {
  id: number
  name: string
  description?: string
  parent_id?: number
  sort_order: number
  status: number
  employeeCount: number
  created_at: string
  updated_at: string
}

// 创建部门请求接口
export interface CreateDepartmentDto {
  name: string
  description?: string
  parent_id?: number
  sort_order?: number
}

// 更新部门请求接口
export interface UpdateDepartmentDto {
  name?: string
  description?: string
  parent_id?: number
  sort_order?: number
  status?: number
}

// 部门列表响应接口
export interface DepartmentListResponse {
  data: {
    data: Department[]
  }
}

// 部门服务类
class DepartmentService {
  // 获取部门列表
  async getDepartments(): Promise<ApiResponse<DepartmentListResponse>> {
    try {
      return await apiClient.get<DepartmentListResponse>('/departments')
    } catch (error) {
      console.error('Get departments failed:', error)
      throw error
    }
  }

  // 获取部门详情
  async getDepartment(id: number): Promise<ApiResponse<Department>> {
    try {
      return await apiClient.get<Department>(`/departments/${id}`)
    } catch (error) {
      console.error('Get department failed:', error)
      throw error
    }
  }

  // 创建部门
  async createDepartment(departmentData: CreateDepartmentDto): Promise<ApiResponse<Department>> {
    try {
      return await apiClient.post<Department>('/departments', departmentData)
    } catch (error) {
      console.error('Create department failed:', error)
      throw error
    }
  }

  // 更新部门
  async updateDepartment(id: number, departmentData: UpdateDepartmentDto): Promise<ApiResponse<Department>> {
    try {
      return await apiClient.patch<Department>(`/departments/${id}`, departmentData)
    } catch (error) {
      console.error('Update department failed:', error)
      throw error
    }
  }

  // 删除部门
  async deleteDepartment(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiClient.delete<{ message: string }>(`/departments/${id}`)
    } catch (error) {
      console.error('Delete department failed:', error)
      throw error
    }
  }
}

// 导出部门服务实例
export const departmentService = new DepartmentService()

// 导出部门相关的工具函数
export const departmentUtils = {
  // 格式化部门状态
  formatDepartmentStatus(status: number): string {
    return status === 1 ? '启用' : '禁用'
  },

  // 获取部门状态颜色
  getDepartmentStatusColor(status: number): string {
    return status === 1 ? 'text-green-600' : 'text-red-600'
  },

  // 格式化部门创建时间
  formatDepartmentDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN')
  },

  // 构建部门树结构
  buildDepartmentTree(departments: Department[]): Department[] {
    const map = new Map<number, Department & { children?: Department[] }>()
    const roots: Department[] = []

    // 创建映射
    departments.forEach(dept => {
      map.set(dept.id, { ...dept, children: [] })
    })

    // 构建树结构
    departments.forEach(dept => {
      const node = map.get(dept.id)!
      if (dept.parent_id && map.has(dept.parent_id)) {
        const parent = map.get(dept.parent_id)!
        if (!parent.children) parent.children = []
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })

    // 排序
    const sortDepartments = (depts: Department[]): Department[] => {
      return depts.sort((a, b) => a.sort_order - b.sort_order).map(dept => {
        if ('children' in dept && dept.children) {
          dept.children = sortDepartments(dept.children)
        }
        return dept
      })
    }

    return sortDepartments(roots)
  }
}