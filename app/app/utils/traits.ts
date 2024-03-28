import { CollectionTrait } from '~/api/collection'

export interface TraitValue {
  value: string
  count: number
}

export function getTraitsMap(traits: CollectionTrait[]) {
  return traits.reduce((acc, trait) => {
    const values = acc.get(trait.trait_type) ?? []
    values.push({ value: trait.trait_value, count: trait.count })
    acc.set(trait.trait_type, values)
    return acc
  }, new Map<string, TraitValue[]>())
}
