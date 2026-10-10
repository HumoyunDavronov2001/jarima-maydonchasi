//go:build !windows

package xizmat

import (
	"context"
	"errors"
)

var xatoFaqatWindows = errors.New("xizmat rejimi faqat Windows da (Linux da systemd ishlatiladi)")

func xizmatmi() bool                            { return false }
func ishga(ish func(ctx context.Context)) error { return xatoFaqatWindows }
func ornat(args ...string) error                { return xatoFaqatWindows }
func ochir() error                              { return xatoFaqatWindows }
func boshla() error                             { return xatoFaqatWindows }
func toxtat() error                             { return xatoFaqatWindows }
func holat() (string, error)                    { return "", xatoFaqatWindows }
