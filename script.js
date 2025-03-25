let targetNumber;
let attemptsLeft;
let extraAttemptsUsed = false;

const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const playButton = document.getElementById('play-button');
const grid = document.getElementById('grid');
const attemptsDisplay = document.getElementById('attempts');
const feedback = document.getElementById('feedback');
const extraAttemptsButton = document.getElementById('extra-attempts');
const mainMenuButton = document.getElementById('main-menu-button');
const tryAgainButton = document.getElementById('try-again-button');
const gameOverMessage = document.getElementById('game-over-message');

var rParams = FAPI.Util.getRequestParameters();
FAPI.init(rParams["api_server"], rParams["apiconnection"],
    function (){
    alert("Инициализация прошла успешно");
    },
    function (error) {
    alert("Ошибка инициализации ")
    }
    )

function loadRewardedAd() {
    FAPI.UI.loadAd();
}
// Обработчик кнопки "Играть"
playButton.addEventListener('click', () => {
    let rec = loadRewardedAd()
    console.log("rec = ", rec)
    startGame()
});

// Обработчик кнопки "Попробовать еще"
tryAgainButton.addEventListener('click', startGame);

// Обработчик кнопки "Еще попытки"
extraAttemptsButton.addEventListener('click', addExtraAttempts);

// Обработчик кнопки "Главное меню"
mainMenuButton.addEventListener('click', () => showScreen(mainMenu));

// Функция для начала игры
function startGame() {
    targetNumber = Math.floor(Math.random() * 81) + 1;
    attemptsLeft = 5;
    extraAttemptsUsed = false;
    attemptsDisplay.textContent = attemptsLeft;
    feedback.textContent = '';
    extraAttemptsButton.classList.add('hidden');
    generateGrid();
    showScreen(gameScreen);
}

// Функция для генерации игрового поля
function generateGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= 81; i++) {
        const cell = document.createElement('div');
        cell.textContent = i;
        cell.addEventListener('click', () => handleGuess(i));
        grid.appendChild(cell);
    }
}

// Функция для обработки выбора числа
function handleGuess(number) {
    if (number === targetNumber) {
        feedback.textContent = 'УГАДАЛИ!';
        endGame(true);
    } else {
        feedback.textContent = number < targetNumber ? 'БОЛЬШЕ!' : 'МЕНЬШЕ!';
        attemptsLeft--;
        attemptsDisplay.textContent = attemptsLeft;
        if (attemptsLeft === 0) {
            endGame(false);
        } else if (attemptsLeft === 1 && !extraAttemptsUsed) {
            extraAttemptsButton.classList.remove('hidden');
        }
    }
}

// Функция для добавления дополнительных попыток
function addExtraAttempts() {
    attemptsLeft += 3;
    attemptsDisplay.textContent = attemptsLeft;
    extraAttemptsButton.classList.add('hidden');
    extraAttemptsUsed = true;
}

// Функция для завершения игры
function endGame(won) {
    if (won) {
        gameOverMessage.textContent = 'Поздравляем, вы угадали загаданное число!';
    } else {
        gameOverMessage.textContent = 'Не угадали, в следующий раз повезет!';
    }
    showScreen(gameOverScreen);
}

// Функция для переключения экранов
function showScreen(screen) {
    mainMenu.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

// Показываем главное меню при загрузке
showScreen(mainMenu);
