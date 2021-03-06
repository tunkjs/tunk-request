; (function () {

    var jsonpID = 1,
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/,
        originAnchor = document.createElement('a'),
        queue = [],
        maxQueueLength,
        hooks = {
            onBeforeSend: function () { },
            onComplite: function () { },
            onSuccess: function () { },
            onError: function () { }
        };

    originAnchor.href = window.location.href;


    function request_init(opts) {

        if (opts) {
            // base host, 转发
            maxQueueLength = opts.maxQueueLength || 100;
            hooks.onBeforeSend = opts.onBeforeSend || hooks.onBeforeSend;
            hooks.onComplite = opts.onComplite || hooks.onComplite;
            hooks.onSuccess = opts.onSuccess || hooks.onSuccess;
            hooks.onError = opts.onError || hooks.onError;
        }

        
        var escape = encodeURIComponent

        return function (utils) {

            var tunk = this;

            tunk.Create('REQUEST', {
                constructor: function REQUEST() {
                    this.state = {
                        pending: false,
                        queue: [], //{status,...extra,id:''}
                    };
                },
                remove: tunk.Action(function (id) {
                    var queue = this.getState().queue, queu = [];
                    for (var i = 0, l = queue.length; i < l; i++)
                        if (queue[i].id !== id) queu.push(queue[i]);
                    return { queue: queu };
                }),
                update: tunk.Action(function (state) {
                    return state;
                })
            });

            

            request.ajaxSettings = {
                // Default type of request
                type: 'GET',
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
            }
    
            request.request = request;
    
            request.get = function (/* url, data, success, error, dataType */) {
                return request.request(parseArguments.apply(null, arguments))
            }
    
            request.post = function (/* url, data, success, error, dataType */) {
                var options = parseArguments.apply(null, arguments)
                options.type = 'POST'
                return request.request(options)
            }
    
            request.getJson = function (/* url, data, success, error */) {
                var options = parseArguments.apply(null, arguments);
                options.dataType = 'json';
                return request.request(options);
            }
    
            request.jsonp = function (/* url, data, success, error */) {
                var options = parseArguments.apply(null, arguments);
                options.dataType = 'jsonp';
                return request.request(options);
            }

            utils.mixin({request: request});
    
            function request(options) {
                var settings = Object.assign({}, options || {}),
                    urlAnchor, hashIndex;
                for (key in request.ajaxSettings) if (settings[key] === undefined) settings[key] = request.ajaxSettings[key];

                settings.extra = settings.extra || {};
                settings.extra.id = (Math.random() + (new Date).getTime()).toString().replace(/\./g, '');
                settings.extra.status = 'pending';

                if (queue.length === maxQueueLength) queue.pop();
                queue.unshift(settings.extra);

                utils.runAction('REQUEST', 'update', [{ queue: queue, pending: true }]);

                if (!settings.crossDomain) {
                    urlAnchor = document.createElement('a');
                    urlAnchor.href = settings.url;
                    urlAnchor.href = urlAnchor.href;
                    settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
                }

                if (!settings.url) settings.url = window.location.toString()
                if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex)
                serializeData(settings)

                var dataType = settings.dataType;

                if (settings.cache === false || (
                    (!options || options.cache !== true) &&
                    ('script' == dataType || 'jsonp' == dataType)
                ))
                    settings.url = appendQuery(settings.url, '_=' + Date.now())

                if ('jsonp' == dataType) {
                    return ajaxJSONP(settings);
                }


                var xhr;
                var promise = new Promise(function (resolve, reject) {

                    var mime = settings.accepts[dataType],
                        headers = {},
                        setHeader = function (name, value) { headers[name.toLowerCase()] = [name, value] },
                        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.ajax1 : window.location.protocol,
                        nativeSetHeader,
                        abortTimeout;

                    xhr = settings.xhr();
                    //xhr.requestId=settings.extra.id;

                    var nativeSetHeader = xhr.setRequestHeader;

                    if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
                    setHeader('Accept', mime || '*/*');
                    if (mime = settings.mimeType || mime) {
                        if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
                        xhr.overrideMimeType && xhr.overrideMimeType(mime)
                    }
                    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
                        setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

                    if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
                    xhr.setRequestHeader = setHeader

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            xhr.onreadystatechange = empty
                            clearTimeout(abortTimeout)
                            var result, error = false
                            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
                                dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))

                                if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
                                    result = xhr.response
                                else {
                                    result = xhr.responseText
                                    result = hooks.onComplite(result, settings) || result;
                                    try {
                                        // http://perfectionkills.com/global-eval-what-are-the-options/
                                        // sanitize response accordingly if data filter callback provided
                                        result = ajaxDataFilter(result, dataType, settings);
                                        if (dataType == 'script') (1, eval)(result);
                                        else if (dataType == 'xml') result = xhr.responseXML;
                                        else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result);
                                    } catch (e) { error = e }

                                    if (error) return ajaxError(error, 'parsererror', xhr, settings)
                                }

                                ajaxSuccess(result, xhr, settings, function (args) {
                                    resolve(args);
                                });
                            } else {
                                resolve();
                                ajaxError({ message: xhr.statusText || null }, xhr.status ? 'error' : 'abort', xhr, settings);
                            }
                        }
                    }

                    if (ajaxBeforeSend(xhr, settings) === false || hooks.onBeforeSend(xhr, settings) === false) {
                        xhr.abort()
                        ajaxError(null, 'abort', xhr, settings);
                        return;
                    }

                    var async = 'async' in settings ? settings.async : true;
                    xhr.open(settings.type, settings.url, async, settings.username, settings.password);

                    if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name];

                    for (name in headers) nativeSetHeader.apply(xhr, headers[name]);

                    if (settings.timeout > 0) abortTimeout = setTimeout(function () {
                        xhr.onreadystatechange = empty;
                        xhr.abort();
                        ajaxError(null, 'timeout', xhr, settings)
                    }, settings.timeout);

                    // avoid sending empty string (#319);
                    xhr.send(settings.data ? settings.data : null);

                });

                promise.xhr = xhr;
                promise.id = settings.extra.id;

                return promise;
            }
            // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
            function ajaxBeforeSend(xhr, settings) {
                if (settings.beforeSend(xhr, settings) === false)
                    return false;
            }

            function ajaxSuccess(data, xhr, settings, resolve) {
                var status = 'success';
                hooks.onSuccess(data, xhr, settings);
                settings.success(data, xhr, settings);
                if (resolve) resolve(data);
                settings.extra.status = 'success';
                utils.runAction('REQUEST', 'update', [{ queue: queue }]);
                utils.runAction('REQUEST', 'update', [{ pending: getPending() }]);
                ajaxComplete(status, xhr, settings);
            }

            // type: "timeout", "error", "abort", "parsererror"
            function ajaxError(error, type, xhr, settings) {
                error = error || {};
                error.type = type;
                error.message = error.message || type;
                hooks.onError(error, xhr, settings);
                settings.error(error, xhr, settings);
                settings.extra.status = 'error';
                settings.extra.errorType = type;
                utils.runAction('REQUEST', 'update', [{ queue: queue }]);
                utils.runAction('REQUEST', 'update', [{ pending: getPending() }]);
                //console.log('@@@ajaxError',error,type,settings,xhr);
                ajaxComplete(type, xhr, settings);
            }
            // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
            function ajaxComplete(status, xhr, settings) {
                settings.complete(xhr, status)
            }

            function ajaxDataFilter(data, type, settings) {
                if (settings.dataFilter == empty) return data
                return settings.dataFilter(data, type)
            }

            // Empty function, used as default callback
            function empty() { }

            function getPending() {
                var pending = false;
                for (var i = 0, l = queue.length; i < l; i++) if (queue[i].status === 'peding') {
                    pending = true;
                    break;
                }
                return pending;
            }

            function ajaxJSONP(options) {
                if (!('type' in options)) return request.request(options);
                var xhr;
                var promise = new Promise(function (resolve, reject) {
                    var _callbackName = options.jsonpCallback,
                        callbackName = (typeof _callbackName === 'function' ?
                            _callbackName() : _callbackName) || ('jsonp' + (jsonpID++)),
                        script = document.createElement('script'),
                        calledBack = false,
                        responseData,
                        originalCallback = window[callbackName] = function (data) {
                            calledBack = true;
                            responseData = data;
                        },
                        abort = function (errorType) {
                            clean();
                            resolve();
                            ajaxError(null, errorType || 'error', xhr, options);
                        }, abortTimeout;
                    xhr = { abort: abort };

                    script.onload = function handler(e, errorType) {
                        clean();
                        setTimeout(function () {
                            if (!calledBack) {
                                clean();
                                resolve();
                                ajaxError({ message: 'jsonp script error.' }, 'error', xhr, options);
                            } else {
                                ajaxSuccess(responseData, xhr, options, function (args) {
                                    resolve(args);
                                });
                            }
                        }, 1);
                    };
                    script.onerror = function handler(e, errorType) {
                        clean();
                        resolve();
                        ajaxError(null, errorType || 'error', xhr, options);
                    };



                    if (ajaxBeforeSend(xhr, options) === false) {
                        abort('abort')
                        return xhr
                    }
                    options.data = options.data || {};
                    options.data.callback = callbackName;
                    script.src = options.url = appendQuery(options.url, param(options.data));
                    document.head.appendChild(script)

                    if (options.timeout > 0) abortTimeout = setTimeout(function () {
                        abort('timeout');
                    }, options.timeout);

                    function clean() {
                        clearTimeout(abortTimeout);
                        script.onload = undefined;
                        script.onerror = undefined;
                        originalCallback = window[callbackName] = undefined;
                    }
                });

                promise.xhr = xhr;
                promise.id = options.extra.id;

                return promise;

            }

            function mimeToDataType(mime) {
                if (mime) mime = mime.split(';', 2)[0]
                return mime && (mime == htmlType ? 'html' :
                    mime == jsonType ? 'json' :
                        scriptTypeRE.test(mime) ? 'script' :
                            xmlTypeRE.test(mime) && 'xml') || 'text'
            }

            function appendQuery(url, query) {
                if (query == '') return url
                return (url + '&' + query).replace(/[&?]{1,2}/, '?')
            }

            // serialize payload and append it to the URL for GET requests
            function serializeData(options) {
                if (options.processData && options.data && typeof options.data != "string")
                    options.data = param(options.data)
                if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
                    options.url = appendQuery(options.url, options.data), options.data = undefined
            }



            // handle optional data/success arguments
            function parseArguments() {
                var url, data, success = empty, error = empty, dataType, silent = false;
                for (var i = 0, l = arguments.length; i < l; i++) {
                    switch (typeof arguments[i]) {
                        case 'string':
                            if (url) dataType = arguments[i];
                            else url = arguments[i];
                            break;
                        case 'object':
                            data = arguments[i];
                            break;
                        case 'function':
                            if (success === empty) success = arguments[i];
                            else error = arguments[i];
                            break;
                        case 'boolean':
                            silent = arguments[i];
                            break;
                    }
                }

                return {
                    url: url
                    , data: data
                    , success: success
                    , error: error
                    , dataType: dataType
                    , silent: silent
                }

                function empty() { }
            }

            function serialize(params, obj, scope) {
                var type, array = typeof obj === 'object' && obj.constructor === Array, hash = typeof obj === 'object' && obj.constructor === Object;
                var namespace;
                for (var key in obj) {
                    type = typeof obj[key];
                    if (type === 'object' && obj[key].constructor === Array) type = 'array';
                    if (scope) namespace = scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
                    if (type == "array" || (type == "object"))
                        serialize(params, obj[key], namespace || key);
                    else params.add(namespace || key, obj[key])
                }
            }

            function param(obj) {
                var params = [];
                params.add = function (key, value) {
                    if (typeof value === 'function') value = value()
                    if (value == null) value = ""
                    this.push(escape(key) + '=' + escape(value))
                }
                serialize(params, obj)
                return params.join('&')
            }


        }
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = request_init;
    }
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return request_init;
        });
    }

})();