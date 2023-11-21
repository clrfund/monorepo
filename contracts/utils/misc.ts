import path from 'path'

/**
 * Get the tally file path
 *
 * @param outputDir The output directory
 * @returns The tally file path
 */
export function getTalyFilePath(outputDir: string) {
  return path.join(outputDir, 'tally.json')
}
