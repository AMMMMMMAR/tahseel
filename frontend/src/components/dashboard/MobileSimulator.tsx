"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRight,
  Battery,
  CheckCheck,
  MoreVertical,
  Phone,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Video,
  Wifi,
} from "lucide-react";
import type { DispatchedReminder } from "@/hooks/useAgentWebSocket";

interface MobileSimulatorProps {
  latestReminder: DispatchedReminder | null;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  badge?: string;
  tone?: "brand" | "danger" | "success" | "warning";
}

export function MobileSimulator({ latestReminder }: MobileSimulatorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Format initial message or new arriving reminder
  useEffect(() => {
    if (latestReminder) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        const amountFormatted = latestReminder.amount
          ? `${Number(latestReminder.amount).toLocaleString()} ر.س`
          : "";

        const text = `السيد/ة ${latestReminder.recipient} المحترم/ة،\n\nنود إشعاركم بشأن المطالبة المالية المستحقة${
          latestReminder.bond_number ? ` (سند رقم: ${latestReminder.bond_number})` : ""
        }${amountFormatted ? ` بمبلغ ${amountFormatted}` : ""}.\n\nالحالة الحالية: ${
          latestReminder.label || "متابعة دورية"
        }.\n\nيرجى تسوية المستحقات أو الرد عبر الخيارات السريعة أدناه لتفادي أي إجراءات تصعيدية.\n\nمنصة تحصيل — الإدارة المالية`;

        const newMsg: ChatMessage = {
          id: latestReminder.id,
          sender: "bot",
          text,
          time: latestReminder.timestamp,
          badge: latestReminder.label || "تنبيه",
          tone:
            (latestReminder.level ?? 1) >= 4
              ? "danger"
              : (latestReminder.level ?? 1) >= 3
              ? "warning"
              : "brand",
        };

        setMessages((prev) => [newMsg, ...prev]);
      }, 900);

      return () => clearTimeout(timer);
    } else {
      // Default initial mock message for portfolio demonstration
      setMessages([
        {
          id: "init-1",
          sender: "bot",
          text: "السيد/ة شركة الأفق التجارية المحترم/ة،\n\nنود متابعة الفاتورة المستحقة بمبلغ 38,500.00 ر.س (سند رقم: BOND-2026-081).\n\nالمبلغ متأخر منذ 5 أيام. يرجى تأكيد موعد التحويل البنكي وإرسال إشعار السداد لفريق المحاسبة.\n\nقسم الحسابات — منصة تحصيل",
          time: "09:41 ص",
          badge: "متابعة رسمية (المستوى 2)",
          tone: "brand",
        },
      ]);
    }
  }, [latestReminder]);

  const handleQuickReply = (actionType: "paid" | "installment" | "dispute") => {
    const timeNow = new Date().toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let userText = "";
    let botReply = "";

    if (actionType === "paid") {
      userText = "تم التحويل البنكي للمبلغ المطلوب، ومرفق إشعار السداد للاعتماد.";
      botReply = "شكراً لتعاونكم! تم استلام إشعار السداد وتوجيهه آلياً لنظام المطابقة المحاسبية. سيتم تحديث حالة السند إلى 'مسدد' فور تأكيد البنك.";
    } else if (actionType === "installment") {
      userText = "نطلب اعتماد مقترح جدولة السداد على 3 دفعات ميسرة.";
      botReply = "تم استلام طلب الجدولة. تم تجميد إجراءات التصعيد وإصدار جدول الأقساط المعتمد وإرساله لبريدكم الإلكتروني.";
    } else {
      userText = "نرجو مراجعة الفاتورة، يوجد اعتراض على بنود المطالبة المذكورة.";
      botReply = "تم تقييد اعتراضكم في النظام وتجميد التذكيرات الآلية مؤقتاً. تم تحويل الملف لمسؤول النزاعات للتواصل معكم خلال 24 ساعة عمل.";
    }

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      sender: "user",
      text: userText,
      time: timeNow,
    };

    setMessages((prev) => [userMsg, ...prev]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyMsg: ChatMessage = {
        id: `${Date.now()}-b`,
        sender: "bot",
        text: botReply,
        time: timeNow,
        badge: "استجابة فورية",
        tone: "success",
      };
      setMessages((prev) => [replyMsg, ...prev]);
    }, 1100);
  };

  const handleReset = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: "bot",
        text: "السيد/ة العميل المحترم/ة،\n\nنود تذكيركم بموعد استحقاق السند المالي بمبلغ 25,000.00 ر.س.\n\nتذكير بموعد الاستحقاق القادم مع كامل تقديرنا لشراكتكم الدائمة.\n\nخدمة العملاء — منصة تحصيل",
        time: "10:00 ص",
        badge: "تذكير استباقي",
        tone: "brand",
      },
    ]);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Device Frame */}
      <div className="w-[330px] sm:w-[350px] bg-[#1a1a22] p-3 rounded-[44px] shadow-2xl border-[4px] border-[#2c2c38] relative">
        {/* Outer Phone Buttons */}
        <div className="absolute -left-[7px] top-24 w-[3px] h-9 bg-[#383846] rounded-l" />
        <div className="absolute -left-[7px] top-36 w-[3px] h-12 bg-[#383846] rounded-l" />
        <div className="absolute -right-[7px] top-28 w-[3px] h-14 bg-[#383846] rounded-r" />

        {/* Screen Container */}
        <div className="bg-[#0b141a] w-full h-[580px] rounded-[36px] overflow-hidden flex flex-col relative border border-[#1e2a30]">
          {/* Status Bar */}
          <div className="pt-2 px-6 pb-1 flex items-center justify-between text-white text-[11px] font-semibold bg-[#111b21] z-20">
            <span>09:41</span>
            {/* Dynamic Island */}
            <div className="w-20 h-4 bg-black rounded-full flex items-center justify-end px-2">
              <span className="size-2 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 text-white/90">
              <Wifi size={12} />
              <Battery size={13} />
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between text-white z-10 border-b border-[#2a3942]">
            <div className="flex items-center gap-2">
              <ArrowRight size={18} className="text-[#aebac1]" />
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={18} />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#e9edef]">
                    منصة تحصيل
                  </span>
                  <Badge tone="success" className="px-1 py-0 text-[9px]">
                    موثق
                  </Badge>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {isTyping ? "يكتب الآن..." : "حساب رسمي ذكي"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[#aebac1]">
              <Video size={16} />
              <Phone size={15} />
              <MoreVertical size={16} />
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col-reverse gap-2.5 bg-[#0b141a] text-xs">
            {isTyping && (
              <div className="self-start bg-[#202c33] text-[#e9edef] px-3 py-2 rounded-2xl rounded-tr-none flex items-center gap-1.5 shadow-md">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            {messages.map((m) => {
              const isBot = m.sender === "bot";
              return (
                <div
                  key={m.id}
                  className={`max-w-[88%] p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-md ${
                    isBot
                      ? "self-start bg-[#202c33] text-[#e9edef] rounded-tr-none border border-[#2a3942]"
                      : "self-end bg-[#005c4b] text-white rounded-tl-none"
                  }`}
                >
                  {isBot && m.badge && (
                    <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-[#2a3942] pb-1">
                      <span className="font-bold text-[10px] text-emerald-400">
                        {m.badge}
                      </span>
                      <span className="text-[9px] text-[#8696a0]">تحصيل آلي</span>
                    </div>
                  )}

                  <p className="whitespace-pre-line select-text">{m.text}</p>

                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#8696a0]">
                    <span>{m.time}</span>
                    <CheckCheck size={13} className="text-sky-400" />
                  </div>
                </div>
              );
            })}

            {/* Encryption notice */}
            <div className="self-center bg-[#182229] text-[#ffd279] text-[9px] px-2.5 py-1 rounded-md text-center max-w-[240px] my-1">
              🔒 الرسائل في هذه المحادثة مشفرة ومسجلة نظامياً كإشعار مالي رسمي.
            </div>
          </div>

          {/* Quick-Reply Action Bar */}
          <div className="p-2 bg-[#1f2c34] border-t border-[#2a3942] flex flex-col gap-1.5">
            <span className="text-[10px] text-[#8696a0] font-semibold text-center">
              خيارات الرد السريع للمدين:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleQuickReply("paid")}
                className="bg-[#2a3942] hover:bg-[#32444f] text-emerald-300 text-[10px] py-1.5 px-1 rounded-lg border border-[#3b4e5a] transition font-medium text-center truncate"
                title="تم السداد وإرسال الإشعار"
              >
                💸 تم السداد
              </button>

              <button
                type="button"
                onClick={() => handleQuickReply("installment")}
                className="bg-[#2a3942] hover:bg-[#32444f] text-amber-300 text-[10px] py-1.5 px-1 rounded-lg border border-[#3b4e5a] transition font-medium text-center truncate"
                title="طلب جدولة على 3 أقساط"
              >
                📅 جدولة أقساط
              </button>

              <button
                type="button"
                onClick={() => handleQuickReply("dispute")}
                className="bg-[#2a3942] hover:bg-[#32444f] text-rose-300 text-[10px] py-1.5 px-1 rounded-lg border border-[#3b4e5a] transition font-medium text-center truncate"
                title="اعتراض على المطالبة"
              >
                ⚠️ اعتراض
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Control Bar */}
      <div className="flex items-center justify-between w-full max-w-[350px] mt-2 px-3 text-xs text-[#8f8f9d]">
        <div className="flex items-center gap-1.5">
          <Smartphone size={14} className="text-emerald-400" />
          <span>محاكي واتساب المباشر</span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-[#8f8f9d] hover:text-white transition"
          title="إعادة تعيين المحاكي"
        >
          <RotateCcw size={12} />
          <span>إعادة ضبط</span>
        </button>
      </div>
    </div>
  );
}
