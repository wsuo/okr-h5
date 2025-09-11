"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { CreateTemplateDto } from "@/lib/template"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CreateTemplateDto
  setFormData: (data: CreateTemplateDto) => void
  error: string
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export default function CreateDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  error,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新建模板</DialogTitle>
          <DialogDescription>创建一个新的绩效评估模板</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">模板名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入模板名称"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">模板类型 *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择模板类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="okr">OKR模板</SelectItem>
                  <SelectItem value="assessment">考核模板</SelectItem>
                  <SelectItem value="evaluation">评估模板</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">模板描述</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入模板描述"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_default"
              checked={formData.is_default === 1}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked ? 1 : 0 })}
            />
            <Label htmlFor="is_default">设为默认模板</Label>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              创建模板
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

