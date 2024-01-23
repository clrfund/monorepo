import path from 'path'
import fs from 'fs'

/**
 * Get the tally file path
 * @param outputDir The output directory
 * @returns The tally file path
 */
export function getTalyFilePath(outputDir: string) {
  return path.join(outputDir, 'tally.json')
}

/**
 * Get the MACI state file path
 * @param directory The directory containing the MACI state file
 * @returns The path of the MACI state file
 */
export function getMaciStateFilePath(directory: string) {
  return path.join(directory, 'maci-state.json')
}

/**
 * Check if the path exist
 * @param path The path to check for existence
 * @returns true if the path exists
 */
export function isPathExist(path: string): boolean {
  return fs.existsSync(path)
}

/**
 * Returns the directory of the path
 * @param file The file path
 * @returns The directory of the file
 */
export function getDirname(file: string): string {
  return path.dirname(file)
}
