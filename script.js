// Пароль создателя по умолчанию: 7777 (можно изменить ниже)
const ADMIN_PASSWORD = "7777"; 

// Начальные дефолтные игроки, если база пустая
const defaultPlayers = [
    { id: 1, name: "strafikk", points: 222, mode: "overall", tier1: "HT1", tier2: "LT1" },
    { id: 2, name: "vetakua", points: 177, mode: "overall", tier1: "HT1", tier2: "LT2" },
    { id: 3, name: "Player_One", points: 300, mode: "sword", tier1: "HT2", tier2: "" }
];

// Загрузка списка игроков из памяти браузера или создание начального
let players = JSON.parse(localStorage.getItem('minecraft_players')) || defaultPlayers;
let isAdmin = sessionStorage.getItem('is_creator') === 'true';

// Функция для отрисовки таблиц
function renderTables() {
    const modes = ['overall', 'sword', 'netuop', 'pot'];
    
    // Очищаем таблицы перед рендером
    modes.forEach(mode => {
        document.getElementById(`tbody-${mode}`).innerHTML = '';
    });

    // Фильтруем и заполняем данные
    modes.forEach(mode => {
        const modePlayers = players.filter(p => p.mode === mode);
        // Сортировка по очкам (от больших к меньшим)
        modePlayers.sort((a, b) => b.points - a.points);

        const tbody = document.getElementById(`tbody-${mode}`);
        
        if (modePlayers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#555;">Список пуст</td></tr>`;
            return;
        }

        modePlayers.forEach((player, index) => {
            const tr = document.createElement('tr');
            
            // Генерируем плашки тиров, если они есть
            let tiersHtml = '';
            if(player.tier1) tiersHtml += `<span class="tier ht">${player.tier1}</span>`;
            if(player.tier2) tiersHtml += `<span class="tier lt">${player.tier2}</span>`;

            // Кнопка удаления видна только создателю
            let actionHtml = isAdmin ? `<td><button class="btn-delete" onclick="deletePlayer(${player.id})">Удалить</button></td>` : '<td>—</td>';

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td class="player-name">${player.name}</td>
                <td>${player.points}</td>
                <td>${tiersHtml}</td>
                ${actionHtml}
            `;
            tbody.appendChild(tr);
        });
    });
}

// Проверка и показ панели админа
function checkAdminState() {
    const panel = document.getElementById('adminPanel');
    const authBtn = document.getElementById('adminAuthBtn');
    
    if (isAdmin) {
        panel.style.display = 'block';
        authBtn.textContent = 'Режим Создателя АКТИВЕН';
        authBtn.style.borderColor = '#2ed573';
        authBtn.style.color = '#2ed573';
    } else {
        panel.style.display = 'none';
        authBtn.textContent = 'Вход для Создателя';
        authBtn.style.borderColor = '#45f3ff';
        authBtn.style.color = '#45f3ff';
    }
}

// Кнопка входа для создателя
document.getElementById('adminAuthBtn').addEventListener('click', () => {
    if (isAdmin) {
        alert("Вы уже авторизованы как создатель!");
        return;
    }
    const pass = prompt("Введите секретный пароль создателя:");
    if (pass === ADMIN_PASSWORD) {
        isAdmin = true;
        sessionStorage.setItem('is_creator', 'true');
        checkAdminState();
        renderTables();
    } else if (pass !== null) {
        alert("Неверный пароль!");
    }
});

// Выход из режима создателя
document.getElementById('logoutBtn').addEventListener('click', () => {
    isAdmin = false;
    sessionStorage.removeItem('is_creator');
    checkAdminState();
    renderTables();
});

// Обработка формы добавления нового игрока
document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const newPlayer = {
        id: Date.now(), // уникальный id
        name: document.getElementById('pName').value.trim(),
        points: parseInt(document.getElementById('pPoints').value),
        mode: document.getElementById('pMode').value,
        tier1: document.getElementById('pTier1').value.trim(),
        tier2: document.getElementById('pTier2').value.trim()
    };

    players.push(newPlayer);
    localStorage.setItem('minecraft_players', JSON.stringify(players));
    
    // Сброс формы и обновление таблиц
    document.getElementById('addPlayerForm').reset();
    renderTables();
});

// Функция удаления игрока (вызывается из кнопки в таблице)
window.deletePlayer = function(id) {
    if (!isAdmin) return;
    if (confirm("Удалить этого игрока из тир-листа?")) {
        players = players.filter(p => p.id !== id);
        localStorage.setItem('minecraft_players', JSON.stringify(players));
        renderTables();
    }
};

// Переключение вкладок (Логика из прошлого шага)
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Первый запуск сайта
checkAdminState();
renderTables();
