![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] proximity p2p transport plugin using zyre.js  

# seneca-zyre-transport
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter][gitter-badge]][gitter-url]

[![js-standard-style][standard-badge]][standard-style]

__Note:__ This is broadcast transport. All subscribed micro-services receive all messages. Hoverver responses are send directly back to the caller

### Seneca compatibility
Tested on  **3.5**

## Install
To install, simply use npm. Remember you will need to install [Seneca.js][] if you haven't already.

```sh

npm install seneca --save
npm install seneca-zyre-transport --save

```

## Quick Example
**examples can be found in expamples folder**
```js
Seneca({
  tag: 'hex-service', transport: {
    zyre: {
      ...conf.config2b,
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
```

```js
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
```