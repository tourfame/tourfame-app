import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setIsSubmitting(false);
      toast.success("重設密碼連結已發送到您的電郵");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "發送失敗，請稍後再試");
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

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) return;

    setIsSubmitting(true);
    forgotPasswordMutation.mutate({ email: trimmedEmail });
  }, [email, isSubmitting, validateEmail, forgotPasswordMutation]);

  // 處理按鍵事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleResend = useCallback(() => {
    setIsSubmitted(false);
    setEmail("");
  }, []);

  // 共用的輸入框樣式
  const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a4d2e] to-[#2d5a3d] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">忘記密碼</CardTitle>
          <CardDescription className="text-center">
            輸入您的電郵地址，我們將發送重設密碼連結
          </CardDescription>
        </CardHeader>
        
        {!isSubmitted ? (
          <div>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">電郵地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="forgot-email"
                    name="forgot-email"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className={`${inputClassName} pl-10`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder=""
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 mt-6">
              <Button
                type="button"
                className="w-full"
                disabled={isSubmitting || forgotPasswordMutation.isPending}
                onClick={handleSubmit}
              >
                {isSubmitting || forgotPasswordMutation.isPending ? "發送中..." : "發送重設連結"}
              </Button>
              <div className="text-sm text-center">
                <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-1" onClick={() => window.scrollTo(0, 0)}>
                  <ArrowLeft className="h-4 w-4" />
                  返回登入
                </Link>
              </div>
            </CardFooter>
          </div>
        ) : (
          <>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">檢查您的電郵</h3>
                <p className="text-sm text-muted-foreground">
                  我們已將重設密碼連結發送到 <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  沒有收到郵件？請檢查垃圾郵件資料夾
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResend}
              >
                重新發送
              </Button>
              <div className="text-sm text-center">
                <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-1" onClick={() => window.scrollTo(0, 0)}>
                  <ArrowLeft className="h-4 w-4" />
                  返回登入
                </Link>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
