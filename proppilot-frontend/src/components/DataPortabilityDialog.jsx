import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material'
import {
  CloudDownload,
  CloudUpload,
  Home,
  People,
  Description,
  Payment,
  CheckCircle,
  Error,
  Warning,
  Close,
  FileDownload
} from '@mui/icons-material'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { useLanguage } from '../contexts/LanguageContext'

export default function DataPortabilityDialog({ open, onClose }) {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importStep, setImportStep] = useState('upload') // upload | preview | importing | complete
  const [preview, setPreview] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [error, setError] = useState(null)

  const handleExport = useCallback(async () => {
    setExporting(true)
    setError(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/data/export`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'mis_datos.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(language === 'es' ? 'Error al exportar datos' : 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }, [language])

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/data/template`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'plantilla_importacion.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(language === 'es' ? 'Error al descargar plantilla' : 'Failed to download template')
    }
  }, [language])

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${API_BASE_URL}/data/import/preview`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setPreview(response.data)
      setImportStep('preview')
    } catch (err) {
      setError(language === 'es' ? 'Error al procesar archivo' : 'Failed to process file')
    } finally {
      setImporting(false)
    }
  }, [language])

  const handleConfirmImport = useCallback(async () => {
    if (!preview) return

    setImportStep('importing')
    setError(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/data/import/execute`, preview, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      setImportResult(response.data)
      setImportStep('complete')
    } catch (err) {
      setError(language === 'es' ? 'Error al importar datos' : 'Failed to import data')
      setImportStep('preview')
    }
  }, [preview, language])

  const handleResetImport = useCallback(() => {
    setImportStep('upload')
    setPreview(null)
    setImportResult(null)
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    handleResetImport()
    onClose()
  }, [handleResetImport, onClose])

  const renderExportTab = () => (
    <Box sx={{ pt: 2 }}>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {language === 'es'
          ? 'Descarga todos tus datos en un archivo Excel con hojas separadas para propiedades, inquilinos, contratos y pagos.'
          : 'Download all your data in an Excel file with separate sheets for properties, tenants, leases, and payments.'}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <CloudDownload />}
            onClick={handleExport}
            disabled={exporting}
          >
            {language === 'es' ? 'Descargar Mis Datos' : 'Download My Data'}
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<FileDownload />}
            onClick={handleDownloadTemplate}
          >
            {language === 'es' ? 'Descargar Plantilla Vacia' : 'Download Empty Template'}
          </Button>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        {language === 'es'
          ? 'El archivo incluye todas tus propiedades, inquilinos, contratos y pagos en formato legible.'
          : 'The file includes all your properties, tenants, leases, and payments in a readable format.'}
      </Alert>
    </Box>
  )

  const renderUploadStep = () => (
    <Box sx={{ pt: 2, textAlign: 'center' }}>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {language === 'es'
          ? 'Sube un archivo Excel (.xlsx) con tus datos. El sistema validara la informacion antes de importar.'
          : 'Upload an Excel file (.xlsx) with your data. The system will validate the information before importing.'}
      </Typography>

      <Button
        component="label"
        variant="contained"
        size="large"
        startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
        disabled={importing}
      >
        {language === 'es' ? 'Seleccionar Archivo' : 'Select File'}
        <input
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={handleFileUpload}
        />
      </Button>

      <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {language === 'es' ? 'Hojas esperadas:' : 'Expected sheets:'}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>Propiedades / Properties</li>
          <li>Inquilinos / Tenants</li>
          <li>Contratos / Leases</li>
          <li>Pagos / Payments</li>
        </Box>
      </Alert>
    </Box>
  )

  const renderPreviewStep = () => {
    if (!preview) return null

    const totalValid = (preview.properties?.filter(r => r.valid).length || 0) +
                       (preview.tenants?.filter(r => r.valid).length || 0) +
                       (preview.leases?.filter(r => r.valid).length || 0) +
                       (preview.payments?.filter(r => r.valid).length || 0)

    const totalErrors = (preview.properties?.filter(r => !r.valid).length || 0) +
                        (preview.tenants?.filter(r => !r.valid).length || 0) +
                        (preview.leases?.filter(r => !r.valid).length || 0) +
                        (preview.payments?.filter(r => !r.valid).length || 0)

    const totalNew = (preview.properties?.filter(r => r.action === 'CREATE').length || 0) +
                     (preview.tenants?.filter(r => r.action === 'CREATE').length || 0) +
                     (preview.leases?.filter(r => r.action === 'CREATE').length || 0) +
                     (preview.payments?.filter(r => r.action === 'CREATE').length || 0)

    const totalSkip = (preview.properties?.filter(r => r.action === 'SKIP').length || 0) +
                      (preview.tenants?.filter(r => r.action === 'SKIP').length || 0) +
                      (preview.leases?.filter(r => r.action === 'SKIP').length || 0) +
                      (preview.payments?.filter(r => r.action === 'SKIP').length || 0)

    return (
      <Box sx={{ pt: 2 }}>
        {/* Summary chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            icon={<CheckCircle />}
            label={`${totalNew} ${language === 'es' ? 'nuevos' : 'new'}`}
            color="success"
            size="small"
          />
          <Chip
            icon={<Warning />}
            label={`${totalSkip} ${language === 'es' ? 'existentes' : 'existing'}`}
            color="info"
            size="small"
          />
          {totalErrors > 0 && (
            <Chip
              icon={<Error />}
              label={`${totalErrors} ${language === 'es' ? 'errores' : 'errors'}`}
              color="error"
              size="small"
            />
          )}
        </Box>

        {/* Preview by entity type */}
        {preview.properties?.length > 0 && (
          <PreviewSection
            title={language === 'es' ? 'Propiedades' : 'Properties'}
            icon={<Home />}
            rows={preview.properties}
            getLabel={(row) => row.data?.street ? `${row.data.street} ${row.data.streetNumber || ''}` : '-'}
            language={language}
          />
        )}

        {preview.tenants?.length > 0 && (
          <PreviewSection
            title={language === 'es' ? 'Inquilinos' : 'Tenants'}
            icon={<People />}
            rows={preview.tenants}
            getLabel={(row) => row.data?.fullName || '-'}
            language={language}
          />
        )}

        {preview.leases?.length > 0 && (
          <PreviewSection
            title={language === 'es' ? 'Contratos' : 'Leases'}
            icon={<Description />}
            rows={preview.leases}
            getLabel={(row) => row.data?.propertyAddress || '-'}
            language={language}
          />
        )}

        {preview.payments?.length > 0 && (
          <PreviewSection
            title={language === 'es' ? 'Pagos' : 'Payments'}
            icon={<Payment />}
            rows={preview.payments}
            getLabel={(row) => row.data?.amount ? `$${row.data.amount}` : '-'}
            language={language}
          />
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
          <Button onClick={handleResetImport}>
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmImport}
            disabled={totalNew === 0}
          >
            {language === 'es' ? `Importar ${totalNew} registros` : `Import ${totalNew} records`}
          </Button>
        </Box>
      </Box>
    )
  }

  const renderImportingStep = () => (
    <Box sx={{ pt: 4, pb: 4, textAlign: 'center' }}>
      <CircularProgress size={48} sx={{ mb: 2 }} />
      <Typography variant="h6">
        {language === 'es' ? 'Importando datos...' : 'Importing data...'}
      </Typography>
    </Box>
  )

  const renderCompleteStep = () => {
    if (!importResult) return null

    return (
      <Box sx={{ pt: 2 }}>
        <Alert severity={importResult.success ? 'success' : 'warning'} sx={{ mb: 2 }}>
          {importResult.success
            ? (language === 'es' ? 'Importacion completada exitosamente!' : 'Import completed successfully!')
            : (language === 'es' ? 'Importacion completada con algunos errores' : 'Import completed with some errors')}
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h4">{importResult.propertiesCreated}</Typography>
              <Typography variant="body2">{language === 'es' ? 'Propiedades' : 'Properties'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h4">{importResult.tenantsCreated}</Typography>
              <Typography variant="body2">{language === 'es' ? 'Inquilinos' : 'Tenants'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h4">{importResult.leasesCreated}</Typography>
              <Typography variant="body2">{language === 'es' ? 'Contratos' : 'Leases'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="h4">{importResult.paymentsCreated}</Typography>
              <Typography variant="body2">{language === 'es' ? 'Pagos' : 'Payments'}</Typography>
            </Box>
          </Grid>
        </Grid>

        {importResult.skipped > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {importResult.skipped} {language === 'es' ? 'registros omitidos (ya existian)' : 'records skipped (already existed)'}
          </Typography>
        )}

        {importResult.errorMessages?.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {language === 'es' ? 'Errores:' : 'Errors:'}
            </Typography>
            {importResult.errorMessages.slice(0, 5).map((msg, i) => (
              <Typography key={i} variant="body2">- {msg}</Typography>
            ))}
            {importResult.errorMessages.length > 5 && (
              <Typography variant="body2">
                ... {language === 'es' ? `y ${importResult.errorMessages.length - 5} mas` : `and ${importResult.errorMessages.length - 5} more`}
              </Typography>
            )}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="contained" onClick={handleClose}>
            {language === 'es' ? 'Cerrar' : 'Close'}
          </Button>
        </Box>
      </Box>
    )
  }

  const renderImportTab = () => {
    switch (importStep) {
      case 'upload':
        return renderUploadStep()
      case 'preview':
        return renderPreviewStep()
      case 'importing':
        return renderImportingStep()
      case 'complete':
        return renderCompleteStep()
      default:
        return renderUploadStep()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '50vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {language === 'es' ? 'Importar / Exportar Datos' : 'Import / Export Data'}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(e, newVal) => {
            setActiveTab(newVal)
            if (newVal === 1) handleResetImport()
          }}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab
            icon={<CloudDownload />}
            iconPosition="start"
            label={language === 'es' ? 'Exportar' : 'Export'}
          />
          <Tab
            icon={<CloudUpload />}
            iconPosition="start"
            label={language === 'es' ? 'Importar' : 'Import'}
          />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {activeTab === 0 && renderExportTab()}
        {activeTab === 1 && renderImportTab()}
      </DialogContent>
    </Dialog>
  )
}

function PreviewSection({ title, icon, rows, getLabel, language }) {
  if (!rows?.length) return null

  const validCount = rows.filter(r => r.valid).length
  const newCount = rows.filter(r => r.action === 'CREATE').length
  const skipCount = rows.filter(r => r.action === 'SKIP').length
  const errorCount = rows.filter(r => !r.valid).length

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {icon}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Chip label={rows.length} size="small" />
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>{language === 'es' ? 'Datos' : 'Data'}</TableCell>
              <TableCell width={100}>{language === 'es' ? 'Accion' : 'Action'}</TableCell>
              <TableCell width={80}>{language === 'es' ? 'Estado' : 'Status'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 10).map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  bgcolor: !row.valid ? 'error.lighter' : row.action === 'SKIP' ? 'action.hover' : 'inherit'
                }}
              >
                <TableCell>{row.rowNumber}</TableCell>
                <TableCell>
                  {getLabel(row)}
                  {row.errors?.length > 0 && (
                    <Typography variant="caption" color="error" display="block">
                      {row.errors.join(', ')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.action === 'CREATE'
                      ? (language === 'es' ? 'Nuevo' : 'New')
                      : row.action === 'SKIP'
                        ? (language === 'es' ? 'Omitir' : 'Skip')
                        : (language === 'es' ? 'Error' : 'Error')}
                    size="small"
                    color={row.action === 'CREATE' ? 'success' : row.action === 'SKIP' ? 'default' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  {row.valid ? (
                    <CheckCircle color="success" fontSize="small" />
                  ) : (
                    <Tooltip title={row.errors?.join(', ') || ''}>
                      <Error color="error" fontSize="small" />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length > 10 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    ... {language === 'es' ? `y ${rows.length - 10} mas` : `and ${rows.length - 10} more`}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
