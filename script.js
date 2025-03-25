// Глобальные переменные игры
let targetNumber;
let attemptsLeft;
let extraAttemptsUsed = false;
let sdkInitialized = false;
let currentGameId = 0;

// Элементы интерфейса
const elements = {
    mainMenu: document.getElementById('main-menu'),
    gameScreen: document.getElementById('game-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    playButton: document.getElementById('play-button'),
    grid: document.getElementById('grid'),
    attemptsDisplay: document.getElementById('attempts'),
    feedback: document.getElementById('feedback'),
    extraAttemptsButton: document.getElementById('extra-attempts'),
    mainMenuButton: document.getElementById('main-menu-button'),
    tryAgainButton: document.getElementById('try-again-button'),
    gameOverMessage: document.getElementById('game-over-message'),
    buyAttempts: document.getElementById('buy-attempts'),
    buyWin: document.getElementById('buy-win'),
    shop: document.getElementById('shop')
};

// Проверка third-party cookies и установка заголовка
function checkAndSetCookies() {
    document.cookie = "ok_auth=1; SameSite=None; Secure";
}

// Инициализация OK SDK
function initOKSDK() {
    return new Promise((resolve, reject) => {
        if (typeof FAPI === 'undefined') {
            reject(new Error('FAPI не загружен'));
            return;
        }

        const rParams = FAPI.Util.getRequestParameters();
        if (!rParams["api_server"] || !rParams["apiconnection"]) {
            reject(new Error('Ошибка параметров API'));
            return;
        }

        FAPI.init(
            rParams["api_server"], 
            rParams["apiconnection"],
            function() {
                console.log('OK SDK успешно инициализирован');
                sdkInitialized = true;
                resolve(true);
            },
            function(error) {
                console.error('Ошибка инициализации OK SDK:', error);
                reject(error);
            }
        );
    });
}

// Обработка платежей
function processPayment(productId, amount, description, callback) {
    if (!sdkInitialized) {
        console.error('OK SDK не инициализирован');
        callback(false);
        return;
    }

    FAPI.Client.call({
        method: 'appTransactions.init',
        params: {
            product: productId,
            amount: amount,
            description: description
        },
        callback: function(response) {
            if (response?.transaction_id) {
                console.log('Платеж успешен:', response);
                callback(true, response.transaction_id);
            } else {
                console.error('Ошибка платежа:', response);
                callback(false);
            }
        }
    });
}

// Логика игры
function startGame() {
    currentGameId = Date.now();
    targetNumber = Math.floor(Math.random() * 81) + 1;
    attemptsLeft = 5;
    extraAttemptsUsed = false;
    updateUI();
    generateGrid();
    showScreen(elements.gameScreen);
}

function generateGrid() {
    elements.grid.innerHTML = '';
    for (let i = 1; i <= 81; i++) {
        const cell = document.createElement('div');
        cell.textContent = i;
        cell.addEventListener('click', () => handleGuess(i));
        elements.grid.appendChild(cell);
    }
}

function handleGuess(number) {
    if (number === targetNumber) {
        elements.feedback.textContent = 'УГАДАЛИ!';
        endGame(true);
    } else {
        elements.feedback.textContent = number < targetNumber ? 'БОЛЬШЕ!' : 'МЕНЬШЕ!';
        attemptsLeft--;
        updateUI();
        
        if (attemptsLeft === 0) {
            endGame(false);
        } else if (attemptsLeft === 1 && !extraAttemptsUsed) {
            elements.extraAttemptsButton.classList.remove('hidden');
        }
    }
}

function updateUI() {
    elements.attemptsDisplay.textContent = attemptsLeft;
    elements.feedback.textContent = '';
}

function endGame(won) {
    elements.gameOverMessage.textContent = won
        ? 'Поздравляем, вы угадали загаданное число!'
        : 'Не угадали, в следующий раз повезет!';
    showScreen(elements.gameOverScreen);
}

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
}

// Обработчики событий
function setupEventListeners() {
    elements.playButton.addEventListener('click', startGame);
    elements.tryAgainButton.addEventListener('click', startGame);
    elements.mainMenuButton.addEventListener('click', () => showScreen(elements.mainMenu));
    
    elements.extraAttemptsButton.addEventListener('click', () => {
        attemptsLeft += 3;
        elements.extraAttemptsButton.classList.add('hidden');
        extraAttemptsUsed = true;
        updateUI();
    });

    elements.buyAttempts.addEventListener('click', () => {
        processPayment(`extra_attempts_${currentGameId}`, 59, '10 дополнительных попыток', (success) => {
            if (success) {
                attemptsLeft += 10;
                elements.extraAttemptsButton.classList.add('hidden');
                updateUI();
                alert('Вы получили 10 дополнительных попыток!');
            } else {
                alert('Не удалось выполнить покупку. Попробуйте позже.');
            }
        });
    });

    elements.buyWin.addEventListener('click', () => {
        processPayment(`instant_win_${currentGameId}`, 100, 'Гарантированный выигрыш', (success) => {
            if (success) {
                endGame(true);
                alert('Поздравляем с победой!');
            } else {
                alert('Не удалось выполнить покупку. Попробуйте позже.');
            }
        });
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    checkAndSetCookies(); // Проверяем и устанавливаем cookie

    // Загрузка FAPI скрипта
    const script = document.createElement('script');
    script.src = 'https://connect.ok.ru/connect.js';
    script.async = true;
    script.onload = () => {
        initOKSDK()
            .then(() => {
                setupEventListeners();
                showScreen(elements.mainMenu);
            })
            .catch(error => {
                console.error('Ошибка инициализации:', error);
                // Режим fallback - игра без SDK
                setupEventListeners();
                showScreen(elements.mainMenu);
            });
    };
    script.onerror = () => {
        console.error('Не удалось загрузить FAPI');
        // Режим fallback
        setupEventListeners();
        showScreen(elements.mainMenu);
    };
    document.head.appendChild(script);
});
