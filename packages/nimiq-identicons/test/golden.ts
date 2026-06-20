// Frozen input corpus used to prove that performance refactors keep
// identicon output byte-identical. Inputs probe ASCII, valid NQ addresses,
// surrogate/astral characters (the code-point vs code-unit risk in makeHash),
// empty/whitespace, very long strings, and special characters.

export interface CorpusEntry { name: string, input: string }

export const corpus: CorpusEntry[] = [
  { name: 'empty', input: '' },
  { name: 'single-char', input: 'a' },
  { name: 'nimiq', input: 'nimiq' },
  { name: 'hello', input: 'hello' },
  { name: 'test', input: 'test' },
  { name: 'numeric', input: '1234567890' },
  { name: 'special', input: '!@#$%^&*()' },
  { name: 'spaces', input: '   ' },
  { name: 'emoji-single', input: '💎' },
  { name: 'emoji-mixed', input: 'a💎b🎉c' },
  { name: 'emoji-two', input: '🎉🎊' },
  { name: 'long', input: 'x'.repeat(500) },
  { name: 'address-zero', input: 'NQ07 0000 0000 0000 0000 0000 0000 0000 0000' },
  { name: 'address-248h', input: 'NQ34 248H 248H 248H 248H 248H 248H 248H 248H' },
]

// Checksum-valid Nimiq addresses, used to exercise the validate+normalize path.
export const validAddresses: string[] = [
  'NQ07 0000 0000 0000 0000 0000 0000 0000 0000',
  'NQ34 248H 248H 248H 248H 248H 248H 248H 248H',
]
