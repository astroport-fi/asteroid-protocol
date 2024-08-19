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

export class UploadApi {
  constructor(private apiUrl: string) {}

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
      body: JSON.stringify({ launchHash, tokenIds }),
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
      body: JSON.stringify({ launchHash, tokenId }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }
}
