# Transformer Management System - React Frontend

A modern React-based web application for managing electrical transformers and their inspection records. This system provides a comprehensive interface for tracking transformer details, scheduling inspections, uploading thermal images, performing AI-powered analysis, and maintaining detailed maintenance records.

## 🌟 Features

### Transformer Management
- **Add, view, edit, and delete transformers** with detailed information
- **Track essential transformer details**: number, pole, region, type (Bulk/Distribution), location, and weather conditions
- **Upload and manage baseline thermal images** for each transformer
- **Search and filter transformers** by various fields
- **View complete inspection history** for each transformer

### Inspection Workflow
- **Schedule inspections** with date, inspector, and notes
- **Track inspection progress** with status indicators (Pending, Uploaded, Analyzed, Reviewed)
- **Upload maintenance thermal images** during inspections
- **AI-powered thermal analysis** for detecting anomalies
- **Compare baseline and maintenance images** side-by-side with zoom and pan capabilities
- **Add detailed annotations** to thermal images with different severity levels
- **Record maintenance actions** and observations

### Data Management
- **Export annotation logs** to JSON or CSV formats
- **Comprehensive search and filtering** across all entities
- **Real-time data synchronization** with backend API
- **Settings page** for system configuration and data export

### User Interface
- **Clean, intuitive interface** with sidebar navigation
- **Tab-based organization** for different views (Details, Inspections)
- **Modal dialogs** for adding/editing records
- **Image zoom and pan** functionality for detailed thermal image inspection
- **Interactive annotation tools** with color-coded severity levels
- **Responsive design** for various screen sizes

## 🛠️ Tech Stack

- **React 19.2.0** - UI framework
- **Vite 7.2.4** - Build tool and development server
- **React Zoom Pan Pinch** - Image manipulation and annotation
- **ESLint** - Code quality and linting
- **CSS3** - Styling

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** (version 16 or higher recommended)
- **npm** or **yarn** package manager
- **Backend API** running on `http://localhost:8000` (required for full functionality)

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Transformer-Management-System/react-front-end.git
   cd react-front-end
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## ▶️ Running the Application

### Development Mode

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Production Build

Build the application for production:

```bash
npm run build
```

The optimized production files will be generated in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## 🔌 API Configuration

The application expects a backend API to be running at:

```
http://localhost:8000/api
```

### API Endpoints Used

- `GET /api/transformers` - Fetch all transformers
- `POST /api/transformers` - Create or update transformer
- `DELETE /api/transformers/:id` - Delete transformer
- `GET /api/inspections` - Fetch all inspections
- `POST /api/inspections` - Create inspection
- `PUT /api/inspections/:id` - Update inspection
- `DELETE /api/inspections/:id` - Delete inspection
- `GET /api/annotation-logs/export/json` - Export annotation logs as JSON
- `GET /api/annotation-logs/export/csv` - Export annotation logs as CSV

**Note**: Ensure your backend is configured to handle CORS requests from the frontend origin.

## 📁 Project Structure

```
react-front-end/
├── public/              # Static assets
│   └── vite.svg        # Vite logo
├── src/
│   ├── assets/         # Images and other assets
│   ├── components/     # React components
│   │   ├── InspectionList.jsx
│   │   ├── InspectionModal.jsx
│   │   ├── InspectionViewModal.jsx
│   │   ├── MaintenanceRecordForm.jsx
│   │   ├── RecordHistory.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Tabs.jsx
│   │   ├── TransformerInspectionsPage.jsx
│   │   ├── TransformerList.jsx
│   │   ├── TransformerModal.jsx
│   │   └── ZoomAnnotatedImage.jsx
│   ├── styles/         # CSS stylesheets
│   ├── App.jsx         # Main application component
│   ├── App.css         # Application styles
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── eslint.config.js    # ESLint configuration
├── package.json        # Project dependencies
└── README.md           # This file
```

## 📜 Available Scripts

- **`npm run dev`** - Start development server with HMR
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint to check code quality

## 🎯 Usage Guide

### Adding a Transformer

1. Navigate to the "Details" tab
2. Click the "Add Transformer" button
3. Fill in the transformer details (number, pole, region, type, etc.)
4. Optionally upload a baseline thermal image
5. Click "Save" to add the transformer

### Scheduling an Inspection

1. Navigate to the "Inspection" tab
2. Click "Schedule Inspection"
3. Select a transformer from the dropdown
4. Fill in the inspection date, inspector name, and any notes
5. Click "Schedule Inspection" to create the record

### Viewing and Analyzing Inspections

1. Click "View Inspections" on any transformer
2. Select an inspection from the list
3. Upload a maintenance thermal image if not already uploaded
4. The system will automatically trigger AI analysis
5. Review detected anomalies and add annotations
6. Add maintenance records and observations
7. Mark the inspection as reviewed when complete

### Exporting Data

1. Navigate to "Settings" from the sidebar
2. Choose export format (JSON or CSV)
3. Click the corresponding export button
4. The file will be downloaded to your browser's download folder

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style and conventions
- Run `npm run lint` before committing to ensure code quality
- Use meaningful variable and function names
- Add comments for complex logic

## 🐛 Troubleshooting

### Cannot connect to backend

**Error**: "Could not connect to the backend. Please ensure it is running."

**Solution**: Ensure the backend API is running on `http://localhost:8000`. Check the backend repository for setup instructions.

### Port already in use

**Error**: Port 5173 is already in use

**Solution**: Either stop the other process using the port, or specify a different port in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000 // or any other available port
  }
})
```

### Build errors

**Solution**: Clear node_modules and reinstall dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is part of the Transformer Management System. Please refer to the organization's license policy.

## 🔗 Related Repositories

This frontend application works in conjunction with:
- **Backend API** - (Repository link to be added)

## 📞 Support

For issues, questions, or contributions, please open an issue in the GitHub repository.

---

**Built with ❤️ using React and Vite**
