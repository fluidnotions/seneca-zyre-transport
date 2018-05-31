var Seneca = require('seneca')
var conf = require('../test-config')
var ztrans = require('../..')

Seneca({
  tag: 'client'
})
  .test('print')
  .use(ztrans, {
    zyre: {
      ...conf.config4,
      debug: undefined,
      name: "client"
    }
  })
  .client({ type: 'zyre' })
  .listen({ type: 'zyre' })
  .ready(function () {

    //seneca might be ready but the zryre transport isn't?
    let count = 0;
    let i = setInterval(() => {
      count++
      this.act(
        { role: 'printers', cmd: 'getPrintersOnline'},
        function (err, out) {
          console.log(err && err.message || out)
          // this.close()
        })
      if (count > 10) clearInterval(i);
    }, 10000)


  })




