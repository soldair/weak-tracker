weak-tracker
============

track collections of weak refrences for debugging memory leaks.



crash course!

```js
var wt = require("weak-tracker")();

wt.on("gc",function(key,lineOrigin){
  console.log("gc ",key,lineOrigin);
})

var leaks = [];

http.createServer(function requestHandler(req,res){
  // make a route to vew refs to request.
  if(req.url == "/refs"){

    // node should be run with the --expose-gc flag when chasing these down 
    // because node wont do full complete gcs very often unless you are reeally running out of ram.
    if(global.gc) gc();
    res.end(JSON.stringify(wt.refs),null," ");
    return;
  } 

  if(req.url == "/free"){
    leaks = [];
    res.end("freed requests!");
    return;
  }


  wt.track('request',req);
  wt.track('response',res);
  leaks.push(req);

  res.end("i leaked a request");

}).listen(0,function(){
  console.log("listening on ",'http://'+server.address().host+""+server.address().port);
});


```

why --expose-gc
-------------------
In this example requests leak and responses do not.

It is super important to expose gc when explictly hunting leaks so you dont spend time chasing your own tail.

this is what refs will looks like if you do not call gc first.

```
{ request: 
   { _total: 2,
     'at Server.requestHandler (...../opensource/weak-tracker/test/http.js:19:8)': 2 },
  response: 
   { _total: 2,
     'at Server.requestHandler (...../opensource/weak-tracker/test/http.js:20:8)': 2 } }

```

with expose gc and calling gc() before lookling at refs you know its only objects that are activly referenced.

```
{ request: 
   { _total: 2,
     'at Server.requestHandler (...../opensource/weak-tracker/test/http.js:19:8)': 2 } }
```

you should be able to use this module to passively monitor counts of different objects in memory without expose-gc in production for logging in zag/statsd and see why you are running out of ram.


what is this line number business?
----------------------------------

the first line as i traverse up the stack that does not belong to a nested node module is included with the reference tracking.
this lets you place debug weak-tracker calls in nested node modules so you can see which of your code paths result in a leak of .. lets say mongo embeded documents for example.

i use the module strong-memwatch to find what objects are leaking in nested modules. the gc function of strong memwatch is an incomplete gc. if you use it rather than --expose-gc refs will appear active that are sill scheduled for a future gc.
its better than nothing if you can usxe the stop the world gc in whatever environment you are running.


