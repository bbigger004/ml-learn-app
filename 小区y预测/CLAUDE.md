# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a community value prediction system (小区y预测系统) that uses machine learning to predict community values based on various features. The system consists of a Vue.js frontend and a NestJS backend with TensorFlow.js for machine learning.

## Architecture

- **Frontend**: Vue 3 + Vite + Element Plus + ECharts
- **Backend**: NestJS + TensorFlow.js + CSV processing
- **Data Flow**: CSV upload → data preprocessing → model training → prediction → visualization
- **API Structure**: RESTful APIs with `/api` prefix

## Development Commands

### Backend (NestJS)
```bash
cd nest-back-end

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Testing
npm run test
npm run test:e2e
npm run test:cov

# Linting and formatting
npm run lint
npm run format
```

### Frontend (Vue 3)
```bash
cd vue-front-end

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Key Directories

### Backend Structure
- `src/app.module.ts` - Main application module
- `src/data/` - Data processing and management
- `src/model/` - Machine learning model management
- `src/prediction/` - Prediction services
- `src/common/` - Shared utilities and DTOs

### Frontend Structure
- `src/App.vue` - Main application component with sidebar navigation
- `src/views/` - Page components (data, model, prediction, evaluation, analysis)
- `src/components/` - Reusable UI components
- `src/services/` - API service layer
- `src/store/` - State management (Pinia)
- `src/router/` - Vue Router configuration

## API Endpoints

The backend runs on port 3000 by default with `/api` prefix:
- Data management: `/api/data/*`
- Model operations: `/api/model/*`
- Prediction services: `/api/prediction/*`

## Data Processing Pipeline

1. **Upload**: CSV files uploaded to backend
2. **Preprocessing**: Data cleaning, normalization, feature engineering
3. **Training**: LSTM/XGBoost model training with TensorFlow.js
4. **Prediction**: Generate predictions based on trained models
5. **Visualization**: Display results using ECharts

## Machine Learning Features

- **Algorithms**: LSTM for time series, XGBoost for tabular data
- **Data Preprocessing**: Missing value handling, normalization, feature extraction
- **Model Evaluation**: Performance metrics and visualization
- **Multi-step Prediction**: Support for future value predictions

## Configuration

- Backend port: 3000 (configurable via PORT environment variable)
- CORS enabled for development (allows all origins)
- File uploads stored in `uploads/` directory
- Models saved in `models/` directory

## Development Notes

- The system is designed for community value prediction with time series data
- Frontend uses Element Plus for UI components and ECharts for data visualization
- Backend uses class-validator for request validation
- File uploads use Multer for handling multipart/form-data
- TensorFlow.js is used for in-browser machine learning capabilities