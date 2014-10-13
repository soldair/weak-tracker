weak-tracker
============

track collections of weak refrences for debugging memory leaks.


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
