# 📑 Playlist Summarizer — YouTube Playlist & Video AI Summarizer

Playlist Summarizer is a full-stack **Next.js 16** web application running on port `3001` that enables users to input any YouTube playlist link, extract video metadata, transcribe audio via local speech-to-text models, and generate comprehensive AI summaries using advanced large language models.

---

## ✨ What It Does

Playlist Summarizer automates the process of digesting long video playlists through a multi-step workflow:
1. **📥 Playlist Ingestion (`lib/youtube.ts`)**: Connects to the **Google Cloud YouTube Data API v3** to parse playlist URLs, extract video IDs, titles, thumbnails, and durations (supporting playlists up to 30 videos).
2. **🗄️ State Persistence (`lib/prisma.ts`)**: Uses **Prisma ORM** backed by a local **SQLite** database (`dev.db`) to track the exact processing status of every video (e.g., *pending*, *captions_checked*, *transcript_fetched*, *summarizing*, *completed*, or *error*).
3. **🎙️ Speech-to-Text Transcription (`app/api/video/[id]/whisper-transcribe/route.ts`)**: When standard closed captions are unavailable or incomplete, the application sends a request to the companion **`whisper-backend`** service (running on port `8001`) to download the video audio and transcribe it locally using Whisper neural speech models.
4. **🧠 Hierarchical AI Summarization (`lib/summarize.ts`)**: Connects to the **OpenRouter API** to generate structured summaries. To handle lengthy transcripts that exceed context limits, it implements an intelligent **Hierarchical Chunking Algorithm**:
   - Estimates token counts and splits long transcripts into logical paragraph chunks.
   - Generates intermediate summaries for each section.
   - Synthesizes all intermediate summaries into a final, cohesive executive summary using customizable prompts and user-selected LLM models (such as Claude 3.5 Sonnet, Gemini Pro, or Llama 3).

---

## 🚀 How to Activate on Localhost

### Option A: ⚡ Automated One-Click Launch (`run_all.sh`)
An automated script, **`run_all.sh`**, is included directly inside this directory (and across every project folder). You can launch the entire setup effortlessly by running:
```bash
./run_all.sh
```
**By running this single script, it does the rest of the job automatically:**
1. **Creates Virtual Environments**: Automatically sets up Python venvs for backend transcription services.
2. **Installs Modules & Dependencies**: Automatically runs `npm install` and `pip install -r requirements.txt` across all services.
3. **Sets Up Databases**: Automatically initializes SQLite (`dev.db`) and pushes the Prisma database schema.
4. **Starts All Services**: Launches both frontends (`3000`, `3001`) and backends (`8000`, `8001`) simultaneously.

> [!IMPORTANT]
> **What You Need to Provide**:
> - **API Keys**: Ensure you enter your `YOUTUBE_API_KEY` in `playlist-summarizer/.env` and provide an **OpenRouter API key** directly on the web UI when summarizing videos.
> - **Fine-Tuned Models**: For custom neural synonym generation in `ml-engine`, download the models from the [Google Drive Link](https://drive.google.com/drive/folders/1g3x9jr7xrMNGzDqDqxp5wR8UL1Fdsu1k?usp=drive_link) and place them inside `ml-engine/models/`.

---

### Option B: Running Standalone (Manual Setup)
To run only Playlist Summarizer manually on port `3001`:
```bash
cd path/to/Projects/playlist-summarizer

# Install dependencies
npm install

# Initialize SQLite database
npx prisma db push

# Start development server
npm run dev
```
Open your browser and navigate to: **[http://localhost:3001](http://localhost:3001)**

> [!NOTE]
> For audio transcription support, ensure that the companion **`whisper-backend`** service is running simultaneously on port `8001`.

---

## 🔑 Environment Variables & Required Keys

This application requires two types of API keys:

### 1. Backend Environment Variables (`.env`)
Create your `.env` file by copying the provided example:
```bash
cp .env.example .env
```

Configure the following variables in `.env`:
```env
# SQLite Database URL for Prisma local dev
DATABASE_URL="file:./dev.db"

# YouTube Data API v3 Key (Required to fetch playlist video lists)
YOUTUBE_API_KEY="YOUR_YOUTUBE_API_KEY_HERE"

# Local Whisper Backend URL (default is http://127.0.0.1:8001)
WHISPER_BACKEND_URL="http://127.0.0.1:8001"
```

#### How to get a YouTube Data API v3 Key:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Library**, search for **YouTube Data API v3**, and click **Enable**.
4. Go to **APIs & Services > Credentials**, click **Create Credentials > API Key**.
5. Copy the generated key and paste it into `YOUTUBE_API_KEY` in your `.env` file.

### 2. OpenRouter API Key (UI Input)
When initiating video summarization on the dashboard, users are prompted to input an **OpenRouter API Key**. This key is used client-to-server to authorize requests to OpenRouter's AI models. You can obtain a key from [OpenRouter.ai](https://openrouter.ai/).

---

## 📂 Project Structure

```text
playlist-summarizer/
├── app/                  # Next.js App Router
│   ├── api/              # API Endpoints
│   │   ├── playlist/     # Playlist metadata fetching
│   │   ├── test-key/     # OpenRouter API key validator
│   │   └── video/[id]/   # Video transcription & summarization routes
│   └── page.tsx          # Main Dashboard UI
├── components/           # UI Components (PlaylistView, VideoCard, ProcessingView)
├── lib/
│   ├── ai/openrouter.ts  # OpenRouter client configuration
│   ├── prisma.ts         # Prisma DB client singleton
│   ├── summarize.ts      # Hierarchical chunking & summarization engine
│   └── youtube.ts        # YouTube Data API parser
├── prisma/
│   └── schema.prisma     # SQLite database schema (Video & Playlist models)
├── package.json          # Dependencies and scripts
└── .env.example          # Environment variable template
```

---

## 💡 Code Improvements Made for Easier Running
- **Automated Script Inclusion**: Added a self-configuring `run_all.sh` launcher directly inside this folder for instant execution.
- **Configurable Whisper Endpoint**: Updated `app/api/video/[id]/whisper-transcribe/route.ts` to utilize the `WHISPER_BACKEND_URL` environment variable rather than hardcoding `http://127.0.0.1:8001`, allowing flexible deployment across different ports or containers.
- **Created `.env.example`**: Added a standardized example file to make database and API key setup straightforward for new developers.
