import { ChatDesktop, ChatMobile } from '@/components/chat-redesign';

export const metadata = { robots: { index: false, follow: false } };

export default function ChatRedesignPreview() {
  return (
    <div>
      <div className="hidden md:block">
        <ChatDesktop />
      </div>
      <div className="block md:hidden">
        <ChatMobile />
      </div>
    </div>
  );
}
