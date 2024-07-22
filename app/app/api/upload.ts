interface inscriptionUploadUrls {
  inscriptionSignedUrl: string
  metadataSignedUrl: string
}

export class UploadApi {
  constructor(private apiUrl: string) {}

  async inscriptionUrls(launchHash: string, contentType: string) {
    const uploadUrlsResponse = await fetch(
      `${this.apiUrl}/inscription/upload`,
      {
        method: 'POST',
        body: JSON.stringify({
          launchHash,
          contentType,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    )
    return uploadUrlsResponse.json<inscriptionUploadUrls>()
  }

  upload(signedUrl: string, file: Blob) {
    return fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
    })
  }
}
