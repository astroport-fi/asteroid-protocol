export const api = <T>(url: string, init?: RequestInit): Promise<T> => {
    return fetch(url, init)
        .then(async response => {
            if (!response.ok) {
                throw await response.json();
            }
            return response.json() as Promise<T>
        })
}
