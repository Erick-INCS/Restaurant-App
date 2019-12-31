alert(4);

const { BrowserWindow } = require('electron').remote;
alert(5);

const path = require('path');

const btn = $('#btn');


btn.click(() => {
    alert(1);
});