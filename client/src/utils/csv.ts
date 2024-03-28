import fs from 'fs/promises'
import { inferSchema, initParser } from 'udsv'

export async function readCSV(
  csvPath: string,
): Promise<Record<string, string>[]> {
  const csvStr = await fs.readFile(csvPath, 'utf8')
  const schema = inferSchema(csvStr, { trim: true })
  const parser = initParser(schema)
  return parser.typedObjs(csvStr)
}
