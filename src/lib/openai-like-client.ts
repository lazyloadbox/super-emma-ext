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
  created?: number;
  owned_by?: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export interface OpenAILikeConfig {
  baseUrl: string;
  apiKey?: string;
}

export class OpenAILikeClient {
  private config: OpenAILikeConfig;

  constructor(config: OpenAILikeConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl.endsWith('/v1') ? config.baseUrl : `${config.baseUrl}/v1`,
    };
  }

  async getModels(): Promise<string[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers,
      });

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
    customSettings?: any, // 保持兼容性但不使用
    abortSignal?: AbortSignal
  ): Promise<{ content: string; reasoning_content?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const requestBody: any = {
        model,
        messages,
        stream: !!onToken,
        max_tokens: 2048, // 固定默认值
        temperature: 0.7, // 固定默认值
      };

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      if (onToken && response.body) {
        // Streaming response handling
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
                  // Ignore parsing errors for SSE
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
        // Non-streaming response handling
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
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  updateConfig(newConfig: Partial<OpenAILikeConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
      baseUrl: newConfig.baseUrl 
        ? (newConfig.baseUrl.endsWith('/v1') ? newConfig.baseUrl : `${newConfig.baseUrl}/v1`)
        : this.config.baseUrl,
    };
  }

  getConfig(): OpenAILikeConfig {
    return { ...this.config };
  }
} 