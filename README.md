# HootSpot AI Text Analyzer

![HootSpot AI Logo](public/images/icons/icon128_onwhite.png)

**HootSpot is a Chrome Extension that empowers you to identify and understand a wide range of psychological, rhetorical, and political manipulation tactics in any text, leveraging the power of the Google Gemini API or your own local Language Models via LM Studio or Ollama.**

**It runs as a "side panel" in your browser, allowing you to select text from any webpage or paste it directly to receive an instant, in-depth analysis of its underlying messaging and potential manipulative techniques. Your API key and local server configurations are stored locally, ensuring your privacy.**

I started building this extension frustrated by the level of information manipulation in news articles and political statements.

Initially, I was relying on a 'Dictionary of Rhetorical Manipulation' that I had assembled myself. But it turned out, a more non-deterministic system gave much richer results with more convincing reasoning. Rhetorical tactics as it turns out can be found in about any text intended to convince or sway a reader, regardless of political affiliation or topic.

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue?logo=tailwindcss)](https://tailwindcss.com/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9-orange?logo=d3dotjs)](https://d3js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Key Features

*   **Advanced Rhetorical Analysis**: Leverages the area of expertise of any great LLM: Being trained on a vast variety of texts, and a deep understanding of written communication patterns.
*   **Flexible AI Service Provider**: Choose between using the powerful **Google Gemini API** (cloud-based) or connecting to your own **local Language Models (LLMs)** running via an **LM Studio** or **Ollama** server, giving you control over data privacy and computational resources.
*   **Interactive Visualization**: Generates a dynamic bubble chart using **D3.js** to visualize the strength, frequency, and categories of detected tactics, providing an immediate "Manipulation Profile" of the text.
*   **Comprehensive & Actionable Reports**: Outputs a report including an AI-generated summary, color-coded highlights in the source text, and detailed card-based explanations for each detected pattern.
*   **Export and Save Findings**: Easily save your analysis. Download a PDF report, including highlights and the visual bubble chart. You can also export the raw analysis as a JSON file and load it back into the extension later.
*   **Seamless Context Menu & Keyboard Integration**: Right-click any selected text to instantly send it to the HootSpot side panel for analysis, replacement, or appending. For even faster workflow, use keyboard shortcuts (`Alt+Shift+A`, `Alt+Shift+S`, `Alt+Shift+D`) to perform these actions without clicking.
*   **Flexible AI Model Selection**: When using Google Gemini, choose from a list of Google Gemini models that are automatically fetched and updated. When using a local provider, fetch a list of all available models loaded in LM Studio or pulled in Ollama.
*   **Privacy-First & Customizable**: Your API key and custom settings are stored securely and locally in your browser's `localStorage`. Configure your experience by setting a custom character limit for analysis to manage API usage and costs.
*   **Full Internationalization (i18n)**: The user interface is available in English, German, French, and Spanish out of the box.
*   **AI-Powered Language Management**: A unique feature that allows you to use the Gemini API to translate the extension's entire interface into any language. Simply provide a language code (e.g., "it" for Italian), and the AI generates the necessary translation files.
*   **AI-Powered Rebuttals**: Generate concise counter-arguments to analyzed text, leveraging the AI's understanding of the original text's manipulative patterns (experimental feature).
*   **Customizable Interface**: Includes a **Night Mode** for comfortable viewing in low-light environments.

## Demo

<img src="public/images/hootspot-gif.gif" alt="HootSpot" width="40%">

## Examples

**Their Finest Hour by Winston Churchill**

“What General Weygand called the Battle of France is over. I expect that the Battle of Britain is about to begin. Upon this battle depends the survival of Christian civilization. Upon it depends our own British life, and the long continuity of our institutions and our Empire. The whole fury and might of the enemy must very soon be turned on us. Hitler knows that he will have to break us in this Island or lose the war. If we can stand up to him, all Europe may be free and the life of the world may move forward into broad, sunlit uplands. But if we fail, then the whole world, including the United States, including all that we have known and cared for, will sink into the abyss of a new Dark Age made more sinister, and perhaps more protracted, by the lights of perverted science. Let us therefore brace ourselves to our duties, and so bear ourselves that, if the British Empire and its Commonwealth last for a thousand years, men will still say, “This was their finest hour.””

<details>
  <summary>Click to see the results</summary>
  <br>

  *Analysis and Visualization*

  <img src="public/images/examples/churchill-report.jpg" alt="Analysis of Churchill's speech" width="40%">
  <img src="public/images/examples/churchill-chart.jpg" alt="Analysis of Churchill's speech" width="40%">
  <br><br>

  *Highlighted Text*

  <img src="public/images/examples/churchill-highlighted-text.jpg" alt="Highlighted text of Churchill's speech" width="40%">
  <br><br>

  *Found Patterns*

  <img src="public/images/examples/churchill-pattern-01.jpg" alt="Highlighted text of Churchill's speech" width="40%">
  <img src="public/images/examples/churchill-pattern-02.jpg" alt="Highlighted text of Churchill's speech" width="40%">
  <img src="public/images/examples/churchill-pattern-03.jpg" alt="Highlighted text of Churchill's speech" width="40%">
  <img src="public/images/examples/churchill-pattern-04.jpg" alt="Highlighted text of Churchill's speech" width="40%">
  <img src="public/images/examples/churchill-pattern-05.jpg" alt="Highlighted text of Churchill's speech" width="40%">
</details>

  ---

**I Am Prepared to Die by Nelson Mandela**

“Above all, My Lord, we want equal political rights, because without them our disabilities will be permanent. I know this sounds revolutionary to the whites in this country, because the majority of voters will be Africans. This makes the white man fear democracy.

But this fear cannot be allowed to stand in the way of the only solution which will guarantee racial harmony and freedom for all. It is not true that the enfranchisement of all will result in racial domination. Political division, based on colour, is entirely artificial and, when it disappears, so will the domination of one colour group by another. The ANC has spent half a century fighting against racialism. When it triumphs as it certainly must, it will not change that policy.

This then is what the ANC is fighting. Our struggle is a truly national one. It is a struggle of the African people, inspired by our own suffering and our own experience. It is a struggle for the right to live.

During my lifetime I have dedicated my life to this struggle of the African people. I have fought against white domination, and I have fought against black domination. I have cherished the ideal of a democratic and free society in which all persons will live together in harmony and with equal opportunities. It is an ideal for which I hope to live for and to see realised. But, My Lord, if it needs be, it is an ideal for which I am prepared to die.”

<details>
  <summary>Click to see the results</summary>
  <br>

  *Analysis and Visualization*

  <img src="public/images/examples/mandela-report.jpg" alt="Analysis of Mandela's speech" width="40%">
  <img src="public/images/examples/mandela-chart.jpg" alt="Analysis of Mandela's speech" width="40%">
  <br><br>

  *Highlighted Text*

  <img src="public/images/examples/mandela-highlighted-text.jpg" alt="Highlighted text of Mandela's speech" width="40%">
  <br><br>

  *Found Patterns*

  <img src="public/images/examples/mandela-pattern-01.jpg" alt="Highlighted text of Mandela's speech" width="40%">
  <img src="public/images/examples/mandela-pattern-02.jpg" alt="Highlighted text of Mandela's speech" width="40%">
  <img src="public/images/examples/mandela-pattern-03.jpg" alt="Highlighted text of Mandela's speech" width="40%">
  <img src="public/images/examples/mandela-pattern-04.jpg" alt="Highlighted text of Mandela's speech" width="40%">
  <img src="public/images/examples/mandela-pattern-05.jpg" alt="Highlighted text of Mandela's speech" width="40%">
</details>

  ---

**Donald Trump’s address to nation after attack on Iran**

"A short time ago, the US military carried out massive precision strikes on the three key nuclear facilities in the Iranian regime: Fordow, Natanz and Isfahan. Everybody heard those names for years as they built this horribly destructive enterprise. Our objective was the destruction of Iran’s nuclear enrichment capacity and a stop to the nuclear threat posed by the world’s number one state sponsor of terror. Tonight, I can report to the world that the strikes were a spectacular military success. Iran’s key nuclear enrichment facilities have been completely and totally obliterated. Iran, the bully of the Middle East, must now make peace. If they do not, future attacks will be far greater and a lot easier. For 40 years, Iran has been saying, “Death to America, death to Israel”. They have been killing our people, blowing off their arms, blowing off their legs with roadside bombs – that was their speciality. We lost over a thousand people, and hundreds of thousands throughout the Middle East and around the world have died as a direct result of their hate, in particular, so many were killed by their general, Qassem Soleimani. I decided a long time ago that I would not let this happen. Sign up for Al Jazeera Americas Coverage Newsletter US politics, Canada’s multiculturalism, South America’s geopolitical rise—we bring you the stories that matter. It will not continue. I want to thank and congratulate Prime Minister Bibi Netanyahu. We worked as a team like perhaps no team has ever worked before, and we’ve gone a long way to erasing this horrible threat to Israel. I want to thank the Israeli military for the wonderful job they’ve done and, most importantly, I want to congratulate the great American patriots who flew those magnificent machines tonight, and all of the United States military on an operation the likes of which the world has not seen in many, many decades. Hopefully, we will no longer need their services in this capacity. I hope that’s so. I also want to congratulate the chairman of the Joint Chiefs of Staff, General Dan “Razin” Caine – spectacular general – and all of the brilliant military minds involved in this attack. With all of that being said, this cannot continue. There will be either peace or there will be tragedy for Iran far greater than we have witnessed over the last eight days. Remember, there are many targets left. Tonight’s was the most difficult of them all by far, and perhaps the most lethal, but if peace does not come quickly, we will go after those other targets with precision, speed and skill. Most of them can be taken out in a matter of minutes. There’s no military in the world that could have done what we did tonight, not even close. There has never been a military that could do what took place just a little while ago. Tomorrow, General Caine, Secretary of Defense Pete Hegseth, will have a press conference at 8am (12:00 GMT) at the Pentagon, and I want to just thank everybody, and in particular, God. I want to just say, “We love you, God, and we love our great military. Protect them.” God bless the Middle East. God bless Israel, and God bless America. Thank you very much. Thank you."

<details>
  <summary>Click to see the results</summary>
  <br>

  *Analysis and Visualization*

  <img src="public/images/examples/trump-report.jpg" alt="Analysis of Trump's speech" width="40%">
  <img src="public/images/examples/trump-chart.jpg" alt="Analysis of Trump's speech" width="40%">
  <br><br>

  *Highlighted Text*

  <img src="public/images/examples/trump-highlighted-text.jpg" alt="Highlighted text of Trump's speech" width="40%">
  <br><br>

  *Found Patterns*

  <img src="public/images/examples/trump-pattern-01.jpg" alt="Highlighted text of Trump's speech" width="40%">
  <img src="public/images/examples/trump-pattern-02.jpg" alt="Highlighted text of Trump's speech" width="40%">
  <img src="public/images/examples/trump-pattern-03.jpg" alt="Highlighted text of Trump's speech" width="40%">
  <img src="public/images/examples/trump-pattern-04.jpg" alt="Highlighted text of Trump's speech" width="40%">
  <img src="public/images/examples/trump-pattern-05.jpg" alt="Highlighted text of Trump's speech" width="40%">
  <br><br>

  *Rebuttal*

  <img src="public/images/examples/trump-rebuttal.jpg" alt="Rebuttal of Trump's speech" width="40%">
</details>

## How It Works

HootSpot is built as a modern Manifest V3 Chrome Extension with a modular, hook-based React architecture.

1.  **Input**: A user selects text and uses the context menu, keyboard shortcut, or pastes text directly into the side panel's text area.
2.  **Request**: The `background.ts` service worker or the UI (`App.tsx`) initiates the analysis. `App.tsx` coordinates state using custom hooks. The core logic resides in `useAnalysis.ts`, which, based on the provider chosen in `useConfig.ts`, calls the appropriate function in the API layer (`src/api/google/analysis.ts`, `src/api/lm-studio.ts`, or `src/api/ollama.ts`). The request sends the user's text and the relevant system prompt from `src/config/api-prompts.ts`.
3.  **Analysis**: The **AI model (from Google Gemini, LM Studio, or Ollama)** acts as an expert in linguistics and psychology. It analyzes the text for manipulative patterns and returns a structured JSON response.
4.  **Response Handling**: The API modules in `src/api/` contain robust logic to parse the API's response. This includes extracting JSON from markdown code blocks and even attempting to self-heal malformed JSON to handle various model outputs gracefully.
5.  **Rendering**: The `useAnalysis` hook updates the application state with the analysis result. This triggers a re-render in the React frontend, where `App.tsx` passes the result to the `AnalysisReport` component. This component then renders the full interactive report, including the D3.js bubble chart (`ManipulationBubbleChart.tsx`) and the highlighted source text.
6.  **PDF Generation**: For PDF exports, the app uses a sandboxed `iframe` (`pdf-generator.html`) for security. It renders an off-screen, high-resolution version of the bubble chart using `html2canvas` and constructs the PDF with `@react-pdf/renderer` in the sandbox, preventing direct access to sensitive resources.

## Installation and Usage

### For Users (Recommended)

The easiest way to use HootSpot AI is to install it from the Chrome Web Store.

> **[Install from the Chrome Web Store](https://chrome.google.com/webstore/category/extensions)** (Link pending publication)

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
    *   The HootSpot AI icon should now appear in your Chrome toolbar.

## Getting Started

1.  **First-Time Setup: Configure your AI Service Provider**
    HootSpot allows you to choose between using the cloud-based Google Gemini API or connecting to a local AI model server.

    *   Click the **HootSpot AI icon** in your Chrome toolbar to open the side panel.
    *   Expand the **"Configuration"** section.

    ### Option A: Configure with Google Gemini API (Cloud)
    *   You'll need a Google Gemini API key. You can get one for free from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
    *   Ensure "Google API (Cloud)" is selected under "Service Provider".
    *   Paste your API key into the "Google Gemini API Key" input field.
    *   Optionally, select your preferred analysis model from the dropdown.
    *   Click **"Save & Test Configuration"**. The extension will validate the key and save your settings.

    ### Option B: Configure with a Local Provider (LM Studio or Ollama)
    *   In HootSpot's Configuration section, select "Local" under "Service Provider".
    *   Choose your desired local server type: **LM Studio** or **Ollama**.

    #### For LM Studio:
    *   **Download and Install LM Studio**: Get LM Studio from [lmstudio.ai](https://lmstudio.ai/).
    *   **Download a Model**: Within LM Studio, go to the "Discover" tab and download a compatible model (e.g., a GGUF or MLX model like `gemma-3n-E2B-it-text-GGUF` or `gemma-3n-E2B-it-MLX-4bit` or `lfm2-1.2b` GGUF or MLX).
    *   **Start Local Inference Server**: In "Power User" or "Developer" Mode, Go to the "Developer" tab in LM Studio. Select your downloaded model from the dropdown, then click "Load Model". Note the "Server URL" (e.g., `http://localhost:1234`).
    *   In LM Studio in "Developer" or "Power User" Mode in the Settings:
        *   Just-in-Time Model Loading: When enabled, if a request specified a model that is not loaded, it will be automatically loaded and used. In addition, the "/v1/models" endpoint will also include models that are not yet loaded. You would want to disable this for HootSpot to show loaded models. If you enable this, HootSpot will show all installed models and load a selected model automatically if it is not yet loaded.
            *   Auto unload unused JIT loaded models:A model that was loaded Just-in-time (JIT) to serve an API request will be automatically unloaded after being unused for some duration (TTL). You would want this to be disabled to avoid long loading times.
            *   Only Keep Last JIT Loaded Model: Ensure at most 1 model is loaded via JIT at any given time (unloads previous model). This is useful if you want to make sure you don't have too many models loaded at once via JIT.

    *   In HootSpot's Configuration:
        *   Enter the full **Local Server URL** from LM Studio.
        *   Click **"Refresh List"** to fetch all models loaded on your server.
        *   Select your desired model from the dropdown.
    *   Click **"Save & Test Configuration"**.

    #### For Ollama:
    *   **Install Ollama**: Follow the instructions at [ollama.ai](https://ollama.ai/).
    *   **Pull a Model**: Open your terminal and run `ollama pull <model_name>` (e.g., `ollama pull gemma`).
    *   **Configure CORS**: See the detailed **"Configuring Ollama for HootSpot"** section below. This is a mandatory one-time setup.
    *   In HootSpot's Configuration:
        *   The default **Ollama Server URL** (`http://localhost:11434`) is pre-filled.
        *   Click **"Refresh List"** to fetch all models you have pulled.
        *   Select your desired model from the dropdown.
    *   Click **"Save & Test Configuration"**.

2.  **Analyze Text from Any Webpage (Recommended Workflow)**
    *   Highlight any text on a webpage.
    *   Right-click the selected text.
    *   Choose **"Analyze selected text with HootSpot"** from the context menu.
    *   The side panel will open and automatically begin the analysis.

3.  **Send Text to the Panel**
    *   You can also right-click selected text and choose **"Copy text to HootSpot"** to replace the content in the panel or **"Add selected text to HootSpot"** to append it to the existing text.

4.  **Analyze Text Manually**
    *   Open the side panel by clicking the HootSpot icon.
    *   Paste any text you want to analyze into the text area.
    *   Click **"Analyze"**.

5.  **Review the Report**
    *   Scroll down to review the generated report, complete with a visual profile, highlights, and detailed explanations.

---

## Configuring Ollama for HootSpot

To allow the HootSpot extension to communicate with your local Ollama server, you need to configure Ollama's Cross-Origin Resource Sharing (CORS) policy. This is a security measure that ensures only trusted websites or applications can access your local models.

You only need to do this configuration once.

### 1. For Developers (Local Development)

During development, your unpacked extension is assigned a new, random ID every time you reload it. To avoid reconfiguring Ollama constantly, the most practical approach is to allow any Chrome extension to connect.

**Warning: This is convenient for development but less secure. Only use this method on a trusted machine.**

#### **Step 1: Stop the Ollama Server**

Ensure Ollama is not running.

*   **macOS:** Click the llama icon in the menu bar and select "Quit Ollama".
*   **Windows:** Right-click the llama icon in the system tray and select "Quit".
*   **Linux:** Stop the service (`sudo systemctl stop ollama`) or press `Ctrl+C` in the terminal running `ollama serve`.

#### **Step 2: Set the Environment Variable & Restart**

##### On macOS
Open **Terminal** and run this command:
```bash
launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"
```
Then, restart the server by launching the `Ollama.app` from your Applications folder.

##### On Windows
Open **Command Prompt** and run these commands:
```cmd
set OLLAMA_ORIGINS=chrome-extension://*
ollama serve
```
*Note: This setting is temporary and only lasts for the current terminal session.*

##### On Linux
Open your **Terminal** and run these commands:
```bash
export OLLAMA_ORIGINS="chrome-extension://*"
ollama serve
```
*Note: This setting is temporary and only lasts for the current terminal session.*

---

### 2. For Users (Published Extension)

Once HootSpot is installed from the Chrome Web Store, it has a permanent, secure ID. Using this specific ID is the most secure way to configure Ollama.

#### **Step 1: Find the HootSpot Extension ID**
1.  Open Chrome and navigate to `chrome://extensions`.
2.  Find **HootSpot AI Text Analyzer** in your list of extensions.
3.  The ID is a 32-character string listed on the extension's card. Copy this ID.

    *(Placeholder for your final ID: `abcdefghijklmnopqrstuvwxyz123456`)*

#### **Step 2: Stop the Ollama Server**
Ensure Ollama is fully quit, as described in the developer section above.

#### **Step 3: Set the Permanent Environment Variable & Restart**

##### On macOS
1.  Click the llama icon in the menu bar and select **"Quit Ollama"**.
2.  Open **Terminal** and run the following command, replacing `<YOUR_EXTENSION_ID>` with the ID you copied.
    ```bash
    # Example: launchctl setenv OLLAMA_ORIGINS "chrome-extension://abcdefg..."
    launchctl setenv OLLAMA_ORIGINS "chrome-extension://<YOUR_EXTENSION_ID>"
    ```
3.  Restart the server by launching **Ollama.app** from your Applications folder.

##### On Windows (Recommended Permanent Method)
1.  Search for **"Edit the system environment variables"** in the Start Menu and open it.
2.  In the window that appears, click the **"Environment Variables..."** button.
3.  Under the **"System variables"** section (not "User variables"), click **"New..."**.
4.  Enter the following:
    *   Variable name: `OLLAMA_ORIGINS`
    *   Variable value: `chrome-extension://<YOUR_EXTENSION_ID>`
5.  Click **OK** on all windows to save.
6.  Restart your computer, or restart the Ollama service via the Task Manager (Services tab -> right-click Ollama -> Restart).

##### On Linux (Recommended Permanent Method)
1.  Open your **Terminal**.
2.  Create a systemd "drop-in" configuration file using a text editor like `nano`:
    ```bash
    sudo nano /etc/systemd/system/ollama.service.d/override.conf
    ```
3.  Paste the following content into the file, replacing `<YOUR_EXTENSION_ID>` with your actual ID.
    ```ini
    [Service]
    Environment="OLLAMA_ORIGINS=chrome-extension://<YOUR_EXTENSION_ID>"
    ```4.  Save the file and exit (`Ctrl+X`, then `Y`, then `Enter`).
5.  Reload the systemd configuration and restart the Ollama service:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart ollama
    ```

Once configured with one of these methods, HootSpot will be able to securely connect to your local Ollama server.

---

## Directory Structure

```
/
├── dist/                  # Built extension files (output of `npm run build`)
├── public/                # Static assets, manifest.json, and Chrome-specific locales
│   ├── _locales/          # i18n message files for Chrome context menus
│   └── manifest.json      # Core Chrome Extension configuration
└── src/                   # Main application source code
    ├── api/               # All external API communication logic
    │   ├── google/        # Functions for interacting with the Google Gemini API
    │   ├── lm-studio.ts   # Functions for interacting with a local LM Studio server
    │   └── ollama.ts      # Functions for interacting with a local Ollama server
    ├── assets/            # SVG icons and other static assets used in the app
    │   └── icons.tsx      # React components for all SVG icons
    ├── components/        # React components, organized by feature
    │   ├── analysis/      # Components related to displaying the analysis report
    │   ├── config/        # Components for the configuration section
    │   └── pdf/           # Components used specifically for PDF generation
    ├── config/            # Centralized application configuration
    │   ├── api-prompts.ts # System prompts for all AI interactions
    │   ├── chart.ts       # Visual configuration for charts (UI and PDF)
    │   ├── storage-keys.ts# Constants for localStorage keys
    │   └── theme.ts       # Centralized color theme for Tailwind CSS
    ├── hooks/             # Custom React hooks for managing state and business logic
    │   ├── useAnalysis.ts # Manages the entire analysis workflow and state
    │   ├── useConfig.ts   # Manages all user configuration and settings
    │   ├── useModels.ts   # Fetches and manages the list of available AI models
    │   └── useTranslationManager.ts # Manages translation of dynamic content
    ├── locales/           # UI translation files (JSON) for different languages
    ├── types/             # TypeScript type definitions for the application
    ├── utils/             # Helper functions
    ├── App.tsx            # Main React application component (state coordinator)
    ├── background.ts      # Extension service worker (context menus, etc.)
    ├── i18n.tsx           # Internationalization setup and provider
    ├── index.tsx          # React entry point
    └── pdf-generator.tsx  # React code for the sandboxed PDF generation page
├── index.html             # Main HTML entry point for the side panel
├── package.json           # Project dependencies and scripts
└── ...                    # Other project configuration files
```

## Tech Stack

*   **Framework**: [React](https://react.dev/) 19
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Platform**: [Chrome Extension (Manifest V3)](https://developer.chrome.com/docs/extensions)
*   **AI**: [Google Gemini API](https://ai.google.dev/) (via `@google/genai`)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Local LLM Integration**: [LM Studio](https://lmstudio.ai/), [Ollama](https://ollama.ai/)
*   **Charting**: [D3.js](https://d3js.org/)
*   **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/) & [html2canvas](https://html2canvas.hertzen.com/)
*   **Internationalization**: Custom i18n provider (`src/i18n.tsx`)

## Contributing

Contributions are welcome! If you have suggestions for improving the system prompt, adding features, or fixing bugs, please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## Disclaimer

This tool is intended for educational and analytical purposes. The analysis is generated by an AI and may not always be perfectly accurate or complete. The user is **solely responsible for all costs and resource usage** incurred from their chosen AI service provider (Google Gemini API or local server).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.