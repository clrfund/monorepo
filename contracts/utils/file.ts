import fs from 'fs'

/**
 * Write json data to the file
 * @param filePath the path of the file to write to
 * @param data json data
 */
export function writeToFile(filePath: string, data: any) {
  const outputString = JSON.stringify(data, null, 2)
  fs.writeFileSync(filePath, outputString + '\n')
  console.log('Successfully written to ', filePath)
}
