import { NFTMetadata } from '@asteroid-protocol/sdk'

interface InscriptionUploadUrls {
  inscriptionSignedUrl: string
  metadataSignedUrl: string
  tokenId: number
  filename: string
}

interface InscriptionUploadRequest {
  tokenId: number
  filename: string
  contentType: string
}

interface ErrorResponse {
  status: number
  message: string
}

export interface LaunchpadInscription {
  id: number
  launchpad_hash: string
  inscription_number: number
  name: string
  uploaded: boolean
}

interface LaunchpadStats {
  launchpad_hash: string
  total: number
  uploaded: number
}

export class UploadApi {
  constructor(
    private apiUrl: string,
    private sessionHash?: string,
  ) {}

  async launchpads() {
    const response = await fetch(`${this.apiUrl}/launchpads`)
    return response.json<LaunchpadStats[]>()
  }

  async createSession(address: string) {
    const response = await fetch(`${this.apiUrl}/create-session`, {
      method: 'POST',
      body: JSON.stringify({ address }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json<{ hash: string } | ErrorResponse>()

    if ('status' in data) {
      console.error('Creating session failed', data.status, data.message)
      throw new Error('Creating session failed')
    }

    return data.hash
  }

  async verifySession(hash: string, pubkey: string, signature: string) {
    const response = await fetch(`${this.apiUrl}/verify-session`, {
      method: 'POST',
      body: JSON.stringify({ hash, pubkey, signature }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json<{ success: boolean } | ErrorResponse>()

    if ('status' in data) {
      console.error('Creating session failed', data.status, data.message)
      throw new Error('Creating session failed')
    }
  }

  async inscriptionUrls(
    launchHash: string,
    contentType: string,
    extension: string,
  ) {
    const uploadUrlsResponse = await fetch(
      `${this.apiUrl}/inscription/upload`,
      {
        method: 'POST',
        body: JSON.stringify({
          launchHash,
          contentType,
          extension,
          sessionHash: this.sessionHash,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    )
    const data = await uploadUrlsResponse.json<
      InscriptionUploadUrls | ErrorResponse
    >()

    if ('status' in data) {
      console.error('Inscription upload failed', data.status, data.message)
      throw new Error('Inscription upload failed')
    }

    return data
  }

  async editMetadata(launchHash: string, tokenId: number) {
    const uploadUrlsResponse = await fetch(`${this.apiUrl}/inscription/edit`, {
      method: 'POST',
      body: JSON.stringify({
        launchHash,
        tokenId,
        sessionHash: this.sessionHash,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await uploadUrlsResponse.json<
      { metadataSignedUrl: string } | ErrorResponse
    >()

    if ('status' in data) {
      console.error('Edit metadata failed', data.status, data.message)
      throw new Error('Edit metadata failed')
    }

    return data.metadataSignedUrl
  }

  async bulkUpload(
    launchHash: string,
    inscriptions: NFTMetadata[],
  ): Promise<InscriptionUploadUrls[]> {
    const requests: InscriptionUploadRequest[] = inscriptions.map(
      (inscription) => ({
        tokenId: inscription.token_id!,
        filename: inscription.filename!,
        contentType: inscription.mime,
        sessionHash: this.sessionHash,
      }),
    )
    const uploadResponse = await fetch(
      `${this.apiUrl}/inscription/bulk/upload`,
      {
        method: 'POST',
        body: JSON.stringify({
          launchHash,
          inscriptions: requests,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    )
    const data = await uploadResponse.json<
      { urls: InscriptionUploadUrls[] } | ErrorResponse
    >()

    if ('status' in data) {
      console.error('Bulk upload failed', data.status, data.message)
      throw new Error('Bulk upload failed')
    }

    return data.urls
  }

  bulkConfirm(launchHash: string, tokenIds: number[]) {
    return fetch(`${this.apiUrl}/inscription/bulk/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        launchHash,
        tokenIds,
        sessionHash: this.sessionHash,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }

  upload(signedUrl: string, file: Blob) {
    return fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
    })
  }

  confirm(launchHash: string, tokenId: number) {
    return fetch(`${this.apiUrl}/inscription/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        launchHash,
        tokenId,
        sessionHash: this.sessionHash,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }
}
