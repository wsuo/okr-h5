"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, EyeOff, Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  // 表单状态
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  // 密码可见性状态
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  })

  const { changePassword, error: authError, clearError } = useAuth()

  // 密码强度验证
  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "密码至少需要6位字符"
    }
    return ""
  }

  // 表单验证
  const validateForm = () => {
    if (!formData.oldPassword) {
      return "请输入当前密码"
    }
    if (!formData.newPassword) {
      return "请输入新密码"
    }
    if (!formData.confirmPassword) {
      return "请确认新密码"
    }
    
    const passwordError = validatePassword(formData.newPassword)
    if (passwordError) {
      return passwordError
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      return "新密码与确认密码不一致"
    }
    
    if (formData.oldPassword === formData.newPassword) {
      return "新密码不能与当前密码相同"
    }
    
    return ""
  }

  // 处理表单提交
  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      setError("")
      clearError() // 清除认证上下文中的错误
      
      const success = await changePassword(formData.oldPassword, formData.newPassword)
      
      if (success) {
        setSuccess(true)
        toast.success("密码修改成功")
        
        // 延迟关闭对话框，显示成功状态
        setTimeout(() => {
          handleClose()
        }, 1500)
      } else {
        // 使用认证上下文中的错误信息
        const errorMsg = authError || "修改密码失败，请稍后重试"
        setError(errorMsg)
        toast.error(errorMsg)
      }
      
    } catch (error: any) {
      console.error('修改密码失败:', error)
      const errorMessage = error.message || "修改密码失败，请稍后重试"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 处理对话框关闭
  const handleClose = () => {
    if (loading) return // 防止加载时关闭
    
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
    setShowPasswords({
      old: false,
      new: false,
      confirm: false
    })
    setError("")
    setSuccess(false)
    clearError() // 清除认证上下文中的错误
    onOpenChange(false)
  }

  // 处理输入变化
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除错误信息
    if (error) {
      setError("")
    }
    if (authError) {
      clearError()
    }
  }

  // 切换密码可见性
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={!loading ? handleClose : undefined}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={!loading ? undefined : (e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            修改密码
          </DialogTitle>
          <DialogDescription>
            为了保障账户安全，请设置一个强密码
          </DialogDescription>
        </DialogHeader>

        {success ? (
          // 成功状态
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">密码修改成功！</h3>
            <p className="text-sm text-gray-600 text-center">
              您的密码已成功更新，新密码将在下次登录时生效
            </p>
          </div>
        ) : (
          // 表单内容
          <div className="space-y-4 py-4">
            {(error || authError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || authError}</AlertDescription>
              </Alert>
            )}

            {/* 当前密码 */}
            <div className="space-y-2">
              <Label htmlFor="oldPassword">当前密码</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showPasswords.old ? "text" : "password"}
                  value={formData.oldPassword}
                  onChange={(e) => handleInputChange("oldPassword", e.target.value)}
                  placeholder="请输入当前密码"
                  disabled={loading}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("old")}
                  disabled={loading}
                >
                  {showPasswords.old ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* 新密码 */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  placeholder="请输入新密码（至少6位）"
                  disabled={loading}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("new")}
                  disabled={loading}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* 确认新密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="请再次输入新密码"
                  disabled={loading}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility("confirm")}
                  disabled={loading}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* 密码安全提示 */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-1">密码安全建议：</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• 密码长度至少6位字符</li>
                <li>• 建议包含字母、数字和符号</li>
                <li>• 不要使用生日、姓名等容易猜测的信息</li>
              </ul>
            </div>
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认修改
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}