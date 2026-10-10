//go:build windows

package oyna

import (
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	kernel32 = windows.NewLazySystemDLL("kernel32.dll")
	comdlg32 = windows.NewLazySystemDLL("comdlg32.dll")

	pGetModuleHandleW  = kernel32.NewProc("GetModuleHandleW")
	pCreateMutexW      = kernel32.NewProc("CreateMutexW")
	pLoadIconW         = user32.NewProc("LoadIconW")
	pRegisterClassExW  = user32.NewProc("RegisterClassExW")
	pCreateWindowExW   = user32.NewProc("CreateWindowExW")
	pDefWindowProcW    = user32.NewProc("DefWindowProcW")
	pDestroyWindow     = user32.NewProc("DestroyWindow")
	pCreatePopupMenu   = user32.NewProc("CreatePopupMenu")
	pAppendMenuW       = user32.NewProc("AppendMenuW")
	pDestroyMenu       = user32.NewProc("DestroyMenu")
	pTrackPopupMenu    = user32.NewProc("TrackPopupMenu")
	pGetCursorPos      = user32.NewProc("GetCursorPos")
	pSetForegroundWnd  = user32.NewProc("SetForegroundWindow")
	pPostMessageW      = user32.NewProc("PostMessageW")
	pFindWindowW       = user32.NewProc("FindWindowW")
	pIsIconic          = user32.NewProc("IsIconic")
	pCallWindowProcW   = user32.NewProc("CallWindowProcW")
	pGetWindowLongPtrW = user32.NewProc("GetWindowLongPtrW")
	pShellNotifyIconW  = shell32.NewProc("Shell_NotifyIconW")
	pShellExecuteW     = shell32.NewProc("ShellExecuteW")
	pGetSaveFileNameW  = comdlg32.NewProc("GetSaveFileNameW")
)

const (
	wmDestroy   = 0x0002
	wmClose     = 0x0010
	wmCommand   = 0x0111
	wmApp       = 0x8000
	wmTray      = wmApp + 1
	wmRButtonUp = 0x0205
	wmLButtonUp = 0x0202
	wmLDblClk   = 0x0203

	nimAdd     = 0
	nimDelete  = 2
	nifMessage = 0x01
	nifIcon    = 0x02
	nifTip     = 0x04

	mfString    = 0x0000
	mfSeparator = 0x0800
	mfGrayed    = 0x0001

	tpmRightButton = 0x0002
	tpmReturnCmd   = 0x0100

	swRestore = 9
	swShow    = 5

	gwlpWndProc = ^uintptr(3) // -4

	ofnOverwritePrompt = 0x00000002
	ofnPathMustExist   = 0x00000800
	ofnNoChangeDir     = 0x00000008

	mbYesNoConfirm = mbYesNo | mbIconQuestion
)

/* ---------- bitta nusxa ---------- */

// YagonaNusxa — dastur ikkinchi marta ochilsa yangi oyna ochilmaydi,
// ochiq oyna oldinga chiqariladi (TALABLAR W-5). `kalit` oyna turi
// bo'yicha ajratadi: ish o'rni va darvoza ekrani bir vaqtda ochilishi
// mumkin, lekin har biridan bittadan.
func YagonaNusxa(kalit, sarlavha string) bool {
	nom, _ := windows.UTF16PtrFromString("Local\\JarimaOyna-" + kalit)
	h, _, err := pCreateMutexW.Call(0, 0, uintptr(unsafe.Pointer(nom)))
	if h != 0 && err == syscall.Errno(windows.ERROR_ALREADY_EXISTS) {
		oynaniOldingaChiqar(sarlavha)
		return false
	}
	return true
}

func oynaniOldingaChiqar(sarlavha string) {
	sinf, _ := windows.UTF16PtrFromString("webview")
	s, _ := windows.UTF16PtrFromString(sarlavha)
	hwnd, _, _ := pFindWindowW.Call(uintptr(unsafe.Pointer(sinf)), uintptr(unsafe.Pointer(s)))
	if hwnd == 0 {
		hwnd, _, _ = pFindWindowW.Call(uintptr(unsafe.Pointer(sinf)), 0)
	}
	if hwnd == 0 {
		return
	}
	if r, _, _ := pIsIconic.Call(hwnd); r != 0 {
		pShowWindow.Call(hwnd, swRestore)
	}
	pShowWindow.Call(hwnd, swShow)
	pSetForegroundWnd.Call(hwnd)
}

/* ---------- bildirishnoma sohasi (tray) ---------- */

type notifyIconData struct {
	CbSize           uint32
	HWnd             uintptr
	UID              uint32
	UFlags           uint32
	UCallbackMessage uint32
	HIcon            uintptr
	SzTip            [128]uint16
	DwState          uint32
	DwStateMask      uint32
	SzInfo           [256]uint16
	UVersion         uint32
	SzInfoTitle      [64]uint16
	DwInfoFlags      uint32
	GuidItem         windows.GUID
	HBalloonIcon     uintptr
}

type wndClassEx struct {
	CbSize        uint32
	Style         uint32
	LpfnWndProc   uintptr
	CbClsExtra    int32
	CbWndExtra    int32
	HInstance     uintptr
	HIcon         uintptr
	HCursor       uintptr
	HbrBackground uintptr
	LpszMenuName  *uint16
	LpszClassName *uint16
	HIconSm       uintptr
}

type tray struct {
	hwnd     uintptr
	ikonka   uintptr
	asosiy   func() uintptr // ish o'rni oynasi
	papka    string
	sarlavha string
	versiya  string
}

const (
	idKorsat  = 101
	idPapka   = 102
	idVersiya = 103
	idYopish  = 104
)

var joriyTray *tray

// trayOch — vazifalar panelining bildirishnoma sohasida ikonka. Dastur
// yig'ilganda ham ko'rinib turadi va bir bosishda ochiladi (desktop odati).
func trayOch(t *tray) error {
	hinst, _, _ := pGetModuleHandleW.Call(0)
	sinf, _ := windows.UTF16PtrFromString("JarimaTray")

	wc := wndClassEx{
		Style:         0,
		LpfnWndProc:   windows.NewCallback(trayProc),
		HInstance:     hinst,
		LpszClassName: sinf,
	}
	wc.CbSize = uint32(unsafe.Sizeof(wc))
	if r, _, err := pRegisterClassExW.Call(uintptr(unsafe.Pointer(&wc))); r == 0 {
		return fmt.Errorf("tray sinfi: %w", err)
	}
	hwnd, _, err := pCreateWindowExW.Call(0, uintptr(unsafe.Pointer(sinf)), 0, 0, 0, 0, 0, 0, 0, 0, hinst, 0)
	if hwnd == 0 {
		return fmt.Errorf("tray oynasi: %w", err)
	}
	t.hwnd = hwnd
	t.ikonka, _, _ = pLoadIconW.Call(hinst, 2) // exe ichidagi ikonka (id 2)

	var d notifyIconData
	d.CbSize = uint32(unsafe.Sizeof(d))
	d.HWnd = hwnd
	d.UID = 1
	d.UFlags = nifMessage | nifIcon | nifTip
	d.UCallbackMessage = wmTray
	d.HIcon = t.ikonka
	copy(d.SzTip[:], windows.StringToUTF16(t.sarlavha))
	if r, _, err := pShellNotifyIconW.Call(nimAdd, uintptr(unsafe.Pointer(&d))); r == 0 {
		return fmt.Errorf("tray ikonkasi: %w", err)
	}
	joriyTray = t
	return nil
}

func trayYop() {
	if joriyTray == nil {
		return
	}
	var d notifyIconData
	d.CbSize = uint32(unsafe.Sizeof(d))
	d.HWnd = joriyTray.hwnd
	d.UID = 1
	pShellNotifyIconW.Call(nimDelete, uintptr(unsafe.Pointer(&d)))
	pDestroyWindow.Call(joriyTray.hwnd)
	joriyTray = nil
}

func trayProc(hwnd, xabar, wp, lp uintptr) uintptr {
	switch xabar {
	case wmTray:
		switch lp {
		case wmLButtonUp, wmLDblClk:
			trayKorsat()
		case wmRButtonUp:
			trayMenyu(hwnd)
		}
		return 0
	case wmCommand:
		trayBuyruq(uint16(wp))
		return 0
	case wmDestroy:
		return 0
	}
	r, _, _ := pDefWindowProcW.Call(hwnd, xabar, wp, lp)
	return r
}

func trayKorsat() {
	if joriyTray == nil || joriyTray.asosiy == nil {
		return
	}
	h := joriyTray.asosiy()
	if h == 0 {
		return
	}
	if r, _, _ := pIsIconic.Call(h); r != 0 {
		pShowWindow.Call(h, swRestore)
	}
	pShowWindow.Call(h, swShow)
	pSetForegroundWnd.Call(h)
}

func trayMenyu(hwnd uintptr) {
	menyu, _, _ := pCreatePopupMenu.Call()
	if menyu == 0 {
		return
	}
	defer pDestroyMenu.Call(menyu)
	qosh := func(bayroq uintptr, id uintptr, matn string) {
		s, _ := windows.UTF16PtrFromString(matn)
		pAppendMenuW.Call(menyu, bayroq, id, uintptr(unsafe.Pointer(s)))
	}
	qosh(mfString, idKorsat, "Ish o'rnini ko'rsatish")
	qosh(mfString, idPapka, "Ma'lumot papkasi")
	qosh(mfSeparator, 0, "")
	qosh(mfString|mfGrayed, idVersiya, "Versiya "+joriyTray.versiya)
	qosh(mfSeparator, 0, "")
	qosh(mfString, idYopish, "Dasturni yopish")

	var nuqta struct{ X, Y int32 }
	pGetCursorPos.Call(uintptr(unsafe.Pointer(&nuqta)))
	pSetForegroundWnd.Call(hwnd) // menyu o'z-o'zidan yopilishi uchun
	r, _, _ := pTrackPopupMenu.Call(menyu, tpmRightButton|tpmReturnCmd,
		uintptr(nuqta.X), uintptr(nuqta.Y), 0, hwnd, 0)
	if r != 0 {
		trayBuyruq(uint16(r))
	}
}

func trayBuyruq(id uint16) {
	switch id {
	case idKorsat:
		trayKorsat()
	case idPapka:
		if joriyTray != nil {
			ochirExplorer(joriyTray.papka)
		}
	case idYopish:
		if joriyTray != nil && joriyTray.asosiy != nil {
			if h := joriyTray.asosiy(); h != 0 {
				pPostMessageW.Call(h, wmClose, 0, 0)
			}
		}
	}
}

func ochirExplorer(yol string) {
	amal, _ := windows.UTF16PtrFromString("open")
	p, _ := windows.UTF16PtrFromString(yol)
	pShellExecuteW.Call(0, uintptr(unsafe.Pointer(amal)), uintptr(unsafe.Pointer(p)), 0, 0, swShow)
}

/* ---------- yopishda tasdiq ---------- */

var (
	eskiProc  uintptr
	tasdiqNom string
)

// yopishTasdigi — kassada tasodifan yopib yuborilmasin (desktop odati).
func yopishTasdigi(hwnd uintptr, nom string) {
	tasdiqNom = nom
	yangi := windows.NewCallback(yopishProc)
	r, _, _ := pGetWindowLongPtrW.Call(hwnd, gwlpWndProc)
	eskiProc = r
	pSetWindowLongW.Call(hwnd, gwlpWndProc, yangi)
}

func yopishProc(hwnd, xabar, wp, lp uintptr) uintptr {
	if xabar == wmClose {
		if javob("Yopish", tasdiqNom) != idYes {
			return 0
		}
	}
	r, _, _ := pCallWindowProcW.Call(eskiProc, hwnd, xabar, wp, lp)
	return r
}

/* ---------- fayl saqlash (CSV eksport) ---------- */

type openFileNameW struct {
	LStructSize       uint32
	HwndOwner         uintptr
	HInstance         uintptr
	LpstrFilter       *uint16
	LpstrCustomFilter *uint16
	NMaxCustFilter    uint32
	NFilterIndex      uint32
	LpstrFile         *uint16
	NMaxFile          uint32
	LpstrFileTitle    *uint16
	NMaxFileTitle     uint32
	LpstrInitialDir   *uint16
	LpstrTitle        *uint16
	Flags             uint32
	NFileOffset       uint16
	NFileExtension    uint16
	LpstrDefExt       *uint16
	LCustData         uintptr
	LpfnHook          uintptr
	LpTemplateName    *uint16
	PvReserved        uintptr
	DwReserved        uint32
	FlagsEx           uint32
}

// SaqlashOynasi — Windows ning o'z "Saqlash" oynasi. Brauzerdagi
// yuklab olish paneli o'rniga (TALABLAR W-14).
func SaqlashOynasi(hwnd uintptr, taklif string) (string, error) {
	bufer := make([]uint16, 1024)
	copy(bufer, windows.StringToUTF16(taklif))

	filtr := windows.StringToUTF16("CSV jadval (*.csv)\x00*.csv\x00Barcha fayllar (*.*)\x00*.*\x00\x00")
	kengaytma, _ := windows.UTF16PtrFromString(filepath.Ext(taklif))
	if len(filepath.Ext(taklif)) > 1 {
		kengaytma, _ = windows.UTF16PtrFromString(filepath.Ext(taklif)[1:])
	}
	sarlavha, _ := windows.UTF16PtrFromString("Faylni saqlash")

	var o openFileNameW
	o.LStructSize = uint32(unsafe.Sizeof(o))
	o.HwndOwner = hwnd
	o.LpstrFilter = &filtr[0]
	o.NFilterIndex = 1
	o.LpstrFile = &bufer[0]
	o.NMaxFile = uint32(len(bufer))
	o.LpstrTitle = sarlavha
	o.LpstrDefExt = kengaytma
	o.Flags = ofnOverwritePrompt | ofnPathMustExist | ofnNoChangeDir

	r, _, _ := pGetSaveFileNameW.Call(uintptr(unsafe.Pointer(&o)))
	if r == 0 {
		return "", nil // foydalanuvchi bekor qildi
	}
	return windows.UTF16ToString(bufer), nil
}

func faylYoz(yol string, mazmun []byte) error {
	if err := os.WriteFile(yol, mazmun, 0o644); err != nil {
		return fmt.Errorf("fayl yozilmadi: %w", err)
	}
	return nil
}
