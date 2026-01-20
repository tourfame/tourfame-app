import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Menu, X, User, LogOut, MapPin, Languages } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("已登出");
      window.location.reload();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-2">
              <img src="/logo-transparent.png" alt="TourFame.com" className="h-10 w-10 object-contain" />
              <div className="text-2xl font-bold text-primary notranslate" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                TourFame.com
              </div>
            </a>
          </Link>

          {/* Desktop Navigation - Only show on large screens */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/">
              <a className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => window.scrollTo(0, 0)}>
                首頁
              </a>
            </Link>
            <Link href="/recommendations">
              <a className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => window.scrollTo(0, 0)}>
                為你推薦
              </a>
            </Link>
            <Link href="/favorites">
              <a className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => window.scrollTo(0, 0)}>
                我的收藏
              </a>
            </Link>
          </div>

          {/* Right Side Actions - Only show on large screens */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="切換語言">
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (select) {
                      select.value = 'zh-TW';
                      select.dispatchEvent(new Event('change'));
                    }
                  }}
                >
                  繁中
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (select) {
                      select.value = 'zh-CN';
                      select.dispatchEvent(new Event('change'));
                    }
                  }}
                >
                  簡中
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (select) {
                      select.value = 'en';
                      select.dispatchEvent(new Event('change'));
                    }
                  }}
                >
                  Eng
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>{user.name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem onClick={() => { setLocation("/admin"); window.scrollTo(0, 0); }}>
                        管理後台
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" onClick={() => window.scrollTo(0, 0)}>登入</Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" onClick={() => window.scrollTo(0, 0)}>註冊</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile & Tablet Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="選擇語言">
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  const iframe = document.querySelector('.goog-te-menu-frame') as HTMLIFrameElement;
                  if (!iframe) {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (select) { select.value = 'zh-TW'; select.dispatchEvent(new Event('change')); }
                  }
                }}>
                  繁體中文
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const iframe = document.querySelector('.goog-te-menu-frame') as HTMLIFrameElement;
                  if (!iframe) {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (select) { select.value = 'zh-CN'; select.dispatchEvent(new Event('change')); }
                  }
                }}>
                  简体中文
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const iframe = document.querySelector('.goog-te-menu-frame') as HTMLIFrameElement;
                  if (!iframe) {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (select) { select.value = 'en'; select.dispatchEvent(new Event('change')); }
                  }
                }}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile & Tablet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-3 border-t border-border">
            <Link href="/">
              <a
                className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                onClick={(e) => { 
                  setMobileMenuOpen(false); 
                  window.scrollTo(0, 0); 
                }}
              >
                首頁
              </a>
            </Link>
            {isAuthenticated && (
              <Link href="/notifications">
                <a
                  className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                  onClick={(e) => { 
                    setMobileMenuOpen(false); 
                    window.scrollTo(0, 0); 
                  }}
                >
                  回覆通知
                </a>
              </Link>
            )}
            <Link href="/recommendations">
              <a
                className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                onClick={(e) => { 
                  setMobileMenuOpen(false); 
                  window.scrollTo(0, 0); 
                }}
              >
                為你推薦
              </a>
            </Link>
            <Link href="/favorites">
              <a
                className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                onClick={(e) => { 
                  setMobileMenuOpen(false); 
                  window.scrollTo(0, 0); 
                }}
              >
                我的收藏
              </a>
            </Link>
            <Link href="/tours">
              <a
                className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
                onClick={(e) => { 
                  setMobileMenuOpen(false); 
                  window.scrollTo(0, 0); 
                }}
              >
                搜尋旅行團
              </a>
            </Link>
            {/* Language Selector for Mobile */}
            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-sm font-medium mb-2 px-2">選擇語言</p>
              <button
                className="block w-full text-left py-2 px-2 text-foreground hover:text-primary transition-colors"
                onClick={() => {
                  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                  if (select) { select.value = 'zh-TW'; select.dispatchEvent(new Event('change')); }
                }}
              >
                繁體中文
              </button>
              <button
                className="block w-full text-left py-2 px-2 text-foreground hover:text-primary transition-colors"
                onClick={() => {
                  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                  if (select) { select.value = 'zh-CN'; select.dispatchEvent(new Event('change')); }
                }}
              >
                简体中文
              </button>
              <button
                className="block w-full text-left py-2 px-2 text-foreground hover:text-primary transition-colors"
                onClick={() => {
                  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                  if (select) { select.value = 'en'; select.dispatchEvent(new Event('change')); }
                }}
              >
                English
              </button>
            </div>
            <div className="pt-6 mt-4 border-t border-border space-y-2">
              {isAuthenticated && user ? (
                <>
                  <div className="px-2 py-1.5" style={{ transform: 'scale(1.5)', transformOrigin: 'left top', marginBottom: '2rem' }}>
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => { setMobileMenuOpen(false); window.scrollTo(0, 0); }}
                      >
                        管理後台
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    登出
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { setMobileMenuOpen(false); window.scrollTo(0, 0); }}
                    >
                      登入
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      className="w-full"
                      onClick={() => { setMobileMenuOpen(false); window.scrollTo(0, 0); }}
                    >
                      註冊
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
