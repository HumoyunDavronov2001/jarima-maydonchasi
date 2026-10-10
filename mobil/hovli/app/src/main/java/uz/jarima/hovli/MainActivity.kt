package uz.jarima.hovli

/*
 * JM Hovli — hovli xodimi ilovasi (TALABLAR T-7, Q-1…Q-11).
 *
 * Ilova native Android ilovasi: brauzer ochilmaydi, manzil qatori yo'q.
 * Ekranlar ilova ichidagi fayllardan (assets) yuklanadi — shu sababli
 * sahifa "xavfsiz kontekst" hisoblanadi va QR skaner kamerani jonli
 * ocha oladi. Ma'lumot maydonchadagi terminaldan LAN orqali olinadi.
 */

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.view.WindowManager
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File

class MainActivity : ComponentActivity() {

    private lateinit var veb: WebView
    private var faylJavobi: ValueCallback<Array<Uri>>? = null
    private var kadrFayli: Uri? = null

    private val kameraSorovi = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    // Foto olish: <input type="file" capture> bosilganda kameraga o'tadi.
    private val kadrOlish = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { natija ->
        val javob = faylJavobi
        faylJavobi = null
        if (javob == null) return@registerForActivityResult
        if (natija.resultCode == Activity.RESULT_OK) {
            val u = natija.data?.data ?: kadrFayli
            javob.onReceiveValue(if (u != null) arrayOf(u) else null)
        } else {
            javob.onReceiveValue(null)
        }
    }

    override fun onCreate(saqlangan: Bundle?) {
        super.onCreate(saqlangan)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) // hovlida ekran o'chmasin

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            kameraSorovi.launch(Manifest.permission.CAMERA)
        }

        veb = WebView(this)
        setContentView(veb)
        sozla(veb)

        val yuklovchi = WebViewAssetLoader.Builder()
            .setDomain(DOMEN)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        veb.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, sorov: WebResourceRequest): WebResourceResponse? =
                yuklovchi.shouldInterceptRequest(sorov.url)

            // Tashqi havolalar ilova ichida ochilmaydi.
            override fun shouldOverrideUrlLoading(view: WebView, sorov: WebResourceRequest): Boolean {
                val u = sorov.url
                return !(u.host == DOMEN)
            }
        }

        veb.webChromeClient = object : WebChromeClient() {
            // Sahifa kameradan foydalanmoqchi (QR skaner).
            override fun onPermissionRequest(sorov: PermissionRequest) {
                runOnUiThread {
                    val kerak = sorov.resources.filter { it == PermissionRequest.RESOURCE_VIDEO_CAPTURE }
                    if (kerak.isNotEmpty() &&
                        ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                    ) {
                        sorov.grant(kerak.toTypedArray())
                    } else {
                        sorov.deny()
                        kameraSorovi.launch(Manifest.permission.CAMERA)
                    }
                }
            }

            override fun onShowFileChooser(
                view: WebView, javob: ValueCallback<Array<Uri>>, parametr: FileChooserParams
            ): Boolean {
                faylJavobi?.onReceiveValue(null)
                faylJavobi = javob
                return kameraniOch(parametr)
            }
        }

        veb.loadUrl("https://$DOMEN/assets/hovli.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // Ekran ichidagi "orqaga" ni sahifa o'zi hal qiladi.
                veb.evaluateJavascript("(function(){try{return window.JMH?'bor':'yo\\'q'}catch(e){return 'yo\\'q'}})()", null)
                if (veb.canGoBack()) veb.goBack() else chiqishTasdigi()
            }
        })
    }

    private fun sozla(v: WebView) {
        v.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // ulanish, seans va navbat shu yerda
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            // Sahifa ilova ichidan (https), terminal esa LAN da (http) —
            // shuning uchun aralash mazmunga ruxsat.
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            textZoom = 100                     // tizim shrifti kattaligi tugmalarni buzmasin
        }
        v.isVerticalScrollBarEnabled = false
        v.overScrollMode = View.OVER_SCROLL_NEVER
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) v.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_NO
        WebView.setWebContentsDebuggingEnabled(false)
    }

    private fun kameraniOch(parametr: WebChromeClient.FileChooserParams): Boolean {
        return try {
            val papka = File(cacheDir, "kadr").apply { mkdirs() }
            val fayl = File(papka, "kadr_${System.currentTimeMillis()}.jpg")
            kadrFayli = FileProvider.getUriForFile(this, "$packageName.fayl", fayl)

            val kamera = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                putExtra(MediaStore.EXTRA_OUTPUT, kadrFayli)
                addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            }
            val galereya = parametr.createIntent().apply { type = "image/*" }
            val tanlov = Intent(Intent.ACTION_CHOOSER).apply {
                putExtra(Intent.EXTRA_INTENT, galereya)
                putExtra(Intent.EXTRA_TITLE, "Foto")
                putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(kamera))
            }
            kadrOlish.launch(tanlov)
            true
        } catch (e: Exception) {
            faylJavobi?.onReceiveValue(null)
            faylJavobi = null
            Toast.makeText(this, "Kamera ochilmadi: ${e.message}", Toast.LENGTH_LONG).show()
            false
        }
    }

    private fun chiqishTasdigi() {
        android.app.AlertDialog.Builder(this)
            .setTitle("Chiqish")
            .setMessage("Ilovadan chiqasizmi? Yuborilmagan yozuvlar saqlanib qoladi.")
            .setPositiveButton("Ha") { _, _ -> finish() }
            .setNegativeButton("Yo'q", null)
            .show()
    }

    override fun onDestroy() {
        veb.destroy()
        super.onDestroy()
    }

    companion object {
        private const val DOMEN = "appassets.androidplatform.net"
    }
}
