function normalizeDigits(value) {
  return String(value || '').replace(/[۰-۹٠-٩]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

function supportsTwoPlayers(value) {
  const text = normalizeDigits(value).toLowerCase().trim();
  if (!text) return false;
  if (/^\d+$/.test(text)) return Number(text) >= 2;
  const range = text.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) return Number(range[2]) >= 2;

  // The homepage's 2-player shelf describes the playable story/local mode.
  // Online-only limits must not turn a one-player story game (for example GTA V
  // or Red Dead Redemption 2) into a 2-player game.
  return text.split(/[·,;|/\n]+/).some(mode => {
    const segment = mode.trim();
    if (!segment || /\bonline\b/i.test(segment)) return false;
    const counts = [...segment.matchAll(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:players?|local|story|couch|split[-\s]?screen)\b/g)];
    return counts.some(match => Number(match[2] || match[1]) >= 2);
  });
}

module.exports = { supportsTwoPlayers };
