var rapi=require('reactiveobserver-client')
var ko=require('knockout')

var Observation=rapi.reactiveApi.Observation

Observation.prototype.readSymbol = function(s) {
  return s
}

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
  var observer=(function(signal,data) {
  //  console.error('KOARRAY',observable,signal,data)
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
      case "setElement":
        observable.splice(data[0],1,data[1])
        break
      case "remove":
        var eds=JSON.stringify(data[0])
        observable(observable().filter(function(item) {
         // console.log(item,data)
          return JSON.stringify(item) != eds
        },this))
        break
      case "removeBy":
        observable(observable().filter(function(item) {
        //  console.log(item,data)
          return JSON.stringify(item[this.readSymbol(data[0])]) != JSON.stringify(data[1])
        },this))
        break
      case "updateBy":
        observable(observable().map(function(item){
         // console.log("UD",this.readSymbol(data[0]),item,JSON.stringify(item[this.readSymbol(data[0])]),JSON.stringify(data[1]))
          if(JSON.stringify(item[this.readSymbol(data[0])])==JSON.stringify(data[1])) return data[2]
          return item
        },this))
        break
      case "updateFieldBy":
        var arr=observable()
        var id=-1
        var sd=JSON.stringify(data[1])
        for(var i=0; i<arr.length; i++) {
          var item = arr[i]
          if (JSON.stringify(item[this.readSymbol(data[0])]) == sd) id = i
        }
        if(id!=-1) {
          arr[id][this.readSymbol(data[2])]=data[3]
          observable.splice(id,1,JSON.parse(JSON.stringify(arr[id])))
        }
        break
      case "moveBy":
        var d=observable()
        var pos=-1
        for(var i=0; i<d.length; i++) {
          if(JSON.stringify(d[i][this.readSymbol(data[0])])==JSON.stringify(data[1])) pos=i
        }
       // console.log("F",pos)
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
  }).bind(this)
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
