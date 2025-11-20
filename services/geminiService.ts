import { GoogleGenAI } from "@google/genai";
import { Goal, Expense } from "../types";

// Initialize Gemini Client
// process.env.API_KEY is guaranteed to be available by the runtime environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  goals: Goal[],
  expenses: Expense[],
  userQuery: string
): Promise<string> => {
  const modelId = "gemini-2.5-flash";

  const goalsContext = goals.map(g => 
    `- Objetivo: ${g.title}, Meta: R$${g.amount}, Prazo: ${g.deadline}, Status: ${g.status}`
  ).join('\n');

  const expensesContext = expenses.map(e => 
    `- Gasto: ${e.title}, Valor: R$${e.amount}, Categoria: ${e.category}`
  ).join('\n');

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const prompt = `
    Você é um assistente financeiro pessoal inteligente chamado "Amigo do Bolso".
    
    Contexto do Usuário:
    
    GASTOS MENSAIS PREVISTOS (Total: R$${totalExpenses}):
    ${expensesContext || "Nenhum gasto cadastrado ainda."}
    
    OBJETIVOS FINANCEIROS:
    ${goalsContext || "Nenhum objetivo cadastrado ainda."}
    
    DÚVIDA DO USUÁRIO:
    "${userQuery}"
    
    Por favor, forneça uma resposta concisa, motivadora e prática. Use formatação Markdown para listas ou negrito.
    Foque em como o usuário pode atingir seus objetivos dado seus gastos atuais.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "Desculpe, não consegui gerar um conselho no momento.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Ocorreu um erro ao conectar com o assistente financeiro. Tente novamente mais tarde.";
  }
};