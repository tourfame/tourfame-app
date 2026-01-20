import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Target, Users, Award, TrendingUp } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Target,
      title: "透明比較",
      description: "提供清晰、透明的旅行團價格和評價比較，讓您做出明智的選擇"
    },
    {
      icon: Users,
      title: "用戶至上",
      description: "以用戶需求為中心，持續優化平台功能和用戶體驗"
    },
    {
      icon: Award,
      title: "品質保證",
      description: "嚴選優質旅行社和旅行團，確保資訊準確可靠"
    },
    {
      icon: TrendingUp,
      title: "持續創新",
      description: "運用最新技術，為用戶提供更智能的旅行團推薦服務"
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
                關於我們
              </h1>
              <p className="text-lg text-muted-foreground">
                為您精選最優質的旅行團，比較價格、查看真實評價
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  我們的使命
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <span className="notranslate">TourFame.com</span> 致力於為香港旅客提供最全面、最透明的旅行團比較平台。
                  我們相信，每個人都應該能夠輕鬆找到最適合自己的旅行團，
                  享受美好的旅行體驗。通過整合多家旅行社的旅行團資訊，
                  提供真實的用戶評價和智能推薦，我們幫助您做出最明智的旅行決策。
                </p>
              </div>


            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                我們的核心價值
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {values.filter(v => v.title !== "品質保證").map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <div
                      key={index}
                      className="flex gap-4 p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {value.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>



        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                準備好開始您的旅程了嗎？
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                立即搜尋並比較數百個旅行團，找到最適合您的完美行程
              </p>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-8 py-3 text-base font-medium hover:bg-primary/90 transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                開始搜尋旅行團
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
