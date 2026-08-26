const DEFAULT_IP = "127.0.0.1";
const DEFAULT_PORT = 9020;

const PRESET_PAYLOADS = [
    {
        id: "goldhen",
        name: "GoldHEN",
        tag: "v2.4b18",
        desc: "Full Homebrew Enabler, Debug Settings, Package Installer & Plugin Loader",
        file: "payload.bin",
        icon: "🎮",
        port: 9020
    },
    {
        id: "ftp",
        name: "FTPServer",
        tag: "Port 2121",
        desc: "High-speed File Transfer Protocol server for PS4 internal & external storage",
        file: "payloads/ftpsrv-ps4.bin",
        icon: "📁",
        port: 9020
    },
    {
        id: "ps4debug",
        name: "PS4Debug",
        tag: "Debugger",
        desc: "Kernel debugger for trainers, cheat tools, and memory manipulation",
        file: "payloads/ps4debug.bin",
        icon: "🐞",
        port: 9020
    },
    {
        id: "orbis_toolbox",
        name: "Orbis Toolbox",
        tag: "System UI",
        desc: "Custom UI modifications, live system monitoring (FPS/Temp), and utilities",
        file: "payloads/orbis_toolbox.bin",
        icon: "🛠️",
        port: 9020
    },
    {
        id: "app2usb",
        name: "App2USB",
        tag: "Storage",
        desc: "Move installed games and applications from internal HDD to USB drive",
        file: "payloads/app2usb.bin",
        icon: "💾",
        port: 9020
    },
    {
        id: "webrte",
        name: "WebRTE / Cheats",
        tag: "Cheats",
        desc: "Real-Time Cheats payload for PS4 Trainer and Memory Editor",
        file: "payloads/webrte.bin",
        icon: "⚡",
        port: 9020
    },
    {
        id: "linux",
        name: "Linux Loader",
        tag: "1GB-4GB",
        desc: "Boot Linux distribution directly on PS4 from USB installation",
        file: "payloads/linux.bin",
        icon: "🐧",
        port: 9020
    },
    {
        id: "binloader",
        name: "BinLoader Port",
        tag: "Port 9020",
        desc: "Activate Netcat/BinLoader server on port 9020 for custom payload injection",
        file: "payloads/binloader.bin",
        icon: "📡",
        port: 9020
    }
];

function showToast(message, type, duration) {
    if (!type) type = "info";
    if (duration === undefined) duration = 4000;
    let container = document.getElementById("payload-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "payload-toast-container";
        container.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:380px;width:calc(100% - 48px);";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "payload-toast toast-" + type;
    
    let borderColor = "#00e5ff";
    let icon = "ℹ️";
    if (type === "ok" || type === "success") { borderColor = "#00f5a0"; icon = "✅"; }
    else if (type === "bad" || type === "error") { borderColor = "#ff3366"; icon = "❌"; }
    else if (type === "warn") { borderColor = "#ffb703"; icon = "⚠️"; }

    toast.style.cssText = "background: rgba(12, 16, 26, 0.94); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid " + borderColor + "; box-shadow: 0 8px 30px rgba(0,0,0,0.6); color: #f0f4f8; border-radius: 12px; padding: 12px 16px; font-size: 13px; font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; gap: 12px; pointer-events: auto; transform: translateY(20px); opacity: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);";

    toast.innerHTML = "<span style=\"font-size:16px;\">" + icon + "</span><div style=\"flex:1;word-break:break-word;line-height:1.4;\">" + message + "</div>";

    container.appendChild(toast);

    requestAnimationFrame(function () {
        toast.style.transform = "translateY(0)";
        toast.style.opacity = "1";
    });

    if (duration > 0) {
        setTimeout(function () {
            toast.style.transform = "translateY(10px)";
            toast.style.opacity = "0";
            setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, duration);
    }

    return {
        update: function (newMessage, newType) {
            if (newType) {
                if (newType === "ok" || newType === "success") { borderColor = "#00f5a0"; icon = "✅"; }
                else if (newType === "bad" || newType === "error") { borderColor = "#ff3366"; icon = "❌"; }
                else if (newType === "warn") { borderColor = "#ffb703"; icon = "⚠️"; }
                toast.style.borderColor = borderColor;
            }
            toast.innerHTML = "<span style=\"font-size:16px;\">" + icon + "</span><div style=\"flex:1;word-break:break-word;line-height:1.4;\">" + newMessage + "</div>";
        },
        remove: function () {
            toast.style.transform = "translateY(10px)";
            toast.style.opacity = "0";
            setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }
    };
}

async function transmitPayload(buffer, name, ip, port) {
    const toast = showToast("Iniciando envio de <b>" + name + "</b> (" + buffer.byteLength + " bytes)...", "info", 0);

    try {
        if (typeof window.__sendPayloadDirect === "function") {
            toast.update("Injetando <b>" + name + "</b> via syscall direta...", "info");
            const sentBytes = await window.__sendPayloadDirect(buffer, port || DEFAULT_PORT);
            toast.update("<b>" + name + "</b> injetado com sucesso (" + sentBytes + " bytes)!", "success");
            setTimeout(toast.remove, 4000);
            return;
        }

        toast.update("Enviando <b>" + name + "</b> para <b>" + ip + ":" + port + "</b>...", "info");
        
        try {
            const response = await fetch("/api/payload/send?ip=" + encodeURIComponent(ip) + "&port=" + encodeURIComponent(port) + "&name=" + encodeURIComponent(name), {
                method: "POST",
                body: buffer
            });
            if (response.ok) {
                toast.update("<b>" + name + "</b> enviado com sucesso para " + ip + ":" + port + "!", "success");
                setTimeout(toast.remove, 4000);
                return;
            }
        } catch (err) { }

        if (window.p && typeof window.p.write8 === "function" && typeof window.__executePayloadMemory === "function") {
            toast.update("Mapeando e executando <b>" + name + "</b> na memoria RWX...", "info");
            await window.__executePayloadMemory(buffer);
            toast.update("<b>" + name + "</b> executado com sucesso no kernel!", "success");
            setTimeout(toast.remove, 4000);
            return;
        }

        toast.update("Payload <b>" + name + "</b> pronto! Envie via Netcat: <code style=\"color:#00e5ff\">nc " + ip + " " + port + " &lt; " + name + "</code>", "warn");
        setTimeout(toast.remove, 7000);

    } catch (e) {
        console.error("Payload transmission failed:", e);
        toast.update("Falha ao injetar <b>" + name + "</b>: " + ((e && e.message) || e), "error");
        setTimeout(toast.remove, 5000);
    }
}

async function sendPresetPayload(payloadObj, ip, port) {
    const toast = showToast("Baixando <b>" + payloadObj.name + "</b>...", "info", 0);
    try {
        const resp = await fetch(payloadObj.file);
        if (!resp.ok) {
            throw new Error("Arquivo " + payloadObj.file + " nao encontrado no servidor (HTTP " + resp.status + ")");
        }
        const buffer = await resp.arrayBuffer();
        toast.remove();
        await transmitPayload(buffer, payloadObj.name, ip, port || payloadObj.port || DEFAULT_PORT);
    } catch (e) {
        toast.update("Erro ao carregar <b>" + payloadObj.name + "</b>: " + e.message, "error");
        setTimeout(toast.remove, 5000);
    }
}

function initPayloadMenu() {
    let menuEl = document.getElementById("payload-menu-container");
    if (!menuEl) return;

    const grid = menuEl.querySelector(".payload-grid");
    if (grid) {
        grid.innerHTML = PRESET_PAYLOADS.map(function (p) {
            return "<div class=\"payload-card\" data-id=\"" + p.id + "\" tabindex=\"0\">"
                + "<div class=\"payload-card-top\">"
                + "<span class=\"payload-icon\">" + p.icon + "</span>"
                + "<span class=\"payload-tag\">" + p.tag + "</span>"
                + "</div>"
                + "<div class=\"payload-name\">" + p.name + "</div>"
                + "<div class=\"payload-desc\">" + p.desc + "</div>"
                + "<button class=\"payload-btn\" onclick=\"window.triggerSendPreset('" + p.id + "')\">"
                + "<span>Injetar Payload</span>"
                + "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-7.85-1.42 1.42L16.86 11H5v2z\"/></svg>"
                + "</button>"
                + "</div>";
        }).join("");
    }

    const fileInput = document.getElementById("custom-payload-file");
    if (fileInput) {
        fileInput.addEventListener("change", function (e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function () {
                const ip = (document.getElementById("target-ip") || {}).value || DEFAULT_IP;
                const port = parseInt((document.getElementById("target-port") || {}).value, 10) || DEFAULT_PORT;
                await transmitPayload(reader.result, file.name, ip, port);
            };
            reader.readAsArrayBuffer(file);
        });
    }
}

window.triggerSendPreset = function (id) {
    const p = PRESET_PAYLOADS.find(function (x) { return x.id === id; });
    if (!p) return;
    const ip = (document.getElementById("target-ip") || {}).value || DEFAULT_IP;
    const port = parseInt((document.getElementById("target-port") || {}).value, 10) || p.port || DEFAULT_PORT;
    sendPresetPayload(p, ip, port);
};

window.showPayloadMenu = function () {
    const menuEl = document.getElementById("payload-menu-container");
    if (menuEl) {
        menuEl.style.display = "block";
        menuEl.scrollIntoView({ behavior: "smooth" });
    }
    showToast("Exploit concluido com sucesso! Painel de Payloads ativado.", "ok", 4000);
};

window.hidePayloadMenu = function () {
    const menuEl = document.getElementById("payload-menu-container");
    if (menuEl) menuEl.style.display = "none";
};

window.showPayloadToast = showToast;
window.transmitPayload = transmitPayload;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPayloadMenu);
} else {
    initPayloadMenu();
}
