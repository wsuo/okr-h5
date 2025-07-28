import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 安全地从 localStorage 获取并解析用户信息
 * @param key localStorage 的键名
 * @returns 解析后的对象或 null
 */
export function safeParseUserInfo(key: string = "userInfo") {
  try {
    const stored = localStorage.getItem(key)
    if (!stored || stored === "undefined" || stored === "null") {
      return null
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error(`解析 ${key} 失败:`, error)
    localStorage.removeItem(key)
    return null
  }
}

/**
 * 检查用户是否具有指定角色
 * @param userInfo 用户信息对象
 * @param targetRole 目标角色
 * @returns 是否具有该角色
 */
export function hasRole(userInfo: any, targetRole: string): boolean {
  if (!userInfo) return false
  
  return userInfo.username === targetRole || 
         (userInfo.roles && Array.isArray(userInfo.roles) && userInfo.roles.includes(targetRole)) ||
         (userInfo.role && userInfo.role === targetRole) ||
         (userInfo.user_role && userInfo.user_role === targetRole) ||
         (userInfo.type && userInfo.type === targetRole)
}

/**
 * 检查用户是否是Boss
 * @param userInfo 用户信息对象
 * @returns 是否是Boss
 */
export function isBossUser(userInfo: any): boolean {
  if (!userInfo) return false
  
  return userInfo.username === 'boss' || 
         userInfo.name === '公司老板' ||
         hasRole(userInfo, 'boss')
}
