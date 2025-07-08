"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Key, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { changePassword } = useAuth()

  const oldPasswordRef = useRef<HTMLInputElement>(null)
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    if (oldPasswordRef.current) oldPasswordRef.current.value = ""
    if (newPasswordRef.current) newPasswordRef.current.value = ""
    if (confirmPasswordRef.current) confirmPasswordRef.current.value = ""
    setError("")
    setSuccess("")
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const oldPassword = oldPasswordRef.current?.value || ""
    const newPassword = newPasswordRef.current?.value || ""
    const confirmPassword = confirmPasswordRef.current?.value || ""

    // 表单验证
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("请填写所有字段")
      return
    }

    if (newPassword.length < 6) {
      setError("新密码长度不能少于6位")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致")
      return
    }

    if (oldPassword === newPassword) {
      setError("新密码不能与原密码相同")
      return
    }

    setLoading(true)

    try {
      const success = await changePassword(oldPassword, newPassword)
      
      if (success) {
        setSuccess("密码修改成功")
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      }
    } catch (error) {
      console.error('Change password failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      // 使用setTimeout确保在动画关闭后再重置表单
      setTimeout(resetForm, 300)
    }
  }

  // 当对话框关闭时，重置成功和错误状态
  useEffect(() => {
    if (!open) {
      setSuccess("")
      setError("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
          <DialogDescription>
            请输入您的原密码和新密码，新密码长度不能少于6位
          </DialogDescription>
        </DialogHeader>
        <form 
          onSubmit={handleSubmit} 
          className="space-y-4" 
          autoComplete="off"
        >
          <div className="space-y-2">
            <Label htmlFor="oldPassword">原密码</Label>
            <Input
              ref={oldPasswordRef}
              id="oldPassword"
              type="text"
              className="password-mask"
              placeholder="请输入原密码"
              disabled={loading}
              required
              autoComplete="off"
              defaultValue=""
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">新密码</Label>
            <Input
              ref={newPasswordRef}
              id="newPassword"
              type="text"
              className="password-mask"
              placeholder="请输入新密码（至少6位）"
              disabled={loading}
              minLength={6}
              required
              autoComplete="off"
              defaultValue=""
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <Input
              ref={confirmPasswordRef}
              id="confirmPassword"
              type="text"
              className="password-mask"
              placeholder="请再次输入新密码"
              disabled={loading}
              required
              autoComplete="off"
              defaultValue=""
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认修改
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}