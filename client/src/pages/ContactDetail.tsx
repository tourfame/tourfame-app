import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Mail, User, MessageSquare } from "lucide-react";

export default function ContactDetail() {
  const [, params] = useRoute("/contact/:id");
  const [, setLocation] = useLocation();
  
  // 從 URL 參數獲取聯絡表單資訊
  // 實際應用中應該從後端 API 獲取
  const contactId = params?.id;
  
  // 這裡應該調用 API 獲取聯絡表單詳情
  // 暫時使用模擬數據
  const contact = {
    name: "張三",
    email: "zhang@example.com",
    subject: "關於旅行團的問題",
    message: "您好，我想詢問關於日本旅行團的相關資訊...",
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => setLocation("/notifications")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回通知
          </Button>

          {/* Contact Detail Card */}
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-6">提問詳情</h1>
            
            {/* Name */}
            <div className="mb-6">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <User className="h-4 w-4 mr-2" />
                姓名
              </div>
              <p className="text-lg">{contact.name}</p>
            </div>

            {/* Email */}
            <div className="mb-6">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Mail className="h-4 w-4 mr-2" />
                電郵地址
              </div>
              <p className="text-lg">{contact.email}</p>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                主旨
              </div>
              <p className="text-lg">{contact.subject}</p>
            </div>

            {/* Message */}
            <div className="mb-6">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                訊息內容
              </div>
              <div className="bg-muted p-4 rounded-md">
                <p className="whitespace-pre-wrap">{contact.message}</p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-sm text-muted-foreground">
              發送時間：{new Date(contact.createdAt).toLocaleString("zh-TW", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
