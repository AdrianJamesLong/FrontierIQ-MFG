# React Frontend

React application built with Vite that connects to the FastAPI backend.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## Features

- Fetches data from FastAPI backend
- Displays SQL query results
- Error handling and loading states
- Two API endpoints demonstrated:
  - `/api/hello` - Hello World with SQL data
  - `/api/data` - Fetch sample data

## Configuration

The API URL is configured in [src/App.jsx](src/App.jsx):
```javascript
const API_URL = 'http://localhost:8000'
```

Update this if your backend runs on a different URL.

## Development

The app uses Vite for fast HMR (Hot Module Replacement). Changes to components will update instantly in the browser.

## Production Build

Build the app for production:
```bash
npm run build
```

The output will be in the `dist/` folder, ready to be deployed to a static hosting service.
