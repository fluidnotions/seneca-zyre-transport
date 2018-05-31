![Seneca](http://senecajs.org/files/assets/seneca-logo.png)<br/>
proximity p2p transport plugin using zyre.js

# seneca-zyre-transport


__Note:__ This is broadcast transport. All subscribed micro-services receive all messages. Hoverver responses are send directly back to the caller, contributions that incorperate seneca-balance-client as a dependency are welcome, having to include pins/load balance peers doesn't really fit my use case. <br/>
So if a response/done call contains the property observed$: true, the message id isn't removed from the lru cache (in default seneca-transport package) and the calling 'act' can recieve responses from multiple seneca peers that have the pattern. Not sure if leaving the message id in the cache might cause other issues. <br/>
Next will be adding pattern so 'list' can be called on the collective p2p mesh, if we know how many responses to expect the the calling 'act' can then remove the message id from the the cache when they are all recieved. <br/>
(my library that wraps seneca uses rxjs so it makes sense to have responses comming back as a stream)<br/>
**if you have experience with seneca and this approach doesn't make sense for some reason please open an issue, I've only just begun to explore the callback hell which is seneca's internals and have barely a clue what's cuttin in there**


### Seneca compatibility
Tested on  **3.5**

## Install
To install, simply use npm.

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
