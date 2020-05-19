"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
function createWindow() {
    var mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
    });
    mainWindow.loadFile("index.html");
}
electron_1.app.whenReady().then(function () {
    createWindow();
});
electron_1.app.on("window-all-closed", function () {
    electron_1.app.quit();
});
