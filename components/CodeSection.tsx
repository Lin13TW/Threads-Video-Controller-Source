import React, { useState } from 'react';
import { generateManifest, generateContentScript, generateStyles, generatePopupHTML, generatePopupJS } from '../utils/extensionGenerator';
import { DownloadIcon } from '../icons';

const CodeBlock = ({ title, code, filename }: { title: string, code: string, filename: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden mb-6">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-blue-400">{filename}</span>
           <span className="text-xs text-zinc-500 uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded transition-colors"
                title="Download this file"
            >
                <DownloadIcon className="w-3 h-3" /> Download
            </button>
            <button 
                onClick={handleCopy}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded transition-colors"
            >
                {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-zinc-300 font-mono leading-relaxed">
        {code}
      </pre>
    </div>
  );
};

export const CodeSection = () => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="bg-blue-900/20 border border-blue-800/50 p-6 rounded-2xl mb-8">
        <h3 className="text-xl font-bold text-blue-100 mb-2">更新步驟 (Update Steps v12.4)</h3>
        <ol className="list-decimal list-inside space-y-4 text-zinc-300 mt-4">
            <li>這次有 <strong>5個檔案</strong> 需要下載：<code className="text-white">manifest.json</code>, <code className="text-white">popup.html</code>, <code className="text-white">popup.js</code>, <code className="text-white">content.js</code>, <code className="text-white">styles.css</code>。</li>
            <li>請務必將這 5 個檔案全部覆蓋到您的資料夾中。</li>
            <li>
                前往 Edge 擴充功能頁面 <code className="bg-zinc-800 px-1 rounded">edge://extensions</code>。
            </li>
            <li className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                點擊右下角的 <strong>重整 (Reload)</strong> 圖示 ↻。
                <div className="mt-2 text-yellow-500 text-sm">
                   v12.4 變更：
                   <ul className="list-disc list-inside ml-4 mt-1 text-zinc-400">
                       <li><strong>移除音量控制:</strong> 介面更簡潔，保留了播放進度、速度與旋轉功能。</li>
                   </ul>
                </div>
            </li>
        </ol>
      </div>

      <CodeBlock 
        filename="manifest.json" 
        title="Extension Config (New)" 
        code={generateManifest()} 
      />
      
      <CodeBlock 
        filename="popup.html" 
        title="Menu HTML (New)" 
        code={generatePopupHTML()} 
      />

      <CodeBlock 
        filename="popup.js" 
        title="Menu Logic (New)" 
        code={generatePopupJS()} 
      />

      <CodeBlock 
        filename="styles.css" 
        title="Styling" 
        code={generateStyles()} 
      />

      <CodeBlock 
        filename="content.js" 
        title="Logic Script" 
        code={generateContentScript()} 
      />
    </div>
  );
};