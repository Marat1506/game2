// Основные переменные игры
let targetNumber;
let attemptsLeft;
let extraAttemptsUsed = false;

// Получаем элементы интерфейса
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
    gameOverMessage: document.getElementById('game-over-message')
};

// Инициализация FAPI
function initFAPI() {
    const rParams = FAPI.Util.getRequestParameters();

    FAPI.init(rParams.api_server, rParams.apiconnection,
        function() {
            console.log('FAPI успешно инициализирован');
            setupEventListeners();
        },
        function(error) {
            console.error('Ошибка инициализации FAPI:', error);
            setupEventListeners(); // Все равно настраиваем обработчики
        }
    );
}

// Показ обычной рекламы
function showAd() {
    return new Promise((resolve, reject) => {
        if (!FAPI?.UI) {
            console.warn('FAPI.UI не доступен');
            resolve();
            return;
        }

        FAPI.UI.showAd({
            adType: 'interstitial',
            callbacks: {
                onAdLoaded: () => console.log('Реклама загружена'),
                onAdShown: () => console.log('Реклама показана'),
                onAdClosed: () => {
                    console.log('Реклама закрыта');
                    resolve();
                },
                onAdError: (error) => {
                    console.error('Ошибка рекламы:', error);
                    reject(error);
                }
            }
        });
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    elements.playButton.addEventListener('click', async function() {
        this.disabled = true; // Блокируем кнопку на время показа рекламы
        try {
            await showAd();
            startGame();
        } catch (error) {
            console.error('Ошибка при показе рекламы:', error);
            startGame();
        } finally {
            this.disabled = false;
        }
    });

    // Остальные обработчики
    elements.tryAgainButton.addEventListener('click', startGame);
    elements.extraAttemptsButton.addEventListener('click', addExtraAttempts);
    elements.mainMenuButton.addEventListener('click', () => showScreen(elements.mainMenu));
}

// Игровые функции
function startGame() {
    targetNumber = Math.floor(Math.random() * 81) + 1;
    attemptsLeft = 5;
    extraAttemptsUsed = false;
    elements.attemptsDisplay.textContent = attemptsLeft;
    elements.feedback.textContent = '';
    elements.extraAttemptsButton.classList.add('hidden');
    generateGrid();
    showScreen(elements.gameScreen);

    console.log('Загаданное число (для теста):', targetNumber);
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

// Остальные функции без существенных изменений...

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    if (typeof FAPI !== 'undefined') {
        initFAPI();
    } else {
        console.error('FAPI не загружен!');
        setupEventListeners(); // Все равно настраиваем обработчики
    }
    showScreen(elements.mainMenu);
});