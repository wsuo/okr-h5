"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem("token")
    const userInfo = localStorage.getItem("userInfo")
    if (token && userInfo) {
      const user = JSON.parse(userInfo)
      router.push(`/${user.role}`)
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // 模拟登录API调用
    setTimeout(() => {
      // 模拟用户数据
      const users = {
        admin: { name: "系统管理员", role: "admin", id: "admin" },
        boss: { name: "公司老板", role: "boss", id: "boss" },
        zhangsan: { name: "张三", role: "employee", id: "zhangsan", leaderId: "lisi" },
        lisi: { name: "李四", role: "lead", id: "lisi", department: "技术部" },
        wangwu: { name: "王五", role: "employee", id: "wangwu", leaderId: "lisi" },
        zhaoliu: { name: "赵六", role: "lead", id: "zhaoliu", department: "市场部" },
      }

      const user = users[username as keyof typeof users]

      if (user && password === "123456") {
        const token = `token_${username}_${Date.now()}`
        localStorage.setItem("token", token)
        localStorage.setItem("userInfo", JSON.stringify(user))
        router.push(`/${user.role}`)
      } else {
        setError("用户名或密码错误")
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">OKR绩效考核系统</CardTitle>
          <CardDescription>请输入您的账号密码登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登录
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">测试账号（密码均为：123456）：</p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>管理员：admin</div>
              <div>老板：boss</div>
              <div>部门领导：lisi（李四）、zhaoliu（赵六）</div>
              <div>员工：zhangsan（张三）、wangwu（王五）</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
