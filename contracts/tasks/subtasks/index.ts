import fs from 'fs'
import path from 'path'

export const SUBTASK_CATALOGS = [
  'brightid',
  'clrfund',
  'coordinator',
  'deployer',
  'maci',
  'recipient',
  'round',
  'user',
  'token',
]

/**
 * The same as individual imports but doesn't require to add new import line every time
 */
SUBTASK_CATALOGS.forEach((catalog) => {
  const tasksPath = path.resolve(__dirname, catalog)

  if (fs.existsSync(tasksPath)) {
    fs.readdirSync(tasksPath)
      .filter((p) => p.includes('.ts') && !p.includes('index.ts'))
      .forEach((task) => {
        import(`${tasksPath}/${task}`)
      })
  }
})
