# Localizify

A modern, AI-powered localization tool that solves the complexity of managing translations for developers and teams. Transform your manual translation workflow into an intelligent, efficient process.

## Problems We Solve

### 🎯 **Manual Translation Chaos**
Stop juggling multiple translation files, spreadsheets, and manual processes. Localizify centralizes all your translations in one intuitive interface.

### 🔄 **Inconsistent Translation Quality**
Eliminate inconsistent translations across your app. Our AI-powered system with contextual understanding ensures coherent, professional translations that maintain your brand voice.

### ⏱️ **Time-Consuming Translation Workflows**
Transform hours of manual work into minutes. Batch translate hundreds of strings simultaneously while maintaining quality and context.

### 💸 **Expensive Translation Services**
Reduce translation costs by up to 90% compared to traditional translation services. Use OpenAI's powerful models with intelligent caching to minimize API calls.

### 🔍 **Lost Translation Context**
Never lose important context again. Provide custom application context to ensure translations are accurate and relevant to your specific use case.

### 📱 **Multi-Platform Translation Management**
Seamlessly handle translations for web, mobile (iOS/Android), and desktop applications with support for JSON, CSV, and XCStrings formats.

## Key Features

- 🧠 **Context-Aware AI Translation**: OpenAI models with custom context for accurate, brand-consistent translations
- 📁 **Universal File Support**: Import/export JSON, CSV, and XCStrings files
- ⚡ **Batch Processing**: Translate multiple strings simultaneously with progress tracking
- 💾 **Smart Caching**: Reduces API costs with intelligent translation caching
- 🎨 **Modern Interface**: Clean, responsive design that works on any device
- 🔍 **Advanced Search**: Find and manage translations quickly with powerful filtering

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI translations)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jakub-kalamarz/studio.git
cd studio
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
- AI translations powered by [OpenAI](https://openai.com/)
- Icons from [Lucide](https://lucide.dev/)
