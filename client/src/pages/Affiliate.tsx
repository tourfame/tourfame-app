import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, TrendingUp, Users, DollarSign, BarChart } from "lucide-react";

export default function Affiliate() {
  const benefits = [
    {
      icon: DollarSign,
      title: "豐厚佣金",
      description: "每筆成功預訂可獲得高達 10% 的佣金回報"
    },
    {
      icon: Users,
      title: "龐大用戶群",
      description: "接觸數萬名活躍的香港旅客，擴大您的客戶基礎"
    },
    {
      icon: TrendingUp,
      title: "持續增長",
      description: "隨著平台發展，您的收入也會持續增長"
    },
    {
      icon: BarChart,
      title: "詳細報表",
      description: "即時追蹤您的推廣成效和佣金收入"
    }
  ];

  const features = [
    "免費加入，無需任何費用",
    "專屬推廣連結和追蹤系統",
    "多種推廣素材和工具支援",
    "每月準時發放佣金",
    "專業的合作夥伴支援團隊",
    "靈活的合作模式",
    "透明的佣金計算方式",
    "定期的推廣活動和獎勵"
  ];

  const steps = [
    {
      step: "1",
      title: "提交申請",
      description: "填寫合作夥伴申請表，提供您的基本資料和推廣計劃"
    },
    {
      step: "2",
      title: "審核通過",
      description: "我們會在 3-5 個工作天內審核您的申請"
    },
    {
      step: "3",
      title: "開始推廣",
      description: "獲得專屬推廣連結和素材，開始推廣賺取佣金"
    },
    {
      step: "4",
      title: "獲得收益",
      description: "每月結算佣金，直接匯入您的指定帳戶"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                合作夥伴計劃
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                加入 <span className="notranslate">TourFame.com</span> 合作夥伴計劃，與我們一起成長，賺取豐厚佣金
              </p>
              <Button size="lg" onClick={() => {
                const contactSection = document.getElementById('contact-section');
                contactSection?.scrollIntoView({ behavior: 'smooth' });
              }}>
                立即申請加入
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                合作優勢
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className="text-center p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                計劃特色
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                如何開始
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {steps.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Who Can Join Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-8">
                適合對象
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-card border border-border rounded-lg">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    旅遊部落客
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    分享旅遊心得的同時，為讀者提供優質旅行團推薦，賺取額外收入
                  </p>
                </div>
                <div className="p-6 bg-card border border-border rounded-lg">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    社交媒體創作者
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    利用您的影響力，向粉絲推薦優質旅行團，獲得佣金回報
                  </p>
                </div>
                <div className="p-6 bg-card border border-border rounded-lg">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    網站經營者
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    在您的網站上嵌入推廣連結，為訪客提供價值的同時賺取收益
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact-section" className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  準備好加入我們了嗎？
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  立即提交申請，開始您的合作夥伴之旅
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/contact">
                    <Button size="lg" onClick={() => window.scrollTo(0, 0)}>
                      提交申請
                    </Button>
                  </a>
                  <a href="/faq">
                    <Button size="lg" variant="outline" onClick={() => window.scrollTo(0, 0)}>
                      了解更多
                    </Button>
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  有任何問題？歡迎<a href="/contact" className="text-primary hover:underline" onClick={() => window.scrollTo(0, 0)}>聯絡我們</a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
