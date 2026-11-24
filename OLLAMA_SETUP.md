# FitFlow Coach – AI chat setup (Ollama)

The chat bubble in the bottom-right corner talks to **FitFlow Coach**, an assistant that only
answers questions about workouts and nutrition. It runs a free, open-source model **on your own
computer** through [Ollama](https://ollama.com). There's no API key and nothing to pay.

If you skip this setup, the rest of the app still works. The chat will just say the assistant is
unavailable.

## 1. Install Ollama

- **Windows / macOS:** download the installer from https://ollama.com/download and run it.
- **Linux:** `curl -fsSL https://ollama.com/install.sh | sh`

Check it works:

```
ollama --version
```

Already have Ollama? Update it to the latest version. Older versions (e.g. 0.24) can't download
`gemma3:4b`; they fail with "requires a newer version of Ollama". On Windows:

```
winget upgrade --id Ollama.Ollama
```

(or re-run the installer from https://ollama.com/download).

After install, Ollama runs in the background (tray icon on Windows/macOS). If it isn't running, start it with:

```
ollama serve
```

## 2. Download a model (one time)

The default is **`gemma3:4b`** (~3.4 GB):

```
ollama pull gemma3:4b
```

We picked it after comparing three models on the same Romanian and English questions:

| Model | Romanian | Speed (RTX 4050, 6 GB) | Verdict |
|---|---|---|---|
| `gemma3:4b` | Good | 1–5 s per answer, fully on GPU | **Default**: fast, follows the rules with our prompt |
| `aya-expanse:8b` | Best | 9–27 s, partly on CPU | Better grammar, but slow and writes markdown |
| `llama3.1:8b` | Poor (invents words) | 5–18 s, partly on CPU | Not recommended for Romanian |

On a laptop without a dedicated GPU, `gemma3:4b` still works, just slower (it runs on the CPU).
If it's too slow, try `gemma3:1b` (~0.8 GB): it's much faster but its answers are noticeably weaker.

Quick test in the terminal (type `/bye` to exit):

```
ollama run gemma3:4b
```

## 3. Point the backend at your model

Only needed if you're **not** using the default `gemma3:4b`. Add to `backend/.env`:

```
OLLAMA_MODEL=gemma3:1b
# Optional – only if Ollama runs on another machine/port:
# OLLAMA_URL=http://localhost:11434
```

Restart the backend (`npm run dev` in `backend/`).

## 4. Use it

Start the backend and frontend as usual, log in, and click the blue chat bubble in the
bottom-right corner.

The first message after starting Ollama takes a few seconds while the model loads into memory.
After that, answers stream in word by word.

## Troubleshooting

| Message in the chat | Fix |
|---|---|
| "Asistentul AI nu este disponibil…" | Ollama isn't running. Start it (`ollama serve` or the tray app). |
| "Modelul "…" nu este instalat…" | Run the `ollama pull …` command shown, or set `OLLAMA_MODEL` to a model you already have (`ollama list`). |
| Answers are very slow | The model doesn't fit in your GPU memory. Run `ollama ps`: if PROCESSOR shows CPU, switch to a smaller model. |

## How it works

```
ChatWidget (React)  --POST /api/chat-->  Express (JWT auth)  --stream-->  Ollama localhost:11434
```

- `frontend/src/components/chat/ChatWidget.jsx`: the bubble and chat window. The conversation is kept in `sessionStorage`.
- `backend/src/services/chatService.js`: the system prompt (topic, language, health safety, style), history limits and the Ollama call.
  Small models drift from the system prompt, so the backend also attaches a short hidden note to each
  question with the reply language (Romanian/English) and the topic rule. If the question mentions pain,
  injury, pregnancy, medication and similar, the note also tells the model to recommend a doctor.
  If you change the prompt, avoid example sentences in quotes: `gemma3:4b` copies them into every answer.
- The model never sees your FitFlow data; it only sees the messages typed in the chat.
