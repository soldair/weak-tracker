var weak = require("weak");
var EventEmitter = require('events').EventEmitter;

//for more information about which code path of yours results in these leaked objects
//Error.stackTraceLimit = 20;

// singleton.
module.exports = function fn(){
  if(!fn.active) fn.active = module.exports.WeakTracker();
  return fn.active;
}


module.exports.WeakTracker = function(){

  var id = 0;
  var em = new EventEmitter();

  em.refs = {};
  em._weak = {};

  em.track = function(key,obj){

    var origin = appOrigin();

    if(!em.refs[key]){
      em.refs[key] = {_total:0};
    }

    if(!em.refs[key][origin]){
      em.refs[key][origin] = 0;
    }

    em.emit('ref',key,origin);
    em.refs[key][origin]++;
    em.refs[key]._total++;

    id = incId(id);
    // hold the actual weak ref instance so we can introspect objects that are not getting gc'ed
    em._weak[id] = weak(obj,gcCb(key,origin,id));
    // return the weak because ^ is just for internal book keeping.
    return em._weak[id];
  }

  function gcCb(key,origin,id){
    return function(){
 
      var ref = em._weak[id];
      if(!ref) {
        this.emit('log',"gc event with no weak ref in map.",key,origin,id);
        // someone may have manually cleaned out _weak. =/
        return;
      }

      delete em._weak[id];

      em.emit('gc',key,origin,ref); 

      em.refs[key][origin]--;
      em.refs[key]._total--;

      if(em.refs[key][origin] === 0) {
        delete em.refs[key][origin];
        if(em.refs[key]._total === 0){
          delete em.refs[key];
        }
      }
    }
  }

  return em;
}

function appOrigin(stack,recur){
  var s = stack||(new Error()).stack;

  var lines = s.split("\n")
  lines.splice(0,3);
  
  var last;
  for(var i=0;i<lines.length;i++){
    last = lines[i];
    if(last.indexOf("node_modules/") === -1 ){
      var f = last.split("(").pop().split(")").shift();
      if(f.indexOf('/') !== -1) {
        // if its a core file in the stack it wont have the full path just the file name.
        break;
      }
    }
  }

  //if(last.indexOf('(timers.js') != -1 || last.indexOf('weak-tracker/index.js') != -1){
  //}

  return last.trim();

}



function incId(id){
  ++id;
  if(id == 9007199254740992) id = 0;
  return id; 
}
