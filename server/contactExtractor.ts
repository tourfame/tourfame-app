import { invokeLLM } from "./_core/llm";

/**
 * 從文本中提取聯絡方式（WhatsApp 和電話號碼）
 */
export async function extractContactInfo(textContent: string): Promise<{
  whatsapp: string | null;
  phone: string | null;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一個專業的聯絡方式提取助手。從提供的文本中提取 WhatsApp 號碼和電話號碼。

規則：
1. 香港電話號碼通常是 8 位數字（例如：2123 4567、9123 4567）
2. WhatsApp 號碼通常包含國際區號（例如：+852 9123 4567、852-91234567、98695611）
3. 如果找到多個號碼，優先選擇標註為「WhatsApp」或「查詢」的號碼
4. 移除所有空格、連字符等格式字符，只保留數字和開頭的 + 號
5. 如果找不到對應的號碼，返回 null

返回 JSON 格式：
{
  "whatsapp": "號碼或null",
  "phone": "號碼或null"
}`,
        },
        {
          role: "user",
          content: `請從以下內容中提取 WhatsApp 號碼和電話號碼：\n\n${textContent}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "contact_info",
          strict: true,
          schema: {
            type: "object",
            properties: {
              whatsapp: {
                type: ["string", "null"],
                description: "WhatsApp 號碼（只包含數字和可選的 + 號）",
              },
              phone: {
                type: ["string", "null"],
                description: "電話號碼（只包含數字）",
              },
            },
            required: ["whatsapp", "phone"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : "{}");
    
    return {
      whatsapp: result.whatsapp || null,
      phone: result.phone || null,
    };
  } catch (error) {
    console.error("[Contact Extractor] Error:", error);
    return {
      whatsapp: null,
      phone: null,
    };
  }
}

/**
 * 從 HTML 內容中提取聯絡方式
 */
export async function extractContactFromHTML(html: string): Promise<{
  whatsapp: string | null;
  phone: string | null;
}> {
  // 移除 HTML 標籤，保留文本內容
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return extractContactInfo(text);
}
