import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("註冊成功！");
      setLocation("/");
      window.location.reload(); // Reload to update auth state
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "註冊失敗");
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

  // 驗證表單
  const validateForm = useCallback((): boolean => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      toast.error("請輸入用戶名稱");
      return false;
    }

    if (!validateEmail(trimmedEmail)) {
      return false;
    }

    if (!password || password.length < 6) {
      toast.error("密碼至少需要6個字符");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("密碼不一致");
      return false;
    }

    return true;
  }, [name, email, password, confirmPassword, validateEmail]);

  const handleRegister = useCallback(() => {
    if (isSubmitting) return;
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    registerMutation.mutate({ 
      email: email.trim(), 
      password, 
      name: name.trim() 
    });
  }, [email, password, name, isSubmitting, validateForm, registerMutation]);

  // 處理按鍵事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRegister();
    }
  }, [handleRegister]);

  // 共用的輸入框樣式
  const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a4d2e] to-[#2d5a3d] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">註冊</CardTitle>
          <CardDescription className="text-center">
            創建您的帳號以開始使用
          </CardDescription>
        </CardHeader>
        <div>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-name">用戶名稱（必填）</Label>
              <input
                id="register-name"
                name="register-name"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={inputClassName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">電郵</Label>
              <input
                id="register-email"
                name="register-email"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={inputClassName}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">密碼</Label>
              <div className="relative">
                <input
                  id="register-password"
                  name="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={`${inputClassName} pr-10`}
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
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">確認密碼</Label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  name="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={`${inputClassName} pr-10`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-6">
            <Button
              type="button"
              className="w-full"
              disabled={isSubmitting || registerMutation.isPending}
              onClick={handleRegister}
            >
              {isSubmitting || registerMutation.isPending ? "註冊中..." : "註冊"}
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              點擊「註冊」即表示您同意我們的{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline" onClick={() => window.scrollTo(0, 0)}>
                隱私政策
              </Link>
              和
              <Link href="/terms" className="text-primary hover:underline" onClick={() => window.scrollTo(0, 0)}>
                服務條款
              </Link>
            </div>
            <div className="text-sm text-center text-muted-foreground">
              已有帳號？{" "}
              <Link href="/login" className="text-primary hover:underline" onClick={() => window.scrollTo(0, 0)}>
                立即登入
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
