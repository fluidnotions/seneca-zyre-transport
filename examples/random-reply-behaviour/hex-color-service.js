var Seneca = require('seneca')
var conf = require('../test-config')
var ztrans = require('../..')

Seneca({
  tag: 'hex-service1', transport: {
    zyre: {
      ...conf.config1,
      debug: {ztrans: true}
    }
  }
})
  .test('print')
  .use(ztrans)
  // .client({ type: 'zyre' })
  .listen({ type: 'zyre' })
  .ready(function () {
    var seneca = this
    this.add('role:color,format:hex', (msg, done) => {
      setTimeout(()=> {
        done(null, {
          color: 'hex string -- this is the result (from service 1)',
          format: 'hex'
        })
      }, 2000)
    })
    // console.log('hex', seneca.id)
  })

