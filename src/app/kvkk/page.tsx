import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni — Netport İhracat Asistanı',
}

export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Logo / Geri */}
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-mono"
          >
            ← Uygulamaya Dön
          </Link>
          <span className="text-xs text-slate-400 font-mono">Netport Global A.Ş.</span>
        </div>

        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 prose prose-slate max-w-none">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni
          </h1>
          <p className="text-sm text-slate-500 mb-8">Son güncelleme: Haziran 2026</p>

          <h2>1. Veri Sorumlusu</h2>
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) kapsamında
            kişisel verileriniz; veri sorumlusu sıfatıyla <strong>Netport Global A.Ş.</strong>
            (Gülbahçe Mah. Gülbahçe Cad. İYTE Sit. TEKNOPARK İZMİR A1 Binası Apt. No:1/17/48
            URLA İZMİR) tarafından aşağıda açıklanan amaç ve yöntemlerle işlenmektedir.
          </p>

          <h2>2. İşlenen Kişisel Veriler</h2>
          <ul>
            <li><strong>Kimlik ve iletişim bilgileri:</strong> Ad-soyad, e-posta adresi</li>
            <li><strong>Kullanım verileri:</strong> Oluşturulan rapor içerikleri, rapor tarihleri, oturum bilgileri</li>
            <li><strong>Ödeme bilgileri:</strong> Ödeme işlem referans numaraları (kart bilgileri tarafımızca saklanmaz; Iyzico altyapısı üzerinden işlenir)</li>
          </ul>

          <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
          <ul>
            <li>Üyelik ve hesap yönetimi hizmetlerinin sunulması</li>
            <li>İhracat pazar analizi raporlarının oluşturulması ve iletilmesi</li>
            <li>Ödeme işlemlerinin gerçekleştirilmesi ve kayıt altına alınması</li>
            <li>Hizmet kalitesinin ölçülmesi ve iyileştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Destek taleplerine yanıt verilmesi</li>
          </ul>

          <h2>4. Kişisel Verilerin İşlenme Hukuki Dayanağı</h2>
          <p>
            Kişisel verileriniz; KVKK&apos;nın 5. maddesi kapsamında &ldquo;sözleşmenin kurulması
            veya ifası için zorunlu olması&rdquo;, &ldquo;veri sorumlusunun meşru menfaatlerinin
            korunması&rdquo; ve gerektiğinde &ldquo;açık rıza&rdquo; hukuki sebeplerine
            dayanılarak işlenmektedir.
          </p>

          <h2>5. Kişisel Verilerin Aktarımı</h2>
          <p>
            Kişisel verileriniz; hizmet sunumu kapsamında yalnızca aşağıdaki taraflarla
            paylaşılmaktadır:
          </p>
          <ul>
            <li><strong>Supabase Inc.</strong> — veri tabanı ve kimlik doğrulama altyapısı (ABD, gizlilik kalkanı uyumlu)</li>
            <li><strong>Iyzico Ödeme Hizmetleri A.Ş.</strong> — ödeme işlemleri</li>
            <li><strong>Vercel Inc.</strong> — uygulama barındırma altyapısı</li>
          </ul>
          <p>
            Yetkili kamu kurum ve kuruluşlarının talepleri doğrultusunda yasal zorunluluk
            halinde kişisel verileriniz ilgili mercilerle paylaşılabilir.
          </p>

          <h2>6. Kişisel Verilerin Saklanma Süresi</h2>
          <p>
            Kişisel verileriniz, hesabınızın aktif olduğu süre boyunca ve akabinde yasal
            zorunluluklar gereği azami <strong>5 yıl</strong> saklanmaktadır. Hesap silme
            talebinde bulunmanız halinde verileriniz en geç 30 gün içinde kalıcı olarak
            silinir.
          </p>

          <h2>7. KVKK Kapsamındaki Haklarınız</h2>
          <p>KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>Yanlış veya eksik işlenmiş verilerin düzeltilmesini isteme</li>
            <li>Kişisel verilerin silinmesini veya yok edilmesini talep etme</li>
            <li>Otomatik sistemler aracılığıyla aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Verilerinizin kanuna aykırı işlenmesi nedeniyle zarara uğramanız halinde tazminat talep etme</li>
          </ul>

          <h2>8. İletişim</h2>
          <p>
            KVKK kapsamındaki taleplerinizi aşağıdaki kanallar aracılığıyla iletebilirsiniz:
          </p>
          <ul>
            <li>
              <strong>E-posta:</strong>{' '}
              <a href="mailto:info@netport.com.tr">info@netport.com.tr</a>
            </li>
            <li>
              <strong>Adres:</strong> Gülbahçe Mah. Gülbahçe Cad. İYTE Sit. TEKNOPARK İZMİR A1
              Binası Apt. No:1/17/48 URLA İZMİR
            </li>
            <li>
              <strong>Telefon:</strong>{' '}
              <a href="tel:+902324837934">+90.232.483 79 34</a>
            </li>
          </ul>
          <p>
            Talepleriniz kimliğiniz doğrulandıktan sonra en geç <strong>30 gün</strong> içinde
            yanıtlanacaktır.
          </p>
        </article>

        <p className="text-center text-xs text-slate-400 mt-8">
          2026 &copy; Netport Global A.Ş.
        </p>
      </div>
    </div>
  )
}
