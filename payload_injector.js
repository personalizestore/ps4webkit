// RAW GAME - PS4 Payload Injector & Sender Module
// Fully optimized for PS4 WebKit (Solid rendering, no backdrop-filter glitches)

(function () {
    "use strict";

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
            name: "FTP Server",
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
            id: "disable_updates",
            name: "Disable Updates",
            tag: "Blocker",
            desc: "Bloqueia e desativa atualizações automáticas de firmware do PS4",
            file: "payloads/disable-updates.bin",
            icon: "🛡️",
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

    // Toast Notification System - PS4 WebKit Safe
    function showToast(message, type, duration) {
        if (!type) type = "info";
        if (duration === undefined) duration = 4500;
        let container = document.getElementById("payload-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "payload-toast-container";
            container.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:380px;width:calc(100% - 48px);";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = "payload-toast toast-" + type;
        
        let borderColor = "#00e5ff";
        let icon = "ℹ️";
        if (type === "ok" || type === "success") { borderColor = "#00f5a0"; icon = "✅"; }
        else if (type === "bad" || type === "error") { borderColor = "#ff3366"; icon = "❌"; }
        else if (type === "warn") { borderColor = "#ffb703"; icon = "⚠️"; }

        toast.style.cssText = "background: #0d121d; border: 2px solid " + borderColor + "; box-shadow: 0 4px 20px #000; color: #f0f4f8; border-radius: 10px; padding: 12px 16px; font-size: 13px; font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; gap: 10px; pointer-events: auto;";

        toast.innerHTML = "<span style=\"font-size:18px;\">" + icon + "</span><div style=\"flex:1;word-break:break-word;line-height:1.4;\">" + message + "</div>";

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
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
                toast.innerHTML = "<span style=\"font-size:18px;\">" + icon + "</span><div style=\"flex:1;word-break:break-word;line-height:1.4;\">" + newMessage + "</div>";
            },
            remove: function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }
        };
    }

    // Direct in-memory payload execution using exploit primitives if available
    async function executeInMemory(buffer, name) {
        if (!window.p || typeof window.p.write8 !== "function" || !window.scAny || !window.SYS9 || !window.callAddr) {
            return false;
        }

        const p = window.p;
        const payload = new Uint8Array(buffer);
        const psize = (payload.length + 0x3fff) & ~0x3fff;
        const pr = 7; // RWX
        const MAP_PRIVATE = 2, MAP_ANON = 0x1000;

        const em = window.scAny(window.SYS9.mmap, 0, psize, pr, MAP_PRIVATE | MAP_ANON, -1, 0);
        if (em.i32 === -1 || (em.lo === 0 && em.hi === 0)) {
            throw new Error("mmap RWX recusado pelo kernel");
        }

        const entry = new window.int64(em.lo, em.hi);

        for (let o = 0; o < payload.length; o += 8) {
            let lo = 0, hi = 0;
            for (let k = 0; k < 4; ++k) lo |= (payload[o + k] || 0) << (8 * k);
            for (let k = 0; k < 4; ++k) hi |= (payload[o + 4 + k] || 0) << (8 * k);
            p.write8(entry.add32(o), new window.int64(lo >>> 0, hi >>> 0));
        }

        if (window.pthreadCreateAddr) {
            const thr = p.malloc ? p.malloc(8) : entry.add32(psize - 0x100);
            const rc = window.callAddr(window.pthreadCreateAddr, thr, 0, entry, 0).i32;
            if (rc !== 0) throw new Error("pthread_create retornou " + rc);
            return true;
        }

        return true;
    }

    // Payload Transmitter Engine
    async function transmitPayload(buffer, name, ip, port) {
        const toast = showToast("Iniciando envio de <b>" + name + "</b> (" + buffer.byteLength + " bytes)...", "info", 0);

        try {
            try {
                const memOk = await executeInMemory(buffer, name);
                if (memOk) {
                    toast.update("<b>" + name + "</b> injetado com sucesso na memória RWX!", "success");
                    setTimeout(toast.remove, 4500);
                    return;
                }
            } catch (memErr) {
                console.warn("Direct memory execute fallback:", memErr);
            }

            if (typeof window.__sendPayloadDirect === "function") {
                toast.update("Injetando <b>" + name + "</b> via syscall direta...", "info");
                const sentBytes = await window.__sendPayloadDirect(buffer, port || DEFAULT_PORT);
                toast.update("<b>" + name + "</b> injetado com sucesso (" + sentBytes + " bytes)! Porta " + port, "success");
                setTimeout(toast.remove, 4500);
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
                    setTimeout(toast.remove, 4500);
                    return;
                }
            } catch (netErr) { }

            toast.update("Payload <b>" + name + "</b> pronto! Porta " + port + " pronta.<br>Se necessário, envie via PC: <code style=\"color:#00e5ff;\">nc " + ip + " " + port + " &lt; " + name + "</code>", "ok");
            setTimeout(toast.remove, 8000);

        } catch (e) {
            console.error("Payload transmission failed:", e);
            toast.update("Falha ao injetar <b>" + name + "</b>: " + ((e && e.message) || e), "error");
            setTimeout(toast.remove, 5000);
        }
    }

    // Load payload file from server and send
    async function sendPresetPayload(payloadObj, ip, port) {
        const toast = showToast("Carregando <b>" + payloadObj.name + "</b>...", "info", 0);
        try {
            let resp = null;
            try {
                resp = await fetch(payloadObj.file);
            } catch (err) { }

            if (!resp || !resp.ok) {
                resp = await fetch("payload.bin");
            }

            if (!resp || !resp.ok) {
                throw new Error("Arquivo " + payloadObj.file + " não encontrado.");
            }

            const buffer = await resp.arrayBuffer();
            toast.remove();
            await transmitPayload(buffer, payloadObj.name, ip, port || payloadObj.port || DEFAULT_PORT);
        } catch (e) {
            toast.update("Erro ao carregar <b>" + payloadObj.name + "</b>: " + e.message, "error");
            setTimeout(toast.remove, 5000);
        }
    }

    // Global trigger helper
    window.triggerSendPreset = function (id) {
        const p = PRESET_PAYLOADS.find(function (x) { return x.id === id; });
        if (!p) return;
        const ip = (document.getElementById("target-ip") || {}).value || DEFAULT_IP;
        const port = parseInt((document.getElementById("target-port") || {}).value, 10) || p.port || DEFAULT_PORT;
        
        sendPresetPayload(p, ip, port);
    };

    // Initialize UI and attach listeners
    function initPayloadMenu() {
        let menuEl = document.getElementById("payload-menu-container");
        if (!menuEl) return;

        const grid = menuEl.querySelector(".payload-grid");
        if (grid) {
            grid.innerHTML = PRESET_PAYLOADS.map(function (p) {
                return "<a href=\"javascript:void(0);\" class=\"payload-card\" data-id=\"" + p.id + "\" role=\"button\" tabindex=\"0\" onclick=\"window.triggerSendPreset('" + p.id + "'); return false;\">"
                    + "<div class=\"payload-card-top\">"
                    + "<span class=\"payload-icon\">" + p.icon + "</span>"
                    + "<span class=\"payload-tag\">" + p.tag + "</span>"
                    + "</div>"
                    + "<div class=\"payload-name\">" + p.name + "</div>"
                    + "<div class=\"payload-desc\">" + p.desc + "</div>"
                    + "<div class=\"payload-btn\">"
                    + "<span>Injetar " + p.name + "</span>"
                    + "</div>"
                    + "</a>";
            }).join("");

            const cards = grid.querySelectorAll(".payload-card");
            cards.forEach(function (card) {
                card.addEventListener("click", function (e) {
                    e.preventDefault();
                    const id = card.getAttribute("data-id");
                    window.triggerSendPreset(id);
                });
                card.addEventListener("keydown", function (e) {
                    if (e.key === "Enter" || e.key === " " || e.keyCode === 13 || e.keyCode === 32 || e.keyCode === 0) {
                        e.preventDefault();
                        const id = card.getAttribute("data-id");
                        window.triggerSendPreset(id);
                    }
                });
            });
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

    window.showPayloadMenu = function () {
        const menuEl = document.getElementById("payload-menu-container");
        if (menuEl) {
            menuEl.style.display = "block";
            try {
                menuEl.scrollIntoView({ behavior: "smooth", block: "start" });
            } catch (e) {
                window.scrollTo(0, menuEl.offsetTop);
            }
        }
        showToast("Painel de Payloads ativado!", "ok", 3000);
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
})();
