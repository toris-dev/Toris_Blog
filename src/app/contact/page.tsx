'use client';

import { submitContactForm, type ContactFormData } from '@/app/actions/contact';
import { AiOutlineMail, FaCheck, FaPaperPlane } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  StudioCanvas,
  StudioEyebrow,
  StudioSection,
  StudioStage,
  studioActionStyles
} from '@/components/studio/StudioShell';
import { StudioPageCanvas } from '@/components/studio/StudioLanding';
import { studioBusiness } from '@/data/studio';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState, useTransition } from 'react';

const initialForm: ContactFormData = {
  name: '',
  email: '',
  projectType: '',
  budgetRange: '',
  timeline: '',
  requiredFeatures: '',
  message: ''
};

const selectClassName =
  'block min-h-11 w-full rounded-xl border border-[var(--toris-control-border)] bg-[var(--toris-canvas)] px-3 py-2 text-sm text-[var(--toris-ink)] outline-none transition-colors placeholder:text-[var(--toris-ink-muted)] focus-visible:border-[var(--toris-system)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--toris-focus)]';

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormData>(initialForm);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  const updateField = (field: keyof ContactFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('idle');
    setResponseMessage('');

    startTransition(async () => {
      const result = await submitContactForm(form);
      if (result.success) {
        setStatus('success');
        setResponseMessage(result.message);
        setForm(initialForm);
        return;
      }

      setStatus('error');
      setResponseMessage(result.message || '상담 요청 전송에 실패했습니다.');
    });
  };

  return (
    <StudioPageCanvas>
      <StudioCanvas className="border-b border-[var(--toris-border)] pb-16 pt-32 sm:pb-20 sm:pt-40">
        <StudioSection className="max-w-6xl">
          <StudioEyebrow>Project inquiry</StudioEyebrow>
          <h1 className="mt-6 max-w-4xl text-balance break-keep text-5xl font-black leading-[0.98] tracking-[-0.04em] text-[var(--toris-ink)] sm:text-6xl md:text-7xl">
            만들고 싶은 제품을{' '}
            <span className="text-[var(--toris-signal-text)]">
              함께 정리해 봅시다.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-pretty break-keep text-base leading-8 text-[var(--toris-ink-muted)] sm:text-lg">
            확정된 기획서가 없어도 괜찮습니다. 현재 목표, 필요한 기능, 예산과
            일정을 보내주시면 첫 개발 범위를 정리해 답변드립니다.
          </p>
        </StudioSection>
      </StudioCanvas>

      <StudioStage className="py-20 sm:py-24">
        <StudioSection className="grid max-w-6xl gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <StudioEyebrow>상담 전 알아두세요</StudioEyebrow>
            <h2 className="mt-5 text-balance break-keep text-3xl font-black leading-tight tracking-[-0.04em] text-[var(--toris-ink)] sm:text-4xl">
              제품의 현재 상태부터 출시 후 운영까지 같이 봅니다.
            </h2>

            <ul className="mt-8 space-y-4 border-y border-[var(--toris-border)] py-7 text-sm text-[var(--toris-ink)]">
              {[
                '웹·앱·데스크톱·MVP 개발',
                '기획 보완부터 배포·운영까지',
                '영업일 기준 1–2일 내 1차 회신'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--toris-signal)] text-[var(--toris-on-signal)]">
                    <FaCheck className="size-2.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={`mailto:${studioBusiness.email}`}
              className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--toris-system-text)] underline decoration-[var(--toris-system)] underline-offset-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--toris-focus)]"
            >
              <AiOutlineMail className="size-4" />
              {studioBusiness.email}
            </a>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[var(--toris-border)] bg-[var(--toris-surface)] p-5 shadow-[var(--toris-shadow-sm)] sm:p-8"
            aria-label="프로젝트 상담 양식"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="이름 또는 회사명" htmlFor="name">
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="어떻게 불러드리면 될까요?"
                  required
                  className={selectClassName}
                />
              </Field>
              <Field label="회신 이메일" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="name@company.com"
                  required
                  className={selectClassName}
                />
              </Field>
              <Field label="개발 유형" htmlFor="projectType">
                <select
                  id="projectType"
                  value={form.projectType}
                  onChange={(event) =>
                    updateField('projectType', event.target.value)
                  }
                  required
                  className={selectClassName}
                >
                  <option value="">선택해 주세요</option>
                  <option value="웹 서비스·SaaS">웹 서비스·SaaS</option>
                  <option value="모바일 앱">모바일 앱</option>
                  <option value="데스크톱 앱">데스크톱 앱</option>
                  <option value="MVP·프로토타입">MVP·프로토타입</option>
                  <option value="AI·업무 자동화">AI·업무 자동화</option>
                  <option value="기존 제품 개선">기존 제품 개선</option>
                </select>
              </Field>
              <Field label="예산 범위" htmlFor="budgetRange">
                <select
                  id="budgetRange"
                  value={form.budgetRange}
                  onChange={(event) =>
                    updateField('budgetRange', event.target.value)
                  }
                  required
                  className={selectClassName}
                >
                  <option value="">선택해 주세요</option>
                  <option value="500만원 미만">500만원 미만</option>
                  <option value="500만–1,000만원">500만–1,000만원</option>
                  <option value="1,000만–3,000만원">1,000만–3,000만원</option>
                  <option value="3,000만원 이상">3,000만원 이상</option>
                  <option value="협의 필요">협의 필요</option>
                </select>
              </Field>
              <Field label="희망 일정" htmlFor="timeline">
                <select
                  id="timeline"
                  value={form.timeline}
                  onChange={(event) =>
                    updateField('timeline', event.target.value)
                  }
                  required
                  className={selectClassName}
                >
                  <option value="">선택해 주세요</option>
                  <option value="1개월 이내">1개월 이내</option>
                  <option value="1–3개월">1–3개월</option>
                  <option value="3–6개월">3–6개월</option>
                  <option value="일정 협의">일정 협의</option>
                </select>
              </Field>
              <div className="hidden sm:block" aria-hidden />
            </div>

            <div className="mt-5 space-y-5">
              <Field label="필요한 기능" htmlFor="requiredFeatures">
                <textarea
                  id="requiredFeatures"
                  rows={5}
                  value={form.requiredFeatures}
                  onChange={(event) =>
                    updateField('requiredFeatures', event.target.value)
                  }
                  placeholder="예: 회원가입, 결제, 관리자 화면, 실시간 알림이 필요합니다."
                  required
                  className={`${selectClassName} resize-y`}
                />
              </Field>
              <Field label="현재 상황과 참고 사항 (선택)" htmlFor="message">
                <textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={(event) =>
                    updateField('message', event.target.value)
                  }
                  placeholder="기획서나 디자인 유무, 참고 서비스, 가장 걱정되는 점을 알려주세요."
                  className={`${selectClassName} resize-y`}
                />
              </Field>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className={`${studioActionStyles({ intent: 'signal' })} mt-7 min-h-12 w-full`}
            >
              {isPending ? '상담 요청 전송 중...' : '프로젝트 상담 요청하기'}
              {!isPending ? <FaPaperPlane className="ml-2 size-3.5" /> : null}
            </Button>

            <AnimatePresence mode="wait">
              {responseMessage ? (
                <motion.p
                  key={status}
                  role="status"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                    status === 'success'
                      ? 'border-[var(--toris-signal)] bg-[color-mix(in_srgb,var(--toris-signal)_14%,transparent)] text-[var(--toris-signal-text)]'
                      : 'border-[var(--toris-destructive)] bg-[color-mix(in_srgb,var(--toris-destructive)_14%,transparent)] text-[var(--toris-destructive-text)]'
                  }`}
                >
                  {responseMessage}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <p className="mt-5 text-center text-xs leading-5 text-[var(--toris-ink-muted)]">
              보내주신 내용은 상담 회신과 프로젝트 범위 검토에만 사용합니다.
            </p>
          </form>
        </StudioSection>
      </StudioStage>
    </StudioPageCanvas>
  );
}

function Field({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-bold text-[var(--toris-ink)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
