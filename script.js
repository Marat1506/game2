let targetNumber;
let attemptsLeft;
let extraAttemptsUsed = false;
let adShown = false;

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
    startGame(); // После рекламы сразу запускаем игру
});

// Остальные функции остаются без изменений
buyAttemptsButton.addEventListener('click', () => {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        console.warn("FAPI.UI не доступен");
        attemptsLeft += 10;
        attemptsDisplay.textContent = attemptsLeft;
        feedback.textContent = 'Вы купили 10 дополнительных попыток! (тестовый режим)';
        return;
    }

    try {
        FAPI.UI.showPayment(
            "10 попыток",                  // Название товара
            "Дополнительные попытки",      // Описание
            "attempts_10",                 // Уникальный код товара
            1,                            // Цена (в OK)
            null,                          // Опции (устарело)
            JSON.stringify({ item: "attempts" }), // Доп. атрибуты
            "ok",                          // Валюта (OK)
            true                           // Не обновлять страницу
        );

    } catch (e) {
        console.error("Ошибка при вызове платежа:", e);
        feedback.textContent = "Ошибка инициализации платежа";
    }
});

buyWinButton.addEventListener('click', () => {
    feedback.textContent = `Загаданное число: ${targetNumber}`;
});

tryAgainButton.addEventListener('click', () => {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        console.warn("FAPI.UI не доступен");
        return;
    }

    FAPI.UI.loadAd();

    window.API_callback = function (method, result, data) {
        console.log("API_callback: ", method, result, data);

        if (method === "loadAd") {
            if (result === "ok" && data === "ready") {
                console.log("реклама готова к показу");
                feedback.textContent = "Реклама загрежена...";

                setTimeout(() => {
                    FAPI.UI.showLoadedAd()
                }, 1000)
            }else {
                console.log("Не удалось загрузить рекламу: ", data)
                feedback.textContent = "Ошибка загрузки рекламы"
            }
        }

        if (method === "showLoadedAd") {
            if (result === "ok") {
                if (data === "complete"){
                    console.log("Реклама полностью  просмотрена")
                    startGame()
                }
            }else if(result === "error") {
                if (data === "skip") {
                    console.log("Пользователь пропустил рекламу");
                    feedback.textContent = "Вы пропустили рекламу и не получили бонус";
                } else {
                    console.log("Ошибка показа рекламы:", data);
                    feedback.textContent = "Ошибка показа рекламы: " + data;
                }
            }
        }
    }
});

extraAttemptsButton.addEventListener('click', async () => {
    addExtraAttempts()
});

mainMenuButton.addEventListener('click', () => showScreen(mainMenu));

function startGame() {
    console.log("Игра начинается...");
    adShown = false; // Сбрасываем флаг рекламы при старте новой игры
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

function addExtraAttempts() {
    if (typeof FAPI === 'undefined' || !FAPI.UI) {
        console.warn("FAPI.UI не доступен");
        giveExtraAttempts();
        return;
    }

    FAPI.UI.loadAd();

    window.API_callback = function(method, result, data) {
        console.log("API_callback:", method, result, data);

        if (method === "loadAd") {
            if (result === "ok" && data === "ready") {
                console.log("Реклама готова к показу");
                feedback.textContent = "Реклама загружена...";

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
                if (data === "complete") {
                    console.log("Реклама полностью просмотрена (web)");
                    giveExtraAttempts();
                }
                else if (data === "ad_shown") {
                    console.log("Реклама полностью просмотрена (Android)");
                    giveExtraAttempts();
                }
                else if (data && data.includes("rewarded")) {
                    console.log("Реклама показана, формат:", data);
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

function giveExtraAttempts() {
    attemptsLeft += 3;
    attemptsDisplay.textContent = attemptsLeft;
    extraAttemptsButton.classList.add('hidden');
    extraAttemptsUsed = true;
    feedback.textContent = "Вы получили 3 дополнительные попытки!";
    console.log("Дополнительные попытки выданы");
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

showScreen(mainMenu);