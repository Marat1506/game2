// Основные переменные игры
let targetNumber;
let attemptsLeft;
let extraAttemptsUsed = false;

// Получаем элементы интерфейса
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
const buyAttemptsButton = document.getElementById('buy-attempts');
const buyWinButton = document.getElementById('buy-win');

// Конфигурация OK API
const OK_CONFIG = {
    app_id: 512002514780,
    app_key: 'CNFQFLLGDIHBABABA'
};

// Инициализация API при загрузке страницы
document.addEventListener("DOMContentLoaded", function() {
    initFAPI();
    showScreen(mainMenu);
});

// Инициализация FAPI
function initFAPI() {
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
}

// Функция показа обычной рекламы
function showRegularAd() {
    return new Promise((resolve) => {
        if (typeof FAPI === 'undefined' || !FAPI.UI) {
            console.warn("FAPI.UI не доступен");
            resolve();
            return;
        }

        FAPI.UI.showAd({
            adType: 'interstitial',
            callbacks: {
                onAdLoaded: () => console.log("Реклама загружена"),
                onAdShown: () => console.log("Реклама показана"),
                onAdClosed: () => {
                    console.log("Реклама закрыта");
                    resolve();
                },
                onAdError: (error) => {
                    console.error("Ошибка рекламы:", error);
                    resolve();
                }
            }
        });
    });
}

// Обработчики кнопок
playButton.addEventListener('click', async function() {
    await showRegularAd();
    startGame();
});

tryAgainButton.addEventListener('click', function() {
    showRewardedAd(startGame);
});

extraAttemptsButton.addEventListener('click', function() {
    showRewardedAd(function() {
        giveExtraAttempts();
    });
});

mainMenuButton.addEventListener('click', function() {
    showScreen(mainMenu);
});

// Показ вознаграждаемой рекламы
function showRewardedAd(callback) {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        console.warn("FAPI.UI не доступен");
        callback();
        return;
    }

    FAPI.UI.loadAd();

    window.API_callback = function(method, result, data) {
        console.log("API_callback:", method, result, data);

        if (method === "loadAd") {
            if (result === "ok" && data === "ready") {
                console.log("Реклама готова к показу");
                feedback.textContent = "Реклама загружена...";
                setTimeout(() => FAPI.UI.showLoadedAd(), 1000);
            } else {
                console.log("Не удалось загрузить рекламу:", data);
                feedback.textContent = "Ошибка загрузки рекламы";
                callback();
            }
        }

        if (method === "showLoadedAd") {
            if (result === "ok" && (data === "complete" || data === "ad_shown")) {
                console.log("Реклама просмотрена");
                callback();
            } else if (result === "error") {
                console.log("Ошибка показа рекламы:", data);
                feedback.textContent = "Ошибка показа рекламы";
                callback();
            }
        }
    };
}

// Основные функции игры
function startGame() {
    console.log("Запуск игры...");
    targetNumber = Math.floor(Math.random() * 81) + 1;
    attemptsLeft = 5;
    extraAttemptsUsed = false;
    attemptsDisplay.textContent = attemptsLeft;
    feedback.textContent = '';
    extraAttemptsButton.classList.add('hidden');
    buyAttemptsButton.classList.remove('hidden');
    buyWinButton.classList.remove('hidden');
    generateGrid();
    showScreen(gameScreen);
}

function generateGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= 81; i++) {
        const cell = document.createElement('div');
        cell.textContent = i;
        cell.addEventListener('click', () => handleGuess(i));
        grid.appendChild(cell);
    }
}

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

function giveExtraAttempts() {
    attemptsLeft += 3;
    attemptsDisplay.textContent = attemptsLeft;
    extraAttemptsButton.classList.add('hidden');
    extraAttemptsUsed = true;
    feedback.textContent = "Вы получили 3 дополнительные попытки!";
}

function endGame(won) {
    gameOverMessage.textContent = won
        ? 'Поздравляем, вы угадали загаданное число!'
        : 'Не угадали, в следующий раз повезет!';
    showScreen(gameOverScreen);
}

function showScreen(screen) {
    mainMenu.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

// Покупки (демо-реализация)
buyAttemptsButton.addEventListener('click', function() {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        attemptsLeft += 10;
        attemptsDisplay.textContent = attemptsLeft;
        feedback.textContent = "10 попыток (тестовый режим)";
        return;
    }

    try {
        FAPI.UI.showPayment({
            name: "10 попыток",
            description: "Дополнительные попытки для игры",
            code: "attempts_10_" + Date.now(),
            price: 1,
            options: null,
            attributes: JSON.stringify({ item: "attempts" }),
            currency: "ok",
            callback: true,
            uiConf: null
        });
    } catch (e) {
        console.error("Ошибка платежа:", e);
        feedback.textContent = "Ошибка запуска платежа";
    }
});

buyWinButton.addEventListener('click', function() {
    feedback.textContent = `Загаданное число: ${targetNumber}`;
});