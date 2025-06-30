# Athena AI Text Analyzer

![Athena AI Logo](public/images/icons/icon.png)

**Athena AI is a powerful Chrome Extension designed to help you critically analyze text. Using Google's Gemini API, it identifies and explains a wide range of psychological, rhetorical, and political manipulation tactics, turning your browser into a tool for enhanced media literacy.**

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue?logo=tailwindcss)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-3.0-purple)](https://recharts.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This tool acts as a "side panel" in your browser, allowing you to paste text and receive an instant, in-depth analysis of its underlying messaging and potential manipulative techniques.

---

## ✨ Key Features

*   **Advanced Rhetorical Analysis**: Leverages a comprehensive, built-in **"Analyst's Lexicon"** to detect over 20 distinct patterns of manipulation, from simple guilt-tripping to complex socio-political rhetoric.
*   **📊 Visual Manipulation Profile**: Instantly understand the nature of the text with a dynamic radar chart that visualizes the frequency and categories of detected manipulative tactics.
*   **📝 Detailed, Actionable Reports**: Provides a multi-faceted report including an AI-generated summary, color-coded highlights in the source text, and detailed explanations for each detected pattern.
*   **⚙️ Privacy-Focused & Customizable**: Your API key and custom settings are stored securely and locally in your browser. Configure your experience by setting a custom character limit for analysis to manage API usage. Your data is **never** sent to any third-party servers.
*   **Multi-language Support**: The user interface is available in English, German, French, and Spanish out of the box.
*   **🤖 AI-Powered Language Management**: A unique feature that allows you to use the AI to translate the extension's entire interface into any language. Simply provide a language code (e.g., "it" for Italian), and the AI handles the rest.
*   **Seamless Integration**: Works as a Chrome Side Panel for easy access while you browse the web.

## 📸 Demo

*(To be replaced with an actual demo GIF)*

## 🔬 How It Works

The core of Athena is the **`ANALYST_LEXICON`**, a detailed, multi-section prompt that provides the AI with a framework for understanding manipulative language. This lexicon is an integral part of the system prompt sent to the Google Gemini API.

1.  When you submit a text for analysis, the extension sends it to the Google Gemini API along with the system prompt.
2.  This instructs the AI to act as an expert in linguistics, psychology, and rhetoric, and to use the lexicon to find matching patterns in your text.
3.  The Gemini API returns a structured JSON response containing the analysis.
4.  The extension parses this JSON and renders an interactive, multi-part report in the side panel, including the summary, visual chart, and highlighted text.

## 🛠️ Installation and Usage

### For Users (Recommended)

The easiest way to use Athena AI is to install it from the Chrome Web Store.

> **[🔗 Install from the Chrome Web Store](https://chrome.google.com/webstore/detail/your-extension-id)** (Link pending publication)

### For Developers (Running Locally)

If you want to run the project locally for development or testing, follow these steps:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/rurounigit/athena-ai-text-analyzer.git
    cd athena-ai-text-analyzer
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
    *   The Athena AI Text Analyzer icon should now appear in your Chrome toolbar.

## 🚀 Getting Started

1.  Click the **Athena AI icon** in your Chrome toolbar to open the side panel.
2.  In the side panel, expand the **"Configuration"** section.
3.  You'll need a Google Gemini API key. You can get one for free from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
4.  Paste your key into the API key input field. You can also adjust the maximum character limit for analysis to control costs. Click **"Save & Test Configuration"**. The extension will validate the key.
5.  Once the key is saved, paste any text you want to analyze into the text area and click **"Analyze Text"**.
6.  Scroll down to review the generated report, complete with a visual profile, highlights, and explanations.

## 📖 The Analyst's Lexicon

Athena identifies patterns based on a detailed lexicon, which is categorized into three main sections. Each pattern in the lexicon is meticulously defined, complete with telltale signs, common phrases, and illustrative examples to ensure a high degree of analytical accuracy.

*   **Section 1: Interpersonal & Psychological Manipulation Tactics**
    *   *(e.g., Gaslighting, Guilt Tripping, Love Bombing, DARVO)*
*   **Section 2: Covert Aggression & Indirect Control**
    *   *(e.g., The Backhanded Compliment, Weaponized Incompetence, The Silent Treatment)*
*   **Section 3: Sociopolitical & Rhetorical Mechanisms of Control**
    *   *(e.g., The Straw Man Fallacy, The Co-optation of Dissent, Redefining the Terrain, Euphemism & Jargon)*

## 💻 Tech Stack

*   **Framework**: [React](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Charting**: [Recharts](https://recharts.org/)
*   **AI**: [Google Gemini API](https://ai.google.dev/)
*   **Platform**: [Chrome Extension (Manifest V3)](https://developer.chrome.com/docs/extensions)

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improving the lexicon, adding features, or fixing bugs, please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## ⚠️ Disclaimer

This tool is intended for educational and analytical purposes. The analysis is generated by an AI and may not always be perfectly accurate or complete. The user is **solely responsible for all costs** incurred from their use of the Google Gemini API.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.