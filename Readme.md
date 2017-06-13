# Pergamum

[![Build Status](https://travis-ci.org/Arcath/pergamum.svg?branch=master)](https://travis-ci.org/Arcath/pergamum) [![Coverage Status](https://coveralls.io/repos/github/Arcath/pergamum/badge.svg?branch=master)](https://coveralls.io/github/Arcath/pergamum?branch=master)

JSON _database_ through the use of [SODB](https://github.com/Arcath/sodb) and file watchers.

Pergamum allows you to have multiple clients connected to the same folder all receive updated data as soon as another writes it.

## Install

Install Pergamum from NPM

```shell
npm install --save pergamum
```

## Usage

```javascript
const Pergamum = require('pergamum')

const path = require('path')

var db = new Pergamum({
  dir: path.join(__dirname, 'data'),
  create: true, // If the folder does not exist create it
  callback: function(){
    db.createStore('tasks', function(){
      db.addEntry('tasks', {task: 'learn pergamum', complete: false}, function(record){
        // Your database folder will now have a tasks.json with this task in.
      })
    })
  }
})
```

From here you can use [SODB](https://github.com/Arcath/sodb)s methods with an additional argument for the store.

```javascript
var incompleteTasks = db.where('tasks', {complete: false}, function(tasks){
  // tasks is an array of SODB entries.
})
```

# Warning

Pergamum is very early in development. There will be edge cases where it fails. If you use it in production ensure that there is regular backups of your data.
