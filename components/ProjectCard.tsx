'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteProjectAction } from '@/app/actions/projects';
import { LayoutGrid, Box, Trash2, Clock, Loader2 } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    mode: string;
    thumbnail: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      startDelete(async () => {
        await deleteProjectAction(project.id);
        router.refresh();
      });
    }
  };

  const editHref = project.mode === 'ultra' ? `/ultra?project=${project.id}` : `/editor?project=${project.id}`;

  return (
    <Link
      href={editHref}
      className="group relative bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between transition duration-200 shadow-md hover:shadow-xl hover:bg-zinc-850"
    >
      <div>
        {/* Thumbnail or Placeholder */}
        <div className="aspect-video bg-zinc-950 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-zinc-800 group-hover:border-zinc-700 transition">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="text-zinc-600 group-hover:text-amber-400 transition">
              {project.mode === 'ultra' ? (
                <Box className="w-8 h-8" />
              ) : (
                <LayoutGrid className="w-8 h-8" />
              )}
            </div>
          )}
        </div>

        {/* Project Name & Mode Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition truncate">
            {project.name}
          </h3>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              project.mode === 'ultra'
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {project.mode === 'ultra' ? '3D' : '2D'}
          </span>
        </div>
      </div>

      {/* Footer Info & Delete Action */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1 text-[11px]">
          <Clock className="w-3 h-3" />
          {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
        </span>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1 text-zinc-500 hover:text-rose-400 transition rounded-md hover:bg-rose-500/10"
          title="Excluir Projeto"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </Link>
  );
}
