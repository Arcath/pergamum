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
    fs.readdir(this.options.dir, function(err, files){
      files.forEach(function(file){
        var details = path.parse(file)

        var json = fs.readFileSync(path.join(_.options.dir, file)).toString()
        _.stores[details.name] = SODB.buildFromJSON(json)
      })

      _.emitter.emit('unlock')
    })
  }

  bindEvents(){
    var _ = this

    this.emitter.on('unlock', function(){
      _.locked = false
    })

    this.emitter.on('disk-sync', function(name){
      var json = _.stores[name].toJSON()
      fs.writeFile(path.join(_.options.dir, name + '.json'), json, function(err){
        _.emitter.emit('unlock')
      })
    })

    var watcher = chokidar.watch(this.options.dir)

    watcher.on('add', function(filePath){
      _.updateFromDisk(filePath)
    })
    watcher.on('change', function(filePath){
      _.updateFromDisk(filePath)
    })

    this.disposables.push(watcher)
  }

  updateFromDisk(filePath){
    this.locked = true

    var details = path.parse(filePath)

    var json = fs.readFileSync(filePath).toString()
    this.stores[details.name] = SODB.buildFromJSON(json)

    this.emitter.emit('unlock')
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
      var recored = this.stores[store].add(record)
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
}
