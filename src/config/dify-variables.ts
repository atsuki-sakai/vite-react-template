/**
 * Dify Conversation Variables Configuration
 * 
 * This file defines the conversation variables that will be dynamically
 * generated and sent to Dify API based on the current context.
 */

export interface ConversationVariableContext {
  conversationId?: string;
  userId?: string;
  isFirst?: string;
  customerName?: string;
  phone?: string;
  reservationDateAndTime?: string;
  menuName?: string;
  llmContext?: string[];
  userContext?: string[];
  timestamp?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VariableGenerator<T = any> = (context: ConversationVariableContext) => T;

/**
 * Dify conversation variables configuration
 * Each variable is defined with a generator function that receives context
 * and returns the appropriate value for that variable.
 */
export const DIFY_CONVERSATION_VARIABLES = {
    // 初回会話判定 - "true": 初回, "false": 継続
    isFirst: (context: ConversationVariableContext): string => {
      return (!context.conversationId || context.conversationId.trim() === "") ? "true" : "false";
    },
    
    // 顧客名
    customer_name: (context: ConversationVariableContext): string => {
      return context.customerName || "";
    },
    
    // 電話番号（090-1234-5678のような形式）
    phone: (context: ConversationVariableContext): string => {
      return context.phone || "";
    },
    
    // 予約日時（2025-07-21-14:30のような形式）
    reservation_date_and_time: (context: ConversationVariableContext): string => {
      return context.reservationDateAndTime || "";
    },
    
    // 希望するメニュー名（カンマ区切りで複数指定）
    menu_name: (context: ConversationVariableContext): string => {
      return context.menuName || "";
    },
    
    // LLMが顧客に返答した内容の要約を保存する配列
    llm_context: (context: ConversationVariableContext): string[] => {
      return context.llmContext || [];
    },
    
    // 顧客の発言を記録して、LLMに連続した会話を実現させる配列
    user_context: (context: ConversationVariableContext): string[] => {
      return context.userContext || [];
    },
}

/**
 * 動的にDify API用のinputsオブジェクトを生成する関数
 * 
 * @param context - 会話変数生成に必要なコンテキスト情報
 * @param enabledVariables - 有効にする変数のパス（例: ["is_first", "customer_name"]）
 * @returns Dify APIのinputsパラメータに渡すオブジェクト
 */
export function generateDifyInputs(
  context: ConversationVariableContext,
  enabledVariables?: string[]
): Record<string, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const inputs: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

  // 設定から全ての変数を生成
  Object.entries(DIFY_CONVERSATION_VARIABLES).forEach(([category, variables]) => {
    Object.entries(variables).forEach(([key, generator]) => {
      const variablePath = `${category}.${key}`;
      
      // enabledVariables が指定されている場合は、そのリストにある変数のみ生成
      if (enabledVariables && !enabledVariables.includes(variablePath)) {
        return;
      }
      
      // カテゴリオブジェクトが存在しない場合は作成
      if (!inputs[category]) {
        inputs[category] = {};
      }
      
      // 変数値を生成して設定
      try {
        inputs[category][key] = generator(context);
      } catch (error) {
        console.warn(`[DifyVariables] Failed to generate variable ${variablePath}:`, error);
        // エラーが発生した場合はその変数をスキップ
      }
    });
  });

  return inputs;
}

/**
 * 初回会話時のみに必要な変数を生成する便利関数
 * 
 * @param context - コンテキスト情報
 * @returns 初回会話用のinputsオブジェクト
 * 
 */
export function generateInitialConversationInputs(
  context: ConversationVariableContext
): Record<string, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return generateDifyInputs(context, [
    'isFirst',
    'customer_name',
    'phone',
    'reservation_date_and_time',
    'menu_name',
    'llm_context',
    'user_context'
  ]);
}

/**
 * 継続会話時に必要な変数を生成する便利関数
 * 注意：Difyアプリケーション側でis_firstが必須の場合、継続会話でも送信が必要
 * 
 * @param context - コンテキスト情報
 * @returns 継続会話用のinputsオブジェクト
 */
export function generateContinuationInputs(
  context: ConversationVariableContext 
): Record<string, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return generateDifyInputs(context, [
    'isFirst',
    'customer_name',
    'phone',
    'reservation_date_and_time',
    'menu_name',
    'llm_context',
    'user_context'
  ]);
}

/**
 * 環境変数から有効な変数リストを取得する
 * 
 * @returns 有効な変数のパスの配列
 */
export function getEnabledVariablesFromEnv(): string[] | undefined {
  const envVariables = process.env.DIFY_ENABLED_VARIABLES;
  if (!envVariables) return undefined;
  
  return envVariables.split(',').map(v => v.trim()).filter(Boolean);
}

/**
 * デバッグ用: 生成される変数の内容をログ出力する
 * 
 * @param inputs - 生成されたinputsオブジェクト
 * @param context - コンテキスト情報
 */
export function debugLogInputs(
  inputs: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  context: ConversationVariableContext
): void {
  console.log('[DifyVariables] Generated inputs:', {
    context,
    inputs: JSON.stringify(inputs, null, 2)
  });
}