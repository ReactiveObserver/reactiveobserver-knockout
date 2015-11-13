var rapi=require('reactiveobserver-client')
var ko=require('knockout')

var Observation=rapi.reactiveApi.Observation

Observation.prototype.toKoObservable = function(observe) {
  if(this.koObservable) return this.koObservable
  this.koObservable=ko.observable()
  var observable=this.koObservable
  var observer=function(signal,data) {
    switch(signal){
      case 'set': observable(data[0]); break
      default: observable.notifySubscribers(observable(),signal)
    }
    observable()
  }
  observable.connected=this.fapi.connected
  if(observe) this.addObserver(observer)
  var observations=observe ? 1 : 0
  if(!observe) {
    observable.beforeSubscriptionAdd=(function() {
      observations++
      if(observations==1) this.addObserver(observer)
    }).bind(this)
    observable.afterSubscriptionRemove=(function(){
      observations--
      if(observations==0) this.removeObserver(observer)
    }).bind(this)
  }

  return observable
}
Observation.prototype.toKoObservableArray = function(observe) {
  if(this.koObservableArray) return this.koObservableArray
  this.koObservableArray=ko.observableArray()
  var observable=this.koObservableArray
  var observer=function(signal,data) {
    //console.error(observable,signal,data)
    switch(signal){
      case 'set': observable(data[0]); break
      case 'pop':
      case "push":
      case "reverse":
      case "shift":
      case "splice":
      case "unshift":
        observable[signal].apply(observable,data)
        break
      case "removeBy":
        observable(observable().filter(function(item) {
          console.log(item,data)
          return JSON.stringify(item[data[0]]) != JSON.stringify(data[1])
        }))
        break
      case "updateBy":
        observable(observable().map(function(item){
          if(JSON.stringify(item[data[0]])==JSON.stringify(data[1])) return data[2]
          return item
        }))
        break
      case "updateFieldBy":
        observable(observable().map(function(item){
          if(JSON.stringify(item[data[0]])==JSON.stringify(data[1])) item[data[2]]=data[3]
          return item
        }))
        break
      case "moveBy":
        var d=observable()
        var pos=-1
        for(var i=0; i<d.length; i++) {
          if(JSON.stringify(d[i][data[0]])==JSON.stringify(data[1])) pos=i
        }
        console.log("F",pos)
        if(pos>=0 && pos<d.length) {
          var item=d[pos]
          console.log("!!",pos,data[2],item)
          observable.splice(pos,1)
          observable.splice(data[2],0,item)
        }
        break
      default: observable.notifySubscribers(observable(),signal)
    }
    observable()
  }
  if(observe) this.addObserver(observer)
  var observations=observe ? 1 : 0
  if(!observe) {
    observable.beforeSubscriptionAdd=(function() {
      observations++
      if(observations==1) this.addObserver(observer)
    }).bind(this)
    observable.afterSubscriptionRemove=(function(){
      observations--
      if(observations==0) this.removeObserver(observer)
    }).bind(this)
  }
  return observable
}

module.exports=rapi
