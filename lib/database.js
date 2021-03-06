const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

const chokidar = require('chokidar')
const mkdirp = require('mkdirp')
const SODB = require('sodb')

const PergamumError = require('./error')

module.exports = class Pergamum{
  constructor(options){
    this.options = Object.assign({
      create: false,
      callback: function(){}
    }, options)

    this.locked = true
    this.lockQueue = []
    this.disposables = []
    this.emitter = new EventEmitter
    this.stores = {}
    this.writeLock = false

    if(this.options.create){
      mkdirp.sync(this.options.dir)
    }else{
      try{
        var exists = fs.statSync(options.dir)
      }catch(err){
        throw new PergamumError('"' + this.options.dir + '" does not exist')
      }
    }

    this.bindEvents()

    this.emitter.once('unlock', this.options.callback)

    this.prepare()
  }

  prepare(){
    var _ = this
    var count = 0
    fs.readdir(this.options.dir, function(err, files){
      files.forEach(function(file){
        var details = path.parse(file)

        count += 1
        fs.readFile(path.join(_.options.dir, file), {encoding: 'utf8'}, function(err, json){
          _.stores[details.name] = SODB.buildFromJSON(json)
          count -= 1

          if(count == 0){
            _.emitter.emit('unlock')
          }
        })
      })

      if(files.length == 0){
        _.emitter.emit('unlock')
      }
    })
  }

  bindEvents(){
    var _ = this

    this.emitter.on('unlock', function(){
      _.locked = false
    })

    this.emitter.on('disk-sync', function(name){
      if(_.writeLock){
        _.emitter.once('unlock', function(){
          _.emitter.emit('disk-sync', name)
        })
      }else{
        _.writeLock = true
        var json = _.stores[name].toJSON()
        fs.writeFile(path.join(_.options.dir, name + '.json'), json, {flag: 'w+'}, function(err){
          _.writeLock = false
          _.emitter.emit('unlock')
        })
      }
    })

    var watcher = chokidar.watch(this.options.dir)

    var watcherHandler = function(filePath){
      _.updateFromDisk(filePath)
    }

    watcher.on('add', watcherHandler)
    watcher.on('change', watcherHandler)

    this.disposables.push(watcher)
  }

  updateFromDisk(filePath){
    this.locked = true

    var _ = this
    var details = path.parse(filePath)

    var json = fs.readFile(filePath, {encoding: 'utf8'}, function(err, json){
      _.stores[details.name] = SODB.buildFromJSON(json)

      _.emitter.emit('unlock')
      _.emitter.emit('updated-' + details.name)
    })
  }

  close(){
    for(var disposable of this.disposables){
      disposable.close()
    }
  }

  createStore(name, cb){
    this.stores[name] = new SODB()
    this.locked = true
    this.emitter.emit('disk-sync', name)
    this.emitter.once('unlock', cb)
  }

  addEntry(store, record, cb){
    var _ = this

    if(this.locked){
      this.emitter.once('unlock', function(){
        _.addEntry(store, record, cb)
      })
    }else{
      var record = this.stores[store].add(record)
      process.nextTick(function(){
        _.emitter.emit('disk-sync', store)
        process.nextTick(function(){
          cb(record)
        })
      })
    }
  }

  store(name){
    return this.stores[name]
  }

  where(store, search, cb){
    var args = [].concat(search)
    var results = this.stores[store].where(...args)

    process.nextTick(function(){
      cb(results)
    })
  }

  findOne(store, search, cb){
    this.where(store, search, function(results){
      cb(results[0])
    })
  }

  all(store, cb){
    var results = this.stores[store].all()

    process.nextTick(function(){
      cb(results)
    })
  }

  unique(store, field, cb){
    var results = this.stores[store].unique(field)

    process.nextTick(function(){
      cb(results)
    })
  }

  order(store, search, field, cb){
    var args = [].concat(search)
    var results = this.stores[store].order(...args, field)

    process.nextTick(function(){
      cb(results)
    })
  }

  update(store, record, cb){
    if(record.changed()){
      this.stores[store].update(record)
      this.locked = true
      this.emitter.emit('disk-sync', store)
    }

    process.nextTick(function(){
      cb()
    })
  }

  remove(store, record, cb){
    this.stores[store].remove(record)
    this.locked = true
    this.emitter.emit('disk-sync', store)

    this.emitter.once('unlock', function(){
      cb()
    })
  }
}
