
import { GoogleGenAI } from "@google/genai";

// Use direct initialization as per @google/genai guidelines
export async function generateReportDraft(type: string, keywords: string): Promise<string> {
  // Always use a new instance with a named parameter for the API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `你是一名资深的工程监理专家。请根据以下关键词编写一份专业的${type}内容。
      要求：条理清晰，符合建筑行业规范，语言客观专业。
      关键词：${keywords}`,
    });
    // The GenerateContentResponse object features a text property that directly returns the string output.
    return response.text || "生成内容为空";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "生成失败，请检查网络或配置。";
  }
}

export async function summarizeSafetyHazards(events: any[]): Promise<string> {
  // Always use a new instance with a named parameter for the API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const context = JSON.stringify(events);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `作为公司安全总监，请分析以下项目部直报的重大事件风险，并给出管理决策建议：${context}`,
    });
    // The GenerateContentResponse object features a text property that directly returns the string output.
    return response.text || "暂无研判结论";
  } catch (error) {
    console.error("AI Summarization Error:", error);
    return "无法生成汇总分析。";
  }
}
