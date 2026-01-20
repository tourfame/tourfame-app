import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createContactNotificationMutation = trpc.notifications.createContactNotification.useMutation({
    onSuccess: () => {
      toast.success("訊息已發送！我們會盡快回覆您。");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(error.message || "發送失敗，請稍後再試");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    createContactNotificationMutation.mutate({
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactMethods = [
    {
      icon: MessageSquare,
      title: "線上客服",
      description: "即時對話支援",
      detail: "週一至週五 9:00 - 18:00"
    },
    {
      icon: HelpCircle,
      title: "常見問題",
      description: "查看 FAQ",
      detail: "快速找到常見問題的解答"
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
                聯絡我們
              </h1>
              <p className="text-lg text-muted-foreground">
                有任何問題或建議？我們隨時樂意為您提供協助
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {contactMethods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={index}
                      className="text-center p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {method.title}
                      </h3>
                      <p className="text-primary font-medium mb-2">
                        {method.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.detail}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Contact Form */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    發送訊息
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">姓名 *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="請輸入您的姓名"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">電郵地址 *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"

                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">主旨 *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="請簡述您的問題或建議"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">訊息內容 *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="請詳細描述您的問題或建議..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "發送中..." : "發送訊息"}
                    </Button>
                  </form>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    回覆時間
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    我們會在收到您的訊息後 24 小時內回覆。
                    如果是緊急問題，建議您直接聯絡相關旅行社。
                    感謝您的耐心等待！
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Link Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                在聯絡我們之前
              </h2>
              <p className="text-muted-foreground mb-6">
                您可能會在常見問題中找到答案，節省您的等待時間
              </p>
              <a
                href="/faq"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                onClick={() => window.scrollTo(0, 0)}
              >
                查看常見問題
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
