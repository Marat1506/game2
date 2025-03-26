// Убираем глобальный флаг adShown, так как он мешает правильному показу рекламы
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
const buyAttemptsButton = document.getElementById('buy-attempts');
const buyWinButton = document.getElementById('buy-win');

const OK_CONFIG = {
    app_id: 512002514780,      // Замените на ваш APP ID
    app_key: 'CNFQFLLGDIHBABABA'   // Замените на ваш публичный ключ
};

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
        if (typeof FAPI === 'undefined' || !FAPI.UI) {
            console.warn("FAPI.UI не доступен");
            resolve(); // Если реклама недоступна, сразу запускаем игру
            return;
        }

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

buyAttemptsButton.addEventListener('click', () => {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        console.warn("FAPI не доступен");
        attemptsLeft += 10; // Тестовый режим
        attemptsDisplay.textContent = attemptsLeft;
        feedback.textContent = "10 попыток (тестовый режим)";
        return;
    }

    try {
        FAPI.UI.showPayment({
            name: "10 попыток",
            description: "Дополнительные попытки для игры",
            code: "attempts_10_" + Date.now(),
            price: 1, // Используйте 1 OK для теста
            options: null,
            attributes: JSON.stringify({ item: "attempts" }),
            currency: "ok",
            callback: true, // Не обновлять страницу
            uiConf: null
        });
    } catch (e) {
        console.error("Ошибка платежа:", e);
        feedback.textContent = "Ошибка запуска платежа";
    }
});

buyWinButton.addEventListener('click', () => {
    // Логика гарантированного выигрыша
    feedback.textContent = `Загаданное число: ${targetNumber}`;
    // endGame(true);
});

// Обработчик кнопки "Играть"
playButton.addEventListener('click', async () => {
    await showRegularAd(); // Ждём закрытия рекламы или ошибки
    startGame(); // После рекламы запускаем игру
});

// Обработчик кнопки "Попробовать снова"
tryAgainButton.addEventListener('click', () => {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        console.warn("FAPI.UI не доступен");
        startGame(); // Если FAPI не доступен, просто начинаем игру
        return;
    }

    FAPI.UI.loadAd();

    window.API_callback = function (method, result, data) {
        console.log("API_callback: ", method, result, data);

        if (method === "loadAd") {
            if (result === "ok" && data === "ready") {
                console.log("реклама готова к показу");
                feedback.textContent = "Реклама загружена...";

                setTimeout(() => {
                    FAPI.UI.showLoadedAd();
                }, 1000);
            } else {
                console.log("Не удалось загрузить рекламу: ", data);
                feedback.textContent = "Ошибка загрузки рекламы";
                startGame(); // Если не удалось загрузить, начинаем игру
            }
        }

        if (method === "showLoadedAd") {
            if (result === "ok") {
                if (data === "complete" || data === "ad_shown") {
                    console.log("Реклама полностью просмотрена");
                    startGame();
                }
            } else if (result === "error") {
                if (data === "skip") {
                    console.log("Пользователь пропустил рекламу");
                    feedback.textContent = "Вы пропустили рекламу и не получили бонус";
                } else {
                    console.log("Ошибка показа рекламы:", data);
                    feedback.textContent = "Ошибка показа рекламы: " + data;
                }
                startGame(); // В любом случае начинаем игру
            }
        }
    };
});

extraAttemptsButton.addEventListener('click', addExtraAttempts);
mainMenuButton.addEventListener('click', () => showScreen(mainMenu));

// Функция для начала игры
function startGame() {
    console.log("Игра начинается...");
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

// Добавление дополнительных попыток через вознаграждаемую рекламу
function addExtraAttempts() {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        console.warn("FAPI.UI не доступен");
        // Для тестирования даем попытки даже без FAPI
        giveExtraAttempts();
        return;
    }

    // Сначала загружаем рекламу
    FAPI.UI.loadAd();

    // Обрабатываем коллбеки через глобальную функцию API_callback
    window.API_callback = function(method, result, data) {
        console.log("API_callback:", method, result, data);

        if (method === "loadAd") {
            if (result === "ok" && data === "ready") {
                // Реклама загружена, можно показывать
                console.log("Реклама готова к показу");
                feedback.textContent = "Реклама загружена...";

                // Показываем рекламу через 1 секунду (можно сразу)
                setTimeout(() => {
                    FAPI.UI.showLoadedAd();
                }, 1000);
            } else {
                console.log("Не удалось загрузить рекламу:", data);
                feedback.textContent = "Ошибка загрузки рекламы";
            }
        }

        if (method === "showLoadedAd") {
            if (result === "ok") {
                // Для web/mobile web
                if (data === "complete") {
                    console.log("Реклама полностью просмотрена (web)");
                    giveExtraAttempts();
                }
                // Для Android
                // else if (data === "ad_shown") {
                //     console.log("Реклама полностью просмотрена (Android)");
                //     giveExtraAttempts();
                // }
                // Дополнительное событие с форматом рекламы
                else if (data && data.includes("rewarded")) {
                    console.log("Реклама показана, формат:", data);
                    giveExtraAttempts();
                }
            }
            else if (result === "error") {
                if (data === "skip") {
                    console.log("Пользователь пропустил рекламу");
                    feedback.textContent = "Вы пропустили рекламу и не получили бонус";
                } else {
                    console.log("Ошибка показа рекламы:", data);
                    feedback.textContent = "Ошибка показа рекламы: " + data;
                }
            }
        }
    };
}

// Функция для выдачи награды
function giveExtraAttempts() {
    attemptsLeft += 3;
    attemptsDisplay.textContent = attemptsLeft;
    extraAttemptsButton.classList.add('hidden');
    extraAttemptsUsed = true;
    feedback.textContent = "Вы получили 3 дополнительные попытки!";
    console.log("Дополнительные попытки выданы");
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

// Показываем рекламу при загрузке страницы
document.addEventListener("DOMContentLoaded", async () => {
    await showRegularAd();
});

// Показываем главное меню при загрузке
showScreen(mainMenu);