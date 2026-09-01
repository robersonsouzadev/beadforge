'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, Video } from 'lucide-react';
import { CommunityContentItem } from '@/config/community-content';

interface VideoPlayerModalProps {
  video: CommunityContentItem | null;
  onClose: () => void;
}

export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  useEffect(() => {
    if (!video) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Travar rolagem do body enquanto o modal estiver aberto
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [video, onClose]);

  if (!video) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="video-modal-title" className="text-sm font-bold text-white truncate">
                {video.title}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate">
                Canal: <span className="text-zinc-300 font-medium">{video.channelOrAuthor}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              title="Abrir no YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </a>

            <button
              onClick={onClose}
              aria-label="Fechar vídeo"
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/80 hover:bg-zinc-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Embed Player */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Modal Description Footer */}
        <div className="p-4 sm:p-6 bg-zinc-950/80 border-t border-zinc-800 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>{video.description}</p>
        </div>
      </div>
    </div>
  );
}
