import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "如何在 TourFame.com 上搜尋旅行團?",
      answer: "您可以在首頁的搜尋欄輸入目的地或旅行社名稱,然後使用篩選條件(價格範圍、天數、排序方式)來縮小搜尋範圍。調整篩選條件後,搜尋結果會自動更新,無需額外操作。您也可以點擊「清除篩選」按鈕重設所有篩選條件。"
    },
    {
      question: "如何收藏喜歡的旅行團?",
      answer: "在旅行團卡片上點擊心形圖標即可收藏。您需要先登入帳號才能使用收藏功能。所有收藏的旅行團都會顯示在「我的收藏」頁面,方便您隨時查看和比較。"
    },
    {
      question: "如何發布旅行團評價?",
      answer: "進入旅行團詳情頁面後,點擊「好評留言」標籤,然後點擊「發布評價」按鈕。您需要先登入帳號才能發布評價。評價包括評分(1-5星)和文字評論。"
    },
    {
      question: "如何聯絡旅行社?",
      answer: "每個旅行團卡片上都有 WhatsApp 和電話圖標,點擊即可直接聯絡旅行社。部分旅行團還提供 PDF 行程單下載,您可以點擊 PDF 圖標查看詳細行程。"
    },
    {
      question: "TourFame.com 是否提供預訂服務?",
      answer: "TourFame.com 是一個比較平台,我們提供旅行團資訊和評價比較服務,但不直接提供預訂服務。實際預訂請通過旅行團卡片上的聯絡方式直接聯絡旅行社。"
    },
    {
      question: "價格資訊是否準確?",
      answer: "我們會定期更新旅行團價格資訊,但實際價格可能因促銷活動、季節變化等因素而有所不同。免責聲明:旅行社WhatsApp、電話、旅行團行程、收費等資訊以旅行社官網為準,詳情請往官網查詢。建議您在預訂前直接向旅行社確認最新價格。"
    },
    {
      question: "如何使用推薦功能?",
      answer: "我們的推薦系統會分析您收藏和瀏覽過的旅行團,了解您偏好的目的地、旅行社和團型,然後為您推薦相似但您尚未瀏覽過的旅行團。您的互動越多,推薦就越精準!"
    },
    {
      question: "如何重設密碼?",
      answer: "在登入頁面點擊「忘記密碼?」連結,輸入您的註冊電郵地址,我們會發送密碼重設連結到您的電郵。請檢查您的收件箱(包括垃圾郵件資料夾)。"
    },
    {
      question: "如何對評價進行回覆和提問?",
      answer: "在評價下方,您可以點擊「回覆」或「提問」按鈕與評價作者互動。評價作者可以回覆其他用戶的提問,非作者用戶可以向評價作者提問。所有回覆和提問會以對話形式顯示,評價作者的回覆會特別標記。當您的評價收到新回覆或提問時,系統會發送通知,您可以在「回覆通知」頁面查看。"
    },
    {
      question: "如何刪除我的帳號?",
      answer: "如果您希望刪除帳號,請通過「聯絡我們」頁面與我們聯繫。我們會在收到請求後的 7 個工作天內處理您的帳號刪除請求。"
    }
  ];

  // Helper function to add notranslate class to specific terms
  const addNotranslate = (text: string) => {
    return text
      .replace(/TourFame\.com/g, '<span class="notranslate">TourFame.com</span>')
      .replace(/WhatsApp/g, '<span class="notranslate">WhatsApp</span>')
      .replace(/PDF/g, '<span class="notranslate">PDF</span>');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                常見問題
              </h1>
              <p className="text-lg text-muted-foreground">
                查找關於 <span className="notranslate">TourFame.com</span> 的常見問題解答
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card border border-border rounded-lg px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span 
                        className="font-semibold text-foreground"
                        dangerouslySetInnerHTML={{ __html: addNotranslate(faq.question) }}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      <span dangerouslySetInnerHTML={{ __html: addNotranslate(faq.answer) }} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Contact Section */}
              <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  找不到您的問題?
                </h3>
                <p className="text-muted-foreground mb-4">
                  如果您有其他問題,歡迎隨時聯絡我們的客戶服務團隊
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  聯絡我們
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
