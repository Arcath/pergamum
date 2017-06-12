function PergamumError(message){
  this.name = 'Pergamum Error'
  this.message = message || 'Pergamum has run into a problem'
  this.statck = (new Error()).stack
}

PergamumError.prototype = Object.create(Error.prototype)
PergamumError.prototype.constructor = PergamumError

module.exports = PergamumError
