const path = require('path');
const axios = require('axios');
const fs = require('fs');

const {app, dialog} = require('electron');
const {pipeline} = require('stream/promises');

const Config = require('./config');
const log = require('./logger').GetLogger('Updater');

const AppDataPath = app.getPath('userData');
const UpdaterPath = path.join(AppDataPath, 'CVRUpdater');

const binaryContentType = 'application/octet-stream';
const windowsPlatform = 'win32';
const latestRelease = 'https://api.github.com/repos/AstroDogeDX/CVRX/releases/latest';

const currentVersion = `v${app.getVersion()}`;

const checkUpdatesIntervalMinutes = 15;
const activelyCheckRateLimit = 2 * 60 * 1000;

let ignoredForNow = false;
let dialogOpened = false;
let activelyCheckForUpdatesTimeout = null;

exports.Setup = async (mainWindow) => {

    // Ensure we have the directory created
    await fs.promises.mkdir(UpdaterPath, {recursive: true});

    // Clear installer filers
    for (const fileName of await fs.promises.readdir(UpdaterPath)) {
        if (!fileName.endsWith('.exe')) continue;
        const filePath = path.join(UpdaterPath, fileName);
        log.info(`[ClearInstallerFiles] Clearing previous update file: ${filePath}`);
        await fs.promises.unlink(filePath);
    }

    setInterval(exports.CheckLatestRelease, checkUpdatesIntervalMinutes * 60 * 1000, mainWindow);
};

exports.CheckLatestRelease = async (mainWindow, bypassIgnores = false) => {

    if (bypassIgnores) {
        if (activelyCheckForUpdatesTimeout && activelyCheckForUpdatesTimeout > Date.now()) {
            const msg = `Manually checked for updates too recently.
            You can try again in: ${(activelyCheckForUpdatesTimeout - Date.now()) / 1000} seconds.`;
            log.info(`[CheckLatestRelease] ${msg}`);
            return { hasUpdates: null, msg: msg };
        }
        activelyCheckForUpdatesTimeout = Date.now() + activelyCheckRateLimit;
    }

    if (dialogOpened) {
        const msg = 'Skipping because the previous dialog is still open';
        log.info(`[CheckLatestRelease] ${msg}`);
        return { hasUpdates: null, msg: msg };
    }

    if (!bypassIgnores && ignoredForNow) {
        const msg = 'Skipping check since user requested to ignore...';
        log.info(`[CheckLatestRelease] ${msg}`);
        return { hasUpdates: null, msg: msg };
    }

    try {

        log.info('[CheckLatestRelease] Checking for updates...');

        const {data} = await axios.get(latestRelease);
        const tagName = data.tag_name;

        if (tagName !== currentVersion) {
            log.warn(`[CheckLatestRelease] There is a new version available (${tagName}), installed version: ${currentVersion}`);
        }
        else {
            const msg = `You have the current latest version: ${tagName}!`;
            log.info(`[CheckLatestRelease] ${msg}`);
            return { hasUpdates: false, msg: msg };
        }

        // We're only supporting auto update on Windows
        if (process.platform !== windowsPlatform) {
            const msg = `This platform (${process.platform}) doesn't support auto-updates. You will need to install the update manually :(`;
            log.info(`[CheckLatestRelease] ${msg}`);
            return { hasUpdates: true, msg: msg };
        }

        if (!bypassIgnores && tagName === Config.GetUpdaterIgnoreVersion()) {
            const msg = `Ignoring ${tagName} because you chose to skip it...`;
            log.info(`[CheckLatestRelease] ${msg}`);
            return { hasUpdates: true, msg: msg };
        }

        // Iterate the assets and find an .exe
        for (const asset of data.assets) {
            if (asset.content_type !== binaryContentType || path.extname(asset.name) !== '.exe') continue;

            const changeLogs = data.body;

            const updateMessage = `A new version (${tagName}) of CVRX is available!\nHere are the changes:\n\n${changeLogs}`;

            const options = {
                type: 'question',
                buttons: ['Download and Install', `Ask again in ${checkUpdatesIntervalMinutes} min`, 'Ignore until Restart', 'Skip this version'],
                defaultId: 0,
                title: 'Update Available',
                message: updateMessage,
                detail: 'Choose an option:',
                cancelId: 1,
                noLink: true,
                normalizeAccessKeys: true,
            };


            dialogOpened = true;
            const dialogResponse = await dialog.showMessageBox(mainWindow, options);
            if (dialogResponse.response === 0) {
                await DownloadFile(asset.browser_download_url, asset.name);
            }
            if (dialogResponse.response === 1) {
                // Clear ignore version setting
                await Config.SetUpdaterIgnoreVersion(null);
            } else if (dialogResponse.response === 2) {
                // Mark as ignored, we won't bother the user again until next launch
                ignoredForNow = true;
                // Clear ignore version setting
                await Config.SetUpdaterIgnoreVersion(null);
            } else if (dialogResponse.response === 3) {
                // Mark to skip this version
                await Config.SetUpdaterIgnoreVersion(tagName);
            }
            dialogOpened = false;

            const msg = `You chose the option ${options.buttons[dialogResponse.response]}!`;
            log.info(`[CheckLatestRelease] ${msg}`);
            return { hasUpdates: true, msg: msg };
        }

        log.error('[CheckLatestRelease] Filed to find a file ending in .exe in the Github Latest Releases!');
    } catch (error) {
        dialogOpened = false;
        log.error(`[CheckLatestRelease] [Error] ${latestRelease}`, error.toString());
        throw new Error(`Error: ${error.toString()}`);
    }
};


async function DownloadFile(assetUrl, assetName) {

    // We're only supporting auto update on Windows
    if (process.platform !== windowsPlatform) {
        log.error(`[DownloadFile] We only support auto-updating on Windows, your current platform: ${process.platform}`);
        return;
    }

    await fs.promises.mkdir(UpdaterPath, {recursive: true});
    log.info(`[DownloadFile] Downloading ${assetUrl} to ${UpdaterPath}...`);
    const response = await axios.get(assetUrl, {responseType: 'stream'});
    const filepath = path.join(UpdaterPath, assetName);
    await pipeline(response.data, fs.createWriteStream(filepath));
    log.info(`[DownloadFile] Finished downloading to: ${filepath}`);

    await InstallLatestRelease(assetName);
}

async function InstallLatestRelease(assetName) {

    // We're only supporting auto update on Windows
    if (process.platform !== windowsPlatform) {
        log.error(`[InstallLatestRelease] We only support auto-updating on Windows, your current platform: ${process.platform}`);
        return;
    }

    const filepath = path.join(UpdaterPath, assetName);
    log.info(`[InstallLatestRelease] Quitting and installing: ${filepath}`);
    app.relaunch({execPath: filepath});
    app.quit();
}
