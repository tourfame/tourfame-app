import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="text-2xl font-bold text-primary" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              TourFame.com
            </div>
            <p className="text-muted-foreground text-sm">
              為您精選最優質的旅行團，比較價格、查看真實評價，找到最適合您的旅程。
            </p>

          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">支援</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq">
                  <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    常見問題
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    使用條款
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    私隱政策
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    關於我們
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    聯絡我們
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} TourFame.com. 版權所有.
            </p>
            <p className="text-muted-foreground text-sm">
              本網站提供旅行團資訊比較服務，實際預訂請前往各旅行社官網。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
