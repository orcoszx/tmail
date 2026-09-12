export default {
  async email(msg, env, ctx) {
    // ambil token dari secret env cloudflare biar aman
    const tg_token = env.BOT_TOKEN;
    const cf_token = env.CF_TOKEN;

    const tujuan = msg.to;
    const pengirim = msg.from;
    const subjek = msg.headers.get("subject") || "(Tanpa Subjek)";

    // list zone id cloudflare
    const zones = [
      "zoneId", //sesuaikan dengan zone id dari setiap domainmu di cloudfalre
      "zoneId", 
    ];

    let chat_id = null;
    try {
      for (const z of zones) {
        const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${z}/email/routing/rules`, {
          headers: { "Authorization": `Bearer ${cf_token}` }
        });
        const data = await res.json();
        
        if (data.result) {
          // cari rule yang nge-match ke alamat email ini
          const rule = data.result.find(r => r.matchers && r.matchers.some(m => m.value === tujuan));
          if (rule && rule.name && rule.name.startsWith("Temp-")) {
            chat_id = rule.name.split("-")[1];
            break; 
          }
        }
      }
    } catch (err) { console.log("error api cloudflare bg"); }

    // kalo ga nemu rule nya, mending stop biar ga nyasar ke email asli lu
    if (!chat_id) return; 

    const raw_mail = await new Response(msg.raw).text();
    const body_bersih = decode_mail(raw_mail);

    const now = new Date();
    const waktu_jkt = now.toLocaleString("id-ID", { 
      timeZone: "Asia/Jakarta", day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    }).replace(/\./g, ':');

    // format text telegram ala hilderan bot (biar keliatan premium)
    const msg_html = 
      `<b>📧 Detail Email</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `<b>👤 Dari:</b> <code>${pengirim}</code>\n` +
      `<b>📥 Kepada:</b> <code>${tujuan}</code>\n` +
      `<b>📝 Subjek:</b> ${subjek}\n` +
      `<b>📅 Dikirim pada:</b> ${waktu_jkt}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `${body_bersih.substring(0, 3500)}`;

    await fetch(`https://api.telegram.org/bot${tg_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat_id, text: msg_html, parse_mode: "HTML" })
    });
  }
};

// fungsi buat baca n ngerapiin isi email mentahan (isinya emg belibet pake regex)
function decode_mail(raw) {
  let b = "";
  const is_b64 = /Content-Transfer-Encoding: base64/i.test(raw);
  const is_qp = /Content-Transfer-Encoding: quoted-printable/i.test(raw);
  
  const txt_match = raw.match(/Content-Type: text\/plain;[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|$)/i);
  b = txt_match ? txt_match[1] : raw.split(/\r?\n\r?\n/).slice(1).join('\n\n').split(/\r?\n--/)[0];
  
  if (is_b64) {
    try { b = decodeURIComponent(escape(atob(b.replace(/\s/g, '')))); } 
    catch (e) { try { b = atob(b.replace(/\s/g, '')); } catch(e2) {} }
  }
  
  if (is_qp || b.includes('=3D')) {
    b = b.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))).replace(/=3D/g, '=');
  }
  
  return b.replace(/<style([\s\S]*?)<\/style>/gi, '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}
