const chatService = require('../services/chatService');

const chat = async (req, res) => {
  let messages;
  try {
    messages = chatService.sanitizeMessages(req.body.messages);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Stop generating on the GPU if the user closes the chat mid-answer.
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    let started = false;
    for await (const piece of chatService.streamChat(messages, controller.signal)) {
      if (!started) {
        res.status(200).set({
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
        });
        started = true;
      }
      res.write(piece);
    }
    if (!started) res.status(200).type('text/plain');
    res.end();
  } catch (err) {
    if (controller.signal.aborted) return;
    if (res.headersSent) return res.end();
    const unavailable = ['OLLAMA_UNAVAILABLE', 'MODEL_NOT_FOUND'].includes(err.code);
    res.status(unavailable ? 503 : 500).json({ success: false, message: err.message });
  }
};

module.exports = { chat };
