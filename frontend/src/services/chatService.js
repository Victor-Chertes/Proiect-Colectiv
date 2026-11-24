// Uses fetch instead of axios so the reply can be read as a stream.
export async function streamChat(messages, onText, signal) {
  const token = sessionStorage.getItem('fitflow_token');
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (res.status === 401) {
    sessionStorage.removeItem('fitflow_token');
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    let message = 'Asistentul nu a putut răspunde. Încearcă din nou.';
    try {
      const data = await res.json();
      if (data.message) message = data.message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onText(decoder.decode(value, { stream: true }));
  }
}
