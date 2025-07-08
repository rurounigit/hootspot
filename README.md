# HootSpot AI Text Analyzer

![HootSpot AI Logo](public/images/icons/icon128_onwhite.png)

**HootSpot is a Chrome Extension designed to help you identify and explain a wide range of psychological, rhetorical, and political manipulation tactics.**

[![React](https://img.shields.io/badge/React-19.1-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue?logo=tailwindcss)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-3.0.2-purple)](https://recharts.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-orange?logo=d3dotjs)](https://d3js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This tool acts as a "side panel" in your browser, allowing you to select text from any webpage or paste it directly to receive an instant, in-depth analysis of its underlying messaging and potential manipulative techniques.

---

## ✨ Key Features

*   **AI-Powered Rhetorical Analysis**: Uses a detailed system prompt to instruct the Gemini API to identify and categorize manipulative patterns.
*   **📊 Visual Manipulation Profile**: Instantly understand the nature of the text with a dynamic bubble chart that visualizes the strength, frequency, and categories of detected tactics.
*   **📝 Detailed, Actionable Reports**: Provides a multi-faceted report including an AI-generated summary, color-coded highlights in the source text, and detailed explanations for each detected pattern.
*   **📥 Export and Share Reports**: Easily share your findings. Download a complete, professionally formatted PDF report, including highlights and visual charts. You can also export the raw analysis as a JSON file or share a brief summary directly to X (Twitter).
*   **Seamless Context Menu Integration**: Right-click any selected text on a webpage to instantly send it to the HootSpot side panel. Choose to simply copy the text or to trigger an immediate analysis, streamlining your workflow.
*   **⚙️ Flexible AI Model Selection**: Choose from a list of Google Gemini models that are automatically fetched and updated. Models are conveniently grouped into "Stable" and "Preview" categories, allowing you to tailor the analysis to your needs—from fast, lightweight models to more powerful, nuanced ones.
*   **Privacy-Focused & Customizable**: Your API key and custom settings are stored securely and locally in your browser. Configure your experience by setting a custom character limit for analysis to manage API usage.
*   **Multi-language Support**: The user interface is available in English, German, French, and Spanish out of the box.
*   **🤖 AI-Powered Language Management**: A unique feature that allows you to use the AI to translate the extension's entire interface into any language. Simply provide a language code (e.g., "it" for Italian), and the AI handles the rest.

## 📸 Demo

![HootSpot AI Demo Screenshot](public/images/screenshot.jpg)

## 🔬 How It Works

The core of HootSpot is the `SYSTEM_PROMPT`. This prompt instructs the Google Gemini API on its role and the required output format. It does not contain a hardcoded list of tactics.

1.  When you submit a text for analysis, the extension sends it to the Google Gemini API along with the `SYSTEM_PROMPT`.
2.  This instructs the AI to act as an expert in linguistics, psychology, and rhetoric and to find matching patterns in your text based on its own training.
3.  The Gemini API is required to return a structured JSON response containing the analysis.
4.  The extension parses this JSON and renders an interactive, multi-part report in the side panel, including the summary, visual chart, and highlighted text.

## 🛠️ Installation and Usage

### For Users (Recommended)

The easiest way to use HootSpot AI is to install it from the Chrome Web Store.

> **[🔗 Install from the Chrome Web Store](https://chrome.google.com/webstore/category/extensions)** (Link pending publication)

### For Developers (Running Locally)

If you want to run the project locally for development or testing, follow these steps:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/rurounigit/hootspot.git
    cd hootspot
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Build the Extension**
    ```bash
    npm run build
    ```
    This will create a `dist` directory containing the production-ready extension files.

4.  **Load the Extension in Chrome**
    *   Open Google Chrome and navigate to `chrome://extensions`.
    *   Enable **"Developer mode"** using the toggle in the top-right corner.
    *   Click the **"Load unpacked"** button.
    *   Select the `dist` directory that was created in the previous step.
    *   The HootSpot AI Text Analyzer icon should now appear in your Chrome toolbar.

## 🚀 Getting Started

1.  **First-Time Setup: Configure your API Key**
    *   Click the **HootSpot AI icon** in your Chrome toolbar to open the side panel.
    *   Expand the **"Configuration"** section.
    *   You'll need a Google Gemini API key. You can get one for free from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
    *   Paste your key into the API key input field and click **"Save & Test Configuration"**. The extension will validate the key. This is a one-time setup.

2.  **Analyze Text from Any Webpage (Recommended Workflow)**
    *   Highlight any text on a webpage.
    *   Right-click the selected text.
    *   Choose **"Analyze selected text with HootSpot"** from the context menu.
    *   The side panel will open and automatically begin the analysis.

3.  **Analyze Text Manually**
    *   Open the side panel by clicking the HootSpot icon.
    *   Paste any text you want to analyze into the text area.
    *   Click **"Analyze"**.

4.  **Review the Report**
    *   Scroll down to review the generated report, complete with a visual profile, highlights, and explanations.

## 💻 Tech Stack

*   **Framework**: [React](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Charting**: [Recharts](https://recharts.org/) & [D3.js](https://d3js.org/)
*   **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/) & [html2canvas](https://html2canvas.hertzen.com/)
*   **AI**: [Google Gemini API](https://ai.google.dev/)
*   **Platform**: [Chrome Extension (Manifest V3)](https://developer.chrome.com/docs/extensions)

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improving the system prompt, adding features, or fixing bugs, please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## ⚠️ Disclaimer

This tool is intended for educational and analytical purposes. The analysis is generated by an AI and may not always be perfectly accurate or complete. The user is **solely responsible for all costs** incurred from their use of the Google Gemini API.

## 📄 License

This project is licensed under the MIT License.