const {app,BrowserWindow} = require("electron");
const path = require("path");

const nuevaVista = () => {
    const win = new BrowserWindow({
        width:1920,
        height:1080,
        webPreferences:{
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true,
            preload: path.join(__dirname,"preload.js")
        }
    })

    win.loadFile(path.join(__dirname, "index.html"));

    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const niveles = ['LOG', 'INFO', 'WARN', 'ERROR'];
        const nivel = niveles[level] || 'LOG';
        console.log(`[VENTANA ${nivel}] ${message} (${sourceId}:${line})`);
    });

    win.webContents.openDevTools();
    return win;
}

app.whenReady().then(()=>{
    nuevaVista()
})