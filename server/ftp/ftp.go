// Package ftp — kamera uchun ichki FTP server. Kamera raqamni o'zi tanib,
// kadrni shu yerga yozadi (TALABLAR K-2, K-2a). Faqat yozish kerak:
// STOR qabul qilinadi, o'qish qo'llab-quvvatlanmaydi.
package ftp

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Server struct {
	Port  int
	Login string
	Parol string
	Papka string
	Keldi func(nom string, yol string, hajm int64)
	Xato  func(error)

	tinglovchi net.Listener
	yopilmoqda bool
	mu         sync.Mutex
}

func (s *Server) Ishga() error {
	l, err := net.Listen("tcp", fmt.Sprintf(":%d", s.Port))
	if err != nil {
		return fmt.Errorf("FTP %d portini ochib bo'lmadi: %w", s.Port, err)
	}
	s.mu.Lock()
	s.tinglovchi = l
	s.mu.Unlock()
	if err := os.MkdirAll(s.Papka, 0o755); err != nil {
		return err
	}
	go func() {
		for {
			c, err := l.Accept()
			if err != nil {
				s.mu.Lock()
				yopilmoqda := s.yopilmoqda
				s.mu.Unlock()
				if yopilmoqda {
					return
				}
				s.xato(err)
				continue
			}
			go s.mijoz(c)
		}
	}()
	return nil
}

func (s *Server) Yop() {
	s.mu.Lock()
	s.yopilmoqda = true
	l := s.tinglovchi
	s.mu.Unlock()
	if l != nil {
		l.Close()
	}
}

func (s *Server) xato(err error) {
	if s.Xato != nil {
		s.Xato(err)
	}
}

type seans struct {
	s        *Server
	c        net.Conn
	w        *bufio.Writer
	r        *bufio.Reader
	kirgan   bool
	foydalan string
	// ma'lumot ulanishi
	pasv *net.TCPListener
	port *net.TCPAddr
	yol  string
}

func (s *Server) mijoz(c net.Conn) {
	defer c.Close()
	se := &seans{s: s, c: c, w: bufio.NewWriter(c), r: bufio.NewReader(c), yol: "/"}
	se.javob(220, "JM FTP tayyor")
	for {
		c.SetDeadline(time.Now().Add(5 * time.Minute))
		qator, err := se.r.ReadString('\n')
		if err != nil {
			return
		}
		qator = strings.TrimRight(qator, "\r\n")
		if qator == "" {
			continue
		}
		bosh, arg, _ := strings.Cut(qator, " ")
		bosh = strings.ToUpper(bosh)
		if !se.kirgan && bosh != "USER" && bosh != "PASS" && bosh != "QUIT" && bosh != "FEAT" && bosh != "AUTH" {
			se.javob(530, "avval kiring")
			continue
		}
		switch bosh {
		case "USER":
			se.foydalan = arg
			se.javob(331, "parol kerak")
		case "PASS":
			if (s.Login == "" || se.foydalan == s.Login) && (s.Parol == "" || arg == s.Parol) {
				se.kirgan = true
				se.javob(230, "xush kelibsiz")
			} else {
				se.javob(530, "login yoki parol noto'g'ri")
			}
		case "SYST":
			se.javob(215, "UNIX Type: L8")
		case "FEAT":
			se.w.WriteString("211-Xususiyatlar:\r\n UTF8\r\n EPSV\r\n SIZE\r\n211 oxiri\r\n")
			se.w.Flush()
		case "OPTS":
			se.javob(200, "ok")
		case "AUTH":
			se.javob(502, "TLS yo'q")
		case "TYPE":
			se.javob(200, "ok")
		case "NOOP":
			se.javob(200, "ok")
		case "PWD", "XPWD":
			se.javob(257, "\""+se.yol+"\"")
		case "CWD", "XCWD":
			se.yol = tozala(se.yol, arg)
			se.javob(250, "ok")
		case "CDUP":
			se.yol = tozala(se.yol, "..")
			se.javob(250, "ok")
		case "MKD", "XMKD":
			// Kamera papka yasashi mumkin — rozimiz, lekin yasamaymiz:
			// hamma kadr bitta papkaga tushadi.
			se.javob(257, "\""+tozala(se.yol, arg)+"\" yaratildi")
		case "DELE", "RMD":
			se.javob(250, "ok")
		case "SIZE":
			se.javob(213, "0")
		case "LIST", "NLST":
			d, err := se.malumot()
			if err != nil {
				se.javob(425, "ma'lumot ulanishi yo'q")
				continue
			}
			se.javob(150, "ro'yxat")
			d.Close()
			se.javob(226, "tugadi")
		case "PASV":
			l, err := net.ListenTCP("tcp4", &net.TCPAddr{})
			if err != nil {
				se.javob(425, "passiv rejim ochilmadi")
				continue
			}
			se.pasv = l
			ip := se.mahalliyIP()
			p := l.Addr().(*net.TCPAddr).Port
			se.javob(227, fmt.Sprintf("Passiv rejim (%s,%d,%d)", strings.ReplaceAll(ip, ".", ","), p/256, p%256))
		case "EPSV":
			l, err := net.ListenTCP("tcp4", &net.TCPAddr{})
			if err != nil {
				se.javob(425, "passiv rejim ochilmadi")
				continue
			}
			se.pasv = l
			se.javob(229, fmt.Sprintf("Passiv rejim (|||%d|)", l.Addr().(*net.TCPAddr).Port))
		case "PORT":
			a, err := portAjrat(arg)
			if err != nil {
				se.javob(501, "PORT o'qilmadi")
				continue
			}
			se.port = a
			se.javob(200, "ok")
		case "EPRT":
			a, err := eprtAjrat(arg)
			if err != nil {
				se.javob(501, "EPRT o'qilmadi")
				continue
			}
			se.port = a
			se.javob(200, "ok")
		case "STOR", "APPE":
			se.stor(arg)
		case "QUIT":
			se.javob(221, "xayr")
			return
		default:
			se.javob(502, "buyruq qo'llab-quvvatlanmaydi")
		}
	}
}

func (se *seans) stor(arg string) {
	nom := filepath.Base(strings.ReplaceAll(arg, "\\", "/"))
	if nom == "" || nom == "." || nom == "/" {
		se.javob(553, "fayl nomi noto'g'ri")
		return
	}
	d, err := se.malumot()
	if err != nil {
		se.javob(425, "ma'lumot ulanishi yo'q")
		return
	}
	se.javob(150, "qabul qilinmoqda")
	kun := time.Now().Format("2006-01-02")
	papka := filepath.Join(se.s.Papka, kun)
	if err := os.MkdirAll(papka, 0o755); err != nil {
		d.Close()
		se.s.xato(err)
		se.javob(451, "papka yaratilmadi")
		return
	}
	yol := filepath.Join(papka, vaqtPrefiks()+"_"+nom)
	f, err := os.Create(yol)
	if err != nil {
		d.Close()
		se.s.xato(err)
		se.javob(451, "fayl yozilmadi")
		return
	}
	n, kerr := io.Copy(f, d)
	f.Close()
	d.Close()
	if kerr != nil {
		se.s.xato(kerr)
		se.javob(426, "uzildi")
		return
	}
	se.javob(226, "qabul qilindi")
	if se.s.Keldi != nil {
		go se.s.Keldi(nom, yol, n)
	}
}

func (se *seans) malumot() (net.Conn, error) {
	if se.pasv != nil {
		se.pasv.SetDeadline(time.Now().Add(30 * time.Second))
		c, err := se.pasv.Accept()
		se.pasv.Close()
		se.pasv = nil
		return c, err
	}
	if se.port != nil {
		c, err := net.DialTimeout("tcp", se.port.String(), 10*time.Second)
		se.port = nil
		return c, err
	}
	return nil, fmt.Errorf("PASV yoki PORT berilmagan")
}

func (se *seans) mahalliyIP() string {
	if a, ok := se.c.LocalAddr().(*net.TCPAddr); ok {
		if v4 := a.IP.To4(); v4 != nil {
			return v4.String()
		}
	}
	return "127.0.0.1"
}

func (se *seans) javob(kod int, matn string) {
	fmt.Fprintf(se.w, "%d %s\r\n", kod, matn)
	se.w.Flush()
}

func tozala(joriy, arg string) string {
	if arg == "" {
		return joriy
	}
	if strings.HasPrefix(arg, "/") {
		return filepath.Clean(arg)
	}
	return filepath.Clean(filepath.Join(joriy, arg))
}

func portAjrat(arg string) (*net.TCPAddr, error) {
	q := strings.Split(strings.TrimSpace(arg), ",")
	if len(q) != 6 {
		return nil, fmt.Errorf("PORT shakli")
	}
	n := make([]int, 6)
	for i, x := range q {
		v, err := strconv.Atoi(strings.TrimSpace(x))
		if err != nil {
			return nil, err
		}
		n[i] = v
	}
	return &net.TCPAddr{IP: net.IPv4(byte(n[0]), byte(n[1]), byte(n[2]), byte(n[3])), Port: n[4]*256 + n[5]}, nil
}

func eprtAjrat(arg string) (*net.TCPAddr, error) {
	q := strings.Split(arg, "|")
	if len(q) < 4 {
		return nil, fmt.Errorf("EPRT shakli")
	}
	p, err := strconv.Atoi(q[3])
	if err != nil {
		return nil, err
	}
	return &net.TCPAddr{IP: net.ParseIP(q[2]), Port: p}, nil
}

func vaqtPrefiks() string { return time.Now().Format("150405.000") }
