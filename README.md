<div align="center">

<img src="rasmlar/banner.svg" alt="JARIMA MAYDONCHASI" width="100%"/>

**Jarima maydonchasi uchun to'liq avtomatlashtirilgan tizim:** kamera mashina raqamini taniydi, tizim saqlash haqini soatlab hisoblaydi, EPOS orqali chek chiqaradi va uch shart bajarilgandagina shlagbaumni ochadi.

![Go](https://img.shields.io/badge/Go-1.27-00ADD8?logo=go&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-WebView2-0078D4?logo=windows&logoColor=white)
![Android](https://img.shields.io/badge/Android-Kotlin-3DDC84?logo=android&logoColor=white)
![Litsenziya](https://img.shields.io/badge/Litsenziya-Ed25519-6E40C9)
![Sinovlar](https://img.shields.io/badge/sinovlar-25%20ta%20o'tadi-2ea44f)

</div>

---

## Darvoza qanday ishlaydi

<div align="center">
<img src="rasmlar/darvoza.gif" alt="Haydovchi ekrani: kutish → qarz → ruxsatnoma → yo'l ochiq" width="80%"/>
</div>

Darvoza oldida turgan haydovchi o'z ekranida 8 holatdan birini ko'radi. Shlagbaum faqat **uch shart** birga bajarilganda ochiladi:

1. **Haq to'langan** — EPOS fiskal chek chiqqan;
2. **Amaldagi ruxsatnoma bor** — operator IIV kabinetidan olingan raqamni kiritgan;
3. **Oluvchi aniqlangan** — mashinani kim olib ketayotgani yozilgan.

Bulardan biri yetishmasa, tizim shlagbaumni ochmaydi va sababini ekranda ko'rsatadi.

## Asosiy imkoniyatlar

| | |
|---|---|
| 📷 **ANPR kamera (FTP)** | Kamera raqamni o'zi taniydi va kadrni ichki FTP serverga yozadi. Tizim mashinani avtomatik ro'yxatga oladi |
| ⏱️ **Soatlik tarif** | VMQ 149-son qarori bo'yicha saqlash haqi **soatlab** hisoblanadi. Tarif hokimlik belgilagan chegaradan oshmaydi |
| 🧾 **EPOS fiskal chek** | Kassa EPOS orqali ulanadi. Pul butun so'mda (`int64`) saqlanadi, hech qayerda yaxlitlash xatosi yo'q |
| 🚧 **Shlagbaum (TCP rele)** | Darvozani kamera emas, tizim ochadi. Kamera whitelist'i o'chirilgan |
| 📱 **Hovli telefoni** | Android ilova QR orqali terminalga ulanadi, mashina suratlarini oladi va LAN'da internetsiz ishlaydi |
| 🏛️ **Nazorat paneli** | Prokuratura, soliq va hokimlik faqat ko'rish huquqi bilan kiradi. Rol va hudud **serverda** biriktiriladi, shaxsiy ma'lumot niqoblanadi |
| 🔐 **Litsenziya** | Ed25519 imzoli kalit, kompyuterning 3 ta barmoq izidan 2 tasi mos kelishi kerak. Kalitsiz dastur demo rejimda ishlaydi |
| 🧱 **O'chirilmaydigan jurnal** | Har amal audit jurnaliga yoziladi, SQLite trigger'lari yozuvni o'chirishga yo'l qo'ymaydi |

## Ekranlar

<table>
<tr>
<td width="50%"><img src="rasmlar/01_maydoncha.png" alt="Operator: maydoncha"/><br/><sub><b>Operator ish o'rni</b> — maydonchadagi mashinalar, sektorlar bandligi, qarz va muddat</sub></td>
<td width="50%"><img src="rasmlar/02_kartochka_tayyor.png" alt="Mashina kartochkasi"/><br/><sub><b>Mashina kartochkasi</b> — uch shart holati, to'lov va chiqarish</sub></td>
</tr>
<tr>
<td><img src="rasmlar/14_darvoza_panel.png" alt="Darvoza paneli"/><br/><sub><b>Darvoza paneli</b> — kamera hodisalari va shlagbaum boshqaruvi</sub></td>
<td><img src="rasmlar/09_dalolatnoma.png" alt="Dalolatnoma"/><br/><sub><b>Dalolatnoma</b> — mol-mulk ro'yxati bilan, chop etishga tayyor</sub></td>
</tr>
<tr>
<td><img src="rasmlar/12_hisobot.png" alt="Hisobot"/><br/><sub><b>Hisobot</b> — tushum, kirdi-chiqdi, uzoq turganlar</sub></td>
<td><img src="rasmlar/15_smena.png" alt="Smena"/><br/><sub><b>Smena</b> — kassirning ochilish va yopilish hisobi</sub></td>
</tr>
<tr>
<td><img src="rasmlar/21_prokuratura.png" alt="Prokuratura paneli"/><br/><sub><b>Nazorat: prokuratura</b> — viloyat bo'yicha to'liq ko'rinish</sub></td>
<td><img src="rasmlar/24_hokimlik.png" alt="Hokimlik paneli"/><br/><sub><b>Nazorat: hokimlik</b> — shaxsiy ma'lumotsiz statistika</sub></td>
</tr>
</table>

> Suratlardagi barcha raqamlar, ismlar va tashkilotlar **namuna ma'lumot**.

## Arxitektura

```mermaid
flowchart LR
    CAM[ANPR kamera] -- FTP kadr --> T
    subgraph T[Maydoncha terminali · Go, bitta fayl]
        Y[yadro<br/>tarif va uch shart] --- B[(SQLite WAL<br/>audit trigger)]
        H[hub<br/>40 amal] --- Y
    end
    T -- TCP --> R[Shlagbaum relesi]
    T -- REST --> E[EPOS kassa]
    T -- WebSocket --> D[Darvoza ekrani]
    P[Hovli telefoni<br/>Android] -- LAN, QR --> T
    T -- "HMAC-SHA256, 5 daqiqada<br/>bir yo'nalishli" --> M[Viloyat markazi · VPS]
    M --> N[Nazorat paneli<br/>prokuratura · soliq · hokimlik]
```

- **Terminal** maydonchada turadi va **internetsiz** ishlaydi. Front binar ichiga joylangan, natijada bitta 13 MB fayl chiqadi (Linux va Windows, cgo'siz).
- **Markaz** terminaldan faqat qabul qiladi va terminalga hech qachon buyruq bermaydi. Fotosurat markazga yuborilmaydi, faqat uning xeshi boradi.
- **Windows ilova:** WebView2 oynasi, tizim xizmati (avtomatik qayta ishga tushadi), tray ikonka, darvoza ekrani uchun kiosk rejimi.

## Sifat

- `go test ./...` — hisob yadrosi va litsenziya bo'yicha sinovlar.
- **Front–server mosligi sinovi:** 15 ta holatda front'dagi `store.js` Node'da ishga tushiriladi va natijasi Go hisobi bilan solishtiriladi. Sinovning o'zi ham tekshirilgan: front ataylab buzilganda sinov yiqiladi.
- To'liq zanjir uchidan uchigacha tekshirilgan: FTP kadr → ro'yxatga olish → to'lov → EPOS → ruxsatnoma → uch shart → shlagbaum → dalolatnoma.

## Huquqiy asos

- Vazirlar Mahkamasining 25.05.2011 dagi **149-son** qarori, 1-ilova: saqlash **soatlarda** hisoblanadi, ruxsatnoma «Jarima maydonchasi» axborot tizimi orqali beriladi.
- Tarif chegarasini viloyat hokimligi Moliya vazirligi bilan kelishgan holda belgilaydi. Dasturda o'z narxi (`hour`) hech qachon shiftdan (`capHour`) oshmaydi.

---

<div align="center">

**Manba kodi yopiq.** Namoyish yoki hamkorlik bo'yicha: Telegram [@Humoyun_Davronov](https://t.me/Humoyun_Davronov)

<sub>Muallif — Humoyun Davronov</sub>

</div>
