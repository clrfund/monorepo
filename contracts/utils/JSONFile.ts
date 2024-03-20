import fs from 'fs'

/**
 * Used by JSON.stringify to convert bigint to string
 * @param _key: key of the JSON entry to process
 * @param value: value of the JSON entry to process
 * @returns formated value
 */
function replacer(_key: string, value: any) {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

export class JSONFile {
  /**
   * Read the content of the JSON file
   * @param path The path of the JSON file
   * @returns
   */
  static read(path: string) {
    return JSON.parse(fs.readFileSync(path).toString())
  }

  /**
   * Update the JSON file with the data
   * @param path The path of the file
   * @param data The new data to add to the JSON content
   */
  static update(path: string, data: any) {
    let state: any
    try {
      state = JSONFile.read(path)
    } catch {
      state = {}
    }
    fs.writeFileSync(path, JSON.stringify({ ...state, ...data }, null, 2))
  }

  /**
   * Write the data to the JSON file
   * @param path The path of the file
   * @param data The data to write
   */
  static write(path: string, data: any) {
    const outputString = JSON.stringify(data, replacer, 2)
    fs.writeFileSync(path, outputString + '\n')
  }
}
