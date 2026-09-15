const answers = "PLANET STREAM BRIDGE CAMERA SCHOOL BRIGHT FRIEND GARDEN SILVER ORANGE PURPLE YELLOW WINTER SUMMER SPRING AUTUMN FOREST MARKET PLAYER WRITER EDITOR REPORT SOURCE BYLINE COLUMN LAYOUT DESIGN ONLINE SCREEN BUTTON PUZZLE LETTER ANSWER RANDOM CHOICE RESULT FUTURE MEMORY PEOPLE PERSON FAMILY PARENT SISTER NUMBER LITTLE ALWAYS SHOULD BEFORE REALLY PUBLIC CHANGE AROUND DURING OFFICE STREET TRAVEL FLIGHT DRIVER ENGINE ENERGY NATURE ANIMAL RABBIT TURTLE MONKEY BOTTLE COFFEE COOKIE DINNER CEREAL CHEESE BUTTER BANANA CHERRY TOMATO CARROT PEPPER GARLIC POTATO FLOWER BRANCH LEAVES GROUND ISLAND DESERT OCEANS VALLEY CANYON CLOUDS BREEZE SHADOW SUNSET GOLDEN SECRET HIDDEN HONEST SIMPLE CLEVER STRONG GENTLE ACTIVE FAMOUS UNIQUE MODERN USEFUL CAREER CAMPUS LESSON COURSE SPORTS SOCCER TENNIS RUNNER JUMPER BASKET RACING TROPHY MEDALS ROBOTS CODING PYTHON SERVER BINARY SEARCH CREATE LAUNCH UPDATE SYSTEM DEVICE MOBILE LAPTOP WINDOW FOLDER CLOUDY SAFETY SECURE VERIFY DETAIL FORMAT READER POSTER SPEECH DEBATE ACTING SCRIPT GUITAR PIANOS ARTIST PAINTS MOVIES CINEMA COMEDY DRAMAS SCENES DIRECT HIKING SURFER PICNIC VACATE HOTELS TICKET BUDGET SAVING WALLET DOCTOR NURSES HEALTH SLEEPY WALKER JOGGER LEADER MEMBER GROUPS CLUBBY SOCIAL CHATTY SMILEY DREAMS EFFORT SKILLS TALENT IMPACT WINNER FINISH STARTS MIDDLE ENDING WEEKLY YEARLY MINUTE SECOND LATELY ALMOST ENOUGH BETTER CHANCE REASON WONDER METHOD SELECT DELETE RETURN BACKUP WHITES BLACKS CENTER SQUARE CIRCLE BORDER SPACES TABLET HEIGHT SCROLL SMOOTH".split(" ")

const rows = 6
const columns = 6
const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]
const today = new Date()
const launchDay = Date.UTC(2026, 8, 15)
const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
const dayIndex = Math.max(0, Math.floor((currentDay - launchDay) / 86400000))
const puzzle = { number: dayIndex + 1, answer: answers[dayIndex % answers.length] }
const answer = puzzle.answer.toUpperCase()
const storageKey = `aquila-wordle-6-${puzzle.number}`
answers.forEach((word) => window.VALID_WORDS.add(word))
const statePriority = { empty: 0, absent: 1, present: 2, correct: 3 }

let game = {
  guesses: [],
  current: "",
  finished: false,
  won: false
}

try {
  const saved = JSON.parse(localStorage.getItem(storageKey))
  if (saved && Array.isArray(saved.guesses)) game = saved
} catch {
  localStorage.removeItem(storageKey)
}

const shell = document.querySelector(".game-shell")
const board = document.querySelector("#board")
const keyboard = document.querySelector("#keyboard")
const toast = document.querySelector("#toast")
const helpDialog = document.querySelector("#help-dialog")
const resultDialog = document.querySelector("#result-dialog")
const viewResult = document.querySelector("#view-result")

if (new URLSearchParams(location.search).get("embed") === "1") {
  shell.classList.add("embed")
  document.documentElement.classList.add("embed-page")
  document.body.classList.add("embed-page")
}

document.querySelector("#puzzle-number").textContent = `#${puzzle.number}`
document.querySelector("#footer-puzzle").textContent = `Puzzle #${puzzle.number}`

function scoreGuess(guess) {
  const result = Array(columns).fill("absent")
  const remaining = answer.split("")

  for (let index = 0; index < columns; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "correct"
      remaining[index] = ""
    }
  }

  for (let index = 0; index < columns; index += 1) {
    if (result[index] === "correct") continue
    const match = remaining.indexOf(guess[index])
    if (match >= 0) {
      result[index] = "present"
      remaining[match] = ""
    }
  }

  return result
}

function saveGame() {
  localStorage.setItem(storageKey, JSON.stringify(game))
}

function showToast(message) {
  toast.textContent = message
  toast.classList.add("show")
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800)
}

function getLetterStates() {
  const states = {}
  game.guesses.forEach((guess) => {
    scoreGuess(guess).forEach((state, index) => {
      const letter = guess[index]
      const existing = states[letter] || "empty"
      if (statePriority[state] > statePriority[existing]) states[letter] = state
    })
  })
  return states
}

function renderBoard() {
  board.innerHTML = ""
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const row = document.createElement("div")
    row.className = "board-row"
    row.dataset.row = rowIndex
    const submitted = game.guesses[rowIndex]
    const active = rowIndex === game.guesses.length && !game.finished
    const letters = submitted || (active ? game.current : "")
    const scores = submitted ? scoreGuess(submitted) : []

    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const tile = document.createElement("div")
      const letter = letters[columnIndex] || ""
      const state = scores[columnIndex] || "empty"
      tile.className = `tile ${state}${letter && !submitted ? " filled" : ""}`
      tile.textContent = letter
      tile.setAttribute("aria-label", submitted ? `${letter}, ${state}` : letter || "empty")
      row.appendChild(tile)
    }
    board.appendChild(row)
  }
}

function renderKeyboard() {
  keyboard.innerHTML = ""
  const letterStates = getLetterStates()
  keyboardRows.forEach((letters, rowIndex) => {
    const row = document.createElement("div")
    row.className = "keyboard-row"
    if (rowIndex === 2) row.appendChild(createKey("ENTER", "key-wide"))
    letters.split("").forEach((letter) => row.appendChild(createKey(letter, letterStates[letter] || "")))
    if (rowIndex === 2) row.appendChild(createKey("⌫", "key-wide", "BACKSPACE", "Delete letter"))
    keyboard.appendChild(row)
  })
}

function createKey(label, className, value = label, ariaLabel = label) {
  const button = document.createElement("button")
  button.className = `key ${className}`
  button.type = "button"
  button.textContent = label
  button.setAttribute("aria-label", ariaLabel)
  button.addEventListener("click", () => handleKey(value))
  return button
}

function submitGuess() {
  if (game.finished) return
  if (game.current.length !== columns) {
    const activeRow = board.querySelector(`[data-row="${game.guesses.length}"]`)
    activeRow.classList.add("shake")
    setTimeout(() => activeRow.classList.remove("shake"), 420)
    showToast("Not enough letters")
    return
  }

  if (!window.VALID_WORDS.has(game.current)) {
    const activeRow = board.querySelector(`[data-row="${game.guesses.length}"]`)
    activeRow.classList.add("shake")
    setTimeout(() => activeRow.classList.remove("shake"), 420)
    showToast("Not in word list")
    return
  }

  game.guesses.push(game.current)
  game.won = game.current === answer
  game.finished = game.won || game.guesses.length === rows
  game.current = ""
  saveGame()
  render()

  const latestRow = board.querySelector(`[data-row="${game.guesses.length - 1}"]`)
  latestRow.querySelectorAll(".tile").forEach((tile, index) => {
    tile.classList.add("reveal")
    tile.style.animationDelay = `${index * 120}ms`
  })

  if (game.finished) setTimeout(openResult, 1450)
}

function handleKey(key) {
  if (game.finished) return
  if (key === "ENTER") return submitGuess()
  if (key === "BACKSPACE") game.current = game.current.slice(0, -1)
  else if (/^[A-Z]$/.test(key) && game.current.length < columns) game.current += key
  saveGame()
  renderBoard()
}

function openResult() {
  document.querySelector("#result-kicker").textContent = `PUZZLE #${puzzle.number}`
  document.querySelector("#result-title").textContent = game.won ? "Nicely reported." : "That was a tough one."
  document.querySelector("#result-description").innerHTML = game.won
    ? `You found it in ${game.guesses.length} ${game.guesses.length === 1 ? "guess" : "guesses"}.`
    : `Today's word was <strong>${answer}</strong>.`
  const miniGrid = document.querySelector("#mini-grid")
  miniGrid.innerHTML = ""
  game.guesses.forEach((guess) => {
    const row = document.createElement("div")
    row.className = "mini-row"
    scoreGuess(guess).forEach((state) => {
      const tile = document.createElement("span")
      tile.className = `mini-tile ${state}`
      row.appendChild(tile)
    })
    miniGrid.appendChild(row)
  })
  resultDialog.showModal()
}

function render() {
  renderBoard()
  renderKeyboard()
  viewResult.hidden = !game.finished
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toUpperCase()
  if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
    event.preventDefault()
    handleKey(key)
  }
})

document.querySelector("#help-button").addEventListener("click", () => helpDialog.showModal())
document.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()))
viewResult.addEventListener("click", openResult)

render()
