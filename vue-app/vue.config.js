const { spawnSync } = require('child_process') // eslint-disable-line @typescript-eslint/no-var-requires
const gitDescribeResult = spawnSync('git', ['describe', '--always'])
process.env.VUE_APP_GIT_COMMIT = gitDescribeResult.stdout.toString().trim()

module.exports = {
  publicPath: './',
  productionSourceMap: false,
}
