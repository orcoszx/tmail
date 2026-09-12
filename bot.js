require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const crypto = require('crypto');

// narik data domain dari file eksternal biar rapi
const list_domain = require('./domains.json');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is running!');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

// token ngambil dari .env biar aman ditaruh di github
const token_bot = process.env.BOT_TOKEN;
const token_cf = process.env.CF_TOKEN;

const bot = new TelegramBot(token_bot, { polling: true });

// fungsi buat ngenerate prefix email random berbasis hex
const rand_str = (len = 10) => {
    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len); 
};

// nampilin menu awal lengkap sama list domainnya
const kirim_menu = (chat_id) => {
    const teks_awal =
        `🌟 *CraXID Email Generator*\n\n` +
        `Gunakan layanan ini untuk mendapatkan alamat email sementara secara instan.\n\n` +
        `Untuk verifikasi Media Sosial seperti Facebook, Instagram dan lainnya, gunakan domain *my.id*.\n\n` +
        `• *Durasi Aktif:* 2 Jam\n` +
        `• *Status Layanan:* Online`;

    // ngatur tata letak tombol biar rapi jadi 2 ke samping
    const btn_layout = [];
    const max_col = 2;
    let row = [];

    for (let i = 0; i < list_domain.length; i++) {
        const d = list_domain[i];
        
        let btn;
        if (d.status === 'ONLINE') {
             btn = { text: `🟢 ${d.name}`, callback_data: `gen_${d.name}` };
        } else {
             btn = { text: `🔴 ${d.name}`, callback_data: `domain_offline` };
        }

        row.push(btn);

        if (row.length === max_col || i === list_domain.length - 1) {
            btn_layout.push(row);
            row = []; 
        }
    }

    // donasi ditaruh full width di bawah
    btn_layout.push([{ text: `💚 Donate / Donasi`, callback_data: `action_donate` }]);

    const opts = { reply_markup: { inline_keyboard: btn_layout } };
    
    return bot.sendMessage(chat_id, teks_awal, { parse_mode: 'Markdown', ...opts });
};

bot.onText(/\/start/, (msg) => {
    kirim_menu(msg.chat.id);
});

bot.on('callback_query', async (cb) => {
    const chat_id = cb.message.chat.id;
    const msg_id = cb.message.message_id;
    const action = cb.data;

    // handle user yang ngeklik domain mati
    if (action === 'domain_offline') {
        bot.answerCallbackQuery(cb.id, { text: "⚠️ Maaf, domain ini sedang offline (Maintenance).", show_alert: true });
        return;
    }

    // trigger menu donasi
    if (action === 'action_donate') {
        bot.answerCallbackQuery(cb.id); 
        
        try {
            await bot.deleteMessage(chat_id, msg_id);

            const opt_donate = {
                caption: 'Terima kasih atas dukungan kamu! 🙏\nSilakan scan QRIS di atas untuk melakukan donasi.',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: `🔙 Kembali ke Menu`, callback_data: `action_back_to_menu` }]
                    ]
                }
            };
            await bot.sendPhoto(chat_id, 'media/qris.jpg', opt_donate);

        } catch (err) {
            console.error('Error saat berpindah ke menu donasi:', err);
            bot.sendMessage(chat_id, '❌ Maaf, gagal memuat gambar QRIS. Pastikan file media/qris.jpg tersedia.');
        }
        return; 
    }

    // balik ke home
    if (action === 'action_back_to_menu') {
        bot.answerCallbackQuery(cb.id);
        try { await bot.deleteMessage(chat_id, msg_id); } catch (err) { }
        kirim_menu(chat_id);
        return;
    }

    // nembak api cloudflare buat bikin routing
    if (action.startsWith('gen_')) {
        const p_domain = action.split('_')[1];
        const data_dom = list_domain.find(d => d.name === p_domain);
        if (!data_dom) return;
        
        if (data_dom.status !== 'ONLINE') {
             bot.answerCallbackQuery(cb.id, { text: "Domain sedang offline." });
             return;
        }

        const prefix = rand_str(10); 
        const new_mail = `${prefix}@${p_domain}`;
        
        const load_msg = await bot.sendMessage(chat_id, `⏳ *Memproses:* Menyiapkan \`${new_mail}\`...`, { parse_mode: 'Markdown' });

        try {
            const res_api = await axios.post(
                `https://api.cloudflare.com/client/v4/zones/${data_dom.zone}/email/routing/rules`,
                {
                    actions: [{ type: "worker", value: ["temail"] }],
                    matchers: [{ field: "to", type: "literal", value: new_mail }],
                    name: `Temp-${chat_id}-${prefix}`, 
                    enabled: true
                },
                { headers: { Authorization: `Bearer ${token_cf}` } }
            );

            const rule_id = res_api.data.result.id;
            await bot.editMessageText(`✅ *Email berhasil dibuat*\n\n📧 *Alamat:* \`${new_mail}\` \n🕒 *Masa Aktif:* 2 Jam`, { chat_id: chat_id, message_id: load_msg.message_id, parse_mode: 'Markdown' });

            // auto delete rule abis 2 jam
            setTimeout(async () => {
                try {
                    await axios.delete(`https://api.cloudflare.com/client/v4/zones/${data_dom.zone}/email/routing/rules/${rule_id}`, {
                        headers: { Authorization: `Bearer ${token_cf}` }
                    });
                    bot.sendMessage(chat_id, `ℹ️ *Pemberitahuan:* Masa aktif email \`${new_mail}\` telah berakhir.`, {parse_mode: "Markdown" });
                } catch (err) { console.error(err.message); }
            }, 120 * 60 * 1000);

        } catch (err) {
            bot.editMessageText(`❌ *Kesalahan:* Gagal membuat email.`, { chat_id: chat_id, message_id: load_msg.message_id });
        }
        bot.answerCallbackQuery(cb.id);
    }
});
