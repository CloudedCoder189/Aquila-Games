const themes = [
  { name: "UPA Campus", words: ["AQUILA", "CAMPUS", "EAGLES", "STUDENT", "SCHOOL", "CLASS", "TEACHER", "LIBRARY", "ACADEMY", "SPIRIT", "FRIENDS", "LEARNING", "CLUBS", "LUNCH"] },
  { name: "Journalism", words: ["ARTICLE", "BYLINE", "EDITOR", "REPORTER", "HEADLINE", "CAPTION", "SOURCE", "QUOTE", "PRESS", "DRAFT", "FEATURE", "OPINION", "PHOTO", "NEWS"] },
  { name: "Technology", words: ["PYTHON", "ROBOT", "CODING", "DATA", "CLOUD", "DEBUG", "CIRCUIT", "SCREEN", "SERVER", "PIXEL", "BINARY", "PROGRAM", "MACHINE", "LOGIC"] },
  { name: "Outer Space", words: ["PLANET", "GALAXY", "COMET", "ORBIT", "ROCKET", "SATURN", "METEOR", "STAR", "MOON", "SOLAR", "COSMIC", "NEBULA", "ASTEROID", "VENUS"] },
  { name: "Ocean Life", words: ["CORAL", "WHALE", "SHARK", "TIDE", "WAVES", "REEF", "DOLPHIN", "TURTLE", "SEASHELL", "CURRENT", "OCTOPUS", "MARINE", "BEACH", "KELP"] },
  { name: "Sports", words: ["SOCCER", "TENNIS", "HOCKEY", "RACING", "GOLF", "TRACK", "COACH", "TEAM", "SCORE", "GOAL", "COURT", "PLAYER", "SPRINT", "MEDAL"] },
  { name: "Science", words: ["ATOM", "ENERGY", "FORCE", "CELL", "MATTER", "GRAVITY", "CHEMISTRY", "PHYSICS", "LAB", "THEORY", "PLANET", "MOTION", "MAGNET", "LIGHT"] },
  { name: "Nature", words: ["FOREST", "RIVER", "FLOWER", "MOUNTAIN", "MEADOW", "CLOUD", "SUNSET", "VALLEY", "GARDEN", "LEAF", "TRAIL", "RAIN", "OCEAN", "WILLOW"] },
  { name: "Music", words: ["RHYTHM", "MELODY", "CHORUS", "GUITAR", "PIANO", "LYRIC", "DRUM", "CONCERT", "SINGER", "ALBUM", "BEAT", "SONG", "NOTE", "TEMPO"] },
  { name: "Food", words: ["PASTA", "PIZZA", "APPLE", "BERRY", "BREAD", "COOKIE", "SALAD", "CHEESE", "TACO", "MANGO", "WAFFLE", "NOODLE", "SPICE", "LEMON"] },
  { name: "Travel", words: ["JOURNEY", "TICKET", "HOTEL", "FLIGHT", "TRAIN", "MAP", "TRIP", "BEACH", "CITY", "PASSPORT", "CAMERA", "TRAIL", "TOUR", "EXPLORE"] },
  { name: "Movies", words: ["CINEMA", "ACTOR", "SCENE", "SCRIPT", "CAMERA", "DIRECTOR", "SCREEN", "COMEDY", "DRAMA", "TICKET", "CREDITS", "STUDIO", "COSTUME", "TRAILER"] }
]

const difficulties = {
  easy: { size: 10, count: 8, directions: [[0, 1], [1, 0]] },
  medium: { size: 12, count: 10, directions: [[0, 1], [1, 0], [1, 1], [-1, 1]] },
  hard: { size: 14, count: 12, directions: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]] }
}

const alphabet = "EEEEEEEEEEEAAAAAAAARRRRRRRIIIIIIIOOOOOOONNNNNNNTTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ"
const shell = document.querySelector(".game-shell")
const board = document.querySelector("#board")
const wordList = document.querySelector("#word-list")
const themeLabel = document.querySelector("#theme-label")
const wordListTitle = document.querySelector("#word-list-title")
const difficultyLabel = document.querySelector("#difficulty-label")
const foundCount = document.querySelector("#found-count")
const panelProgress = document.querySelector("#panel-progress")
const timer = document.querySelector("#timer")
const toast = document.querySelector("#toast")
const helpDialog = document.querySelector("#help-dialog")
const resultDialog = document.querySelector("#result-dialog")

let difficulty = "medium"
let puzzle = null
let foundWords = new Map()
let startedAt = Date.now()
let finishedAt = null
let pointerStart = null
let pointerActive = false
let previewCells = []
let keyboardStart = null
let lastThemeIndex = -1

if (new URLSearchParams(location.search).get("embed") === "1") {
  shell.classList.add("embed")
  document.documentElement.classList.add("embed-page")
  document.body.classList.add("embed-page")
}

function shuffle(values) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function chooseTheme() {
  let index = Math.floor(Math.random() * themes.length)
  if (themes.length > 1 && index === lastThemeIndex) index = (index + 1 + Math.floor(Math.random() * (themes.length - 1))) % themes.length
  lastThemeIndex = index
  return themes[index]
}

function tryPlaceWord(grid, word, directions) {
  const size = grid.length
  const choices = []
  directions.forEach(([rowStep, columnStep]) => {
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        const endRow = row + rowStep * (word.length - 1)
        const endColumn = column + columnStep * (word.length - 1)
        if (endRow < 0 || endRow >= size || endColumn < 0 || endColumn >= size) continue
        const cells = []
        let overlap = 0
        let fits = true
        for (let offset = 0; offset < word.length; offset += 1) {
          const cellRow = row + rowStep * offset
          const cellColumn = column + columnStep * offset
          const existing = grid[cellRow][cellColumn]
          if (existing && existing !== word[offset]) {
            fits = false
            break
          }
          if (existing === word[offset]) overlap += 1
          cells.push(cellRow * size + cellColumn)
        }
        if (fits) choices.push({ row, column, rowStep, columnStep, cells, overlap })
      }
    }
  })
  if (!choices.length) return null
  choices.sort((first, second) => second.overlap - first.overlap)
  const bestOverlap = choices[0].overlap
  const preferred = choices.filter((choice) => choice.overlap >= Math.max(0, bestOverlap - 1))
  const placement = preferred[Math.floor(Math.random() * preferred.length)]
  placement.cells.forEach((cellIndex, letterIndex) => {
    const row = Math.floor(cellIndex / size)
    const column = cellIndex % size
    grid[row][column] = word[letterIndex]
  })
  return placement
}

function buildPuzzle() {
  const config = difficulties[difficulty]
  const theme = chooseTheme()
  const candidates = shuffle(theme.words.filter((word) => word.length <= config.size)).slice(0, config.count).sort((first, second) => second.length - first.length)

  for (let boardAttempt = 0; boardAttempt < 80; boardAttempt += 1) {
    const grid = Array.from({ length: config.size }, () => Array(config.size).fill(""))
    const placements = []
    let complete = true
    for (const word of candidates) {
      const placement = tryPlaceWord(grid, word, shuffle(config.directions))
      if (!placement) {
        complete = false
        break
      }
      placements.push({ word, cells: placement.cells })
    }
    if (!complete) continue
    for (let row = 0; row < config.size; row += 1) {
      for (let column = 0; column < config.size; column += 1) {
        if (!grid[row][column]) grid[row][column] = alphabet[Math.floor(Math.random() * alphabet.length)]
      }
    }
    return { theme, size: config.size, words: candidates, placements, letters: grid.flat() }
  }
  throw new Error("Unable to create puzzle")
}

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0")
  const seconds = (totalSeconds % 60).toString().padStart(2, "0")
  return `${minutes}:${seconds}`
}

function showToast(message) {
  toast.textContent = message
  toast.classList.add("show")
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1700)
}

function getLine(startIndex, endIndex) {
  const size = puzzle.size
  const startRow = Math.floor(startIndex / size)
  const startColumn = startIndex % size
  const endRow = Math.floor(endIndex / size)
  const endColumn = endIndex % size
  const rowDifference = endRow - startRow
  const columnDifference = endColumn - startColumn
  if (rowDifference !== 0 && columnDifference !== 0 && Math.abs(rowDifference) !== Math.abs(columnDifference)) return []
  const length = Math.max(Math.abs(rowDifference), Math.abs(columnDifference)) + 1
  const rowStep = Math.sign(rowDifference)
  const columnStep = Math.sign(columnDifference)
  return Array.from({ length }, (_, offset) => (startRow + rowStep * offset) * size + startColumn + columnStep * offset)
}

function clearPreview() {
  previewCells.forEach((cellIndex) => board.children[cellIndex]?.classList.remove("preview"))
  previewCells = []
}

function showPreview(cells) {
  clearPreview()
  previewCells = cells
  previewCells.forEach((cellIndex) => board.children[cellIndex]?.classList.add("preview"))
}

function updateProgress() {
  const total = puzzle.words.length
  const found = foundWords.size
  foundCount.textContent = `${found} of ${total} found`
  panelProgress.textContent = `${found}/${total}`
  wordList.querySelectorAll(".word-item").forEach((item) => item.classList.toggle("found", foundWords.has(item.dataset.word)))
}

function finishSelection(cells) {
  clearPreview()
  if (cells.length < 2) return
  const letters = cells.map((cellIndex) => puzzle.letters[cellIndex]).join("")
  const reversed = [...letters].reverse().join("")
  const word = puzzle.words.find((candidate) => candidate === letters || candidate === reversed)
  if (!word) {
    showToast("Keep looking")
    return
  }
  if (foundWords.has(word)) {
    showToast("Already found")
    return
  }
  foundWords.set(word, cells)
  cells.forEach((cellIndex) => board.children[cellIndex].classList.add("found"))
  updateProgress()
  showToast(`${word} found`)
  if (foundWords.size === puzzle.words.length) {
    finishedAt = Date.now()
    setTimeout(openResult, 450)
  }
}

function renderPuzzle() {
  board.innerHTML = ""
  board.style.setProperty("--size", puzzle.size)
  board.dataset.difficulty = difficulty
  puzzle.letters.forEach((letter, index) => {
    const cell = document.createElement("button")
    const row = Math.floor(index / puzzle.size) + 1
    const column = index % puzzle.size + 1
    cell.className = "letter-cell"
    cell.type = "button"
    cell.dataset.index = index
    cell.textContent = letter
    cell.setAttribute("role", "gridcell")
    cell.setAttribute("aria-label", `Row ${row}, column ${column}, ${letter}`)
    board.appendChild(cell)
  })

  wordList.innerHTML = ""
  puzzle.words.slice().sort().forEach((word) => {
    const item = document.createElement("span")
    item.className = "word-item"
    item.dataset.word = word
    item.textContent = word
    wordList.appendChild(item)
  })
  themeLabel.textContent = puzzle.theme.name.toUpperCase()
  wordListTitle.textContent = puzzle.theme.name
  difficultyLabel.textContent = difficulty[0].toUpperCase() + difficulty.slice(1)
  document.querySelectorAll("[data-difficulty]").forEach((button) => button.classList.toggle("active", button.dataset.difficulty === difficulty))
  updateProgress()
}

function newPuzzle(nextDifficulty = difficulty) {
  difficulty = nextDifficulty
  foundWords = new Map()
  startedAt = Date.now()
  finishedAt = null
  pointerStart = null
  pointerActive = false
  keyboardStart = null
  clearPreview()
  puzzle = buildPuzzle()
  renderPuzzle()
  timer.textContent = "00:00"
}

function openResult() {
  document.querySelector("#result-kicker").textContent = puzzle.theme.name.toUpperCase()
  document.querySelector("#result-time").textContent = formatTime(finishedAt - startedAt)
  document.querySelector("#result-difficulty").textContent = difficulty[0].toUpperCase() + difficulty.slice(1)
  resultDialog.showModal()
}

function cellFromPoint(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY)
  const cell = element?.closest(".letter-cell")
  return cell && board.contains(cell) ? Number(cell.dataset.index) : null
}

board.addEventListener("pointerdown", (event) => {
  const cell = event.target.closest(".letter-cell")
  if (!cell || finishedAt) return
  event.preventDefault()
  pointerActive = true
  pointerStart = Number(cell.dataset.index)
  showPreview([pointerStart])
})

document.addEventListener("pointermove", (event) => {
  if (!pointerActive || pointerStart === null) return
  const endIndex = cellFromPoint(event.clientX, event.clientY)
  if (endIndex !== null) showPreview(getLine(pointerStart, endIndex))
})

document.addEventListener("pointerup", (event) => {
  if (!pointerActive || pointerStart === null) return
  const endIndex = cellFromPoint(event.clientX, event.clientY)
  const cells = endIndex === null ? previewCells : getLine(pointerStart, endIndex)
  pointerActive = false
  pointerStart = null
  finishSelection(cells)
})

board.addEventListener("click", (event) => {
  if (event.detail !== 0 || finishedAt) return
  const cell = event.target.closest(".letter-cell")
  if (!cell) return
  const index = Number(cell.dataset.index)
  if (keyboardStart === null) {
    keyboardStart = index
    showPreview([index])
    showToast("Choose the last letter")
  } else {
    const cells = getLine(keyboardStart, index)
    keyboardStart = null
    finishSelection(cells)
  }
})

document.querySelectorAll("[data-difficulty]").forEach((button) => button.addEventListener("click", () => newPuzzle(button.dataset.difficulty)))
document.querySelector("#new-puzzle-button").addEventListener("click", () => newPuzzle())
document.querySelector("#play-again-button").addEventListener("click", () => {
  resultDialog.close()
  newPuzzle()
})
document.querySelector("#help-button").addEventListener("click", () => helpDialog.showModal())
document.querySelector("#embed-help-button").addEventListener("click", () => helpDialog.showModal())
document.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()))

setInterval(() => {
  timer.textContent = formatTime((finishedAt || Date.now()) - startedAt)
}, 1000)

newPuzzle()
