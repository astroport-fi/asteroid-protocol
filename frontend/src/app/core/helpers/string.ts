// Sample of the value "data:image/png;base64,iVBORw0Kbase64"
export function splitDataUrl(data: string): [string, string] {
  const mime = data.split(';')[0].split(':')[1];
  return [mime, data.split(',')[1]];
}
