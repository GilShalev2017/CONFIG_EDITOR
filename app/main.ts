import {app, BrowserWindow, ipcMain, screen} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as xml2js from 'xml2js';

//TODO read the paths from a dedicated path, filled by the user where C:\Actus\Config is located!
const insightProvidersXmlFilePath = "C:\\ActDev\\src\\Services\\ActIntelligenceService\\InsightProviders.xml";//path.join(app.getPath('userData'), 'config.xml'); // Example path
//const insightProvidersXmlFilePath = "C:\\Actus\\Config\\InsightProviders.xml";//path.join(app.getPath('userData'), 'config.xml'); // Example path
const aiLanguagesXmlFilePath = "C:\\ActDev\\src\\Services\\ActIntelligenceService\\AILanguages.xml";//path.join(app.getPath('userData'), 'config.xml'); // Example path
//const insightProvidersXmlFilePath = "C:\\Actus\\Config\\AILanguages.xml";//path.join(app.getPath('userData'), 'config.xml'); // Example path


function readXml(xmlFilePath: string, callback: (err: Error | null, result: any) => void) {
  fs.readFile(xmlFilePath, 'utf8', (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    xml2js.parseString(data, (parseErr, result) => {
      if (parseErr) {
        callback(parseErr, null);
        return;
      }
      //console.log(JSON.stringify(result, null, 2)); // Log the parsed object
      callback(null, result); // Return the parsed object
    });
  });
}

function writeXml(xmlFilePath: string, obj: any, callback: (err: Error | null) => void) {
  const builder = new xml2js.Builder();
  const xml = builder.buildObject(obj);
  fs.writeFile(xmlFilePath, xml, callback);
}

ipcMain.handle('read-insight-providers-xml', async (event) => {
  return new Promise((resolve, reject) => {
    readXml(insightProvidersXmlFilePath,(err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result); // Resolve with the parsed XML
    });
  });
});

ipcMain.handle('save-insight-providers-xml', async (event, newData) => {
  return new Promise((resolve, reject) => {
    writeXml(insightProvidersXmlFilePath, newData, (writeErr) => {
      if (writeErr) {
        reject(writeErr);
      } else {
        resolve('XML updated successfully');
      }
    });
  });
});


ipcMain.handle('read-ai-languages-xml', async (event) => {
  return new Promise((resolve, reject) => {
    readXml(aiLanguagesXmlFilePath,(err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result); // Resolve with the parsed XML
    });
  });
});

ipcMain.handle('save-ai-languages-xml', async (event, newData) => {
  return new Promise((resolve, reject) => {
    writeXml(aiLanguagesXmlFilePath, newData, (writeErr) => {
      if (writeErr) {
        reject(writeErr);
      } else {
        resolve('XML updated successfully');
      }
    });
  });
});

let win: BrowserWindow | null = null;
const args = process.argv.slice(1), serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    //show: true,
    //height: 600,
    //width: 800,
    //autoHideMenuBar: false,
    //frame: false, // Remove the window frame
    //transparent: true, // Make the window transparent
    //alwaysOnTop: true, // Keep the window on top (optional)
    //skipTaskbar: true, // Hide from taskbar (optional)
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,
    },
  });

  win.setMenu(null);


  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}











/*
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as xml2js from 'xml2js';

const xmlFilePath = "C:\\ActDev\\src\\Services\\ActIntelligenceService\\InsightProviders.xml";

function readXml(callback: (err: Error | null, result: any) => void) {
  fs.readFile(xmlFilePath, 'utf8', (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    xml2js.parseString(data, callback);
  });
}

function writeXml(obj: any, callback: (err: Error | null) => void) {
  const builder = new xml2js.Builder();
  const xml = builder.buildObject(obj);
  fs.writeFile(xmlFilePath, xml, callback);
}

ipcMain.handle('read-xml', async () => {
  return new Promise((resolve, reject) => {
    readXml((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
});

ipcMain.handle('save-insight-providers-xml', async (_, newData) => {
  return new Promise((resolve, reject) => {
    writeXml(newData, (writeErr) => {
      if (writeErr) {
        reject(writeErr);
      } else {
        resolve('XML updated successfully');
      }
    });
  });
});

let mainWindow: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.includes('--serve');

app.whenReady().then(() => {
  const size = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    show: true, // Ensure the window is shown immediately
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
      contextIsolation: false,
    },
  });

  mainWindow.setMenu(null);

  if (serve) {
    const debug = require('electron-debug');
    debug();
    require('electron-reloader')(module);
    mainWindow.loadURL('http://localhost:4200');
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    app.whenReady().then(() => {
      mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
          nodeIntegration: true,
        },
      });

      mainWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`);

      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    });
  }
});
*/