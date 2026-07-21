"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PlayCircle, X } from "lucide-react";

type Tutorial = {
  title: string;
  description: string;
  videoUrl: string;
};

const TUTORIALS: Record<string, Tutorial> = {
  "/": {
    title: "Ana Sayfa Tanıtımı",
    description: "i-Render platformunun genel kullanımı ve modüllerine giriş.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/oda": {
    title: "Oda Tasarımı Tutorial",
    description: "3D oda tasarımcısı ile oda şekli seçme ve sahne düzenleme.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/moduler": {
    title: "Modüler Ürün Oluşturma",
    description: "Köşe ve dolarları sürükle-bırak ile özelleştirme.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/sosyal": {
    title: "Sosyal Medya İçerik",
    description: "Görsellerden sosyal medya paylaşımı oluşturma.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/kumas": {
    title: "Kumaş Koleksiyonları",
    description: "Kumaş seçimi ve ürün eşleştirme rehberi.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/whatsapp-sms": {
    title: "WhatsApp & SMS Kampanyaları",
    description: "Müşteri filtreleme, mesaj template seçimi ve toplu gönderim.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/ai": {
    title: "AI Asistan Kullanımı",
    description: "Yapay zeka destekli öneriler ve içerik üretimi.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/login": {
    title: "Giriş Ekranı",
    description: "Hesabınıza nasıl giriş yapacağınız.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
};

const DEFAULT_TUTORIAL: Tutorial = {
  title: "Platform Rehberi",
  description: "i-Render kullanımı için genel tanıtım videosu.",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
};

function resolveTutorial(path: string): Tutorial {
  if (TUTORIALS[path]) return TUTORIALS[path];
  const base = "/" + path.split("/").filter(Boolean)[0];
  return TUTORIALS[base] ?? DEFAULT_TUTORIAL;
}

export function TutorialButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const tutorial = resolveTutorial(pathname);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Tutorial videosunu izle"
        className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2 rounded-full bg-[color:var(--istikbal-blue,#0066cc)] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/20 hover:scale-105 hover:shadow-xl active:scale-95"
        style={{ transition: "transform 150ms, box-shadow 150ms" }}
      >
        <PlayCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Tutorial</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{tutorial.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{tutorial.description}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                key={tutorial.videoUrl}
                src={tutorial.videoUrl}
                title={tutorial.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
