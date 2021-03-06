//php.js
function ucfirst (str) {
  str += ''
  var f = str.charAt(0)
    .toUpperCase()
  return f + str.substr(1)
}

// 基于jquery的camelcase修改，仅仅是将中划线删除然后将后面的第一个字母大写
var camelCase = (function(){
  var rdashAlpha = /-([a-z])/g;
  var fcamelCase = function( all, letter ) {
    return letter.toUpperCase();
  };
  return function(str){
    return str.replace(rdashAlpha,fcamelCase);
  }

})();

//impress.js
var pfx = (function () {
  // 看jq的camelcase发现为啥prefixes里面其他前缀都是首字母大写而ie的是首字母小写，举例说明：WebkitTransform msTransform ie自身的bug
  // 原来的代码里其实没处理带有中划线的名称。
    var style = document.createElement('dummy').style,
        prefixes = 'Webkit Moz O ms Khtml'.split(' '),
        memory = {};
    return function ( prop ) {
        prop = camelCase(prop);
        if ( typeof memory[ prop ] === "undefined" ) {
            //实现一个ucfirst
            var ucProp  = ucfirst(prop),
            //拿到前缀化的属性名
                props   = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
            
            memory[ prop ] = null;
            for ( var i in props ) {
                if ( style[ props[i] ] !== undefined ) {
                    memory[ prop ] = props[i];
                    break;
                }
            }
        }
        
        return memory[ prop ];
    };
})();
function gettype(obj){
  return Object.prototype.toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
}
// https://github.com/sindresorhus/deep-assign/blob/master/index.js
var deepAssign = (function(){

  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var propIsEnumerable = Object.prototype.propertyIsEnumerable;
  function toObject(val) {
    if (val === null || val === undefined) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    return Object(val);
  }
  function assignKey(to, from, key) {
    var val = from[key];

    if (val === undefined || val === null) {
      return;
    }

    if (hasOwnProperty.call(to, key)) {
      if (to[key] === undefined || to[key] === null) {
        throw new TypeError('Cannot convert undefined or null to object (' + key + ')');
      }
    }

    if(gettype(val)==='object' || gettype(val)==='array'){
      if(!hasOwnProperty.call(to, key)){
        if(gettype(val)==='array'){
          to[key] = [];
        }else{
          to[key] = {};
        }
      }
      to[key] = assign(to[key],from[key]);
    }else{
      to[key] = val;
    }

  }
  function assign(to, from) {
    if (to === from) {
      return to;
    }

    from = Object(from);

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        assignKey(to, from, key);
      }
    }

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(from);

      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          assignKey(to, from, symbols[i]);
        }
      }
    }

    return to;
  }

  return function(target){
    target = toObject(target);

    for (var s = 1; s < arguments.length; s++) {
      assign(target, arguments[s]);
    }

    return target;        
  }


})();




function whichTransitionEvent(){  
    var t;  
    var el = document.createElement('p');  
    var transitions = {  
      'transition':'transitionend',  
      'OTransition':'oTransitionEnd',  
      'MozTransition':'mozTransitionEnd',  
      'WebkitTransition':'webkitTransitionEnd',  
      'MsTransition':'msTransitionEnd'  
    }  
    for(t in transitions){  
        if( el.style[t] !== undefined ){  
            return transitions[t];  
        }  
    }  
}
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

//利用闭包，把defaults隐藏而不是每次都声明一次
(function(window){
  var defaults = {
    ajaxUrl:"http://jiangshanmeta.github.io",
    DOM:{
      wrap:'lotteryWrap',
      w:Math.min(document.documentElement.clientWidth*0.9,500),
      rings:[{color:'#ff6900','width':4},{color:'#ffa642',width:10,shadowColor:'rgba(0,0,0,0.5)',shadowBlur:8}],
      pointerColor:"#ffa642",
      startDeg:0,
    },
    animation:{
      timePerRound:1,
      rotateCountAfterAjax:3,  //animationTimePerRound是指在 抽奖动画中匀速转动时没转一圈所需要的时间
      area:'decoration',
      timeAfterAjax:7,
    },
    text:{
      color:"#fff",
      pos:2/3,
      fontSize:14,
      lineHeight:1.4,
      shadowColor:"rgba(0,0,0,0.5)",
      shadowBlur:8,
      separator:"\n",
    },
    msg:{
      ready:'开始抽奖',
      doing:'抽奖中',
      done:'抽奖结束',
      css:"box-shadow:0 0 5px rgba(0,0,0,0.5),inset 0 0 10px rgba(0,0,0,0.5);background:#fff;",
    },

    doSthAfterLottery:function(json){

    },
    checkCanLottery:function(){
        return true;
    },
    doSthAfterCannotLottery:function(){

    },
    doSthAfterAjaxError:function(json){

    },

  }
  var wrapIdPool = [];

  function deg2rad(angle){
    return Math.PI*angle/180;
  }

  function rad2deg(angle){
    return angle*180/Math.PI;
  }

  function Lottery(option){
    if(!option || !option.lotteris || !option.ajaxUrl ){
      console.error('missing parameter');
      return;
    }

    //安全模式，保证是使用new关键字返回一个新的实例
    if(!(this instanceof Lottery)){
        return new Lottery(option);
    }

    this.options = deepAssign({},defaults,option);
    // 对合并之后的数据进行处理
    if(this.options.text.pos>=1 || this.options.text.pos<=0){
      this.options.text.pos = defaults.text.pos;
    }
    this.options.DOM.startDeg = deg2rad(this.options.DOM.startDeg);

    //状态 0表示没开始抽奖，1表示正在抽奖中，2表示抽奖完成
    this.status = 0;
    this.imgs = [];

    this.initDOM().draw();

    //我希望把这些实例属性隐藏掉，而原型方法可以暴露
    var dummpConstructedFunc = function(){};
    dummpConstructedFunc.prototype = Object.create(Lottery.prototype);
    return new dummpConstructedFunc();


  }

  Lottery.prototype = {
    constructor:Lottery,
    initDOM:function(){
      var options = this.options;
      var DOM = options.DOM;
      var wrapId = DOM.wrapId;
      var w = DOM.w;
      //外层盒子初始样式设置
      // 做一点安全，防止一个wrapId下面有多个抽奖区
      this.wrap = document.querySelector("#"+wrapId);
      if(!this.wrap){
        this.wrap = document.createElement("div");
        document.body.appendChild(this.wrap);
      }else{
        if(wrapIdPool.indexOf(wrapId)>-1){
          console.error('Lottery wrapId repeated');
          return;
        }else{
          wrapIdPool.push(wrapId);
        }
      }
      var _this = this;
      this.wrap.addEventListener("click",function(){
        //没开始抽奖的时候点击，说明要抽奖
        if(_this.status===0){
          _this.ajaxGetLotteryRes();
        }else if(_this.status===2){
          //此时抽奖结束,点击应该是重置
          _this.reset();
        }
        //剩下的情况是抽奖中，当然什么也不做默默等待后端返回结果
      },false);
      this.wrap.style.cssText += "position:relative;overflow:hidden;margin-left:auto;margin-right:auto;display:table;"

      //canvas1负责绘制具体的奖项
      this.canvas1 = document.createElement("canvas");
      this.canvas1.width = w;
      this.canvas1.height = w;
      this.canvas1.style.cssText="will-change:transform;";
      this.canvas1.style[pfx('transform')] = "rotate(0deg)";

      this.context1 = this.canvas1.getContext('2d');

      //canvas2负责绘制装饰性的指针表盘
      this.canvas2 = document.createElement("canvas");
      this.canvas2.width = w;
      this.canvas2.height = w;
      this.canvas2.style.cssText="position:absolute;top:0;left:0;will-change:transform;";
      this.canvas2.style[pfx('transform')] = "rotate(0deg)";
      this.context2 = this.canvas2.getContext('2d');
      // 文字区域
      this.textArea = document.createElement("div");
      var textAreaPercent = 0.25;
      this.textArea.style.cssText = "position:absolute;border-radius:50%;width:"+textAreaPercent*w+"px;height:"+textAreaPercent*w+"px;line-height:"+ textAreaPercent*w +"px;left:" + (0.5-textAreaPercent/2)*100 + "%;top:"+(0.5-textAreaPercent/2)*100 +"%;text-align:center;white-space:nowrap;-webkit-user-select:none;" + options.msg.css;
      this.textArea.innerText = options.msg.ready;

      var fragment = document.createDocumentFragment();
      fragment.appendChild(this.canvas1);
      fragment.appendChild(this.canvas2);
      fragment.appendChild(this.textArea);
      this.wrap.appendChild(fragment);

      return this;
    },
    draw:function(){
      return this.drawRing().drawPointer().drawBg().drawText();
    },
    drawRing:function(){
      var context2 = this.context2;
      var options = this.options;
      var DOM = options.DOM;
      var r = DOM.w/2;

      context2.save();
      context2.translate(r,r);

      var totalWidth = 0;
      var rings = DOM.rings;
      if(gettype(rings)!='array'){
        console.error('parameter for rings must be array');
        return this;
      }
      for(var i=0;i<rings.length;i++){
        var thisring = rings[i];
        context2.save();
        context2.beginPath();
        context2.strokeStyle = thisring.color;
        context2.lineWidth = thisring.width;
        if(thisring.shadowColor){
          context2.shadowColor = thisring.shadowColor;
        }
        if(thisring.shadowBlur){
          context2.shadowBlur = thisring.shadowBlur;
        }
        context2.arc(0,0,r-(totalWidth+thisring.width/2),0,2*Math.PI,false);
        context2.closePath();
        context2.stroke();
        context2.restore();
        totalWidth+= thisring.width;
      }

      context2.restore();

      return this;
    },
    drawPointer:function(){
      var context2 = this.context2;
      var options = this.options;
      var DOM = options.DOM;
      var r = DOM.w/2;

      context2.save();
      context2.translate(r,r);

       /* 外层指针 */
      context2.save();
      context2.beginPath();
      context2.moveTo(-0.05*r,-r+9);
      context2.lineTo(-0.05*r,-0.8*r);
      context2.lineTo(-0.12*r,-0.8*r);
      context2.lineTo(0,-0.7*r);   
      context2.lineTo(0.12*r,-0.8*r);
      context2.lineTo(0.05*r,-0.8*r);
      context2.lineTo(0.05*r,-r+9);
      context2.closePath();
      context2.fillStyle = DOM.pointerColor;
      context2.fill();
      context2.restore();  

      // 内层指针 
      context2.save();
      context2.beginPath();
      context2.moveTo(-0.05*r,-0.25*r);
      context2.lineTo(-0.05*r,-0.40*r);
      context2.lineTo(-0.12*r,-0.40*r);
      context2.lineTo(0,-0.50*r);   
      context2.lineTo(0.12*r,-0.40*r);
      context2.lineTo(0.05*r,-0.40*r);
      context2.lineTo(0.05*r,-0.25*r);    
      context2.closePath();
      context2.fillStyle = DOM.pointerColor;
      context2.fill();
      context2.restore();

      context2.restore();

      return this;
    },
    drawBg:function(){
      var context1 = this.context1;
      var options = this.options;
      var DOM = options.DOM;
      var lotteris = options.lotteris;
      var len=lotteris.length;
      var degPerPart = 2*Math.PI/len;
      var r = DOM.w/2;
      var startDeg = DOM.startDeg;

      context1.save();
      context1.translate(r,r);

      for(var i=0;i<len;i++){
        context1.save();
        context1.beginPath();
        context1.moveTo(0,0);
        var finalDeg = i*degPerPart+startDeg;

        context1.lineTo(Math.sin(finalDeg)*r,-Math.cos(finalDeg)*r);
        context1.arc(0,0,r,finalDeg-Math.PI/2,finalDeg+degPerPart-Math.PI/2,false)
        context1.closePath();
        context1.fillStyle = lotteris[i].bgColor;
        context1.fill();
        context1.restore();
      }

      context1.restore();

      return this;    
    },
    drawText:function(){
      var context1 = this.context1;
      var options = this.options;
      var DOM = options.DOM;
      var lotteris = options.lotteris;
      var optionText = options.text;
      var len=lotteris.length;
      var degPerPart = 2*Math.PI/len;
      var r = DOM.w/2;
      var startDeg = DOM.startDeg;
      var animateArea = options.animation.area;
      context1.save();
      context1.translate(r,r);

      context1.save();
      context1.textAlign = "center";
      context1.textBaseline = "middle";
      context1.fillStyle = optionText.color;
      var fontSize = optionText.fontSize;
      var lineHeight = optionText.lineHeight;
      var realLineHeight = fontSize*lineHeight;
      context1.font = fontSize+"px bold sans-serif";
      context1.shadowColor = optionText.shadowColor;
      context1.shadowBlur = optionText.shadowBlur;
      var separator = optionText.separator;

      for(var i=0;i<len;i++){
        var text = lotteris[i].text;
        if(text===undefined){
          continue;
        }

        context1.save();

        if(lotteris[i].textColor!==undefined){
          context1.fillStyle = lotteris[i].textColor;
        }
        if(lotteris[i].textPos!==undefined){
          var textPos = lotteris[i].textPos;
          if(textPos>=1 || textPos<=0){
            textPos = optionText.pos;
          }
        }else{
          var textPos = optionText.pos;
        }
        
        if(animateArea=='decoration'){
          var finalDeg = degPerPart*(i+0.5)+startDeg;
        }else{
          var finalDeg = 0;
          context1.rotate((i+0.5)*degPerPart+startDeg);
        }

        var textArr = text.split(separator);
        var centerPos = r*textPos;

        var startTextPos = centerPos + realLineHeight*(textArr.length-1)/(2*Math.cos(finalDeg));
        for(var j=0,textLen=textArr.length;j<textLen;j++){
            context1.fillText(textArr[j],Math.sin(finalDeg)*centerPos,-Math.cos(finalDeg)*(startTextPos-j*realLineHeight/Math.cos(finalDeg)) );
        }

        context1.restore();
      }
      context1.restore(); 

      context1.restore(); 

      return this;
    },
    ajaxGetLotteryRes:function(){
       var options = this.options;
       var canLottery = options.checkCanLottery();
       var _this = this;
       if(canLottery){
        // 这里应该发起ajax请求然后后端返回结果根据结果展示，但是github pages只能放静态页面。这里就简单模拟一下吧
        this.status = 1;
        this.textArea.innerText = options.msg.doing;
        var animateArea = options.animation.area;
        if(animateArea=='decoration'){
          var canvas = this.canvas2;
        }else{
          var canvas = this.canvas1;
        }

        
        var animationTimePerRound = options.animation.timePerRound;

        var hasAjaxRest = false;
        var ajaxRest;
        var transitionendCallback = function(e){
          if(hasAjaxRest){
            this.removeEventListener(e.type,transitionendCallback);
            _this.showLotteryRes(ajaxRest);
          }else{
            var oldcss = this.style.cssText;
            this.style[pfx('transition')] = "0s";
            this.style[pfx("transform")] = "rotate(0deg)";

            var _thisCanvas = this;
            // 你猜为什么要写在setTimeout中呢。为了强制渲染啊。
            // setTimeout(function(){
            //   _thisCanvas.style.cssText = styleStr;
            // },0)
            //上面一个写法和下面的写法表现结果是一致的
            //用requestAnimationFrame的作用是一样的，等重置需要一帧时间，再下一次重绘的时候写入新的样式。
            requestAnimFrame(function(){
              requestAnimFrame(function(){
                _thisCanvas.style.cssText = oldcss;
              })
               
            });

          }
        }

        canvas.addEventListener(whichTransitionEvent(),transitionendCallback);
        canvas.style[pfx('transition')] = "all "+ animationTimePerRound + "s linear";
        canvas.style[pfx('transform')] = "rotate(360deg)";

        if(options.ajaxUrl=='http://jiangshanmeta.github.io'){
          // 模拟ajax返回值
          setTimeout(function(){
              var rst = Math.floor(Math.random()*_this.options.lotteris.length);
              hasAjaxRest = true;
              //因为可能后端校验禁止参与抽奖
              if(Math.random()>0.5){
                ajaxRest = {data:{index:rst,err:{msg:'达成成就：+1s'}},rstno:1};
              }else{
                ajaxRest = {data:{err:{msg:'苟利国家生死以'}},rstno:2};
              }
              
          },1800)   
        }else{
          //真ajax
          var xhr = new XMLHttpRequest();
          xhr.open("POST",options.ajaxUrl,true);
          xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
          xhr.onreadystatechange = function(){
            if(xhr.readyState == 4){
              if(xhr.status == 200){
                hasAjaxRest = true;
                ajaxRest = JSON.parse(xhr.responseText);
              }else{
                _this.reset();
              }
            }
          }
          xhr.send(null);

        }

        
       }else{
          options.doSthAfterCannotLottery && options.doSthAfterCannotLottery();
       }
    },
    showLotteryRes:function(json){
      var _this = this;
      var options = this.options;
      var animateArea = options.animation.area;
      if(animateArea=='decoration'){
        var canvas = this.canvas2;
      }else{
        var canvas = this.canvas1;
      }

      var startDeg = rad2deg(options.DOM.startDeg);

      if(json.rstno==1){
        var transitionendCallback1 = function(e){
          this.removeEventListener(e.type,transitionendCallback1);
          _this.status = 2;
          _this.textArea.innerText = options.msg.done;
          options.doSthAfterLottery && options.doSthAfterLottery(json);  
        }
        canvas.addEventListener(whichTransitionEvent(),transitionendCallback1,false);
        //这里要+1是因为在改变过渡效果的时候，ajax过程中最后的那一圈也算上了
        if(animateArea=='decoration'){
          var finalRotate = (json.data.index+0.5)*360/options.lotteris.length+360*(options.animation.rotateCountAfterAjax+1)+startDeg;
        }else{
          var finalRotate = 360-(json.data.index+0.5)*360/options.lotteris.length+360*(options.animation.rotateCountAfterAjax+1)-startDeg;
        }
        
        canvas.style[pfx("transition")] = "all "+ options.animation.timeAfterAjax + "s cubic-bezier(0.33,0.5,0.66,0.83)";
        canvas.style[pfx("transform")] = "rotate("+  finalRotate +"deg)";      
      }else{
        this.reset(); 
        options.doSthAfterAjaxError && options.doSthAfterAjaxError(json);
        
      }



    },
    reset:function(){
      this.status = 0;
      this.textArea.innerText = this.options.msg.ready;
      var animateArea = this.options.animation.area;
      if(animateArea=='decoration'){
        var canvasStyle = this.canvas2.style;
      }else{
        var canvasStyle = this.canvas1.style;
      }
      
      canvasStyle[pfx('transition')] = "0s";
      canvasStyle[pfx('transform')] = "rotate(0deg)";

      return this;
    }

  }
  window.Lottery = Lottery;

})(window);









