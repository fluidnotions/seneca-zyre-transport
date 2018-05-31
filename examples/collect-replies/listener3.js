var Seneca = require('seneca')
var conf = require('../test-config')
var ztrans = require('../..')

Seneca({
  tag: 'printer3', transport: {
    zyre: {
      ...conf.config3,
      name: "listener3"
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
        printer: 'printer 3',
        status: 'online',
        observed$: true 
      })
      
    })
  })

