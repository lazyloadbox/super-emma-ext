export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export class LMStudioClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://192.168.1.148:12345/v1') {
    this.baseUrl = baseUrl;
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ModelsResponse = await response.json();
      return data.data.map(model => model.id);
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async sendMessage(
    messages: ChatMessage[],
    model: string,
    onToken?: (token: string, reasoning?: string) => void,
    abortSignal?: AbortSignal
  ): Promise<{ content: string; reasoning_content?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: !!onToken,
          temperature: 0.7,
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (onToken && response.body) {
        // 流式响应处理
        const reader = response.body.getReader();
        let fullContent = '';
        let fullReasoning = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  const reasoning = parsed.choices?.[0]?.delta?.reasoning_content;
                  
                  if (content) {
                    fullContent += content;
                  }
                  
                  if (reasoning) {
                    fullReasoning += reasoning;
                  }
                  
                  // Call onToken for any content or reasoning update
                  if (content || reasoning) {
                    onToken(content || '', reasoning);
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        return { 
          content: fullContent, 
          reasoning_content: fullReasoning || undefined 
        };
      } else {
        // 非流式响应处理
        const data: ChatCompletionResponse = await response.json();
        return { 
          content: data.choices[0]?.message?.content || '',
          reasoning_content: data.choices[0]?.message?.reasoning_content
        };
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getModels();
      return true;
    } catch {
      return false;
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/v1') ? url : `${url}/v1`;
  }
} 