var Seneca = require('seneca')
var conf = require('../test-config')
var ztrans = require('../..')

Seneca({
  tag: 'printer1', transport: {
    zyre: {
      ...conf.config1,
      name: "listener1"
    }
  }
})
  .test('print')
  .use(ztrans)
  .client({ type: 'zyre' })
  .listen({ type: 'zyre' })
  .ready(function () {
    var seneca = this
    this.add('role:printers,cmd:getPrintersOnline', (msg, done) => {
      done(null, {
        printer: 'printer 1',
        status: 'online',
        observed$: true 
      })
      
    })
    this.add('type:typy,cmd:testing', (msg, done) => {
      done(null, {
        testy: true
      })
      
    })
  })

