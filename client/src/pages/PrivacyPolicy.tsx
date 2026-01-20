import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">私隱政策及 <span className="notranslate">Cookie</span> 使用</h1>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">關於本政策</h2>
            <p className="text-muted-foreground leading-relaxed">
              <span className="notranslate">TourFame.com</span>（「本網站」）重視您的私隱。本政策說明我們如何收集、使用和保護您的個人資料，以及我們如何使用 Cookie 和類似技術。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">我們收集的資料</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              當您使用本網站時，我們可能收集以下資料：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>您提供的個人資料（如姓名、電郵地址）</li>
              <li>瀏覽資料（如訪問頁面、點擊連結、停留時間）</li>
              <li>裝置資料（如瀏覽器類型、作業系統、<span className="notranslate">IP</span> 地址）</li>
              <li><span className="notranslate">Cookie</span> 和類似技術收集的資料</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4"><span className="notranslate">Cookie</span> 的使用</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              <span className="notranslate">Cookie</span> 是儲存在您裝置上的小型文字檔案，用於改善您的瀏覽體驗。我們使用以下類型的 <span className="notranslate">Cookie</span>：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>必要 <span className="notranslate">Cookie</span></strong>：確保網站正常運作（如登入狀態、側邊欄偏好）
              </li>
              <li>
                <strong>分析 <span className="notranslate">Cookie</span></strong>：幫助我們了解訪客如何使用網站（使用 <span className="notranslate">Umami</span> 分析工具）
              </li>
              <li>
                <strong>功能 <span className="notranslate">Cookie</span></strong>：記住您的偏好設定，提供個人化體驗
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">我們使用的分析工具</h2>
            <p className="text-muted-foreground leading-relaxed">
              本網站使用 <strong><span className="notranslate">Umami</span></strong>，一個注重私隱的開源網站分析工具。<span className="notranslate">Umami</span> 不會收集個人識別資料，不使用追蹤 <span className="notranslate">Cookie</span>，並且所有數據都經過匿名化處理。我們使用 <span className="notranslate">Umami</span> 來了解網站流量、熱門頁面和用戶行為模式，以改善我們的服務。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">資料的使用</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              我們收集的資料用於以下目的：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>提供和改善我們的服務</li>
              <li>個人化您的使用體驗</li>
              <li>分析網站使用情況和趨勢</li>
              <li>回應您的查詢和請求</li>
              <li>遵守法律義務</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">您的權利</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              您對您的個人資料擁有以下權利：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>查閱您的個人資料</li>
              <li>更正不準確的資料</li>
              <li>要求刪除您的資料</li>
              <li>反對或限制資料處理</li>
              <li>撤回同意（不影響撤回前的處理）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">管理 <span className="notranslate">Cookie</span></h2>
            <p className="text-muted-foreground leading-relaxed">
              您可以透過瀏覽器設定管理或刪除 <span className="notranslate">Cookie</span>。請注意，禁用某些 <span className="notranslate">Cookie</span> 可能會影響網站的功能和您的使用體驗。大多數瀏覽器允許您：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
              <li>查看和刪除現有的 <span className="notranslate">Cookie</span></li>
              <li>阻止第三方 <span className="notranslate">Cookie</span></li>
              <li>在接受 <span className="notranslate">Cookie</span> 前收到通知</li>
              <li>完全禁用 <span className="notranslate">Cookie</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">資料保安</h2>
            <p className="text-muted-foreground leading-relaxed">
              我們採取合理的技術和組織措施來保護您的個人資料，防止未經授權的訪問、披露、更改或銷毀。然而，沒有任何網際網路傳輸或電子儲存方法是 100% 安全的。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">政策更新</h2>
            <p className="text-muted-foreground leading-relaxed">
              我們可能會不時更新本私隱政策。任何重大變更將在本頁面公佈，並在適當情況下通知您。我們建議您定期查閱本政策以了解最新資訊。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">聯絡我們</h2>
            <p className="text-muted-foreground leading-relaxed">
              如果您對本私隱政策或我們的資料處理方式有任何疑問或疑慮，請透過<a href="/contact" className="text-primary hover:underline">聯絡我們</a>頁面的「發送訊息」功能與我們聯繫。
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
