(function(){
    /* 1. 动态加载 MQTT 库 */
    if(!window.Paho){
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js';
        s.onload = init;
        document.body.appendChild(s);
    } else { init(); }

    function init(){
        /* 配置 */
        // ⚠️ 请确保这里是您真实的 GitHub Pages 地址
        var HOST = 'https://xiaolu-ai.github.io/wailiantalk/mobile.html';
        var MQTT_BROKER = 'broker.emqx.io';
        var MQTT_PORT = 8084;
        var RID = 'fx_' + Math.random().toString(36).substr(2,6);
        
        if(document.getElementById('fx-box')) return alert('已运行');

        /* UI */
        var box = document.createElement('div');
        box.id = 'fx-box';
        box.style.cssText = 'position:fixed;top:20px;right:20px;z-index:2147483647;width:180px;background:white;padding:15px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.2);text-align:center;font-family:sans-serif;border:1px solid #eee';
        
        var msg = document.createElement('div');
        msg.innerText = '正在连接云端...';
        msg.style.cssText = 'color:#666;font-size:13px;margin:10px 0;padding:8px;background:#f9f9f9;border-radius:4px;word-break:break-all;';

        var img = document.createElement('img');
        img.style.cssText = 'width:140px;height:140px;display:block;margin:0 auto;opacity:0.5';
        
        var close = document.createElement('div');
        close.innerHTML = '×';
        close.style.cssText = 'position:absolute;right:10px;top:5px;cursor:pointer;font-size:20px;color:#999';
        close.onclick = function(){ 
            if(window.fxClient) window.fxClient.disconnect(); 
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

        /* MQTT 连接 */
        var client = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, "client_" + RID);
        window.fxClient = client; // 暴露给全局以便关闭
        
        client.onConnectionLost = function(obj) { 
            msg.innerText = '❌ 连接断开:' + obj.errorMessage; 
            msg.style.color = 'red';
        };

        client.onMessageArrived = function(message) {
            var txt = message.payloadString;
            
            // UI更新
            msg.innerText = txt;
            msg.setAttribute('data-text', txt);
            msg.style.color = '#333';
            msg.style.fontWeight = 'bold';
            
            // 自动填入
            var el = document.activeElement;
            if(el && (el.tagName=='INPUT' || el.tagName=='TEXTAREA')){
                // 尝试 React/Vue 兼容写法
                var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                if(nativeSetter && el.tagName=='INPUT'){
                    nativeSetter.call(el, txt);
                } else {
                    el.value = txt;
                }
                el.dispatchEvent(new Event('input', {bubbles:true}));
            }
            
            // 自动复制
            navigator.clipboard.writeText(txt).catch(function(){});
        };

        client.connect({
            useSSL: true,
            onSuccess: function() {
                msg.innerText = '🟢 云端已连接';
                msg.style.color = 'green';
                img.style.opacity = '1';
                var url = HOST + '?room=' + RID + '&mqtt=1'; 
                img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=0&data=' + encodeURIComponent(url);
                client.subscribe("fx_channel/" + RID);
            },
            onFailure: function(e) {
                msg.innerText = '连接失败:' + e.errorMessage;
            }
        });
    }
})();
