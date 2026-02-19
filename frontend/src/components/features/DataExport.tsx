import { getExportJsonUrl, getExportCsvUrl } from '../../api'

export default function DataExport() {
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Export Data</h3>
      
      <div className="flex gap-3">
        <a
          href={getExportJsonUrl()}
          download="training_data.json"
          className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors text-center"
        >
          📄 JSON
        </a>
        <a
          href={getExportCsvUrl()}
          download="training_data.csv"
          className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors text-center"
        >
          📊 CSV
        </a>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Export all your training data for analysis in spreadsheets or other tools.
      </p>
    </div>
  )
}
