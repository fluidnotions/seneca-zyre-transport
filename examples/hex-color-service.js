var Seneca = require('seneca')
var conf = require('./test-config')
var ztrans = require('..')

Seneca({
  tag: 'hex-service', transport: {
    zyre: {
      ...conf.config2,
      name: "service"
    }
  }
})
  .test('print')
  .use(ztrans)
  .client({ type: 'zyre' })
  .listen({ type: 'zyre' })
  .ready(function () {
    var seneca = this
    this.add('role:color,format:hex', (msg, done) => {
      done(null, {
        color: 'hex string -- this is the result',
        format: 'hex'
      })
    })
    console.log('hex', seneca.id)
  })

