import fs from 'fs'

export function writeToFile(filePath: string, data: any) {
  const outputString = JSON.stringify(data, null, 2)
  fs.writeFileSync(filePath, outputString + '\n')
  console.log('Successfully written to ', filePath)
}
