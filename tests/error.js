const PergamumError = require('../lib/error')

const {expect} = require('chai')

describe('Error', function(){
  it('should have a default message', function(){
    var error = new PergamumError()

    expect(error.message).to.equal('Pergamum has run into a problem')
  })
})
