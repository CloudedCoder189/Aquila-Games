const answers = "PRESS STORY WRITE MEDIA QUOTE DEBUG SOUND AGILE STEEL FORCE BLUNT CIVIC EXCEL TREND BLADE BLAME AUDIO POUND COULD CABIN ADMIT TODAY VISIT WHICH BASIC WOULD AWAIT DRAFT ELECT CHALK CREAM ERROR BUILD SIGHT QUIET ENJOY SHIRT ORDER SHARP KNOWN WASTE RANGE CATER LUCKY ANGRY SPORT CLICK PRIZE FEAST ESSAY HONEY WRONG FLASH CLONE PHONE EATEN EMBED CHILD LARGE CRUSH ROUND ABOUT EMAIL OCEAN BRIEF FAULT CARRY MOTOR ROYAL DANCE BOOST BRINK CHEER LOCAL CREEK PRIDE GIANT AMONG CLIMB BLAST ARMOR CURVE CRAZE IMAGE TOWER FULLY ELITE AMEND CHAOS BADGE CLASS TOUGH TOPIC NOISE TRUTH FOCUS CHIME MATCH NIGHT BOOTH NEVER ALIKE CHASE MUSIC CLOCK ANKLE YOUTH POWER ROUGH STILL ELBOW FROST ISSUE CLEAR BRICK OTHER CATCH SENSE CLAIM EVENT BRAVE INPUT ENACT PLAIN EAGLE FINAL GUARD DIARY DROWN NURSE CROSS CANAL FRONT BLANK ASIDE METAL GLASS FETCH STAGE DWELL ARISE STAFF DELAY BURST FIELD CRAVE DOZEN BLAND MOUSE HUMAN DRIVE BLOWN SPEND BROOK CEASE WORRY PAPER BUYER BEACH FIERY ROUTE ARROW BELOW HAPPY ALTER ALLOW SPEAK THEME CRATE SCENE AMBER CHIEF BEARD SHOWN BEGAN PHOTO TREAT DITCH TOTAL BERRY BASIN COMIC PROUD ANGLE GRACE DAILY FAITH BEAST MODEL ATONE SHOCK NORTH FLOOR ANNOY GUIDE WHERE SHORT CHEEK BRIDE CRAFT THERE RAISE ARRAY BATHE TABLE DRIED BOAST TRIAL PLACE DUSTY FLAME APPLY IDEAL BRAKE AGENT AMAZE SHARE HEAVY DRIFT FLOAT AFTER PLANT CACHE DEPTH SHIFT BLINK READY COACH AUDIT FLESH SUGAR GRAND POINT BLEND RIGHT THANK TRADE FRUIT PIECE FAVOR CHART EQUAL YOUNG COURT FAINT PROVE STORE HOUSE FLEET MAJOR GIVEN DELTA STEAM CHECK WATCH BLOOD ALIVE WHOLE DAISY APART EVERY QUICK DRAWN CANOE CRISP BATCH AHEAD CRAZY SPACE CHOIR SCALE MONTH HEART TRAIN WATER BAKER DEALT CRAWL DECOR BRAND ADAPT CYCLE ALBUM GROUP CHAIR DOUGH EARLY DOUBT MIGHT RIVER ALONG BRACE CARGO DROVE DOING AMPLE BROKE GUESS MOUNT VIDEO".split(" ")

const rows = 6
const columns = 5
const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]
const today = new Date()
const launchDay = Date.UTC(2026, 8, 2)
const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
const dayIndex = Math.max(0, Math.floor((currentDay - launchDay) / 86400000))
const puzzle = { number: dayIndex + 1, answer: answers[dayIndex % answers.length] }
const answer = puzzle.answer.toUpperCase()
const storageKey = `aquila-wordle-${puzzle.number}`
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

async function shareResults() {
  const grid = game.guesses.map((guess) => scoreGuess(guess).map((state) => {
    if (state === "correct") return "🟩"
    if (state === "present") return "🟨"
    return "⬛"
  }).join("")).join("\n")
  const result = `Aquila Wordle #${puzzle.number} ${game.won ? game.guesses.length : "X"}/${rows}\n\n${grid}`

  try {
    if (navigator.share) await navigator.share({ text: result })
    else {
      await navigator.clipboard.writeText(result)
      showToast("Results copied")
    }
  } catch (error) {
    if (error.name !== "AbortError") showToast("Could not share results")
  }
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
document.querySelector("#share-button").addEventListener("click", shareResults)
viewResult.addEventListener("click", openResult)

render()
