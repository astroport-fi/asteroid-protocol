interface InscriptionUploadUrls {
  inscriptionSignedUrl: string
  metadataSignedUrl: string
  inscriptionNumber: number
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
    return uploadUrlsResponse.json<InscriptionUploadUrls>()
  }

  upload(signedUrl: string, file: Blob) {
    return fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
    })
  }

  confirm(launchHash: string, inscriptionNumber: number) {
    return fetch(`${this.apiUrl}/inscription/confirm`, {
      method: 'POST',
      body: JSON.stringify({ launchHash, inscriptionNumber }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  }
}
