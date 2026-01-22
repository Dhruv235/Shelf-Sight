export function speak(text: string, opts?: { rate?: number; pitch?: number }) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts?.rate ?? 1;
  u.pitch = opts?.pitch ?? 1;

  const voices = window.speechSynthesis.getVoices();
  const en = voices.find(v => /en/i.test(v.lang));
  if (en) u.voice = en;

  window.speechSynthesis.speak(u);
}
