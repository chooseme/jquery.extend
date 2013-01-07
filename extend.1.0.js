$.extend({
  queryToJson: function(url,decode){
			if(!url){
				return {};
			}
		   decode = decode === undefined?1:0;		   
		   var query   = url.substr(url.indexOf('?') + 1),
		       params  = query.split('&'),
		       len     = params.length,
		       result  = {},
		       i       = 0,
		       key, value, item, param;
		   
		   for (; i < len; i++) {
		       param   = params[i].split('=');
		       key     = param[0];
			   if(!key.length){
			   		continue;
			   }
		       value   = decode? decodeURIComponent(param[1]) : param[1];
		       item = result[key];
		       if ('undefined' == typeof item) {
		           result[key] = value;
		       } else if (Object.prototype.toString.call(item) == '[object Array]') {
		           item.push(value);
		       } else { // 这里只可能是string了
		           result[key] = [item, value];
		       }
		   }   
		   return result;
	},
    encodeHTML: function(str){
   		if (typeof str !== "string") {
            throw "encodeHTML need a string as parameter"
        }
        return str.replace(/\&/g, "&amp;").replace(/"/g, "&quot;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\'/g, "&#39;").replace(/\u00A0/g, "&nbsp;").replace(/(\u0020|\u000B|\u2028|\u2029|\f)/g, "&#32;")
   },
    decodeHTML: function(str){
   	 	if (typeof str !== "string") {
            throw "decodeHTML need a string as parameter"
        }
        return str.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39/g, "'").replace(/&nbsp;/g, "\u00A0").replace(/&#32/g, "\u0020").replace(/&amp;/g, "&")
   },
	/**
	 * var x = easyTemplate(sTemplate,oData);
	//或者当一个模板不变，数据经常变动时可以这样使用：
	//先将模板解析好以备用
	var tp = easyTemplate(sTemplate);
	//在需要用新的数据渲染该模板时调用：
	var shtml = tp(oData);
	 * @param {Object} s
	 * @param {Object} d
	 * <#tpl data>
	 * ${data.name}
	 * <#list data.list as rows>
	 * <#if (rows.id ==1)>
	 * ${list_index}
	 * ${数据操作}
	 * <#/if>
	 * <#list>
	 * <#/tpl>
	 */
    easyTemplate : function(sTemplate,oData){
		var easyTemplate = function(s,d){
			if(!s){return  '' ;}
			if(s!==easyTemplate.template){
				easyTemplate.template = s;
				easyTemplate.aStatement = easyTemplate.parsing(easyTemplate.separate(s));
			}
			var aST = easyTemplate.aStatement;
			var process = function(d2){
				if(d2){d = d2;}
				return arguments.callee;
			};
			process.toString = function(){
				return (new Function(aST[0],aST[1]))(d);
			};
			return process;
		};
		easyTemplate.separate = function(s){
			var r = /\\'/g;
			var sRet = s.replace(/(<(\/?)#(.*?(?:\(.*?\))*)>)|(')|([\r\n\t])|(\$\{([^\}]*?)\})/g,function(a,b,c,d,e,f,g,h){
				if(b){return '{|}'+(c?'-':'+')+d+'{|}';}
				if(e){return '\\\'';}
				if(f){return '';}
				if(g){return '\'+('+h.replace(r,'\'')+')+\'';}
			});
			return sRet;
		};
		easyTemplate.parsing = function(s){
			var mName,vName,sTmp,aTmp,sFL,sEl,aList,aStm = ['var aRet = [];'];
			aList = s.split(/\{\|\}/);
			var r = /\s/;
			while(aList.length){
				sTmp = aList.shift();
				if(!sTmp){continue;}
				sFL = sTmp.charAt(0);
				if(sFL!=='+'&&sFL!=='-'){
					sTmp = '\''+sTmp+'\'';aStm.push('aRet.push('+sTmp+');');
					continue;
				}
				aTmp = sTmp.split(r);
				switch(aTmp[0]){
					case '+macro':mName = aTmp[1];vName = aTmp[2];aStm.push('aRet.push("<!--'+mName+' start--\>");');break;
					case '-macro':aStm.push('aRet.push("<!--'+mName+' end--\>");');break;
					case '+if':aTmp.splice(0,1);aStm.push('if'+aTmp.join(' ')+'{');break;
					case '+elseif':aTmp.splice(0,1);aStm.push('}else if'+aTmp.join(' ')+'{');break;
					case '-if':aStm.push('}');break;
					case '+else':aStm.push('}else{');break;
					case '+list':aStm.push('if('+aTmp[1]+'.constructor === Array){with({i:0,l:'+aTmp[1]+'.length,'+aTmp[3]+'_index:0,'+aTmp[3]+':null}){for(i=l;i--;){'+aTmp[3]+'_index=(l-i-1);'+aTmp[3]+'='+aTmp[1]+'['+aTmp[3]+'_index];');break;
					case '-list':aStm.push('}}}');break;
					default:break;
				}
			}
			aStm.push('return aRet.join("");');
			if(!vName){aStm.unshift('var data = arguments[0];');}
			return [vName,aStm.join('')];
		};
		return easyTemplate(sTemplate,oData);
	},
	/**
	 对ajax的包装 支持成功和失败
	 jQuery.ajax({
		type: method,
		url: url,
		data: data,
		success: callback,
		dataType: type,
		onSuccess: function(data, textStatus, jqXHR){
		},
		onFail   : function(XMLHttpRequest, textStatus, errorThrown){
		}
	})*/
	io  : function(opts){
		 var ajax  = $.ajax;
	  	 var _opts = $.extend({
			 	onSuccess:$.noop,
				onError  :$.noop,
				onFail   :$.noop,
				success  : function(data, textStatus, jqXHR){
					if(data.code == 1000){
						return $.isFunction(_opts.onSuccess) && _opts.onSuccess.apply(this, arguments);
					}else{
						return $.isFunction(_opts.onFail) && _opts.onFail.apply(this, arguments);
					}
				},
				error    : function(XMLHttpRequest, textStatus, errorThrown){
					return $.isFunction(_opts.onError) && _opts.onError.apply(this,arguments);
				},
				type     : 'post',
				dataType : 'json'				
		 },opts);
		 return ajax(_opts);
	},
	getTrans : function(key,setting){
		var keys = key.split("\."),trans = $.trans;
		var i = 0;
		do {
			trans = trans[keys[i++]];
			if(trans==null) break;
		} while(i<keys.length&&typeof(trans)=='object');
		
		var opts = {};
		$.extend(opts,trans,setting);
		var that = {
			request : function(data){
				$.extend(opts,{data:data});
				return $.io(opts);		
			}	
		}
		return that;
	},
	trans : {
		
	},
	serialize  : function(wrap,extral,tags){
		tags = tags || ['input:text','input:password','input:radio','input:hidden','input:checkbox','textarea','select'];
		if($.isArray(tags)){
			tags = tags.join(',');
		}
		var objs = $( tags,wrap ).filter(function(index){
			if($(this).prop('disabled')){
				return false;
			}
			return true;
		}).serializeArray();
		$.isArray(extral) && ( objs = objs.concat(extral) );
		return $.param(objs);
	},
	pageBar : function(node,opts){
		
		var _opts = {
			onStart  : $.noop,
			onSuccess: $.noop,
			onFail   : $.noop,
			onError  : $.noop
		};
		
		if(opts){
			$.extend(_opts,opts);	
		}		
		var bar  = $(node).attr('pagebar-type') == 'page' ? $(node) : $("[pagebar-type=page]",node),trans_key = bar.attr('pagebar-key'),target,lastXhr;
		
		var data = {};
		var onSuccess  = function(json,trigger){
			_opts.onSuccess.apply(target,[json,data]);
			bar.html(json['data']);	
			$(target).removeAttr('lock');		
		};
		var onFail     = function(json){
			_opts.onError.apply(target,json);
			$(target).removeAttr('lock');	
		};
		var onError    = function(){
			_opts.onError.apply(target);
			$(target).removeAttr('lock');
		}
		
		var click  = function(evt){
			target = $(evt.target) , data = target.attr('data') ;
			if(data === undefined){
				var href = target.attr('href');
				data = href.slice(href.indexOf('?')+1);
			}
			data = $.queryToJson(data);
			if($(target).attr('lock')){
				return false ;
			}else{
				$(target).attr('lock',1);
			}			
			_opts.onStart.apply(target,$.isArray(data)?data:[data]);
			//取消上一个ajax请求
			if(lastXhr){
				lastXhr.abort();
			}			
			lastXhr = $.getTrans(trans_key,{
				onSuccess : onSuccess,
				onFail    : onFail,
				onError   : onError
			}).request(data);
			evt.preventDefault();
			return false;
		};
		var update = function(d){
			_opts.onStart.apply(target,$.isArray(data)?data:[data]);
			$.getTrans(trans_key,{
				onSuccess : function(json){
					json.trigger = 1;
					onSuccess(json);
				},
				onFail    : onFail,
				onError   : onError
			}).request(data = d);
		}
		$(bar).delegate('.paging a','click',click);
		return {
			update : update
		};
	},
	/**
	 * 根据某一属性查找
	 * @param {Object} node
	 * @param {Object} selector
	 */
	parseAttr : function(node,selector){
		node     = $(node);
		selector = selector || '[data-type]',nodes = { },prop = selector.replace(/[\[\]]/ig,'');
		$(selector,node).each(function(i,el){
			nodes[ $(el).attr(prop) ] = $(el); 
		});
		return nodes;
	},
		/**
	 * 基于时间轴的基础动画类
	 * @param {Object} duration
	 * @param {Object} options
	 */
	animate : function(duration,options){
		options = $.extend({
			onBegin : $.noop,
			onTick  : $.noop,
			onEnd   : $.noop
		},options);
		duration = duration || 1000;
		var startTime = $.now(),endTime = duration + startTime,interval = 45,rate = 0,timer;				
		var end   = function(){
			options.onEnd(1);
		};				
		var step  = function(){
			if($.now() < endTime){
				rate = ($.now() - startTime) / duration;
				options.onTick(rate);	
			}else{
				clearInterval(timer);
				timer = null;
				rate = 1;
				end();
			}					
		};				
		var start = function(){
			if(endTime > startTime){
				options.onBegin(rate);
				timer = setInterval(step,interval);	
			}					
		};
		start();
	},
	/**
	 * 背景闪烁效果
	 */
	shine : function(el,callback){
		var begin = [255, 187, 187],end = [255, 255, 255],el = $(el),maxTimes = 1,times = 0;
		var setColor = function(rate){
			var colors = $.map(begin,function(color,i){
				return Math.floor((end[i] - color) * rate + color);
			});
			el.css({
				'background-color':'rgb('+ colors.join(',') +')'
			});
		}
		var _shine = function(){
				$.animate(500,{
					onBegin : setColor,
					onTick  : setColor,
					onEnd   : function(rate){
						setColor(rate);
						if(++times < maxTimes){
							_shine();
						}else{
							callback && callback(el);
						}
					}
				})
		};
		_shine();
	},
	/*
	 * 数字输入限制
	 */
	onlynum : function(){
		$(this).val($(this).val().replace(/[^\d]/g,''))
	},
	IE67Notice :function(){
		if(!$.browser.msie || parseInt($.browser.version) > 7){
			return false;
		}
		var tpl = {
			IE67Notice:'<#tpl data>\
				<div class="headIE67">\
					<div class="left"><p class="notice">提示:您正使用的<span class="red bold">&nbsp;IE&nbsp;</span>浏览器，因版本过低，可能无法正常浏览，推荐您升级或更换浏览器！</p></div>\
					<div class="right">\
						<div class="broswer b1">IE9以上浏览器</div>\
						<div class="broswer b2">谷歌浏览器</div>\
						<div class="broswer b3">火狐浏览器</div>\
						<div class="broswer close" title="关闭提示"></div>\
					</div>\
					<div class="clear"></div>\
				</div>\
			</#tpl>'	
		};
		var firstDom = $("body").children().first();
		var dia = $( $.easyTemplate(tpl.IE67Notice).toString());
		firstDom.before(dia);
		dia.delegate(".close","click",function(){
			dia.hide().remove();
		});
	}
});
(function($){
    var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g, meta = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"': '\\"',
        '\\': '\\\\'
    };
    $.toJSON = typeof JSON === 'object' && JSON.stringify ? JSON.stringify : function(o){
        if (o === null) {
            return 'null';
        }
        var type = typeof o;
        if (type === 'undefined') {
            return undefined;
        }
        if (type === 'number' || type === 'boolean') {
            return '' + o;
        }
        if (type === 'string') {
            return $.quoteString(o);
        }
        if (type === 'object') {
            if (typeof o.toJSON === 'function') {
                return $.toJSON(o.toJSON());
            }
            if (o.constructor === Date) {
                var month = o.getUTCMonth() + 1, day = o.getUTCDate(), year = o.getUTCFullYear(), hours = o.getUTCHours(), minutes = o.getUTCMinutes(), seconds = o.getUTCSeconds(), milli = o.getUTCMilliseconds();
                if (month < 10) {
                    month = '0' + month;
                }
                if (day < 10) {
                    day = '0' + day;
                }
                if (hours < 10) {
                    hours = '0' + hours;
                }
                if (minutes < 10) {
                    minutes = '0' + minutes;
                }
                if (seconds < 10) {
                    seconds = '0' + seconds;
                }
                if (milli < 100) {
                    milli = '0' + milli;
                }
                if (milli < 10) {
                    milli = '0' + milli;
                }
                return '"' + year + '-' + month + '-' + day + 'T' +
                hours +
                ':' +
                minutes +
                ':' +
                seconds +
                '.' +
                milli +
                'Z"';
            }
            if (o.constructor === Array) {
                var ret = [];
                for (var i = 0; i < o.length; i++) {
                    ret.push($.toJSON(o[i]) || 'null');
                }
                return '[' + ret.join(',') + ']';
            }
            var name, val, pairs = [];
            for (var k in o) {
                type = typeof k;
                if (type === 'number') {
                    name = '"' + k + '"';
                }
                else 
                    if (type === 'string') {
                        name = $.quoteString(k);
                    }
                    else {
                        continue;
                    }
                type = typeof o[k];
                if (type === 'function' || type === 'undefined') {
                    continue;
                }
                val = $.toJSON(o[k]);
                pairs.push(name + ':' + val);
            }
            return '{' + pairs.join(',') + '}';
        }
    };
    $.evalJSON = typeof JSON === 'object' && JSON.parse ? JSON.parse : function(src){
        return eval('(' + src + ')');
    };
    $.secureEvalJSON = typeof JSON === 'object' && JSON.parse ? JSON.parse : function(src){
        var filtered = src.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        if (/^[\],:{}\s]*$/.test(filtered)) {
            return eval('(' + src + ')');
        }
        else {
            throw new SyntaxError('Error parsing JSON, source is not valid.');
        }
    };
    $.quoteString = function(string){
        if (string.match(escapeable)) {
            return '"' +
            string.replace(escapeable, function(a){
                var c = meta[a];
                if (typeof c === 'string') {
                    return c;
                }
                c = a.charCodeAt();
                return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) +
            '"';
        }
        return '"' + string + '"';
    };
})(jQuery);

$(function($){
	$.fn.extend({
		pageBar : function(url,options){
			if($.type(url) == 'array'){
				options = url;
			};
			this.each(function(){				
				var $this = $(this),container = $this;
				var _options = {};
				$.extend(_options,{
					beforeSend : function(){
						$this.trigger('start');
					},
					cache      : true,
					success   : function(data, textStatus, jqXHR){
						if(data.code == 1000){
							$this.trigger('success',arguments);
							container.html(data.data);
							bindChange();
						}else{
							$this.trigger('fail',arguments);
						}		
					},
					type       : 'get',
					dataType   : 'json' 
				});
				var xhr;
				
				var bindChange = function(){
					$('select[name=per_page]',$this).bind('change',function(){
						if(xhr){
							xhr.abort();
							xhr = null;
						};
						var opt = $('option:selected',this);
						xhr = $.ajax(opt.attr('data-url') , _options);
						return false;
					});
				}
				bindChange();
				var handleClick = function(evt){
					var target = $(evt.currentTarget),href = target.attr('data');
					if(href){
						url = href;
					}
					if(xhr){
						xhr.abort();
						xhr = null;
					}
					xhr = $.ajax(url,_options);
					return false;
				}
				var goPageHandle = function(evt){
					var target = $(evt.currentTarget),
						href   = target.attr('data'),
						goBox  = target.closest("[gopage]"),
						input  = $("input",goBox),
						_name  = input.attr("name"),
						gopage = input.val();
					if(!gopage || gopage ==0 ){
						$.shine(input);
						return false;
					}
					var _data ='{"' + _name+ '":' +gopage +'}',data = $.parseJSON(_data);
					if(xhr){
						xhr.abort();
						xhr = null;
					}
					if(href){
						url = href;
					}
					xhr = $.ajax(url , $.extend( {}, _options,data ));
					return false;
				}			
				$(this).delegate('.paging .gopage','click',goPageHandle)
						.delegate('.paging input:text','keyup',$.onlynum)
						.delegate('.paging a:not(".gopage")','click',handleClick)
						.bind('pageBar',function(evt,_url,_opts){
							if(xhr){
								xhr.abort();
								xhr = null;
							}
							if($.type(_url) == 'object'){
								_opts = _url;
								_url = url;
							}
							xhr = $.ajax(_url , $.extend( {}, _options, _opts||{} ));
							return false;
						});
			
			});
		}
	});
});
$(function($){
	var loads = $('#image_loading');
	if(!loads.length){
		loads = $('<div class="image_loading" id="image_loading" style="display:none;"><p><img width="16" height="16" src="/static/images/loading_16x16.gif"><span class="arct">加载中...</span></p></div>').appendTo( document.body);
	}
	$(loads).ajaxStart(function(){
		if($(window).scrollTop() < 58 ){
			$(this).show().css('top',58 - $(window).scrollTop());
		}else{
			$(this).show().removeAttr('style');	
		}		
	});	
	$(loads).ajaxStop(function(){
		$(this).fadeOut('fast','swing');
	});
	
});
