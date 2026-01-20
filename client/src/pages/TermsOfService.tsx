import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">服務條款</h1>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">歡迎使用 <span className="notranslate">TourFame.com</span></h2>
            <p className="text-muted-foreground leading-relaxed">
              感謝您使用 <span className="notranslate">TourFame.com</span>（「本網站」）。本服務條款（「條款」）規範您使用本網站及其相關服務的權利和義務。使用本網站即表示您同意遵守這些條款。如果您不同意這些條款，請勿使用本網站。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">服務說明</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <span className="notranslate">TourFame.com</span> 是一個旅行團資訊比較平台，提供以下服務：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>旅行團資訊搜尋和比較</li>
              <li>旅行社評價和口碑查詢</li>
              <li>價格比較和推薦服務</li>
              <li>用戶收藏和個人化推薦</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              本網站僅提供資訊比較服務，實際預訂請前往各旅行社官網。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">用戶帳號</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              註冊帳號時，您需要：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>提供真實、準確和完整的資料</li>
              <li>維護帳號安全，不與他人分享密碼</li>
              <li>對您帳號下的所有活動負責</li>
              <li>如發現未經授權使用，立即通知我們</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              我們保留隨時暫停或終止違反本條款的帳號的權利。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">使用規範</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              使用本網站時，您同意不會：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>違反任何適用的法律或法規</li>
              <li>侵犯他人的知識產權或其他權利</li>
              <li>發布虛假、誤導或惡意的內容</li>
              <li>干擾或破壞網站的正常運作</li>
              <li>使用自動化工具（如爬蟲）未經授權收集資料</li>
              <li>冒充他人或虛假陳述與任何人或實體的關係</li>
              <li>上傳病毒、惡意軟體或其他有害程式碼</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">內容和知識產權</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              本網站的所有內容，包括但不限於文字、圖片、標誌、設計和軟體，均受知識產權法保護。您同意：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>不複製、修改、分發或出售本網站的任何內容</li>
              <li>僅為個人非商業用途使用本網站</li>
              <li>尊重第三方內容的版權和商標</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              用戶提交的內容（如評價、評論）仍屬用戶所有，但您授予我們使用、展示和分發該內容的非獨家許可。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">免責聲明</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              本網站按「現狀」提供服務，不作任何明示或暗示的保證，包括但不限於：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>資訊的準確性、完整性或及時性</li>
              <li>服務的不間斷或無錯誤運作</li>
              <li>第三方旅行社的服務品質</li>
              <li>用戶評價和評論的真實性</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              本網站提供的資訊僅供參考，實際預訂前請向旅行社確認詳情。我們不對因使用本網站而產生的任何直接、間接、附帶或後果性損失負責。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">第三方連結</h2>
            <p className="text-muted-foreground leading-relaxed">
              本網站可能包含指向第三方網站的連結。這些連結僅為方便用戶而提供，我們不對第三方網站的內容、私隱政策或做法負責。訪問第三方網站的風險由您自行承擔。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">責任限制</h2>
            <p className="text-muted-foreground leading-relaxed">
              在法律允許的最大範圍內，<span className="notranslate">TourFame.com</span> 及其關聯公司、董事、員工和代理人不對任何間接、附帶、特殊、後果性或懲罰性損害負責，包括但不限於利潤損失、數據丟失或業務中斷，即使我們已被告知此類損害的可能性。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">賠償</h2>
            <p className="text-muted-foreground leading-relaxed">
              您同意賠償並使 <span className="notranslate">TourFame.com</span> 及其關聯方免受因您違反本條款、侵犯第三方權利或使用本網站而產生的任何索賠、損失、責任、費用（包括合理的律師費）的損害。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">條款修改</h2>
            <p className="text-muted-foreground leading-relaxed">
              我們保留隨時修改本服務條款的權利。重大變更將在本頁面公佈，並在適當情況下通知用戶。繼續使用本網站即表示您接受修改後的條款。我們建議您定期查閱本條款以了解最新資訊。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">終止服務</h2>
            <p className="text-muted-foreground leading-relaxed">
              我們保留隨時暫停或終止您的帳號或訪問權限的權利，無需事先通知，原因包括但不限於違反本條款、從事非法活動或損害網站利益。終止後，您使用本網站的權利將立即停止。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">適用法律</h2>
            <p className="text-muted-foreground leading-relaxed">
              本服務條款受香港特別行政區法律管轄並據其解釋。因本條款引起的任何爭議應提交香港法院專屬管轄。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">聯絡我們</h2>
            <p className="text-muted-foreground leading-relaxed">
              如果您對本服務條款有任何疑問或疑慮，請透過<a href="/contact" className="text-primary hover:underline">聯絡我們</a>頁面的「發送訊息」功能與我們聯繫。
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              最後更新日期：2025 年 1 月
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
