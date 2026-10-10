//go:build windows

package xizmat

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"golang.org/x/sys/windows/svc"
	"golang.org/x/sys/windows/svc/mgr"
)

func xizmatmi() bool {
	ok, err := svc.IsWindowsService()
	return err == nil && ok
}

type ishchi struct {
	ish func(ctx context.Context)
}

func (i *ishchi) Execute(args []string, sorov <-chan svc.ChangeRequest, holat chan<- svc.Status) (bool, uint32) {
	const qabul = svc.AcceptStop | svc.AcceptShutdown
	holat <- svc.Status{State: svc.StartPending}

	ctx, bekor := context.WithCancel(context.Background())
	defer bekor()
	tugadi := make(chan struct{})
	go func() {
		defer close(tugadi)
		i.ish(ctx)
	}()

	holat <- svc.Status{State: svc.Running, Accepts: qabul}
	for {
		select {
		case c := <-sorov:
			switch c.Cmd {
			case svc.Interrogate:
				holat <- c.CurrentStatus
			case svc.Stop, svc.Shutdown:
				holat <- svc.Status{State: svc.StopPending}
				bekor()
				select {
				case <-tugadi:
				case <-time.After(10 * time.Second):
				}
				return false, 0
			}
		case <-tugadi:
			return false, 0
		}
	}
}

func ishga(ish func(ctx context.Context)) error {
	return svc.Run(Nom, &ishchi{ish: ish})
}

func ornat(args ...string) error {
	yol, err := os.Executable()
	if err != nil {
		return err
	}
	yol, _ = filepath.Abs(yol)

	m, err := mgr.Connect()
	if err != nil {
		return fmt.Errorf("xizmat boshqaruvchisi: %w (administrator sifatida ishga tushiring)", err)
	}
	defer m.Disconnect()

	if s, err := m.OpenService(Nom); err == nil {
		s.Close()
		return fmt.Errorf("%s xizmati allaqachon o'rnatilgan", Nom)
	}
	s, err := m.CreateService(Nom, yol, mgr.Config{
		DisplayName:  Tavsif,
		Description:  Tavsif,
		StartType:    mgr.StartAutomatic,
		ErrorControl: mgr.ErrorNormal,
	}, args...)
	if err != nil {
		return fmt.Errorf("xizmat yaratilmadi: %w", err)
	}
	defer s.Close()

	// Qulasa avtomatik qayta ishga tushsin (TALABLAR I-7).
	if err := s.SetRecoveryActions([]mgr.RecoveryAction{
		{Type: mgr.ServiceRestart, Delay: 5 * time.Second},
		{Type: mgr.ServiceRestart, Delay: 15 * time.Second},
		{Type: mgr.ServiceRestart, Delay: 60 * time.Second},
	}, 86400); err != nil {
		return fmt.Errorf("xizmat yaratildi, lekin qayta ishga tushirish sozlanmadi: %w", err)
	}
	return nil
}

func ochir() error {
	m, err := mgr.Connect()
	if err != nil {
		return fmt.Errorf("xizmat boshqaruvchisi: %w (administrator kerak)", err)
	}
	defer m.Disconnect()
	s, err := m.OpenService(Nom)
	if err != nil {
		return fmt.Errorf("%s xizmati topilmadi", Nom)
	}
	defer s.Close()
	s.Control(svc.Stop)
	return s.Delete()
}

func boshla() error {
	m, err := mgr.Connect()
	if err != nil {
		return err
	}
	defer m.Disconnect()
	s, err := m.OpenService(Nom)
	if err != nil {
		return fmt.Errorf("%s xizmati topilmadi — avval o'rnating", Nom)
	}
	defer s.Close()
	return s.Start()
}

func toxtat() error {
	m, err := mgr.Connect()
	if err != nil {
		return err
	}
	defer m.Disconnect()
	s, err := m.OpenService(Nom)
	if err != nil {
		return fmt.Errorf("%s xizmati topilmadi", Nom)
	}
	defer s.Close()
	_, err = s.Control(svc.Stop)
	return err
}

func holat() (string, error) {
	m, err := mgr.Connect()
	if err != nil {
		return "", err
	}
	defer m.Disconnect()
	s, err := m.OpenService(Nom)
	if err != nil {
		return "o'rnatilmagan", nil
	}
	defer s.Close()
	st, err := s.Query()
	if err != nil {
		return "", err
	}
	switch st.State {
	case svc.Running:
		return "ishlayapti", nil
	case svc.Stopped:
		return "to'xtatilgan", nil
	case svc.StartPending:
		return "ishga tushmoqda", nil
	case svc.StopPending:
		return "to'xtamoqda", nil
	}
	return fmt.Sprintf("holat %d", st.State), nil
}
