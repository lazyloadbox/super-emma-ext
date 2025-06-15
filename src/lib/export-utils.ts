import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MessageProps } from '../components/chat/message';

// 导出格式类型
export type ExportFormat = 'markdown' | 'pdf' | 'html';

// 导出聊天记录为Markdown格式
export const exportChatToMarkdown = (messages: MessageProps[]): void => {
  const timestamp = new Date().toLocaleString();
  let markdown = `# Chat Export\n\n**Exported on:** ${timestamp}\n\n---\n\n`;

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? '👤 **User**' : '🤖 **Emma (AI)**';
    const messageTime = message.timestamp instanceof Date 
      ? message.timestamp.toLocaleString() 
      : new Date(message.timestamp).toLocaleString();

    markdown += `## ${role}\n`;
    markdown += `*${messageTime}*\n\n`;

    // 如果是AI消息且有thinking content，先添加thinking部分
    if (message.role === 'assistant' && message.reasoning_content) {
      markdown += `### 💭 Thinking Process\n\n`;
      markdown += '```\n';
      markdown += message.reasoning_content;
      markdown += '\n```\n\n';
    }

    // 添加主要内容
    if (message.content) {
      markdown += `### Response\n\n`;
      markdown += message.content;
      markdown += '\n\n';
    }

    // 如果有元数据（如页面抓取信息）
    if (message.metadata) {
      markdown += `### Metadata\n\n`;
      if (message.metadata.source) {
        markdown += `- **Source:** ${message.metadata.source}\n`;
      }
      if (message.metadata.url) {
        markdown += `- **URL:** ${message.metadata.url}\n`;
      }
      if (message.metadata.captureTime) {
        markdown += `- **Capture Time:** ${message.metadata.captureTime}\n`;
      }
      markdown += '\n';
    }

    markdown += '---\n\n';
  });

  // 下载文件
  const filename = `chat-export-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.md`;
  downloadFile(markdown, filename, 'text/markdown');
};

// 导出单个AI消息为Markdown格式
export const exportMessageToMarkdown = (message: MessageProps): void => {
  const timestamp = new Date().toLocaleString();
  const messageTime = message.timestamp instanceof Date 
    ? message.timestamp.toLocaleString() 
    : new Date(message.timestamp).toLocaleString();

  let markdown = `# AI Message Export\n\n`;
  markdown += `**Exported on:** ${timestamp}\n`;
  markdown += `**Message Time:** ${messageTime}\n\n`;
  markdown += `---\n\n`;

  // 如果有thinking content，先添加thinking部分
  if (message.reasoning_content) {
    markdown += `## 💭 Thinking Process\n\n`;
    markdown += '```\n';
    markdown += message.reasoning_content;
    markdown += '\n```\n\n';
  }

  // 添加主要内容
  if (message.content) {
    markdown += `## 🤖 AI Response\n\n`;
    markdown += message.content;
    markdown += '\n\n';
  }

  // 下载文件
  const filename = `ai-message-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.md`;
  downloadFile(markdown, filename, 'text/markdown');
};

// 下载文件并在浏览器中打开
const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // 下载文件
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 在新窗口中打开文件
  setTimeout(() => {
    window.open(url, '_blank');
    // 延迟清理URL，确保文件能够正常打开
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }, 100);
};

// HTML转义函数
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 简单的Markdown到HTML转换
const convertMarkdownToHTML = (markdown: string): string => {
  let html = escapeHtml(markdown);
  
  // 代码块
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 标题
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // 粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 引用
  html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
  
  // 列表项
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // 换行
  html = html.replace(/\n/g, '<br>');
  
  return html;
};

// 生成HTML内容
const generateHTML = (messages: MessageProps[], forExport: boolean = false): string => {
  const timestamp = new Date().toLocaleString();
  
  let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Export - ${timestamp}</title>
    <style>
        ${forExport ? '@media print { @page { margin: 20mm; size: A4; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }' : ''}
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        
        .header .timestamp {
            color: #6b7280;
            font-size: 14px;
        }
        
        .message {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .message-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
        }
        
        .message-header.user {
            background-color: #dbeafe;
            color: #1e40af;
            border-left: 4px solid #3b82f6;
        }
        
        .message-header.assistant {
            background-color: #dcfce7;
            color: #166534;
            border-left: 4px solid #22c55e;
        }
        
        .message-content {
            padding: 0 16px;
        }
        
        .thinking-section {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
        }
        
        .thinking-header {
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .thinking-content {
            font-family: 'Courier New', Consolas, Monaco, monospace;
            font-size: 12px;
            color: #64748b;
            white-space: pre-wrap;
            background-color: #f1f5f9;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
        }
        
        .main-content {
            font-size: 14px;
            line-height: 1.7;
        }
        
        .main-content h1, .main-content h2, .main-content h3, 
        .main-content h4, .main-content h5, .main-content h6 {
            color: #1f2937;
            margin-top: 24px;
            margin-bottom: 12px;
        }
        
        .main-content h1 { font-size: 20px; }
        .main-content h2 { font-size: 18px; }
        .main-content h3 { font-size: 16px; }
        .main-content h4 { font-size: 14px; }
        
        .main-content p {
            margin-bottom: 12px;
        }
        
        .main-content code {
            background-color: #f3f4f6;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', Consolas, Monaco, monospace;
            font-size: 12px;
        }
        
        .main-content pre {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            overflow-x: auto;
            margin: 16px 0;
        }
        
        .main-content pre code {
            background: none;
            padding: 0;
        }
        
        .main-content blockquote {
            border-left: 4px solid #d1d5db;
            padding-left: 16px;
            margin: 16px 0;
            color: #6b7280;
            font-style: italic;
        }
        
        .main-content ul, .main-content ol {
            padding-left: 24px;
            margin-bottom: 12px;
        }
        
        .main-content li {
            margin-bottom: 4px;
        }
        
        .metadata {
            margin-top: 16px;
            padding: 12px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-size: 12px;
            color: #6b7280;
        }
        
        .metadata-item {
            margin-bottom: 4px;
        }
        
        .metadata-label {
            font-weight: 600;
            color: #374151;
        }
        
        .separator {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
        }
        
        /* 确保中文字符正确显示 */
        * {
            font-feature-settings: "kern" 1;
            text-rendering: optimizeLegibility;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💬 Chat Export</h1>
        <div class="timestamp">导出时间: ${timestamp}</div>
    </div>
`;

  messages.forEach((message, index) => {
    const isUser = message.role === 'user';
    const roleDisplay = isUser ? '👤 用户' : '🤖 Emma (AI)';
    const messageTime = message.timestamp instanceof Date 
      ? message.timestamp.toLocaleString() 
      : new Date(message.timestamp).toLocaleString();

    html += `
    <div class="message">
        <div class="message-header ${isUser ? 'user' : 'assistant'}">
            <span>${roleDisplay}</span>
            <span>•</span>
            <span>${messageTime}</span>
        </div>
        <div class="message-content">
`;

    // 如果是AI消息且有思考过程
    if (!isUser && message.reasoning_content) {
      html += `
            <div class="thinking-section">
                <div class="thinking-header">💭 思考过程</div>
                <div class="thinking-content">${escapeHtml(message.reasoning_content)}</div>
            </div>
`;
    }

    // 主要内容
    if (message.content) {
      // 简单的Markdown到HTML转换
      const htmlContent = convertMarkdownToHTML(message.content);
      html += `
            <div class="main-content">
                ${htmlContent}
            </div>
`;
    }

    // 元数据
    if (message.metadata) {
      html += `
            <div class="metadata">
`;
      if (message.metadata.source) {
        html += `<div class="metadata-item"><span class="metadata-label">来源:</span> ${escapeHtml(message.metadata.source)}</div>`;
      }
      if (message.metadata.url) {
        html += `<div class="metadata-item"><span class="metadata-label">网址:</span> ${escapeHtml(message.metadata.url)}</div>`;
      }
      if (message.metadata.captureTime) {
        html += `<div class="metadata-item"><span class="metadata-label">抓取时间:</span> ${escapeHtml(message.metadata.captureTime)}</div>`;
      }
      html += `
            </div>
`;
    }

    html += `
        </div>
    </div>
`;

    if (index < messages.length - 1) {
      html += `<hr class="separator">`;
    }
  });

  html += `
</body>
</html>`;

  return html;
};

// 导出聊天记录为HTML格式
export const exportChatToHTML = (messages: MessageProps[]): void => {
  const htmlContent = generateHTML(messages, false);
  const filename = `chat-export-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.html`;
  downloadFile(htmlContent, filename, 'text/html');
};

// 导出聊天记录为PDF（使用html2canvas + jsPDF）
export const exportChatToPDF = async (messages: MessageProps[]): Promise<void> => {
  try {
    // 创建一个隐藏的容器来渲染HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px';
    container.style.background = 'white';
    
    // 生成HTML内容
    const htmlContent = generateHTML(messages, true);
    
    // 创建一个临时的iframe来渲染内容
    const iframe = document.createElement('iframe');
    iframe.style.width = '800px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    container.appendChild(iframe);
    document.body.appendChild(container);
    
    // 等待iframe加载完成
    await new Promise<void>((resolve) => {
      iframe.onload = () => {
        if (iframe.contentDocument) {
          iframe.contentDocument.open();
          iframe.contentDocument.write(htmlContent);
          iframe.contentDocument.close();
          
          // 等待内容渲染完成
          setTimeout(resolve, 1000);
        }
      };
      iframe.src = 'about:blank';
    });
    
    if (!iframe.contentDocument?.body) {
      throw new Error('无法渲染HTML内容');
    }
    
    // 使用html2canvas截图
    const canvas = await html2canvas(iframe.contentDocument.body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 800,
      windowWidth: 800,
      scrollX: 0,
      scrollY: 0
    });
    
    // 创建PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4宽度
    const pageHeight = 295; // A4高度
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // 添加第一页
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // 如果内容超过一页，添加更多页面
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // 生成文件名并保存
    const filename = `chat-export-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.pdf`;
    pdf.save(filename);
    
    // 在新窗口中预览PDF
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    // 清理
    document.body.removeChild(container);
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('PDF导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
};

// 通用导出函数，根据格式选择不同的导出方式
export const exportChat = async (messages: MessageProps[], format: ExportFormat): Promise<void> => {
  switch (format) {
    case 'markdown':
      exportChatToMarkdown(messages);
      break;
    case 'html':
      exportChatToHTML(messages);
      break;
    case 'pdf':
      await exportChatToPDF(messages);
      break;
    default:
      throw new Error(`不支持的导出格式: ${format}`);
  }
}; 