# The Mystic Vault | Adventure Number Guessing Game

An adventure-themed number guessing game where you play the role of an alchemist decoding ancient vaults. Features a beautiful visual interface, progressive difficulty levels, gold rewards, shop power-ups, local leaderboard, and interactive audio feedback.

## Features

- **4 Difficulty Zones**:
  - *Whispering Woods* (Easy): Ranges 1-50, 10 Hearts.
  - *Lost Temple* (Medium): Ranges 1-100, 7 Hearts.
  - *Dragon's Lair* (Hard): Ranges 1-250, 5 Hearts.
  - *Abyssal Void* (Expert): Ranges 1-500, 3 Hearts.
- **Dungeon Shop / Power-ups**:
  - *Dowsing Rod*: Checks if the jackpot is Odd/Even.
  - *Crystal Ball*: Narrows down the guess bounds.
  - *Time Warp*: Restores a lost Heart life.
- **Dynamic Synthesized Audio**: Sound effects generated entirely inside the browser using the Web Audio API.
- **Premium Aesthetics**: Glowing glassmorphism dashboard, particle background effects, and interactive treasure chest opening animations.
- **Local Leaderboard**: Tracks your top 10 decryption scores.

## Play in Browser (Recommended)

1. Launch a simple web server from the project directory:
   ```bash
   python3 -m http.server 8000
   ```
2. Open [http://localhost:8000](http://localhost:8000) in your web browser.

---

## Legacy Console Version (Python)

A simple console-based number guessing game using `colorama` and `pyfiglet`.

### Requirements

```bash
python3 -m pip install pyfiglet colorama
```

### Run Command

```bash
python3 code.py
```

## Author

Atul Pandey
