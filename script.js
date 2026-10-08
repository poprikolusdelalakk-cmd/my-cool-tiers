// ==========================================
// 1. ИНИЦИАЛИЗАЦИЯ И НАСТРОЙКИ
// ==========================================
const SUPABASE_URL = ""; 
const SUPABASE_ANON_KEY = "";

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let currentUser = JSON.parse(localStorage.getItem('nn_user')) || null;
const OWNER_NICKNAME = "NazarMalinov"; 
const trustedModerators = ["strafikk", "vetakua"]; 

// Стартовый набор игроков
const initialPlayers = [
    { id: 1, name: "strafikk", points: 290, mode: "overall", tier1: "HT1", tier2: "LT1" },
    { id: 2, name: "vetakua", points: 240, mode: "overall", tier1: "HT1", tier2: "LT2" },
    { id: 3, name: "Diqlafos", points: 167, mode: "overall", tier1: "LT1", tier2: "HT2" },
    { id: 4, name: "LEONID_CHOPPER", points: 166, mode: "overall", tier1: "HT1", tier2: "HT2" },
    { id: 5, name: "uglypresets", points: 147, mode: "overall", tier1: "LT1", tier2: "LT2" }
];

let players = JSON.parse(localStorage.getItem('nn_players')) || initialPlayers;
let activeSearchQuery = "";

function getUserRole(user) {
    if (!user) return 'guest';
    const userNameLower = user.name.trim().toLowerCase();
    if (userNameLower === OWNER_NICKNAME.toLowerCase()) return 'owner';
    if (trustedModerators.some(mod => mod.toLowerCase() === userNameLower)) return 'moderator';
    return 'player';
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
    
    document.querySelectorAll('.admin-only-cell').forEach(cell => {
        cell.style.display = (role === 'owner' || role === 'moderator') ? 'table-cell' : 'none';
    });
}

// Простая генерация аватарок скинов по никнейму. Если скина нет, API выдаст Стива.
function getPlayerAvatarUrl(username) {
    return `https://minotar.net{username}/56.png`;
}

// Генерация красивых бейджей мест (1, 2, 3 места с уникальным стилем)
function getPlaceBadge(index) {
    const place = index + 1;
    if (place === 1) return `<span class="place-medal medal-gold">1.</span>`;
    if (place === 2) return `<span class="place-medal medal-silver">2.</span>`;
    if (place === 3) return `<span class="place-medal medal-bronze">3.</span>`;
    return `<span class="place-number">${place}.</span>`;
}

function getTierHtml(text) {
    if (!text) return '';
    const isLt = text.toLowerCase().includes('lt');
    return `<span class="tier ${isLt ? 'tier-orange' : 'tier-red'}">${text.toUpperCase()}</span>`;
}

// ==========================================
// 2. ОТРИСОВКА С КРАСИВЫМИ СКИНАМИ
// ==========================================
function renderTables() {
    const modes = ['overall', 'sword', 'netuop', 'pot', 'elytramace', 'mace', 'cart'];
    const role = getUserRole(currentUser);
    const hasAdminAccess = (role === 'owner' || role === 'moderator');

    modes.forEach(mode => {
        const tbody = document.getElementById(`tbody-${mode}`);
        if (!tbody) return;
        tbody.innerHTML = '';

        let modePlayers = players.filter(p => p.mode === mode);
        if (activeSearchQuery) {
            modePlayers = modePlayers.filter(p => p.name.toLowerCase().includes(activeSearchQuery.toLowerCase()));
        }

        modePlayers.sort((a, b) => b.points - a.points);

        if (modePlayers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#525a6e; padding:30px;">Игроков не найдено</td></tr>`;
            return;
        }

        modePlayers.forEach((player, index) => {
            const tr = document.createElement('tr');
            
            let tiersHtml = '';
            if (player.tier1) tiersHtml += getTierHtml(player.tier1);
            if (player.tier2) tiersHtml += getTierHtml(player.tier2);
            if (!tiersHtml) tiersHtml = '<span style="color:#424959">—</span>';

            let actionHtml = hasAdminAccess 
                ? `<td class="admin-only-cell"><button class="btn-delete" onclick="deletePlayer(${player.id})">Удалить</button></td>` 
                : '';

            // Генерируем крутую структуру строки со скином и медалью места
            tr.innerHTML = `
                <td class="td-place">${getPlaceBadge(index)}</td>
                <td class="td-player">
                    <div class="player-profile-cell">
                        <img class="player-skin-head" src="${getPlayerAvatarUrl(player.name)}" alt="skin" onerror="this.src='https://minotar.net'">
                        <div class="player-info-block">
                            <span class="player-name">${player.name}</span>
                            <span class="player-points-sub">${player.points} очков</span>
                        </div>
                    </div>
                </td>
                <td class="td-rating-val" style="color: #00f2fe; font-weight: 800;">${player.points}</td>
                <td class="td-tiers">${tiersHtml}</td>
                ${actionHtml}
            `;
            tbody.appendChild(tr);
        });
    });
}

// Остальная логика форм и навигации без изменений
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

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    currentUser = { name: name, email: document.getElementById('regEmail').value.trim() };
    localStorage.setItem('nn_user', JSON.stringify(currentUser));
    closeModal(); updateAuthUI(); renderTables();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    currentUser = { name: email.split('@')[0], email: email };
    localStorage.setItem('nn_user', JSON.stringify(currentUser));
    closeModal(); updateAuthUI(); renderTables();
});

function logout() { currentUser = null; localStorage.removeItem('nn_user'); updateAuthUI(); renderTables(); }

document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const role = getUserRole(currentUser);
    if (role !== 'owner' && role !== 'moderator') return;

    players.push({
        id: Date.now(),
        name: document.getElementById('pName').value.trim(),
        points: parseInt(document.getElementById('pPoints').value),
        mode: document.getElementById('pMode').value,
        tier1: document.getElementById('pTier1').value.trim(),
        tier2: document.getElementById('pTier2').value.trim()
    });
    localStorage.setItem('nn_players', JSON.stringify(players));
    document.getElementById('addPlayerForm').reset();
    renderTables();
});

window.deletePlayer = function(id) {
    const role = getUserRole(currentUser);
    if (role !== 'owner' && role !== 'moderator') return;
    if (confirm("Удалить игрока из базы?")) {
        players = players.filter(p => p.id !== id);
        localStorage.setItem('nn_players', JSON.stringify(players));
        renderTables();
    }
};

document.getElementById('playerSearch').addEventListener('input', (e) => { activeSearchQuery = e.target.value; renderTables(); });
document.querySelectorAll('.nav-link').forEach(link => { link.addEventListener('click', () => { document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active')); document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active')); link.classList.add('active'); document.getElementById(link.getAttribute('data-target')).classList.add('active'); }); });
document.querySelectorAll('.tab-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active')); btn.classList.add('active'); document.getElementById(btn.getAttribute('data-tab')).classList.add('active'); }); });
updateAuthUI();
renderTables();
