"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Settings, Edit, Trash2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TemplateItem {
  id: string
  name: string
  weight: number
  leaderOnly: boolean
  subItems: string[]
}

export default function TemplateManagement() {
  const [template, setTemplate] = useState<TemplateItem[]>([
    {
      id: "work-performance",
      name: "工作绩效",
      weight: 60,
      leaderOnly: false,
      subItems: ["工作饱和度", "工作执行度", "工作完成度", "工作效率", "工作质量"],
    },
    {
      id: "daily-management",
      name: "日常管理",
      weight: 30,
      leaderOnly: false,
      subItems: ["工作态度", "审批流程", "日常出勤", "工作汇报", "团队活动", "办公室环境维护", "规章制度遵守"],
    },
    {
      id: "leader-evaluation",
      name: "领导评价",
      weight: 10,
      leaderOnly: true,
      subItems: ["交代的专项按时完成并及时反馈"],
    },
  ])

  // 添加编辑状态管理
  const [editingItem, setEditingItem] = useState<TemplateItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    weight: 0,
    leaderOnly: false,
    subItems: [""],
  })

  const totalWeight = template.reduce((sum, item) => sum + item.weight, 0)
  const isWeightValid = totalWeight === 100

  const handleAddSubItem = (itemId: string) => {
    setTemplate(template.map((item) => (item.id === itemId ? { ...item, subItems: [...item.subItems, ""] } : item)))
  }

  const handleRemoveSubItem = (itemId: string, index: number) => {
    setTemplate(
      template.map((item) =>
        item.id === itemId ? { ...item, subItems: item.subItems.filter((_, i) => i !== index) } : item,
      ),
    )
  }

  const handleUpdateSubItem = (itemId: string, index: number, value: string) => {
    setTemplate(
      template.map((item) =>
        item.id === itemId
          ? {
              ...item,
              subItems: item.subItems.map((subItem, i) => (i === index ? value : subItem)),
            }
          : item,
      ),
    )
  }

  const handleUpdateWeight = (itemId: string, weight: number) => {
    setTemplate(template.map((item) => (item.id === itemId ? { ...item, weight } : item)))
  }

  const handleToggleLeaderOnly = (itemId: string) => {
    setTemplate(template.map((item) => (item.id === itemId ? { ...item, leaderOnly: !item.leaderOnly } : item)))
  }

  const handleAddNewItem = () => {
    const newTemplateItem: TemplateItem = {
      id: `item-${Date.now()}`,
      name: newItem.name,
      weight: newItem.weight,
      leaderOnly: newItem.leaderOnly,
      subItems: newItem.subItems.filter((item) => item.trim() !== ""),
    }

    setTemplate([...template, newTemplateItem])
    setNewItem({ name: "", weight: 0, leaderOnly: false, subItems: [""] })
    setIsDialogOpen(false)
  }

  const handleDeleteItem = (itemId: string) => {
    setTemplate(template.filter((item) => item.id !== itemId))
  }

  // 更新编辑按钮的点击事件
  const handleEditItem = (item: TemplateItem) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  // 添加更新项目的函数
  const handleUpdateItem = () => {
    if (!editingItem) return

    setTemplate(template.map((item) => (item.id === editingItem.id ? editingItem : item)))
    setEditingItem(null)
    setIsEditDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                模板管理
              </CardTitle>
              <CardDescription>配置绩效考核模板的大项、子项和权重</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  添加大项
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加考核大项</DialogTitle>
                  <DialogDescription>创建一个新的考核大项</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">大项名称</Label>
                    <Input
                      id="name"
                      placeholder="例如：工作绩效"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">权重 (%)</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      max="100"
                      value={newItem.weight}
                      onChange={(e) => setNewItem({ ...newItem, weight: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="leader-only"
                      checked={newItem.leaderOnly}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, leaderOnly: checked })}
                    />
                    <Label htmlFor="leader-only">仅限领导评分</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>子项列表</Label>
                    {newItem.subItems.map((subItem, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="输入子项名称"
                          value={subItem}
                          onChange={(e) => {
                            const updatedSubItems = [...newItem.subItems]
                            updatedSubItems[index] = e.target.value
                            setNewItem({ ...newItem, subItems: updatedSubItems })
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedSubItems = newItem.subItems.filter((_, i) => i !== index)
                            setNewItem({ ...newItem, subItems: updatedSubItems })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewItem({ ...newItem, subItems: [...newItem.subItems, ""] })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加子项
                    </Button>
                  </div>
                  <Button onClick={handleAddNewItem} className="w-full" disabled={!newItem.name || newItem.weight <= 0}>
                    添加大项
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!isWeightValid && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>权重总和必须等于100%，当前总和为 {totalWeight}%</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {template.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <Badge variant="outline">{item.weight}%</Badge>
                    {item.leaderOnly && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">仅限领导评分</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`weight-${item.id}`}>权重:</Label>
                      <Input
                        id={`weight-${item.id}`}
                        type="number"
                        min="0"
                        max="100"
                        value={item.weight}
                        onChange={(e) => handleUpdateWeight(item.id, Number.parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span>%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`leader-only-${item.id}`}
                        checked={item.leaderOnly}
                        onCheckedChange={() => handleToggleLeaderOnly(item.id)}
                      />
                      <Label htmlFor={`leader-only-${item.id}`}>仅限领导评分</Label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">子项列表:</Label>
                    <div className="mt-2 space-y-2">
                      {item.subItems.map((subItem, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={subItem}
                            onChange={(e) => handleUpdateSubItem(item.id, index, e.target.value)}
                            placeholder="输入子项名称"
                          />
                          <Button variant="outline" size="sm" onClick={() => handleRemoveSubItem(item.id, index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => handleAddSubItem(item.id)}>
                        <Plus className="w-4 h-4 mr-2" />
                        添加子项
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">权重总和:</span>
              <span className={`text-lg font-bold ${isWeightValid ? "text-green-600" : "text-red-600"}`}>
                {totalWeight}%
              </span>
            </div>
            {isWeightValid && <p className="text-sm text-green-600 mt-1">✓ 权重配置正确</p>}
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog – stays outside the Card but inside the same React tree */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑考核大项</DialogTitle>
            <DialogDescription>修改考核大项的配置信息</DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              {/* 名称 */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">大项名称</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>

              {/* 权重 */}
              <div className="space-y-2">
                <Label htmlFor="edit-weight">权重 (%)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  min="0"
                  max="100"
                  value={editingItem.weight}
                  onChange={(e) => setEditingItem({ ...editingItem, weight: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* 仅领导评分开关 */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-leader-only"
                  checked={editingItem.leaderOnly}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, leaderOnly: checked })}
                />
                <Label htmlFor="edit-leader-only">仅限领导评分</Label>
              </div>

              {/* 子项编辑 */}
              <div className="space-y-2">
                <Label>子项列表</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {editingItem.subItems.map((sub, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={sub}
                        onChange={(e) => {
                          const list = [...editingItem.subItems]
                          list[idx] = e.target.value
                          setEditingItem({ ...editingItem, subItems: list })
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditingItem({
                            ...editingItem,
                            subItems: editingItem.subItems.filter((_, i) => i !== idx),
                          })
                        }
                        disabled={editingItem.subItems.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem({ ...editingItem, subItems: [...editingItem.subItems, ""] })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加子项
                </Button>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateItem} disabled={!editingItem.name || editingItem.weight <= 0}>
                  保存修改
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
