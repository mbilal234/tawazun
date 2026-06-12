import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import * as os from 'os'

// One-time migration: copy data from old "budget-app" folder into the new "tawazun" folder
function migrateAppData(): void {
  const oldDir = join(os.homedir(), 'AppData', 'Roaming', 'budget-app')
  const newDir = app.getPath('userData')
  if (oldDir === newDir || !fs.existsSync(oldDir)) return
  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true })
  for (const file of ['transactions.csv', 'savings-categories.json', 'last-import-batch.json']) {
    const src = join(oldDir, file)
    const dst = join(newDir, file)
    if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst)
  }
}
import {
  readAllTransactions,
  appendTransaction,
  deleteTransactionById,
  updateTransactionCategory,
  readCategories,
  writeCategories,
  previewImport,
  appendManyTransactions,
  getLastImportBatch,
  deleteLastImportBatch,
} from './csvStore'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#ffffff',
    icon: join(__dirname, '../../resources/icon.ico'),
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  migrateAppData()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('transactions:getAll', () => readAllTransactions())

ipcMain.handle('transactions:add', (_, transaction) =>
  appendTransaction(transaction)
)

ipcMain.handle('transactions:delete', (_, { id }) =>
  deleteTransactionById(id)
)

ipcMain.handle('export:saveCsv', async (_, { csv, filename }) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: filename,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
  })
  if (!filePath) return { success: false }
  fs.writeFileSync(filePath, csv, 'utf8')
  return { success: true, path: filePath }
})

ipcMain.handle('export:savePdf', async (_, { dataUri, filename }) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: filename,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
  })
  if (!filePath) return { success: false }
  const base64 = dataUri.replace(/^data:application\/pdf;base64,/, '')
  fs.writeFileSync(filePath, base64, 'base64')
  return { success: true, path: filePath }
})

ipcMain.handle('transactions:updateCategory', (_, { id, category }) =>
  updateTransactionCategory(id, category)
)

ipcMain.handle('categories:get', () => readCategories())

ipcMain.handle('categories:save', (_, { categories }) => {
  writeCategories(categories)
  return { success: true }
})

ipcMain.handle('import:preview', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select CSV file to import',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  try {
    return previewImport(result.filePaths[0])
  } catch (err) {
    return { error: String(err), transactions: [], skipped: 0, format: 'unknown' }
  }
})

ipcMain.handle('import:commit', (_, { transactions }) =>
  appendManyTransactions(transactions)
)

ipcMain.handle('import:getBatch', () => getLastImportBatch())
ipcMain.handle('import:deleteBatch', () => deleteLastImportBatch())

ipcMain.on('window:minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
ipcMain.on('window:maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win?.isMaximized()) win.unmaximize()
  else win?.maximize()
})
ipcMain.on('window:close', () => BrowserWindow.getFocusedWindow()?.close())
