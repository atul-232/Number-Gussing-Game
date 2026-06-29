# Number Guessing Game | Fun Guessing Adventure

A beautiful and modern client-side Number Guessing Game. Players choose or create profiles, select a game difficulty, and try to guess the secret code to open the locked treasure chest.

## Live Deployment Link
Play the game online right now: [https://number-gussing-game-ebon.vercel.app/](https://number-gussing-game-ebon.vercel.app/)

---

## About the Project
This project is built using vanilla web technologies (HTML5, CSS3, and JavaScript modules) to deliver a premium gaming experience.

### Key Features
1. **Splitting Dragon Seal Entrance Gate**: On load, a detailed dragon emblem zooms out in the center of the screen. Clicking the emblem splits the doors wide open to reveal the account select panel.
2. **Account Profiles (Local Persistence)**: 
   - Create accounts with custom names and icons (Wizard, Elf, Scientist, Lion, Fox, Owl).
   - Profiles persist across page reloads using the browser's localStorage.
   - Players earn gold coins by winning games to spend in the game shop.
3. **Local Ranking System**: 
   - A live ranking badge (Rank #1, Rank #2, etc.) is calculated dynamically for each profile based on game wins and gold count.
4. **4 Game Difficulty Levels**:
   - **Easy Level**: Guess from 1 to 50 | 10 Heart Lives | 50s Timer | Reward: 50 Gold
   - **Medium Level**: Guess from 1 to 100 | 7 Heart Lives | 80s Timer | Reward: 100 Gold
   - **Hard Level**: Guess from 1 to 250 | 5 Heart Lives | 110s Timer | Reward: 200 Gold
   - **Expert Level**: Guess from 1 to 500 | 3 Heart Lives | 140s Timer | Reward: 500 Gold
5. **Level-Scaled Shop (Hints & Tools)**:
   - **Odd/Even Hint**: Checks if the secret number is odd or even.
   - **Range Hint**: Narrows the minimum and maximum boundaries.
   - **Extra Life**: Restores +1 Heart life and adds +5s of time.
   - **Extra Time**: Adds +10s of time.
   - *Note: Power-up time bonuses are capped at each difficulty's maximum time limit.*
6. **Smart Countdown Timers**:
   - When a wrong guess is submitted, the timer automatically resets back to the level's full limit.
   - When the timer runs down to 0, the player loses 1 Heart (life) and the timer resets, instead of causing an instant game-over.
   - Ticking warning sounds and red badge warnings play under 10 seconds.
7. **Synthesized Web Audio API**: Interactive sounds (ticking warnings, heart break, buzzer, click, game over, win fanfare) are synthesized programmatically in the browser.
8. **Particle Background Controls**: Adjust the density of floating background dust particles (High, Low, or Off) and adjust the master volume slider.

---

## How to Play and Run Locally

If the online link is unavailable, or you want to run the project locally on your device, follow these instructions:

### Note on Module Security (CORS)
Because this application uses standard JavaScript ES Modules (import/export), opening the index.html file directly by double-clicking it in your file explorer may be blocked by your browser's security policy (CORS). Using a simple local server is highly recommended.

### Method 1: Using Python (Recommended)
1. Open your terminal or command prompt.
2. Navigate to the project directory.
3. Start Python's built-in HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your web browser and go to: http://localhost:8000

### Method 2: VS Code Live Server
1. Open the project folder in Visual Studio Code.
2. Install the Live Server extension (by Ritwick Dey).
3. Click the Go Live button at the bottom right corner of the window.
4. VS Code will automatically launch the game in your default browser.

---

## Legacy Console Version (Python)

A simple console-based version of the number guessing game using colorama and pyfiglet.

### Requirements
```bash
python3 -m pip install pyfiglet colorama
```

### Run Command
```bash
python3 code.py
```

---

## Author
- Atul Pandey
