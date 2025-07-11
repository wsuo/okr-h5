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
