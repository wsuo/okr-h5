import { Template } from "@/lib/template"
import { ScoringMode } from "@/lib/evaluation"

export const calculateCategoryWeightSum = (categories: any[]) => {
  return categories.reduce((sum, category) => sum + (category.weight || 0), 0)
}

export const calculateItemWeightSum = (items: any[]) => {
  return items.reduce((sum, item) => sum + (item.weight || 0), 0)
}

export const validateWeights = (template: Template) => {
  const { config } = template
  if (!config || !config.categories) return { isValid: true, errors: [] as string[] }

  const errors: string[] = []

  // 分类权重总和
  const categoryWeightSum = calculateCategoryWeightSum(config.categories)
  if (categoryWeightSum !== 100) {
    errors.push(`分类权重总和为 ${categoryWeightSum}%，应为 100%`)
  }

  // 每个分类下项目权重总和
  config.categories.forEach((category) => {
    if (category.items && category.items.length > 0) {
      const itemWeightSum = calculateItemWeightSum(category.items)
      if (itemWeightSum !== 100) {
        errors.push(`"${category.name}" 分类下项目权重总和为 ${itemWeightSum}%，应为 100%`)
      }
    }
  })

  // 评分规则权重总和
  if (config.scoring_rules) {
    const scoringMode: ScoringMode = (config.scoring_rules.scoring_mode || 'simple_weighted') as ScoringMode

    if (scoringMode === 'simple_weighted') {
      const selfWeight = (config.scoring_rules.self_evaluation?.weight_in_final || 0) * 100
      const leaderWeight = (config.scoring_rules.leader_evaluation?.weight_in_final || 0) * 100
      const bossWeight = (config.scoring_rules.boss_evaluation?.weight_in_final || 0) * 100
      const scoringRulesWeightSum = Math.round(selfWeight + leaderWeight + bossWeight)
      if (scoringRulesWeightSum !== 100) {
        errors.push(`评分规则权重总和为 ${scoringRulesWeightSum}%，应为 100%`)
      }
    } else if (scoringMode === 'two_tier_weighted') {
      const twoTierConfig = config.scoring_rules.two_tier_config
      if (twoTierConfig) {
        const firstLayerWeight = Math.round(twoTierConfig.employee_leader_weight + twoTierConfig.boss_weight)
        if (firstLayerWeight !== 100) {
          errors.push(`第一层权重总和为 ${firstLayerWeight}%，应为 100%`)
        }
        const secondLayerWeight = Math.round(
          twoTierConfig.self_weight_in_employee_leader + twoTierConfig.leader_weight_in_employee_leader
        )
        if (secondLayerWeight !== 100) {
          errors.push(`第二层权重总和为 ${secondLayerWeight}%，应为 100%`)
        }
      } else {
        errors.push('两层加权模式配置缺失')
      }
    }
  }

  // Boss评分配置验证
  if (config.boss_rating_config && config.boss_rating_config.enabled) {
    const bossCategories = config.boss_rating_config.categories
    if (bossCategories && bossCategories.length > 0) {
      // Boss评分分类数量验证
      const validationRules = config.boss_rating_config.validation_rules
      if (validationRules) {
        if (bossCategories.length < validationRules.min_categories) {
          errors.push(`Boss评分分类数量不足，至少需要 ${validationRules.min_categories} 个分类`)
        }
        if (bossCategories.length > validationRules.max_categories) {
          errors.push(`Boss评分分类数量过多，最多允许 ${validationRules.max_categories} 个分类`)
        }
      }

      // Boss评分权重验证
      const bossWeightSum = bossCategories.reduce((sum, cat) => sum + (cat.weight || 0), 0)
      if (bossWeightSum !== 100) {
        errors.push(`Boss评分权重总和为 ${bossWeightSum}%，应为 100%`)
      }

      // Boss评分分类基本验证
      bossCategories.forEach((category, index) => {
        if (!category.name || category.name.trim() === '') {
          errors.push(`Boss评分第${index + 1}个分类名称不能为空`)
        }
        if (!category.description || category.description.trim() === '') {
          errors.push(`Boss评分分类"${category.name}"的描述不能为空`)
        }
        if (category.weight <= 0 || category.weight > 100) {
          errors.push(`Boss评分分类"${category.name}"的权重必须在1-100之间`)
        }
      })
    } else {
      errors.push('Boss评分已启用但未配置评分分类')
    }
  }

  return { isValid: errors.length === 0, errors }
}

