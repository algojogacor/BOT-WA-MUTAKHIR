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
│   ⚙️  *ALGOJO BOT v2.0*  ⚙️   │
└──────────────────────────────┘

👤 *!menu profil*    — Level, daily, inv, quest
🏦 *!menu bank*      — Saldo, transfer, pinjam, rob
❤️ *!menu nyawa*     — HP, makan, tidur, RS, AFK
🎮 *!menu game*      — Casino, slot, roulette, duel
⚽ *!menu bola*      — Sport betting: 1X2, HDP, O/U
🌾 *!menu farming*   — Pertanian, pabrik, industri
🐄 *!menu ternak*    — Peternakan, pakan, jual hewan
⛏️ *!menu mining*    — VGA rig, BTC, trading crypto
📈 *!menu investasi* — Saham, valas, emas, properti
💼 *!menu jobs*      — Lowongan, gaji, skill
🏳️ *!menu negara*   — Buat negara, perang, militer
🎉 *!menu event*     — Admin Abuse 30 menit 10 event
🧠 *!menu ai*        — AI tiers, 10 persona, vision
🛠️ *!menu tools*     — Stiker, PDF, TTS, steganografi
⏰ *!menu reminder*  — Pengingat otomatis ─── [v2.0]
👥 *!menu group*     — Manajemen grup ──────── [v2.0]
🔢 *!menu kalkulator*— Kalkulator & konversi ─ [v2.0]
📰 *!menu info*      — Berita, kurs, crypto ── [v2.0]
🔧 *!menu utilitas*  — QR, password, tools ─── [v2.0]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Saldo : *Rp ${bal}*
❤️ HP    : [${bar(hp)}] ${hp}%
⚡ Energi: [${bar(nrg)}] ${nrg}%
🎖️ Level : ${lvl}  |  XP: ${xp}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Ketik !menu <kategori> untuk detail_`
                );

                if (['profil','profile','akun','user'].includes(sub)) return msg.reply(
`👤 *PROFIL & AKUN*\n${'─'.repeat(30)}\n📊 !me / !profile / !rank / !inv / !quest / !skill\n🎁 !daily | !kerja / !work\n🏆 !top / !leaderboard / !topbola / !topminer / !topnegara\n🛍️ !shop / !buy <id> / !use <id>\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['bank','keuangan','duit'].includes(sub)) return msg.reply(
`🏦 *BANK & KEUANGAN*\n${'─'.repeat(30)}\n💳 !me | !dompet / !coin | !pf / !porto\n💸 !depo / !tarik / !tf @user <jml> / !give @user <jml>\n🏧 !pinjam / !bayar | !margin / !paydebt\n🦹 !rob @user | !maling\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['nyawa','survival','life','hp'].includes(sub)) return msg.reply(
`❤️ *LIFE & SURVIVAL*\n${'─'.repeat(30)}\n📊 HP: [${bar(hp)}] ${hp}% | Energi: [${bar(nrg)}] ${nrg}%\n🍽️ !makan / !eat — Makan (isi lapar & HP)\n😴 !tidur <jam> / !bangun / !wake\n🏥 !rs — Berobat (HP full) | !revive — Hidup kembali\n🔕 !matistatus — AFK mode | !nyalastatus — Aktifkan HP\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['game','games','judi','hiburan'].includes(sub)) return msg.reply(
`🎮 *GAMES & JUDI*\n${'─'.repeat(30)}\n🎰 !casino / !slot / !rolet / !tembok / !gacha\n💣 !bom / !mines → !gali <1-12> → !stop / !cashout\n⚔️ !duel @user <bet> | !battle @user <bet>\n🧠 !tebakgambar | !asahotak | !susunkata\n🕹️ !rpg | !slither / !snake | !catur <bet>\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['bola','sport','betting','parlay'].includes(sub)) return msg.reply(
`⚽ *SPORT BETTING*\n${'─'.repeat(30)}\n📚 !menu bolaajar | !menu 1x2 | !menu hdp | !menu ou | !menu parlayajar\n📋 !bola | !odds <ID> | !bet <ID> <jenis> <pil> <jml>\n🎰 !parlay | !parlaylihat | !parlaybet | !parlaybatal\n📊 !mybets | !topbola\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (sub === 'bolaajar') return msg.reply('🔰 Judi bola = tebak hasil pertandingan.\n3 jenis: 1X2 (paling mudah), HDP (handicap), O/U (total gol)\nKetik !menu 1x2 | !menu hdp | !menu ou untuk detail\n\n↩️ Ketik !menu bola');
                if (sub === 'odds')       return msg.reply('📊 Odds = angka pengali.\nContoh: bet 100rb × odds 1.85 = dapat 185rb jika menang\nOdds rendah = favorit | Odds tinggi = underdog\n\n↩️ Ketik !menu bola');
                if (sub === '1x2')        return msg.reply('🎯 Tebak: h=Home menang | d=Seri | a=Away menang\nContoh: !bet ID12 1x2 h 500000\n\n↩️ Ketik !menu bola');
                if (sub === 'hdp')        return msg.reply('⚖️ Handicap = sistem voor.\nHome -0.5 artinya Home harus menang minimal 1 gol.\nContoh: !bet ID12 hdp h 200000\n\n↩️ Ketik !menu bola');
                if (sub === 'ou')         return msg.reply('📈 Tebak total gol: o=Over | u=Under\nGaris 2.5: Over = minimal 3 gol | Under = maks 2 gol\nContoh: !bet ID12 ou o 300000\n\n↩️ Ketik !menu bola');
                if (sub === 'parlayajar') return msg.reply('🎰 Parlay = gabung beberapa taruhan, semua harus benar!\nOdds dikali → untung besar dari modal kecil\n!parlay ID 1x2 h → !parlay ID2 ou o → !parlaybet 100000\n\n↩️ Ketik !menu bola');

                if (['farming','tani','pertanian','pabrik'].includes(sub)) return msg.reply(
`🌾 *FARMING & INDUSTRI*\n${'─'.repeat(30)}\n🌱 !tanam <nama> | !ladang | !panen\n💹 !pasar | !jual <nama> <jml>\n🏭 !toko | !beli <mesin> | !olah <mesin> <jml> | !pabrik\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['ternak','ranch','hewan','kandang'].includes(sub)) return msg.reply(
`🐄 *PETERNAKAN*\n${'─'.repeat(30)}\n• !belihewan / !kandang / !pakan <no> <jenis>\n• !obati <no> / !jualhewan <no>\n💰 Hewan: ayam | gurame | kambing | sapi | unta | kuda\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['mining','tambang','btc','miner'].includes(sub)) return msg.reply(
`⛏️ *MINING & CRYPTO*\n${'─'.repeat(30)}\n⛏️ !mining / !miner / !claimmining / !shopminer / !belivga <kode>\n🌑 !bm / !blackmarket | !hack @user | !topminer\n💹 !market | !buycrypto / !sellcrypto | !pf / !porto\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['investasi','saham','valas','properti'].includes(sub)) return msg.reply(
`📈 *INVESTASI*\n${'─'.repeat(30)}\n📊 !saham / !belisaham / !jualsaham / !chart <kode>\n💱 !kurs / !beliemas / !jualemas / !beliusd / !aset\n🏢 !properti / !beliusaha <id> / !collect / !tagih\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['jobs','kerja','pekerjaan','job'].includes(sub)) return msg.reply(
`💼 *PEKERJAAN*\n${'─'.repeat(30)}\n• !jobs | !lamar <nama> | !kerja / !work\n• !skill | !resign\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['negara','war','perang','nation','spy','spion'].includes(sub)) {
                    const sub2 = (args[1] || '').toLowerCase();
                    if (['infra','bangunan'].includes(sub2)) return msg.reply('🏗️ Bangunan: bank|benteng|rs|intel|silo|radar|nuklir|kilang|dermaga|univ|kebun|penjara\n!bangun <kode> / !demolish <kode>\n\n↩️ !menu negara');
                    if (['militer','perang','war'].includes(sub2)) return msg.reply('⚔️ !rekrut <jml> / !demobilisasi | !serang @user / !serangangudara @user | !perisai\n!bangunrudal / !bangunbom | !blokade @user\n\n↩️ !menu negara');
                    if (['ekonomi','kas','pajak'].includes(sub2)) return msg.reply('💰 !pajaknegara (CD: 1 jam) | !subsidi / !tarikkas / !korupsi | !propaganda\n\n↩️ !menu negara');
                    if (['spion','intel','spy'].includes(sub2)) return msg.reply('🕵️ Spionase HANYA via DM bot!\n!spionase / !sadap / !sabotase / !teror / !kudeta / !racun / !suap / !curi\n!laporanmata / !identitasagen / !tarikagen\n\n↩️ !menu negara');
                    if (['riset','teknologi'].includes(sub2)) return msg.reply('🔬 !riset <kode>\nTeknologi: rudal_pintar | agen_elite | ekonomi_maju | armor_baja | drone_serang | bioweapon\nButuh: !bangun univ\n\n↩️ !menu negara');
                    if (['aliansi','diplomasi'].includes(sub2)) return msg.reply('🤝 !aliansi @user / !terimaliansi / !bubaraliansi / !listaliansi\n!gencatan @user / !terimagencatan\nMaks 3 aliansi | Sekutu = +20% power bertahan\n\n↩️ !menu negara');
                    return msg.reply(
`🌍 *SISTEM NATION v3.0*\n${'─'.repeat(30)}\n• !negara | !buatnegara <nama> | !topnegara\n• !bangun [kode] | !riset [kode] | !rekrut <jml>\n• !serang @user | !serangangudara @user | !perisai\n• !aliansi @user | !pajaknegara | !subsidi\n📖 !menu negara infra | militer | ekonomi | spion | riset | aliansi\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                    );
                }

                if (['event','abuse','adminabuse'].includes(sub)) return msg.reply(
`🎉 *ADMIN ABUSE EVENT*\n${'─'.repeat(30)}\n• !adminabuseon → 🟢 Mulai (30 menit)\n• !adminabuseoff → 🔴 Hentikan\n• !abuseinfo → ℹ️ Status\n🎲 10 Event: Hujan Uang | Jackpot Bersama | Borong Pasar | Meteor Langka | Musim Panen | Rush Tambang | Duel Berhadiah | Tebak Berhadiah | Balapan Klik | Lomba Aktif\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['ai','tanya','bot','ask'].includes(sub)) return msg.reply(
`🧠 *AI SUPER TIERS v2.0*\n${'─'.repeat(30)}\n🤖 !ai0/1/2/3 <tanya> | !ai <tanya>\n🎭 *10 PERSONA:* !persona [nama]\ndefault | english | coder | motivator | chef\ndokter | lawyer | psikolog | penulis | bisnis\n👁️ !aianalysis — Analisis gambar\n📊 !aistat | !resetai | !sharechat\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['tools','media','editor'].includes(sub)) return msg.reply(
`🛠️ *TOOLS & MEDIA*\n${'─'.repeat(30)}\n🖼️ !sticker / !s | !toimg | !img <deskripsi> | !imgstyle | !imgvariasi\n📄 !topdf / !pdfdone | 🔊 !tts <teks>\n🕰️ !timemachine | 🔗 !short / !unshort\n🛠️ !summarize | !translate | !ocr | !codereview | !grammar | !fakta\n🖼️ !bg | !compress | !enhance\n🎮 !trivia | !wordle | !akinator | !zodiak | !shio\n🔐 !hide / !reveal (steganografi)\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['reminder','remind','pengingat'].includes(sub)) return msg.reply(
`⏰ *REMINDER v2.0*\n${'─'.repeat(30)}\n• !remind 30m Minum obat\n• !remind 2h Meeting\n• !remind 08:30 Sarapan\n• !remind 1d Bayar tagihan\n• !remind 25/12 HUT RI\n📌 !remindlist | !reminddel <ID> | !remindclear\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['group','grup','manajemen'].includes(sub)) return msg.reply(
`👥 *MANAJEMEN GRUP v2.0*\n${'─'.repeat(30)}\n👑 !tagall | !hidetag | !kick | !add | !promote | !demote\n⚙️ !antilink | !antispam | !mute / !unmute\n💬 !welcome <pesan> | !goodbye <pesan>\n📋 !setrules | !rules | !groupinfo | !listadmin | !setdesc\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['kalkulator','kalk','hitung'].includes(sub)) return msg.reply(
`🔢 *KALKULATOR v2.0*\n${'─'.repeat(30)}\n🧮 !kalk 2+2*10 | !kalk sqrt(144)\n💹 !persen 20 dari 500000\n🏋️ !bmi 70 175 (berat kg, tinggi cm)\n🏦 !cicilan 100jt 12% 24 | !zakat 5000000\n📏 !konversi 5 km ke mile | !konversi 100 usd ke idr\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['info','berita','news'].includes(sub)) return msg.reply(
`📰 *INFO & BERITA v2.0*\n${'─'.repeat(30)}\n📰 !berita [teknologi|ekonomi|olahraga|hiburan|sains]\n💱 !kurs | !dollar | !btc\n🌤️ !cuaca <kota> | !prakiraan <kota>\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                if (['utilitas','utility','tools2'].includes(sub)) return msg.reply(
`🔧 *UTILITAS v2.0*\n${'─'.repeat(30)}\n📱 !qr <teks/link> | !short <url> | !unshort <url>\n🔐 !password 16 strong | !password 6 pin | !uuid\n🔒 !base64 encode/decode | !md5 | !sha256\n🌐 !ip [alamat] | !ping <url> | !waktu | !countdown <tgl>\n📥 !tiktok <link> — Download TikTok tanpa watermark\n${'─'.repeat(30)}\n↩️ Balik: *!menu*`
                );

                return msg.reply(`❓ Kategori *"${sub}"* tidak ditemukan.\n\nKetik *!menu* untuk daftar lengkap.`);
            } // end menu

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
