var Seneca = require('seneca')
var conf = require('../test-config')
var ztrans = require('../..')

Seneca({
  tag: 'client', log: 'silent'
})
.test('print')
  .use(ztrans, {
    zyre: {
      ...conf.config1b,
      name: "client"
    }
  })
  .client({ type: 'zyre' })
  .listen({ type: 'zyre' })
  .ready(function () {

    setInterval(() => {
      this.act(
        {
          role: 'color',
          format: 'hex',
          color: 'red'
        },
        function (err, out) {
          console.log(err && err.message || out.color)
          // this.close()
        })
    }, 5000)

  })

  // this.act(
    //   { role: 'transport', type: 'zyre', cmd: 'getPeerIps', },
    //   function (err, out) {
    //     console.log(err && err.message || out.color)
    //     // this.close()
    //   })


