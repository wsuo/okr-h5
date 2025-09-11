"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { User } from "@/lib/user"

type Props = {
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedType: string
  setSelectedType: (v: string) => void
  selectedStatus: string
  setSelectedStatus: (v: string) => void
  selectedIsDefault: string
  setSelectedIsDefault: (v: string) => void
  selectedCreatedBy: string
  setSelectedCreatedBy: (v: string) => void
  users: User[]
  loading: boolean
  onSearch: () => void
  onReset: () => void
}

export default function Filters({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  selectedIsDefault,
  setSelectedIsDefault,
  selectedCreatedBy,
  setSelectedCreatedBy,
  users,
  loading,
  onSearch,
  onReset,
}: Props) {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <Input
          placeholder="搜索模板..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSearch} disabled={loading} className="flex-1 sm:flex-none">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "搜索"}
          </Button>
          <Button variant="outline" onClick={onReset} disabled={loading} className="flex-1 sm:flex-none">
            重置
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="筛选类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="okr">OKR模板</SelectItem>
            <SelectItem value="assessment">考核模板</SelectItem>
            <SelectItem value="evaluation">评估模板</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="1">启用</SelectItem>
            <SelectItem value="0">禁用</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedIsDefault} onValueChange={setSelectedIsDefault}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="是否默认" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模板</SelectItem>
            <SelectItem value="1">默认模板</SelectItem>
            <SelectItem value="0">非默认模板</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCreatedBy} onValueChange={setSelectedCreatedBy}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="创建者（管理员）" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部管理员</SelectItem>
            {users && users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

