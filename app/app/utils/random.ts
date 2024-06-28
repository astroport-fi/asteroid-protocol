export function getRandomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export function getUniqueRandomItem<T extends { id: number }>(
  selectedSet: Set<number>,
  items: T[],
) {
  let item = getRandomItem(items)
  while (selectedSet.has(item.id)) {
    item = getRandomItem(items)
  }
  selectedSet.add(item.id)
  return item
}

export function getTwoUniqueRandomItems<T extends { id: number }>(
  selectedSet: Set<number>,
  items: T[],
) {
  return [
    getUniqueRandomItem(selectedSet, items),
    getUniqueRandomItem(selectedSet, items),
  ]
}
