# tunk-request


#### ajax请求工具插件，支持promise

### 安装
````javascript
npm install tunk-request -S
````

### 引用

import tunkRequest from "tunk-request";

tunk.use([
  tunkRequest({
    onBeforeSend: () => {},
    onComplite: dataString => (dataString),
    onSuccess: (res, xhr, setting) => {},
    onError: (error, xhr, setting) => {}
  })
]);
````

### Methods
````javascript
import {create, action} from 'tunk';

@create
export default class app {
    constructor(){ 
    
        this.state = {
        	hello: 'tunk-request'
        };

        this.request(Options)
    
        // 便捷方法，仅支持 url, data, success, error, dataType 参数，且参数顺序可不固定
        // 第一个字符串 视为 url， 第一个function 视为 success

        this.request.get( url, data, success, error, dataType )

        this.request.post( url, data, success, error, dataType ) 

        this.request.getJson( url, data, success, error ) 

        this.request.jsonp( url, data, success, error ) 
    }
    @action
    async getData(){
      const res = await this.request.get( url, data, success, error, dataType )
      return {hello: res.tunk.request}
    }
}
    

````
### Options

````javascript
    // Default type of request
    type: 'GET',
    // html  json  script  xml  text
    dataType: '',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
        return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as "application/x-javascript"
    accepts: {
        script: 'text/javascript, application/javascript, application/x-javascript',
        json: jsonType,
        xml: 'application/xml, text/xml',
        html: htmlType,
        text: 'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true,
    //Used to handle the raw response data of XMLHttpRequest.
    //This is a pre-filtering function to sanitize the response.
    //The sanitized response should be returned
    dataFilter: empty

````

----

[tunk doc](https://github.com/tunkjs/gitbook-tunkjs)


