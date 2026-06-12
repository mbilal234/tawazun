import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getAllTransactions: () => ipcRenderer.invoke('transactions:getAll'),
  addTransaction: (t: unknown) => ipcRenderer.invoke('transactions:add', t),
  deleteTransaction: (id: string) =>
    ipcRenderer.invoke('transactions:delete', { id }),
  updateTransactionCategory: (id: string, category: string) =>
    ipcRenderer.invoke('transactions:updateCategory', { id, category }),

  getCategories: () => ipcRenderer.invoke('categories:get'),
  saveCategories: (categories: string[]) =>
    ipcRenderer.invoke('categories:save', { categories }),

  saveCsv: (csv: string, filename: string) =>
    ipcRenderer.invoke('export:saveCsv', { csv, filename }),
  savePdf: (dataUri: string, filename: string) =>
    ipcRenderer.invoke('export:savePdf', { dataUri, filename }),

  previewImport: () => ipcRenderer.invoke('import:preview'),
  commitImport: (transactions: unknown[]) =>
    ipcRenderer.invoke('import:commit', { transactions }),
  getLastImportBatch: () => ipcRenderer.invoke('import:getBatch'),
  deleteLastImportBatch: () => ipcRenderer.invoke('import:deleteBatch'),

  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
})
