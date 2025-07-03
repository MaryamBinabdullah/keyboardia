// import confetti from 'canvas-confetti';
const targetWord = document.getElementById("targetWord");
const themeName = document.getElementById("themeName") || { innerText: "" };


//""""
let rhymeAudio = null;
let currentRhymeData = null;

let LEVELS = [];
let currentLevel = 1;
let currentStage = 1;
let currentWordIndex = 0;
let words = [];

// Load levels from JSON
async function loadLevels() {
  const response = await fetch("/static/levels.json");
  LEVELS = await response.json();
  loadLevel(currentLevel, currentStage);
}

// Normalize spaces internally
function normalize(word) {
  return word.replace(/ /g, "␣");
}

// Create on-screen keyboard
function createKeyboard() {
  const keyboardDiv = document.getElementById("keyboard");
  keyboardDiv.innerHTML = "";

  const rows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "?"],
    ["space"],
  ];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("key-row");

    for (let key of row) {
      const btn = document.createElement("button");
      btn.classList.add("key");

      if (key === "space") {
        btn.innerText = "␣";
        btn.classList.add("key-space");
        btn.dataset.letter = "␣"; // Use ␣ internally
      } else {
        btn.innerText = key;
        btn.dataset.letter = key;
      }

      btn.onclick = () => {
        let char = btn.dataset.letter;
        handleKeyPress(char);
      };
      rowDiv.appendChild(btn);
    }

    keyboardDiv.appendChild(rowDiv);
  }
}

// Start typing level
function startLevel() {
  if (currentWordIndex >= words.length) {
    showQuiz();
    return;
  }

  let word = words[currentWordIndex];
  targetWord.innerText = word;
  highlightNextLetter(normalize(word)[0]);

  // Show theme name & apply theme
  if (LEVELS[currentLevel - 1] && LEVELS[currentLevel - 1].name) {
    const theme = LEVELS[currentLevel - 1].name;
    themeName.innerText = theme;
    applyTheme(theme);
  }
}

// Highlight next letter
function highlightNextLetter(letter) {
  if (!letter) return;
  const keys = document.querySelectorAll(".key");
  for (let key of keys) {
    if (key.dataset.letter.toLowerCase() === letter.toLowerCase()) {
      key.classList.add("highlight");
    } else {
      key.classList.remove("highlight");
    }
  }
}

// Play wrong sound
function playWrongSound() {
  const audio = new Audio("/static/audio/wrong-sound.mp3");
  audio.play();
}

// Handle typing logic
function handleKeyPress(pressed) {
  let displayedWord = targetWord.innerText;
  let internalWord = normalize(displayedWord);
  highlightPressedKey(pressed);

  if (pressed.toLowerCase() === internalWord[0]?.toLowerCase()) {
    playSound(); // Play correct key sound

    targetWord.innerText = displayedWord.slice(1);
    let newInternal = internalWord.slice(1);

    targetWord.innerText = targetWord.innerText.replace(/␣/g, " ");

    if (targetWord.innerText === "") {
      currentWordIndex++;

      if (currentWordIndex >= words.length) {
        showQuiz();
        return;
      }

      startLevel();
    } else {
      highlightNextLetter(newInternal[0]);
    }
  } else {
    playWrongSound(); // Play wrong key sound
  }
}

// Load a level/stage
function loadLevel(levelNum, stageNum) {
  const levelData = LEVELS[levelNum - 1];
  const stages = levelData.stages;

  if (!stages || stages.length === 0) return;

  if (stageNum > stages.length) {
    showQuiz();
    return;
  }

  words = stages[stageNum - 1];
  currentWordIndex = 0;
  startLevel();
}
function applyTheme(theme) {
  const body = document.body;

  // Clear all theme classes
  body.className = body.className.replace(/\btheme-\w+/g, "").trim();

  // Use switch for better readability and extension
  switch (theme) {
    case "Space":
      body.classList.add("theme-space");
      break;
    case "On the Farm":
      body.classList.add("theme-farm");
      break;
    case "Vehicles":
      body.classList.add("theme-vehicles");
      break;
    case "Numbers":
      body.classList.add("theme-numbers");
      break;
    case "Time":
      body.classList.add("theme-time");
      break;
    case "Under the Sea":
      body.classList.add("theme-sea");
      break;
    case "Clothes":
      body.classList.add("theme-clothes");
      break;
    case "Seasons":
      body.classList.add("theme-seasons");
      break;
    case "Food":
      body.classList.add("theme-food");
      break;
    case "Body Parts":
      body.classList.add("theme-body-parts");
      break;

    default:
      body.className = body.className.replace(/\btheme-\w+/g, "").trim();
      break;
  }
}
// Move to next level/stage
function moveToNextLevel() {
  let nextStage = currentStage + 1;

  if (nextStage > getTotalStagesForLevel(currentLevel)) {
    currentLevel++;
    nextStage = 1;
  }

  currentStage = nextStage;
  saveProgress(currentLevel, currentStage);

  // Restore default handler
  window.handleKeyPress = function (pressed) {
    let displayedWord = targetWord.innerText;
    let internalWord = normalize(displayedWord);

    if (pressed.toLowerCase() === internalWord[0]?.toLowerCase()) {
      playSound();

      targetWord.innerText = displayedWord.slice(1);
      let newInternal = internalWord.slice(1);

      targetWord.innerText = targetWord.innerText.replace(/␣/g, " ");

      if (targetWord.innerText === "") {
        currentWordIndex++;

        if (currentWordIndex >= words.length) {
          showQuiz();
          return;
        }

        startLevel();
      } else {
        highlightNextLetter(newInternal[0]);
      }
    } else {
      playWrongSound();
    }
  };

  loadLevel(currentLevel, currentStage);
}

// Get total stages in current level
function getTotalStagesForLevel(levelNum) {
  return LEVELS[levelNum - 1].stages.length;
}

// Save progress to server
function saveProgress(level, stage) {
  fetch("/save_progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress: `${level};${stage}` }),
  });
}

// Show multiple-choice quiz at end of level
function showQuiz() {
  const currentLevelData = LEVELS[currentLevel - 1];

  if (!currentLevelData.quiz) {
    showRhyme();
    return;
  }

  const quizArea = document.getElementById("quizArea");
  const imageEl = document.getElementById("quizImage");
  const questionEl = document.getElementById("quizQuestion");
  const optionsEl = document.getElementById("quizOptions");
  const quizInput = document.getElementById("quizInput");

  // Hide targetWord (we won't use it here)
  targetWord.style.display = "none";

  // Set quiz content
  imageEl.src = currentLevelData.quiz.image;
  questionEl.innerText = "What is this?";
  optionsEl.innerHTML = "";
  quizInput.innerText = ""; // Clear previous input

  // Show multiple-choice options
  currentLevelData.quiz.options.forEach((option) => {
    const li = document.createElement("li");
    li.innerText = option;
    optionsEl.appendChild(li);
  });

  quizArea.style.display = "block";

  // Get the correct answer (lowercase)
  const answer = currentLevelData.quiz.answer.toLowerCase();

  // Track user input
  let userInput = "";

  // Use a new handler just for quiz
  window.handleKeyPress = function (pressed) {
    // Only allow letters and backspace
    if (/^[a-z]$/.test(pressed)) {
      playSound(); // Always play sound on valid letter
      highlightPressedKey(pressed);
      userInput += pressed;

      // Limit to 18 characters
      if (userInput.length > 50) {
        userInput = userInput.slice(1); // Keep last 18 letters
      }

      quizInput.innerText = userInput;

      // Check if user has typed the correct word
      if (userInput === answer) {
        quizArea.style.display = "none";
        optionsEl.innerHTML = "";
        quizInput.innerText = "";
        targetWord.style.display = "inline-block"; // Restore normal typing
        showRhyme(); // Move to rhyme after quiz
      }
    }

    // Optional: Allow backspace
    if (pressed === "backspace") {
      userInput = userInput.slice(0, -1);
      quizInput.innerText = userInput;
    }
  };
}
// show light up
function highlightPressedKey(letter) {
  const keys = document.querySelectorAll(".key");
  for (let key of keys) {
    if (key.dataset.letter.toLowerCase() === letter?.toLowerCase()) {
      key.classList.add("pressed");
      setTimeout(() => key.classList.remove("pressed"), 150);
    }
  }
}

// Show nursery rhyme verse
function showRhyme() {
  const currentLevelData = LEVELS[currentLevel - 1];

  if (!currentLevelData.rhyme || !currentLevelData.rhyme.verse) {
    moveToNextLevel();
    return;
  }

  const rhymeVerseEl = document.getElementById("rhymeVerse");
  const rhymeControlsEl = document.getElementById("rhymeControls");

  // Set verse text
  const verse = currentLevelData.rhyme.verse;
  rhymeVerseEl.innerText = verse;
  rhymeControlsEl.style.display = "none"; // Hide controls until verse is typed
  targetWord.innerText = verse;
  highlightNextLetter(verse[0]);

  // Save rhyme data globally
  currentRhymeData = currentLevelData.rhyme;

  // Replace handleKeyPress with typing mode
  window.handleKeyPress = function (pressed) {
    let displayedVerse = targetWord.innerText;
    let cleanDisplayed = displayedVerse.replace(/[\s\n]/g, "");

    const expectedChar = cleanDisplayed[0]?.toLowerCase();

    if (expectedChar && pressed.toLowerCase() === expectedChar) {
      playSound();
      let firstCharIndex = displayedVerse.search(/[^\s\n]/); // Find real char
      if (firstCharIndex !== -1) {
        displayedVerse =
          displayedVerse.slice(0, firstCharIndex) +
          displayedVerse.slice(firstCharIndex + 1);
      }

      targetWord.innerText = displayedVerse;

      if (targetWord.innerText.replace(/[\s\n]/g, "") === "") {
        // Verse done → show rhyme audio controls
        rhymeVerseEl.innerText = currentRhymeData.verse; // Show full verse again
        rhymeControlsEl.style.display = "flex";
        rhymeControlsEl.style.gap = "15px";
        rhymeControlsEl.style.justifyContent = "center";
        launchConfetti(); // Add this line
        // Play the rhyme automatically
        rhymeAudio = new Audio(currentRhymeData.audio);
        rhymeAudio.loop = false;

        rhymeAudio.addEventListener("ended", () => {
          console.log("Rhyme ended");
        });

        rhymeAudio.play();
      } else {
        const newClean = targetWord.innerText.replace(/[\s\n]/g, "");
        highlightNextLetter(newClean[0]);
      }
    } else {
      playWrongSound();
    }
  };
}
//cofetti
function launchConfetti() {
  confetti({
    particleCount: 200,
    spread: 90,
    origin: { y: 0.6 },
    ticks: 200,
    scalar: 1.2,
    colors: ["#FFD700", "#FF69B4", "#00FFFF", "#FF4500", "#00FF00"],
  });
}
// Play sound effect
function playSound() {
  const audio = new Audio("/static/audio/key-sound.mp3");
  audio.play();
}

// Flash the matching on-screen key when pressed
function highlightPressedKey(letter) {
  const keys = document.querySelectorAll(".key");
  for (let key of keys) {
    if (key.dataset.letter.toLowerCase() === letter?.toLowerCase()) {
      key.classList.add("pressed");
      setTimeout(() => key.classList.remove("pressed"), 150);
    }
  }
}

// Listen for real keyboard input
document.addEventListener("keydown", (e) => {
  const pressed = e.key.toLowerCase();

  // If quiz is showing, send answer
  if (document.getElementById("quizArea").style.display === "block") {
    handleKeyPress(pressed);
    return;
  }

  // Handle spacebar
  if (pressed === " ") {
    handleKeyPress("␣");
    highlightPressedKey("␣");
    return;
  }

  // Handle normal typing
  if (
    pressed.length === 1 &&
    (/[a-z0-9]/.test(pressed) ||
      [",", ".", "-", "'", "[", "]", "=", ";", "/", "?"].includes(pressed))
  ) {
    handleKeyPress(pressed);
    highlightPressedKey(pressed);
  }
});

// Detect Shift key state
let shiftPressed = false;

document.addEventListener("keydown", (e) => {
  if (e.key === "Shift") {
    shiftPressed = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    shiftPressed = false;
  }
});

// Song controls
function playRhymeAudio() {
  if (rhymeAudio && rhymeAudio.paused) {
    rhymeAudio.play();
  }
}
function pauseRhymeAudio() {
  if (rhymeAudio && !rhymeAudio.paused) {
    rhymeAudio.pause();
  }
}
function replayRhymeAudio() {
  if (rhymeAudio) {
    rhymeAudio.currentTime = 0;
    rhymeAudio.play();
  }
}
function skipRhyme() {
  if (rhymeAudio) {
    rhymeAudio.pause();
    rhymeAudio.currentTime = 0;
  }
  document.getElementById("rhymeVerse").innerText = "";
  document.getElementById("rhymeControls").style.display = "none";
  moveToNextLevel(); // Make sure this function exists
}

//endless Mode
// Only run if we're on the endless typing page
if (document.getElementById("wordContainer")) {
  // Word List
  const ENDLESS_WORDS = [
    "cat", "dog", "sun", "fun", "red", "blue", "car", "bus",
    "hat", "ball", "tree", "book", "milk", "door", "fish"
  ];

  let currentEndlessWord = "";
  let endlessScore = 0;

  // Show Random Word + highlight first letter
  function showRandomEndlessWord() {
    currentEndlessWord = ENDLESS_WORDS[Math.floor(Math.random() * ENDLESS_WORDS.length)];
    document.getElementById("wordContainer").innerText = currentEndlessWord;
    highlightNextLetter(currentEndlessWord[0]);
  }

  // Handle Key Press in Endless Mode
  function handleEndlessKeyPress(pressed) {
    const wordElement = document.getElementById("wordContainer");
    if (!currentEndlessWord) return;

    const expectedChar = currentEndlessWord[0]?.toLowerCase();
    const inputChar = pressed.toLowerCase();

    if (inputChar === expectedChar) {
      playSound(); 

      currentEndlessWord = currentEndlessWord.slice(1);
      wordElement.innerText = currentEndlessWord;

      if (currentEndlessWord === "") {
        endlessScore++;
        launchConfetti(); 
        setTimeout(() => {
          showRandomEndlessWord(); 
        }, 300);
      } else {
        highlightNextLetter(currentEndlessWord[0]); 
      }
    } else {
      playWrongSound(); 
    }

    highlightPressedKey(pressed);
  }

  // Create on screen keyboard
  function createEndlessKeyboard() {
    const keyboardDiv = document.getElementById("keyboard");
    if (!keyboardDiv) return;

    keyboardDiv.innerHTML = ""; // Clear any old buttons

    const rows = [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"]
    ];

    for (let row of rows) {
      const rowDiv = document.createElement("div");
      rowDiv.classList.add("key-row");

      for (let key of row) {
        const btn = document.createElement("button");
        btn.classList.add("key");
        btn.innerText = key;
        btn.dataset.letter = key;
        btn.onclick = () => {
          handleEndlessKeyPress(key);
        };
        rowDiv.appendChild(btn);
      }

      keyboardDiv.appendChild(rowDiv);
    }
  }

  // keyboard listener
  document.addEventListener("keydown", (e) => {
    const pressed = e.key.toLowerCase();
    if (/^[a-z]$/.test(pressed)) {
      handleEndlessKeyPress(pressed);
    }
  });

  // Start Game
  document.addEventListener("DOMContentLoaded", () => {
    createEndlessKeyboard();
    showRandomEndlessWord();
  });
}

// Start game
document.addEventListener("DOMContentLoaded", () => {
  createKeyboard();
  loadLevels();
});
