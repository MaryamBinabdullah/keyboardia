// import confetti from 'canvas-confetti';
const targetWord = document.getElementById("targetWord");
const themeName = document.getElementById("themeName") || { innerText: "" };
const ONE_WORD_STAGES = true  // when enabled each stage will have only 1 word (for testing)

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
  if (ONE_WORD_STAGES && words.length>0)
  	words = [words[0]];
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
    case "Transport":
      body.classList.add("theme-transport");
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

function genQuiz(curr_level_words_list, imgs_path)
{
	let quiz = {};
	let shuffled_words = shuffle(curr_level_words_list, 3);
	let options = [shuffled_words[0], shuffled_words[1], shuffled_words[2]];
	let answer = randomItem(options);
	// adding letters numbering to options
	for (let i = 0; i < options.length; i++)
		options[i] = "abc".split("")[i] + ") "+ options[i]
		
	let img = imgs_path + "/" + answer + ".jpg";
	
	quiz["options"] = options
	quiz["answer"] = answer
	quiz["image"] = img
	return quiz
	
}

// Show multiple-choice quiz at end of level
function showQuiz() {
  const currentLevelData = LEVELS[currentLevel - 1];
  console.log(currentLevelData['stages'][0])
  const quiz = genQuiz(currentLevelData['stages'][0], "/static/images")
  

//  if (!currentLevelData.quiz) {
//   showRhyme();
//  return;
// }

  const quizArea = document.getElementById("quizArea");
  const imageEl = document.getElementById("quizImage");
  const questionEl = document.getElementById("quizQuestion");
  const optionsEl = document.getElementById("quizOptions");
  const quizInput = document.getElementById("quizInput");

  // Hide targetWord (we won't use it here)
  targetWord.style.display = "none";

  // Set quiz content
  imageEl.src = quiz.image;
  questionEl.innerText = "What is this?";
  optionsEl.innerHTML = "";
  quizInput.innerText = ""; // Clear previous input

  // Show multiple-choice options
  quiz.options.forEach((option) => {
    const li = document.createElement("li");
    li.innerText = option;
    optionsEl.appendChild(li);
  });

  quizArea.style.display = "block";

  // Get the correct answer (lowercase)
  const answer = quiz.answer.toLowerCase();

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
 "head", "shoulders", "knees", "toes","hands", "elbow", "finger", "nose",
"apple", "banana", "pear", "grape","cake", "bread", "milk", "juice",
  "spring", "summer", "autumn", "winter","sun", "snow", "rain", "leaf",
"shirt", "pants", "socks", "hat","jacket", "shoes", "gloves", "scarf",
"fish", "whale", "octopus", "shark","crab", "jellyfish", "turtle", "coral",
"clock", "hour", "minute", "second","morning", "afternoon", "night", "evening",
"one", "two", "three", "four","five", "six", "seven", "eight",
"bus", "car", "truck", "train","bike", "boat", "plane", "van",
"cow", "pig", "sheep", "chicken","tractor", "barn", "hay", "duck",
"rocket", "moon", "star", "galaxy","planet", "comet", "alien", "satellite"
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
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "?"],
    ["space"],
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

// ~~~~~~~~~~~~~~~~~ helper functions ~~~~~~~~~~~~~~~~~~~~
// returns a shuffled copy of input array 
function shuffle(array, times=1)
{
	let copy = array.slice();
	for (let i = copy.length - 1; i > 0 ; i--)
	{
		let j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]]
	}
	// recursively repeat the shuffle depending on the times parameter
	return (times - 1 <= 0)? copy : shuffle(copy, times - 1)
}

// returns a random item from a list 
// NOTE: this function does not return a copy for non-primitve types 
function randomItem(array)
{
	random_index = Math.floor(Math.random() * array.length)
	return array[random_index]
}


// canvasss
// === Animated Backgrounds Based on Theme ===


const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

let animationFrameId;

// Particle arrays
let stars = [];
let bubbles = [];
let transportObjects = [];
let leaves = [];
let numbers = [];
let clock = { angle: 0, angle2:0, center_offsetx: 0, center_offsety: 0 };
let clock2 = { angle: 0, angle2:0, center_offsetx: -200, center_offsety: -100 };
let clock3 = { angle: 0, angle2:0, center_offsetx: 50, center_offsety: -200 };
let clock4 = { angle: 0, angle2:0, center_offsetx: -80, center_offsety: 200 };
let clock5 = { angle: 0, angle2:0, center_offsetx: 190, center_offsety: -20 };

let clothesItems = [];
let foodItems = [];
let snowflakes = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getCurrentTheme() {
  const bodyClasses = [...document.body.classList];
  return bodyClasses.find(cls => cls.startsWith('theme-')) || 'theme-space';
}

function clearAnimation() {
  cancelAnimationFrame(animationFrameId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const themeAnimations = {
  'theme-space': animateStars,   //animateStars
  'theme-sea': animateBubbles,
  'theme-transport': animateTransport,
  'theme-farm': animateLeaves,
  'theme-numbers': animateNumbers,
  'theme-time': animateClock,
  'theme-clothes': animateClothes,
  'theme-food': animateFood,
  'theme-seasons': animateSnowflakes,
  'theme-body-parts': animateCells
};

function runAnimation() {
  const theme = getCurrentTheme();
  const drawFunction = themeAnimations[theme] || themeAnimations['theme-space'];
  clearAnimation();
  function loop() {
    drawFunction();
    animationFrameId = requestAnimationFrame(loop);
  }
  loop();
}

// Watch for theme changes dynamically
const observer = new MutationObserver(runAnimation);
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

runAnimation(); // Start initial animation

// --- ANIMATIONS ---

// Space: Twinkling stars
function animateStars() {
  ctx.fillStyle = 'white';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!stars.length) {
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        alpha: Math.random(),
        delta: Math.random() * 0.02
      });
    }
  }

  stars.forEach(star => {
    star.alpha += star.delta;
    if (star.alpha <= 0 || star.alpha >= 1) star.delta *= -1;
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// Under the Sea: Bubbles rising
function animateBubbles() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bubbles.length < 50) {
    bubbles.push({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      r: Math.random() * 5 + 2,
      speed: Math.random() * 1 + 0.5
    });
  }

  bubbles.forEach(bubble => {
    bubble.y -= bubble.speed;
    bubble.x += Math.sin(bubble.y * 0.02) * 0.5;

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.fill();
  });

  bubbles = bubbles.filter(b => b.y > -10);
}

// Transport : Floating headlights and wheels
function animateTransport() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (Math.random() < 0.1) {
    transportObjects.push({
      x: -20,
      y: Math.random() * canvas.height,
      speed: 2 + Math.random() * 2,
      type: Math.random() > 0.5 ? 'car' : 'wheel'
    });
  }

  transportObjects.forEach(obj => {
    ctx.fillStyle = obj.type === 'car' ? 'yellow' : 'white';
    if (obj.type === 'car') {
      ctx.beginPath();
      ctx.rect(obj.x, obj.y, 40, 10);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(obj.x + 10, obj.y + 5, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    obj.x += obj.speed;

    if (obj.x > canvas.width + 50) {
      transportObjects = transportObjects.filter(o => o !== obj);
    }
  });
}

// Farm: Drifting leaves
function animateLeaves() {
  ctx.fillStyle = 'rgba(0, 100, 0, 0.5)';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (leaves.length < 30) {
    leaves.push({
      x: Math.random() * canvas.width,
      y: -10,
      r: Math.random() * 10 + 5,
      drift: (Math.random() - 0.5) * 1,
      speed: Math.random() * 1 + 0.5
    });
  }

  leaves.forEach(leaf => {
    leaf.y += leaf.speed;
    leaf.x += leaf.drift;

    ctx.beginPath();
    ctx.arc(leaf.x, leaf.y, leaf.r, 0, Math.PI * 2);
    ctx.fill();
  });

  leaves = leaves.filter(l => l.y < canvas.height + 10);
}

// Numbers: Floating digits
function animateNumbers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.font = '20px sans-serif';

  if (numbers.length < 20) {
    numbers.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      num: Math.floor(Math.random() * 10),
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5
    });
  }

  numbers.forEach(n => {
    n.x += n.dx;
    n.y += n.dy;

    if (n.x < 0 || n.x > canvas.width) n.dx *= -1;
    if (n.y < 0 || n.y > canvas.height) n.dy *= -1;

    ctx.fillText(n.num, n.x, n.y);
  });
}

// Time: Rotating clock hands
function draw_clock(clock, radius=280, speed=0.01) {
  let padding = 10;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  // annoying rotating logic
  ctx.save();
  ctx.translate(canvas.width / 2 + clock.center_offsetx,
  			    canvas.height / 2 + clock.center_offsety);
  ctx.rotate(clock.angle);
  // draw long clock thingy (for minutes)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -radius);
  ctx.stroke();
  ctx.restore(); // rotating logic ends
  
  // annoying rotating logic again
  ctx.save();
  ctx.translate(canvas.width / 2 + clock.center_offsetx,
  			    canvas.height / 2 + clock.center_offsety);
  ctx.rotate(clock.angle2);  // use angle for hour thingy
  // draw short clock thingy (for hours)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -radius * 0.6); // 60% the size of minutes thingy
  ctx.stroke();
  // draw circle
  ctx.beginPath();
  ctx.arc(0, 0, radius + padding, 0, Math.PI * 2); // x, y, radius, startAngle, endAngle
  ctx.stroke();
  ctx.restore(); // rotating logic ends
  
  clock.angle += speed;
  clock.angle2 += speed * 0.3; // rotating speed of hour thing is 30% of minutes thingy
}
function animateClock() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw_clock(clock, 100, 0.01);
  draw_clock(clock2, 90, 0.02);
  draw_clock(clock3, 80, 0.03);
  draw_clock(clock4, 70, 0.04);
  draw_clock(clock5, 60, 0.05);
}


// Clothes: Falling hangers or clothes icons
function animateClothes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

  if (clothesItems.length < 15) {
    clothesItems.push({
      x: Math.random() * canvas.width,
      y: -20,
      size: 20, // now it's a square
      speed: 1 + Math.random() * 1.5
    });
  }

  clothesItems.forEach(item => {
    item.y += item.speed;
    ctx.fillRect(item.x, item.y, item.size, item.size); // draw square
  });

  clothesItems = clothesItems.filter(i => i.y < canvas.height);
}

// Food: Floating food icons
function animateFood() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';

  if (foodItems.length < 15) {
    foodItems.push({
      x: Math.random() * canvas.width,
      y: -20,
      r: 10 + Math.random() * 10,
      speed: 0.5 + Math.random()
    });
  }

  foodItems.forEach(food => {
    food.y += food.speed;
    ctx.beginPath();
    ctx.arc(food.x, food.y, food.r, 0, Math.PI * 2);
    ctx.fill();
  });

  foodItems = foodItems.filter(f => f.y < canvas.height);
}

//Seasons: Snowflakes
function animateSnowflakes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';

  if (snowflakes.length < 100) {
    snowflakes.push({
      x: Math.random() * canvas.width,
      y: -10,
      r: 2 + Math.random() * 3,
      speed: 1 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 0.5
    });
  }

  snowflakes.forEach(flake => {
    flake.y += flake.speed;
    flake.x += flake.drift;

    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
    ctx.fill();
  });

  snowflakes = snowflakes.filter(f => f.y < canvas.height);
}

// 🧠 Body Parts: Drifting neurons/cells
function animateCells() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

  if (Math.random() < 0.1) {
    cells.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 5 + Math.random() * 5,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5
    });
  }

  cells.forEach(cell => {
    cell.x += cell.dx;
    cell.y += cell.dy;

    ctx.beginPath();
    ctx.arc(cell.x, cell.y, cell.r, 0, Math.PI * 2);
    ctx.fill();
  });

  cells = cells.filter(c => c.x > 0 && c.x < canvas.width && c.y > 0 && c.y < canvas.height);
}

let numberParticles = [];

function animateNumbers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';

  if (numberParticles.length < 30) {
    numberParticles.push({
      x: Math.random() * canvas.width,
      y: -10,
      number: Math.floor(Math.random() * 10),
      dx: (Math.random() - 0.5) * 1,
      dy: 1 + Math.random() * 1.5
    });
  }

  numberParticles.forEach(p => {
    p.y += p.dy;
    p.x += p.dx;

    ctx.fillText(p.number, p.x, p.y);

    // Remove off-screen
    if (p.y > canvas.height + 10) {
      numberParticles = numberParticles.filter(particle => particle !== p);
    }
  });
}

