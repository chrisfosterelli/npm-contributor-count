
/* Command line script
 */

const ora = require('ora')
const count = require('../lib/count')

function getLocalPackages() {
  const json = require(process.cwd() + '/package.json')
  const dependencies = json.dependencies
  const keys = Object.keys(dependencies)
  return keys.map(name => {
    const version = dependencies[name]
    return { name, version }
  })
}

function finish(count, spinner, name = 'local package') {
  spinner.stop()
  console.log(name, 'has', count,
    'contributors with access to the project or its dependencies')
}

const name = process.argv[2]
const version = process.argv[3] || 'latest'

const target = name ?
  { name, version } :
  getLocalPackages()

const spinner = ora('Crawling project dependency tree')
spinner.start()

count(target)
.then(count => finish(count, spinner, target.name))
.catch(err => console.error(err))
