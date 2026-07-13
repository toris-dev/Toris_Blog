'use client';

import { useState } from 'react';
import type { Project } from '@/data/projects';
import { CinematicLanding, SignatureFrame } from './cinematic';
import { cinematicThemes } from './themes';

const selectClassName =
  'mt-2 block min-h-11 w-full rounded-xl border border-[#172033]/20 bg-white px-3 text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2';

export default function YouthMoneyGuideLanding({
  project
}: {
  project: Project;
}) {
  const [scanned, setScanned] = useState(false);
  const [age, setAge] = useState('19–24');
  const [region, setRegion] = useState('전국');
  const [interest, setInterest] = useState('주거');

  return (
    <CinematicLanding
      project={project}
      eyebrow="SOURCE-FIRST POLICY"
      title="조건은 간단하게, 근거는 분명하게"
      thesis="청년 정책과 생활비 정보를 나이·지역·관심사로 좁히고 공식 출처와 검토 기준을 함께 보여주는 정보 서비스입니다."
      theme={cinematicThemes['youth-money-guide']}
      proof={['조건으로 좁히기', '공식 출처 확인', '정책·제휴 구분']}
      gallery={[
        {
          src: '/images/projects/youth-money-guide/cover.png',
          alt: '청년머니가이드 대표 이미지'
        }
      ]}
      signature={
        <SignatureFrame label="청년 정책 조건 스캐너">
          <div className="grid gap-3 text-[#172033] sm:grid-cols-3">
            <label className="font-semibold">
              나이대
              <select
                aria-label="나이대"
                className={selectClassName}
                value={age}
                onChange={(event) => setAge(event.target.value)}
              >
                <option value="19–24">19–24</option>
                <option value="25–29">25–29</option>
                <option value="30–34">30–34</option>
              </select>
            </label>
            <label className="font-semibold">
              지역
              <select
                aria-label="지역"
                className={selectClassName}
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                <option value="전국">전국</option>
                <option value="서울">서울</option>
                <option value="경기">경기</option>
              </select>
            </label>
            <label className="font-semibold">
              관심사
              <select
                aria-label="관심사"
                className={selectClassName}
                value={interest}
                onChange={(event) => setInterest(event.target.value)}
              >
                <option value="주거">주거</option>
                <option value="일자리">일자리</option>
                <option value="생활비">생활비</option>
              </select>
            </label>
          </div>
          <button
            data-testid="policy-scan"
            type="button"
            className="mt-6 min-h-11 rounded-full bg-[#1D4ED8] px-6 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
            onClick={() => setScanned(true)}
          >
            정책 카드 스캔
          </button>
          {scanned ? (
            <article
              role="status"
              className="mt-5 rounded-2xl bg-white p-5 text-[#172033]"
            >
              <h2 className="font-bold">조건에 맞는 정책 카드</h2>
              <p className="mt-2 text-sm text-[#64748B]">
                선택한 조건으로 공식 정보를 확인할 목록을 정리했습니다.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <p>나이대 {age}</p>
                <p>지역 {region}</p>
                <p>관심사 {interest}</p>
              </div>
              <p className="mt-4 font-mono text-sm">검토일 2026.07.13</p>
              <a
                href="https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-[#1D4ED8] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
              >
                온통청년 정책 통합검색
              </a>
              <p className="mt-4 text-sm">실제 신청 전 원문을 확인하세요</p>
            </article>
          ) : null}
        </SignatureFrame>
      }
    />
  );
}
