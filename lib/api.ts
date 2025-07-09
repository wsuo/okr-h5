/**
 * API 客户端配置
 */

// API 基础配置
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
export const API_PREFIX = '/api/v1'

// 请求响应接口定义
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  timestamp: string
  path: string
  errors?: any[]
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// HTTP 客户端类
class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${API_PREFIX}${endpoint}`
    
    // 获取 token
    const token = this.getToken()
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      // 处理成功的空响应（如删除操作返回204 No Content）
      if (response.ok && (response.status === 204 || response.headers.get('content-length') === '0')) {
        return {
          code: 200, // 统一返回200表示成功
          message: 'success',
          data: undefined as any,
          timestamp: new Date().toISOString(),
          path: endpoint
        }
      }

      // 处理非 JSON 响应（如文件下载）
      if (!response.headers.get('content-type')?.includes('application/json')) {
        if (response.ok) {
          return {
            code: response.status,
            message: 'success',
            data: response as any,
            timestamp: new Date().toISOString(),
            path: endpoint
          }
        }
      }

      // 尝试解析JSON响应
      let data: ApiResponse<T>
      try {
        const text = await response.text()
        if (text) {
          data = JSON.parse(text)
        } else {
          // 空响应体但状态码表示成功
          if (response.ok) {
            return {
              code: 200,
              message: 'success',
              data: undefined as any,
              timestamp: new Date().toISOString(),
              path: endpoint
            }
          }
          throw new Error(`Empty response with status: ${response.status}`)
        }
      } catch (parseError) {
        if (response.ok) {
          // 成功但无法解析JSON，可能是空响应
          return {
            code: 200,
            message: 'success',
            data: undefined as any,
            timestamp: new Date().toISOString(),
            path: endpoint
          }
        }
        throw new Error(`Failed to parse response: ${parseError}`)
      }

      // 处理 401 未授权错误
      if (response.status === 401) {
        // 如果是登录接口的401错误，不要自动跳转，让业务逻辑处理
        if (!endpoint.includes('/auth/login')) {
          this.handleUnauthorized()
        }
      }

      // 如果响应不成功，抛出错误
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // GET 请求
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint
    return this.request<T>(url, { method: 'GET' })
  }

  // POST 请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT 请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PATCH 请求
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE 请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // 文件上传
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = this.getToken()
    
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })
  }

  // 获取存储的 token
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  }

  // 处理未授权错误
  private handleUnauthorized(): void {
    if (typeof window === 'undefined') return
    
    // 清除本地存储的认证信息
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('userInfo')
    
    // 跳转到登录页面
    window.location.href = '/'
  }
}

// 导出 API 客户端实例
export const apiClient = new ApiClient()