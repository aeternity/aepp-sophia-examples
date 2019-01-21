# Recursive-Rename

[![Build Status](https://travis-ci.org/HeroProtagonist/recursive-rename.svg?branch=master)](https://travis-ci.org/HeroProtagonist/recursive-rename)
[![Codecov](https://img.shields.io/codecov/c/github/HeroProtagonist/recursive-rename.svg)](https://codecov.io/github/HeroProtagonist/recursive-rename)
[![NPM version](https://badge.fury.io/js/recursive-rename.svg)](https://www.npmjs.com/package/recursive-rename)

![walter-white](gif/walter-white.gif)

Recursive rename is a simple tool used to manipulate file names. 

It can be used from the command line or NodeJS. 

* [Installation](#installation)
* [Examples](#examples)
* [Usage](#usage)
	- [Command Line](#command-line)
	- [Node](#node) 

## Examples

### CLI

	rename jsx js

Rename all `.jsx` files to `.js` in current directory. By default `node_modules` and `.git` are excluded from the crawl. This can be overridden and/or extended.

	rename jsx js --dry
Adding the dry flag will return the files that **would** be changed.	
###  Node

Equivalent operations can be performed in Node

```
import Rename = 'recursive-rename'

const rename = new Rename({
  src: 'jsx',
  dest: 'js',
})

rename.dive()
```

Add dry option to get insight on the renaming process without performing it

```
rename.dive({
  dry: true,
})
```



## Installation

`yarn add recursive-rename`

or

`yarn global add recursive-rename`

- Global installation with expose the `rename` command

If you have not switched to [yarn](https://yarnpkg.com/). Simply use `npm`

`npm install recursive-rename`

- use `-g` flag for global installation


## Usage

### Comand Line

`rename $SRC $DEST`

**$SRC** will be the extensions that will be renamed to **$DEST** extension. These are required. If the path is not provided it will default to the current directory.


Optional flags

```
 --dry [if present the renaming will not occur, but a list of the changes that would occur are shown]
 --exclude [set to folder that should not be touched]
 --override [if present remove default excluded folders. These are .git and node_modules]
 --path [set to path of folder to rename if not targeting current directory]
```

Informational flags

```
--help
--version
```

### Node

Using babel

	import Rename from 'recursive-rename'

or 

	const Rename = require('recursive-rename')

#### Rename(options)

Create a new instance that will be used to traverse directory and perform renaming. 

##### Options [object]
	- src [string]: required
	- dest [string]: required
	- exclude [array]
	- override [array]

#### Renaming


#### dive(options)
Once instantiated rename has the `dive` method. This will perform the crawl based on the options supplied to `Rename` constructor.

##### Options [object]
	- dry [bool] (if present renaming will not occur and output will be list of what would) 

