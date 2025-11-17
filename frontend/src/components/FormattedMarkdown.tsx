import React from "react";
import ReactMarkdown from "react-markdown";

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Component that renders markdown-formatted text from Gemini AI responses
 * with professional styling using Tailwind CSS
 */
const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({
  content,
  className = "text-gray-700",
}) => {
  return (
    <ReactMarkdown
      className={`text-sm leading-relaxed ${className}`}
      components={{
        // Paragraphs with proper spacing
        p: ({ children }) => (
          <p className="mb-3 last:mb-0">{children}</p>
        ),
        // Bold text
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        // Italic text
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // Unordered lists (bullet points)
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-5 mb-3 space-y-1">
            {children}
          </ul>
        ),
        // Ordered lists (numbered)
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-5 mb-3 space-y-1">
            {children}
          </ol>
        ),
        // List items
        li: ({ children }) => (
          <li className="pl-1">{children}</li>
        ),
        // Inline code
        code: ({ children, ...props }) => {
          // Check if it's a code block (has className) or inline code
          const isInline = !props.className;
          if (isInline) {
            return (
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          // Code block
          return (
            <code
              className="block bg-gray-100 text-gray-800 p-3 rounded text-xs font-mono overflow-x-auto mb-3"
              {...props}
            >
              {children}
            </code>
          );
        },
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold mb-2 mt-2 first:mt-0">{children}</h4>
        ),
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 py-2 mb-3 italic text-gray-600">
            {children}
          </blockquote>
        ),
        // Horizontal rule
        hr: () => (
          <hr className="my-4 border-gray-300" />
        ),
        // Links (maintain original styling or make them subtle)
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-indigo-600 hover:text-indigo-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default FormattedMarkdown;

