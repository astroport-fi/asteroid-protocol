export function fetcher<T>(...args: Parameters<typeof fetch>) {
  return fetch(...args).then((res) => res.json<T>())
}
