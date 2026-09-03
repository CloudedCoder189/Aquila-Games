const size = 9
const boxSize = 3
const difficulties = {
  easy: { label: "Easy", clues: 41, seed: 1301 },
  medium: { label: "Medium", clues: 33, seed: 2707 },
  hard: { label: "Hard", clues: 27, seed: 3911 }
}
const launchDay = Date.UTC(2026, 8, 3)
const today = new Date()
const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
const puzzleNumber = Math.max(1, Math.floor((currentDay - launchDay) / 86400000) + 1)
const query = new URLSearchParams(location.search)
const requestedDifficulty = query.get("difficulty") || localStorage.getItem("aquila-sudoku-difficulty")
let difficulty = difficulties[requestedDifficulty] ? requestedDifficulty : "medium"
let puzzle
let solution
let game
let timerId

const shell = document.querySelector(".game-shell")
const board = document.querySelector("#board")
const numberPad = document.querySelector("#number-pad")
const toast = document.querySelector("#toast")
const helpDialog = document.querySelector("#help-dialog")
const resultDialog = document.querySelector("#result-dialog")
const clearDialog = document.querySelector("#clear-dialog")
const viewResult = document.querySelector("#view-result")
const toolRow = document.querySelector(".tool-row")
const checkButton = document.querySelector("#check-button")
const conflictDisplay = document.querySelector("#conflicts")
const conflictDivider = document.querySelector("#conflict-divider")

if (query.get("embed") === "1") {
  shell.classList.add("embed")
  document.documentElement.classList.add("embed-page")
  document.body.classList.add("embed-page")
}

function hashSeed(text) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRandom(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(items, random) {
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[output[index], output[swapIndex]] = [output[swapIndex], output[index]]
  }
  return output
}

function createSolvedGrid(random) {
  const pattern = (row, column) => (row * boxSize + Math.floor(row / boxSize) + column) % size
  const groups = [0, 1, 2]
  const rows = shuffle(groups, random).flatMap((band) => shuffle(groups, random).map((row) => band * boxSize + row))
  const columns = shuffle(groups, random).flatMap((stack) => shuffle(groups, random).map((column) => stack * boxSize + column))
  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random)
  return rows.flatMap((row) => columns.map((column) => numbers[pattern(row, column)]))
}

function candidatesFor(grid, cell) {
  const row = Math.floor(cell / size)
  const column = cell % size
  const startRow = Math.floor(row / boxSize) * boxSize
  const startColumn = Math.floor(column / boxSize) * boxSize
  const used = new Set()

  for (let index = 0; index < size; index += 1) {
    used.add(grid[row * size + index])
    used.add(grid[index * size + column])
  }
  for (let rowOffset = 0; rowOffset < boxSize; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < boxSize; columnOffset += 1) {
      used.add(grid[(startRow + rowOffset) * size + startColumn + columnOffset])
    }
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((number) => !used.has(number))
}

function countSolutions(grid, limit = 2) {
  let bestCell = -1
  let bestCandidates = null

  for (let cell = 0; cell < grid.length; cell += 1) {
    if (grid[cell] !== 0) continue
    const candidates = candidatesFor(grid, cell)
    if (candidates.length === 0) return 0
    if (!bestCandidates || candidates.length < bestCandidates.length) {
      bestCell = cell
      bestCandidates = candidates
      if (candidates.length === 1) break
    }
  }

  if (bestCell === -1) return 1
  let count = 0
  for (const number of bestCandidates) {
    grid[bestCell] = number
    count += countSolutions(grid, limit - count)
    grid[bestCell] = 0
    if (count >= limit) return count
  }
  return count
}

function createPuzzle(answer, targetClues, random) {
  const grid = [...answer]
  const firstHalf = shuffle(Array.from({ length: 41 }, (_, index) => index), random)

  for (const cell of firstHalf) {
    const mirror = grid.length - 1 - cell
    const cells = cell === mirror ? [cell] : [cell, mirror]
    const remainingClues = grid.filter(Boolean).length - cells.filter((index) => grid[index] !== 0).length
    if (remainingClues < targetClues) continue
    const previous = cells.map((index) => grid[index])
    cells.forEach((index) => { grid[index] = 0 })
    if (countSolutions([...grid]) !== 1) cells.forEach((index, item) => { grid[index] = previous[item] })
    if (grid.filter(Boolean).length <= targetClues) break
  }

  return grid
}

function makeDailyPuzzle(level) {
  const seed = hashSeed(`${dateKey}-${difficulties[level].seed}`)
  const random = createRandom(seed)
  const answer = createSolvedGrid(random)
  return { solution: answer, puzzle: createPuzzle(answer, difficulties[level].clues, random) }
}

function emptyNotes() {
  return Array.from({ length: 81 }, () => [])
}

function storageKey() {
  return `aquila-sudoku-${dateKey}-${difficulty}`
}

function defaultGame() {
  return {
    values: [...puzzle],
    notes: emptyNotes(),
    selected: puzzle.findIndex((value) => value === 0),
    history: [],
    elapsed: 0,
    notesMode: false,
    finished: false
  }
}

function loadGame() {
  const generated = makeDailyPuzzle(difficulty)
  puzzle = generated.puzzle
  solution = generated.solution
  game = defaultGame()

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()))
    if (saved && Array.isArray(saved.values) && saved.values.length === 81 && Array.isArray(saved.notes)) {
      game = { ...game, ...saved, history: Array.isArray(saved.history) ? saved.history : [] }
    }
  } catch {
    localStorage.removeItem(storageKey())
  }
}

function saveGame() {
  localStorage.setItem(storageKey(), JSON.stringify(game))
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
}

function showToast(message) {
  toast.textContent = message
  toast.classList.add("show")
  clearTimeout(showToast.timer)
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800)
}

function sameUnit(first, second) {
  const firstRow = Math.floor(first / size)
  const secondRow = Math.floor(second / size)
  const firstColumn = first % size
  const secondColumn = second % size
  return firstRow === secondRow || firstColumn === secondColumn || (
    Math.floor(firstRow / boxSize) === Math.floor(secondRow / boxSize) &&
    Math.floor(firstColumn / boxSize) === Math.floor(secondColumn / boxSize)
  )
}

function getConflictCells() {
  const conflicts = new Set()
  const groups = []

  for (let row = 0; row < size; row += 1) groups.push(Array.from({ length: size }, (_, column) => row * size + column))
  for (let column = 0; column < size; column += 1) groups.push(Array.from({ length: size }, (_, row) => row * size + column))
  for (let boxRow = 0; boxRow < boxSize; boxRow += 1) {
    for (let boxColumn = 0; boxColumn < boxSize; boxColumn += 1) {
      groups.push(Array.from({ length: size }, (_, index) => {
        const row = boxRow * boxSize + Math.floor(index / boxSize)
        const column = boxColumn * boxSize + index % boxSize
        return row * size + column
      }))
    }
  }

  groups.forEach((cells) => {
    const positions = new Map()
    cells.forEach((cell) => {
      const value = game.values[cell]
      if (!value) return
      if (!positions.has(value)) positions.set(value, [])
      positions.get(value).push(cell)
    })
    positions.forEach((cellsForNumber) => {
      if (cellsForNumber.length > 1) cellsForNumber.forEach((cell) => conflicts.add(cell))
    })
  })

  return conflicts
}

function renderBoard() {
  board.innerHTML = ""
  const selectedValue = game.selected >= 0 ? game.values[game.selected] : 0
  const conflicts = difficulty === "hard" ? new Set() : getConflictCells()

  game.values.forEach((value, cell) => {
    const button = document.createElement("button")
    const classes = ["cell"]
    if (puzzle[cell] !== 0) classes.push("given")
    if (game.selected >= 0 && sameUnit(cell, game.selected)) classes.push("related")
    if (value && selectedValue && value === selectedValue) classes.push("same")
    if (cell === game.selected) classes.push("selected")
    if (value && conflicts.has(cell)) classes.push("incorrect")
    button.className = classes.join(" ")
    button.type = "button"
    button.dataset.cell = cell
    button.setAttribute("role", "gridcell")
    button.setAttribute("aria-selected", cell === game.selected ? "true" : "false")

    if (value) {
      button.textContent = value
      button.setAttribute("aria-label", `${puzzle[cell] ? "Given " : "Entered "}${value}, row ${Math.floor(cell / 9) + 1}, column ${(cell % 9) + 1}`)
    } else if (game.notes[cell]?.length) {
      const notes = document.createElement("span")
      notes.className = "notes"
      for (let number = 1; number <= 9; number += 1) {
        const note = document.createElement("span")
        note.className = "note"
        note.textContent = game.notes[cell].includes(number) ? number : ""
        notes.appendChild(note)
      }
      button.appendChild(notes)
      button.setAttribute("aria-label", `Row ${Math.floor(cell / 9) + 1}, column ${(cell % 9) + 1}, notes ${game.notes[cell].join(", ")}`)
    } else {
      button.setAttribute("aria-label", `Empty, row ${Math.floor(cell / 9) + 1}, column ${(cell % 9) + 1}`)
    }

    button.addEventListener("click", () => selectCell(cell))
    board.appendChild(button)
  })
}

function renderNumberPad() {
  numberPad.innerHTML = ""
  for (let number = 1; number <= 9; number += 1) {
    const button = document.createElement("button")
    const completed = game.values.filter((value) => value === number).length === 9
    button.className = `number-key${completed ? " complete" : ""}`
    button.type = "button"
    button.textContent = number
    button.setAttribute("aria-label", `Enter ${number}`)
    button.addEventListener("click", () => enterNumber(number))
    numberPad.appendChild(button)
  }
}

function render() {
  const hardMode = difficulty === "hard"
  renderBoard()
  renderNumberPad()
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    const active = button.dataset.difficulty === difficulty
    button.classList.toggle("active", active)
    button.setAttribute("aria-pressed", active ? "true" : "false")
  })
  document.querySelector("#difficulty-label").textContent = difficulties[difficulty].label
  document.querySelector("#timer").textContent = formatTime(game.elapsed)
  const conflictCount = hardMode ? 0 : [...getConflictCells()].filter((cell) => puzzle[cell] === 0).length
  conflictDisplay.textContent = conflictCount ? `${conflictCount} ${conflictCount === 1 ? "conflict" : "conflicts"}` : "No conflicts"
  conflictDisplay.hidden = hardMode
  conflictDivider.hidden = hardMode
  checkButton.hidden = hardMode
  toolRow.classList.toggle("hard-mode", hardMode)
  document.querySelector("#notes-button").classList.toggle("active", game.notesMode)
  document.querySelector("#notes-button").setAttribute("aria-pressed", game.notesMode ? "true" : "false")
  document.querySelector("#notes-state").textContent = game.notesMode ? "On" : "Off"
  document.querySelector("#undo-button").disabled = !game.history.length || game.finished
  document.querySelector("#clear-board-button").disabled = !hasPlayerEntries()
  viewResult.hidden = !game.finished
}

function selectCell(cell) {
  game.selected = cell
  saveGame()
  renderBoard()
}

function snapshot() {
  game.history.push({
    values: [...game.values],
    notes: game.notes.map((notes) => [...notes])
  })
  if (game.history.length > 100) game.history.shift()
}

function clearPeerNotes(cell, number) {
  game.notes.forEach((notes, otherCell) => {
    if (sameUnit(cell, otherCell)) game.notes[otherCell] = notes.filter((note) => note !== number)
  })
}

function enterNumber(number) {
  const cell = game.selected
  if (game.finished || cell < 0 || puzzle[cell] !== 0) return
  snapshot()

  if (game.notesMode && game.values[cell] === 0) {
    const notes = game.notes[cell]
    game.notes[cell] = notes.includes(number) ? notes.filter((note) => note !== number) : [...notes, number].sort()
  } else {
    game.values[cell] = number
    game.notes[cell] = []
    clearPeerNotes(cell, number)
    if (difficulty !== "hard" && getConflictCells().has(cell)) showToast(`${number} already appears in this row, column, or box`)
  }

  checkCompletion()
  saveGame()
  render()
}

function eraseSelected() {
  const cell = game.selected
  if (game.finished || cell < 0 || puzzle[cell] !== 0 || (!game.values[cell] && !game.notes[cell].length)) return
  snapshot()
  game.values[cell] = 0
  game.notes[cell] = []
  saveGame()
  render()
}

function undo() {
  if (game.finished || !game.history.length) return
  const previous = game.history.pop()
  game.values = previous.values
  game.notes = previous.notes
  saveGame()
  render()
}

function toggleNotes() {
  if (game.finished) return
  game.notesMode = !game.notesMode
  saveGame()
  render()
}

function checkBoard() {
  if (difficulty === "hard") return
  if (game.finished) return openResult()
  const conflicts = getConflictCells()
  showToast(conflicts.size ? "Resolve the highlighted conflicts" : "No conflicts so far")
  if (conflicts.size) {
    board.classList.remove("check-pulse")
    requestAnimationFrame(() => board.classList.add("check-pulse"))
  }
}

function hasPlayerEntries() {
  return game.values.some((value, cell) => puzzle[cell] === 0 && value !== 0) || game.notes.some((notes) => notes.length)
}

function openClearDialog() {
  if (!hasPlayerEntries()) return
  clearDialog.showModal()
}

function clearAllEntries() {
  snapshot()
  game.values = [...puzzle]
  game.notes = emptyNotes()
  game.selected = puzzle.findIndex((value) => value === 0)
  game.finished = false
  clearDialog.close()
  saveGame()
  startTimer()
  render()
  showToast("All entries cleared")
}

function checkCompletion() {
  if (!game.values.every((value, cell) => value === solution[cell])) return
  game.finished = true
  saveGame()
  clearInterval(timerId)
  setTimeout(openResult, 300)
}

function openResult() {
  document.querySelector("#result-kicker").textContent = `PUZZLE #${puzzleNumber} • ${difficulties[difficulty].label.toUpperCase()}`
  document.querySelector("#result-time").textContent = formatTime(game.elapsed)
  document.querySelector("#result-difficulty").textContent = difficulties[difficulty].label
  resultDialog.showModal()
}

function switchDifficulty(level) {
  if (!difficulties[level] || level === difficulty) return
  difficulty = level
  localStorage.setItem("aquila-sudoku-difficulty", difficulty)
  loadGame()
  startTimer()
  render()
}

function moveSelection(key) {
  if (game.selected < 0) return
  const row = Math.floor(game.selected / size)
  const column = game.selected % size
  if (key === "ARROWUP" && row > 0) game.selected -= size
  if (key === "ARROWDOWN" && row < size - 1) game.selected += size
  if (key === "ARROWLEFT" && column > 0) game.selected -= 1
  if (key === "ARROWRIGHT" && column < size - 1) game.selected += 1
  saveGame()
  renderBoard()
}

function startTimer() {
  clearInterval(timerId)
  if (game.finished) return
  timerId = setInterval(() => {
    game.elapsed += 1
    document.querySelector("#timer").textContent = formatTime(game.elapsed)
    if (game.elapsed % 10 === 0) saveGame()
  }, 1000)
}

document.querySelector("#puzzle-number").textContent = `#${puzzleNumber}`
document.querySelector("#footer-puzzle").textContent = `Puzzle #${puzzleNumber}`
document.querySelectorAll("[data-difficulty]").forEach((button) => button.addEventListener("click", () => switchDifficulty(button.dataset.difficulty)))
document.querySelector("#undo-button").addEventListener("click", undo)
document.querySelector("#erase-button").addEventListener("click", eraseSelected)
document.querySelector("#notes-button").addEventListener("click", toggleNotes)
checkButton.addEventListener("click", checkBoard)
document.querySelector("#clear-board-button").addEventListener("click", openClearDialog)
document.querySelector("#cancel-clear-button").addEventListener("click", () => clearDialog.close())
document.querySelector("#confirm-clear-button").addEventListener("click", clearAllEntries)
function openHelp() {
  helpDialog.showModal()
}

function closeDialog(event) {
  const dialog = event.currentTarget.closest("dialog")
  dialog.close()
}

document.querySelector("#help-button").addEventListener("click", openHelp)
document.querySelector("#embed-help-button").addEventListener("click", openHelp)
helpDialog.addEventListener("close", () => localStorage.setItem("aquila-sudoku-help-seen", "1"))
document.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", closeDialog))
document.querySelector("#done-button").addEventListener("click", () => resultDialog.close())
viewResult.addEventListener("click", openResult)

document.addEventListener("keydown", (event) => {
  const key = event.key.toUpperCase()
  if (/^[1-9]$/.test(key)) {
    event.preventDefault()
    enterNumber(Number(key))
  } else if (key === "BACKSPACE" || key === "DELETE" || key === "0") {
    event.preventDefault()
    eraseSelected()
  } else if (key === "N") {
    event.preventDefault()
    toggleNotes()
  } else if (key.startsWith("ARROW")) {
    event.preventDefault()
    moveSelection(key)
  } else if ((event.ctrlKey || event.metaKey) && key === "Z") {
    event.preventDefault()
    undo()
  }
})

window.addEventListener("beforeunload", saveGame)
loadGame()
render()
startTimer()
if (!localStorage.getItem("aquila-sudoku-help-seen")) setTimeout(openHelp, 250)
