
var http = require("http");
var test = require("tape");
var hyperquest = require("hyperquest")

test("can i track weak refs on requests",function(){
  // get a new instance of the tracker rather than singleton;
  var wt = require("../").WeakTracker();

  var leaks = [];

  var server = http.createServer(function requestHandler(req,res){
    // make a route to vew refs to request.
    if(req.url == "/refs"){
      res.end(JSON.stringify(wt.refs),null," ");
      return;
    }

    wt.track('request',req);
    wt.track('response',res);
    leaks.push(req);
    console.log("request");
    res.end("i leaked a request");
  }).listen(0,function(){

  });

  setInterval(function(){
    hyperquest("http://localhost:"+server.address().port,function(err,res){
      if(err) throw err;
      res.pipe(require("concat-stream")(function(body){
        console.log('response body> ',body+'');
      }))
    })

    if(global.gc) gc();
    console.log(wt.refs);
  },5000);


})



