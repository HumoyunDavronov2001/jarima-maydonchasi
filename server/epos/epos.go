// Package epos — fiskal chek adapteri (TALABLAR To-2, To-12).
// Yagona tashqi integratsiya. Hujjat kelmaguncha `Sinov` ishlatiladi;
// `HTTP` real endpoint uchun tayyor turadi.
package epos

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"sync"
	"time"

	"jarima/yadro"
)

// Sinov — EPOS hujjati kelmaguncha: chekni mahalliy imzo bilan qaytaradi.
// Fiskal belgi SOXTA emas — u "sinov" deb belgilanadi, chalkashmasin.
type Sinov struct {
	Kechikish time.Duration
	mu        sync.Mutex
}

func (s *Sinov) Chek(v *yadro.TV, p yadro.Tolov) (*yadro.Fiskal, error) {
	k := s.Kechikish
	if k == 0 {
		k = 1200 * time.Millisecond
	}
	time.Sleep(k)
	return &yadro.Fiskal{Belgi: "SINOV " + qism() + " " + qism() + " " + qism()}, nil
}

func (s *Sinov) Tirikmi() bool { return true }

func qism() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(65536))
	return fmt.Sprintf("%04X", n.Int64())
}

// HTTP — real EPOS adapteri. Endpoint va yuk shakli hujjat kelganda
// aniqlanadi (TALABLAR Sv-11) — shuning uchun bu yerda faqat transport.
type HTTP struct {
	Manzil string
	Token  string
	Mijoz  *http.Client
	mu     sync.Mutex
	tirik  bool
}

func YangiHTTP(manzil, token string) *HTTP {
	return &HTTP{Manzil: manzil, Token: token, Mijoz: &http.Client{Timeout: 8 * time.Second}}
}

func (e *HTTP) Chek(v *yadro.TV, p yadro.Tolov) (*yadro.Fiskal, error) {
	yuk := map[string]any{
		"plate": v.Raqam, "vin": v.VIN, "amount": p.Summa, "method": p.Usul,
		"items": p.Qatorlar, "vat": v.Tarif.QQS, "ref": p.ID,
	}
	b, err := json.Marshal(yuk)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("POST", e.Manzil, bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if e.Token != "" {
		req.Header.Set("Authorization", "Bearer "+e.Token)
	}
	res, err := e.Mijoz.Do(req)
	if err != nil {
		e.holat(false)
		return nil, fmt.Errorf("EPOS: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		e.holat(false)
		return nil, fmt.Errorf("EPOS javobi: %s", res.Status)
	}
	var j struct {
		Belgi  string `json:"fiscal_sign"`
		Havola string `json:"url"`
	}
	if err := json.NewDecoder(res.Body).Decode(&j); err != nil {
		e.holat(false)
		return nil, fmt.Errorf("EPOS javobi o'qilmadi: %w", err)
	}
	e.holat(true)
	return &yadro.Fiskal{Belgi: j.Belgi, Havola: j.Havola}, nil
}

func (e *HTTP) holat(ok bool) {
	e.mu.Lock()
	e.tirik = ok
	e.mu.Unlock()
}

func (e *HTTP) Tirikmi() bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.tirik
}
