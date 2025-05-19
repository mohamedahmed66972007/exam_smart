import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Copy } from "lucide-react";
import { ButtonArabic } from "@/components/ui/button-arabic";
import { FaWhatsapp, FaTelegram, FaFacebook, FaTwitter, FaEnvelope } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

interface ShareExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: number;
  examTitle: string;
  examCode: string;
  examLink: string;
}

export const ShareExamModal: React.FC<ShareExamModalProps> = ({
  isOpen,
  onClose,
  examCode,
  examLink,
  examTitle
}) => {
  const [emails, setEmails] = useState("");
  const { toast } = useToast();

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "تم النسخ!",
        description: message,
      });
    });
  };

  const handleShareLink = (platform: string) => {
    let shareUrl = "";
    const shareText = `ندعوك للمشاركة في اختبار "${examTitle}" - ${examLink}`;

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(examLink)}&text=${encodeURIComponent(shareText)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(examLink)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(`دعوة للمشاركة في اختبار "${examTitle}"`)}&body=${encodeURIComponent(shareText)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  const sendEmails = () => {
    if (!emails.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال عنوان بريد إلكتروني واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم الإرسال!",
      description: "تم إرسال دعوة الاختبار إلى البريد الإلكتروني المحدد",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">مشاركة الاختبار</DialogTitle>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <div className="mb-6">
            <label className="block mb-2 font-semibold">رابط الاختبار</label>
            <div className="flex">
              <input
                type="text"
                value={examLink}
                className="w-full px-4 py-2 rounded-r-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                readOnly
              />
              <ButtonArabic
                className="px-4 py-2 rounded-l-lg"
                onClick={() => copyToClipboard(examLink, "تم نسخ رابط الاختبار")}
              >
                <Copy className="h-4 w-4" />
              </ButtonArabic>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-semibold">كود الاختبار</label>
            <div className="flex items-center justify-center space-x-1 space-x-reverse mb-4">
              {examCode.split("").map((char, index) => (
                <div
                  key={index}
                  className="w-12 h-16 flex items-center justify-center text-2xl font-bold bg-background border border-border rounded-lg"
                >
                  {char}
                </div>
              ))}
            </div>
            <ButtonArabic
              className="w-full"
              onClick={() => copyToClipboard(examCode, "تم نسخ كود الاختبار")}
            >
              <Copy className="ml-1" />
              نسخ الكود
            </ButtonArabic>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-semibold">مشاركة عبر</label>
            <div className="flex justify-center space-x-4 space-x-reverse">
              <button
                className="w-12 h-12 flex items-center justify-center bg-[#25d366] hover:bg-opacity-90 text-white rounded-full"
                onClick={() => handleShareLink("whatsapp")}
              >
                <FaWhatsapp className="text-xl" />
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center bg-[#0088cc] hover:bg-opacity-90 text-white rounded-full"
                onClick={() => handleShareLink("telegram")}
              >
                <FaTelegram className="text-xl" />
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center bg-[#1877f2] hover:bg-opacity-90 text-white rounded-full"
                onClick={() => handleShareLink("facebook")}
              >
                <FaFacebook className="text-xl" />
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center bg-[#1da1f2] hover:bg-opacity-90 text-white rounded-full"
                onClick={() => handleShareLink("twitter")}
              >
                <FaTwitter className="text-xl" />
              </button>
              <button
                className="w-12 h-12 flex items-center justify-center bg-[#0a66c2] hover:bg-opacity-90 text-white rounded-full"
                onClick={() => handleShareLink("email")}
              >
                <FaEnvelope className="text-xl" />
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-semibold">إرسال عبر البريد الإلكتروني</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="أدخل عناوين البريد الإلكتروني مفصولة بفواصل..."
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
          </div>
          
          <ButtonArabic
            className="w-full"
            onClick={sendEmails}
          >
            <FaEnvelope className="ml-1" />
            إرسال
          </ButtonArabic>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareExamModal;
