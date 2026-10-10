//go:build !windows

package oyna

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
)

// och — mahsulot Windows uchun; Linux/macOS da ishlab chiqish qulayligi
// uchun brauzer ochiladi va to'xtatish signali kutiladi.
func och(s Sozlama) error {
	if err := exec.Command("xdg-open", s.Manzil).Start(); err != nil {
		fmt.Println("Oynani ochib bo'lmadi. Brauzerda oching:", s.Manzil)
	} else {
		fmt.Println("Brauzerda ochildi:", s.Manzil)
	}
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	<-sig
	return nil
}

func bormi() bool { return false }
