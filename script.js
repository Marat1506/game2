let targetNumber;
let attemptsLeft;
let extraAttemptsUsed = false;
let adShown = false; // Флаг, предотвращающий повторные показы рекламы

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
window.API_callback = function (method, result, data) {
    console.log("API_callback:", method, result, data);
};

// Проверяем, загружен ли FAPI
if (typeof FAPI !== 'undefined' && FAPI.Util) {
    var rParams = FAPI.Util.getRequestParameters();
    FAPI.init(rParams["api_server"], rParams["apiconnection"],
        function () {
            console.log("FAPI успешно инициализирован");
        },
        function (error) {
            console.error("Ошибка инициализации FAPI:", error);
        }
    );
} else {
    console.warn("FAPI не загружен");
}

// Функция для показа рекламы
function showRegularAd() {
    return new Promise((resolve) => {
        if (typeof FAPI === 'undefined' || !FAPI.UI || adShown) {
            console.warn("FAPI.UI не доступен или реклама уже была показана");
            resolve(); // Если реклама недоступна, сразу запускаем игру
            return;
        }

        adShown = true; // Устанавливаем флаг, чтобы реклама не показывалась повторно

        FAPI.UI.showAd({
            adType: 'interstitial',
            callbacks: {
                onAdLoaded: () => console.log("Реклама загружена"),
                onAdShown: () => console.log("Реклама показана"),
                onAdClosed: () => {
                    console.log("Реклама закрыта");
                    resolve(); // Запускаем игру после закрытия рекламы
                },
                onAdError: (error) => {
                    console.error("Ошибка рекламы:", error);
                    resolve(); // Если ошибка, запускаем игру
                }
            }
        });
    });
}

// Обработчик кнопки "Играть"
playButton.addEventListener('click', async () => {
    await showRegularAd(); // Ждём закрытия рекламы или ошибки
    startGame(); // После рекламы запускаем игру
});

// Остальные обработчики событий
tryAgainButton.addEventListener('click', startGame);
extraAttemptsButton.addEventListener('click', async () => {
    addExtraAttempts()
});
mainMenuButton.addEventListener('click', () => showScreen(mainMenu));

// Функция для начала игры
function startGame() {
    console.log("Игра начинается...");
    adShown = false; // Сбрасываем флаг рекламы при старте новой игры
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
// Добавление дополнительных попыток через вознаграждаемую рекламу
function addExtraAttempts() {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        console.warn("FAPI.UI не доступен");
        // В тестовых целях можно дать попытки даже без FAPI
        attemptsLeft += 3;
        attemptsDisplay.textContent = attemptsLeft;
        extraAttemptsButton.classList.add('hidden');
        extraAttemptsUsed = true;
        return;
    }

    FAPI.UI.showLoadedAd({
        adType: 'rewarded',
        callbacks: {
            onAdLoaded: () => {
                console.log("Вознаграждаемая реклама загружена");
                // Можно добавить визуальную индикацию загрузки
                feedback.textContent = 'Реклама загружена, готово к показу';
            },
            onAdShown: () => {
                console.log("Вознаграждаемая реклама показана");
                feedback.textContent = 'Смотрите рекламу для получения бонуса';
            },
            onAdClosed: (data) => {
                console.log("Вознаграждаемая реклама закрыта:", data);
                // Согласно документации, успешный показ имеет data = "ad_shown"
                if (data === "ad_shown") {
                    attemptsLeft += 3;
                    attemptsDisplay.textContent = attemptsLeft;
                    extraAttemptsButton.classList.add('hidden');
                    extraAttemptsUsed = true;
                    feedback.textContent = 'Вы получили 3 дополнительные попытки!';
                    console.log("Игрок получил дополнительные попытки");
                } else {
                    feedback.textContent = 'Реклама не была досмотрена до конца';
                    console.log("Реклама не была досмотрена до конца, бонус не выдан");
                }
            },
            onAdError: (error) => {
                console.error("Ошибка показа рекламы:", error);
                feedback.textContent = 'Ошибка загрузки рекламы. Попробуйте позже.';
                // Можно автоматически дать попытки при ошибке:
                // attemptsLeft += 3;
                // attemptsDisplay.textContent = attemptsLeft;
                // extraAttemptsButton.classList.add('hidden');
                // extraAttemptsUsed = true;
            }
        }
    });
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
