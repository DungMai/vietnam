import type { ReactNode } from 'react';

interface Props {
  role: 'user' | 'agent' | 'system';
  children: ReactNode;
  accentColor?: string;
}

export const ChatBubble = ({ role, children, accentColor }: Props) => {
  if (role === 'user') {
    return (
      <div className="ml-auto max-w-[80%] rounded-lg rounded-br-sm bg-ink-primary px-4 py-3 text-body-sm text-surface-base">
        {children}
      </div>
    );
  }
  if (role === 'system') {
    return (
      <div className="mx-auto max-w-prose text-center text-caption text-ink-secondary">
        {children}
      </div>
    );
  }
  return (
    <div
      className="mr-auto max-w-[80%] rounded-lg rounded-bl-sm bg-surface-raised px-4 py-3 text-body-sm shadow-raised"
      style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}
    >
      {children}
    </div>
  );
};
