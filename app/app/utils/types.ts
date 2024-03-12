export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type Optional<T, K extends keyof T> = Required<Omit<T, K>> &
  Pick<Partial<T>, K>
