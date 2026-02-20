/**
 * MENU / HELP COMMAND — Tampilkan semua fitur bot
 */
module.exports = async (command, args, msg, user, db, sock) => {
    const valid = ['menu','help','bantuan','fitur','start'];
    if (!valid.includes(command)) return;

    const sub = args[0]?.toLowerCase();

    const menus = {
        ai: `🤖 *MENU AI*\n\n\`!ai\` / \`!tanya\` — Chat dengan AI\n\`!ai0\` — AI Premium (Gemini/Claude/DeepSeek)\n\`!ai1\` — AI Smart (Free)\n\`!ai2\` — AI Creative\n\`!ai3\` — AI Fast\n\`!persona\` — Ganti karakter AI (10 persona!)\n\`!aianalysis\` — Analisis gambar pakai AI\n\`!aistat\` — Statistik penggunaan AI\n\`!resetai\` — Reset memori AI\n\`!sharechat\` — Share riwayat chat`,

        aitools: `🛠️ *MENU AI TOOLS*\n\n\`!summarize\` / \`!ringkas\` — Ringkas teks/artikel/link\n\`!translate\` / \`!terjemah\` — Terjemah ke 15+ bahasa\n\`!ocr\` / \`!baca\` — Baca teks dari gambar\n\`!codereview\` — Review & debug kode\n\`!improve\` — Perbaiki tulisan/essay\n\`!grammar\` — Cek grammar\n\`!sentiment\` — Analisis sentimen teks\n\`!explain\` — Jelaskan topik secara sederhana\n\`!keywords\` — Ekstrak kata kunci\n\`!fakta\` — Cek fakta/hoaks`,

        image: `🎨 *MENU IMAGE*\n\n\`!img\` / \`!gambar\` — Generate gambar AI\n\`!imgstyle <style>\` — Generate dengan style khusus\n\`!imgvariasi\` — 3 variasi gambar\n\`!imghelp\` — Bantuan image generator\n\n*Style:* anime, realistic, cartoon, painting, sketch, watercolor, cyberpunk, fantasy, minimal, vintage\n\n\`!sticker\` / \`!s\` — Buat stiker dari gambar/video`,

        tools: `🔧 *MENU TOOLS*\n\n\`!qr <teks/link>\` — Buat QR code\n\`!password\` — Generate password aman\n\`!uuid\` — Generate UUID\n\`!base64\` — Encode/decode base64\n\`!md5\` — Hash MD5/SHA\n\`!ip\` — Info IP address\n\`!ping <url>\` — Ping website\n\`!waktu\` — Waktu kota dunia\n\`!countdown\` — Countdown ke tanggal`,

        kalk: `🔢 *MENU KALKULATOR*\n\n\`!kalk\` / \`!calc\` — Kalkulator ekspresi\n\`!persen\` — Hitung persen/diskon\n\`!bmi\` — Hitung BMI badan\n\`!cicilan\` — Simulasi kredit/KPR\n\`!zakat\` — Kalkulator zakat\n\`!konversi\` — Konversi satuan (panjang/berat/suhu/data)`,

        info: `📰 *MENU INFO & BERITA*\n\n\`!berita\` — Berita terkini\n\`!berita teknologi\` — Berita tech\n\`!berita ekonomi\` — Berita ekonomi\n\`!berita olahraga\` — Berita sport\n\`!kurs\` — Kurs mata uang terkini\n\`!dollar\` — Kurs USD/IDR\n\`!btc\` — Harga crypto\n\`!cuaca\` — Cuaca kota\n\`!prakiraan\` — Prakiraan 5 hari`,

        reminder: `⏰ *MENU REMINDER*\n\n\`!remind <waktu> <pesan>\` — Set pengingat\n• \`!remind 30m Minum obat\`\n• \`!remind 08:00 Meeting\`\n• \`!remind 1d Bayar tagihan\`\n\`!remindlist\` — Lihat semua reminder\n\`!reminddel <ID>\` — Hapus reminder`,

        group: `👥 *MENU GRUP*\n\n\`!tagall\` — Tag semua anggota\n\`!hidetag\` — Tag tersembunyi\n\`!kick\` — Keluarkan anggota\n\`!add <nomor>\` — Tambahkan anggota\n\`!promote\` — Jadikan admin\n\`!demote\` — Turunkan admin\n\`!groupinfo\` — Info grup detail\n\`!antilink\` — Toggle anti-link\n\`!antispam\` — Toggle anti-spam\n\`!welcome\` — Set welcome message\n\`!goodbye\` — Set goodbye message\n\`!mute\` / \`!unmute\` — Bisukan/buka grup\n\`!setrules\` / \`!rules\` — Peraturan grup`,

        ekonomi: `💰 *MENU EKONOMI & GAME*\n\n\`!daily\` — Klaim harian\n\`!balance\` — Cek saldo\n\`!casino\` — Casino (taruhan)\n\`!transfer\` — Transfer ke user\n\`!bank\` — Banking\n\`!saham\` — Beli/jual saham\n\`!crypto\` — Trading crypto\n\`!toko\` — Toko item\n\`!property\` — Beli properti\n\`!ternak\` — Peternakan\n\`!mining\` — Mining crypto\n\`!profile\` — Profil & net worth`,

        download: `📥 *MENU DOWNLOAD*\n\n\`!tiktok <link>\` — Download TikTok (no watermark)\n\`!sticker\` — Buat stiker WA\n\`!tts <teks>\` — Text to Speech`,
    };

    if (sub && menus[sub]) return msg.reply(menus[sub]);

    const now = new Date();
    const jam = now.getHours();
    const greeting = jam < 12 ? 'Selamat Pagi' : jam < 15 ? 'Selamat Siang' : jam < 18 ? 'Selamat Sore' : 'Selamat Malam';

    const mainMenu = 
        `╔══════════════════════════╗\n` +
        `║   🤖 *ALGOJO BOT v2.0*   ║\n` +
        `║  Bot WA Tercanggih 2025  ║\n` +
        `╚══════════════════════════╝\n\n` +
        `${greeting}, *${msg.pushName || 'Sobat'}*! 👋\n\n` +
        `*📂 Kategori Menu:*\n\n` +
        `🤖 \`!menu ai\` — AI Chat & Persona\n` +
        `🛠️ \`!menu aitools\` — AI Tools (ringkas, translate, OCR)\n` +
        `🎨 \`!menu image\` — AI Image Generator\n` +
        `🔢 \`!menu kalk\` — Kalkulator & Konversi\n` +
        `🔧 \`!menu tools\` — Utilitas (QR, password, waktu)\n` +
        `📰 \`!menu info\` — Berita & Info Terkini\n` +
        `⏰ \`!menu reminder\` — Sistem Pengingat\n` +
        `👥 \`!menu group\` — Manajemen Grup\n` +
        `💰 \`!menu ekonomi\` — Ekonomi & Game\n` +
        `📥 \`!menu download\` — Downloader Media\n\n` +
        `*🌟 Fitur Unggulan v2.0:*\n` +
        `• 10 Persona AI berbeda\n` +
        `• AI Vision (analisis gambar)\n` +
        `• AI Failover 20+ model\n` +
        `• Reminder otomatis\n` +
        `• Group management lengkap\n` +
        `• Fact checker AI\n` +
        `• Code reviewer AI\n` +
        `• Multi-style image generator\n\n` +
        `_Ketik \`!menu <kategori>\` untuk detail_`;

    return msg.reply(mainMenu);
};
