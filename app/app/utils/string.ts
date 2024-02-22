export function getEllipsisTxt(hash: string = '', start = 6, end = 6) {
  if (hash.length <= start + end) {
    return hash
  }

  return `${hash.substring(0, start)}...${hash.substring(
    hash.length - end,
    hash.length,
  )}`
}

export function shortAddress(value: string, start = 6, len = 6) {
  return value.substring(start, start + len)
}

export function getMimeTitle(value: string) {
  // Cover all image types
  if (value.startsWith('image/')) {
    return 'Image'
  }
  // Cover all video types
  if (value.startsWith('video/')) {
    return 'Video'
  }
  // Cover all audio types
  if (value.startsWith('audio/')) {
    return 'Audio'
  }
  if (value.startsWith('text/html')) {
    return 'HTML'
  }
  // Cover all text types
  if (value.startsWith('text/markdown')) {
    return 'Markdown'
  }
  // Cover all text types
  if (value.startsWith('text/')) {
    return 'Text'
  }
  // Cover all text types
  if (value.startsWith('application/json')) {
    return 'JSON'
  }

  switch (value) {
    case 'application/pdf':
      return 'PDF'
    case 'application/zip':
      return 'ZIP'
    case 'application/x-tar':
      return 'TAR'
    case 'application/x-rar-compressed':
      return 'RAR'
    case 'application/x-7z-compressed':
      return '7z'
    case 'application/x-bzip':
      return 'BZIP'
    case 'application/x-bzip2':
      return 'BZIP2'
    case 'application/x-gzip':
      return 'GZIP'
    default:
      return value
  }
}
