// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { BrowserWindow } = require('electron').remote;
const path = require('path');

let loadWin = () => {
    const modalPath = path.join('file://', __dirname, 'views/menu.html');
    let win = new BrowserWindow(
        { 
            // width: 500, 
            // height: 500,
            frame: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload_menu.js')
            },
            center: true,
            fullscreen: true 
        });
    win.loadURL(modalPath);
    win.show();
    // win.webContents.openDevTools()
}

var mysql = require('mysql');
conn = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'simtoquamariadb',
    database: 'Restaurant',
    port: 3306
});

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }

    for (const type of['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }

    menu = loadWin;
    set = (usr) => {

        require('electron').remote.getGlobal('PUBLIC').usr = {
            id: usr.id,
            ut_id: usr.ut_id,
            name: usr.name
        }
        
    };
});