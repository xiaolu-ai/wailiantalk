(function(){
    /* 1. 动态加载 MQTT 库 */
    if(!window.Paho){
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js';
        s.onload = init;
        document.body.appendChild(s);
    } else { init(); }

    function init(){
        var HOST = 'https://xiaolu-ai.github.io/wailiantalk/mobile.html';
        var BROKER = 'broker.emqx.io';
        var PORT = 8084;
        var RID = 'fx_' + Math.random().toString(36).substr(2,6);
        var client = null;
        var retryCount = 0;
        
        if(document.getElementById('fx-box')) return alert('已运行');

        /* UI */
        var box = document.createElement('div');
        box.id = 'fx-box';
        box.style.cssText = 'position:fixed;top:20px;right:20px;z-index:2147483647;width:180px;background:white;padding:15px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.2);text-align:center;font-family:sans-serif;border:1px solid #eee';
        
        var msg = document.createElement('div');
        msg.innerText = '正在连接...';
        msg.style.cssText = 'color:#666;font-size:13px;margin:10px 0;padding:8px;background:#f9f9f9;border-radius:4px;word-break:break-all;';

        var img = document.createElement('img');
        img.style.cssText = 'width:140px;height:140px;display:block;margin:0 auto;opacity:0.5';
        
        var close = document.createElement('div');
        close.innerHTML = '×';
        close.style.cssText = 'position:absolute;right:10px;top:5px;cursor:pointer;font-size:20px;color:#999';
        close.onclick = function(){ 
            if(client && client.isConnected()) client.disconnect(); 
            box.remove(); 
        };

        var btn = document.createElement('button');
        btn.innerText = '复制';
        btn.style.cssText = 'background:#0071fd;color:white;border:none;padding:8px 15px;border-radius:6px;cursor:pointer;width:100%;font-size:14px;';
        btn.onclick = function(){
            var txt = msg.getAttribute('data-text');
            if(txt) navigator.clipboard.writeText(txt).then(()=>alert('已复制'));
        };

        box.appendChild(close);
        box.appendChild(img);
        box.appendChild(msg);
        box.appendChild(btn);
        document.body.appendChild(box);

        /* 核心连接逻辑 */
        function connect(){
            // 每次连接生成新 ID 避免冲突
            var clientId = "client_" + RID + "_" + new Date().getTime();
            client = new Paho.MQTT.Client(BROKER, PORT, clientId);
            
            client.onConnectionLost = function(obj) { 
                console.log("连接断开:", obj.errorMessage);
                msg.innerText = '⚠️ 连接断开，正在重连...';
                msg.style.color = 'orange';
                img.style.opacity = '0.5';
                
                // 自动重连机制
                setTimeout(connect, 2000); 
            };

            client.onMessageArrived = function(message) {
                var txt = message.payloadString;
                msg.innerText = txt;
                msg.setAttribute('data-text', txt);
                msg.style.color = '#333';
                msg.style.fontWeight = 'bold';
                
                var el = document.activeElement;
                if(el && (el.tagName=='INPUT' || el.tagName=='TEXTAREA')){
                    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                    if(nativeSetter && el.tagName=='INPUT'){
                        nativeSetter.call(el, txt);
                    } else {
                        el.value = txt;
                    }
                    el.dispatchEvent(new Event('input', {bubbles:true}));
                }
                navigator.clipboard.writeText(txt).catch(function(){});
            };

            client.connect({
                useSSL: true, 
                keepAliveInterval: 30, // 30秒心跳保活
                timeout: 10,
                onSuccess: function() {
                    retryCount = 0;
                    msg.innerText = '🟢 云端已连接';
                    msg.style.color = 'green';
                    img.style.opacity = '1';
                    var url = HOST + '?room=' + RID + '&mqtt=1'; 
                    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=' + encodeURIComponent(url);
                    client.subscribe("fx_channel/" + RID);
                },
                onFailure: function(e) {
                    console.log("连接失败:", e);
                    msg.innerText = '❌ 连接失败:' + e.errorMessage;
                    setTimeout(connect, 5000);
                }
            });
        }

        connect();
    }
})();
