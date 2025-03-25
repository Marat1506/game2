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

// Глобальный callback для FAPI
window.API_callback = function(method, result, data) {
    console.log("API_callback:", method, result, data);
};

// Проверяем, загружен ли FAPI, прежде чем инициализировать
if (typeof FAPI !== 'undefined' && FAPI.Util) {
    var rParams = FAPI.Util.getRequestParameters();
    FAPI.init(rParams["api_server"], rParams["apiconnection"],
        function() {
            console.log("FAPI успешно инициализирован");
        },
        function(error) {
            console.error("Ошибка инициализации FAPI:", error);
        }
    );
} else {
    console.warn("FAPI не загружен");
}

// Функция для показа обычной рекламы
function showRegularAd() {
    return new Promise((resolve, reject) => {
        if (typeof FAPI === 'undefined' || !FAPI.UI) {
            console.warn("FAPI.UI не доступен");
            resolve();
            return;
        }

        FAPI.UI.showAd({
            adType: 'interstitial', // Обычная реклама (не rewarded)
            callbacks: {
                onAdLoaded: () => console.log("Реклама загружена"),
                onAdShown: () => console.log("Реклама показана"),
                onAdClosed: () => {
                    console.log("Реклама закрыта");
                    resolve();
                },
                onAdError: (error) => {
                    console.error("Ошибка рекламы:", error);
                    reject(error);
                }
            }
        });
    });
}

// Обработчик кнопки "Играть" с показом рекламы
playButton.addEventListener('click', async () => {
    try {
        await showRegularAd();
    } catch (error) {
        console.error("Ошибка при показе рекламы, начинаем игру", error);
    }
    startGame();
});

// Остальные обработчики событий
tryAgainButton.addEventListener('click', startGame);
extraAttemptsButton.addEventListener('click', addExtraAttempts);
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

// Функция генерации сетки
function generateGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= 81; i++) {
        const cell = document.createElement('div');
        cell.textContent = i;
        cell.addEventListener('click', () => handleGuess(i));
        grid.appendChild(cell);
    }
}

// Обработка попыток угадать число
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

// Добавление дополнительных попыток
function addExtraAttempts() {
    attemptsLeft += 3;
    attemptsDisplay.textContent = attemptsLeft;
    extraAttemptsButton.classList.add('hidden');
    extraAttemptsUsed = true;
}

// Завершение игры
function endGame(won) {
    gameOverMessage.textContent = won
        ? 'Поздравляем, вы угадали загаданное число!'
        : 'Не угадали, в следующий раз повезет!';
    showScreen(gameOverScreen);
}

// Переключение экранов
function showScreen(screen) {
    mainMenu.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

// Показываем главное меню при загрузке
showScreen(mainMenu);