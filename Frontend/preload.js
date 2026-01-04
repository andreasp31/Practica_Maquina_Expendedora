// Este archivo permite comunicación segura entre main y renderer
const { contextBridge } = require('electron');

// Expone APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    // Puedes añadir más APIs aquí si las necesitas
});