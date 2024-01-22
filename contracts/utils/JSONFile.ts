import fs from 'fs'

export class JSONFile {
  /**
   * Read the content of the JSON file
   * @param path The path of the JSON file
   * @returns
   */
  static read(path: string) {
    try {
      return JSON.parse(fs.readFileSync(path).toString())
    } catch (e) {
      console.log(`Filed to read ${path}`, (e as Error).message)
      throw e
    }
  }

  /**
   * Update the JSON file with the data
   * @param path The path of the file
   * @param data The new data to add to the JSON content
   */
  static update(path: string, data: any) {
    const state = JSONFile.read(path)
    fs.writeFileSync(path, JSON.stringify({ ...state, ...data }, null, 2))
  }
}
