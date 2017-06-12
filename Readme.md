# Pergamum

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
