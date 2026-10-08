// ==========================================
// 1. ИНИЦИАЛИЗАЦИЯ И СЕТЬ SUPABASE
// ==========================================
// Для локального тестирования мы используем автоматическую имитацию полноценной БД.
// Когда вы захотите переключиться на реальное облако — просто заполните эти два поля данными из Supabase.
const SUPABASE_URL = ""; 
const SUPABASE_ANON_KEY = "";

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Хранилище сессии и ролей пользователей (в имитационном режиме)
let currentUser = JSON.parse(localStorage.getItem('nn_user')) || null;

// По умолчанию NazarMalinov — главный Овнер с бесконечными правами
const OWNER_NICKNAME = "NazarMalinov";

// Дефолтный пак игроков
const initialPlayers = [
    { id: 1, name: "strafikk", points: 290, mode: "overall", tier1: "HT1", tier2: "LT1" },
    { id: 2, name: "vetakua", points: 240, mode: "overall", tier1: "HT1", tier2: "LT2" },
    { id: 3, name: "NazarMalinov", points: 500, mode: "overall", tier1: "HT1", tier2: "" },
    { id: 4, name: "PvP_Master", points: 310, mode: "sword", tier1: "HT1", tier2: "" },
    { id: 5, name: "ElytraGod", points: 420, mode: "elytramace", tier1: "HT1", tier2: "HT2" }
];

let players = JSON.parse(localStorage.getItem('nn_players')) || initialPlayers;
let activeSearchQuery = "";

// ==========================================
// 2. СИСТЕМА АВТОРИЗАЦИИ И ПРАВ ДОСТУПА
// ==========================================
function getUserRole(user) {
    if (!user) return 'guest';
    if (user.name.toLowerCase() === OWNER_NICKNAME.toLowerCase()) return 'owner';
    return user.role || 'moderator'; // Любой зарегистрированный юзер становится модератором по умолчанию
}

function updateAuthUI() {
    const authBlock = document.getElementById('authBlock');
    const adminPanel = document.getElementById('adminPanel');
    const roleBadge = document.getElementById('userRoleBadge');
    const role = getUserRole(currentUser);

    if (currentUser) {
        authBlock.innerHTML = `
            <span style="font-size:13px; font-weight:700; color:#00f2fe; margin-right:15px;">${currentUser.name}</span>
            <button class="btn-delete" id="logoutBtn">Выйти</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', logout);
        
        // Показываем админку только Овнеру и Модераторам
        if (role === 'owner' || role === 'moderator') {
            adminPanel.style.display = 'block';
            roleBadge.textContent = role === 'owner' ? 'Овнер / Создатель' : 'Модератор';
            roleBadge.style.background = role === 'owner' ? '#ff4757' : '#00f2fe';
        } else {
            adminPanel.style.display = 'none';
        }
    } else {
        authBlock.innerHTML = `<button class="btn-primary" id="openAuthModalBtn">Войти / Регистрация</button>`;
        document.getElementById('openAuthModalBtn').addEventListener('click', openModal);
        adminPanel.style.display = 'none';
    }
    
    // Скрываем или показываем колонку "Действие" в таблицах
    document.querySelectorAll('.admin-only-cell').forEach(cell => {
        cell.style.display = (role === 'owner' || role === 'moderator') ? 'table-cell' : 'none';
    });
}

// Окна Авторизации
const modal = document.getElementById('authModal');
function openModal() { modal.classList.add('active'); }
function closeModal() { modal.classList.remove('active'); }

document.getElementById('closeAuthModalBtn').addEventListener('click', closeModal);
document.getElementById('tabLoginBtn').addEventListener('click', () => switchTab('login'));
document.getElementById('tabRegisterBtn').addEventListener('click', () => switchTab('register'));

function switchTab(type) {
    document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (type === 'login') {
        document.getElementById('tabLoginBtn').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('tabRegisterBtn').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// Логика работы Форм
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    
    currentUser = { name: name, email: email, role: name.toLowerCase() === OWNER_NICKNAME.toLowerCase() ? 'owner' : 'moderator' };
    localStorage.setItem('nn_user', JSON.stringify(currentUser));
    
    closeModal();
    updateAuthUI();
    renderTables();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    // Имитация входа — берем имя из email
    const name = email.split('@')[0];
    
    currentUser = { name: name, email: email, role: name.toLowerCase() === OWNER_NICKNAME.toLowerCase() ? 'owner' : 'moderator' };
    localStorage.setItem('nn_user', JSON.stringify(currentUser));
    
    closeModal();
    updateAuthUI();
    renderTables();
});

function logout() {
    currentUser = null;
    localStorage.removeItem('nn_user');
    updateAuthUI();
    renderTables();
}

// ==========================================
// 3. ОТРИСОВКА И ПОРЯДОК СОРТИРОВКИ ТАБЛИЦ
// ==========================================
function getTierHtml(text) {
    if (!text) return '';
    const isLt = text.toLowerCase().includes('lt');
    return `<span class="tier ${isLt ? 'tier-orange' : 'tier-red'}">${text.toUpperCase()}</span>`;
}

function renderTables() {
    const modes = ['overall', 'sword', 'netuop', 'pot', 'elytramace', 'mace', 'cart'];
    const role = getUserRole(currentUser);
    const hasAdminAccess = (role === 'owner' || role === 'moderator');

    modes.forEach(mode => {
        const tbody = document.getElementById(`tbody-${mode}`);
        if (!tbody) return;
        tbody.innerHTML = '';

        // Фильтруем игроков по текущему PvP-режиму и строке глобального поиска
        let modePlayers = players.filter(p => p.mode === mode);
        if (activeSearchQuery) {
            modePlayers = modePlayers.filter(p => p.name.toLowerCase().includes(activeSearchQuery.toLowerCase()));
        }

        // Сортировка по очкам рейтинга
        modePlayers.sort((a, b) => b.points - a.points);

        if (modePlayers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#525a6e; padding:20px;">Игроков не найдено</td></tr>`;
            return;
        }

        modePlayers.forEach((player, index) => {
            const tr = document.createElement('tr');
            
            let tiersHtml = '';
            if (player.tier1) tiersHtml += getTierHtml(player.tier1);
            if (player.tier2) tiersHtml += getTierHtml(player.tier2);
            if (!tiersHtml) tiersHtml = '<span style="color:#424959">—</span>';

            let actionHtml = hasAdminAccess 
                ? `<td><button class="btn-delete" onclick="deletePlayer(${player.id})">Удалить</button></td>` 
                : '';

            tr.innerHTML = `
                <td><strong>#${index + 1}</strong></td>
                <td class="player-name">${player.name}</td>
                <td style="color: #00f2fe; font-weight: 800;">${player.points}</td>
                <td>${tiersHtml}</td>
                ${actionHtml}
            `;
            tbody.appendChild(tr);
        });
    });
}

// Добавление новых игроков
document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const role = getUserRole(currentUser);
    if (role !== 'owner' && role !== 'moderator') return;

    const newPlayer = {
        id: Date.now(),
        name: document.getElementById('pName').value.trim(),
        points: parseInt(document.getElementById('pPoints').value),
        mode: document.getElementById('pMode').value,
        tier1: document.getElementById('pTier1').value.trim(),
        tier2: document.getElementById('pTier2').value.trim()
    };

    players.push(newPlayer);
    localStorage.setItem('nn_players', JSON.stringify(players));
    document.getElementById('addPlayerForm').reset();
    renderTables();
});

// Удаление игроков
window.deletePlayer = function(id) {
    const role = getUserRole(currentUser);
    if (role !== 'owner' && role !== 'moderator') return;

    if (confirm("Удалить игрока из базы?")) {
        players = players.filter(p => p.id !== id);
        localStorage.setItem('nn_players', JSON.stringify(players));
        renderTables();
    }
};

// ==========================================
// 4. НАВИГАЦИЯ И ЖИВОЙ ПОИСК
// ==========================================
// Поиск по никам
document.getElementById('playerSearch').addEventListener('input', (e) => {
    activeSearchQuery = e.target.value;
    renderTables();
});

// Переключение разделов шапки
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
        
        link.classList.add('active');
        document.getElementById(link.getAttribute('data-target')).classList.add('active');
    });
});

// Переключение табов PvP режимов
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
btn.classList.add('active');
document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
});
});
// Первоначальный пуск
updateAuthUI();
renderTables();
