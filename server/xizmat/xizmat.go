// Package xizmat — Windows xizmati. Terminal 24/7 ishlashi kerak: darvoza
// va kamera operator tizimdan chiqib ketganda ham ishlaydi
// (VMQ 149, 1-ilova 11-band; TALABLAR H-3, C-4, I-7).
package xizmat

import "context"

const Nom = "JarimaTerminal"
const Tavsif = "Jarima maydonchasi terminali (kamera, darvoza, kassa)"

// Xizmatmi — jarayon Windows xizmati sifatida ishga tushirilganmi.
func Xizmatmi() bool { return xizmatmi() }

// Ishga — xizmat sifatida ishlash. `ish` to'xtatish signaliga qadar ishlaydi.
func Ishga(ish func(ctx context.Context)) error { return ishga(ish) }

// Ornat — xizmatni ro'yxatdan o'tkazadi (avtomatik ishga tushish bilan).
func Ornat(args ...string) error { return ornat(args...) }

func Ochir() error           { return ochir() }
func Boshla() error          { return boshla() }
func Toxtat() error          { return toxtat() }
func Holat() (string, error) { return holat() }
