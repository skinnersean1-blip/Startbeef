const ADJECTIVES = [
  "IRON", "DARK", "SILENT", "GHOST", "WILD", "COLD", "SHARP", "BOLD",
  "LONE", "BLIND", "STEEL", "STONE", "SWIFT", "GRIM", "BLUNT", "RAW",
  "BARE", "STARK", "HARD", "DEEP",
];

const NOUNS = [
  "WOLF", "HAWK", "BEAR", "FOX", "LION", "SHARK", "EAGLE", "BULL",
  "VIPER", "RAVEN", "COBRA", "TIGER", "FALCON", "LYNX", "HOUND",
  "FIST", "BLADE", "MASK", "VOICE", "JUDGE",
];

export function generateCodename(): string {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(1000 + Math.random() * 9000);
  return `${adj} ${noun} #${num}`;
}
