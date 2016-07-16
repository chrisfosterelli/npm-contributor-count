
/* Script
 */

const _ = require('lodash')
const axiosn = require('axios')
const semver = require('semver')
const pthrottle = require('promise-throttle')
const Promise = require('bluebird')

var throttle = new pthrottle({
  requestsPerSecond: 10,     // up to 10 requests per second 
  promiseImplementation: Promise
});


const axios = axiosn.create({
  timeout: 100000
})

const npm = 'https://registry.npmjs.org/'

const reqCache = {}

const cache = {}

function getUsers(metadata) {
  const maintainers = metadata.maintainers
  const users = maintainers.map(m => m.name)
  return users
}

function resolve(pckgs) {
  const promises = pckgs.map(pckg => {
    const url = npm + pckg.name.split('@')[0]
    if (reqCache[url]) {
      console.log('Skipping request!')
      const resp = reqCache[url]
      const versions = Object.keys(resp.data.versions)
      const targetVersion = resp.data['dist-tags'][pckg.version] || pckg.version
      const version = semver.maxSatisfying(versions, targetVersion)
      const depPackage = resp.data.versions[version]
      //
      const key = pckg.name + version
      if (cache[key]) { return Promise.resolve([]) }
      else cache[key] = true
      //
      if (!depPackage.dependencies) return Promise.resolve(getUsers(resp.data))
      const dependencies = depPackage.dependencies
      const pckgs = Object.keys(dependencies).map(name => {
        const version = dependencies[name]
        return { name, version }
      })
      return resolve(pckgs).then(values => {
        const users = getUsers(resp.data)
        return users.concat(values)
      })
    }
    return throttle.add(() => {
      return axios.get(url)
      .then(resp => {
        reqCache[url] = resp
        const versions = Object.keys(resp.data.versions)
        const targetVersion = resp.data['dist-tags'][pckg.version] || pckg.version
        const version = semver.maxSatisfying(versions, targetVersion)
        const depPackage = resp.data.versions[version]
        //
        const key = pckg.name + version
        if (cache[key]) { return [] }
        else cache[key] = true
        //
        if (!depPackage.dependencies) return getUsers(resp.data)
        const dependencies = depPackage.dependencies
        const pckgs = Object.keys(dependencies).map(name => {
          const version = dependencies[name]
          return { name, version }
        })
        return resolve(pckgs).then(values => {
          const users = getUsers(resp.data)
          return users.concat(values)
        })
      }).catch(err => console.log(url, err))
    })
  })
  return Promise.all(promises)
  .then(results => {
    return _.flatten(results)
  })
}

function makePackage(argp, argv) {
  const name = argp
  const version = argv || 'latest'
  const pckg = { name, version }
  return [ pckg ]
}

function getLocalPackage() {
  const json = require('../package.json')
  return Object.keys(json.dependencies)
  .map(name => {
    const version = json.dependencies[name]
    return { name, version }
  })
}

const argp = process.argv[2]
const argv = process.argv[3]
const set = argp ? makePackage(argp, argv) : getLocalPackage()

resolve(set)
.then(result => _.uniq(result))
.then(contributors => contributors.length)
.then(count => console.log(count))
.catch(err => console.error(err))
