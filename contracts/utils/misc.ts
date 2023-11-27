import path from 'path'
import fs from 'fs'

/**
 * Get the tally file path
 *
 * @param outputDir The output directory
 * @returns The tally file path
 */
export function getTalyFilePath(outputDir: string) {
  return path.join(outputDir, 'tally.json')
}

/**
 * Check if the path exist
 *
 * @param path The path to check for existence
 * @returns true if the path exists
 */
export function isPathExist(path: string): boolean {
  return fs.existsSync(path)
}
