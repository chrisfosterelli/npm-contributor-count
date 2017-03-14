NPM Contributor Count
=====================

This is a tool that counts the number of people who have access to a project on 
npm, either directly or indirectly. Every single module you import, or any 
module that those modules import (and so on), can put your project at risk so
it is important to understand the exposure you are receiving when you add an npm
package as a dependency to your project. I've writte a bit about this [here].

This package requires a minimum of Node 6, as many ES6 features are used.

Installing
----------

```bash
npm install -g contributor-count
```

Usage
-----

To test all of the dependencies for the package in your local directory:

```bash
> contributor-count
local package has 19 contributors with access to the project or its dependencies
>
```

To test all of the dependencies for a given package on npm:

```bash
> contributor-count express
express has 51 contributors with access to the project or its dependencies
>
```

You can also use it as a library:

```javascript
const count = require('contributor-count')

count(target)
.then(count => console.log('The count is', count))
.catch(err => console.error('Failed to get count', err))
```

Technical Notes
---------------

This counter does not consider packages which reference off-npm sources, such 
as a direct git repository or a tar file since it's not clear how to quantify
the number of people with access to these reliably.

This counter only considers the number of people with direct npm publish rights
for the package or one of its dependencies. It does not consider the possibility
of a vulnerability being introduced through a packages repository or CI system.

This counter only considers dependencies which are required for usage and does
not include unlisted dependencies, peer dependencies, or developer dependencies.

[here]: https://fosterelli.co/stealing-credentials-with-a-malicious-node-module.html
