'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const BALL = 'BALL'
const GAMER = 'GAMER'
const GLUE = 'GLUE'

const GAMER_IMG = '<img src="img/gamer.png">'
const GAMER_IMG_GLUED = '<img src="img/gamer-purple.png">'
const BALL_IMG = '<img src="img/ball.png">'
const GLUE_IMG = '<img src="img/glue.png">'

var gStartTime = null
var gIntervalBall = 0
var gIntervalGlue = 0
var ballsCollected = 0
var ballsCreated = 2
var gGlued = true
// Model:
var gBoard
var gGamerPos
var gBallsSpeed = 2000 // 2sec defult
var gGlueSpeed = 2000 // 2sec defult

function onInitGame() {
	gGamerPos = { i: 2, j: 9 }
	gBoard = buildBoard()
	renderBoard(gBoard)
}

function startGame() {
	gGlued = false
	gStartTime = Date.now()
	gIntervalBall = setInterval(addBalls, gBallsSpeed)
	gIntervalGlue = setInterval(addGlue, gGlueSpeed)
	swapBtns()
	displayModal(false)
}

function victory() {
	var elCollectedBalls = document.querySelector('.balls-collected span')
	var finishTime = (Date.now() - gStartTime) / 1000;
	var elWinMsg = document.querySelector('.win-msg')
	elWinMsg.innerText = `you have finish the game in: ${finishTime}s Collected: ${elCollectedBalls.innerText} balls!`
	displayModal(true)
	resetGame()
}

function resetGame() {
	gGlued = true
	clearInterval(gIntervalBall)
	clearInterval(gIntervalGlue)
	ballsCreated = 2
	ballsCollected = 0
	updateBallsCollected()
	onInitGame()
	swapBtns()
	toggleDisplay(false)
}

function buildBoard() {
	// Create the Matrix 10 * 12 
	const board = createMat(10, 12)
	// Put FLOOR everywhere and WALL at edges
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[0].length; j++) {
			board[i][j] = { type: FLOOR, gameElement: null }
			if (i === 0 || i === board.length - 1 ||
				j === 0 || j === board[0].length - 1) {
				if (skipSidesWall(i, j)) continue
				board[i][j].type = WALL
			}
		}
	}

	// Place the gamer and two balls
	board[gGamerPos.i][gGamerPos.j].gameElement = GAMER

	board[0][5].type.remove
	board[3][6].gameElement = BALL
	board[7][2].gameElement = BALL

	return board
}
// Render the board to an HTML table
function renderBoard(board) {

	var strHTML = ''
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>\n'
		for (var j = 0; j < board[0].length; j++) {
			const currCell = board[i][j]

			var cellClass = getClassName({ i: i, j: j }) // 'cell-3-4'

			if (currCell.type === FLOOR) cellClass += ' floor'
			else if (currCell.type === WALL) cellClass += ' wall'

			strHTML += `\t<td class="cell ${cellClass}" 
							  onclick="moveTo(${i},${j})">`

			if (currCell.gameElement === GAMER) {
				strHTML += GAMER_IMG
			} else if (currCell.gameElement === BALL) {
				strHTML += BALL_IMG
			}

			strHTML += '</td>\n'
		}
		strHTML += '</tr>\n'
	}
	const elBoard = document.querySelector('.board')
	elBoard.innerHTML = strHTML
}
// Move the player to a specific location
function moveTo(i, j) {

	if (gGlued) return // cant play if glued!
	if (isTunnels(i, j)) return // handel the tunnels

	const targetCell = gBoard[i][j]
	if (targetCell.gameElement === GLUE) { // if stepping on glue
		gGlued = true
		setTimeout(function () {
			gGlued = false
			renderCell(gGamerPos, GAMER_IMG)
		}, 3000)
	}
	if (targetCell.type === WALL) return

	// Calculate distance to make sure we are moving to a neighbor cell
	const iAbsDiff = Math.abs(i - gGamerPos.i) // 0 / 1
	const jAbsDiff = Math.abs(j - gGamerPos.j) // 1 / 0

	// If the clicked Cell is one of the four allowed
	if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0) ||
		(iAbsDiff === gBoard.length - 1) ||
		(jAbsDiff === gBoard[0].length - 1)) {
		if (targetCell.gameElement === BALL) { // display +1 on Collected Balls
			ballsCollected++
			var ballSound = new Audio('mp3/ball.mp3')
			ballSound.play()
			updateBallsCollected()
		}

		// Move the gamer
		// Moving from current position
		// Model:
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = null // {i:2,j:9}
		// Dom:
		renderCell(gGamerPos, '')

		// Moving to selected position
		// Model:
		gGamerPos.i = i
		gGamerPos.j = j
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER

		// Dom:
		var gamerImg = GAMER_IMG
		if (gGlued) gamerImg = GAMER_IMG_GLUED
		renderCell(gGamerPos, gamerImg)
		updateBallsAround()
		if (ballsCollected === ballsCreated) victory()

	} else console.log('TOO FAR', iAbsDiff, jAbsDiff)

}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
	const cellSelector = '.' + getClassName(location)// '.cell-2-7'
	const elCell = document.querySelector(cellSelector)
	elCell.innerHTML = value
}

// Move the player by keyboard arrows
function onHandleKey(event) {
	// console.log('event', event)
	// console.log('event.key', event.key)
	const i = gGamerPos.i
	const j = gGamerPos.j

	switch (event.key) {
		case 'ArrowLeft':
			moveTo(i, j - 1)
			break
		case 'ArrowRight':
			moveTo(i, j + 1)
			break
		case 'ArrowUp':
			moveTo(i - 1, j)
			break
		case 'ArrowDown':
			moveTo(i + 1, j)
			break
	}
}

// Returns the class name for a specific cell
function getClassName(position) { // {i:2 , j:5}
	const cellClass = `cell-${position.i}-${position.j}` // 'cell-2-5'
	return cellClass
}

function skipSidesWall(i, j) {
	if (i === 0 && j === 5) return true
	if (i === 5 && j === 0) return true
	if (i === 5 && j === 11) return true
	if (i === 9 && j === 5) return true
}

function isTunnels(i, j) { // if want to pass in tunnle check
	if (i === -1 && j === 5) {
		moveInTunnle(i, 1)
		return true
	} else if (i === 10 && j === 5) {
		moveInTunnle(i, 1)
		return true
	}
	if (i === 5 && j === -1) {
		moveInTunnle(1, j)
		return true
	}
	if (i === 5 && j === 12) {
		moveInTunnle(1, j)
		return true
	}
	return false
}

function moveInTunnle(i, j) {
	if (i === -1 || i === 10) { // if up or down
		if (i === -1) i = 9
		else i = 0
		var j = 5
	} else {
		if (j === -1) j = 11 // if left or right
		else j = 0
		i = 5
	}
	const targetCell = gBoard[i][j]
	if (targetCell.gameElement === BALL) {
		ballsCollected++
		var ballSound = new Audio('mp3/ball.mp3')
		ballSound.play()
		updateBallsCollected()
	}
	gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
	// Dom:
	renderCell(gGamerPos, '')
	gGamerPos.i = i
	gGamerPos.j = j
	gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER

	// Dom:
	renderCell(gGamerPos, GAMER_IMG)
	updateBallsAround()
}

function addBalls() {
	var shuffledBalls = getOpenPos()
	var newBallIdx = shuffledBalls.pop()

	gBoard[newBallIdx.i][newBallIdx.j].gameElement = BALL
	renderCell(newBallIdx, BALL_IMG)
	ballsCreated++
	updateBallsAround()
}

function addGlue() {
	var shuffledBalls = getOpenPos()
	var newGlueIdx = shuffledBalls.pop()

	gBoard[newGlueIdx.i][newGlueIdx.j].gameElement = GLUE
	renderCell(newGlueIdx, GLUE_IMG)
	setTimeout(function () {
		if (gBoard[newGlueIdx.i][newGlueIdx.j].gameElement === GLUE) {
			gBoard[newGlueIdx.i][newGlueIdx.j].gameElement = null
			renderCell(newGlueIdx, '')
		}
	}, 3000)
}

function removeGlue(glueIdx) {
	gBoard[glueIdx.i][glueIdx.j].gameElement = null
}

function getOpenPos() {
	var ballsOpenPos = []
	for (var i = 0; i < gBoard.length; i++) {
		for (var j = 0; j < gBoard[0].length; j++) {  // !gBoard[i][j].gameElement
			if (gBoard[i][j].gameElement !== BALL && gBoard[i][j].gameElement !== GAMER && gBoard[i][j].type !== WALL) {
				if (gBoard[i][j].gameElement !== GLUE) {
					ballsOpenPos.push({ i: i, j: j })
				}
			}
		}
	}
	ballsOpenPos.sort(() => Math.random() - 0.5);  // shuffle
	return ballsOpenPos
}

function updateBallsCollected() {
	var elCollectedBalls = document.querySelector('.balls-collected span')
	elCollectedBalls.innerText = ballsCollected
}

function swapBtns() {
	var elResetBtn = document.querySelector('.reset-game')
	var elStartBtn = document.querySelector('.start-game')
	if (elStartBtn.classList.contains('hidden')) {
		elResetBtn.classList.add('hidden')
		elStartBtn.classList.remove('hidden')
	} else {
		elResetBtn.classList.remove('hidden')
		elStartBtn.classList.add('hidden')
	}
}

function updateBallsAround() {
	var ballsIdx = []
	for (var i = 0; i < gBoard.length; i++) {
		for (var j = 0; j < gBoard[0].length; j++) {
			if (gBoard[i][j].gameElement === 'BALL') {
				ballsIdx.push({ i: i, j: j })
			}
		}
	}
	var ballsAmount = hasBallsAround(ballsIdx)
	var elBallsAround = document.querySelector('.balls-around span')
	elBallsAround.innerText = ballsAmount
}

function hasBallsAround(ballsIdx) {
	var ballsAmount = 0
	for (var k = 0; k < ballsIdx.length; k++) {
		if (ballsIdx[k].i >= gGamerPos.i - 1 && ballsIdx[k].i <= gGamerPos.i + 1) {
			if (ballsIdx[k].j >= gGamerPos.j - 1 && ballsIdx[k].j <= gGamerPos.j + 1) ballsAmount++
		}
	}
	return ballsAmount
}

function displayModal(isDisplay) {
	var elModal = document.querySelector('.modal')
	if (isDisplay) elModal.classList.remove('hidden')
	else elModal.classList.add('hidden')
}

function chooseLvl(elLvl) {
	switch (elLvl.innerText) {
		case 'Easy':
			gBallsSpeed = 2000
			gGlueSpeed = 2000
			toggleDisplay(true)
			break
		case 'Hard':
			gBallsSpeed = 1000
			gGlueSpeed = 800
			toggleDisplay(true)
			break
		case 'Insane':
			gBallsSpeed = 700
			gGlueSpeed = 1000
			toggleDisplay(true)
			break
		default:
			break
	}
}

function toggleDisplay(displayStart) {
	var elStartBtn = document.querySelector('.start-game')
	var elChooseLvl = document.querySelector('.choose-level')
	if (displayStart) {
		elChooseLvl.classList.add('hidden')
		elStartBtn.classList.remove('hidden')
	} else {
		elStartBtn.classList.add('hidden')
		elChooseLvl.classList.remove('hidden')
	}

}
