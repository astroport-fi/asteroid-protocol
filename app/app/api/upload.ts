import { NFTMetadata } from '@asteroid-protocol/sdk'

interface InscriptionUploadUrl {
  inscriptionSignedUrl: string
  tokenId: number
  filename: string
  folder: string
}

interface AssetUploadUrl {
  signedUrl: string
  assetId: number
  filename: string
  folder: string
}

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

  async getPublicInscriptions(launchHash: string) {
    const response = await fetch(
      `${this.apiUrl}/public/inscriptions/${launchHash}`,
    )
    const data = await response.json<
      { inscriptions: LaunchpadInscription[]; folder: string } | ErrorResponse
    >()

    if ('status' in data) {
      console.error('Getting inscriptions failed', data.status, data.message)
      return null
    }

    return data
  }

  async getInscriptions(launchHash: string) {
    const response = await fetch(`${this.apiUrl}/inscriptions/${launchHash}`, {
      method: 'POST',
      body: JSON.stringify({ sessionHash: this.sessionHash }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json<
      { inscriptions: LaunchpadInscription[]; folder: string } | ErrorResponse
    >()

    if ('status' in data) {
      console.error('Getting inscriptions failed', data.status, data.message)
      return null
    }

    return data
  }

  async launchpads() {
    const response = await fetch(`${this.apiUrl}/launchpads`)
    return response.json<LaunchpadStats[]>()
  }

  async launchpad(hash: string) {
    const response = await fetch(`${this.apiUrl}/launchpad/${hash}`)
    return response.json<LaunchpadStats>()
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

  async uploadAsset(
    launchHash: string,
    contentType: string,
    extension: string,
  ) {
    const uploadUrlsResponse = await fetch(`${this.apiUrl}/asset/upload`, {
      method: 'POST',
      body: JSON.stringify({
        launchHash,
        contentType,
        extension,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await uploadUrlsResponse.json<AssetUploadUrl | ErrorResponse>()

    if ('status' in data) {
      console.error(
        'Reservation image upload failed',
        data.status,
        data.message,
      )
      throw new Error('Reservation image upload failed')
    }

    return data
  }

  confirmAsset(launchHash: string, assetId: number) {
    return fetch(`${this.apiUrl}/asset/confirm`, {
      method: 'POST',
      body: JSON.stringify({
        launchHash,
        assetId,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
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
      }),
    )
    const uploadResponse = await fetch(
      `${this.apiUrl}/inscription/bulk/upload`,
      {
        method: 'POST',
        body: JSON.stringify({
          launchHash,
          inscriptions: requests,
          sessionHash: this.sessionHash,
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
