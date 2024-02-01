import fetchRetry, { RequestInitWithRetry } from 'fetch-retry'
import {
  GraphQLError,
  GraphQLResponse,
  Thunder,
  chainOptions,
  fetchOptions,
} from '../zeus/index.js'

export { Subscription } from '../zeus/index.js'

const fetch = fetchRetry(global.fetch)

const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text))
          } catch (err) {
            reject(text)
          }
        })
        .catch(reject)
    })
  }
  return response.json() as Promise<GraphQLResponse>
}

export const apiFetch =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const providedOptions = options[1] ?? {}
    const fetchOptions: RequestInitWithRetry = options[1] || {
      retries: 5,
      retryOn: (attempt, error, response) => {
        if (error !== null || (response && response.status >= 500)) {
          console.log(`retrying, attempt number ${attempt + 1}`)
          return true
        }
        return false
      },
      retryDelay: (attempt, error, response) => {
        const random = Math.random() + 1
        return Math.pow(2, attempt) * Math.round(random * 1000)
      },
      ...providedOptions,
    }
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(
        `${options[0]}?query=${encodeURIComponent(query)}`,
        fetchOptions,
      )
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response)
          }
          return response.data
        })
    }
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response)
        }
        return response.data
      })
  }

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options))
export type Chain = ReturnType<typeof Chain>
