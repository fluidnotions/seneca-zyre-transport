var Seneca = require('seneca')
var conf = require('../test-config')
var ztrans = require('../..')

Seneca({
  tag: 'client'
})
  .test('print')
  .use(ztrans, {
    zyre: {
      ...conf.config3,
      debug: { ztrans: true }
    }
  })
  .client({ type: 'zyre' })
  .listen({ type: 'zyre' })
  .ready(function () {

    let c 
    let i = setInterval(() => {
      c++;
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
      if (c > 3) clearInterval(i)
    }, 10000)

  })

  // this.act(
    //   { role: 'transport', type: 'zyre', cmd: 'getPeerIps', },
    //   function (err, out) {
    //     console.log(err && err.message || out.color)
    //     // this.close()
    //   })


