"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Template, templateUtils } from "@/lib/template"
import { calculateCategoryWeightSum, calculateItemWeightSum, validateWeights } from "./utils"

type Props = {
  template: Template
  isEditing: boolean
  submitting: boolean
  onAddCategory: (template: Template) => void
  onDeleteCategory: (template: Template, categoryId: string) => void
  onAddItem: (template: Template, categoryId: string) => void
  onDeleteItem: (template: Template, categoryId: string, itemId: string) => void
  onUpdateCategory: (template: Template, categoryId: string, updates: any) => void
  onUpdateItem: (template: Template, categoryId: string, itemId: string, updates: any) => void
  onCancelEdit: () => void
  onSave: (template: Template) => void
}

export default function ConfigEditor({
  template,
  isEditing,
  submitting,
  onAddCategory,
  onDeleteCategory,
  onAddItem,
  onDeleteItem,
  onUpdateCategory,
  onUpdateItem,
  onCancelEdit,
  onSave,
}: Props) {
  const { config } = template

  if (!config || !config.categories || !Array.isArray(config.categories)) {
    return (
      <div className="space-y-4 pl-4 border-l-2 border-gray-200">
        <div className="text-sm text-gray-600">模板配置信息不完整或格式错误</div>
      </div>
    )
  }

  const categoryWeightSum = calculateCategoryWeightSum(config.categories)
  const validation = validateWeights(template)

  return (
    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-gray-600">
            {templateUtils.getTemplateConfigSummary(config)}
          </div>
          {isEditing && (
            <div className="flex items-center gap-4 text-xs">
              <span className={`font-medium ${categoryWeightSum === 100 ? 'text-green-600' : 'text-red-600'}`}>
                分类权重总和: {categoryWeightSum}%
              </span>
              {!validation.isValid && (
                <span className="text-red-600">⚠️ 权重配置有误</span>
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onAddCategory(template)} className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              添加大项
            </Button>
          </div>
        ) : null}
      </div>

      {config.categories.map((category) => {
        const itemWeightSum = category.items ? calculateItemWeightSum(category.items) : 0
        const categoryValid = !category.items || category.items.length === 0 || itemWeightSum === 100

        return (
          <div key={category.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={category.name}
                      onChange={(e) => onUpdateCategory(template, category.id, { name: e.target.value })}
                      className="font-semibold max-w-40"
                    />
                    <Input
                      type="number"
                      value={category.weight}
                      onChange={(e) => onUpdateCategory(template, category.id, { weight: parseInt(e.target.value) || 0 })}
                      className="w-16"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm">%</span>
                    {category.items && category.items.length > 0 && (
                      <span className={`text-xs ${categoryValid ? 'text-green-600' : 'text-red-600'}`}>
                        (小项: {itemWeightSum}%)
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold">{category.name}</h4>
                    <Badge variant="outline">{category.weight}%</Badge>
                  </>
                )}
                {category.special_attributes?.leader_only && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">仅限领导评分</Badge>
                )}
              </div>
              {isEditing && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => onAddItem(template, category.id)} className="text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    添加小项
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDeleteCategory(template, category.id)} className="text-xs text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="mb-3">
                <Input
                  value={category.description}
                  onChange={(e) => onUpdateCategory(template, category.id, { description: e.target.value })}
                  placeholder="分类描述"
                  className="text-sm"
                />
              </div>
            )}

            {!isEditing && <div className="text-sm text-gray-600 mb-3">{category.description}</div>}

            <div className="space-y-2">
              <Label className="text-sm font-medium">评估项目 ({category.items && Array.isArray(category.items) ? category.items.length : 0}项):</Label>
              <div className="space-y-2">
                {category.items && Array.isArray(category.items) ? (
                  category.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      {isEditing ? (
                        <>
                          <Input
                            value={item.name}
                            onChange={(e) => onUpdateItem(template, category.id, item.id, { name: e.target.value })}
                            className="flex-1 text-sm"
                            placeholder="项目名称"
                          />
                          <Input
                            type="number"
                            value={item.weight}
                            onChange={(e) => onUpdateItem(template, category.id, item.id, { weight: parseInt(e.target.value) || 0 })}
                            className="w-16 text-sm"
                            min="0"
                            max="100"
                          />
                          <span className="text-xs">%</span>
                          <Input
                            value={item.description}
                            onChange={(e) => onUpdateItem(template, category.id, item.id, { description: e.target.value })}
                            className="flex-1 text-sm"
                            placeholder="项目描述"
                          />
                          <Button size="sm" variant="outline" onClick={() => onDeleteItem(template, category.id, item.id)} className="text-xs text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            <Badge variant="outline" className="text-xs">{item.weight}%</Badge>
                          </div>
                          {item.description && <span className="text-xs text-gray-500">{item.description}</span>}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">暂无评估项目</div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">总分:</span> {config.total_score}分
        </div>
        <div>
          <span className="font-medium">版本:</span> {config.version}
        </div>
      </div>
    </div>
  )
}

