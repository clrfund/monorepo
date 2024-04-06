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
 * Return the proof output directory
 * @param directory The root directory
 * @param network The network
 * @param roundAddress  The funding round contract address
 * @returns The proofs output directory
 */
export function getProofDirForRound(
  directory: string,
  network: string,
  roundAddress: string
) {
  try {
    return path.join(
      directory,
      network.toLowerCase(),
      roundAddress.toLowerCase()
    )
  } catch {
    return directory
  }
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
 * Create a directory
 * @param directory The directory to create
 */
export function makeDirectory(directory: string): void {
  fs.mkdirSync(directory, { recursive: true })
}
