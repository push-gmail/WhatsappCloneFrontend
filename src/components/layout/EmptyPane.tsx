import { Laptop, FileText, UserPlus } from "lucide-react";
export default function EmptyPane() {
  return (
    <section className="empty-pane">
      <div className="empty-card"><Laptop size={84} /><h2>WhatsAppClone for Web</h2><p>Send and receive messages without keeping your phone online.</p></div>
      <div className="empty-actions"><span><FileText />Send document</span><span><UserPlus />Add contact</span></div>
    </section>
  );
}
