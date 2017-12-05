# tunk-request

## browser asynchronous http requests for tunk, which supports async/await

### global config
````javascript

import tunkRequest from "tunk-request";

tunk.use([
  tunkRequest({
    maxQueueLength: 100, //最大请求状态队列数
    onBeforeSend: () => {},
    onComplite: dataString => (dataString),
    onSuccess: (res, xhr, setting) => {},
    onError: (error, xhr, setting) => {}
  })
]);
````
#### tunk-request初始化的时候会创建名为 REQUEST tunk模块，用于存储所有的请求状态
#####  REQUEST状态字段 
````javascript
this.state = {
      pending: false,
      queue: [], //{status,...extra,id:''}
  };
````
### Methods
````javascript

    request(Options);
    
    //
    request.get( url, data, success, error, dataType )

    request.post( url, data, success, error, dataType ) 

    request.getJson( url, data, success, error ) 

    request.jsonp( url, data, success, error ) 

````



