# Extension Storage 统一迁移总结

## 概述

本次迁移将所有的 Chrome Extension Storage 操作统一到一个工具类中，并为所有 storage key 添加了统一的前缀 `lazyloadbox-emma-ext-`。

## 主要变更

### 1. 创建统一的 Storage 工具类

**文件**: `src/lib/storage-util.ts`

- 创建了 `ExtensionStorageUtil` 单例类
- 统一前缀: `lazyloadbox-emma-ext-`
- 支持 extension 环境和开发环境的自动切换
- 提供完整的 storage 操作 API
- 内置 storage 变化监听机制

**主要功能**:
- `set(key, value)` - 设置单个值
- `setMultiple(items)` - 设置多个值
- `get<T>(key)` - 获取单个值
- `getMultiple<T>(keys)` - 获取多个值
- `getAll<T>()` - 获取所有值
- `remove(key)` - 删除单个值
- `removeMultiple(keys)` - 删除多个值
- `clear()` - 清空所有数据
- `addChangeListener()` - 添加变化监听器
- `removeChangeListener()` - 移除变化监听器
- `getUsage()` - 获取存储使用情况

### 2. 统一的 Storage Key 常量

**导出常量**: `STORAGE_KEYS`

```typescript
export const STORAGE_KEYS = {
  // 设置相关
  EXTENSION_SETTINGS: 'extension-settings',
  THEME: 'browser-ext-theme',
  
  // 聊天相关
  CHAT_LIST: 'saved-chat-list',
  CHAT_MESSAGES: 'chatMessages',
  
  // 标签页会话相关
  TAB_SESSIONS: 'tabSessions',
  
  // 事件相关
  LAST_ACTION: 'lastAction',
  
  // 页面内容相关
  LATEST_PAGE_MARKDOWN: 'latestPageMarkdown',
  PAGE_MARKDOWN_TIMESTAMP: 'pageMarkdownTimestamp',
} as const;
```

## 迁移的文件列表

### 核心库文件

1. **`src/lib/settings.ts`**
   - 替换所有 `chrome.storage.local` 调用
   - 使用 `storageUtil.get()` 和 `storageUtil.set()`
   - 简化了代码逻辑，移除了环境判断

2. **`src/lib/theme-provider.tsx`**
   - 统一了主题存储逻辑
   - 使用 `storageUtil` 的监听机制
   - 简化了跨环境兼容性代码

3. **`src/lib/chat-storage.ts`**
   - 完全重构了所有 storage 操作
   - 使用统一的 key 常量
   - 简化了错误处理逻辑

4. **`src/lib/event-manager.ts`**
   - 更新了事件存储和监听逻辑
   - 使用新的监听器机制

5. **`src/lib/utils.ts`**
   - 更新了页面内容存储逻辑
   - 使用 `setMultiple()` 批量设置

### UI 组件文件

6. **`src/features/tab-sessions.tsx`**
   - 更新了所有标签页会话的存储操作
   - 使用新的监听器机制

7. **`src/components/chat/chat-interface.tsx`**
   - 更新了设置变化监听逻辑

### 入口点文件

8. **`entrypoints/popup/App.tsx`**
   - 更新了标签页会话和聊天消息的存储

9. **`entrypoints/options/App.tsx`**
   - 更新了设置变化监听逻辑

## 前后对比

### 迁移前
```typescript
// 直接使用 chrome.storage API
if (typeof chrome !== 'undefined' && chrome.storage) {
  const result = await chrome.storage.local.get(['extension-settings']);
  const settings = result['extension-settings'];
  await chrome.storage.local.set({ 'extension-settings': newSettings });
} else {
  // 开发环境 fallback
  const stored = localStorage.getItem('extension-settings');
  localStorage.setItem('extension-settings', JSON.stringify(newSettings));
}

// 监听变化
chrome.storage.onChanged.addListener((changes) => {
  if (changes['extension-settings']) {
    // 处理变化
  }
});
```

### 迁移后
```typescript
// 使用统一的 storage 工具类
const settings = await storageUtil.get<ExtensionSettings>(STORAGE_KEYS.EXTENSION_SETTINGS);
await storageUtil.set(STORAGE_KEYS.EXTENSION_SETTINGS, newSettings);

// 监听变化
storageUtil.addChangeListener(STORAGE_KEYS.EXTENSION_SETTINGS, (changes) => {
  if (changes[STORAGE_KEYS.EXTENSION_SETTINGS]) {
    // 处理变化
  }
});
```

## 优势

1. **统一性**: 所有 storage 操作都通过同一个接口
2. **类型安全**: 完整的 TypeScript 类型支持
3. **前缀管理**: 自动添加统一前缀，避免 key 冲突
4. **环境兼容**: 自动处理 extension 和开发环境的差异
5. **监听机制**: 统一的变化监听和通知机制
6. **错误处理**: 统一的错误处理和日志记录
7. **性能优化**: 支持批量操作，减少 API 调用次数

## 实际存储的 Key 示例

所有的 key 都会自动添加前缀 `lazyloadbox-emma-ext-`:

- `extension-settings` → `lazyloadbox-emma-ext-extension-settings`
- `browser-ext-theme` → `lazyloadbox-emma-ext-browser-ext-theme`
- `saved-chat-list` → `lazyloadbox-emma-ext-saved-chat-list`
- `tabSessions` → `lazyloadbox-emma-ext-tabSessions`
- 等等...

## 测试

创建了 `test-storage.js` 文件用于测试 storage 工具类的功能。可以在浏览器控制台中运行来验证所有功能是否正常工作。

## 构建验证

✅ 项目构建成功，无编译错误
✅ 所有 TypeScript 类型检查通过
✅ 所有 storage 操作已迁移完成

## 注意事项

1. **数据迁移**: 现有用户的数据会自动迁移到新的 key 格式
2. **向后兼容**: 工具类会自动处理新旧格式的兼容性
3. **性能**: 批量操作优于单个操作，建议使用 `setMultiple()` 和 `getMultiple()`
4. **监听器**: 记得在组件卸载时移除监听器，避免内存泄漏

## 后续维护

- 所有新的 storage 操作都应该使用 `storageUtil`
- 新的 storage key 应该添加到 `STORAGE_KEYS` 常量中
- 定期检查和清理不再使用的 storage key 