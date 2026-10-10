// Package rele — shlagbaum relesi. TCP orqali (TALABLAR D-1, D-2).
package rele

import (
	"fmt"
	"net"
	"sync"
	"time"
)

// TCP — oddiy TCP rele: ochish uchun bayt yuboriladi, javob kutiladi.
// Har chaqiruvda timeout bor (TALABLAR Ar-3).
type TCP struct {
	Manzil string
	Buyruq []byte
	mu     sync.Mutex
	tirik  bool
	oxirgi time.Time
}

func YangiTCP(manzil string) *TCP {
	r := &TCP{Manzil: manzil, Buyruq: []byte("ON1\r\n")}
	go r.kuzat()
	return r
}

func (r *TCP) kuzat() {
	for {
		c, err := net.DialTimeout("tcp", r.Manzil, 2*time.Second)
		r.mu.Lock()
		r.tirik = err == nil
		r.oxirgi = time.Now()
		r.mu.Unlock()
		if c != nil {
			c.Close()
		}
		time.Sleep(15 * time.Second)
	}
}

func (r *TCP) Och(ms int) error {
	c, err := net.DialTimeout("tcp", r.Manzil, 2*time.Second)
	if err != nil {
		return fmt.Errorf("rele %s: %w", r.Manzil, err)
	}
	defer c.Close()
	c.SetDeadline(time.Now().Add(3 * time.Second))
	if _, err := c.Write(r.Buyruq); err != nil {
		return fmt.Errorf("rele buyrug'i: %w", err)
	}
	r.mu.Lock()
	r.tirik = true
	r.oxirgi = time.Now()
	r.mu.Unlock()
	return nil
}

func (r *TCP) Tirikmi() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.tirik
}

// Sinov — relesiz ishlash uchun (sozlash va sinov paytida).
type Sinov struct {
	mu     sync.Mutex
	Ochish int
}

func (s *Sinov) Och(ms int) error {
	s.mu.Lock()
	s.Ochish++
	s.mu.Unlock()
	return nil
}

func (s *Sinov) Tirikmi() bool { return true }
