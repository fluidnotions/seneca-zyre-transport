var Seneca = require('seneca')
var conf = require('../test-config')
var ztrans = require('../..')

Seneca({
  tag: 'printer2', transport: {
    zyre: {
      ...conf.config2,
      name: "listener2"
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
        printer: 'printer 2',
        status: 'online',
        observed$: true 
      })
      
    })
  })

