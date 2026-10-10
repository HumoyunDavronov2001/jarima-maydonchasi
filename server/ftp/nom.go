package ftp

import (
	"regexp"
	"strconv"
	"strings"
	"time"
)

// Kadr — fayl nomidan chiqarilgan ma'lumot.
type Kadr struct {
	Kamera  string
	Raqam   string
	Vaqt    time.Time
	Ishonch int
}

var (
	reVaqt    = regexp.MustCompile(`(20\d{2})[-_]?(\d{2})[-_]?(\d{2})[-_ ]?(\d{2})[-_:]?(\d{2})[-_:]?(\d{2})`)
	reIshonch = regexp.MustCompile(`(?i)(?:conf|c)[-_]?(\d{1,3})`)
	reRaqam   = regexp.MustCompile(`^[0-9A-Za-z\p{Cyrillic}]{5,12}$`)
)

// AjratNom — `{cam}_{plate}_{yyyyMMdd_HHmmss}.jpg` va shunga o'xshash
// shakllarni o'qiydi. Kamera modeli aniqlanmagani uchun (Sv-12) qoida
// yumshoq: bo'laklardan kamera, raqam va vaqt topiladi.
func AjratNom(nom string) Kadr {
	k := Kadr{Vaqt: time.Now()}
	asos := nom
	if i := strings.LastIndex(asos, "."); i > 0 {
		asos = asos[:i]
	}
	if m := reVaqt.FindStringSubmatch(asos); m != nil {
		n := func(s string) int { v, _ := strconv.Atoi(s); return v }
		k.Vaqt = time.Date(n(m[1]), time.Month(n(m[2])), n(m[3]), n(m[4]), n(m[5]), n(m[6]), 0, time.Local)
		asos = strings.Replace(asos, m[0], "", 1)
	}
	if m := reIshonch.FindStringSubmatch(asos); m != nil {
		k.Ishonch, _ = strconv.Atoi(m[1])
		asos = strings.Replace(asos, m[0], "", 1)
	}
	bolaklar := []string{}
	for _, b := range strings.FieldsFunc(asos, func(r rune) bool { return r == '_' || r == '-' || r == ' ' }) {
		if b != "" {
			bolaklar = append(bolaklar, b)
		}
	}
	if len(bolaklar) > 0 {
		k.Kamera = bolaklar[0]
	}
	for _, b := range bolaklar[minInt(1, len(bolaklar)):] {
		if reRaqam.MatchString(b) && hamHarfHamRaqam(b) {
			k.Raqam = b
			break
		}
	}
	if k.Raqam == "" && len(bolaklar) > 1 {
		k.Raqam = bolaklar[1]
	}
	return k
}

func hamHarfHamRaqam(s string) bool {
	harf, raqam := false, false
	for _, r := range s {
		switch {
		case r >= '0' && r <= '9':
			raqam = true
		default:
			harf = true
		}
	}
	return harf && raqam
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}
