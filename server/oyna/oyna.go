// Package oyna — desktop oynasi. Operator brauzer ochmaydi: dastur o'z
// oynasida ishlaydi (TALABLAR Jo-1, Jo-6).
package oyna

// Sozlama — oyna parametrlari.
type Sozlama struct {
	Manzil    string // http://127.0.0.1:8080
	Sarlavha  string
	Eni       uint
	Boyi      uint
	Papka     string // ma'lumot papkasi ("Ma'lumot papkasi" menyusi ochadi)
	Kesh      string // WebView2 ning ichki papkasi (kesh, cookie)
	Versiya   string
	TolaEkran bool   // darvoza ekrani uchun
	Kalit     string // oyna turi: "ish" yoki "darvoza"
}

// Och — oynani ochadi va yopilguncha qaytmaydi.
// MUHIM: faqat asosiy oqimdan chaqiriladi (WebView2 talabi).
func Och(s Sozlama) error { return och(s) }

// Bormi — shu tizimda oyna ochish mumkinmi.
func Bormi() bool { return bormi() }
