(function(){
    // 1. 基础配置
    var MOBILE_URL = "https://xiaolu-ai.github.io/wailiantalk/mobile.html";
    var API_KEY = "Mk5nC300w1sl179427027p34986797";
    var CLUSTER = "free.blr2.piesocket.com";

    // 2. 防重复检查
    if(document.getElementById("fx-root")){
        alert("插件正在运行中");
        return;
    }

    // 3. 生成连接信息
    var roomId = "fx_" + Math.random().toString(36).substr(2, 6);
    var link = MOBILE_URL + "?room=" + roomId;

    // 4. 创建 UI
    var root = document.createElement("div");
    root.id = "fx-root";
    root.style.cssText = "position:fixed;top:20px;right:20px;z-index:2147483647;width:200px;background:white;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:sans-serif;text-align:center;border:1px solid #ddd;overflow:hidden;";

    // 标题栏
    var header = document.createElement("div");
    header.style.cssText = "background:#f5f5f7;padding:10px;font-size:14px;color:#333;font-weight:bold;display:flex;justify-content:space-between;align-items:center;";
    header.innerHTML = '<span>📱 扫码连接</span><span style="cursor:pointer;font-size:20px;" onclick="document.getElementById(\'fx-root\').remove()">×</span>';

    // 二维码
    var qrBox = document.createElement("div");
    qrBox.style.padding = "15px";
    var img = document.createElement("img");
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=" + encodeURIComponent(link);
    img.style.cssText = "width:150px;height:150px;display:block;margin:0 auto;";
    qrBox.appendChild(img);

    // 状态文字
    var status = document.createElement("div");
    status.id = "fx-status";
    status.innerText = "等待手机连接...";
    status.style.cssText = "padding:10px;background:#fafafa;color:#666;font-size:13px;border-top:1px solid #eee;";

    // 复制按钮
    var btn = document.createElement("button");
    btn.innerText = "复制内容";
    btn.style.cssText = "width:100%;padding:12px;background:#0071fd;color:white;border:none;cursor:pointer;font-size:14px;font-weight:bold;";
    btn.onclick = function(){
        var text = status.getAttribute("data-raw");
        if(text){
            navigator.clipboard.writeText(text).then(function(){
                btn.innerText = "已复制！";
                setTimeout(function(){ btn.innerText = "复制内容"; }, 1000);
            }).catch(function(){
                prompt("请手动复制：", text);
            });
        } else {
            alert("暂无内容可复制");
        }
    };

    root.appendChild(header);
    root.appendChild(qrBox);
    root.appendChild(status);
    root.appendChild(btn);
    document.body.appendChild(root);

    // 5. 连接 WebSocket
    console.log("正在连接 WebSocket:", roomId);
    var ws = new WebSocket("wss://" + CLUSTER + "/v3/" + roomId + "?api_key=" + API_KEY + "&notify_self=0");

    ws.onopen = function(){
        status.innerText = "🟢 服务已连接，请扫码";
        status.style.color = "green";
    };

    ws.onmessage = function(e){
        console.log("收到消息:", e.data);
        try {
            var data = JSON.parse(e.data);
            if(data.text){
                // 更新 UI
                status.innerText = "收到: " + data.text;
                status.setAttribute("data-raw", data.text);
                status.style.color = "#0071fd";
                
                // 尝试自动填入
                var active = document.activeElement;
                if(active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.contentEditable === "true")){
                    // 针对 React/Vue 的特殊处理
                    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                    if(active.tagName === "INPUT" && nativeSetter){
                        nativeSetter.call(active, data.text);
                    } else {
                        active.value = data.text;
                    }
                    active.dispatchEvent(new Event("input", {bubbles: true}));
                    status.innerText = "✅ 已自动填入";
                }
            }
        } catch(err){
            console.error(err);
        }
    };

    ws.onerror = function(){
        status.innerText = "❌ 连接失败，请检查网络";
        status.style.color = "red";
    };
})();