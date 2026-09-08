if ("scrollRestoration" in history) history.scrollRestoration = "manual"
window.scrollTo(0, 0)
window.addEventListener("pageshow", () => window.scrollTo(0, 0))

const quizzes = {
  knowledge: {
    name: "How Well Do You Know UPA?",
    questions: [
      { text: "Which grade levels does UPA serve?", options: ["Grades 6–12", "Grades 7–12", "Grades 8–12", "Grades 9–12"], answer: 1 },
      { text: "What is UPA's mascot?", options: ["The Golden Eagle", "The Falcon", "The Panther", "The Lion"], answer: 0 },
      { text: "What is UPA's student publication called?", options: ["The Talon", "Aquila", "The Nest", "UPA Today"], answer: 1 },
      { text: "Approximately how many student clubs does UPA currently advertise?", options: ["24", "38", "52", "75"], answer: 2 },
      { text: "How many Advanced Placement courses does UPA advertise?", options: ["10", "12", "14", "18"], answer: 2 },
      { text: "What college-going rate does UPA list for its graduates?", options: ["82%", "90%", "94%", "97%"], answer: 3 },
      { text: "How many athletics championships does UPA list?", options: ["8", "12", "18", "24"], answer: 2 },
      { text: "How many Aquila newsmagazines are produced each school year?", options: ["One", "Two", "Three", "Four"], answer: 2 },
      { text: "Which of these is one of UPA Theatre's three mainstage productions?", options: ["A winter opera", "A murder mystery dinner", "A film festival", "A summer concert"], answer: 1 },
      { text: "What is at the center of UPA's mission?", options: ["Preparing students for college success", "Training professional athletes", "Specializing only in performing arts", "Preparing students only for local universities"], answer: 0 }
    ]
  },
  personality: {
    name: "What Type of UPA Student Are You?",
    questions: [
      { text: "A major assignment is due next week. What do you do first?", options: [
        { text: "Break it into steps and make a schedule", type: "strategist" },
        { text: "Ask friends how they are approaching it", type: "connector" },
        { text: "Think of a way to make it completely original", type: "creator" },
        { text: "Start working quietly and figure it out as I go", type: "achiever" }
      ] },
      { text: "Where are you most likely to be during lunch?", options: [
        { text: "Finishing something so the rest of my day is easier", type: "strategist" },
        { text: "Moving between groups and catching up with people", type: "connector" },
        { text: "Talking about a new idea, project or interest", type: "creator" },
        { text: "Relaxing with a few close friends", type: "achiever" }
      ] },
      { text: "What role do you naturally take in a group project?", options: [
        { text: "The organizer who keeps everyone on schedule", type: "strategist" },
        { text: "The communicator who keeps the group together", type: "connector" },
        { text: "The person who shapes the concept and presentation", type: "creator" },
        { text: "The reliable person who completes their part well", type: "achiever" }
      ] },
      { text: "What would make you join a new club?", options: [
        { text: "It supports one of my long-term goals", type: "strategist" },
        { text: "My friends are joining and it seems welcoming", type: "connector" },
        { text: "It lets me build, perform, write or experiment", type: "creator" },
        { text: "The topic genuinely interests me", type: "achiever" }
      ] },
      { text: "Your schedule suddenly becomes overwhelming. What helps most?", options: [
        { text: "Reorganizing everything by priority", type: "strategist" },
        { text: "Talking it through with someone I trust", type: "connector" },
        { text: "Taking a creative break so I can reset", type: "creator" },
        { text: "Finding a quiet space and handling one task at a time", type: "achiever" }
      ] },
      { text: "Which school activity sounds most appealing?", options: [
        { text: "An academic competition", type: "strategist" },
        { text: "A rally, dance or spirit event", type: "connector" },
        { text: "A performance, publication or design project", type: "creator" },
        { text: "A focused club built around one of my interests", type: "achiever" }
      ] },
      { text: "How would your classmates most likely describe you?", options: [
        { text: "Prepared and driven", type: "strategist" },
        { text: "Friendly and involved", type: "connector" },
        { text: "Imaginative and curious", type: "creator" },
        { text: "Calm and dependable", type: "achiever" }
      ] },
      { text: "You receive an unexpected free period. What happens?", options: [
        { text: "I get ahead on upcoming work", type: "strategist" },
        { text: "I find someone to hang out with", type: "connector" },
        { text: "I work on something personal that interests me", type: "creator" },
        { text: "I recharge before the rest of the day", type: "achiever" }
      ] },
      { text: "Which class task do you usually enjoy most?", options: [
        { text: "Solving a difficult problem with a clear answer", type: "strategist" },
        { text: "Discussing ideas with the class", type: "connector" },
        { text: "Creating something with room for personal choices", type: "creator" },
        { text: "Working independently at my own pace", type: "achiever" }
      ] },
      { text: "At the end of a busy school week, what feels best?", options: [
        { text: "Knowing I stayed on top of everything", type: "strategist" },
        { text: "Remembering the people and moments that made it fun", type: "connector" },
        { text: "Having made or discovered something new", type: "creator" },
        { text: "Knowing I handled everything in my own way", type: "achiever" }
      ] }
    ]
  }
}

const personalityResults = {
  strategist: {
    title: "The Academic Strategist",
    mark: "AS",
    description: "You like knowing what comes next. Goals, plans and steady progress help you feel in control, and people can count on you to keep things moving when school gets busy."
  },
  connector: {
    title: "The Campus Connector",
    mark: "CC",
    description: "People are a major part of your UPA experience. You bring energy to groups, notice what is happening around campus and help classmates feel included."
  },
  creator: {
    title: "The Creative Builder",
    mark: "CB",
    description: "You are drawn to ideas you can shape into something original. Whether it is writing, technology, art, design or performance, you enjoy making your interests visible."
  },
  achiever: {
    title: "The Quiet Achiever",
    mark: "QA",
    description: "You do not need to be the loudest person to make an impact. You are independent, observant and dependable, and your consistency speaks for itself."
  }
}

const chooser = document.querySelector("#chooser")
const quizView = document.querySelector("#quiz-view")
const resultView = document.querySelector("#result-view")
const quizName = document.querySelector("#quiz-name")
const progressBar = document.querySelector("#progress-bar")
const questionCount = document.querySelector("#question-count")
const questionText = document.querySelector("#question-text")
const answersElement = document.querySelector("#answers")
const nextButton = document.querySelector("#next-button")
const disclaimer = document.querySelector("#disclaimer")

let activeQuiz = null
let questionIndex = 0
let responses = []

const parameters = new URLSearchParams(location.search)
if (parameters.get("embed") === "1") document.documentElement.classList.add("embed-page")

function updateUrl(quizKey = "") {
  const url = new URL(location.href)
  if (quizKey) url.searchParams.set("quiz", quizKey)
  else url.searchParams.delete("quiz")
  history.replaceState({}, "", url)
}

function showChooser() {
  activeQuiz = null
  chooser.hidden = false
  quizView.hidden = true
  resultView.hidden = true
  updateUrl()
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function startQuiz(quizKey) {
  activeQuiz = quizKey
  questionIndex = 0
  responses = []
  chooser.hidden = true
  resultView.hidden = true
  quizView.hidden = false
  updateUrl(quizKey)
  renderQuestion()
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function renderQuestion() {
  const quiz = quizzes[activeQuiz]
  const question = quiz.questions[questionIndex]
  quizName.textContent = quiz.name
  questionCount.textContent = `QUESTION ${questionIndex + 1} OF ${quiz.questions.length}`
  questionText.textContent = question.text
  progressBar.style.width = `${((questionIndex + 1) / quiz.questions.length) * 100}%`
  answersElement.innerHTML = ""
  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "answer-button"
    button.innerHTML = `<span class="answer-letter">${String.fromCharCode(65 + optionIndex)}</span><span class="answer-text"></span>`
    button.querySelector(".answer-text").textContent = typeof option === "string" ? option : option.text
    button.addEventListener("click", () => selectAnswer(optionIndex))
    answersElement.appendChild(button)
  })
  nextButton.disabled = true
  nextButton.textContent = questionIndex === quiz.questions.length - 1 ? "See my result" : "Next question"
}

function selectAnswer(optionIndex) {
  responses[questionIndex] = optionIndex
  answersElement.querySelectorAll(".answer-button").forEach((button, index) => button.classList.toggle("selected", index === optionIndex))
  nextButton.disabled = false
}

function showKnowledgeResult() {
  const questions = quizzes.knowledge.questions
  const score = responses.reduce((total, response, index) => total + (response === questions[index].answer ? 1 : 0), 0)
  let title = "New Around Here"
  let description = "You have some exploring to do, but now you know more about UPA than when you started."
  if (score >= 9) {
    title = "UPA Legend"
    description = "You know UPA inside and out. Very little about the school gets past you."
  } else if (score >= 7) {
    title = "UPA Expert"
    description = "You know the campus, its programs and its community better than most students."
  } else if (score >= 4) {
    title = "UPA Regular"
    description = "You know the essentials and a few deeper UPA facts, with a little room left to become an expert."
  }
  displayResult(`${score}/10`, title, description, "YOUR UPA KNOWLEDGE RESULT", false)
}

function showPersonalityResult() {
  const totals = { strategist: 0, connector: 0, creator: 0, achiever: 0 }
  quizzes.personality.questions.forEach((question, index) => {
    totals[question.options[responses[index]].type] += 1
  })
  const resultKey = Object.keys(totals).sort((first, second) => totals[second] - totals[first])[0]
  const result = personalityResults[resultKey]
  displayResult(result.mark, result.title, result.description, "YOUR UPA STUDENT TYPE", true)
}

function displayResult(mark, title, description, eyebrow, showDisclaimer) {
  quizView.hidden = true
  resultView.hidden = false
  document.querySelector("#result-eyebrow").textContent = eyebrow
  document.querySelector("#result-mark").textContent = mark
  document.querySelector("#result-title").textContent = title
  document.querySelector("#result-description").textContent = description
  disclaimer.hidden = !showDisclaimer
  window.scrollTo({ top: 0, behavior: "smooth" })
}

document.querySelectorAll("[data-start]").forEach((button) => button.addEventListener("click", () => startQuiz(button.dataset.start)))
document.querySelector("#back-button").addEventListener("click", showChooser)
document.querySelector("#choose-button").addEventListener("click", showChooser)
document.querySelector("#restart-button").addEventListener("click", () => startQuiz(activeQuiz))
nextButton.addEventListener("click", () => {
  if (responses[questionIndex] === undefined) return
  questionIndex += 1
  if (questionIndex < quizzes[activeQuiz].questions.length) renderQuestion()
  else if (activeQuiz === "knowledge") showKnowledgeResult()
  else showPersonalityResult()
})

const requestedQuiz = parameters.get("quiz")
if (requestedQuiz && quizzes[requestedQuiz]) startQuiz(requestedQuiz)
