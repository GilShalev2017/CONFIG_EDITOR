import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
import axios, { AxiosError } from 'axios';
import { Provider } from '../src/app/models/model';
import { exec, execSync } from 'child_process';

//TODO read the paths from a dedicated path, filled by the user where C:\Actus\Config is located!
const insightProvidersXmlFilePath = "C:\\ActDev\\src\\Services\\ActIntelligenceService\\InsightProviders.xml";//path.join(app.getPath('userData'), 'config.xml'); // Example path
//const insightProvidersXmlFilePath = "C:\\Actus\\Config\\InsightProviders.xml";//path.join(app.getPath('userData'), 'config.xml'); // Example path
const aiLanguagesXmlFilePath = "C:\\ActDev\\src\\Services\\ActIntelligenceService\\AILanguages.xml";//path.join(app.getPath('userData'), 'config.xml'); // Example path
//const aiLanguagesXmlFilePath = "C:\\Actus\\Config\\AILanguages.xml";//path.join(app.getPath('userData'), 'config.xml'); // Example path
const providersBaseUrl = 'http://localhost:8894/intelligence/api/aiprovider';

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
    readXml(insightProvidersXmlFilePath, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result); // Resolve with the parsed XML
    });
  });
});

// ipcMain.handle('save-insight-providers-xml', async (event, newData) => {
//   return new Promise((resolve, reject) => {
//     writeXml(insightProvidersXmlFilePath, newData, (writeErr) => {
//       if (writeErr) {
//         reject(writeErr);
//       } else {
//         resolve('XML updated successfully');
//       }
//     });
//   });
// });

ipcMain.handle('read-ai-languages-xml', async (event) => {
  return new Promise((resolve, reject) => {
    readXml(aiLanguagesXmlFilePath, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result); // Resolve with the parsed XML
    });
  });
});


function writeLanguagesXml(xmlFilePath: string, newLanguages: any[], callback: (err: Error | null) => void) {
  // XML declaration
  const xmlDeclaration = `<?xml version="1.0" encoding="utf-8"?>`;

  // Initial XML Comment
  const xmlCommentStart = `<!--
This file contains the language list that will be displayed to the user.
These are the languages that we want to enable for Actus AI Operations.
If you want to enable a language - make sure it is not commented.
DO NOT restart the service in case you alter this file. The service will pick up the new file when you refresh the UI.

If there are languages with dialects, they will be set up like this:

      <language englishName="English"      displayName="English"                  isocode="en" />
      <language englishName="English (UK)" displayName="English United Kingdom"   isocode="en-GB" />

Details on the properties
  englishName - this is unique; it is used as a key, to make the connection between the actual language and the code that each AI provider uses internally.
  displayName - this is the language that will be displayed to the user. 
  
Note on the language string that we display to the user. 
   Usually, this will be the displayName that we set up in this file.
      
   In case one AI provider detects a language that is not defined inside this file - then the user will see the englishName value in the UI.
   If you want to change that, you have to add/enable the language in this file.
   For example, if the AI provider detected "Kurdish (Northern)" , but you want to display to the user only "Kurdish" string, then you will add this line to the file:
   <language englishName="Kurdish (Northern)" displayName="Kurdish"  isocode="ku" />
-->`;

  // Final XML Comment (Added at the end of the file)
  const xmlCommentEnd = `<!--
installation / upgrade / add new provider / change display name ; who is owning the data. 
initial setup for languages: all languages in the world. 
setup per provider - each provider will give its languages. how? 
languages - not in DB? keep all in XML and read it in memory at startup.
each provider - has a language mapping file.

- - - - display name + code name (ISO code) + English name - useful for autodetection.
comparison - case insensitive; spaces removed.
AIClip - language English name instead of current languageId.
languages in a separate file - will include all combinations of display name + code name (ISO code) + English name - commented out. keep only 4 as default.
French (Canadian) - if it is not found, use French.

test full scenario: installation + POC using our own keys. full scenario from a user perspective.
how do we limit? datetime, number of credits. how can we extend the limit? the experience of the user.
test with minimum providers. 0 provider; 1 provider - transcriber.
radio channels - what is the experience?
-->`;

  // Transform the new languages list to match the correct XML format
  const formattedObj = {
    languages: {
      language: newLanguages.map(lang => ({
        $: {
          englishName: lang.englishName,
          displayName: lang.displayName,
          isocode: lang.isocode
        }
      }))
    }
  };

  // Build XML with formatting
  const builder = new xml2js.Builder({
    headless: true, // Prevents an extra XML declaration from being added
    renderOpts: { pretty: true, indent: '  ', newline: '\n' }, // Pretty formatting
    attrkey: '$' // Store attributes properly
  });

  // Generate XML from object
  const xmlBody = builder.buildObject(formattedObj);

  // Combine XML declaration, initial comment, generated XML, and final comment
  const finalXml = `${xmlDeclaration}\n${xmlCommentStart}\n${xmlBody}\n${xmlCommentEnd}`;

  // Write back the updated XML file
  fs.writeFile(xmlFilePath, finalXml, callback);
}

ipcMain.handle('save-ai-languages-xml', async (event, newData) => {
  return new Promise((resolve, reject) => {
    writeLanguagesXml(aiLanguagesXmlFilePath, newData, (writeErr) => {
      if (writeErr) {
        reject(writeErr);
      } else {
        resolve('XML updated successfully');
      }
    });
  });
});

ipcMain.handle('test-provider', async (event, provider) => {
  try {
    const response = await axios.post(
      'http://localhost:8894/intelligence/api/aiprovider/test',
      {
        providersTestRequest: {
          SelectedProviderIds: [provider.apiInternalKey],
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('API Response:', response.data);
    return response.data; // Return the response data if needed
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // Now you can access error.response, error.request, etc.
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Response Data:', axiosError.response.data);
        console.error('Response Status:', axiosError.response.status);
        console.error('Response Headers:', axiosError.response.headers);
      } else if (axiosError.request) {
        console.error('Request Error:', axiosError.request);
      } else {
        console.error('Error Message:', axiosError.message);
      }
    } else if (error instanceof Error) {
      // Handle generic JavaScript errors
      console.error("Generic Error:", error.message);
    } else {
      // Handle other types of errors (e.g., strings, numbers)
      console.error("Unknown Error:", error);
    }
    throw error;
  }
});

ipcMain.handle('test-provider-connection', async (event, provider) => {
  try {
    const apiUrlParam = provider.apiUrl ? `&apiUrl=${provider.apiUrl}` : '';

    const response = await axios.get(
      `http://localhost:8894/intelligence/api/aiprovider/testconnection?providerId=${provider.apiInternalKey}${apiUrlParam}`
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError: AxiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Response Data:', axiosError.response.data);
        console.error('Response Status:', axiosError.response.status);
        console.error('Response Headers:', axiosError.response.headers);
      } else if (axiosError.request) {
        console.error('Request Error:', axiosError.request);
      } else {
        console.error('Error Message:', axiosError.message);
      }
    } else if (error instanceof Error) {
      console.error('Generic Error:', error.message);
    } else {
      console.error('Unknown Error:', error);
    }
    throw error;
  }
});

ipcMain.handle('save-provider-configuration', async (event, provider) => {
  return new Promise((resolve, reject) => {
    fs.readFile(insightProvidersXmlFilePath, 'utf8', (readErr, xmlData) => {
      if (readErr) {
        reject(readErr);
        return;
      }

      xml2js.parseString(xmlData, (parseErr, result) => {
        if (parseErr) {
          reject(parseErr);
          return;
        }

        const providers = result.configuration.aiProviders[0].provider;
        const providerToUpdateIndex = providers.findIndex((p: any) => p.$.name === provider.name);

        if (providerToUpdateIndex === -1) {
          reject(new Error(`Provider with name ${provider.name} not found.`));
          return;
        }

        const providerToUpdate = providers[providerToUpdateIndex];

        // Update provider fields
        providerToUpdate.enabled = [String(provider.enabled)];
        providerToUpdate.testPass = [String(provider.testPass)];

        console.log(result); // Inspect the parsed object

        //for whisperTranscriber, speechMatixTranscriber (on-premise)
        if (typeof provider.apiUrl === "string" && provider.apiUrl.trim()) {
          providerToUpdate.apiUrl = [provider.apiUrl];
        }

        //for azureTranslator
        if (typeof provider.location === "string" && provider.location.trim()) {
          providerToUpdate.location = [provider.location];
        }

        //for azureTranslator, openAiTranscriber, speechMatixTranscriber (cloud)
        if (typeof provider.apiKey === "string" && provider.apiKey.trim()) {
          providerToUpdate.apiKey = [provider.apiKey];
        }

        //for speechMatixTranscriber
        if (typeof provider.serviceType === "string" && provider.serviceType.trim()) {
          providerToUpdate.serviceType = [provider.serviceType];
        }

        //for azureVideoIndexer
        if (typeof provider.entraclientid === "string" && provider.entraclientid.trim()) {
          providerToUpdate.entraclientid = [provider.entraclientid];
        }

        if (typeof provider.entratenantid === "string" && provider.entratenantid.trim()) {
          providerToUpdate.entratenantid = [provider.entratenantid];
        }

        if (typeof provider.armvilocation === "string" && provider.armvilocation.trim()) {
          providerToUpdate.armvilocation = [provider.armvilocation];
        }

        if (typeof provider.armviaccountname === "string" && provider.armviaccountname.trim()) {
          providerToUpdate.armviaccountname = [provider.armviaccountname];
        }

        if (typeof provider.armviaccountid === "string" && provider.armviaccountid.trim()) {
          providerToUpdate.armviaccountid = [provider.armviaccountid];
        }

        if (typeof provider.armvisubscriptionid === "string" && provider.armvisubscriptionid.trim()) {
          providerToUpdate.armvisubscriptionid = [provider.armvisubscriptionid];
        }

        if (typeof provider.armviresourcegroup === "string" && provider.armviresourcegroup.trim()) {
          providerToUpdate.armviresourcegroup = [provider.armviresourcegroup];
        }

        const builder = new xml2js.Builder();

        const updatedXml = builder.buildObject(result);

        fs.writeFile(insightProvidersXmlFilePath, updatedXml, 'utf8', (writeErr) => {
          if (writeErr) {
            reject(writeErr);
          } else {
            resolve('Provider configuration updated successfully');
          }
        });
      });
    });
  });
});

ipcMain.handle('save-insight-providers-xml', async (event, newProviders: Provider[]) => {
  return new Promise((resolve, reject) => {
    fs.readFile(insightProvidersXmlFilePath, 'utf8', (readErr, xmlData) => {
      if (readErr) {
        reject(readErr);
        return;
      }

      xml2js.parseString(xmlData, (parseErr, result) => {
        if (parseErr) {
          reject(parseErr);
          return;
        }

        // Use the correct XML structure
        if (!result.configuration || !result.configuration.aiProviders || !result.configuration.aiProviders[0].provider) {
          reject(new Error('Invalid XML structure: Missing <configuration><aiProviders><provider> elements.'));
          return;
        }

        // Get the providers array
        const providers = result.configuration.aiProviders[0].provider;

        // Ensure providers is an array
        if (!Array.isArray(providers)) {
          reject(new Error('Invalid XML structure: <provider> should be an array.'));
          return;
        }

        // Update provider order while keeping the original XML structure
        result.configuration.aiProviders[0].provider = newProviders.map((newProvider: Provider) => {
          const existingProvider = providers.find((p: any) => p.$.name === newProvider.name);
          if (existingProvider) {
            existingProvider.$.position = String(newProviders.indexOf(newProvider));
            return existingProvider;
          } else {
            return { $: { name: newProvider.name, position: String(newProviders.indexOf(newProvider)) } };
          }
        });

        const builder = new xml2js.Builder();
        const updatedXml = builder.buildObject(result);

        fs.writeFile(insightProvidersXmlFilePath, updatedXml, 'utf8', (writeErr) => {
          if (writeErr) {
            reject(writeErr);
          } else {
            resolve('Provider order updated successfully');
          }
        });
      });
    });
  });
});

function killProcess(processName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32'
      ? `taskkill /F /IM ${processName}`
      : `pkill -f ${processName}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error killing process: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`Process ${processName} terminated successfully.`);
      resolve();
    });
  });
}

function isProcessRunning(processName: string): boolean {
  try {
    const command = process.platform === 'win32'
      ? `tasklist | findstr /I ${processName}`
      : `pgrep -f ${processName}`;

    const output = execSync(command).toString();
    return output.includes(processName);
  } catch {
    return false;
  }
}

async function waitForProcessToStart(processName: string, timeout: number = 5000, interval: number = 2000): Promise<void> {
  console.log(`Waiting for ${processName} to start...`);

  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (isProcessRunning(processName)) {
      console.log(`Process ${processName} is running again!`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout: ${processName} did not start within ${timeout / 1000} seconds.`);
}

async function restartWatcherProcess(processName: string) {
  try {
    await killProcess(processName);
    await waitForProcessToStart(processName);
    console.log(`${processName} has restarted.`);
  } catch (error) {
    console.error(`Error in restart process: ${error}`);
  }
}

ipcMain.handle('re-launch-actintelligenceservice', async (event) => {
  await restartWatcherProcess('ActIntelligenceService.exe');
  return 'ActIntelligenceService.exe has been re-launched successfully.';
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