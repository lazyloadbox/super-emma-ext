export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    reasoning_content?: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama connection test failed:', error);
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((model: OllamaModel) => model.name) || [];
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      return [];
    }
  }

  async sendMessage(
    messages: OllamaMessage[],
    model: string,
    onToken?: (token: string, reasoning?: string) => void,
    abortSignal?: AbortSignal
  ): Promise<{ content: string; reasoning_content?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: !!onToken,
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (onToken && response.body) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let fullReasoning = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const data: OllamaResponse = JSON.parse(line);
                const content = data.message?.content;
                const reasoning = data.message?.reasoning_content;
                
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
                
                if (data.done) {
                  return { 
                    content: fullContent,
                    reasoning_content: fullReasoning || undefined
                  };
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming response:', parseError);
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
        // Handle non-streaming response
        const data: OllamaResponse = await response.json();
        return { 
          content: data.message?.content || '',
          reasoning_content: data.message?.reasoning_content
        };
      }
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }
} 