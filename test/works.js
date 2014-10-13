var test = require('tape');
var wt = require('../');

test("works",function(t){

  function Leaker(){

  }

  var tracker = wt.WeakTracker();

  tracker.track('leaker',new Leaker());
  tracker.track('leaker',new Leaker());
  tracker.track('leaker',new Leaker());
  tracker.track('leaker',new Leaker());
  tracker.track('leaker',new Leaker());

  t.equals(tracker.refs['leaker']._total,5,'should have 5 not leaking');

  gc();

  
  t.ok(!tracker.refs['leaker'],'should have 0 left after gc');
  t.end();
});
