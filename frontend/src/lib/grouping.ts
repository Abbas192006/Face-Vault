export interface DateGroup<T> {
  groupName: string
  items: T[]
}

export function groupPhotosByMonth<T>(
  items: T[],
  getDate: (item: T) => string | undefined
): DateGroup<T>[] {
  const groups = new Map<string, T[]>()
  
  for (const item of items) {
    const dateStr = getDate(item)
    let groupName = 'Unknown Date'
    
    if (dateStr) {
      try {
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          // Format as "Month YYYY", e.g. "October 2025"
          groupName = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        }
      } catch (e) {
        // Fallback if parsing fails
      }
    }
    
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }
    groups.get(groupName)!.push(item)
  }
  
  // Return array of groups. Order is implicitly preserved from the input array,
  // because we populate Map in order. For Maps, keys are ordered by insertion time.
  const result: DateGroup<T>[] = []
  for (const [groupName, groupItems] of groups.entries()) {
    result.push({ groupName, items: groupItems })
  }
  
  return result
}
