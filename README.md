# Localizify

A modern, AI-powered localization and translation tool built with Next.js and Firebase. Localizify helps developers and teams manage their app translations efficiently using AI translation services.

## Features

- 🌍 **Multi-language Support**: Easily manage translations for multiple languages
- 🤖 **AI-Powered Translation**: Uses OpenAI and Google Gemini for high-quality translations
- 📁 **File Upload**: Import translation files (JSON, CSV, XCStrings)
- 🔄 **Batch Translation**: Translate multiple strings at once
- 🎨 **Dark/Light Theme**: Modern UI with theme switching
- 💾 **Translation Cache**: Intelligent caching to reduce API calls
- ⚡ **Real-time Progress**: Live progress tracking for translations
- 🔍 **Smart Search**: Find and filter translations quickly
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **AI/ML**: OpenAI GPT, Google Gemini via Firebase Genkit
- **Backend**: Firebase (Authentication, Database)
- **State Management**: React Hooks, Local Storage
- **Styling**: Tailwind CSS, CSS Variables for theming

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI translations)
- Firebase project (optional, for backend features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/localizify.git
cd localizify
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment:
   - The app will prompt you to enter your OpenAI API key in the settings
   - No additional environment files needed - API keys are managed through the UI

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:9002`

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Upload Translation Files**: Use the file upload feature to import your existing translation files
2. **Configure Languages**: Add source and target languages for your project
3. **Set API Key**: Go to Settings and enter your OpenAI API key
4. **Translate**: Select strings and use the batch translation feature
5. **Export**: Download your translated files when ready

## Configuration

### API Keys
- OpenAI API key: Set through the Settings dialog in the app
- The key is stored securely in your browser's local storage

### Supported File Formats
- JSON
- CSV 
- XCStrings (iOS/macOS)

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run genkit:dev` - Start Genkit development server
- `npm run genkit:watch` - Start Genkit in watch mode

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://radix-ui.com/)
- AI integration via [Firebase Genkit](https://firebase.google.com/docs/genkit)
- Icons from [Lucide](https://lucide.dev/)
