// ╔══════════════════════════════════════════════════════════════╗
// ║        commands/menu.js — Handler !menu lengkap             ║
// ║        Dipisah dari index.js agar lebih ringan              ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * @param {string}   command
 * @param {string[]} args
 * @param {object}   msg   — wrapper (reply, react, dll)
 * @param {object}   user  — data user dari db
 * @returns {boolean} true jika command ditangani
 */
module.exports = async (command, args, msg, user) => {
    if (command !== 'menu' && command !== 'help') return false;

    const sub = (args[0] || '').toLowerCase();

    const bar = (val, max = 100, len = 8) => {
        const fill = Math.round((Math.min(val, max) / max) * len);
        return '\u2588'.repeat(Math.max(0, fill)) + '\u2591'.repeat(Math.max(0, len - fill));
    };

    const bal = Math.floor(user?.balance || 0).toLocaleString('id-ID');
    const hp  = user?.hp     ?? 100;
    const nrg = user?.energy ?? 100;
    const lvl = user?.level  ?? 1;
    const xp  = (user?.xp   || 0).toLocaleString('id-ID');
    const hr  = '\u2500'.repeat(30);

    // ── MENU UTAMA ─────────────────────────────────────────────────
    if (!sub) {
        await msg.reply(
`\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551  \ud83e\udd16  *ALGOJO BOT v2.0*  \ud83e\udd16  \u2551
\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d

\ud83d\udc64 *!menu profil*   \u2014 Level, harian, quest, ranking
\ud83c\udfe6 *!menu bank*     \u2014 Saldo, transfer, pinjam, rob
\u2764\ufe0f *!menu nyawa*    \u2014 HP, makan, tidur, RS, AFK
\ud83c\udfae *!menu game*     \u2014 Casino, slot, roulette, duel, mines
\u265f\ufe0f *!menu catur*    \u2014 Catur, Slither, RPG, Minesweeper
\u26bd *!menu bola*     \u2014 Sport bet: 1X2, HDP, O/U, Parlay
\ud83c\udf3e *!menu farming*  \u2014 Pertanian, pabrik, industri
\ud83d\udc04 *!menu ternak*   \u2014 Peternakan, pakan, jual hewan
\u26cf\ufe0f *!menu mining*   \u2014 VGA rig, mining BTC, crypto
\ud83d\udcc8 *!menu investasi*\u2014 Saham, valas, emas, properti
\ud83d\udcbc *!menu jobs*     \u2014 Lowongan, gaji, skill
\ud83c\udff3\ufe0f *!menu negara*   \u2014 Buat negara, perang, militer
\ud83c\udf89 *!menu event*    \u2014 Admin Abuse: 12 event random
\ud83e\udde0 *!menu ai*       \u2014 ChatAI, persona, analisis gambar
\ud83d\udee0\ufe0f *!menu tools*    \u2014 Stiker, gambar AI, TTS, PDF
\ud83d\udd2e *!menu mood*     \u2014 Zodiak, mood tracker, ramalan
\u23f0 *!menu reminder* \u2014 Alarm, pengingat, tagihan
\ud83d\udc65 *!menu group*    \u2014 Admin tools, antilink, welcome
\ud83e\uddee *!menu kalkulator*\u2014 MTK, konversi, BMI, cicilan
\ud83d\udcf0 *!menu info*     \u2014 Berita, cuaca, kurs, crypto
\ud83d\udd27 *!menu utilitas* \u2014 QR, password, IP, TikTok DL

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\ud83d\udcb0 Saldo : *Rp ${bal}*
\u2764\ufe0f HP    : [${bar(hp)}] ${hp}%
\u26a1 Energi: [${bar(nrg)}] ${nrg}%
\ud83c\udfc6 Level : ${lvl}  |  XP: ${xp}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
_Ketik !menu <kategori> untuk detail_
_Contoh: !menu game | !menu ai | !menu bola_`
        );
        return true;
    }

    // lookup tabel sub-menu → teks balasan
    const subMenus = {

        // profil
        'profil':    ['profil','profile','akun','user'],
        // bank
        'bank':      ['bank','keuangan','duit'],
        // nyawa
        'nyawa':     ['nyawa','survival','life','hp'],
        // game
        'game':      ['game','games','judi','hiburan'],
        // bola top-level
        'bola':      ['bola','sport','betting','parlay'],
        // bola sub-panduan
        'bolaajar':  ['bolaajar'],
        'odds':      ['odds'],
        '1x2':       ['1x2'],
        'hdp':       ['hdp'],
        'ou':        ['ou'],
        'parlayajar':['parlayajar'],
        // ekonomi/investasi
        'farming':   ['farming','tani','pertanian','pabrik'],
        'ternak':    ['ternak','ranch','hewan','kandang'],
        'mining':    ['mining','tambang','btc','miner'],
        'investasi': ['investasi','saham','valas','properti'],
        'jobs':      ['jobs','kerja','pekerjaan','job'],
        'negara':    ['negara','war','perang','nation'],
        // fitur
        'event':     ['event','abuse','adminabuse'],
        'reminder':  ['reminder','remind','pengingat'],
        'group':     ['group','grup','manajemen'],
        'kalkulator':['kalkulator','kalk','hitung'],
        'info':      ['info','berita','news'],
        'utilitas':  ['utilitas','utility','tools2'],
        'ai':        ['ai','chatai','robot','gpt'],
        'tools':     ['tools','alat','stiker','pdf','tts'],
        'mood':      ['mood','zodiak','zodiac','horoscope','ramalan'],
        'catur':     ['catur','chess','slither','rpg','minigame'],
    };

    // Temukan kunci menu
    let found = null;
    for (const [key, aliases] of Object.entries(subMenus)) {
        if (aliases.includes(sub)) { found = key; break; }
    }

    if (!found) {
        await msg.reply(`\u2753 Kategori *"${sub}"* tidak ditemukan.\n\nKetik *!menu* untuk daftar lengkap.`);
        return true;
    }

    // ── Teks tiap sub-menu ─────────────────────────────────────────
    const texts = {

profil:
`\ud83d\udc64 *PROFIL & AKUN*
${hr}

\ud83d\udcca *CEK STATUS*
\u2022 !me / !profile      \u2192 Profil lengkap (HP, saldo, job, level)
\u2022 !rank               \u2192 XP, level & progress naik level
\u2022 !inv / !tas         \u2192 Inventory item & buff aktif
\u2022 !quest / !misi      \u2192 Misi harian & mingguan
\u2022 !skill              \u2192 Skill bonus dari pekerjaanmu

\ud83c\udf81 *KLAIM HARIAN*
\u2022 !daily              \u2192 Klaim bonus harian (reset tiap 24 jam)
\u2022 !kerja / !work      \u2192 Klaim gaji pekerjaan

\ud83c\udfc6 *RANKING*
\u2022 !top / !leaderboard \u2192 Top 10 orang terkaya
\u2022 !topbola            \u2192 Ranking sport betting
\u2022 !topminer           \u2192 Ranking mining BTC
\u2022 !topnegara          \u2192 Ranking negara terkuat
\u2022 !dailyrank          \u2192 Ranking penghasilan hari ini

\ud83d\udecd\ufe0f *TOKO & ITEM*
\u2022 !shop               \u2192 Toko buff & item spesial
\u2022 !buy <id>           \u2192 Beli item dari toko
\u2022 !use <id>           \u2192 Aktifkan/gunakan item

\ud83d\udd17 *AKUN*
\u2022 !migrasi @akun_asli \u2192 Pindah data dari nomor lama
  _(Berguna saat ganti nomor WA)_

${hr}
\u21a9\ufe0f Balik: *!menu*`,

bank:
`\ud83c\udfe6 *BANK & KEUANGAN*
${hr}

\ud83d\udcb3 *CEK SALDO & ASET*
\u2022 !me / !bank         \u2192 Cek saldo, hutang & info akun
\u2022 !dompet / !coin     \u2192 Cek saldo koin saja
\u2022 !pf / !porto        \u2192 Portofolio lengkap
\u2022 !aset               \u2192 Portofolio aset valas

\ud83d\udcb8 *TRANSAKSI*
\u2022 !depo <jml>         \u2192 Setor saldo ke bank
\u2022 !tarik <jml>        \u2192 Tarik saldo dari bank
\u2022 !tf @user <jml>     \u2192 Transfer ke user (\u26a0\ufe0f Pajak 5%, maks 10 Juta/hari)
\u2022 !give @user <jml>   \u2192 Kirim koin langsung (tanpa pajak)

\ud83c\udfe7 *PINJAMAN*
\u2022 !pinjam <jml>       \u2192 Pinjam koin (Maks 5 Juta, Bunga 20%)
\u2022 !bayar <jml>        \u2192 Lunasi hutang
\u2022 !margin             \u2192 Pinjam dana margin (crypto)
\u2022 !paydebt            \u2192 Lunasi margin debt

\ud83e\uddb9 *KRIMINAL*
\u2022 !rob @user          \u2192 Rampok orang lain (\u26a0\ufe0f denda 10% jika gagal)
\u2022 !maling             \u2192 Curi random tanpa target

${hr}
\u26a0\ufe0f _Hutang tidak dibayar = saldo dipotong otomatis_
\u21a9\ufe0f Balik: *!menu*`,

nyawa:
`\u2764\ufe0f *LIFE & SURVIVAL SYSTEM*
${hr}

\ud83d\udcca *STATUS KAMU SAAT INI*
\u2022 \u2764\ufe0f HP     : [${bar(hp)}] ${hp}%
\u2022 \u26a1 Energi : [${bar(nrg)}] ${nrg}%

\u26a0\ufe0f *MEKANISME BAHAYA*
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 HP \u2264 30%  \u2192 \u26a0\ufe0f Bahaya!       \u2502
\u2502 HP = 0    \u2192 \ud83d\udc80 MATI!          \u2502
\u2502 Mati      \u2192 Saldo -20%       \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
_HP turun jika kamu lapar & kelelahan_

\ud83c\udf7d\ufe0f *MAKAN & MINUM*
\u2022 !makan / !eat       \u2192 Makan (Biaya 50 Juta, isi lapar & HP)

\ud83d\ude34 *ISTIRAHAT*
\u2022 !tidur <jam>        \u2192 Tidur 1-10 jam (isi energi & HP)
\u2022 !bangun / !wake     \u2192 Bangun paksa sebelum waktu habis

\ud83c\udfe5 *PENGOBATAN*
\u2022 !rs                 \u2192 Berobat (Biaya 500 Juta, HP full seketika)
\u2022 !revive             \u2192 Hidup kembali setelah mati

\ud83d\udd15 *MODE AFK*
\u2022 !matistatus         \u2192 Aktifkan AFK (HP tidak turun)
\u2022 !nyalastatus        \u2192 Matikan AFK, aktifkan HP normal

\ud83d\udca1 *TIPS:*
\u2705 Makan & tidur rutin agar HP stabil
\u2705 Aktifkan !matistatus sebelum offline lama
\u2705 Jangan biarkan HP mencapai 0!

${hr}
\u21a9\ufe0f Balik: *!menu*`,

game:
`\ud83c\udfae *GAMES & JUDI*
${hr}

\ud83c\udfb0 *CASINO SOLO*
\u2022 !casino <jml>       \u2192 Tebak kartu (35% menang, x2)
\u2022 !slot <jml>         \u2192 Mesin slot (Jackpot 3x = x75!)
\u2022 !rolet <pil> <jml>  \u2192 Roulette Eropa (merah|hitam|ganjil|genap|0-36)
\u2022 !tembok <bet> <1-3> \u2192 Tebak di balik 3 tembok (x2.5)
\u2022 !gacha              \u2192 Gacha item (200 koin, jackpot 10.000!)

\ud83d\udca3 *MINESWEEPER*
\u2022 !bom / !mines <bet> \u2192 Mulai (12 kotak, 3 bom)
\u2022 !gali / !open <1-12>\u2192 Buka kotak
\u2022 !stop / !cashout    \u2192 Ambil kemenangan kapan saja

\u2694\ufe0f *PvP (LAWAN PLAYER)*
\u2022 !duel @user <bet>   \u2192 Russian Roulette 50:50
\u2022 !battle @user <bet> \u2192 Battle RPG turn-based

\ud83e\udde0 *TEBAK BERHADIAH*
\u2022 !tebakgambar        \u2192 Tebak gambar dari petunjuk
\u2022 !asahotak           \u2192 Tebak kata dari asah otak
\u2022 !susunkata          \u2192 Susun huruf acak jadi kata

\ud83c\udfae *MINI GAMES (Browser)*
\u2022 !rpg                \u2192 RPG turn-based lawan musuh AI
\u2022 !slither / !snake   \u2192 Main Snake Game di browser
\u2022 !catur <bet>        \u2192 Catur online di browser

${hr}
_Saat event Winrate Gila: winrate naik jadi 85%!_
\u21a9\ufe0f Balik: *!menu*`,

bola:
`\u26bd *SPORT BETTING \u2014 SPORTSBOOK*
${hr}

\ud83d\udcda *PANDUAN UNTUK PEMULA*
\u2022 *!menu bolaajar*    \u2192 \ud83d\udd30 Apa itu judi bola? (BACA DULU!)
\u2022 *!menu odds*        \u2192 \ud83d\udcca Cara baca odds & hitung untung
\u2022 *!menu 1x2*         \u2192 \ud83c\udfaf Panduan taruhan 1X2 (termudah)
\u2022 *!menu hdp*         \u2192 \u2696\ufe0f Panduan Asian Handicap
\u2022 *!menu ou*          \u2192 \ud83d\udcc8 Panduan Over/Under
\u2022 *!menu parlayajar*  \u2192 \ud83c\udfb0 Panduan Mix Parlay

${hr}
\ud83d\udccb *COMMAND TARUHAN*
\u2022 !bola               \u2192 Daftar semua match aktif
\u2022 !odds <ID>          \u2192 Detail odds suatu match
\u2022 !bet <ID> <jenis> <pil> <jml> \u2192 Pasang taruhan
\u2022 !parlay <ID> <jenis> <pil>    \u2192 Tambah leg parlay
\u2022 !parlaylihat        \u2192 Cek slip parlay kamu
\u2022 !parlaybet <jml>    \u2192 Pasang parlay
\u2022 !parlaybatal        \u2192 Kosongkan slip
\u2022 !mybets             \u2192 Riwayat taruhan
\u2022 !topbola            \u2192 Leaderboard profit

${hr}
_Belum paham? Ketik *!menu bolaajar* dulu!_`,

bolaajar:
`\ud83d\udd30 *PANDUAN JUDI BOLA UNTUK PEMULA*
${hr}

*Apa itu Judi Bola?*
Kamu menebak hasil pertandingan sepak bola.
Jika tebakanmu benar \u2192 dapat uang berlipat.
Jika salah \u2192 uang yang dipasang hangus.

${hr}
\ud83c\udfaf *ADA 3 JENIS TARUHAN:*

1\ufe0f\u20e3 *1X2* (Paling mudah, cocok untuk pemula)
   \u2192 Tebak siapa yang menang/seri
   \u2192 Ketik *!menu 1x2* untuk penjelasan

2\ufe0f\u20e3 *Asian Handicap (HDP)* (Menengah)
   \u2192 Sistem voor agar taruhan lebih seimbang
   \u2192 Ketik *!menu hdp* untuk penjelasan

3\ufe0f\u20e3 *Over/Under (O/U)* (Menengah)
   \u2192 Tebak total gol lebih banyak atau sedikit
   \u2192 Ketik *!menu ou* untuk penjelasan

\ud83c\udfb0 *Mix Parlay* (Lanjutan, potensi besar!)
   \u2192 Ketik *!menu parlayajar* untuk penjelasan

${hr}
\ud83d\udcca *APA ITU ODDS?*
Odds = angka pengali kemenanganmu.
Bet Rp 100.000 dengan odds *1.85*:
\u2192 Menang: 100.000 \xd7 1.85 = *Rp 185.000*
\u2192 Kalah: Rp 100.000 *hangus*

${hr}
\u26a0\ufe0f Jangan pasang uang yang tidak siap hilang!
\u21a9\ufe0f Balik: *!menu bola*`,

odds:
`\ud83d\udcca *CARA MEMBACA & MENGHITUNG ODDS*
${hr}

*Odds* = berapa kali lipat uangmu jika menang.

\ud83d\udcb0 Hasil = Taruhan \xd7 Odds
\ud83d\udcc8 Untung = Hasil - Taruhan

${hr}
\ud83e\udde0 *CONTOH:*
Match: *Man City vs Arsenal*
  \ud83c\udfe0 Man City menang : *1.75*
  \ud83e\udd1d Seri            : *3.50*
  \u2708\ufe0f Arsenal menang  : *4.20*

Bet Rp 200.000 \u2192 Man City menang:
  \u2705 Menang: 200.000 \xd7 1.75 = *Rp 350.000*
  \u274c Kalah: Rp 200.000 *hangus*

${hr}
\ud83d\udd0d *ARTI ODDS:*
  1.10-1.40 \u2192 Favorit berat (untung kecil)
  1.70-2.10 \u2192 Tim kuat (untung lumayan)
  2.50-4.00 \u2192 Underdog (untung besar)
  5.00+     \u2192 Underdog besar (jarang menang)

${hr}
\u21a9\ufe0f Balik: *!menu bola*`,

'1x2':
`\ud83c\udfaf *PANDUAN TARUHAN 1X2*
${hr}

Tebak salah satu dari 3:
  *1* = Home (tuan rumah) menang
  *X* = Seri / Draw
  *2* = Away (tamu) menang

${hr}
Match: *Liverpool (H) vs Chelsea (A)*
  \ud83c\udfe0 Liverpool menang : *1.85*
  \ud83e\udd1d Seri             : *3.40*
  \u2708\ufe0f Chelsea menang   : *4.00*

Bet Rp 500.000:
  Liverpool menang \u2192 \u2705 500.000 \xd7 1.85 = *Rp 925.000*
  Seri             \u2192 \u2705 500.000 \xd7 3.40 = *Rp 1.700.000*
  Chelsea menang   \u2192 \u2705 500.000 \xd7 4.00 = *Rp 2.000.000*

${hr}
\u2328\ufe0f *CARA PASANG:*
  !bet LV12 1x2 h 500000  \u2192 Bet Home
  !bet LV12 1x2 d 500000  \u2192 Bet Seri
  !bet LV12 1x2 a 500000  \u2192 Bet Away

${hr}
\u21a9\ufe0f Balik: *!menu bola*`,

hdp:
`\u2696\ufe0f *PANDUAN ASIAN HANDICAP (HDP)*
${hr}

*Handicap* = sistem voor untuk menyeimbangkan
kekuatan dua tim yang tidak seimbang.

${hr}
\ud83d\udd22 *JENIS GARIS HANDICAP:*

*HDP 0* \u2192 Jika seri = taruhan refund
*HDP -0.5* \u2192 Home harus menang min 1 gol
*HDP -1* \u2192 Home harus menang min 2 gol
            (Selisih 1 = REFUND)
*HDP -1.5* \u2192 Home harus menang min 2 gol
            (Tidak ada refund)

${hr}
\ud83e\udde0 *CONTOH: Real Madrid -1 vs Atletico*
  Madrid menang 3-0 \u2192 \u2705 *MENANG*
  Madrid menang 2-1 \u2192 \u274c *KALAH*
  Madrid menang 1-0 \u2192 \ud83d\udd04 *REFUND*
  Seri / Atletico menang \u2192 \u274c *KALAH*

${hr}
\u2328\ufe0f !bet LV12 hdp h 200000  \u2192 Bet Home
    !bet LV12 hdp a 200000  \u2192 Bet Away

\u21a9\ufe0f Balik: *!menu bola*`,

ou:
`\ud83d\udcc8 *PANDUAN OVER/UNDER (O/U)*
${hr}

Tebak apakah TOTAL GOL lebih banyak (Over)
atau lebih sedikit (Under) dari garis tertentu.
Tidak perlu tebak siapa yang menang!

${hr}
\ud83d\udd22 *GARIS O/U:*
  Garis 2.5: Over \u2265 3 gol | Under \u2264 2 gol
  Garis 3.0: Over \u2265 4 gol | Under \u2264 2 gol (tepat 3 = refund)
  Garis 3.5: Over \u2265 4 gol | Under \u2264 3 gol

${hr}
\ud83e\udde0 *CONTOH: Barcelona vs PSG, O/U 2.5*
  Skor 2-1 (3 gol) \u2192 \u2705 Over *MENANG* \u2192 Rp 570.000
  Skor 1-1 (2 gol) \u2192 \u274c Under *KALAH*
  Skor 0-0 (0 gol) \u2192 \u274c Under *KALAH*

${hr}
\u2328\ufe0f !bet LV12 ou o 300000  \u2192 Bet Over
    !bet LV12 ou u 300000  \u2192 Bet Under

\ud83d\udca1 Tim ofensif (PSG, Liverpool) \u2192 cenderung Over
\ud83d\udca1 Tim defensive (Atletico) \u2192 cenderung Under

\u21a9\ufe0f Balik: *!menu bola*`,

parlayajar:
`\ud83c\udfb0 *PANDUAN MIX PARLAY*
${hr}

Gabung beberapa taruhan dari pertandingan
BERBEDA dalam 1 tiket. Odds DIKALI semua!

\u2705 Semua pilihan HARUS benar untuk menang
\u274c Satu saja salah = SEMUA KALAH

${hr}
\ud83e\udde0 *CONTOH 3 LEG:*
  Match 1: Man City menang  | odds 1.75
  Match 2: Over 2.5 gol     | odds 1.90
  Match 3: Real Madrid      | odds 1.80

  Total odds = 1.75 \xd7 1.90 \xd7 1.80 = *5.985*
  Modal Rp 100.000 \u2192 dapat *Rp 598.500*

${hr}
\u2328\ufe0f *CARA PASANG:*
  !bola                     \u2192 Lihat match
  !parlay AB12 1x2 h        \u2192 Tambah leg 1
  !parlay CD34 ou o         \u2192 Tambah leg 2
  !parlaylihat              \u2192 Cek slip
  !parlaybet 100000         \u2192 Pasang taruhan
  !parlaybatal              \u2192 Batalkan slip

Min 2 leg \u2014 Maks 8 leg
\u21a9\ufe0f Balik: *!menu bola*`,

farming:
`\ud83c\udf3e *FARMING & INDUSTRI*
${hr}

\ud83c\udf31 *PERTANIAN*
\u2022 !tanam <nama>       \u2192 Mulai menanam
  Tanaman: padi | jagung | bawang | kopi | sawit
\u2022 !ladang             \u2192 Cek status kebun & panen
\u2022 !panen              \u2192 Ambil hasil yang sudah matang
\u2022 !pasar              \u2192 Cek harga jual komoditas hari ini
\u2022 !jual <nama> <jml>  \u2192 Jual hasil panen

\ud83c\udfed *MESIN PABRIK*
\u2022 !toko               \u2192 Daftar mesin + harga
\u2022 !beli <mesin>       \u2192 Beli mesin pabrik
\u2022 !olah <mesin> <jml> \u2192 Masukkan bahan ke mesin
\u2022 !pabrik             \u2192 Ambil hasil olahan

  \u2514 gilingan \u2192 Padi \u2192 Beras
  \u2514 roaster \u2192 Kopi \u2192 Kopi Premium
  \u2514 pabrik_minyak \u2192 Sawit \u2192 Minyak Goreng

\ud83c\udfd7\ufe0f *PABRIK INDUSTRI*
\u2022 !pabrik help        \u2192 Panduan lengkap industri

${hr}
\u2705 Cek !pasar sebelum jual \u2014 harga naik turun!
\u2705 Event Musim Panen = hasil 3x!
\u21a9\ufe0f Balik: *!menu*`,

ternak:
`\ud83d\udc04 *PETERNAKAN (RANCH)*
${hr}

\ud83d\udcd6 *INFO & KANDANG*
\u2022 !kandang            \u2192 Cek kondisi semua hewan

\ud83d\uded2 *BELI HEWAN*
\u2022 !belihewan          \u2192 Katalog hewan + harga
\u2022 !belihewan <jenis>  \u2192 Beli hewan
  ayam 50rb | gurame 200rb | kambing 3jt | sapi 15jt

\ud83c\udf3f *PAKAN & PERAWATAN*
\u2022 !pakan <no> <jenis> \u2192 Beri makan hewan
  dedak (lambat) | pelet (sedang) | premium (cepat!)
\u2022 !obati <no>         \u2192 Obati hewan sakit

\ud83d\udcb0 *JUAL HEWAN*
\u2022 !jualhewan <no>     \u2192 Jual berdasarkan berat
  \ud83c\udf1f Bonus +10% jika berat MAX & hewan sehat

\u26a0\ufe0f Tidak diberi makan lama = MATI!
\u2705 Maks 8 ekor per kandang
\u21a9\ufe0f Balik: *!menu*`,

mining:
`\u26cf\ufe0f *MINING & CRYPTO*
${hr}

\u26cf\ufe0f *MINING BTC*
\u2022 !mining / !miner    \u2192 Dashboard rig & hashrate
\u2022 !claimmining        \u2192 Panen BTC
\u2022 !topminer           \u2192 Ranking hashrate

\ud83d\uded2 *BELI ALAT*
\u2022 !shopminer          \u2192 Toko VGA legal
\u2022 !belivga <kode>     \u2192 Beli VGA (contoh: !belivga rtx4090)
\u2022 !bm / !blackmarket  \u2192 Black Market \u2014 alat ilegal

\ud83d\udd27 *UPGRADE RIG*
\u2022 !upgrade cooling    \u2192 Kurangi risiko overheat
\u2022 !upgrade psu        \u2192 Hemat listrik 30%
\u2022 !upgrade firewall   \u2192 Kebal dari !hack

\ud83d\udcb9 *TRADING CRYPTO*
\u2022 !market             \u2192 Harga live semua koin
\u2022 !buycrypto <koin> <jml>  \u2192 Beli crypto
\u2022 !sellcrypto <koin> <jml> \u2192 Jual crypto
\u2022 !pf / !porto        \u2192 Portofolio crypto

${hr}
\u2705 PSU upgrade = hemat listrik 30%
\u2705 Event Rush Tambang = hasil 5x, listrik GRATIS!
\u21a9\ufe0f Balik: *!menu*`,

investasi:
`\ud83d\udcc8 *INVESTASI*
${hr}

\ud83d\udcca *PASAR SAHAM BEI*
\u2022 !saham / !stock          \u2192 Cek harga saham real-time
\u2022 !belisaham <kode> <jml>  \u2192 Beli saham
\u2022 !jualsaham <kode> <jml>  \u2192 Jual saham
\u2022 !chart <kode>            \u2192 Grafik pergerakan harga
\u2022 !pf / !porto             \u2192 Portofolio + P/L

\ud83d\udcb1 *VALAS & EMAS*
\u2022 !kurs / !forex      \u2192 Kurs live USD, EUR, JPY & Emas
\u2022 !beliemas <gram>    \u2192 Beli emas
\u2022 !jualemas <gram>    \u2192 Jual emas ke rupiah
\u2022 !beliusd / !belieur / !belijpy \u2192 Beli mata uang asing
\u2022 !aset               \u2192 Portofolio valas + valuasi

\ud83c\udfe2 *PROPERTI & BISNIS*
\u2022 !properti           \u2192 Katalog bisnis & aset
\u2022 !beliusaha <id>     \u2192 Beli bisnis / properti
\u2022 !collect / !tagih   \u2192 Ambil pendapatan pasif

${hr}
\u2705 Emas = paling aman saat pasar bergejolak
\u2705 Properti = pendapatan pasif tanpa kerja
\u21a9\ufe0f Balik: *!menu*`,

jobs:
`\ud83d\udcbc *PEKERJAAN (JOBS)*
${hr}

\ud83d\udccb *CARI & LAMAR KERJA*
\u2022 !jobs               \u2192 Lihat semua lowongan + gaji + skill
\u2022 !lamar <nama>       \u2192 Lamar pekerjaan
\u2022 !skill              \u2192 Lihat skill aktif dari pekerjaanmu

\u23f1\ufe0f *KERJA HARIAN*
\u2022 !kerja / !work      \u2192 Ambil gaji (ada cooldown!)

\ud83d\udeb6 *KELUAR KERJA*
\u2022 !resign             \u2192 Resign dari pekerjaan
  \u26a0\ufe0f _Resign sebelum gajian = kehilangan gaji!_

${hr}
\u2705 Gaji berkala yang bisa diklaim rutin
\u2705 Skill khusus yang memperkuat karakter
\u2705 Beberapa job beri bonus mining / farming / duel
\u21a9\ufe0f Balik: *!menu*`,

negara:
`\ud83c\udff3\ufe0f *NEGARA & PERANG*
${hr}

\ud83c\udf0f *KELOLA NEGARA*
\u2022 !negara / !nation   \u2192 Dashboard negara kamu
\u2022 !buatnegara <nama>  \u2192 Buat negara baru (Biaya 5 Miliar!)
\u2022 !listnegara         \u2192 Daftar semua negara
\u2022 !topnegara          \u2192 Ranking negara terkuat

\ud83c\udfd7\ufe0f *INFRASTRUKTUR*
\u2022 !bangun bank        \u2192 Naikkan kapasitas pajak (10 Juta)
\u2022 !bangun benteng     \u2192 Tingkatkan pertahanan (25 Juta)
\u2022 !bangun rs          \u2192 Kurangi korban perang (5 Juta)

\u2694\ufe0f *MILITER & PERANG*
\u2022 !rekrut <jml>       \u2192 Beli tentara (50 Juta/orang)
\u2022 !serang @target     \u2192 Deklarasi perang
  \u26a0\ufe0f _Kalah perang = kas negara dirampas musuh!_

\ud83d\udcb0 *EKONOMI NEGARA*
\u2022 !pajaknegara        \u2192 Tarik pajak dari seluruh rakyat
\u2022 !subsidi <jml>      \u2192 Transfer uang pribadi \u2192 kas negara
\u2022 !korupsi <jml>      \u2192 Ambil uang dari kas
  \u26a0\ufe0f _Korupsi berlebihan = rakyat memberontak!_

${hr}
\u21a9\ufe0f Balik: *!menu*`,

event:
`\ud83c\udf89 *ADMIN ABUSE EVENT SYSTEM*
${hr}

\u26a1 *KONTROL EVENT (Admin Grup)*
\u2022 !adminabuseon       \u2192 \ud83d\udfe2 Mulai event (30 menit)
\u2022 !adminabuseoff      \u2192 \ud83d\udd34 Matikan paksa event
\u2022 !abuseinfo          \u2192 \u2139\ufe0f Status event yang aktif

\ud83d\uddcf\ufe0f *CARA KERJA*
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 \u23f1\ufe0f Durasi total : 30 menit   \u2502
\u2502 \ud83d\udd04 Ganti event  : tiap 5 mnt \u2502
\u2502 \ud83c\udfb2 Total event  : 12 (acak)  \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

\ud83d\udccb *12 EVENT RANDOM*
 1. \ud83c\udf27\ufe0f *Hujan Uang* \u2014 Semua dapat koin gratis
 2. \ud83c\udfb0 *Jackpot Bersama* \u2014 Taruh 50rb, 1 orang menang semua
 3. \ud83d\uded2 *Borong Pasar* \u2014 Diskon 50% semua item & hewan
 4. \u2604\ufe0f *Meteor Langka* \u2014 Ketik KLAIM tercepat = hadiah besar
 5. \ud83c\udf3e *Musim Panen* \u2014 Hasil tani & ternak 3x lipat
 6. \u26cf\ufe0f *Rush Tambang* \u2014 Cooldown 0 + hasil 5x + listrik gratis
 7. \ud83c\udfb2 *Winrate Gila* \u2014 Casino/Slot/Rolet/Mines winrate 85%!
 8. \u2694\ufe0f *Duel Berhadiah* \u2014 Menang duel dapat +2 Juta bonus
 9. \ud83e\udde0 *Tebak Berhadiah* \u2014 Jawab soal pertama = menang besar
10. \u26a1 *Balapan Klik* \u2014 Ketik kata paling cepat = menang
11. \ud83d\udcca *Lomba Aktif* \u2014 Paling banyak chat 5 menit = menang

${hr}
\u21a9\ufe0f Balik: *!menu*`,

reminder:
`\u23f0 *REMINDER & PENGINGAT*
${hr}

\ud83d\udccc *SET PENGINGAT*
\u2022 !remind 30m Minum obat     \u2192 30 menit lagi
\u2022 !remind 2h Meeting online  \u2192 2 jam lagi
\u2022 !remind 08:30 Sarapan      \u2192 Jam 08:30 hari ini
\u2022 !remind 1d Bayar listrik   \u2192 1 hari lagi
\u2022 !remind 25/12 HUT RI       \u2192 Tanggal tertentu

\u23f1\ufe0f *FORMAT WAKTU*
  30m = 30 menit  |  2h = 2 jam
  1d = 1 hari     |  1w = 1 minggu
  HH:MM = jam spesifik (WIB)
  DD/MM = tanggal bulan ini

\ud83d\udccb *KELOLA REMINDER*
\u2022 !remindlist           \u2192 Lihat semua reminder aktif
\u2022 !reminddel <ID>       \u2192 Hapus reminder berdasarkan ID
\u2022 !remindclear          \u2192 Hapus semua remindermu

${hr}
\u26a0\ufe0f _Waktu berdasarkan WIB (UTC+7)_
\u21a9\ufe0f Balik: *!menu*`,

group:
`\ud83d\udc65 *MANAJEMEN GRUP*
${hr}

\ud83d\udc51 *TAG & MENTION*
\u2022 !tagall              \u2192 Tag semua anggota grup
\u2022 !hidetag <pesan>     \u2192 Tag tersembunyi (tidak notif)
\u2022 !listadmin           \u2192 Lihat daftar admin grup

\ud83d\udeb6 *KELOLA ANGGOTA (Admin)*
\u2022 !kick @user          \u2192 Keluarkan anggota
\u2022 !add 628xxx          \u2192 Tambahkan nomor ke grup
\u2022 !promote @user       \u2192 Jadikan admin
\u2022 !demote @user        \u2192 Turunkan dari admin

\ud83d\udd12 *KEAMANAN GRUP (Admin)*
\u2022 !antilink on/off     \u2192 Toggle anti-link
\u2022 !antispam on/off     \u2192 Toggle anti-spam
\u2022 !mute                \u2192 Bisukan grup
\u2022 !unmute              \u2192 Buka mute grup

\ud83d\udcac *PESAN OTOMATIS (Admin)*
\u2022 !welcome <pesan>     \u2192 Set sambutan member baru
  _Gunakan {name} untuk sebut nama member_
\u2022 !goodbye <pesan>     \u2192 Set pesan perpisahan
\u2022 !setrules <peraturan>\u2192 Set peraturan grup
\u2022 !rules               \u2192 Tampilkan peraturan grup
\u2022 !setdesc <deskripsi> \u2192 Ubah deskripsi grup

\ud83d\udccb *INFO GRUP*
\u2022 !groupinfo           \u2192 Info lengkap grup
\u2022 !idgrup              \u2192 Tampilkan ID grup ini

${hr}
\u26a0\ufe0f _Bot harus menjadi admin untuk kick/add_
\u21a9\ufe0f Balik: *!menu*`,

kalkulator:
`\ud83e\uddee *KALKULATOR & KONVERSI*
${hr}

\ud83d\udd22 *KALKULATOR EKSPRESI*
\u2022 !kalk 2+2*10          \u2192 Hasil: 22
\u2022 !kalk sqrt(144)       \u2192 Akar kuadrat: 12
\u2022 !kalk sin(30)         \u2192 Trigonometri
\u2022 !kalk 2^10            \u2192 Perpangkatan: 1024
\u2022 !calc <ekspresi>      \u2192 Alias dari !kalk

\ud83d\udcb9 *PERSENTASE & DISKON*
\u2022 !persen 20 dari 500000  \u2192 20% dari 500.000 = 100.000
\u2022 !diskon 30 dari 250000  \u2192 Harga setelah diskon 30%

\ud83c\udfcb\ufe0f *KESEHATAN*
\u2022 !bmi 70 175           \u2192 BMI (berat 70kg, tinggi 175cm)

\ud83c\udfe6 *KEUANGAN*
\u2022 !cicilan 100jt 12% 24 \u2192 Simulasi cicilan KPR/kredit
\u2022 !zakat 5000000        \u2192 Hitung zakat maal
\u2022 !bunga 50000000 6 12  \u2192 Bunga deposito

\ud83d\udccf *KONVERSI SATUAN*
\u2022 !konversi 5 km ke mile    \u2192 Panjang/jarak
\u2022 !konversi 100 usd ke idr  \u2192 Mata uang (real-time)
\u2022 !konversi 70 kg ke lbs    \u2192 Berat
\u2022 !konversi 100 c ke f      \u2192 Suhu
\u2022 !konversi 1 gb ke mb      \u2192 Data digital
\u2022 !konversi 1 jam ke detik  \u2192 Waktu

${hr}
_Mendukung: +, -, *, /, ^, sqrt, sin, cos, tan, log_
\u21a9\ufe0f Balik: *!menu*`,

info:
`\ud83d\udcf0 *INFO, BERITA & CUACA*
${hr}

\ud83d\udcf0 *BERITA TERKINI*
\u2022 !berita               \u2192 Berita terpopuler hari ini
\u2022 !berita teknologi     \u2192 Berita tech & gadget
\u2022 !berita ekonomi       \u2192 Berita bisnis & ekonomi
\u2022 !berita olahraga      \u2192 Berita sport terkini
\u2022 !berita hiburan       \u2192 Berita entertainment
\u2022 !berita sains         \u2192 Berita ilmu pengetahuan

\ud83d\udcb1 *KURS & MATA UANG*
\u2022 !kurs                 \u2192 Kurs semua mata uang vs IDR
\u2022 !dollar / !usd        \u2192 Kurs USD/IDR hari ini
\u2022 !euro                 \u2192 Kurs EUR/IDR

\u20bf *CRYPTO REALTIME*
\u2022 !btc                  \u2192 Harga Bitcoin terkini
\u2022 !eth                  \u2192 Harga Ethereum
\u2022 !crypto               \u2192 Harga 20 kripto teratas
\u2022 !market               \u2192 Overview market crypto

\ud83c\udf24\ufe0f *CUACA & PRAKIRAAN*
\u2022 !cuaca Jakarta        \u2192 Cuaca kota sekarang
\u2022 !cuaca Surabaya       \u2192 Ganti nama kota sesuai
\u2022 !prakiraan Bandung    \u2192 Prakiraan 5 hari ke depan

\u26fd *INFO HARGA*
\u2022 !bbm                  \u2192 Harga BBM terkini
\u2022 !emas                 \u2192 Harga emas hari ini
\u2022 !saham <kode>         \u2192 Harga saham tertentu

${hr}
\u21a9\ufe0f Balik: *!menu*`,

utilitas:
`\ud83d\udd27 *UTILITAS & TOOLS DIGITAL*
${hr}

\ud83d\udcf1 *QR CODE & LINK*
\u2022 !qr <teks/link>       \u2192 Buat QR code dari teks/URL
\u2022 !short <url>          \u2192 Perpendek URL panjang
\u2022 !unshort <url>        \u2192 Lihat URL asli dari link pendek

\ud83d\udd10 *PASSWORD & KEAMANAN*
\u2022 !password 16 strong   \u2192 Password 16 karakter kuat
\u2022 !password 6 pin       \u2192 PIN 6 digit
\u2022 !uuid                 \u2192 Generate UUID/GUID unik

\ud83d\udd12 *ENKRIPSI & HASH*
\u2022 !base64 encode <teks> \u2192 Encode ke Base64
\u2022 !base64 decode <hash> \u2192 Decode dari Base64
\u2022 !md5 <teks>           \u2192 Hash MD5
\u2022 !sha256 <teks>        \u2192 Hash SHA-256

\ud83c\udf10 *JARINGAN & IP*
\u2022 !ip                   \u2192 Cek IP publik kamu
\u2022 !ip 8.8.8.8           \u2192 Info lokasi IP tertentu
\u2022 !ping google.com      \u2192 Ping website
\u2022 !whois google.com     \u2192 Info domain/website

\ud83d\udd52 *WAKTU & TIMER*
\u2022 !waktu                \u2192 Waktu saat ini di berbagai kota
\u2022 !countdown 25/12/2025 \u2192 Hitung mundur ke tanggal

\ud83d\udce5 *DOWNLOADER*
\u2022 !tiktok <link>        \u2192 Download TikTok tanpa watermark
\u2022 !ig <link>            \u2192 Download foto/video Instagram

\ud83c\udfb2 *RANDOM TOOLS*
\u2022 !dice                 \u2192 Lempar dadu (1-6)
\u2022 !coin                 \u2192 Lempar koin (Heads/Tails)
\u2022 !random 1 100         \u2192 Random angka 1-100
\u2022 !pilih A B C          \u2192 Pilih secara acak dari opsi

${hr}
\ud83d\udca1 _Semua tools gratis, tidak kurangi saldo_
\u21a9\ufe0f Balik: *!menu*`,

ai:
`\ud83e\udde0 *FITUR AI (KECERDASAN BUATAN)*
${hr}

\ud83d\udcac *CHAT DENGAN AI*
\u2022 !ai <pesan>           \u2192 Chat AI umum (cepat & gratis)
\u2022 !ai0 <pesan>          \u2192 AI Premium (Gemini/GPT-4/DeepSeek)
\u2022 !ai1 <pesan>          \u2192 AI Smart \u2014 jawaban mendalam
\u2022 !ai2 <pesan>          \u2192 AI Creative \u2014 nulis kreatif
\u2022 !ai3 <pesan>          \u2192 AI Fast \u2014 jawaban singkat cepat

\ud83c\udfad *PERSONA AI*
\u2022 !persona              \u2192 Lihat 10 persona tersedia
\u2022 !persona <nama>       \u2192 Ganti karakter AI
  _(contoh: !persona guru / chef / dokter)_

\ud83d\udcca *STATISTIK & MEMORI*
\u2022 !aistat               \u2192 Statistik chat AI kamu
\u2022 !resetai              \u2192 Reset memori AI
\u2022 !sharechat            \u2192 Share riwayat percakapan

\ud83d\uddbc\ufe0f *AI ANALISIS GAMBAR*
\u2022 !aianalysis + kirim gambar \u2192 AI analisis isi gambar

\ud83d\udd27 *AI TOOLS*
\u2022 !summarize <link/teks> \u2192 Ringkas artikel/teks panjang
\u2022 !translate id <teks>  \u2192 Terjemah ke Indonesia
\u2022 !translate en <teks>  \u2192 Terjemah ke Inggris
\u2022 !ocr + gambar         \u2192 Baca teks dari foto/screenshot
\u2022 !codereview <kode>    \u2192 Review & debug kode
\u2022 !improve <teks>       \u2192 Perbaiki tulisan/essay
\u2022 !grammar <teks>       \u2192 Cek & koreksi grammar
\u2022 !sentiment <teks>     \u2192 Analisis sentimen
\u2022 !explain <topik>      \u2192 Jelaskan secara sederhana
\u2022 !fakta <klaim>        \u2192 Cek fakta / deteksi hoaks

${hr}
\u2705 !ai2 untuk konten kreatif (puisi, cerpen)
\u2705 !ai1 untuk analisis & pertanyaan teknis
\u21a9\ufe0f Balik: *!menu*`,

tools:
`\ud83d\udee0\ufe0f *TOOLS & UTILITAS MULTIMEDIA*
${hr}

\ud83c\udfa8 *STIKER*
\u2022 !sticker / !s         \u2192 Gambar/GIF \u2192 stiker WA
\u2022 !stickertext <teks>   \u2192 Buat stiker dari teks
  _(Reply gambar + ketik !s)_

\ud83d\udd0a *TEXT TO SPEECH (TTS)*
\u2022 !tts <teks>           \u2192 Ubah teks jadi pesan suara
\u2022 !tts en / !tts id     \u2192 TTS bahasa Inggris / Indonesia

\ud83d\udcc4 *PDF TOOLS*
\u2022 !pdf + kirim dok      \u2192 Baca & ekstrak teks dari PDF
\u2022 !pdfinfo <link>       \u2192 Info detail file PDF dari URL

\ud83d\uddbc\ufe0f *IMAGE GENERATOR (AI)*
\u2022 !img <deskripsi>      \u2192 Generate gambar dari teks
\u2022 !imgstyle <style> <deskripsi> \u2192 Generate dengan style
  _(anime, realistic, cartoon, painting, cyberpunk, dll)_
\u2022 !imgvariasi <deskripsi> \u2192 3 variasi gambar sekaligus

\ud83d\udd0d *BACKGROUND*
\u2022 !removebg + gambar    \u2192 Hapus background otomatis
\u2022 !bg <warna> + gambar  \u2192 Ganti background dengan warna

\ud83c\udf10 *WIKIPEDIA*
\u2022 !wiki <topik>         \u2192 Info dari Wikipedia Indonesia
\u2022 !wikien <topik>       \u2192 Wikipedia bahasa Inggris

\ud83c\udfae *GAME TEBAK-TEBAKAN*
\u2022 !wordle               \u2192 Game Wordle Indonesia
\u2022 !trivia               \u2192 Quiz trivia berbagai kategori
\u2022 !akinator             \u2192 Akinator tebak pikiranmu

${hr}
\u2705 Video pendek + !s \u2192 stiker animasi (GIF)
\u2705 Gunakan bahasa Inggris untuk !img terbaik
\u21a9\ufe0f Balik: *!menu*`,

mood:
`\ud83d\udd2e *MOOD, ZODIAK & RAMALAN*
${hr}

\ud83d\ude0a *MOOD TRACKER*
\u2022 !mood                 \u2192 Cek mood kamu hari ini
\u2022 !mood happy           \u2192 Set mood senang
\u2022 !mood sad             \u2192 Set mood sedih
\u2022 !mood marah           \u2192 Set mood marah
\u2022 !moodstats            \u2192 Statistik mood minggu ini
\u2022 !moodhistory          \u2192 Riwayat mood kamu

\u2648 *ZODIAK & HOROSKOP*
\u2022 !zodiak               \u2192 Ramalan zodiak hari ini
\u2022 !zodiak <nama>        \u2192 Horoskop zodiak tertentu
  _(Aries, Taurus, Gemini, Cancer, Leo, Virgo,_
   _Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces)_
\u2022 !zodiakmatch @user    \u2192 Kecocokan zodiak dengan user

\ud83c\udfaf *RAMALAN & FUN*
\u2022 !shio                 \u2192 Ramalan shio Tionghoa
\u2022 !mbti                 \u2192 Tes kepribadian MBTI singkat
\u2022 !lucky                \u2192 Nomor hoki hari ini
\u2022 !fortune              \u2192 Fortune cookie acak

${hr}
\u21a9\ufe0f Balik: *!menu*`,

catur:
`\ud83c\udfae *MINI GAME INTERAKTIF*
${hr}

\u265f\ufe0f *CATUR (CHESS)*
\u2022 !catur               \u2192 Main catur vs AI (link browser)
\u2022 !catur easy          \u2192 Mudah (untuk pemula)
\u2022 !catur medium        \u2192 Medium (default)
\u2022 !catur hard          \u2192 Susah (untuk yang mahir)
  \u26a0\ufe0f Taruhan saldo berlaku! Minimal 10.000

\ud83d\udc0d *SLITHER (Ular)*
\u2022 !slither             \u2192 Main Slither.io di browser
\u2022 !slitherbet <jml>    \u2192 Pasang taruhan sebelum main

\u2694\ufe0f *RPG BATTLE*
\u2022 !rpg                 \u2192 Masuk ke menu RPG
\u2022 !rpgstart            \u2192 Mulai petualangan RPG
\u2022 !rpgstatus           \u2192 Status karakter RPG
\u2022 !rpgbattle           \u2192 Battle musuh di RPG

\ud83d\udca3 *MINES (Minesweeper)*
\u2022 !mines <taruhan>     \u2192 Main minesweeper dengan taruhan
  _(Pilih kotak \u2014 hindari bom! Cashout kapan saja)_

\ud83c\udfaf *GAME LAINNYA*
\u2022 !duel @user <taruhan> \u2192 Tantang duel 1v1
\u2022 !battle @user        \u2192 Battle karakter RPG
\u2022 !tebak               \u2192 Game tebak kata
\u2022 !wordle              \u2192 Wordle Indonesia

${hr}
_Semua game taruhan menggunakan saldo bot_
\u21a9\ufe0f Balik: *!menu*`,

    }; // end texts

    await msg.reply(texts[found]);
    return true;
};
