// Секретный ключ админа
const ADMIN_PASSWORD = "7777"; 

// Стартовый набор игроков с новыми режимами PvP
const defaultPlayers = [
    { id: 1, name: "strafikk", points: 290, mode: "overall", tier1: "HT1", tier2: "LT1" },
    { id: 2, name: "vetakua", points: 240, mode: "overall", tier1: "HT1", tier2: "LT2" },
    { id: 3, name: "PvP_Master", points: 310, mode: "sword", tier1: "HT1", tier2: "" },
    { id: 4, name: "ElytraGod", points: 420, mode: "elytramace", tier1: "HT1", tier2: "HT2" },
    { id: 5, name: "MineCartFan", points: 195, mode: "cart", tier1: "LT1", tier2: "" }
];

let players = JSON.parse(localStorage.getItem('minecraft_players')) || defaultPlayers;
let isAdmin = sessionStorage.getItem('is_creator') === 'true';

// 1. ПЕРЕКЛЮЧЕНИЕ ОСНОВНЫХ СТРАНИЦ САЙТА (Тир-листы / Гайд / Тренеры)
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
        
        link.classList.add('active');
        const targetSection = link.getAttribute('data-target');
        document.getElementById(targetSection).classList.add('active');
    });
});

// 2. ОТРИСОВКА ВСЕХ СУЩЕСТВУЮЩИХ ТАБЛИЦ (Включая новые PvP режимы)
function renderTables() {
    const modes = ['overall', 'sword', 'netuop', 'pot', 'elytramace', 'mace', 'cart'];
    
    modes.forEach(mode => {
        const tbody = document.getElementById(`tbody-${mode}`);
        if (!tbody) return;
        tbody.innerHTML = '';
        
        // Фильтрация и точная сортировка по очкам топ-1, топ-2...
        const modePlayers = players.filter(p => p.mode === mode);
        modePlayers.sort((a, b) => b.points - a.points);

        if (modePlayers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#4e5361; padding: 25px;">В этой категории пока нет игроков</td></tr>`;
            return;
        }

        modePlayers.forEach((player, index) => {
            const tr = document.createElement('tr');
            
            let tiersHtml = '';
            if(player.tier1) tiersHtml += `<span class="tier ht">${player.tier1}</span>`;
            if(player.tier2) tiersHtml += `<span class="tier lt">${player.tier2}</span>`;

            let actionHtml = isAdmin 
                ? `<td><button class="btn-delete" onclick="deletePlayer(${player.id})">Удалить</button></td>` 
                : '<td>—</td>';

            tr.innerHTML = `
                <td><strong>${index + 1}</strong></td>
                <td class="player-name">${player.name}</td>
                <td style="color: #00f2fe; font-weight: 700;">${player.points}</td>
                <td>${tiersHtml}</td>
                ${actionHtml}
            `;
            tbody.appendChild(tr);
        });
    });
}

// 3. АВТОРИЗАЦИЯ И УПРАВЛЕНИЕ АДМИН-ПАНЕЛЬЮ
function checkAdminState() {
    const panel = document.getElementById('adminPanel');
    const authBtn = document.getElementById('adminAuthBtn');
    
    if (isAdmin) {
        panel.style.display = 'block';
        authBtn.textContent = 'Панель Создателя ✓';
        authBtn.style.borderColor = '#2ed573';
        authBtn.style.color = '#2ed573';
    } else {
        panel.style.display = 'none';
        authBtn.textContent = 'Вход для Создателя';
        authBtn.style.borderColor = 'rgba(0, 242, 254, 0.4)';
        authBtn.style.color = '#00f2fe';
    }
}

document.getElementById('adminAuthBtn').addEventListener('click', () => {
    if (isAdmin) return;
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

document.getElementById('logoutBtn').addEventListener('click', () => {
    isAdmin = false;
    sessionStorage.removeItem('is_creator');
    checkAdminState();
    renderTables();
});

// 4. ДОБЛЕНИЕ НОВОГО ИГРОКА С СОХРАНЕНИЕМ
document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const newPlayer = {
        id: Date.now(),
        name: document.getElementById('pName').value.trim(),
        points: parseInt(document.getElementById('pPoints').value),
        mode: document.getElementById('pMode').value,
        tier1: document.getElementById('pTier1').value.trim(),
        tier2: document.getElementById('pTier2').value.trim()
    };

    players.push(newPlayer);
    localStorage.setItem('minecraft_players', JSON.stringify(players));
    
    document.getElementById('addPlayerForm').reset();
    renderTables();
});

// 5. БЕЗОПАСНОЕ УДАЛЕНИЕ ИГРОКА
window.deletePlayer = function(id) {
    if (!isAdmin) return;
    if (confirm("Вы уверены, что хотите удалить игрока из этого тир-листа?")) {
        players = players.filter(p => p.id !== id);
        localStorage.setItem('minecraft_players', JSON.stringify(players));
        renderTables();
    }
};

// 6. ПЕРЕКЛЮЧЕНИЕ МЕЖДУ PvP ТАБЛИЦАМИ (Вкладки внутри Тир-листов)
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Инициализация при первой загрузке экрана
checkAdminState();
renderTables();
