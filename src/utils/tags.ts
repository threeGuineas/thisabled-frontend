import type { Tag } from '../services/users'

export interface CategoryGroup {
  category: string
  tags: Tag[]
}

export function groupByCategory(tags: Tag[]): CategoryGroup[] {
  const groups: CategoryGroup[] = []
  for (const tag of tags) {
    const group = groups.find((g) => g.category === tag.category)
    if (group) group.tags.push(tag)
    else groups.push({ category: tag.category, tags: [tag] })
  }
  return groups
}
