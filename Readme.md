# Pergamum

[![Build Status](https://travis-ci.org/Arcath/pergamum.svg?branch=master)](https://travis-ci.org/Arcath/pergamum) [![Coverage Status](https://coveralls.io/repos/github/Arcath/pergamum/badge.svg?branch=master)](https://coveralls.io/github/Arcath/pergamum?branch=master)

JSON _database_ through the use of [SODB](https://github.com/Arcath/sodb) and file watchers.

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
      db.addEntry('tasks', {task: 'learn pergamum', complete: false}, function(){
        // Your database folder will now have a tasks.json with this task in.
      })
    })
  }
})
```
