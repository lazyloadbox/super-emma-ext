# Browser Extension with AI

A modern browser extension built with WXT, React, and TypeScript, featuring an AI chat interface with advanced markdown rendering and theme support.

## ✨ Features

### 🤖 AI Chat Interface
- **Smart Message Display**: Messages with user and assistant avatars
- **Thinking Process Visualization**: AI reasoning models that include `<think>...</think>` tags will display the thinking process
  - Thinking content is shown by default with a "💭 Thinking Process" section
  - Users can toggle visibility with "Hide/Show" buttons
  - Thinking content is visually distinguished with a left border and muted background

### 🎨 Advanced Markdown Support
- **Complete Markdown Rendering**: Tables, headings, lists, code blocks, links, images
- **Syntax Highlighting**: Code blocks with theme-aware highlighting using Prism.js
- **Streaming Rendering**: Real-time markdown rendering as AI responses are received
- **Interactive Elements**: Task lists with clickable checkboxes

### 🌙 Theme System
- **Light/Dark/System Themes**: Automatic system theme detection
- **Persistent Settings**: Theme preferences saved in localStorage
- **Complete UI Coverage**: All components support theme switching

### ⚙️ Settings & Configuration
- **Full-Tab Options Page**: Settings open in a complete browser tab (not popup)
- **Model Selection**: Choose from available AI models
- **Theme Configuration**: Easy theme switching in settings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- LM Studio running on `http://192.168.1.148:12345` (or configure your endpoint)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd browser-ext-03
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Create distribution package**
   ```bash
   npm run zip
   ```

## 🔧 Usage

### Chat Interface
1. Open the extension popup or sidepanel
2. Select an AI model from the dropdown
3. Start chatting with the AI assistant
4. View thinking processes when available (look for the 💭 icon)

### Thinking Process Feature
When AI models include reasoning in `<think>...</think>` tags, the extension will:
- Extract and display the thinking content separately
- Show it in a collapsible section with visual indicators
- Allow users to hide/show the thinking process
- Render the thinking content with full markdown support

Example AI response with thinking:
```
<think>
The user is asking about machine learning. I should:
1. Start with a simple definition
2. Provide concrete examples
3. Explain the main types
</think>

Machine learning is a method of teaching computers to learn from data...
```

### Theme Switching
- Use the theme toggle in the header (sun/moon icon)
- Or go to Settings → Theme Configuration
- Choose from Light, Dark, or System (follows OS preference)

## 🏗️ Architecture

### Tech Stack
- **Framework**: WXT (Web Extension Toolkit)
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables
- **Markdown**: react-markdown + remark-gfm + rehype-raw
- **Syntax Highlighting**: react-syntax-highlighter with Prism.js
- **Icons**: Lucide React
- **Build Tool**: Vite

### Project Structure
```
browser-ext-03/
├── entrypoints/           # Extension entry points
│   ├── popup/            # Popup interface
│   ├── sidepanel/        # Side panel interface
│   └── options/          # Settings page
├── src/
│   ├── components/       # React components
│   │   ├── chat/        # Chat-related components
│   │   └── ui/          # Reusable UI components
│   └── lib/             # Utilities and services
└── public/              # Static assets
```

### Key Components
- **Message**: Displays chat messages with avatars and thinking process
- **StreamingMarkdown**: Real-time markdown rendering with syntax highlighting
- **ThemeProvider**: Theme management and persistence
- **ModelSelector**: AI model selection dropdown
- **ChatInterface**: Main chat interface with LM Studio integration

## 🎯 Browser Support

- ✅ Chrome/Chromium (Manifest V3)
- ✅ Firefox (with automatic MV2 fallback)
- ✅ Edge
- ✅ Safari (with configuration)

## 📝 Configuration

### LM Studio Setup
1. Install and run LM Studio
2. Load your preferred AI model
3. Start the local server (default: `http://localhost:1234`)
4. Update the endpoint in `src/lib/lm-studio-client.ts` if needed

### Custom Styling
The extension uses Tailwind CSS v4 with CSS variables for theming. Customize colors in your CSS:

```css
:root {
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 84% 4.9%;
  /* ... other variables */
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [WXT](https://wxt.dev/) - Web Extension Toolkit
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Lucide](https://lucide.dev/) - Icon library
