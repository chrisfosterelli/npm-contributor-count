
/* Npm Contributor Count
 * Count how many contributors have access to a npm package
 */

const _ = require('lodash')
const axios = require('axios')
const semver = require('semver')
const Promise = require('bluebird')
const Throttle = require('promise-throttle')

const cache = {}
const visited = {}

const requestsPerSecond = 10
const promiseImplementation = Promise
const throttle = new Throttle({ requestsPerSecond, promiseImplementation })

function npmContributorCount(pckgs) {
  const set = pckgs.length ? pckgs : [ pckgs ]
  return fetchMaintainers(set)
  .then(contributors => contributors.length)
}

// Fetch a list of maintainers
// for an array of packages
function fetchMaintainers(pckgs) {
  const promises = pckgs.map(pckg => {
    return fetchPackage(pckg.name)
    .then(metadata => parseMaintainers(metadata, pckg.version))
  })
  return Promise.all(promises)
  .then(results => _.flatten(results))
  .then(results => _.uniq(results))
}

// Fetch a package's metadata
// Rate limit and cache as needed
function fetchPackage(name) {
  const npm = 'https://registry.npmjs.org/'
  const url = npm + name.split('@')[0]
  if (cache[url]) return Promise.resolve(cache[url])
  return throttle
  .add(() => axios.get(url))
  .then(resp => {
    cache[url] = resp.data
    return resp.data
  })
}

// Parse the set of maintainers from a package's
// npm metadata for a given target version
function parseMaintainers(metadata, version) {
  const key = metadata.name + '@' + version
  const target = parseVersion(metadata, version)
  const maintainers = metadata.maintainers.map(m => m.name)
  if (visited[key]) return [] // Avoid cycling dependencies
  else visited[key] = true
  if (!target || !target.dependencies) return maintainers
  const dependencies = Object.keys(target.dependencies).map(name => {
    const version = target.dependencies[name]
    return { name, version }
  })
  return fetchMaintainers(dependencies)
  .then(deepMaintainers => maintainers.concat(deepMaintainers))
}

// Parse package metadata for a 
// specific version of the package
function parseVersion(metadata, version) {
  const all = Object.keys(metadata.versions)
  const target = metadata['dist-tags'][version] || version
  const resolved = semver.maxSatisfying(all, target)
  return metadata.versions[resolved]
}

module.exports = npmContributorCount
