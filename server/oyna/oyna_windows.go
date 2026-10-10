//go:build windows

package oyna

import (
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
	"unsafe"

	"github.com/jchv/go-webview2"
	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

var (
	user32           = windows.NewLazySystemDLL("user32.dll")
	shell32          = windows.NewLazySystemDLL("shell32.dll")
	pShowWindow      = user32.NewProc("ShowWindow")
	pSetWindowLongW  = user32.NewProc("SetWindowLongPtrW")
	pSetWindowPos    = user32.NewProc("SetWindowPos")
	pGetSystemMetric = user32.NewProc("GetSystemMetrics")
	pMessageBoxW     = user32.NewProc("MessageBoxW")
	pAppUserModelID  = shell32.NewProc("SetCurrentProcessExplicitAppUserModelID")
)

const (
	swMaximize      = 3
	gwlStyle        = ^uintptr(15) // -16
	wsPopup         = 0x80000000
	wsVisible       = 0x10000000
	smCXScreen      = 0
	smCYScreen      = 1
	swpFrameChanged = 0x0020
	swpShowWindow   = 0x0040
	mbIconError     = 0x00000010
	mbIconQuestion  = 0x00000020
	mbYesNo         = 0x00000004
	idYes           = 6
)

// och — dastur o'z Windows oynasida ishlaydi. Brauzer ISHLATILMAYDI:
// WebView2 topilmasa dastur brauzerga o'tmaydi, balki komponentni
// o'rnatishni taklif qiladi (TALABLAR W-2).
func och(s Sozlama) error {
	appID, _ := windows.UTF16PtrFromString("uz.jarima.terminal")
	pAppUserModelID.Call(uintptr(unsafe.Pointer(appID))) // vazifalar panelida o'z o'rni

	// Ikkinchi marta ochilsa yangi oyna emas — ochig'i oldinga chiqadi.
	if !YagonaNusxa(yoki(s.Kalit, "ish"), s.Sarlavha) {
		return nil
	}

	if err := webview2Tayyorla(); err != nil {
		return err
	}

	if s.Eni == 0 {
		s.Eni = 1440
	}
	if s.Boyi == 0 {
		s.Boyi = 900
	}
	// Oyna ochilishi jurnalga yoziladi: nosoz muhitda qayerda to'xtagani
	// ko'rinsin (TALABLAR Ar-4, W-7).
	log.Println("oyna ochilmoqda:", s.Manzil)
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		AutoFocus: true,
		DataPath:  s.Kesh,
		WindowOptions: webview2.WindowOptions{
			Title: s.Sarlavha, Width: s.Eni, Height: s.Boyi, Center: true, IconId: 2,
		},
	})
	if w == nil {
		xabar("Oyna ochilmadi", "WebView2 komponenti ishga tushmadi.\n\nKompyuterni qayta yuklab ko'ring yoki WebView2 Runtime ni qayta o'rnating.", mbIconError)
		return fmt.Errorf("WebView2 oynasi yaratilmadi")
	}
	defer w.Destroy()

	hwnd := uintptr(w.Window())

	// CSV eksport: brauzerdagi yuklab olish paneli emas, Windows ning
	// o'z "Saqlash" oynasi (TALABLAR W-14).
	if err := w.Bind("jmFaylSaqla", func(nom, b64 string) string {
		mazmun, err := base64.StdEncoding.DecodeString(b64)
		if err != nil {
			xabar("Saqlanmadi", "Fayl mazmuni o'qilmadi:\n"+err.Error(), mbIconError)
			return ""
		}
		yol, err := SaqlashOynasi(hwnd, nom)
		if err != nil || yol == "" {
			return ""
		}
		if err := faylYoz(yol, mazmun); err != nil {
			xabar("Saqlanmadi", err.Error(), mbIconError)
			return ""
		}
		return yol
	}); err != nil {
		log.Println("fayl saqlash bog'lanmadi:", err)
	}

	// Brauzerga o'xshab qolmasin: sahifa yangilash, qidiruv, orqaga qaytish
	// tugmalari o'chiriladi. Chop etish (Ctrl+P) qoladi — chek va
	// dalolatnoma shu orqali chiqadi (TALABLAR W-11).
	w.Init(desktopJS)
	w.Navigate(s.Manzil)

	log.Println("oyna ochildi")
	if s.TolaEkran {
		// Darvoza ekrani: kiosk, tasdiqsiz va traysiz.
		tolaEkran(hwnd)
	} else {
		pShowWindow.Call(hwnd, swMaximize)
		yopishTasdigi(hwnd, "Ish o'rni oynasi yopilsinmi?\n\nXizmat o'rnatilgan bo'lsa kamera va darvoza ishlashda davom etadi.")
		if err := trayOch(&tray{
			asosiy: func() uintptr { return hwnd }, papka: s.Papka,
			sarlavha: s.Sarlavha, versiya: s.Versiya,
		}); err != nil {
			log.Println("tray:", err)
		}
		defer trayYop()
	}
	w.Run()
	return nil
}

func bormi() bool { return true }

func yoki(a, b string) string {
	if a != "" {
		return a
	}
	return b
}

// webview2Tayyorla — komponent bormi. Yo'q bo'lsa: yonidagi o'rnatuvchini
// ishga tushirishni taklif qiladi. Brauzerga o'tilmaydi.
func webview2Tayyorla() error {
	if webview2Bormi() {
		return nil
	}
	ornatuvchi := ornatuvchiniTop()
	if ornatuvchi == "" {
		xabar("WebView2 komponenti yo'q",
			"Dastur oynasi uchun Microsoft WebView2 Runtime kerak.\n\n"+
				"Uni o'rnating (bir marta):\nhttps://go.microsoft.com/fwlink/p/?LinkId=2124703\n\n"+
				"Yoki MicrosoftEdgeWebview2Setup.exe faylini dastur papkasiga qo'ying va qayta urinib ko'ring.",
			mbIconError)
		return fmt.Errorf("WebView2 Runtime o'rnatilmagan")
	}
	if javob("WebView2 komponenti yo'q",
		"Dastur oynasi uchun Microsoft WebView2 Runtime kerak.\n\nHozir o'rnatilsinmi?\n("+ornatuvchi+")") != idYes {
		return fmt.Errorf("WebView2 Runtime o'rnatilmadi")
	}
	c := exec.Command(ornatuvchi, "/silent", "/install")
	if err := c.Run(); err != nil {
		xabar("O'rnatilmadi", "WebView2 o'rnatuvchisi xato qaytardi:\n"+err.Error(), mbIconError)
		return fmt.Errorf("WebView2 o'rnatilmadi: %w", err)
	}
	for i := 0; i < 30; i++ { // ro'yxatga olinishini kutamiz
		if webview2Bormi() {
			return nil
		}
		time.Sleep(time.Second)
	}
	return fmt.Errorf("WebView2 o'rnatildi, lekin topilmadi — kompyuterni qayta yuklang")
}

// webview2Bormi — Microsoft hujjatida ko'rsatilgan usul: reyestrdagi
// `pv` qiymati. Loader DLL yuklanmaydi — sekin yoki nosoz muhitda dastur
// qotib qolmasin.
func webview2Bormi() bool {
	const guid = `Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}`
	joylar := []struct {
		ildiz registry.Key
		yol   string
	}{
		{registry.LOCAL_MACHINE, `SOFTWARE\WOW6432Node\` + guid},
		{registry.LOCAL_MACHINE, `SOFTWARE\` + guid},
		{registry.CURRENT_USER, `SOFTWARE\` + guid},
	}
	for _, j := range joylar {
		k, err := registry.OpenKey(j.ildiz, j.yol, registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		v, _, err := k.GetStringValue("pv")
		k.Close()
		if err == nil && strings.TrimSpace(v) != "" && v != "0.0.0.0" {
			return true
		}
	}
	return false
}

func ornatuvchiniTop() string {
	const nom = "MicrosoftEdgeWebview2Setup.exe"
	var papkalar []string
	if exe, err := os.Executable(); err == nil {
		papkalar = append(papkalar, filepath.Dir(exe))
	}
	if wd, err := os.Getwd(); err == nil {
		papkalar = append(papkalar, wd)
	}
	for _, p := range papkalar {
		yol := filepath.Join(p, nom)
		if _, err := os.Stat(yol); err == nil {
			return yol
		}
	}
	return ""
}

// tolaEkran — darvoza ekrani: ramkasiz, butun monitor (kiosk).
func tolaEkran(hwnd uintptr) {
	pSetWindowLongW.Call(hwnd, gwlStyle, uintptr(wsPopup|wsVisible))
	cx, _, _ := pGetSystemMetric.Call(smCXScreen)
	cy, _, _ := pGetSystemMetric.Call(smCYScreen)
	pSetWindowPos.Call(hwnd, 0, 0, 0, cx, cy, swpFrameChanged|swpShowWindow)
}

func xabar(sarlavha, matn string, bayroq uintptr) {
	s, _ := windows.UTF16PtrFromString(sarlavha)
	m, _ := windows.UTF16PtrFromString(matn)
	pMessageBoxW.Call(0, uintptr(unsafe.Pointer(m)), uintptr(unsafe.Pointer(s)), bayroq)
}

func javob(sarlavha, matn string) int {
	s, _ := windows.UTF16PtrFromString(sarlavha)
	m, _ := windows.UTF16PtrFromString(matn)
	r, _, _ := pMessageBoxW.Call(0, uintptr(unsafe.Pointer(m)), uintptr(unsafe.Pointer(s)), mbYesNo|mbIconQuestion)
	return int(r)
}

// desktopJS — har sahifa yuklanganda ishga tushadi. Dastur brauzer emas:
// F5, Ctrl+R, Ctrl+F, Ctrl+W, Alt+←, Backspace bilan orqaga qaytish
// o'chiriladi; fayl tashlab yuborish sahifani almashtirmaydi.
const desktopJS = `
window.JM_DESKTOP = true;
document.addEventListener('keydown', function (e) {
  var k = (e.key || '').toLowerCase();
  var t = (e.target && e.target.tagName || '').toLowerCase();
  var yozuvda = t === 'input' || t === 'textarea' || (e.target && e.target.isContentEditable);
  if (k === 'f5' || k === 'f3' || k === 'f7') { e.preventDefault(); return; }
  if ((e.ctrlKey || e.metaKey) && ['r','f','w','l','n','t','j','u','h','o','s','g'].indexOf(k) >= 0) { e.preventDefault(); return; }
  if (e.altKey && (k === 'arrowleft' || k === 'arrowright')) { e.preventDefault(); return; }
  if (k === 'backspace' && !yozuvda) { e.preventDefault(); return; }
}, true);
window.addEventListener('dragover', function (e) { e.preventDefault(); }, false);
window.addEventListener('drop', function (e) { e.preventDefault(); }, false);
window.addEventListener('beforeunload', function () {});
(function () {
  // Eksport: blob yuklab olish o'rniga Windows "Saqlash" oynasi.
  var asl = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var nom = this.getAttribute('download');
    var h = this.href || '';
    if (nom && (h.indexOf('blob:') === 0 || h.indexOf('data:') === 0) && window.jmFaylSaqla) {
      fetch(h).then(function (r) { return r.blob(); }).then(function (b) {
        var fr = new FileReader();
        fr.onload = function () { window.jmFaylSaqla(nom, String(fr.result).split(',')[1] || ''); };
        fr.readAsDataURL(b);
      });
      return;
    }
    return asl.apply(this, arguments);
  };
})();
`
