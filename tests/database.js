const fs = require('fs')
const path = require('path')

const Pergamum = require('../')
const PergamumError = require('../lib/error')

const {expect} = require('chai')

describe('Database', function(){
  var db = null

  afterEach(function(){
    if(db != null){
      db.close()
    }
  })

  it('should throw an error if the file path does not exist', function(){
    expect(function(){
      db = new Pergamum({
        dir: path.join(__dirname, 'dbs', 'test')
      })
    }).to.throw(PergamumError, /test" does not exist/)
  })

  it('should create the directory if create is true', function(){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      create: true
    })

    try{
      var exists = fs.statSync(path.join(__dirname, 'dbs', 'test'))
    }catch(err){
      throw new Error("folder does not exist, test failed")
    }
  })

  it('should create a store', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test')
    })

    db.createStore('test', function(){
      process.nextTick(function(){
        try{
          var exists = fs.statSync(path.join(__dirname, 'dbs', 'test', 'test.json'))
        }catch(err){
          throw new Error("file does not exist, test failed")
          done()
        }

        done()
      })
    })
  })

  it('should add data to the database', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        db.addEntry('test', {name: 'foo', age: 20}, function(){
          expect(db.stores.test.count()).to.equal(1)
          done()
        })
      }
    })
  })

  it('should have saved the record to the database', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        expect(db.stores.test.count()).to.equal(1)

        db.where('test', {name: 'foo'}, function(records){
          expect(records.length).to.equal(1)
          done()
        })
      }
    })
  })

  it('should find one record', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        expect(db.stores.test.count()).to.equal(1)

        db.findOne('test', {name: 'foo'}, function(result){
          expect(result.name).to.equal('foo')
          done()
        })
      }
    })
  })

  it('should find all records', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        expect(db.stores.test.count()).to.equal(1)

        db.all('test', function(results){
          expect(results.length).to.equal(1)

          done()
        })
      }
    })
  })

  it('should find unique records', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        expect(db.stores.test.count()).to.equal(1)

        db.unique('test', 'name', function(results){
          expect(results.length).to.equal(1)

          done()
        })
      }
    })
  })

  it('should order results', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        expect(db.stores.test.count()).to.equal(1)

        db.order('test', {name: 'foo'}, 'name', function(results){
          expect(results.length).to.equal(1)
          done()
        })
      }
    })
  })

  it('should give access to the underlying SODB', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        expect(db.stores.test.count()).to.equal(1)

        var sodb = db.store('test')

        expect(sodb.lastInsertId).to.equal(0)
        done()
      }
    })
  })

  it('should update data', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        expect(db.stores.test.count()).to.equal(1)

        db.findOne('test', {name: 'foo'}, function(result){
          expect(result.name).to.equal('foo')
          expect(result.changed()).to.equal(false)

          result.name = 'fooo'

          expect(result.changed()).to.equal(true)

          db.update('test', result, function(){
            done()
          })
        })
      }
    })
  })

  it('should remove data', function(done){
    db = new Pergamum({
      dir: path.join(__dirname, 'dbs', 'test'),
      callback: function(){
        expect(db.stores.test.count()).to.equal(1)

        db.addEntry('test', {name:'rem', age: 10}, function(record){
          expect(db.stores.test.count()).to.equal(2)

          db.remove('test', record, function(){
            expect(db.stores.test.count()).to.equal(1)

            done()
          })
        })
      }
    })
  })

  describe('Locking', function(){
    it('should not add an entry untill the database unlocks', function(done){
      db = new Pergamum({
        dir: path.join(__dirname, 'dbs', 'test'),
        callback: function(){
          expect(db.stores.test.count()).to.equal(1)

          db.locked = true

          db.addEntry('test', {name: 'bar', age: 10})
          expect(db.stores.test.count()).to.equal(1)

          db.emitter.once('unlock', function(){
            expect(db.stores.test.count()).to.equal(2)
            done()
          })

          db.emitter.emit('unlock')
        }
      })
    })
  })

  describe('File Syncing', function(){
    var db1 = null
    var db2 = null

    afterEach(function(){
      if(db1 != null){
        db1.close()
      }

      if(db2 != null){
        db2.close()
      }
    })

    it('should sync changes', function(done){
      db1 = new Pergamum({
        dir: path.join(__dirname, 'dbs', 'test'),
        callback: function(){
          expect(db1.stores.test.count()).to.equal(2)

          db2 = new Pergamum({
            dir: path.join(__dirname, 'dbs', 'test'),
            callback: function(){
              expect(db2.stores.test.count()).to.equal(2)

              db2.addEntry('test', {name: 'widget', age: 30}, function(){
                expect(db2.stores.test.count()).to.equal(3)

                db1.emitter.once('unlock', function(){
                  expect(db1.stores.test.count()).to.equal(3)

                  done()
                })
              })
            }
          })
        }
      })
    })
  })
})
