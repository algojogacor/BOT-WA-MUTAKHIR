// ╔══════════════════════════════════════════════════════════════╗
// ║           ALGOJO BOT WA v2.0 — index.js                    ║
// ║           Berdasarkan: Bot-WA-Termutakhir + Upgrade v2.0   ║
// ╚══════════════════════════════════════════════════════════════╝

// --- 1. IMPORT MODUL UTAMA (BAILEYS) ---
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const pino  = require('pino');
const fs    = require('fs');
const path  = require('path');
const { exec } = require('child_process');

// Database & Helpers
const { connectToCloud, loadDB, saveDB, addQuestProgress } = require('./helpers/database');
const { connectToDB }  = require('./helpers/mongodb');
const { MongoClient }  = require('mongodb');

// FFmpeg
const ffmpegStatic = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegStatic;

// ─── IMPORT COMMANDS ORIGINAL ────────────────────────────────────────
const timeMachineCmd = require('./commands/timemachine');
const economyCmd     = require('./commands/economy');
const adminAbuseCmd  = require('./commands/adminabuse');
const jobsCmd        = require('./commands/jobs');
const chartCmd       = require('./commands/chart');
const propertyCmd    = require('./commands/property');
const pabrikCommand  = require('./commands/pabrik');
const valasCmd       = require('./commands/valas');
const stocksCmd      = require('./commands/stocks');
const farmingCmd     = require('./commands/farming');
const ternakCmd      = require('./commands/ternak');
const miningCmd      = require('./commands/mining');
const devCmd         = require('./commands/developer');
const cryptoCmd      = require('./commands/crypto');
const bolaCmd        = require('./commands/bola');
const profileCmd     = require('./commands/profile');
const battleCmd      = require('./commands/battle');
const ttsCmd         = require('./commands/tts');
const gameTebakCmd   = require('./commands/gameTebak');
const nationCmd      = require('./commands/nation');
const rouletteCmd    = require('./commands/roulette');
const pdfCmd         = require('./commands/pdf');
const robCmd         = require('./commands/rob');
const wikiKnowCmd    = require('./commands/WikiKnow');
const adminCmd       = require('./commands/admin');
const aiCmd          = require('./commands/ai');
const slitherCmd     = require('./commands/slither_bridge');
const rpgCmd         = require('./commands/rpg_bridge');
const minesCmd       = require('./commands/mines');
const duelCmd        = require('./commands/duel');
const toolsCmd       = require('./commands/tools');
const caturCmd       = require('./commands/catur');
const imageCmd       = require('./commands/image');

// ─── IMPORT FITUR ORIGINAL (Tambahan) ────────────────────────────────
const aiToolsCmd   = require('./commands/aitools');
const moodCmd      = require('./commands/mood');
const triviaCmd    = require('./commands/trivia');
const wordleCmd    = require('./commands/wordle');
const akinatorCmd  = require('./commands/akinator');
const portoCmd     = require('./commands/portofolio');
const perkiraanCmd = require('./commands/prakiraan');
const bgToolsCmd   = require('./commands/bgtools');
const shortlinkCmd = require('./commands/shortlink');
const zodiakCmd    = require('./commands/zodiak');
const kreatifCmd   = require('./commands/kreatif');
const analitikCmd  = require('./commands/analitik');
const { trackCommand } = require('./commands/analitik');

// ─── IMPORT FITUR BARU v2.0 ───────────────────────────────────────────
const reminderCmd   = require('./commands/reminder');
const groupCmd      = require('./commands/group');
const kalkulatorCmd = require('./commands/kalkulator');
const beritaCmd     = require('./commands/berita');
const tiktokCmd     = require('./commands/tiktok');
const utilitasCmd   = require('./commands/utilitas');

// ─── CRON (Reminder Scheduler v2.0) ──────────────────────────────────
let cron;
try { cron = require('node-cron'); } catch(e) { cron = null; }

// ══════════════════════════════════════════════════════════════════════
// KONFIGURASI
// ══════════════════════════════════════════════════════════════════════

// Whitelist Grup — isi ALLOWED_GROUPS di .env untuk batasi grup
// Format: 120363xxx@g.us,120363yyy@g.us (pisah koma)
// Kosongkan untuk biarkan bot merespons semua grup
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || '')
    .split(',').map(g => g.trim()).filter(Boolean);

// Grup untuk logging TimeMachine
const LOGGING_GROUPS = (process.env.LOGGING_GROUPS || '')
    .split(',').map(g => g.trim()).filter(Boolean);

// Buat folder temp jika belum ada
if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true });

// ══════════════════════════════════════════════════════════════════════
// EXPRESS SERVER (Health Check & API Catur)
// ══════════════════════════════════════════════════════════════════════
const express = require('express');
const cors    = require('cors');
const app     = express();
const port    = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve folder public_catur (game catur browser)
app.use('/game', express.static(path.join(__dirname, 'public_catur')));

// API: Terima hasil game catur dari browser
app.post('/api/catur-finish', async (req, res) => {
    const { user, result, bet, level } = req.body;

    const db = global.db;
    if (!db || !db.users) return res.status(503).json({ status: 'error', message: 'Database bot belum siap.' });
    if (!db.users[user])  return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });

    const userData   = db.users[user];
    const taruhan    = parseInt(bet)   || 0;
    const difficulty = parseInt(level) || 2;
    let prize = 0, text = '';

    if (result === 'win') {
        const multiplier = difficulty === 3 ? 1.3 : 1.2;
        prize = Math.floor(taruhan * multiplier);
        text  = `🎉 MENANG (${difficulty === 3 ? 'Hard' : 'Medium'})!\n💰 Total: ${prize.toLocaleString('id-ID')}\n📈 Profit: ${(prize - taruhan).toLocaleString('id-ID')}`;
    } else if (result === 'draw') {
        prize = taruhan;
        text  = `🤝 Seri! ${prize.toLocaleString('id-ID')} dikembalikan.`;
    } else {
        text = `💀 Kalah. ${taruhan.toLocaleString('id-ID')} hangus.`;
    }

    userData.balance = (userData.balance || 0) + prize;
    if (typeof saveDB === 'function') await saveDB(global.db);

    res.json({ status: 'ok', message: text, newBalance: userData.balance });
    console.log(`[CATUR] ${user} → ${result} (Level:${difficulty}, Bet:${taruhan}, Prize:${prize})`);
});

app.get('/', (req, res) => res.json({
    status: 'running', bot: 'Algojo Bot WA v2.0',
    uptime: Math.floor(process.uptime()) + 's',
    users: global.db ? Object.keys(global.db.users || {}).length : 0,
}));
app.get('/health', (req, res) => res.send('OK'));

app.listen(port, () => console.log(`🌐 Server jalan di port ${port}`));

// ══════════════════════════════════════════════════════════════════════
// REMINDER SCHEDULER v2.0 — cek setiap menit
// ══════════════════════════════════════════════════════════════════════
function startReminderScheduler(sock) {
    const checkReminders = async () => {
        const db = global.db;
        if (!db || !db.reminders) return;
        const now = Date.now();
        let changed = false;
        for (const [id, r] of Object.entries(db.reminders)) {
            if (r.time > now) continue;
            try {
                await sock.sendMessage(r.jid, {
                    text: `⏰ *PENGINGAT!*\n\n📌 *${r.text}*\n\n_Diset: ${new Date(r.created).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`,
                    mentions: [r.sender]
                });
            } catch(e) { console.error('[Reminder]', e.message); }
            delete db.reminders[id];
            changed = true;
        }
        if (changed) saveDB(db);
    };

    if (cron) {
        cron.schedule('* * * * *', checkReminders);
        console.log('✅ Reminder scheduler aktif');
    } else {
        setInterval(checkReminders, 60000);
        console.log('⚠️  node-cron tidak ada, reminder pakai setInterval');
    }
}

// ══════════════════════════════════════════════════════════════════════
// ANTI-SPAM TRACKER v2.0
// ══════════════════════════════════════════════════════════════════════
const spamMap = new Map();
function cekSpam(senderJid, groupJid) {
    if (!global.db?.groups?.[groupJid]?.antispam) return false;
    const key = `${groupJid}_${senderJid}`, now = Date.now();
    const t   = spamMap.get(key) || { count: 0, lastTime: 0 };
    if (now - t.lastTime < 5000) { t.count++; if (t.count >= 7) { spamMap.set(key, t); return true; } }
    else t.count = 1;
    t.lastTime = now; spamMap.set(key, t); return false;
}

// ══════════════════════════════════════════════════════════════════════
// KONEKSI WHATSAPP
// ══════════════════════════════════════════════════════════════════════
async function startBot() {
    // 1. DATABASE
    try {
        console.log('🔄 Menghubungkan ke MongoDB Atlas...');
        await connectToCloud();
        global.db = await loadDB();
        if (!global.db.users)     global.db.users     = {};
        if (!global.db.groups)    global.db.groups     = {};
        if (!global.db.market)    global.db.market     = { commodities: {} };
        if (!global.db.settings)  global.db.settings   = {};
        if (!global.db.reminders) global.db.reminders  = {};
        if (!global.db.analytics) global.db.analytics  = { commands: {}, totalMessages: 0 };
        console.log('✅ Database Terhubung!');
    } catch(err) {
        console.error('⚠️ GAGAL KONEK DB:', err.message);
        global.db = { users: {}, groups: {}, market: {}, settings: {}, reminders: {}, analytics: { commands: {}, totalMessages: 0 } };
    }

    // 2. BAILEYS
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`🤖 WA Version: v${version.join('.')} (Latest: ${isLatest})`);

    const { state, saveCreds } = await useMultiFileAuthState('auth_baileys');

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
        },
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        connectTimeoutMs: 60000, keepAliveIntervalMs: 10000,
        retryRequestDelayMs: 5000, syncFullHistory: false,
        generateHighQualityLinkPreview: true,
    });

    // ── Connection Update ──────────────────────────────────────
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) console.log('\n📲 Scan QR code di atas!');
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`❌ Koneksi terputus. Reason: ${reason}`);
            if (reason === DisconnectReason.loggedOut) {
                if (fs.existsSync('./auth_baileys')) fs.rmSync('./auth_baileys', { recursive: true, force: true });
                startBot();
            } else if (reason === 515) {
                setTimeout(() => startBot(), 2000);
            } else {
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === 'open') {
            console.log('\n' + '═'.repeat(50));
            console.log('✅ ALGOJO BOT v2.0 SIAP! 🚀');
            console.log('═'.repeat(50) + '\n');
            if (!global.abuseState) global.abuseState = { active: false };
            startReminderScheduler(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ── Welcome / Goodbye Handler v2.0 ────────────────────────
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            const gs = global.db?.groups?.[id] || {};
            for (const p of participants) {
                const num = p.split('@')[0];
                if (action === 'add' && gs.welcome && gs.welcomeMsg)
                    await sock.sendMessage(id, { text: gs.welcomeMsg.replace(/{name}/g, `@${num}`), mentions: [p] });
                if (action === 'remove' && gs.goodbyeMsg)
                    await sock.sendMessage(id, { text: gs.goodbyeMsg.replace(/{name}/g, `@${num}`), mentions: [p] });
            }
        } catch(e) { console.error('[group-participants]', e.message); }
    });

    // ── MESSAGE HANDLER ────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message) return;

        try {
            const remoteJid = m.key.remoteJid;
            const isGroup   = remoteJid.endsWith('@g.us');
            const sender    = isGroup ? (m.key.participant || m.participant) : remoteJid;
            const pushName  = m.pushName || 'Tanpa Nama';
            const msgType   = Object.keys(m.message)[0];
            const body      = m.message.conversation
                           || m.message.extendedTextMessage?.text
                           || m.message.imageMessage?.caption
                           || m.message.videoMessage?.caption || '';

            // AdminAbuse Interactive
            if (isGroup && global.abuseState?.active) {
                await adminAbuseCmd.handleInteractive(body, sender, remoteJid, global.db)
                    .catch(e => console.error('[AdminAbuse Interactive]', e.message));
                if (global.abuseState.currentEvent === 'lomba_aktif' &&
                    global.abuseState.eventData?.lombaActive && body) {
                    const skor = global.abuseState.eventData.lombaSkor;
                    if (!skor[sender]) skor[sender] = 0;
                    skor[sender]++;
                }
            }

            if (body) console.log(`📨 ${pushName}: ${body.slice(0, 40)}`);

            const hasMedia = ['imageMessage','videoMessage','documentMessage'].includes(msgType);

            // Chat Wrapper (kompatibel dengan command lama)
            const chat = {
                id: { _serialized: remoteJid }, isGroup,
                sendMessage: async (content) => {
                    await sock.sendMessage(remoteJid, typeof content === 'string' ? { text: content } : content);
                }
            };

            // Msg Wrapper
            const msg = {
                body, from: remoteJid, author: sender, pushName, hasMedia, type: msgType,
                getChat: async () => chat,
                react:   async (emoji) => await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } }),
                reply:   async (text)  => await sock.sendMessage(remoteJid, { text: text + '' }, { quoted: m }),
                key: m.key, message: m.message, isGroup,
                extendedTextMessage: m.message.extendedTextMessage,
            };

            // !idgrup / !id tanpa whitelist
            if (body === '!idgrup') return msg.reply(`🆔 *ID GRUP:* \`${remoteJid}\``);
            if (body === '!id' || body === '!cekid') return msg.reply(`🆔 Chat: \`${remoteJid}\`\nUser: \`${sender}\``);

            // Hanya grup
            if (!isGroup) return;

            // Whitelist Grup
            if (ALLOWED_GROUPS.length > 0 && !ALLOWED_GROUPS.includes(remoteJid)) return;

            // v2.0 Anti-Link
            if (global.db?.groups?.[remoteJid]?.antilink) {
                const hasLink = /(https?:\/\/|wa\.me\/|bit\.ly\/|t\.me\/|youtu\.be\/)/i.test(body);
                if (hasLink) {
                    let isAdmin = false;
                    try {
                        const meta = await sock.groupMetadata(remoteJid);
                        isAdmin = meta.participants.find(p => p.id === sender)?.admin != null;
                    } catch {}
                    if (!isAdmin) {
                        await sock.sendMessage(remoteJid, { delete: m.key }).catch(() => {});
                        await sock.sendMessage(remoteJid, { text: `🚫 @${sender.split('@')[0]} dilarang kirim link!`, mentions: [sender] });
                        return;
                    }
                }
            }

            // v2.0 Anti-Spam
            if (cekSpam(sender, remoteJid)) {
                await sock.sendMessage(remoteJid, { delete: m.key }).catch(() => {});
                await sock.groupParticipantsUpdate(remoteJid, [sender], 'remove').catch(() => {});
                await sock.sendMessage(remoteJid, { text: `⚠️ @${sender.split('@')[0]} di-kick karena spam!`, mentions: [sender] });
                return;
            }

            // ══════════════════════════════════════════════════
            // DATABASE & USER SETUP (sama dengan original)
            // ══════════════════════════════════════════════════
            const db = global.db;
            if (!db.users)  db.users  = {};
            if (!db.market) db.market = {};

            const today = new Date().toISOString().split('T')[0];
            const defaultQuest = {
                daily: [
                    { id: 'chat',    name: 'Ngobrol Aktif', progress: 0, target: 10, reward: 200,  claimed: false },
                    { id: 'game',    name: 'Main Casino',   progress: 0, target: 3,  reward: 300,  claimed: false },
                    { id: 'sticker', name: 'Bikin Stiker',  progress: 0, target: 2,  reward: 150,  claimed: false },
                ],
                weekly: { id: 'weekly', name: 'Weekly Warrior', progress: 0, target: 100, reward: 2000, claimed: false },
                lastReset: today,
            };

            // Register User Baru
            if (!db.users[sender]) {
                const totalUsers = Object.keys(db.users).length;
                db.users[sender] = {
                    id: totalUsers + 1, name: pushName || 'User',
                    balance: 15000000, bank: 0, debt: 0, xp: 0, level: 1,
                    hp: 100, hunger: 100, energy: 100,
                    lastLifeUpdate: Date.now(), isDead: false,
                    inv: [], buffs: {}, lastDaily: 0,
                    bolaWin: 0, bolaTotal: 0, bolaProfit: 0,
                    crypto: {}, quest: JSON.parse(JSON.stringify(defaultQuest)),
                    forex: { usd: 0, eur: 0, jpy: 0, emas: 0 },
                    ternak: [], ternak_inv: { dedak: 0, pelet: 0, premium: 0, obat: 0 },
                    farm: { plants: [], inventory: {}, machines: [], processing: [] },
                    job: null, lastWork: 0, lastSkill: 0,
                    // v2.0
                    aiMemory: [], aiFullHistory: [], aiPersona: 'default',
                    aiStats: { totalMessages: 0, totalChars: 0, firstChatDate: null },
                };
                console.log(`[NEW USER] ${pushName} registered`);
            }

            const user = db.users[sender];
            if (!user) return;

            user.lastSeen = Date.now();
            user.name     = pushName || user.name || 'User';

            // Auto-fix field
            if (!user.id)         user.id         = Object.keys(db.users).indexOf(sender) + 1;
            if (!user.balance)    user.balance     = 0;
            if (!user.bank)       user.bank        = 0;
            if (!user.debt)       user.debt        = 0;
            if (!user.crypto)     user.crypto      = {};
            if (!user.quest)      user.quest       = JSON.parse(JSON.stringify(defaultQuest));
            if (!user.forex)      user.forex       = { usd: 0, eur: 0, jpy: 0, emas: 0 };
            if (!user.ternak)     user.ternak      = [];
            if (!user.ternak_inv) user.ternak_inv  = { dedak: 0, pelet: 0, premium: 0, obat: 0 };
            if (!user.farm)       user.farm        = { plants: [], inventory: {}, machines: [], processing: [] };
            if (!user.mining)     user.mining      = { racks: [], lastClaim: 0, totalHash: 0 };
            if (!user.job)        user.job         = null;
            if (!user.lastWork)   user.lastWork    = 0;
            if (!user.aiMemory)   user.aiMemory    = [];
            if (!user.aiPersona)  user.aiPersona   = 'default';
            if (!user.aiStats)    user.aiStats     = { totalMessages: 0, totalChars: 0, firstChatDate: null };

            // Life System (HP decay)
            const now2 = Date.now();
            if (typeof user.hp     === 'undefined') user.hp     = 100;
            if (typeof user.hunger === 'undefined') user.hunger = 100;
            if (typeof user.energy === 'undefined') user.energy = 100;
            if (!user.lastLifeUpdate) user.lastLifeUpdate = now2;
            if (typeof user.isDead === 'undefined') user.isDead = false;

            if (db.settings?.lifeSystem !== false && !user.isDead) {
                const diffMin = Math.floor((now2 - user.lastLifeUpdate) / 60000);
                if (diffMin > 0) {
                    user.hunger = Math.max(0, user.hunger - diffMin * 2);
                    user.energy = Math.max(0, user.energy - diffMin * 1);
                    if (user.hunger === 0) user.hp -= diffMin * 5;
                    if (user.hp <= 0) {
                        user.hp = 0; user.isDead = true;
                        user.balance = Math.floor(user.balance * 0.8);
                        await sock.sendMessage(remoteJid, {
                            text: `💀 *@${sender.split('@')[0]} MATI KELAPARAN!*\nSaldo -20%.\nKetik !rs untuk hidup kembali.`,
                            mentions: [sender]
                        });
                    }
                    user.lastLifeUpdate = now2;
                }
            }

            // Anti Toxic
            const toxicWords = ['anjing','kontol','memek','goblok','idiot','babi','tolol','ppq','jembut'];
            if (toxicWords.some(k => body.toLowerCase().includes(k)))
                return msg.reply('⚠️ Jaga ketikan bro, jangan toxic!');

            // Daily Reset
            if (user.quest?.lastReset !== today) {
                user.quest.daily.forEach(q => { q.progress = 0; q.claimed = false; });
                user.quest.lastReset = today;
                user.dailyIncome = 0;
                user.dailyUsage  = 0;
            }
            if (typeof user.dailyIncome === 'undefined') user.dailyIncome = 0;
            if (user.buffs) {
                for (const k in user.buffs)
                    if (user.buffs[k].active && Date.now() >= user.buffs[k].until)
                        user.buffs[k].active = false;
            }

            // XP & Leveling
            user.xp += user.buffs?.xp?.active ? 5 : 2;
            if (user.quest.weekly && !user.quest.weekly.claimed) user.quest.weekly.progress++;
            const nextLvl = Math.floor(user.xp / 100) + 1;
            if (nextLvl > user.level) {
                user.level = nextLvl;
                msg.reply(`🎊 *LEVEL UP!* Sekarang Level *${user.level}*`);
            }
            addQuestProgress(user, 'chat');

            // Analytics v2.0
            if (db.analytics) {
                db.analytics.totalMessages = (db.analytics.totalMessages || 0) + 1;
            }

            // TimeMachine Logger
            if (LOGGING_GROUPS.includes(remoteJid) && body && !body.startsWith('!') && !body.startsWith('.')) {
                if (!db.chatLogs) db.chatLogs = {};
                if (!db.chatLogs[remoteJid]) db.chatLogs[remoteJid] = [];
                db.chatLogs[remoteJid].push({ t: Date.now(), u: pushName, m: body });
            }

            // ══════════════════════════════════════════════════
            // PARSE COMMAND
            // ══════════════════════════════════════════════════
            const isCommand = body.startsWith('!');
            const args      = isCommand ? body.slice(1).trim().split(/ +/) : [];
            const command   = isCommand ? args.shift().toLowerCase() : '';

            if (command && db.analytics) {
                try { trackCommand(command, sender, db); } catch(e) {}
                if (!db.analytics.commands) db.analytics.commands = {};
                db.analytics.commands[command] = (db.analytics.commands[command] || 0) + 1;
            }

            // ══════════════════════════════════════════════════
            // NON-PREFIX MODULES
            // ══════════════════════════════════════════════════
            await pdfCmd(command, args, msg, sender, sock)
                .catch(e => console.error('[PDF]', e.message));
            await gameTebakCmd(command, args, msg, user, db, body)
                .catch(e => console.error('[GameTebak]', e.message));

            if (!isCommand) return;

            // ══════════════════════════════════════════════════
            // MENU UTAMA (ditangani di index.js, sama dengan original)
            // ══════════════════════════════════════════════════
            if (command === 'menu' || command === 'help') {
                const sub = (args[0] || '').toLowerCase();
                const bal = Math.floor(user?.balance || 0).toLocaleString('id-ID');
                const hp  = user?.hp     ?? 100;
                const nrg = user?.energy ?? 100;
                const lvl = user?.level  ?? 1;
                const xp  = (user?.xp   || 0).toLocaleString('id-ID');
                const bar = (val, max = 100, len = 8) => {
                    const fill = Math.round((Math.min(val, max) / max) * len);
                    return '█'.repeat(Math.max(0, fill)) + '░'.repeat(Math.max(0, len - fill));
                };

                if (!sub) return msg.reply(
`┌──────────────────────────────┐
│   ⚙️  *BOT MULTIFUNGSI*  ⚙️   │
└──────────────────────────────┘

👤 *!menu profil*  — Level, daily, inv, quest, ranking

🏦 *!menu bank*    — Saldo, transfer, pinjam, rob

❤️ *!menu nyawa*   — HP, makan, tidur, RS, AFK mode

🎮 *!menu game*    — Casino, slot, roulette, duel, mines

⚽ *!menu bola*    — Sport betting: 1X2, HDP, O/U, Parlay

🌾 *!menu farming* — Pertanian, pabrik, industri

🐄 *!menu ternak*  — Peternakan, pakan, jual hewan

⛏️ *!menu mining*  — VGA rig, BTC, trading crypto

📈 *!menu investasi*— Saham, valas, emas, properti

💼 *!menu jobs*    — Lowongan, gaji, skill

🏳️ *!menu negara*  — Buat negara, perang, militer

🎉 *!menu event*   — Admin Abuse 30 menit 12 event

🧠 *!menu ai*      — AI tiers, tanya apa saja

🛠️ *!menu tools*   — Stiker, PDF, TTS, steganografi

⏰ *!menu reminder* — Alarm, pengingat jadwal, bayar tagihan

👥 *!menu group* — Admin tools, antilink, welcome

🧮 *!menu kalkulator*— Hitung MTK, konversi, BMI, cicilan

📰 *!menu info* — Berita harian, cuaca kota, kurs uang

🔧 *!menu utilitas* — Bikin QR, password, IP/Ping, TT Downloader

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Saldo : *Rp ${bal}*
❤️ HP    : [${bar(hp)}] ${hp}%
⚡ Energi: [${bar(nrg)}] ${nrg}%
🎖️ Level : ${lvl}  |  XP: ${xp}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Ketik !menu <kategori> untuk detail_
_Contoh: !menu game  |  !menu bola_`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu profil
                // ════════════════════════════════════════════════
                if (['profil', 'profile', 'akun', 'user'].includes(sub)) {
                    return msg.reply(
`👤 *PROFIL & AKUN*
${'─'.repeat(30)}

📊 *CEK STATUS*
• !me / !profile      → Profil lengkap (HP, saldo, job, level)
• !rank               → XP, level & progress naik level
• !inv / !tas         → Inventory item & buff aktif
• !quest / !misi      → Misi harian & mingguan
• !skill              → Skill bonus dari pekerjaanmu

🎁 *KLAIM HARIAN*
• !daily              → Klaim bonus harian (reset tiap 24 jam)
• !kerja / !work      → Klaim gaji pekerjaan

🏆 *RANKING*
• !top / !leaderboard → Top 10 orang terkaya
• !topbola            → Ranking sport betting
• !topminer           → Ranking mining BTC
• !topnegara          → Ranking negara terkuat
• !dailyrank          → Ranking penghasilan hari ini

🛍️ *TOKO & ITEM*
• !shop               → Toko buff & item spesial
• !buy <id>           → Beli item dari toko
• !use <id>           → Aktifkan/gunakan item

🔗 *AKUN*
• !migrasi @akun_asli → Pindah data dari nomor lama
  _(Berguna saat ganti nomor WA)_

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu bank
                // ════════════════════════════════════════════════
                if (['bank', 'keuangan', 'duit'].includes(sub)) {
                    return msg.reply(
`🏦 *BANK & KEUANGAN*
${'─'.repeat(30)}

💳 *CEK SALDO & ASET*
• !me / !bank         → Cek saldo, hutang & info akun
• !dompet / !coin     → Cek saldo koin saja
• !pf / !porto        → Portofolio lengkap
• !aset               → Portofolio aset valas

💸 *TRANSAKSI*
• !depo <jml>         → Setor saldo ke bank
• !tarik <jml>        → Tarik saldo dari bank
• !tf @user <jml>     → Transfer ke user
                        ⚠️ Pajak 5%, maks 10 Juta/hari
• !give @user <jml>   → Kirim koin langsung (tanpa pajak)

🏧 *PINJAMAN*
• !pinjam <jml>       → Pinjam koin (Maks 5 Juta, Bunga 20%)
• !bayar <jml>        → Lunasi hutang
• !margin             → Pinjam dana margin (crypto)
• !paydebt            → Lunasi margin debt

🦹 *KRIMINAL*
• !rob @user          → Rampok orang lain
                        ⚠️ Butuh energi, denda 10% jika gagal
• !maling             → Curi random tanpa target

📊 *RANKING*
• !top / !leaderboard → Top 10 orang terkaya
• !dailyrank          → Ranking penghasilan harian

${'─'.repeat(30)}
⚠️ _Hutang tidak dibayar = saldo dipotong otomatis_
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu nyawa
                // ════════════════════════════════════════════════
                if (['nyawa', 'survival', 'life', 'hp'].includes(sub)) {
                    return msg.reply(
`❤️ *LIFE & SURVIVAL SYSTEM*
${'─'.repeat(30)}

📊 *STATUS KAMU SAAT INI*
• ❤️ HP     : [${bar(hp)}] ${hp}%
• ⚡ Energi : [${bar(nrg)}] ${nrg}%

📋 *CEK & PANTAU*
• !me                 → Cek HP, Lapar, Energi & Level
• !hidupstatus        → Status nyawa detail

⚠️ *MEKANISME BAHAYA*
┌─────────────────────────────┐
│ HP ≤ 30%  → ⚠️ Bahaya!     │
│ HP = 0    → 💀 MATI!        │
│ Mati      → Saldo -20%      │
└─────────────────────────────┘
_HP turun jika kamu lapar & kelelahan_

🍽️ *MAKAN & MINUM*
• !makan / !eat       → Makan (Biaya 50 Juta, isi lapar & HP)

😴 *ISTIRAHAT*
• !tidur <jam>        → Tidur 1-10 jam (isi energi & HP)
• !bangun / !wake     → Bangun paksa sebelum waktu habis

🏥 *PENGOBATAN*
• !rs                 → Berobat di Rumah Sakit
                        _(Biaya 500 Juta, HP full seketika)_
• !revive             → Hidup kembali setelah mati

🔕 *MODE AFK*
• !matistatus         → Aktifkan mode AFK (HP tidak turun)
                        _(Gunakan saat mau lama offline)_
• !nyalastatus        → Matikan mode AFK, aktifkan HP normal

💡 *TIPS BERTAHAN HIDUP*
✅ Makan & tidur rutin agar HP stabil
✅ Aktifkan !matistatus sebelum offline lama
✅ HP di bawah 30%? Langsung ke !rs
✅ Jangan pernah biarkan HP mencapai 0!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu game
                // ════════════════════════════════════════════════
                if (['game', 'games', 'judi', 'hiburan'].includes(sub)) {
                    return msg.reply(
`🎮 *GAMES & JUDI*
${'─'.repeat(30)}

🎰 *CASINO SOLO*
• !casino <jml>       → Tebak kartu (35% menang, x2)
• !slot <jml>         → Mesin slot
                        Pair 2x = +50% | Jackpot 3x = x75!
• !rolet <pil> <jml>  → Roulette Eropa (0-36)
                        Pilihan: merah|hitam|ganjil|genap|0-36
                        x2 warna/sifat | x15 tebak angka pas
• !tembok <bet> <1-3> → Tebak di balik 3 tembok (x2.5)
• !gacha              → Gacha item (200 koin, jackpot 10.000!)

💣 *MINESWEEPER*
• !bom / !mines <bet> → Mulai Minesweeper (12 kotak, 3 bom)
• !gali / !open <1-12>→ Buka kotak
• !stop / !cashout    → Ambil kemenangan & berhenti kapan saja
  _Makin banyak kotak dibuka = multiplier makin besar!_

⚔️ *PvP (LAWAN PLAYER)*
• !duel @user <bet>   → Russian Roulette 50:50
  └ !terima / !tolak  → Respon tantangan duel
  └ ⚠️ Pajak 10%, duel bonus +2 Juta saat event!
• !battle @user <bet> → Battle RPG Turn-based
  └ !terima           → Terima challenge battle
  └ !nyerah           → Menyerah (kehilangan taruhan)

🧠 *TEBAK BERHADIAH*
• !tebakgambar        → Tebak gambar dari petunjuk
• !asahotak           → Tebak kata dari asah otak
• !susunkata          → Susun huruf acak jadi kata
  └ !hint             → Minta petunjuk (reward berkurang)
  └ !nyerah           → Menyerah & lihat jawaban

🕹️ *MINI GAMES (Browser)*
• !rpg                → RPG turn-based lawan musuh AI
  └ !claim <kode>     → Klaim reward setelah menang
• !slither / !snake   → Main Snake Game di browser
  └ !claimslither <kode> → Klaim skor snake
• !catur <bet>        → Catur online di browser

⚽ *SPORT BETTING*
→ Ketik *!menu bola* untuk panduan lengkap

📌 _Semua game casino dipengaruhi event Winrate Gila_
📌 _(Saat event aktif: winrate naik jadi 85%!)_

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu bola  — Menu utama sportsbook
                // ════════════════════════════════════════════════
                if (['bola', 'sport', 'betting', 'parlay'].includes(sub)) {
                    return msg.reply(
`⚽ *SPORT BETTING — SPORTSBOOK*
${'─'.repeat(30)}

📚 *PANDUAN UNTUK PEMULA*
• *!menu bolaajar*    → 🔰 Apa itu judi bola? (BACA DULU!)
• *!menu odds*        → 📊 Cara baca odds & hitung untung
• *!menu 1x2*         → 🎯 Panduan taruhan 1X2 (termudah)
• *!menu hdp*         → ⚖️ Panduan Asian Handicap
• *!menu ou*          → 📈 Panduan Over/Under
• *!menu parlayajar*  → 🎰 Panduan Mix Parlay

${'─'.repeat(30)}
📋 *COMMAND TARUHAN*
• !bola               → Daftar semua match aktif
• !odds <ID>          → Detail odds suatu match
• !bet <ID> <jenis> <pil> <jml> → Pasang taruhan
• !parlay <ID> <jenis> <pil>    → Tambah leg parlay
• !parlaylihat        → Cek slip parlay kamu
• !parlaybet <jml>    → Pasang parlay
• !parlaybatal        → Kosongkan slip
• !mybets             → Riwayat taruhan
• !topbola            → Leaderboard profit

${'─'.repeat(30)}
🔧 *ADMIN*
• !updatebola | !addbola | !resultbola
• !tutupbola | !hapusbola

_Belum paham? Ketik *!menu bolaajar* dulu!_`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu bolaajar — Pengenalan judi bola untuk pemula
                // ════════════════════════════════════════════════
                if (sub === 'bolaajar') {
                    return msg.reply(
`🔰 *PANDUAN JUDI BOLA UNTUK PEMULA*
${'─'.repeat(30)}

*Apa itu Judi Bola?*
Kamu menebak hasil pertandingan sepak bola,
lalu memasang sejumlah uang. Jika tebakanmu
benar → kamu dapat uang berlipat.
Jika salah → uang yang dipasang hangus.

${'─'.repeat(30)}
🎯 *ADA 3 JENIS TARUHAN DI SINI:*

1️⃣ *1X2* (Paling mudah, cocok untuk pemula)
   → Tebak siapa yang menang/seri
   → Ketik *!menu 1x2* untuk penjelasan

2️⃣ *Asian Handicap (HDP)* (Menengah)
   → Sistem voor agar taruhan lebih seimbang
   → Ketik *!menu hdp* untuk penjelasan

3️⃣ *Over/Under (O/U)* (Menengah)
   → Tebak total gol lebih banyak atau sedikit
   → Ketik *!menu ou* untuk penjelasan

🎰 *Mix Parlay* (Lanjutan, potensi besar!)
   → Gabung beberapa pertandingan sekaligus
   → Ketik *!menu parlayajar* untuk penjelasan

${'─'.repeat(30)}
📊 *APA ITU ODDS?*
Odds = angka pengali kemenanganmu.

Contoh: kamu bet Rp 100.000 dengan odds *1.85*
→ Jika menang: dapat Rp 100.000 × 1.85 = *Rp 185.000*
→ Untung bersih: Rp 185.000 - Rp 100.000 = *Rp 85.000*
→ Jika kalah: Rp 100.000 hangus

Makin besar odds = makin besar untung,
tapi biasanya makin kecil kemungkinan menang.

→ Ketik *!menu odds* untuk penjelasan lebih dalam

${'─'.repeat(30)}
⚠️ *PERINGATAN PENTING!*
❗ Judi bola mengandung risiko kehilangan uang
❗ Jangan pasang uang yang tidak siap hilang
❗ Mulai dari taruhan kecil dulu untuk belajar

${'─'.repeat(30)}
*Navigasi Panduan:*
• !menu 1x2       → Mulai dari yang termudah
• !menu odds      → Cara baca odds
• !menu hdp       → Asian Handicap
• !menu ou        → Over/Under
• !menu parlayajar → Mix Parlay
↩️ Balik: *!menu bola*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu odds — Cara baca dan hitung odds
                // ════════════════════════════════════════════════
                if (sub === 'odds') {
                    return msg.reply(
`📊 *CARA MEMBACA & MENGHITUNG ODDS*
${'─'.repeat(30)}

*Odds* adalah angka yang menunjukkan berapa
kali lipat uangmu jika menang.

${'─'.repeat(30)}
📐 *RUMUS SEDERHANA:*

  💰 Hasil = Taruhan × Odds
  📈 Untung = Hasil - Taruhan

${'─'.repeat(30)}
🧮 *CONTOH PERHITUNGAN:*

Pertandingan: *Man City vs Arsenal*
Odds yang tersedia:
  🏠 Man City menang : *1.75*
  🤝 Seri            : *3.50*
  ✈️ Arsenal menang  : *4.20*

Kamu bet *Rp 200.000* untuk Man City menang:
  ✅ Jika Man City menang:
     200.000 × 1.75 = *Rp 350.000*
     Untung bersih = *+Rp 150.000*
  ❌ Jika Seri atau Arsenal menang:
     Uang Rp 200.000 *hangus*

${'─'.repeat(30)}
🔍 *CARA BACA ODDS — ARTINYA APA?*

  Odds *1.10 - 1.40* → Favorit berat
  _(Kemungkinan menang besar, untung sedikit)_

  Odds *1.70 - 2.10* → Tim kuat tapi bisa kalah
  _(Kemungkinan menang lumayan, untung lumayan)_

  Odds *2.50 - 4.00* → Tim seimbang / underdog
  _(Kemungkinan menang kecil, untung besar)_

  Odds *5.00 ke atas* → Underdog besar
  _(Jarang menang tapi jika menang = jackpot!)_

${'─'.repeat(30)}
💡 *TIPS MEMBACA ODDS:*
✅ Odds rendah (1.xx) = tim lebih diunggulkan
✅ Odds tinggi (3.xx+) = tim kurang diunggulkan
✅ Seri selalu punya odds tinggi (~3.40)
   karena hasil seri lebih jarang terjadi
✅ Pakai !odds <ID> untuk lihat odds lengkap
   sebelum memasang taruhan

${'─'.repeat(30)}
*Lanjut belajar:*
• !menu 1x2        → Jenis taruhan termudah
• !menu hdp        → Asian Handicap
• !menu ou         → Over/Under
↩️ Balik: *!menu bola*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu 1x2 — Panduan taruhan 1X2
                // ════════════════════════════════════════════════
                if (sub === '1x2') {
                    return msg.reply(
`🎯 *PANDUAN TARUHAN 1X2*
${'─'.repeat(30)}

*1X2 adalah jenis taruhan PALING MUDAH.*
Kamu hanya perlu tebak salah satu dari 3:
  *1* = Tim Home (tuan rumah) menang
  *X* = Seri / Draw
  *2* = Tim Away (tamu) menang

${'─'.repeat(30)}
📋 *CONTOH NYATA:*

Pertandingan: *Liverpool (H) vs Chelsea (A)*

Odds yang muncul di !odds:
  🏠 Liverpool menang : *1.85*
  🤝 Seri             : *3.40*
  ✈️ Chelsea menang   : *4.00*

${'─'.repeat(30)}
🧮 *SIMULASI TARUHAN Rp 500.000:*

Pilihan A → Liverpool menang (odds 1.85)
  ✅ Jika Liverpool menang:
     500.000 × 1.85 = *Rp 925.000*
     Untung = *+Rp 425.000*
  ❌ Jika seri/Chelsea menang = hangus

Pilihan B → Seri (odds 3.40)
  ✅ Jika seri:
     500.000 × 3.40 = *Rp 1.700.000*
     Untung = *+Rp 1.200.000*
  ❌ Jika ada yang menang = hangus

Pilihan C → Chelsea menang (odds 4.00)
  ✅ Jika Chelsea menang:
     500.000 × 4.00 = *Rp 2.000.000*
     Untung = *+Rp 1.500.000*
  ❌ Jika Liverpool/seri = hangus

${'─'.repeat(30)}
⌨️ *CARA PASANG TARUHAN 1X2:*

  Misal ID matchnya *LV12*
  !bet LV12 1x2 h 500000  → Bet Home menang
  !bet LV12 1x2 d 500000  → Bet Seri
  !bet LV12 1x2 a 500000  → Bet Away menang

  *h* = Home (tuan rumah)
  *d* = Draw (seri)
  *a* = Away (tamu)

${'─'.repeat(30)}
💡 *STRATEGI UNTUK PEMULA:*
✅ Pilih tim yang jelas lebih kuat (odds rendah)
   → Kemungkinan menang lebih besar
✅ Hindari bet seri jika tidak yakin
   → Seri paling susah diprediksi
✅ Jangan bet Away jika odds terlalu tinggi (>5)
   → Risiko terlalu besar

${'─'.repeat(30)}
*Lanjut belajar:*
• !menu hdp        → Asian Handicap
• !menu ou         → Over/Under
• !menu parlayajar → Mix Parlay
↩️ Balik: *!menu bola*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu hdp — Panduan Asian Handicap
                // ════════════════════════════════════════════════
                if (sub === 'hdp') {
                    return msg.reply(
`⚖️ *PANDUAN ASIAN HANDICAP (HDP)*
${'─'.repeat(30)}

*Handicap* = sistem voor (keunggulan buatan)
yang diberikan kepada tim yang lebih lemah
supaya taruhan jadi lebih adil & menarik.

Tim favorit diberi *handicap minus (-)*
artinya mereka harus menang dengan selisih
gol tertentu agar kamu bisa menang.

${'─'.repeat(30)}
🔢 *JENIS-JENIS GARIS HANDICAP:*

*HDP 0 (Pur-pur)*
→ Tidak ada voor. Jika seri = taruhan refund.

*HDP -0.5 (Home voor 0.5)*
→ Home harus menang minimal 1 gol.
   Jika seri → bet Home KALAH, bet Away MENANG

*HDP -1 (Home voor 1)*
→ Home harus menang minimal 2 gol.
   Jika Home menang 1-0 → SERI = refund
   Jika Home menang 2-0 → bet Home MENANG

*HDP -1.5 (Home voor 1.5)*
→ Home harus menang minimal 2 gol.
   Tidak ada kemungkinan refund.

*HDP -0.25 (Home voor 0.25)*
→ Setengah kemenangan/kekalahan berlaku.
   Jika Seri → bet Home kalah SETENGAH (refund 50%)

${'─'.repeat(30)}
🧮 *CONTOH PRAKTEK:*

Match: *Real Madrid (H) vs Atletico (A)*
Odds HDP: Home -1 | Home odds 1.90 | Away odds 1.90
_(Artinya Real Madrid diunggulkan menang 2 gol+)_

Kamu bet *Rp 200.000* untuk Home (Real Madrid -1):

Skenario hasil pertandingan:
  Real Madrid menang 3-0 (selisih 3)
  → -1 sudah terpenuhi ✅ = *MENANG*
  → Dapat: 200.000 × 1.90 = *Rp 380.000*

  Real Madrid menang 2-1 (selisih 1)
  → -1 TIDAK terpenuhi ❌ = *KALAH*
  → Uang hangus

  Real Madrid menang 1-0 (selisih 1 tepat)
  → Adjusted score: 1-0-1 = 0-0 = SERI
  → *REFUND* (uang kembali penuh)

  Seri 0-0 atau Away menang
  → *KALAH*

${'─'.repeat(30)}
⌨️ *CARA PASANG HANDICAP:*

  !bet LV12 hdp h 200000  → Bet Home (tim unggul/diberi handicap)
  !bet LV12 hdp a 200000  → Bet Away (tim yang dapat voor)

💡 *TIPS HANDICAP:*
✅ Bet Away jika kamu pikir tim lemah bisa
   menahan atau menang melawan tim kuat
✅ HDP kecil (0 atau 0.25) = risiko lebih aman
✅ HDP besar (-1.5 ke atas) = butuh selisih gol banyak

${'─'.repeat(30)}
*Lanjut belajar:*
• !menu ou         → Over/Under
• !menu parlayajar → Mix Parlay
↩️ Balik: *!menu bola*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu ou — Panduan Over/Under
                // ════════════════════════════════════════════════
                if (sub === 'ou') {
                    return msg.reply(
`📈 *PANDUAN OVER/UNDER (O/U)*
${'─'.repeat(30)}

*Over/Under* = menebak apakah TOTAL GOL
kedua tim lebih banyak (Over) atau lebih
sedikit (Under) dari garis yang ditentukan.

Kamu TIDAK perlu tebak siapa yang menang!
Yang penting total gol sesuai pilihanmu.

${'─'.repeat(30)}
🔢 *CONTOH GARIS O/U:*

Garis *2.5*:
  Over  → total gol MINIMAL 3 (✅ jika 3,4,5,6...)
  Under → total gol MAKSIMAL 2 (✅ jika 0,1,2)
  _(Tidak mungkin refund di garis .5)_

Garis *3.0*:
  Over  → total gol MINIMAL 4 (✅ jika 4,5,6...)
  Under → total gol MAKSIMAL 2 (✅ jika 0,1,2)
  *Tepat 3 gol → REFUND*

Garis *3.5*:
  Over  → total gol MINIMAL 4 (✅ jika 4,5,6...)
  Under → total gol MAKSIMAL 3 (✅ jika 0,1,2,3)
  _(Tidak mungkin refund di garis .5)_

${'─'.repeat(30)}
🧮 *CONTOH PRAKTEK:*

Match: *Barcelona vs PSG*
O/U Line: *2.5* | Over odds: 1.90 | Under odds: 1.90

Kamu bet *Rp 300.000* untuk Over 2.5:

Hasil pertandingan:
  Skor 2-1 (total 3 gol)   → 3 > 2.5 ✅ = *MENANG*
  Skor 3-2 (total 5 gol)   → 5 > 2.5 ✅ = *MENANG*
  Skor 1-1 (total 2 gol)   → 2 < 2.5 ❌ = *KALAH*
  Skor 0-0 (total 0 gol)   → 0 < 2.5 ❌ = *KALAH*
  Skor 1-0 (total 1 gol)   → 1 < 2.5 ❌ = *KALAH*

Jika MENANG: 300.000 × 1.90 = *Rp 570.000*
Untung bersih: *+Rp 270.000*

${'─'.repeat(30)}
⌨️ *CARA PASANG O/U:*

  !bet LV12 ou o 300000  → Bet Over (banyak gol)
  !bet LV12 ou u 300000  → Bet Under (sedikit gol)

💡 *TIPS OVER/UNDER:*
✅ Pertandingan dua tim ofensif → pilih Over
   (Contoh: PSG vs Man City, Liverpool vs Arsenal)
✅ Pertandingan defensive → pilih Under
   (Contoh: Atletico vs Juventus, final piala)
✅ Garis 2.5 paling populer — paling sering dipakai
✅ Garis desimal (.5) tidak ada refund, lebih simpel

${'─'.repeat(30)}
*Lanjut belajar:*
• !menu parlayajar → Mix Parlay
↩️ Balik: *!menu bola*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu parlayajar — Panduan Mix Parlay
                // ════════════════════════════════════════════════
                if (sub === 'parlayajar') {
                    return msg.reply(
`🎰 *PANDUAN MIX PARLAY*
${'─'.repeat(30)}

*Mix Parlay* = menggabungkan BEBERAPA taruhan
dari pertandingan BERBEDA menjadi 1 tiket.

✅ Semua pilihan HARUS benar untuk menang
❌ Satu saja salah = SEMUA KALAH

Keunggulannya: Odds DIKALI semua!
→ Modal kecil bisa untung SANGAT besar!

${'─'.repeat(30)}
🧮 *CONTOH PERHITUNGAN PARLAY:*

Kamu pilih 3 pertandingan:
  Match 1: Man City menang   | odds *1.75*
  Match 2: Over 2.5 gol      | odds *1.90*
  Match 3: Real Madrid menang | odds *1.80*

Total odds parlay = 1.75 × 1.90 × 1.80 = *5.985*

Modal: *Rp 100.000*
  ✅ Jika SEMUA 3 benar:
     100.000 × 5.985 = *Rp 598.500*
     Untung bersih = *+Rp 498.500*
  ❌ Jika salah 1 saja:
     Rp 100.000 *hangus*

${'─'.repeat(30)}
📈 *POTENSI DENGAN 5 LEG:*

  Odds rata-rata 1.85 per leg:
  Total odds = 1.85⁵ = *22.18*
  Modal Rp 100.000 → Dapat *Rp 2.218.000*!

  Odds rata-rata 1.85 per leg (8 leg maksimal):
  Total odds = 1.85⁸ = *111*
  Modal Rp 100.000 → Dapat *Rp 11.100.000*!

${'─'.repeat(30)}
⌨️ *CARA PASANG MIX PARLAY STEP BY STEP:*

*Step 1:* Lihat match yang tersedia
  → !bola

*Step 2:* Tambah pertandingan ke slip satu per satu
  → !parlay AB12 1x2 h
  → !parlay CD34 ou o
  → !parlay EF56 hdp a

*Step 3:* Cek slip parlay kamu
  → !parlaylihat

*Step 4:* Jika sudah yakin, pasang taruhan
  → !parlaybet 100000

*Step 5:* Batal jika berubah pikiran
  → !parlaybatal

${'─'.repeat(30)}
📋 *ATURAN MIX PARLAY:*
• Minimal *2 leg* (2 pertandingan)
• Maksimal *8 leg* (8 pertandingan)
• Satu match hanya boleh masuk 1 kali
• Semua match harus belum dimulai
• Satu leg draw = leg tersebut dihapus,
  odds direcalculate dari leg lainnya

${'─'.repeat(30)}
💡 *STRATEGI PARLAY:*
✅ Pilih tim favorit jelas (odds 1.70-1.90)
   → Kemungkinan menang lebih tinggi
✅ Hindari terlalu banyak leg (8 leg sangat susah)
   → 2-4 leg = keseimbangan risiko dan reward
✅ Mix antara 1X2 favorit + Over yang cenderung
   banyak gol untuk odds yang seimbang
⚠️ Parlay sangat berisiko — modal bisa hangus!
   Hanya pasang uang yang siap hilang.

${'─'.repeat(30)}
*Sudah paham? Langsung coba:*
• !bola             → Lihat match tersedia
• !odds <ID>        → Cek odds detail
• !parlay <ID> <jenis> <pil> → Mulai bangun parlay
↩️ Balik: *!menu bola*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu farming
                // ════════════════════════════════════════════════
                if (['farming', 'tani', 'pertanian', 'pabrik'].includes(sub)) {
                    return msg.reply(
`🌾 *FARMING & INDUSTRI*
${'─'.repeat(30)}

🌱 *PERTANIAN DASAR*
• !farming / !tani    → Panduan lengkap farming
• !tanam <nama>       → Mulai menanam
  Tanaman: padi | jagung | bawang | kopi | sawit
• !ladang             → Cek status kebun & panen
• !panen              → Ambil hasil yang sudah matang
• !pasar              → Cek harga jual komoditas hari ini
• !jual <nama> <jml>  → Jual hasil panen ke pasar
  _(Harga pasar berubah tiap waktu!)_

🏭 *MESIN PABRIK (Naikkan Nilai Jual)*
• !toko               → Daftar mesin + harga
• !beli <mesin>       → Beli mesin pabrik
  Contoh mesin:
  └ gilingan          → Padi jadi Beras
  └ popcorn_maker     → Jagung jadi Popcorn
  └ penggorengan      → Bawang jadi Bawang Goreng
  └ roaster           → Kopi jadi Kopi Premium
  └ pabrik_minyak     → Sawit jadi Minyak Goreng
• !olah <mesin> <jml> → Masukkan bahan ke mesin
• !pabrik             → Cek status & ambil hasil olahan
• !jual <produk> <jml>→ Jual produk jadi (harga jauh lebih tinggi!)

🏭 *SIXTEEN INDUSTRI (Pabrik Bersama)*
• !pabrik help        → Panduan sistem industri lengkap

  👑 *Bos (Owner Pabrik)*
  • !bangunpabrik <hewan> <tier> → Beli mesin
  • !hire @user                  → Rekrut karyawan
  • !fire @user                  → Pecat karyawan
  • !gudang                      → Cek stok bahan & produk
  • !jualproduk <kode>           → Jual produk ke pasar
  • !service                     → Perbaiki mesin rusak

  👷 *Karyawan (Buruh)*
  • !pabrik           → Cek stamina & info majikan
  • !craft <bahan> <jml> → Proses produksi
  • !ngopi            → Istirahat & isi stamina
  • !resign           → Keluar dari pabrik

💡 *TIPS FARMING*
✅ Sawit = paling menguntungkan, tapi lama
✅ Mesin pabrik = harga jual naik berkali lipat
✅ Cek !pasar sebelum jual — harga naik turun!
✅ Event Musim Panen = hasil jual 3x!
✅ Event Borong Pasar = beli mesin & benih diskon 50%!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu ternak
                // ════════════════════════════════════════════════
                if (['ternak', 'ranch', 'hewan', 'kandang'].includes(sub)) {
                    return msg.reply(
`🐄 *PETERNAKAN (RANCH)*
${'─'.repeat(30)}

📖 *INFO & KANDANG*
• !ternak             → Panduan lengkap peternakan
• !kandang            → Cek kondisi semua hewan
  _(lapar / sakit / berat / nilai jual)_

🛒 *BELI HEWAN*
• !belihewan          → Lihat katalog hewan + harga
• !belihewan <jenis>  → Beli hewan ternak
  ┌─────────────────────────────────┐
  │ ayam    •  50rb  → Jual ~180rb  │
  │ gurame  • 200rb  → Jual ~750rb  │
  │ kambing •   3jt  → Jual ~6jt    │
  │ sapi    •  15jt  → Jual ~35jt   │
  │ unta / kuda      → Tier premium  │
  └─────────────────────────────────┘

🌿 *PAKAN & PERAWATAN*
• !tokopakan          → Toko pakan & obat
• !pakan <no> <jenis> → Beri makan hewan
  └ dedak   → Murah, tumbuh lambat
  └ pelet   → Standar, tumbuh sedang
  └ premium → Mahal, tumbuh cepat!
• !obati <no>         → Obati hewan sakit

💰 *JUAL HEWAN*
• !jualhewan <no>     → Jual berdasarkan berat (kg × harga/kg)
  └ 🌟 Bonus +10% jika berat MAX & hewan sehat
  └ ☠️ Bangkai = dijual ke rongsok (sangat murah)

⚠️ *PERHATIAN PENTING!*
❗ Hewan tidak diberi makan lama = MATI
❗ Hewan sakit = tidak tumbuh optimal
❗ Maksimal 8 ekor per kandang
✅ Event Musim Panen = jual hewan 3x harga!
✅ Event Borong Pasar = beli hewan diskon 50%!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu mining
                // ════════════════════════════════════════════════
                if (['mining', 'tambang', 'btc', 'miner'].includes(sub)) {
                    return msg.reply(
`⛏️ *MINING & CRYPTO*
${'─'.repeat(30)}

⚠️ *WAJIB BACA DULU!*
→ Ketik *!panduanminer* sebelum mulai mining
  _(Agar tidak rugi beli alat yang salah)_

⛏️ *MINING BTC*
• !mining / !miner    → Dashboard rig, hashrate & listrik
• !claimmining        → Panen BTC (otomatis bayar listrik)
• !topminer           → Ranking hashrate & BTC terbanyak

🛒 *BELI ALAT MINING*
• !shopminer          → Toko VGA legal
  _(Harga naik-turun tiap jam berdasarkan pasar!)_
• !belivga <kode>     → Beli VGA legal
  Contoh: !belivga rtx4090
• !bm / !blackmarket  → Black Market — alat ilegal
  _(Lebih kencang, tapi ada risiko razia polisi!)_

🔧 *UPGRADE RIG*
• !upgrade cooling    → Kurangi risiko overheat
• !upgrade psu        → Hemat listrik 30%
• !upgrade firewall   → Kebal dari !hack orang lain

⚔️ *PvP MINING*
• !hack @user         → Curi BTC milik orang
  _(Perlu Firewall agar tidak bisa di-hack balik!)_

💹 *TRADING CRYPTO*
• !market             → Harga live semua koin crypto
• !buycrypto <koin> <jml>  → Beli crypto
• !sellcrypto <koin> <jml> → Jual crypto
• !pf / !porto        → Cek portofolio crypto + unrealized P/L
• !margin             → Pinjam dana trading (leverage)
• !paydebt            → Bayar margin debt

💡 *TIPS MINING*
✅ PSU upgrade = hemat listrik 30% (ROI cepat)
✅ Firewall = wajib jika punya banyak BTC
✅ Cek !shopminer rutin — harga VGA berubah tiap jam
✅ Alat illegal lebih kencang tapi bisa disita polisi
✅ Event Rush Tambang = cooldown 0, hasil 5x, listrik GRATIS!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu investasi
                // ════════════════════════════════════════════════
                if (['investasi', 'saham', 'valas', 'properti'].includes(sub)) {
                    return msg.reply(
`📈 *INVESTASI*
${'─'.repeat(30)}

📊 *PASAR SAHAM BEI*
• !saham / !stock     → Cek semua harga saham real-time
• !belisaham <kode> <jml>  → Beli saham
• !jualsaham <kode> <jml>  → Jual saham
• !pf / !porto        → Portofolio + unrealized P/L
• !chart <kode>       → Grafik pergerakan harga saham
• !dividen            → Klaim dividen (jika ada)
  _Contoh: !belisaham BBCA 100_

💱 *VALAS & EMAS*
• !kurs / !forex      → Kurs live: USD, EUR, JPY & Emas
• !beliemas <gram>    → Beli emas (safe haven, tahan inflasi)
• !jualemas <gram>    → Jual emas ke rupiah
• !beliusd <jml>      → Beli Dollar AS
• !belieur <jml>      → Beli Euro
• !belijpy <jml>      → Beli Yen Jepang
• !jualusd / !jualeur / !jualjpy → Jual kembali ke rupiah
• !aset / !dompetvalas→ Portofolio aset valas + valuasi saat ini

🏢 *PROPERTI & BISNIS*
• !properti           → Katalog bisnis + aset yang kamu punya
• !beliusaha <id> <jml> → Beli bisnis / properti baru
• !collect / !tagih   → Ambil pendapatan pasif dari bisnis
  _(Bisnis menghasilkan uang tiap jam otomatis!)_

💡 *TIPS INVESTASI*
✅ Emas = paling aman saat pasar bergejolak
✅ Saham bisa naik turun drastis — diversifikasi!
✅ Properti = pendapatan pasif tanpa kerja
✅ Crypto berisiko tinggi tapi potensi profit besar

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu jobs
                // ════════════════════════════════════════════════
                if (['jobs', 'kerja', 'pekerjaan', 'job'].includes(sub)) {
                    return msg.reply(
`💼 *PEKERJAAN (JOBS)*
${'─'.repeat(30)}

📋 *CARI & LAMAR KERJA*
• !jobs               → Lihat semua lowongan + gaji + skill
• !lamar <nama>       → Lamar pekerjaan
  _(Level tertentu membuka pekerjaan bergaji lebih tinggi)_
• !skill              → Lihat skill aktif dari pekerjaanmu

⏱️ *KERJA HARIAN*
• !kerja / !work      → Ambil gaji (ada cooldown, sabarlah!)

🚪 *KELUAR KERJA*
• !resign             → Resign dari pekerjaan saat ini
  ⚠️ _Resign sebelum gajian = kehilangan gaji periode ini!_

📌 _Setiap pekerjaan punya keuntungan tersendiri:_
✅ Gaji berkala yang bisa diklaim rutin
✅ Skill khusus yang memperkuat karakter di game
✅ Beberapa job beri bonus di mining / farming / duel

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
                //  !menu negara
                // ════════════════════════════════════════════════
                if (['negara', 'war', 'perang', 'nation'].includes(sub)) {
                    return msg.reply(
`🏳️ *NEGARA & PERANG*
${'─'.repeat(30)}

🌏 *KELOLA NEGARA*
• !negara / !nation   → Dashboard negara kamu
• !buatnegara <nama>  → Buat negara baru
  _(Biaya 5 Miliar! Pastikan kamu cukup kaya)_
• !listnegara         → Daftar semua negara yang ada
• !topnegara          → Ranking negara terkuat

🏗️ *PEMBANGUNAN INFRASTRUKTUR*
• !bangun bank        → Naikkan kapasitas pajak (10 Juta)
• !bangun benteng     → Tingkatkan pertahanan (25 Juta)
• !bangun rs          → Kurangi korban saat perang (5 Juta)
  _(Infrastruktur kuat = negara lebih sulit diserang)_

⚔️ *MILITER & PERANG*
• !rekrut <jml>       → Beli tentara (50 Juta/orang)
• !serang @target     → Deklarasi perang ke negara lain
  _(Perang buta — kekuatan tentara menentukan hasil)_
  ⚠️ _Kalah perang = kas negara dirampas musuh!_

💰 *EKONOMI NEGARA*
• !pajaknegara        → Tarik pajak dari seluruh rakyat
• !subsidi <jml>      → Transfer uang pribadi → kas negara
• !korupsi <jml>      → Ambil uang dari kas
  ⚠️ _Korupsi berlebihan = rakyat memberontak (kudeta)!_

${'─'.repeat(30)}
↩️ Balik: *!menu*`
                    );
                }

                // ════════════════════════════════════════════════
//  !menu event
// ════════════════════════════════════════════════
if (['event', 'abuse', 'adminabuse'].includes(sub)) return msg.reply(
`🎉 *ADMIN ABUSE EVENT SYSTEM*
${'─'.repeat(30)}

⚡ *KONTROL EVENT (Admin Grup)*
• !adminabuseon       → 🟢 Mulai event (berlangsung 30 menit)
• !adminabuseoff      → 🔴 Matikan paksa event
• !abuseinfo          → ℹ️ Status event yang sedang aktif

🗓️ *CARA KERJA*
┌──────────────────────────────┐
│ ⏱️ Durasi total : 30 menit   │
│ 🔄 Ganti event  : tiap 5 mnt │
│ 🎲 Total event  : 12 (acak)  │
│ 🌐 Scope        : Semua grup │
└──────────────────────────────┘

📋 *12 EVENT RANDOM*
 1. 🌧️ *Hujan Uang* — Semua dapat koin gratis
 2. 🎰 *Jackpot Bersama* — Taruh 50rb, 1 orang menang semua
 3. 🛒 *Borong Pasar* — Diskon 50% semua item & hewan
 4. ☄️ *Meteor Langka* — Ketik *KLAIM* tercepat = hadiah besar
 5. 🌾 *Musim Panen* — Hasil tani & ternak 3x lipat
 6. ⛏️ *Rush Tambang* — Cooldown 0 + hasil 5x + listrik gratis
 7. 🎲 *Winrate Gila* — Casino/Slot/Rolet/Mines winrate 85%!
 8. ⚔️ *Duel Berhadiah* — Menang duel dapat +2 Juta bonus
 9. 🧠 *Tebak Berhadiah* — Jawab soal pertama = menang besar
10. ⚡ *Balapan Klik* — Ketik kata paling cepat = menang
11. 📊 *Lomba Aktif* — Paling banyak chat 5 menit = menang

📌 _Hanya admin grup yang bisa aktifkan event_
📌 _Event interaktif: 1 pemenang per grup_

${'─'.repeat(30)}
↩️ Balik: *!menu*`
);

if (['reminder','remind','pengingat'].includes(sub)) return msg.reply(
`⏰ *REMINDER*\n${'─'.repeat(30)}\n• !remind 30m Minum obat\n• !remind 2h Meeting\n• !remind 08:30 Sarapan\n• !remind 1d Bayar tagihan\n• !remind 25/12 HUT RI\n📌 !remindlist | !reminddel <ID> | !remindclear\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
);

if (['group','grup','manajemen'].includes(sub)) return msg.reply(
`👥 *MANAJEMEN GRUP*\n${'─'.repeat(30)}\n👑 !tagall | !hidetag | !kick | !add | !promote | !demote\n⚙️ !antilink | !antispam | !mute / !unmute\n💬 !welcome <pesan> | !goodbye <pesan>\n📋 !setrules | !rules | !groupinfo | !listadmin | !setdesc\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
);

if (['kalkulator','kalk','hitung'].includes(sub)) return msg.reply(
`🔢 *KALKULATOR*\n${'─'.repeat(30)}\n🧮 !kalk 2+2*10 | !kalk sqrt(144)\n💹 !persen 20 dari 500000\n🏋️ !bmi 70 175 (berat kg, tinggi cm)\n🏦 !cicilan 100jt 12% 24 | !zakat 5000000\n📏 !konversi 5 km ke mile | !konversi 100 usd ke idr\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
);

if (['info','berita','news'].includes(sub)) return msg.reply(
`📰 *INFO & BERITA*\n${'─'.repeat(30)}\n📰 !berita [teknologi|ekonomi|olahraga|hiburan|sains]\n💱 !kurs | !dollar | !btc\n🌤️ !cuaca <kota> | !prakiraan <kota>\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
);

if (['utilitas','utility','tools2'].includes(sub)) return msg.reply(
`🔧 *UTILITAS*\n${'─'.repeat(30)}\n📱 !qr <teks/link> | !short <url> | !unshort <url>\n🔐 !password 16 strong | !password 6 pin | !uuid\n🔒 !base64 encode/decode | !md5 | !sha256\n🌐 !ip [alamat] | !ping <url> | !waktu | !countdown <tgl>\n📥 !tiktok <link> — Download TikTok tanpa watermark\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
);

return msg.reply(`❓ Kategori *"${sub}"* tidak ditemukan.\n\nKetik *!menu* untuk daftar lengkap.`);
} // <-- Ini penutup command !menu utama

            // ══════════════════════════════════════════════════
            // STEGANOGRAFI
            // ══════════════════════════════════════════════════
            if (command === 'hide') {
                const isImage = (msgType === 'imageMessage');
                const isQImg  = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
                if (!isImage && !isQImg) return msg.reply('⚠️ Kirim/Reply gambar dengan caption: !hide pesan rahasia');
                const pesanRahasia = args.join(' ');
                if (!pesanRahasia) return msg.reply('⚠️ Contoh: !hide Misi Rahasia 007');
                msg.reply('⏳ Menyembunyikan pesan...');
                try {
                    let msgDl = m;
                    if (isQImg) msgDl = { key: m.message.extendedTextMessage.contextInfo.stanzaId, message: m.message.extendedTextMessage.contextInfo.quotedMessage };
                    const buffer    = await downloadMediaMessage(msgDl, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    const inPath    = `./temp/steg_in_${sender.split('@')[0]}.jpg`;
                    const outPath   = `./temp/steg_out_${sender.split('@')[0]}.png`;
                    fs.writeFileSync(inPath, buffer);
                    exec(`python3 commands/stegano.py hide "${inPath}" "${pesanRahasia}" "${outPath}"`, async (error) => {
                        if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
                        if (error) return msg.reply('❌ Gagal. Pastikan Python3 terinstall.');
                        await sock.sendMessage(remoteJid, { document: fs.readFileSync(outPath), mimetype: 'image/png', fileName: 'RAHASIA.png', caption: '✅ SUKSES! Download file ini.' }, { quoted: m });
                        setTimeout(() => { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); }, 5000);
                    });
                } catch(err) { msg.reply('Gagal mendownload gambar.'); }
            }

            if (command === 'reveal') {
                const qMsg  = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!qMsg?.documentMessage && !qMsg?.imageMessage) return msg.reply('⚠️ Reply gambar/dokumen rahasia dengan !reveal');
                msg.reply('🔍 Membaca pesan...');
                try {
                    const msgDl  = { key: m.message.extendedTextMessage.contextInfo.stanzaId, message: qMsg };
                    const buffer = await downloadMediaMessage(msgDl, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    const inPath = `./temp/reveal_${sender.split('@')[0]}.png`;
                    fs.writeFileSync(inPath, buffer);
                    exec(`python3 commands/stegano.py reveal "${inPath}"`, (error, stdout) => {
                        if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
                        if (error) return msg.reply('❌ Tidak ditemukan pesan rahasia di file ini.');
                        msg.reply(stdout);
                    });
                } catch(e) { msg.reply('Gagal mengambil media.'); }
            }

            // ══════════════════════════════════════════════════
            // DISPATCH SEMUA COMMAND MODULE
            // ══════════════════════════════════════════════════

            // ── Original Commands ──────────────────────────────
            await ternakCmd(command, args, msg, user, db)
                .catch(e => console.error('[Ternak]', e.message));
            await adminAbuseCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[AdminAbuse]', e.message));
            await toolsCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Tools]', e.message));
            await timeMachineCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[TimeMachine]', e.message));
            await devCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Dev]', e.message));
            await pabrikCommand(command, args, msg, user, db, sock)
                .catch(e => console.error('[Pabrik]', e.message));
            await economyCmd(command, args, msg, user, db)
                .catch(e => console.error('[Economy]', e.message));
            await chartCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Chart]', e.message));
            await stocksCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Stocks]', e.message));
            await cryptoCmd(command, args, msg, user, db)
                .catch(e => console.error('[Crypto]', e.message));
            await propertyCmd(command, args, msg, user, db)
                .catch(e => console.error('[Property]', e.message));
            await minesCmd(command, args, msg, user, db)
                .catch(e => console.error('[Mines]', e.message));
            await miningCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Mining]', e.message));
            await duelCmd(command, args, msg, user, db)
                .catch(e => console.error('[Duel]', e.message));
            await bolaCmd(command, args, msg, user, db, sender)
                .catch(e => console.error('[Bola]', e.message));
            await nationCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Nation]', e.message));
            await robCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Rob]', e.message));
            await valasCmd(command, args, msg, user, db)
                .catch(e => console.error('[Valas]', e.message));
            await farmingCmd(command, args, msg, user, db)
                .catch(e => console.error('[Farming]', e.message));
            await jobsCmd(command, args, msg, user, db)
                .catch(e => console.error('[Jobs]', e.message));
            await rouletteCmd(command, args, msg, user, db)
                .catch(e => console.error('[Roulette]', e.message));
            await battleCmd(command, args, msg, user, db)
                .catch(e => console.error('[Battle]', e.message));
            await ttsCmd(command, args, msg)
                .catch(e => console.error('[TTS]', e.message));
            await wikiKnowCmd(command, args, msg)
                .catch(e => console.error('[WikiKnow]', e.message));
            await adminCmd(command, args, msg, user, db)
                .catch(e => console.error('[Admin]', e.message));
            await rpgCmd(command, args, msg, user, db)
                .catch(e => console.error('[RPG]', e.message));
            await slitherCmd(command, args, msg, user, db)
                .catch(e => console.error('[Slither]', e.message));
            await aiCmd(command, args, msg, user, db)
                .catch(e => console.error('[AI]', e.message));
            await caturCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Catur]', e.message));
            await imageCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Image]', e.message));

            // ── Fitur Original Tambahan ────────────────────────
            await aiToolsCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[AITools]', e.message));
            await moodCmd(command, args, msg, user, db)
                .catch(e => console.error('[Mood]', e.message));
            await triviaCmd(command, args, msg, user, db, body)
                .catch(e => console.error('[Trivia]', e.message));
            await wordleCmd(command, args, msg, user, db)
                .catch(e => console.error('[Wordle]', e.message));
            await akinatorCmd(command, args, msg, user, db)
                .catch(e => console.error('[Akinator]', e.message));
            await portoCmd(command, args, msg, user, db)
                .catch(e => console.error('[Porto]', e.message));
            await perkiraanCmd(command, args, msg, user, db)
                .catch(e => console.error('[Prakiraan]', e.message));
            await bgToolsCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[BGTools]', e.message));
            await shortlinkCmd(command, args, msg, user, db)
                .catch(e => console.error('[Shortlink]', e.message));
            await zodiakCmd(command, args, msg, user, db)
                .catch(e => console.error('[Zodiak]', e.message));
            await kreatifCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Kreatif]', e.message));
            await analitikCmd(command, args, msg, user, db)
                .catch(e => console.error('[Analitik]', e.message));
            await profileCmd(command, args, msg, user, db, chat, sock)
                .catch(e => console.error('[Profile]', e.message));

            // ── FITUR BARU v2.0 ────────────────────────────────
            await reminderCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Reminder]', e.message));
            await groupCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Group]', e.message));
            await kalkulatorCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Kalkulator]', e.message));
            await beritaCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Berita]', e.message));
            await tiktokCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[TikTok]', e.message));
            await utilitasCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Utilitas]', e.message));

        } catch(e) {
            console.error('[Critical Error]', e.message);
        }
    });

    // AUTO SAVE setiap 60 detik
    setInterval(() => { if (global.db) saveDB(global.db); }, 60000);
}

startBot();

// ══════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ══════════════════════════════════════════════════════════════════════
async function handleExit(signal) {
    console.log(`\n🛑 Sinyal ${signal}. Mematikan bot...`);
    if (global.db && typeof saveDB === 'function') await saveDB(global.db);
    console.log('✅ Shutdown selesai. Bye!'); process.exit(0);
}
process.on('SIGINT',  () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));
process.on('uncaughtException',  (e) => console.error('[uncaughtException]',  e.message));
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
