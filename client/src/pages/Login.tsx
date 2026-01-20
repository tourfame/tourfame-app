import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 從 URL 參數中獲取返回路徑
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get("returnTo");
    if (returnTo) {
      setReturnPath(returnTo);
    }
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("登入成功！");
      // 如果有返回路徑，跳轉到該路徑；否則跳轉到首頁
      if (returnPath) {
        window.location.href = returnPath;
      } else {
        setLocation("/");
        window.location.reload(); // Reload to update auth state
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "登入失敗");
    },
  });

  // 驗證電郵格式
  const validateEmail = useCallback((emailValue: string): boolean => {
    if (!emailValue || emailValue.trim() === "") {
      toast.error("請輸入電郵地址");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      toast.error("請輸入有效的電郵地址");
      return false;
    }
    return true;
  }, []);

  // 驗證密碼
  const validatePassword = useCallback((passwordValue: string): boolean => {
    if (!passwordValue || passwordValue === "") {
      toast.error("請輸入密碼");
      return false;
    }
    return true;
  }, []);

  const handleLogin = useCallback(() => {
    if (isSubmitting) return;
    
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!validateEmail(trimmedEmail)) return;
    if (!validatePassword(trimmedPassword)) return;

    setIsSubmitting(true);
    loginMutation.mutate({ email: trimmedEmail, password: trimmedPassword });
  }, [email, password, isSubmitting, validateEmail, validatePassword, loginMutation]);

  // 處理按鍵事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  }, [handleLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a4d2e] to-[#2d5a3d] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">登入</CardTitle>
          <CardDescription className="text-center">
            輸入您的電郵和密碼以登入
          </CardDescription>
        </CardHeader>
        <div>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">電郵</Label>
              <input
                id="login-email"
                name="login-email"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">密碼</Label>
              <div className="relative">
                <input
                  id="login-password"
                  name="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline" onClick={() => window.scrollTo(0, 0)}>
                忘記密碼？
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-6">
            <Button
              type="button"
              className="w-full"
              disabled={isSubmitting || loginMutation.isPending}
              onClick={handleLogin}
            >
              {isSubmitting || loginMutation.isPending ? "登入中..." : "登入"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              還沒有帳號？{" "}
              <Link href="/register" className="text-primary hover:underline" onClick={() => window.scrollTo(0, 0)}>
                立即註冊
              </Link>
            </div>
            <div className="text-sm text-center">
              <Link href="/" className="text-muted-foreground hover:text-primary inline-flex items-center gap-1" onClick={() => window.scrollTo(0, 0)}>
                <ArrowLeft className="h-4 w-4" />
                返回首頁
              </Link>
            </div>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
