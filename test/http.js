
var http = require("http");
var test = require("tape");
var hyperquest = require("hyperquest")

test("can i track weak refs on requests",function(t){

  t.ok(global.gc,"requires gc");
  if(!global.gc) throw "must have gc try --expose-gc flag";

  // get a new instance of the tracker rather than singleton;
  var wt = require("../").WeakTracker();

  var leaks = [];

  var server = http.createServer(function requestHandler(req,res){

    console.log('request')

    wt.track('request',req);
    wt.track('response',res);
    leaks.push(req);

    res.end('leaked.')

  }).listen(0,function(){
    console.log('listen!!!');

    hyperquest("http://localhost:"+server.address().port,function(err,res){
      if(err) throw err;
      res.pipe(require("concat-stream")(function(body){
        console.log('response body> ',body+'');

        t.ok(body,'should have request body.');
        t.equals(leaks.length,1);
        gc();

        t.equals(wt.refs['request']._total,1,'should have one request tracked');
        t.ok(!wt.refs['response'],'should not have leaked responses');


        leaks = [];;

        gc();

        t.ok(!wt.refs['request'],'yay no leak!');
        t.end();
        server.close();

      }))
    })


  });


})



