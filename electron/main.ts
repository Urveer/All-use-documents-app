import { app, BrowserWindow, ipcMain, session } from "electron";
import { fileURLToPath } from "node:url";
import fs from "fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

// Fix __dirname in ES module
export const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempJsonPath = path.join(__dirname, "temp.json");

// Define paths
const APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "";
const RENDERER_DIST = path.join(APP_ROOT, "dist");

// Set VITE_PUBLIC for assets
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(APP_ROOT, "public") : RENDERER_DIST;

let win: BrowserWindow | null;

// ✅ Function to create the main Electron window
function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.mjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    win.webContents.on("did-fail-load", (_event, _errorCode, errorDescription) => {
        console.error("❌ Failed to load page:", errorDescription);
    });

    const isDev = !!VITE_DEV_SERVER_URL;
    const loadPath = isDev
        ? VITE_DEV_SERVER_URL
        : `file://${path.join(RENDERER_DIST, "index.html")}`;

    console.log(`📁 Loading: ${loadPath}`); // ✅ Debugging log

    win.loadURL(loadPath).catch((err) => {
        console.error("❌ Failed to load page:", err);
    });
}

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
        win = null;
    }
});

// ✅ Recreate window when the app is activated (MacOS behavior)
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ✅ Delete temp.json file on app exit
app.on("before-quit", () => {
    if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
        console.log("🗑️ temp.json deleted on app exit.");
    }
});

// ✅ IPC Handlers
ipcMain.on("delete-temp-json", () => {
    if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
        console.log("🗑️ temp.json deleted manually.");
    }
});

ipcMain.on("save-json", (_event, data) => {
    fs.writeFile(tempJsonPath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error("❌ Failed to save JSON:", err);
        } else {
            console.log("✅ JSON file saved:", tempJsonPath);
        }
    });
});

// ✅ Setup Content Security Policy
app.whenReady().then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const isDev = !!VITE_DEV_SERVER_URL;
        const cspPolicy = isDev
            ? "default-src 'self' http://localhost:3000 ws://localhost:3000; " +
            "script-src 'self' 'unsafe-inline' http://localhost:3000 ws://localhost:3000; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "connect-src 'self' ws://localhost:3000 http://localhost:3000;"
            : "default-src 'self'; " + // ✅ Stronger security for production
            "script-src 'self'; " +
            "style-src 'self' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "connect-src 'self';";

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": cspPolicy
            }
        });
    });
    app.commandLine.appendSwitch("disable-features", "AutofillServerCommunication");
    createWindow();
});
