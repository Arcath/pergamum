const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const path = require('path')

describe('Test Setup', function(){
  it('should clear the test directory', function(done){
    rimraf(path.join(__dirname, 'dbs'), function(){
      mkdirp(path.join(__dirname, 'dbs'), function(){
        done()
      })
    })
  })
})
