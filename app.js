// app.js - Magical Vault Guessing Game Logic with Splitting Dragon Seal & Unified Login
import sound from './sound.js';

// Game Configuration for Levels
const STAGES = {
  easy: { name: "Whispering Woods", min: 1, max: 50, lives: 10, reward: 50, badgeClass: "badge-green", icon: "🌲" },
  medium: { name: "Lost Temple", min: 1, max: 100, lives: 7, reward: 100, badgeClass: "badge-blue", icon: "🏛️" },
  hard: { name: "Dragon's Lair", min: 1, max: 250, lives: 5, reward: 200, badgeClass: "badge-purple", icon: "🐲" },
  expert: { name: "Abyssal Void", min: 1, max: 500, lives: 3, reward: 500, badgeClass: "badge-red", icon: "🌀" }
};

// Power-up Costs (Scales dynamically per stage difficulty, see getPowerUpCosts)
// Achievements definition list
const ACHIEVEMENTS = [
  { id: 'first_win', icon: '🔑', title: 'First Decryption', desc: 'Unlock your very first matrix vault.' },
  { id: 'rich', icon: '💰', title: 'Gold Magnet', desc: 'Accumulate 500 or more Gold coins.' },
  { id: 'expert_win', icon: '🌀', title: 'Abyssal Master', desc: 'Successfully decrypt the Abyssal Void.' },
  { id: 'clutch', icon: '❤️', title: 'Clutch Lock', desc: 'Decrypt a vault on your final Heart life.' },
  { id: 'flawless', icon: '✨', title: 'Flawless Decrypt', desc: 'Unlock a vault with zero wrong guesses.' }
];

class Game {
  constructor() {
    this.profiles = {};
    this.activeProfileName = "";
    this.activeProfile = null;

    this.currentStage = 'medium';
    this.jackpotNumber = 0;
    this.currentGuess = 26;
    this.remainingLives = 7;
    this.guessHistory = [];
    
    // Timer properties
    this.timeRemaining = 0;
    this.gameTimer = null;
    
    // Inventory usage tracking per match
    this.roundUsed = { dowsing: 0, crystal: 0, timewarp: 0, hourglass: 0 };
    
    this.isFirstKeypadPress = true;

    // Advanced setting defaults
    this.masterVolume = 50;
    this.ambientEnabled = false;
    this.particleDensity = 'high';

    // Temporary registration state
    this.selectedRegAvatar = "🧙‍♂️";

    // DOM Screens
    this.screens = {
      lobby: document.getElementById('lobby-screen'),
      game: document.getElementById('game-screen'),
      outcome: document.getElementById('outcome-screen'),
      leaderboard: document.getElementById('leaderboard-screen')
    };

    this.init();
  }

  init() {
    this.loadGlobalSettings();
    this.generateParticles();
    this.loadProfiles();
    this.bindEvents();
    this.bindSettingsEvents();
    this.initIntroAnimations();
  }

  loadGlobalSettings() {
    this.masterVolume = parseInt(localStorage.getItem('magic_vault_volume')) ?? 50;
    if (isNaN(this.masterVolume)) this.masterVolume = 50;

    this.ambientEnabled = (localStorage.getItem('magic_vault_ambient') === 'true');
    this.particleDensity = localStorage.getItem('magic_vault_particles') || 'high';

    // Synchronize audio state
    sound.setVolume(this.masterVolume / 100);
    sound.setAmbienceEnabled(this.ambientEnabled);
  }

  // Load profiles from LocalStorage
  loadProfiles() {
    this.profiles = JSON.parse(localStorage.getItem('magic_vault_profiles')) || {};
    this.activeProfileName = localStorage.getItem('magic_vault_active_profile') || "";
    
    this.renderLoginAccounts();
    
    const profileNames = Object.keys(this.profiles);
    if (profileNames.length === 0) {
      this.typeText("Welcome to the Vault Matrix. Initiate decrypted link node. Create your Alchemist profile to store gold coins and high scores.");
    } else {
      this.typeText("Decoding cipher connection... Select your Alchemist profile card and decipher the ancient locks.");
      if (this.activeProfileName && this.profiles[this.activeProfileName]) {
        this.selectProfile(this.activeProfileName);
      } else {
        this.selectProfile(profileNames[0]);
      }
    }
  }

  // Render accounts dynamically on the login panel selector list
  renderLoginAccounts() {
    const list = document.getElementById('login-accounts-list');
    const existingSection = document.getElementById('existing-accounts-section');
    const dividerText = document.getElementById('login-divider-text');
    const btnEnter = document.getElementById('btn-enter-vault');
    
    if (!list) return;
    list.innerHTML = '';

    const profileNames = Object.keys(this.profiles);

    if (profileNames.length === 0) {
      existingSection.style.display = 'none';
      dividerText.style.display = 'none';
      btnEnter.style.display = 'none';
      
      // Auto expand register form if no profiles exist
      document.getElementById('register-fields-form').style.display = 'block';
      document.getElementById('btn-toggle-register').style.display = 'none';
      return;
    }

    existingSection.style.display = 'block';
    dividerText.style.display = 'block';
    document.getElementById('btn-toggle-register').style.display = 'block';

    // Sort accounts by wins, then gold
    const sortedProfiles = Object.values(this.profiles).sort((a, b) => {
      const winsA = (a.stats && a.stats.wins) || 0;
      const winsB = (b.stats && b.stats.wins) || 0;
      const goldA = a.gold || 0;
      const goldB = b.gold || 0;
      return (winsB - winsA) || (goldB - goldA);
    });

    sortedProfiles.forEach((p, index) => {
      const rank = index + 1;
      let rankEmoji = "🎖️";
      if (rank === 1) rankEmoji = "👑";
      else if (rank === 2) rankEmoji = "🥈";
      else if (rank === 3) rankEmoji = "🥉";

      const card = document.createElement('div');
      card.className = `account-card-row ${p.name === this.activeProfileName ? 'selected' : ''}`;
      card.dataset.name = p.name;
      card.innerHTML = `
        <div class="account-card-left">
          <span class="account-rank-badge">${rankEmoji} #${rank}</span>
          <span class="account-card-avatar">${p.avatar}</span>
          <span class="account-card-name">${p.name}</span>
        </div>
        <span class="account-card-stats">🪙 ${p.gold} | 🏆 ${p.stats.wins} Wins</span>
      `;

      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.account-card-row').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectProfile(p.name);
        btnEnter.style.display = 'block';
      });

      list.appendChild(card);
    });

    if (this.activeProfileName) {
      btnEnter.style.display = 'block';
    }
  }

  // Handle zooming full-screen dragon seal entrance sequence
  initIntroAnimations() {
    // Zoom completes in 1.5s, then initiate pulse glow
    setTimeout(() => {
      document.querySelectorAll('.dragon-half').forEach(el => {
        el.classList.add('pulse-glow');
      });
    }, 1500);

    // Auto-open doors after 5 seconds if not clicked? We can let the user click to unlock!
  }

  // Typewriter introduction helper
  typeText(text) {
    const el = document.getElementById('intro-typewriter');
    if (!el) return;
    el.textContent = "";
    let idx = 0;
    
    function type() {
      if (idx < text.length) {
        el.textContent += text.charAt(idx);
        idx++;
        setTimeout(type, 18);
      }
    }
    type();
  }

  populateProfileDropdowns() {
    const modalSelect = document.getElementById('modal-profile-select');
    modalSelect.innerHTML = '';
    
    Object.values(this.profiles).forEach(p => {
      const opt2 = document.createElement('option');
      opt2.value = p.name;
      opt2.textContent = `${p.avatar} ${p.name} (🪙 ${p.gold})`;
      modalSelect.appendChild(opt2);
    });

    if (this.activeProfileName) {
      modalSelect.value = this.activeProfileName;
    }
  }

  selectProfile(name) {
    if (!this.profiles[name]) return;
    
    this.activeProfileName = name;
    this.activeProfile = this.profiles[name];

    // Robust defensive data structure upgrades for backwards compatibility
    if (!this.activeProfile.stats) {
      this.activeProfile.stats = { wins: 0, losses: 0, guesses: 0, matchesPlayed: 0, favZone: {} };
    }
    if (this.activeProfile.stats.matchesPlayed === undefined) {
      this.activeProfile.stats.matchesPlayed = 0;
    }
    if (!this.activeProfile.stats.favZone) {
      this.activeProfile.stats.favZone = {};
    }
    if (!this.activeProfile.achievements) {
      this.activeProfile.achievements = [];
    }
    if (!this.activeProfile.highScores) {
      this.activeProfile.highScores = [];
    }
    if (this.activeProfile.gold === undefined) {
      this.activeProfile.gold = 20;
    }
    
    // Add persistent inventory support (Starting pack of 2 of each)
    if (!this.activeProfile.inventory) {
      this.activeProfile.inventory = { dowsing: 2, crystal: 2, timewarp: 2, hourglass: 2 };
    }
    if (this.activeProfile.inventory.dowsing === undefined) this.activeProfile.inventory.dowsing = 2;
    if (this.activeProfile.inventory.crystal === undefined) this.activeProfile.inventory.crystal = 2;
    if (this.activeProfile.inventory.timewarp === undefined) this.activeProfile.inventory.timewarp = 2;
    if (this.activeProfile.inventory.hourglass === undefined) this.activeProfile.inventory.hourglass = 2;

    localStorage.setItem('magic_vault_active_profile', name);
    this.saveProfiles();

    // Sync header info
    document.getElementById('current-profile-avatar').textContent = this.activeProfile.avatar;
    document.getElementById('current-profile-name').textContent = this.activeProfile.name;
    this.updateGoldDisplay();
    this.renderLeaderboardTable();
  }

  saveProfiles() {
    localStorage.setItem('magic_vault_profiles', JSON.stringify(this.profiles));
  }

  createProfile(name, avatar) {
    name = name.trim();
    if (!name) {
      this.showToast("Name cannot be blank!");
      return false;
    }
    if (this.profiles[name]) {
      this.showToast("This name already exists!");
      return false;
    }

    const newProfile = {
      name: name,
      avatar: avatar,
      gold: 20,
      highScores: [],
      inventory: {
        dowsing: 2,
        crystal: 2,
        timewarp: 2,
        hourglass: 2
      },
      stats: {
        wins: 0,
        losses: 0,
        guesses: 0,
        matchesPlayed: 0,
        favZone: {}
      },
      achievements: []
    };

    this.profiles[name] = newProfile;
    this.saveProfiles();
    this.selectProfile(name);
    this.renderLoginAccounts();
    this.showToast(`Alchemist ${name} created!`);
    return true;
  }

  deleteProfile(name) {
    if (!this.profiles[name]) return;
    
    delete this.profiles[name];
    this.saveProfiles();
    
    const remaining = Object.keys(this.profiles);
    if (remaining.length > 0) {
      this.selectProfile(remaining[0]);
    } else {
      this.activeProfileName = "";
      this.activeProfile = null;
      localStorage.removeItem('magic_vault_active_profile');
    }
    
    const welcomeOverlay = document.getElementById('welcome-intro');
    welcomeOverlay.style.display = 'flex';
    welcomeOverlay.classList.remove('open');

    // Reset login view back to closed doors and re-animate
    const leftDoor = document.getElementById('left-vault-door');
    const rightDoor = document.getElementById('right-vault-door');
    
    leftDoor.style.transform = '';
    rightDoor.style.transform = '';
    
    document.getElementById('login-overlay-container').classList.remove('visible-element');
    document.getElementById('welcome-greeting-overlay').classList.remove('visible-element');

    this.loadProfiles();
    this.initIntroAnimations();
    this.showToast("Profile deleted!");
  }

  // Generate background particles based on settings
  generateParticles() {
    const container = document.querySelector('.particle-container');
    if (!container) return;
    container.innerHTML = '';
    
    let count = 0;
    if (this.particleDensity === 'low') count = 10;
    else if (this.particleDensity === 'high') count = 25;
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      const size = Math.random() * 4 + 3;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particle.style.animationDuration = `${Math.random() * 8 + 6}s`;
      
      container.appendChild(particle);
    }
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2500);
  }

  // Perform split-door opening sequence when dragon is clicked
  openStoneGates() {
    sound.playWelcomeSweep();
    
    // Stop pulsing glows
    document.querySelectorAll('.dragon-half').forEach(el => {
      el.classList.remove('pulse-glow');
    });

    const welcomeOverlay = document.getElementById('welcome-intro');
    welcomeOverlay.classList.add('open');

    // Reveal login container behind opening doors
    setTimeout(() => {
      const container = document.getElementById('login-overlay-container');
      if (container) {
        container.classList.add('visible-element');
      }
    }, 700);
  }

  // Welcome banner full screen chimes typing animation sequence
  triggerWelcomeGreeting() {
    const greetingText = document.getElementById('welcome-greeting-text');
    const ap = this.activeProfile;
    if (!ap) return;

    sound.playWinFanfare();

    greetingText.textContent = `Welcome to the Vault Decryption, Alchemist ${ap.name}...`;

    const overlay = document.getElementById('welcome-greeting-overlay');
    overlay.classList.add('visible-element');

    // Wait 2.5 seconds, then fade out everything
    setTimeout(() => {
      const welcomeIntro = document.getElementById('welcome-intro');
      welcomeIntro.style.opacity = '0';
      welcomeIntro.style.transition = 'opacity 1s ease';
      
      setTimeout(() => {
        welcomeIntro.style.display = 'none';
      }, 1000);
    }, 2500);
  }

  bindEvents() {
    // Click events to open gates (binds to split panes left/right)
    document.getElementById('left-vault-door').addEventListener('click', () => {
      const welcomeOverlay = document.getElementById('welcome-intro');
      if (!welcomeOverlay.classList.contains('open')) {
        this.openStoneGates();
      }
    });

    document.getElementById('right-vault-door').addEventListener('click', () => {
      const welcomeOverlay = document.getElementById('welcome-intro');
      if (!welcomeOverlay.classList.contains('open')) {
        this.openStoneGates();
      }
    });

    // Advanced Settings Modal trigger
    const settingsModal = document.getElementById('settings-modal');
    document.getElementById('settings-toggle').addEventListener('click', () => {
      sound.playClick();
      this.openSettingsModal();
    });
    document.getElementById('close-settings').addEventListener('click', () => {
      sound.playClick();
      settingsModal.classList.remove('active');
    });

    // Guide Panel controls
    const helpModal = document.getElementById('help-modal');
    document.getElementById('help-toggle').addEventListener('click', () => {
      helpModal.classList.add('active');
      sound.playClick();
    });
    document.getElementById('close-help').addEventListener('click', () => {
      helpModal.classList.remove('active');
      sound.playClick();
    });

    // Profile registration avatar options
    document.querySelectorAll('#intro-avatar-grid .avatar-option').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('#intro-avatar-grid .avatar-option').forEach(o => o.classList.remove('active'));
        btn.classList.add('active');
        this.selectedRegAvatar = btn.dataset.avatar;
      });
    });

    // Toggle registration fields form collapsing
    document.getElementById('btn-toggle-register').addEventListener('click', () => {
      sound.playClick();
      const form = document.getElementById('register-fields-form');
      const btn = document.getElementById('btn-toggle-register');
      if (form.style.display === 'none') {
        form.style.display = 'block';
        btn.textContent = "➖ Hide Creator Fields";
      } else {
        form.style.display = 'none';
        btn.textContent = "➕ Create New Alchemist";
      }
    });

    // Create profile action
    document.getElementById('btn-create-profile').addEventListener('click', () => {
      const nameInput = document.getElementById('new-profile-name');
      const success = this.createProfile(nameInput.value, this.selectedRegAvatar);
      if (success) {
        nameInput.value = "";
        this.triggerWelcomeGreeting();
      }
    });


    // Tap to enter vault action
    document.getElementById('btn-enter-vault').addEventListener('click', () => {
      this.triggerWelcomeGreeting();
    });

    // Profile details card button
    const profileModal = document.getElementById('profile-modal');
    document.getElementById('profile-btn').addEventListener('click', () => {
      sound.playClick();
      this.openProfileModal();
    });
    document.getElementById('close-profile').addEventListener('click', () => {
      sound.playClick();
      profileModal.classList.remove('active');
    });

    // Modal switch alchemist
    document.getElementById('btn-modal-switch').addEventListener('click', () => {
      const selected = document.getElementById('modal-profile-select').value;
      sound.playClick();
      this.selectProfile(selected);
      this.openProfileModal();
      this.showToast(`Switched to ${selected}`);
    });

    // Add profile trigger from details modal
    document.getElementById('btn-modal-new-profile').addEventListener('click', () => {
      sound.playClick();
      profileModal.classList.remove('active');
      
      const welcomeOverlay = document.getElementById('welcome-intro');
      welcomeOverlay.style.display = 'flex';
      welcomeOverlay.style.opacity = '1';
      welcomeOverlay.classList.remove('open');
      
      // Reset doors closed
      const leftDoor = document.getElementById('left-vault-door');
      const rightDoor = document.getElementById('right-vault-door');
      leftDoor.style.transform = '';
      rightDoor.style.transform = '';
      
      document.getElementById('login-overlay-container').classList.remove('visible-element');
      document.getElementById('welcome-greeting-overlay').classList.remove('visible-element');

      // Expand creator fields on login screen
      document.getElementById('register-fields-form').style.display = 'block';
      document.getElementById('btn-toggle-register').textContent = "➖ Hide Creator Fields";

      this.initIntroAnimations();
      this.typeText("Initiating registry parameters. Choose Alchemist attributes...");
    });

    // Delete profile trigger from modal
    document.getElementById('btn-delete-profile').addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete ${this.activeProfileName}? All stats and gold will be lost permanently.`)) {
        profileModal.classList.remove('active');
        this.deleteProfile(this.activeProfileName);
      }
    });

    // Difficulty level cards
    document.querySelectorAll('.diff-card').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        const diff = card.dataset.difficulty;
        this.startGame(diff);
      });
    });

    // Range slider synchronization
    const slider = document.getElementById('guess-slider');
    const guessNum = document.getElementById('guess-number');

    slider.addEventListener('input', (e) => {
      this.currentGuess = parseInt(e.target.value);
      guessNum.textContent = this.currentGuess;
      this.isFirstKeypadPress = false;
    });

    // Screen Keypad button triggers
    document.querySelectorAll('.keypad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleKeyInput(btn.dataset.val);
      });
    });

    // Physical keydown listening
    window.addEventListener('keydown', (e) => {
      if (!this.screens.game.classList.contains('active')) return;
      
      if (e.key >= '0' && e.key <= '9') {
        this.handleKeyInput(e.key);
      } else if (e.key === 'Backspace') {
        this.handleKeyInput('back');
      } else if (e.key === 'Enter') {
        this.processGuess();
      } else if (e.key === 'Escape') {
        this.handleKeyInput('clear');
      }
    });

    // Cast Guess button trigger
    document.getElementById('cast-guess-btn').addEventListener('click', () => {
      this.processGuess();
    });

    // Shop item triggers (USE vs BUY buttons bound)
    document.getElementById('btn-dowsing-action').addEventListener('click', () => this.handlePowerUpAction('dowsing'));
    document.getElementById('btn-crystal-action').addEventListener('click', () => this.handlePowerUpAction('crystal'));
    document.getElementById('btn-timewarp-action').addEventListener('click', () => this.handlePowerUpAction('timewarp'));
    document.getElementById('btn-hourglass-action').addEventListener('click', () => this.handlePowerUpAction('hourglass'));

    // Navigation buttons between screens
    document.getElementById('nav-leaderboard-btn').addEventListener('click', () => {
      sound.playClick();
      this.showScreen('leaderboard');
    });

    document.getElementById('back-lobby-btn').addEventListener('click', () => {
      sound.playClick();
      this.showScreen('lobby');
    });

    document.getElementById('outcome-lobby-btn').addEventListener('click', () => {
      sound.playClick();
      this.showScreen('lobby');
    });

    document.getElementById('game-quit-btn').addEventListener('click', () => {
      sound.playClick();
      this.showScreen('lobby');
    });
  }

  // Bind Advanced Settings Panel Listeners
  bindSettingsEvents() {
    const volSlider = document.getElementById('volume-slider');
    const ambientBox = document.getElementById('ambient-toggle');
    const particleSelect = document.getElementById('particle-density-select');
    
    // Volume adjustments
    volSlider.addEventListener('input', (e) => {
      this.masterVolume = parseInt(e.target.value);
      localStorage.setItem('magic_vault_volume', this.masterVolume);
      
      sound.setVolume(this.masterVolume / 100);
      this.updateVolumeIndicator(this.masterVolume);
    });

    // Ambient Hum Toggle
    ambientBox.addEventListener('change', (e) => {
      this.ambientEnabled = e.target.checked;
      localStorage.setItem('magic_vault_ambient', this.ambientEnabled);
      
      sound.setAmbienceEnabled(this.ambientEnabled);
      sound.playClick();
    });

    // Particle changes
    particleSelect.addEventListener('change', (e) => {
      this.particleDensity = e.target.value;
      localStorage.setItem('magic_vault_particles', this.particleDensity);
      
      this.generateParticles();
      sound.playClick();
    });

    // Clear scores
    document.getElementById('btn-clear-leaderboard').addEventListener('click', () => {
      if (confirm("Reset local High Scores? This will clear all alchemist records.")) {
        sound.playClick();
        if (this.activeProfile) {
          this.activeProfile.highScores = [];
          this.saveProfiles();
          this.renderLeaderboardTable();
        }
        this.showToast("Leaderboard cleared!");
      }
    });

    // Factory reset
    document.getElementById('btn-factory-reset').addEventListener('click', () => {
      if (confirm("🚨 FACTORY RESET? This will delete all profiles and wipe all progress data permanently!")) {
        sound.playClick();
        localStorage.clear();
        window.location.reload();
      }
    });
  }

  openSettingsModal() {
    document.getElementById('volume-slider').value = this.masterVolume;
    this.updateVolumeIndicator(this.masterVolume);
    
    document.getElementById('ambient-toggle').checked = this.ambientEnabled;
    document.getElementById('particle-density-select').value = this.particleDensity;
    
    document.getElementById('settings-modal').classList.add('active');
  }

  updateVolumeIndicator(vol) {
    const indicator = document.getElementById('vol-indicator');
    if (vol === 0) indicator.textContent = "🔇";
    else if (vol < 33) indicator.textContent = "🔈";
    else if (vol < 66) indicator.textContent = "🔉";
    else indicator.textContent = "🔊";
  }

  // Keypad Typing Handler
  handleKeyInput(val) {
    sound.playClick();
    const config = STAGES[this.currentStage];
    const guessNum = document.getElementById('guess-number');
    const slider = document.getElementById('guess-slider');

    if (val === 'clear') {
      this.currentGuess = 0;
      this.isFirstKeypadPress = false;
    } else if (val === 'back') {
      const str = String(this.currentGuess);
      this.currentGuess = str.length > 1 ? parseInt(str.slice(0, -1)) : 0;
      this.isFirstKeypadPress = false;
    } else {
      if (this.isFirstKeypadPress) {
        this.currentGuess = parseInt(val);
        this.isFirstKeypadPress = false;
      } else {
        const str = (this.currentGuess === 0 ? '' : String(this.currentGuess)) + val;
        const num = parseInt(str) || 0;
        if (num <= config.max) {
          this.currentGuess = num;
        } else {
          this.showToast(`Max number is ${config.max}!`);
        }
      }
    }

    guessNum.textContent = this.currentGuess;
    
    if (this.currentGuess >= config.min && this.currentGuess <= config.max) {
      slider.value = this.currentGuess;
    }
  }

  // Open profile modal stats populations
  openProfileModal() {
    const ap = this.activeProfile;
    if (!ap) return;

    document.getElementById('modal-profile-avatar').textContent = ap.avatar;
    document.getElementById('modal-profile-name').textContent = ap.name;

    // Rank calculations inside profile details modal
    const sorted = Object.values(this.profiles).sort((a, b) => {
      const winsA = (a.stats && a.stats.wins) || 0;
      const winsB = (b.stats && b.stats.wins) || 0;
      const goldA = a.gold || 0;
      const goldB = b.gold || 0;
      return (winsB - winsA) || (goldB - goldA);
    });
    const rankIdx = sorted.findIndex(p => p.name === ap.name);
    const rank = rankIdx + 1;
    let rankEmoji = "🎖️";
    if (rank === 1) rankEmoji = "👑";
    else if (rank === 2) rankEmoji = "🥈";
    else if (rank === 3) rankEmoji = "🥉";
    
    const statsRank = document.getElementById('stats-rank');
    if (statsRank) {
      statsRank.textContent = `${rankEmoji} Rank #${rank}`;
    }

    // Display basic summary statistics
    document.getElementById('stats-wins').textContent = ap.stats.wins;
    document.getElementById('stats-losses').textContent = ap.stats.losses;
    document.getElementById('stats-guesses').textContent = ap.stats.guesses;

    let fav = "None";
    let max = 0;
    Object.entries(ap.stats.favZone || {}).forEach(([zone, count]) => {
      if (count > max) {
        max = count;
        fav = zone;
      }
    });
    document.getElementById('stats-fav').textContent = fav;

    // Load achievements
    const achContainer = document.getElementById('achievements-container');
    achContainer.innerHTML = '';

    ACHIEVEMENTS.forEach(ach => {
      const isUnlocked = ap.achievements.includes(ach.id);
      
      const card = document.createElement('div');
      card.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-badge-icon">${isUnlocked ? ach.icon : '🔒'}</div>
        <div class="ach-details">
          <span class="ach-title">${ach.title}</span>
          <span class="ach-desc">${ach.desc}</span>
        </div>
      `;
      achContainer.appendChild(card);
    });

    this.populateProfileDropdowns();
    document.getElementById('profile-modal').classList.add('active');
  }

  // Heart renderer
  renderHearts() {
    const container = document.getElementById('hearts-container');
    if (!container) return;
    container.innerHTML = '';
    const config = STAGES[this.currentStage];
    for (let i = 0; i < config.lives; i++) {
      const heart = document.createElement('span');
      heart.className = `heart-icon ${i >= this.remainingLives ? 'lost' : ''}`;
      heart.innerHTML = '❤️';
      container.appendChild(heart);
    }
  }

  getMaxTimeLimit() {
    if (this.currentStage === 'easy') return 50;
    if (this.currentStage === 'medium') return 80;
    if (this.currentStage === 'hard') return 110;
    return 140; // expert
  }

  startGame(difficulty) {
    this.currentStage = difficulty;
    const config = STAGES[difficulty];
    
    // Clear any existing timer countdown
    clearInterval(this.gameTimer);
    
    // Determine level time limit
    this.timeRemaining = this.getMaxTimeLimit();

    const timerBadge = document.getElementById('timer-badge');
    if (timerBadge) {
      timerBadge.classList.remove('warning');
      timerBadge.textContent = `⏳ ${this.timeRemaining}s`;
    }

    this.startCountdown();

    this.jackpotNumber = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    this.currentGuess = Math.round((config.max + config.min) / 2);
    this.remainingLives = config.lives;
    this.guessHistory = [];
    
    // Reset round usage parameters
    this.roundUsed = { dowsing: 0, crystal: 0, timewarp: 0, hourglass: 0 };
    
    this.isFirstKeypadPress = true;

    // Set UI configuration
    const badge = document.getElementById('zone-badge');
    badge.textContent = `${config.icon} ${config.name}`;
    badge.className = `zone-badge ${config.badgeClass}`;
    
    // Set Slider bounds
    document.getElementById('range-min').textContent = config.min;
    document.getElementById('range-max').textContent = config.max;
    
    const slider = document.getElementById('guess-slider');
    slider.min = config.min;
    slider.max = config.max;
    slider.value = this.currentGuess;
    
    document.getElementById('guess-number').textContent = this.currentGuess;
    document.getElementById('hint-message').textContent = "Peer into the vault and make your choice...";
    
    // Render hearts
    this.renderHearts();

    // Reset chest lock state
    const chest = document.getElementById('chest-element');
    chest.className = 'magic-chest bounce';

    // Clear history logs and show starting scroll
    const historyLog = document.getElementById('history-log');
    historyLog.innerHTML = `
      <div class="history-row-item">
        <div class="history-row-left">
          <svg class="scroll-history-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM3 19V6h18v13H3z" fill="#bda169"/>
          </svg>
          <div class="history-row-text-block">
            <div class="history-row-title">Vault decipher sequence started</div>
            <div class="history-row-time">Dungeon: ${config.name}</div>
          </div>
        </div>
      </div>
    `;

    // Increment play statistic for favorite zone
    const ap = this.activeProfile;
    if (ap) {
      if (!ap.stats.favZone) ap.stats.favZone = {};
      ap.stats.favZone[config.name] = (ap.stats.favZone[config.name] || 0) + 1;
      this.saveProfiles();
    }

    this.updateShopUIs();
    this.showScreen('game');
  }

  startCountdown() {
    clearInterval(this.gameTimer);
    
    this.gameTimer = setInterval(() => {
      if (!this.screens.game.classList.contains('active')) {
        clearInterval(this.gameTimer);
        return;
      }
      
      this.timeRemaining--;
      
      const timerBadge = document.getElementById('timer-badge');
      if (timerBadge) {
        timerBadge.textContent = `⏳ ${this.timeRemaining}s`;
        
        if (this.timeRemaining <= 10) {
          timerBadge.classList.add('warning');
          sound.playTick();
        } else {
          timerBadge.classList.remove('warning');
        }
      }
      
      if (this.timeRemaining <= 0) {
        // Decrement 1 life heart
        this.remainingLives--;
        this.renderHearts();
        
        // Audio & Visual Alert feedback
        const container = document.getElementById('game-panel');
        if (container) {
          container.classList.add('wrong-guess-shake');
          setTimeout(() => container.classList.remove('wrong-guess-shake'), 400);
        }
        sound.playWrongGuess(false);
        sound.playHeartBreak();
        
        this.addHistoryLog("⏰ Timeout! Lost 1 Heart life.");
        const hintMsg = document.getElementById('hint-message');
        if (hintMsg) {
          hintMsg.textContent = "⏰ Timeout! You lost 1 Heart life.";
        }

        if (this.remainingLives <= 0) {
          clearInterval(this.gameTimer);
          this.handleLoss(true); // Loss due to timeout
        } else {
          // Reset timer back to full stage limits for the next attempt
          this.timeRemaining = this.getMaxTimeLimit();
          
          if (timerBadge) {
            timerBadge.classList.remove('warning');
            timerBadge.textContent = `⏳ ${this.timeRemaining}s`;
          }
        }
      }
    }, 1000);
  }

  updateGoldDisplay() {
    if (!this.activeProfile) return;
    
    document.querySelectorAll('.gold-count').forEach(el => {
      el.textContent = this.activeProfile.gold;
    });
    this.saveProfiles();
    this.updateShopUIs();
  }

  getPowerUpLimits() {
    if (this.currentStage === 'easy') {
      return { dowsing: 1, crystal: 1, timewarp: 1, hourglass: 2 };
    } else if (this.currentStage === 'medium') {
      return { dowsing: 2, crystal: 2, timewarp: 1, hourglass: 3 };
    } else if (this.currentStage === 'hard') {
      return { dowsing: 3, crystal: 3, timewarp: 2, hourglass: 4 };
    } else { // expert
      return { dowsing: 4, crystal: 4, timewarp: 2, hourglass: 5 };
    }
  }

  getPowerUpCosts() {
    if (this.currentStage === 'easy') {
      return { dowsing: 15, crystal: 25, timewarp: 30, hourglass: 10 };
    } else if (this.currentStage === 'medium') {
      return { dowsing: 30, crystal: 50, timewarp: 60, hourglass: 20 };
    } else if (this.currentStage === 'hard') {
      return { dowsing: 60, crystal: 100, timewarp: 120, hourglass: 40 };
    } else { // expert
      return { dowsing: 150, crystal: 250, timewarp: 300, hourglass: 100 };
    }
  }

  updateShopUIs() {
    if (!this.activeProfile) return;

    const ap = this.activeProfile;
    const inventory = ap.inventory;
    const limits = this.getPowerUpLimits();

    const items = ['dowsing', 'crystal', 'timewarp', 'hourglass'];

    items.forEach(type => {
      const textEl = document.getElementById(`${type}-stats-text`);
      const btnEl = document.getElementById(`btn-${type}-action`);

      if (!textEl || !btnEl) return;

      const owned = inventory[type] || 0;
      const used = this.roundUsed[type] || 0;
      const limit = limits[type];

      // Update descriptive text
      textEl.textContent = `Owned: ${owned} | Used: ${used}/${limit}`;

      // Reset styles and states
      btnEl.disabled = false;
      btnEl.className = 'shop-action-btn premium';

      if (used >= limit) {
        btnEl.textContent = "Max Reached";
        btnEl.disabled = true;
        btnEl.className = 'shop-action-btn premium disabled';
      } else {
        if (owned > 0) {
          btnEl.textContent = `Use (${owned} Left)`;
        } else {
          // If owned is 0, they can buy + use instantly
          const costs = this.getPowerUpCosts();
          const cost = costs[type];
          btnEl.textContent = `Buy (${cost}🪙)`;

          // Disable button if gold is not sufficient
          if (ap.gold < cost) {
            btnEl.className = 'shop-action-btn premium disabled';
            btnEl.disabled = true;
          }
        }
      }
    });
  }

  handlePowerUpAction(type) {
    if (!this.activeProfile) return;

    const ap = this.activeProfile;
    const limits = this.getPowerUpLimits();
    const used = this.roundUsed[type] || 0;
    const limit = limits[type];

    // Cap Check
    if (used >= limit) {
      this.showToast("Level usage cap reached for this item!");
      return;
    }

    const owned = ap.inventory[type] || 0;
    const costs = this.getPowerUpCosts();
    const cost = costs[type];
    const hintMsg = document.getElementById('hint-message');

    sound.playClick();

    if (owned > 0) {
      // Consume 1 from inventory
      ap.inventory[type]--;
      this.roundUsed[type]++;
      sound.playPowerUp();
      this.triggerPowerUpEffect(type);
    } else {
      // Buy and use instantly
      if (ap.gold < cost) {
        sound.playBuzzer();
        this.showToast("Not enough Gold coin reserves!");
        return;
      }

      ap.gold -= cost;
      this.roundUsed[type]++;
      sound.playPowerUp();
      this.triggerPowerUpEffect(type);
      this.updateGoldDisplay();
    }

    this.saveProfiles();
    this.updateShopUIs();
  }

  triggerPowerUpEffect(type) {
    const hintMsg = document.getElementById('hint-message');
    
    if (type === 'dowsing') {
      const isEven = this.jackpotNumber % 2 === 0;
      hintMsg.textContent = `🔮 Dowsing Rod: Vault value is ${isEven ? 'EVEN' : 'ODD'}!`;
      this.addHistoryLog(`Dowsing: Vault code is ${isEven ? 'EVEN' : 'ODD'}`);
    } 
    
    else if (type === 'crystal') {
      const config = STAGES[this.currentStage];
      const rangeMargin = Math.max(4, Math.round((config.max - config.min) * 0.18));
      const lowBound = Math.max(config.min, this.jackpotNumber - Math.floor(Math.random() * rangeMargin));
      const highBound = Math.min(config.max, this.jackpotNumber + Math.floor(Math.random() * rangeMargin));
      
      hintMsg.textContent = `🔮 Crystal Ball: Secret number is between ${lowBound} and ${highBound}!`;
      this.addHistoryLog(`Crystal Ball: Narrowed: ${lowBound} to ${highBound}`);
    } 
    
    else if (type === 'timewarp') {
      this.remainingLives++;
      this.renderHearts();
      
      const oldTime = this.timeRemaining;
      this.timeRemaining = Math.min(this.getMaxTimeLimit(), this.timeRemaining + 5);
      const added = this.timeRemaining - oldTime;
      
      const timerBadge = document.getElementById('timer-badge');
      if (timerBadge && this.timeRemaining > 10) {
        timerBadge.classList.remove('warning');
      }
      hintMsg.textContent = `⏳ Time Warp: Restored 1 Heart life & added +${added}s!`;
      this.addHistoryLog(`Time Warp: Restored 1 Heart & +${added}s (Current: ${this.remainingLives})`);
    }
    
    else if (type === 'hourglass') {
      const oldTime = this.timeRemaining;
      this.timeRemaining = Math.min(this.getMaxTimeLimit(), this.timeRemaining + 10);
      const added = this.timeRemaining - oldTime;
      
      const timerBadge = document.getElementById('timer-badge');
      if (timerBadge && this.timeRemaining > 10) {
        timerBadge.classList.remove('warning');
      }
      hintMsg.textContent = `⏳ Hourglass: Added +${added}s to the current countdown!`;
      this.addHistoryLog(`Hourglass: Added +${added}s (Current time: ${this.timeRemaining}s)`);
    }
  }

  processGuess() {
    if (!this.activeProfile) return;

    const guess = this.currentGuess;
    const config = STAGES[this.currentStage];
    const hintMsg = document.getElementById('hint-message');
    const container = document.getElementById('game-panel');

    if (guess < config.min || guess > config.max) {
      sound.playBuzzer();
      this.showToast(`Enter a number between ${config.min} and ${config.max}!`);
      return;
    }

    if (this.guessHistory.includes(guess)) {
      sound.playClick();
      this.showToast(`You already guessed ${guess}!`);
      return;
    }

    this.guessHistory.push(guess);
    this.isFirstKeypadPress = true;

    this.activeProfile.stats.guesses++;
    this.saveProfiles();

    if (guess === this.jackpotNumber) {
      this.handleWin();
    } else {
      this.remainingLives--;
      this.renderHearts();

      // Reset timer on wrong guess back to stage defaults
      this.timeRemaining = this.getMaxTimeLimit();
      
      const timerBadge = document.getElementById('timer-badge');
      if (timerBadge) {
        timerBadge.classList.remove('warning');
        timerBadge.textContent = `⏳ ${this.timeRemaining}s`;
      }

      container.classList.add('wrong-guess-shake');
      setTimeout(() => container.classList.remove('wrong-guess-shake'), 400);

      const isHigher = guess > this.jackpotNumber;
      sound.playWrongGuess(isHigher);
      sound.playHeartBreak();

      if (isHigher) {
        hintMsg.textContent = `📉 ${guess} is too HIGH. Try lower!`;
        this.addHistoryLog(`Guess #${this.guessHistory.length}: ${guess} (Too High ↓)`);
      } else {
        hintMsg.textContent = `📈 ${guess} is too LOW. Try higher!`;
        this.addHistoryLog(`Guess #${this.guessHistory.length}: ${guess} (Too Low ↑)`);
      }

      if (this.remainingLives <= 0) {
        this.handleLoss();
      }
    }
    
    this.updateShopUIs();
  }

  addHistoryLog(text) {
    const historyLog = document.getElementById('history-log');
    const row = document.createElement('div');
    row.className = 'history-row-item';
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    row.innerHTML = `
      <div class="history-row-left">
        <svg class="scroll-history-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM3 19V6h18v13H3z M6 9h12v2H6zm0 4h8v2H6z" fill="#bda169"/>
        </svg>
        <div class="history-row-text-block">
          <div class="history-row-title">${text}</div>
          <div class="history-row-time">${timeStr}</div>
        </div>
      </div>
    `;
    
    historyLog.appendChild(row);
    historyLog.scrollTop = historyLog.scrollHeight;
  }

  handleWin() {
    clearInterval(this.gameTimer);
    sound.playWinFanfare();
    
    const config = STAGES[this.currentStage];
    const chest = document.getElementById('chest-element');
    chest.classList.add('open');

    // Calculate score
    const remainingHeartsPercent = this.remainingLives / config.lives;
    const baseScore = config.reward;
    const bonusScore = Math.round(remainingHeartsPercent * baseScore);
    const totalScore = baseScore + bonusScore;

    // Increment win stats
    this.activeProfile.stats.wins++;
    this.activeProfile.stats.matchesPlayed++;
    
    this.activeProfile.gold += config.reward;
    this.updateGoldDisplay();

    this.checkAchievements(true);

    // Prepare outcome screens
    document.getElementById('outcome-icon').innerHTML = '🏆';
    document.getElementById('outcome-title').innerHTML = 'JACKPOT UNLOCKED';
    document.getElementById('outcome-title').className = 'outcome-title win';
    document.getElementById('outcome-msg').innerHTML = `You discovered the hidden vault value <strong>${this.jackpotNumber}</strong>!`;
    
    document.getElementById('result-gold-earned').textContent = `+${config.reward} Gold`;
    document.getElementById('result-score').textContent = totalScore;
    
    this.saveScore(totalScore);

    setTimeout(() => {
      this.showScreen('outcome');
    }, 1200);
  }

  handleLoss(isTimeout = false) {
    clearInterval(this.gameTimer);
    sound.playGameOver();
    
    // Increment loss stats
    this.activeProfile.stats.losses++;
    this.activeProfile.stats.matchesPlayed++;
    this.saveProfiles();

    this.checkAchievements(false);

    // Prepare outcome screens
    if (isTimeout) {
      document.getElementById('outcome-icon').innerHTML = '⏰';
      document.getElementById('outcome-title').innerHTML = 'OUT OF TIME';
      document.getElementById('outcome-msg').innerHTML = `The vault timed out and locked you out! The code was <strong>${this.jackpotNumber}</strong>.`;
    } else {
      document.getElementById('outcome-icon').innerHTML = '💀';
      document.getElementById('outcome-title').innerHTML = 'OUT OF HEARTS';
      document.getElementById('outcome-msg').innerHTML = `The vault locked you out. The code was <strong>${this.jackpotNumber}</strong>.`;
    }
    document.getElementById('outcome-title').className = 'outcome-title lose';
    
    document.getElementById('result-gold-earned').textContent = `0 Gold`;
    document.getElementById('result-score').textContent = 0;

    setTimeout(() => {
      this.showScreen('outcome');
    }, 800);
  }

  // Achievement Check Logic
  checkAchievements(isWin) {
    const ap = this.activeProfile;
    if (!ap) return;

    if (!ap.achievements) ap.achievements = [];

    if (isWin) {
      this.unlockAchievement('first_win');
    }

    if (ap.gold >= 500) {
      this.unlockAchievement('rich');
    }

    if (isWin && this.currentStage === 'expert') {
      this.unlockAchievement('expert_win');
    }

    if (isWin && this.remainingLives === 1) {
      this.unlockAchievement('clutch');
    }

    if (isWin && this.guessHistory.length === 1) {
      this.unlockAchievement('flawless');
    }
  }

  unlockAchievement(id) {
    const ap = this.activeProfile;
    if (!ap.achievements.includes(id)) {
      ap.achievements.push(id);
      this.saveProfiles();

      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) {
        sound.playPowerUp();
        this.showToast(`🏆 Achievement Unlocked: ${ach.title}!`);
      }
    }
  }

  saveScore(score) {
    const config = STAGES[this.currentStage];
    const newEntry = {
      score: score,
      difficulty: config.name,
      date: new Date().toLocaleDateString()
    };
    
    if (!this.activeProfile.highScores) this.activeProfile.highScores = [];
    this.activeProfile.highScores.push(newEntry);
    this.activeProfile.highScores.sort((a, b) => b.score - a.score);
    this.activeProfile.highScores = this.activeProfile.highScores.slice(0, 10);
    
    this.saveProfiles();
    this.renderLeaderboardTable();
  }

  renderLeaderboardTable() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    const scores = (this.activeProfile && this.activeProfile.highScores) ? this.activeProfile.highScores : [];
    
    if (scores.length === 0) {
      list.innerHTML = '<div style="text-align:center; padding:15px; color:var(--text-muted);">No records found. Decrypt vaults to write history!</div>';
      return;
    }

    scores.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';
      row.innerHTML = `
        <div class="rank-name">
          <span class="rank">#${index + 1}</span>
          <span class="diff-tag">${entry.difficulty}</span>
        </div>
        <div class="score">${entry.score} pts</div>
      `;
      list.appendChild(row);
    });
  }

  showScreen(screenId) {
    if (screenId !== 'game') {
      clearInterval(this.gameTimer);
    }
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });
    const activeScreen = this.screens[screenId];
    if (activeScreen) {
      activeScreen.classList.add('active');
    }
  }
}

// Instantiate game when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.magicGame = new Game();
});
