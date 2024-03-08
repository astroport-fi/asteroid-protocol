import { parseFile } from '@fast-csv/parse'
import fs from 'fs/promises'

export async function fileExists(file: string) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

export async function readCSV(
  csvPath: string,
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = []
    parseFile(csvPath, { headers: true })
      .on('error', (error) => reject(error))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
  })
}
