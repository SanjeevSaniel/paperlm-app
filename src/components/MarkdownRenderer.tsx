'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
      components={{
        // Enhanced heading styles
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 border-b border-gray-200 pb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-5">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-medium text-gray-700 mb-2 mt-4">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-medium text-gray-600 mb-2 mt-3">
            {children}
          </h4>
        ),
        
        // Enhanced paragraph styling
        p: ({ children }) => (
          <p className="text-gray-700 leading-relaxed mb-3 text-sm">
            {children}
          </p>
        ),

        // Beautiful bullet points
        ul: ({ children }) => (
          <ul className="space-y-1 mb-3 ml-4">
            {children}
          </ul>
        ),
        li: ({ children }) => (
          <li className="text-gray-700 text-sm leading-relaxed list-none relative">
            <span className="absolute -left-4 text-blue-500 font-medium">•</span>
            <span className="block">{children}</span>
          </li>
        ),

        // Numbered lists
        ol: ({ children }) => (
          <ol className="space-y-1 mb-3 ml-4 list-decimal list-inside">
            {children}
          </ol>
        ),

        // Enhanced blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 pl-4 pr-4 py-2 mb-3 rounded-r-md">
            <div className="text-gray-600 text-sm italic">
              {children}
            </div>
          </blockquote>
        ),

        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-600">
            {children}
          </em>
        ),

        // Code blocks and inline code
        code: ({ className, children, ...props }) => (
          <code 
            className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono"
            {...props}
          >
            {children}
          </code>
        ),

        pre: ({ children }) => (
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-3 text-xs">
            {children}
          </pre>
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50">
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase border-b border-gray-200">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            {children}
          </td>
        ),

        // Links
        a: ({ children, href }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            {children}
          </a>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="border-0 border-t border-gray-300 my-4" />
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}