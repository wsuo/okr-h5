"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Template } from "@/lib/template"
import { ScoringMode } from "@/lib/evaluation"

type Props = {
  template: Template
  onUpdate: (updated: Template) => void
}

export default function ScoringRulesEditor({ template, onUpdate }: Props) {
  const scoringMode = (template.config.scoring_rules?.scoring_mode || 'simple_weighted') as ScoringMode

  return (
    <div className="space-y-4 mb-6 p-4 bg-green-50 rounded-lg">
      <h5 className="font-medium text-sm">评分规则配置</h5>
      <p className="text-xs text-gray-600">设置评分模式和权重分配</p>

      <div>
        <Label className="text-xs">评分模式</Label>
        <Select
          value={scoringMode}
          onValueChange={(value: ScoringMode) => {
            let updatedScoringRules: any = {
              ...template.config.scoring_rules,
              scoring_mode: value,
            }

            if (value === 'two_tier_weighted') {
              updatedScoringRules = {
                scoring_mode: 'two_tier_weighted',
                calculation_method: updatedScoringRules.calculation_method,
                two_tier_config: updatedScoringRules.two_tier_config || {
                  employee_leader_weight: 80,
                  boss_weight: 20,
                  self_weight_in_employee_leader: 60,
                  leader_weight_in_employee_leader: 40,
                },
              }
            } else {
              updatedScoringRules = {
                scoring_mode: 'simple_weighted',
                calculation_method: updatedScoringRules.calculation_method,
                self_evaluation: {
                  enabled: true,
                  description: '员工自我评估',
                  weight_in_final: 0.4,
                },
                leader_evaluation: {
                  enabled: true,
                  description: '直属领导评估',
                  weight_in_final: 0.6,
                },
              }
            }

            onUpdate({
              ...template,
              config: { ...template.config, scoring_rules: updatedScoringRules },
            })
          }}
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="选择评分模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple_weighted">简单加权模式</SelectItem>
            <SelectItem value="two_tier_weighted">两层加权模式</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scoringMode === 'simple_weighted' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 员工自评配置 */}
            <div className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">员工自我评估</Label>
                <Switch
                  checked={template.config.scoring_rules?.self_evaluation?.enabled || false}
                  onCheckedChange={(checked) => {
                    onUpdate({
                      ...template,
                      config: {
                        ...template.config,
                        scoring_rules: {
                          ...template.config.scoring_rules,
                          self_evaluation: {
                            enabled: checked,
                            description: template.config.scoring_rules?.self_evaluation?.description || '员工自我评估',
                            weight_in_final: template.config.scoring_rules?.self_evaluation?.weight_in_final || 0.36,
                          },
                        },
                      },
                    })
                  }}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">描述</Label>
                  <Input
                    value={template.config.scoring_rules?.self_evaluation?.description || '员工自我评估'}
                    onChange={(e) => {
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            self_evaluation: {
                              enabled: template.config.scoring_rules?.self_evaluation?.enabled || true,
                              description: e.target.value,
                              weight_in_final: template.config.scoring_rules?.self_evaluation?.weight_in_final || 0.36,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="员工自我评估"
                  />
                </div>
                <div>
                  <Label className="text-xs">权重 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round((template.config.scoring_rules?.self_evaluation?.weight_in_final || 0.36) * 100)}
                    onChange={(e) => {
                      const percentage = parseInt(e.target.value) || 0
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            self_evaluation: {
                              enabled: template.config.scoring_rules?.self_evaluation?.enabled || true,
                              description: template.config.scoring_rules?.self_evaluation?.description || '员工自我评估',
                              weight_in_final: percentage / 100,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="36"
                  />
                </div>
              </div>
            </div>

            {/* 领导评分配置 */}
            <div className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">直属领导评估</Label>
                <Switch
                  checked={template.config.scoring_rules?.leader_evaluation?.enabled || false}
                  onCheckedChange={(checked) => {
                    onUpdate({
                      ...template,
                      config: {
                        ...template.config,
                        scoring_rules: {
                          ...template.config.scoring_rules,
                          leader_evaluation: {
                            enabled: checked,
                            description: template.config.scoring_rules?.leader_evaluation?.description || '直属领导评估',
                            weight_in_final: template.config.scoring_rules?.leader_evaluation?.weight_in_final || 0.54,
                          },
                        },
                      },
                    })
                  }}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">描述</Label>
                  <Input
                    value={template.config.scoring_rules?.leader_evaluation?.description || '直属领导评估'}
                    onChange={(e) => {
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            leader_evaluation: {
                              enabled: template.config.scoring_rules?.leader_evaluation?.enabled || true,
                              description: e.target.value,
                              weight_in_final: template.config.scoring_rules?.leader_evaluation?.weight_in_final || 0.54,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="直属领导评估"
                  />
                </div>
                <div>
                  <Label className="text-xs">权重 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round((template.config.scoring_rules?.leader_evaluation?.weight_in_final || 0.54) * 100)}
                    onChange={(e) => {
                      const percentage = parseInt(e.target.value) || 0
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            leader_evaluation: {
                              enabled: template.config.scoring_rules?.leader_evaluation?.enabled || true,
                              description: template.config.scoring_rules?.leader_evaluation?.description || '直属领导评估',
                              weight_in_final: percentage / 100,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="54"
                  />
                </div>
              </div>
            </div>

            {/* Boss评分配置 */}
            <div className="p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">上级(Boss)评估</Label>
                <Switch
                  checked={template.config.scoring_rules?.boss_evaluation?.enabled || false}
                  onCheckedChange={(checked) => {
                    onUpdate({
                      ...template,
                      config: {
                        ...template.config,
                        scoring_rules: {
                          ...template.config.scoring_rules,
                          boss_evaluation: {
                            enabled: checked,
                            description: template.config.scoring_rules?.boss_evaluation?.description || '上级(Boss)评估',
                            weight_in_final: template.config.scoring_rules?.boss_evaluation?.weight_in_final || 0.1,
                            is_optional: template.config.scoring_rules?.boss_evaluation?.is_optional !== false,
                          },
                        },
                      },
                    })
                  }}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">描述</Label>
                  <Input
                    value={template.config.scoring_rules?.boss_evaluation?.description || '上级(Boss)评估'}
                    onChange={(e) => {
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            boss_evaluation: {
                              enabled: template.config.scoring_rules?.boss_evaluation?.enabled || false,
                              description: e.target.value,
                              weight_in_final: template.config.scoring_rules?.boss_evaluation?.weight_in_final || 0.1,
                              is_optional: template.config.scoring_rules?.boss_evaluation?.is_optional !== false,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="上级(Boss)评估"
                  />
                </div>
                <div>
                  <Label className="text-xs">权重 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round((template.config.scoring_rules?.boss_evaluation?.weight_in_final || 0.1) * 100)}
                    onChange={(e) => {
                      const percentage = parseInt(e.target.value) || 0
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            boss_evaluation: {
                              enabled: template.config.scoring_rules?.boss_evaluation?.enabled || false,
                              description: template.config.scoring_rules?.boss_evaluation?.description || '上级(Boss)评估',
                              weight_in_final: percentage / 100,
                              is_optional: template.config.scoring_rules?.boss_evaluation?.is_optional !== false,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 计算方法 */}
            <div>
              <Label className="text-xs">计算方法</Label>
              <Select
                value={template.config.scoring_rules?.calculation_method || 'weighted_average'}
                onValueChange={(value) => {
                  onUpdate({
                    ...template,
                    config: {
                      ...template.config,
                      scoring_rules: {
                        ...template.config.scoring_rules,
                        calculation_method: value,
                      },
                    },
                  })
                }}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="选择计算方法" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weighted_average">加权平均</SelectItem>
                  <SelectItem value="simple_average">简单平均</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 权重校验 */}
            <div className="flex items-end">
              {(() => {
                const selfWeight = (template.config.scoring_rules.self_evaluation?.weight_in_final || 0.36) * 100
                const leaderWeight = (template.config.scoring_rules.leader_evaluation?.weight_in_final || 0.54) * 100
                const bossWeight = (template.config.scoring_rules.boss_evaluation?.weight_in_final || 0.1) * 100
                const total = Math.round(selfWeight + leaderWeight + bossWeight)
                const isValid = total === 100
                return (
                  <div className={`px-2 py-1 rounded text-xs ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    权重总计: {total}% {isValid ? '✓' : '⚠️'}
                  </div>
                )
              })()}
            </div>
          </div>
        </>
      ) : (
        // 两层加权模式配置
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-3 bg-white rounded border">
              <div className="font-medium text-sm mb-2">第一层：员工+领导 vs Boss</div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">员工+领导 (A) 权重 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={template.config.scoring_rules?.two_tier_config?.employee_leader_weight || 80}
                    onChange={(e) => {
                      const percentage = parseInt(e.target.value) || 0
                      const cfg = template.config.scoring_rules?.two_tier_config
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            two_tier_config: {
                              employee_leader_weight: percentage,
                              boss_weight: cfg?.boss_weight ?? 20,
                              self_weight_in_employee_leader: cfg?.self_weight_in_employee_leader ?? 60,
                              leader_weight_in_employee_leader: cfg?.leader_weight_in_employee_leader ?? 40,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label className="text-xs">Boss (B) 权重 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={template.config.scoring_rules?.two_tier_config?.boss_weight || 20}
                    onChange={(e) => {
                      const percentage = parseInt(e.target.value) || 0
                      const cfg = template.config.scoring_rules?.two_tier_config
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            two_tier_config: {
                              employee_leader_weight: cfg?.employee_leader_weight ?? 80,
                              boss_weight: percentage,
                              self_weight_in_employee_leader: cfg?.self_weight_in_employee_leader ?? 60,
                              leader_weight_in_employee_leader: cfg?.leader_weight_in_employee_leader ?? 40,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="20"
                  />
                </div>
                <div className="text-xs text-gray-600">
                  A + B 应等于 100%。
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded border">
              <div className="font-medium text-sm mb-2">第二层：员工自评 vs 领导评分</div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">员工自评 (C) 在 A 中的权重 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={template.config.scoring_rules?.two_tier_config?.self_weight_in_employee_leader || 60}
                    onChange={(e) => {
                      const percentage = parseInt(e.target.value) || 0
                      const cfg = template.config.scoring_rules?.two_tier_config
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            two_tier_config: {
                              employee_leader_weight: cfg?.employee_leader_weight ?? 80,
                              boss_weight: cfg?.boss_weight ?? 20,
                              self_weight_in_employee_leader: percentage,
                              leader_weight_in_employee_leader: cfg?.leader_weight_in_employee_leader ?? 40,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label className="text-xs">领导评分 (D) 在 A 中的权重 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={template.config.scoring_rules?.two_tier_config?.leader_weight_in_employee_leader || 40}
                    onChange={(e) => {
                      const percentage = parseInt(e.target.value) || 0
                      const cfg = template.config.scoring_rules?.two_tier_config
                      onUpdate({
                        ...template,
                        config: {
                          ...template.config,
                          scoring_rules: {
                            ...template.config.scoring_rules,
                            two_tier_config: {
                              employee_leader_weight: cfg?.employee_leader_weight ?? 80,
                              boss_weight: cfg?.boss_weight ?? 20,
                              self_weight_in_employee_leader: cfg?.self_weight_in_employee_leader ?? 60,
                              leader_weight_in_employee_leader: percentage,
                            },
                          },
                        },
                      })
                    }}
                    className="text-sm"
                    placeholder="40"
                  />
                </div>
                <div className="text-xs text-gray-600">C + D 应等于 100%。</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
