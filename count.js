
/* Count
 * Count the number of contributors a package has
 */

const axios   = require('axios')
const _       = require('lodash')
const Promise = require('bluebird')
const ls      = require('npm-remote-ls')

const npm = 'https://registry.npmjs.org/'

resolve(process.argv[2])
.then(count => console.log('Number of contribs:', count))
.catch(err => console.error(err))

function resolve(pckg) {
  return new Promise((resolve, reject) => {
    ls.ls(pckg, 'latest', true, list => {
      const promises = []
      list.forEach(pckg => {
        promises.push(getContributors(pckg))
      })
      Promise.all(promises)
      .then(sets => _.flatten(sets))
      .then(flattened => _.uniq(flattened))
      .then(contributors => contributors.length)
      .then(count => resolve(count))
      .catch(err => reject(err))
    })
  })
}

function getContributors(pckg) {
  const url = npm + pckg.split('@')[0]
  return axios.get(url)
  .then(resp => {
    const metadata = resp.data
    const maintainers = metadata.maintainers
    const users = maintainers.map(m => m.name)
    return users
  })
}
