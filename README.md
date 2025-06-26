# IndicLaw AI - Multilingual Legal Assistance Chatbot

IndicLaw AI is an intelligent chatbot system designed to provide legal information and assistance in multiple Indian languages. The application makes legal information accessible to everyone through multilingual support and easy-to-understand responses.

![IndicLaw AI Screenshot](./screenshots/LandingPage.png)
![IndicLaw AI Screenshot](./screenshots/chatPage.png)

## 📑 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Multilingual Support](#multilingual-support)
- [Document Processing](#document-processing)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Multilingual Support**: Get legal assistance in 8 Indian languages - English, Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, and Kannada.
- **Document Analysis**: Upload and analyze legal documents (PDFs, DOCx) for quick information extraction.
- **Image Processing**: Extract text from images using OCR technology.
- **Conversational UI**: User-friendly chat interface for seamless interaction.
- **Persistent Chat History**: Conversations are saved for future reference.
- **User Authentication**: Secure login and signup functionality.
- **Responsive Design**: Works on both desktop and mobile devices.
- **Legal Information Access**: Get accurate information on legal topics and procedures.

## 📂 Project Structure

The project is organized into two main components:

### Backend (Node.js/Express)
```
backend/
  ├── config/           # Configuration files
  ├── middleware/       # Express middleware
  ├── routes/           # API routes
  ├── services/         # Service integrations (OpenAI)
  ├── uploads/          # Document upload directory
  ├── utils/            # Utility functions
  └── server.js         # Main entry point
```

### Frontend (React/TypeScript)
```
IndicLaw/
  ├── public/           # Static assets
  ├── src/
  │   ├── components/   # React components
  │   ├── contexts/     # React contexts
  │   ├── hooks/        # Custom React hooks
  │   ├── i18n/         # Internationalization
  │   ├── lib/          # Utility libraries
  │   ├── pages/        # Page components
  │   └── styles/       # CSS files
  └── package.json      # Dependencies
```

## 🚀 Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **OpenAI API** - AI integration for chat responses
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **Mammoth** - DOCX text extraction
- **Tesseract.js** - OCR for image text extraction

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Tanstack Query** - Data fetching
- **i18next** - Internationalization
- **Shadcn UI** - UI components
- **Lucide** - Icons
- **Firebase** - Authentication

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or Yarn
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/indiclaw.git
cd indiclaw
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key
```

4. Install frontend dependencies
```bash
cd ../IndicLaw
npm install
```

## 🖥️ Usage

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd IndicLaw
npm run dev
```

3. Visit `http://localhost:5173` in your browser

### VS Code Tasks

This project includes VS Code tasks for easier development:

- **Start Frontend**: Run the React frontend
- **Start Backend**: Run the Node.js backend

## 📡 API Reference

### Chat Endpoint
```
POST /api/chat
```

**Request Body:**
- `message`: User's message (text)
- `file`: (Optional) Attached document or image

**Response:**
- AI-generated response with relevant legal information

### Health Check
```
GET /health
```

Returns the current status of the server.

## 🌐 Multilingual Support

IndicLaw supports the following languages:

- English
- Hindi
- Marathi
- Bengali
- Tamil
- Telugu
- Gujarati
- Kannada

Language preferences are saved in the browser's local storage for a consistent experience.

## 📄 Document Processing

The application can process various document types:

- **PDF**: Extract text content for analysis
- **DOCX**: Extract text from Microsoft Word documents
- **Images**: Use OCR to extract text from images

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

---

Built with ❤️ by Team Cornelia
