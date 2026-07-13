'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';

const gallery = [
  {
    src: '/images/projects/snapmate/screen-camera.png',
    alt: 'SnapMate에서 촬영할 순간을 확인하는 카메라 화면',
    portrait: true
  },
  {
    src: '/images/projects/snapmate/screen-gallery.png',
    alt: 'SnapMate에서 함께 모은 사진을 보는 갤러리 화면',
    portrait: true
  },
  {
    src: '/images/projects/snapmate/screen-group.png',
    alt: 'SnapMate에서 사진을 보관할 그룹을 확인하는 화면',
    portrait: true
  }
] as const;

export default function SnapMateLanding({ project }: { project: Project }) {
  const [captured, setCaptured] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <CinematicLanding
      project={project}
      eyebrow="SHARED MOMENTS"
      title="찰칵, 우리 갤러리로"
      thesis="카메라에서 시작한 한 장을 촬영 정보와 함께 친구와 가족의 그룹 갤러리에 보관하는 따뜻한 순간 공유 경험입니다."
      theme={{
        background: '#FFF7ED',
        surface: '#FFFFFF',
        ink: '#4A2D24',
        muted: '#8A675C',
        accent: '#FB923C',
        accent2: '#FB7185'
      }}
      proof={['찍고 바로 공유', '그룹별 순간 보관', '따뜻한 모바일 경험']}
      gallery={gallery}
      signature={
        <SignatureFrame label="SnapMate 촬영 데모">
          <motion.div
            initial={false}
            animate={
              reduceMotion
                ? undefined
                : {
                    rotate: captured ? -2 : 0,
                    y: captured ? 12 : 0,
                    scale: captured ? 0.96 : 1
                  }
            }
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`mx-auto max-w-xs shadow-2xl ${
              captured
                ? 'rounded-2xl bg-white p-3'
                : 'rounded-[2rem] bg-[#4A2D24] p-2'
            } ${reduceMotion && captured ? 'translate-y-3 -rotate-2' : ''}`}
          >
            <div className="relative aspect-[706/1100] overflow-hidden rounded-3xl">
              <Image
                src="/images/projects/snapmate/screen-camera.png"
                alt="SnapMate 카메라에서 친구들과 남길 순간을 미리 보는 화면"
                fill
                sizes="(max-width: 640px) 80vw, 320px"
                className="object-cover"
              />
            </div>
          </motion.div>

          <div className="mt-7 flex flex-col items-center gap-3">
            <button
              data-testid="snap-shutter"
              type="button"
              aria-label="사진 촬영"
              className="size-14 rounded-full border-4 border-white bg-[#FB923C] shadow-md transition-colors hover:bg-[#FB7185] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4A2D24]"
              onClick={() => setCaptured(true)}
            />
            <p role="status" aria-live="polite" className="font-semibold">
              {captured
                ? '우리 갤러리에 저장됨'
                : '셔터를 눌러 순간을 남겨보세요'}
            </p>
          </div>
        </SignatureFrame>
      }
    />
  );
}
