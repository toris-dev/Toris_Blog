"use client";

import type { Member, Organization, Role } from "@fieldstep/shared";
import { useCallback, useEffect, useState } from "react";
import { ProtectedImage } from "@/components/ProtectedMedia";
import { RecoverableError } from "@/components/RecoverableError";
import { API_BASE, api, type OrganizationInvite } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type InviteActionError = {
  kind: "create" | "copy" | "resend" | "cancel";
  message: string;
  invite?: OrganizationInvite;
};
type OrganizationActionError = {
  kind: "load" | "save" | "logo";
  message: string;
};
type OrganizationForm = {
  name: string;
  businessNo: string;
  address: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  externalLogoUrl: string;
};

const ROLE_LABEL: Record<Role, string> = { admin: "관리자", office: "사무실", field: "현장" };
const INVITE_STATUS_LABEL: Record<OrganizationInvite["status"], string> = {
  pending: "대기",
  accepted: "수락",
  canceled: "취소",
  expired: "만료",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isPrivateLogoUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url, API_BASE).origin === new URL(API_BASE).origin;
  } catch {
    return false;
  }
}

function formFromOrganization(organization: Organization): OrganizationForm {
  return {
    name: organization.name,
    businessNo: organization.businessNo ?? "",
    address: organization.address ?? "",
    contactName: organization.contactName ?? "",
    contactPhone: organization.contactPhone ?? "",
    contactEmail: organization.contactEmail ?? "",
    externalLogoUrl:
      organization.logoUrl && !isPrivateLogoUrl(organization.logoUrl)
        ? organization.logoUrl
        : "",
  };
}

function compressLogoImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("로고 이미지를 처리하지 못했습니다"));
    };
    image.onload = () => {
      URL.revokeObjectURL(sourceUrl);
      const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("로고 이미지 캔버스를 사용할 수 없습니다"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("로고 이미지를 압축하지 못했습니다"));
        },
        mimeType,
        mimeType === "image/jpeg" ? 0.85 : undefined,
      );
    };
    image.src = sourceUrl;
  });
}

function OrganizationLogoPreview({ organization }: { organization: Organization }) {
  if (!organization.logoUrl) {
    return (
      <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-line bg-bg-2 text-xs text-muted">
        등록된 로고 없음
      </div>
    );
  }
  if (isPrivateLogoUrl(organization.logoUrl)) {
    return (
      <ProtectedImage
        src={organization.logoUrl}
        alt={`${organization.name} 로고`}
        className="h-24 w-40 rounded-lg border border-line bg-white object-contain p-2"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={organization.logoUrl}
      alt={`${organization.name} 로고`}
      referrerPolicy="no-referrer"
      className="h-24 w-40 rounded-lg border border-line bg-white object-contain p-2"
    />
  );
}

export default function SettingsPage() {
  const { role, org, user } = useAuth();
  const isAdmin = role === "admin";
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationForm, setOrganizationForm] = useState<OrganizationForm>({
    name: "",
    businessNo: "",
    address: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    externalLogoUrl: "",
  });
  const [organizationLoading, setOrganizationLoading] = useState(true);
  const [organizationBusy, setOrganizationBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [organizationError, setOrganizationError] = useState<OrganizationActionError | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("field");
  const [busy, setBusy] = useState(false);
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionMessage, setMemberActionMessage] = useState<string | null>(
    null,
  );
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<InviteActionError | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadOrganization = useCallback(async () => {
    setOrganizationLoading(true);
    setOrganizationError(null);
    try {
      const result = await api.organization.get();
      setOrganization(result.organization);
      setOrganizationForm(formFromOrganization(result.organization));
    } catch (error) {
      setOrganizationError({
        kind: "load",
        message: getErrorMessage(error, "조직 정보를 불러오지 못했습니다"),
      });
    } finally {
      setOrganizationLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const result = await api.users();
      setMembers(result.members);
    } catch (error) {
      setMembersError(getErrorMessage(error, "구성원 목록을 불러오지 못했습니다"));
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadInvites = useCallback(async () => {
    if (!isAdmin) {
      setInvites([]);
      setInvitesError(null);
      return;
    }
    setInvitesLoading(true);
    setInvitesError(null);
    try {
      const result = await api.invites.list();
      setInvites(result.invites);
    } catch (error) {
      setInvitesError(getErrorMessage(error, "초대 목록을 불러오지 못했습니다"));
    } finally {
      setInvitesLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadOrganization();
    void loadMembers();
    void loadInvites();
  }, [loadInvites, loadMembers, loadOrganization]);

  async function changeMemberActive(member: Member) {
    if (!isAdmin) return;
    const nextActive = !member.active;
    if (!nextActive && member.id === user?.id) {
      setMemberActionError("자기 자신은 비활성화할 수 없습니다.");
      return;
    }
    const confirmed = window.confirm(
      nextActive
        ? `${member.name} (${member.email}) 구성원을 다시 활성화할까요?\n\n활성화 후 다시 로그인하고 새 작업을 배정받을 수 있습니다.`
        : `${member.name} (${member.email}) 구성원을 비활성화할까요?\n\n현재 세션에서 즉시 로그아웃되며 새 작업을 배정받을 수 없습니다. 기존 작업·작성·배정 이력은 유지됩니다.`,
    );
    if (!confirmed) return;

    setMemberBusyId(member.id);
    setMemberActionError(null);
    setMemberActionMessage(null);
    try {
      const result = await api.setMemberActive(member.id, nextActive);
      setMembers((current) =>
        current.map((item) =>
          item.id === result.member.id ? result.member : item,
        ),
      );
      setMemberActionMessage(
        result.changed
          ? `${result.member.name} 구성원을 ${
              result.member.active ? "활성화" : "비활성화"
            }했습니다.`
          : `${result.member.name} 구성원은 이미 ${
              result.member.active ? "활성" : "비활성"
            } 상태입니다.`,
      );
    } catch (error) {
      setMemberActionError(
        getErrorMessage(error, "구성원 상태를 변경하지 못했습니다"),
      );
    } finally {
      setMemberBusyId(null);
    }
  }

  async function saveOrganization() {
    if (!organization || !organizationForm.name.trim()) return;
    setOrganizationBusy(true);
    setOrganizationError(null);
    try {
      const body: Record<string, unknown> = {
        name: organizationForm.name.trim(),
        businessNo: organizationForm.businessNo.trim() || null,
        address: organizationForm.address.trim() || null,
        contactName: organizationForm.contactName.trim() || null,
        contactPhone: organizationForm.contactPhone.trim() || null,
        contactEmail: organizationForm.contactEmail.trim() || null,
      };
      const externalLogoUrl = organizationForm.externalLogoUrl.trim();
      if (externalLogoUrl) {
        let parsed: URL;
        try {
          parsed = new URL(externalLogoUrl);
        } catch {
          throw new Error("외부 로고 주소는 올바른 HTTPS URL이어야 합니다");
        }
        if (parsed.protocol !== "https:") {
          throw new Error("외부 로고 주소는 HTTPS URL이어야 합니다");
        }
        body.logoUrl = externalLogoUrl;
      } else if (organization.logoUrl && !isPrivateLogoUrl(organization.logoUrl)) {
        body.logoUrl = null;
      }

      const result = await api.organization.patch(body);
      setOrganization(result.organization);
      setOrganizationForm(formFromOrganization(result.organization));
    } catch (error) {
      setOrganizationError({
        kind: "save",
        message: getErrorMessage(error, "조직 정보를 저장하지 못했습니다"),
      });
    } finally {
      setOrganizationBusy(false);
    }
  }

  async function uploadLogo(file: File) {
    setLogoBusy(true);
    setOrganizationError(null);
    try {
      const blob = await compressLogoImage(file);
      const result = await api.organization.uploadLogo(blob);
      setOrganization(result.organization);
      setOrganizationForm(formFromOrganization(result.organization));
    } catch (error) {
      setOrganizationError({
        kind: "logo",
        message: getErrorMessage(error, "조직 로고를 저장하지 못했습니다"),
      });
    } finally {
      setLogoBusy(false);
    }
  }

  async function deleteLogo() {
    if (!organization?.logoUrl || !window.confirm("현재 조직 로고를 삭제할까요?")) return;
    setLogoBusy(true);
    setOrganizationError(null);
    try {
      const result = await api.organization.deleteLogo();
      setOrganization(result.organization);
      setOrganizationForm(formFromOrganization(result.organization));
    } catch (error) {
      setOrganizationError({
        kind: "logo",
        message: getErrorMessage(error, "조직 로고를 삭제하지 못했습니다"),
      });
    } finally {
      setLogoBusy(false);
    }
  }

  async function sendInvite() {
    setBusy(true);
    setInviteError(null);
    try {
      const { invite } = await api.invites.create({ email, role: inviteRole });
      const url = `${typeof location !== "undefined" ? location.origin : ""}/invite?token=${invite.token}`;
      setLastLink(url);
      setCopied(false);
      setEmail("");
      await loadInvites();
    } catch (err) {
      setInviteError({
        kind: "create",
        message: getErrorMessage(err, "초대를 생성하지 못했습니다"),
      });
    } finally {
      setBusy(false);
    }
  }

  async function copyInviteLink() {
    if (!lastLink) return;
    setInviteError(null);
    try {
      await navigator.clipboard.writeText(lastLink);
      setCopied(true);
    } catch (error) {
      setCopied(false);
      setInviteError({
        kind: "copy",
        message: getErrorMessage(error, "초대 링크를 복사하지 못했습니다"),
      });
    }
  }

  async function resendInvite(invite: OrganizationInvite) {
    setInviteBusyId(invite.id);
    setInviteError(null);
    try {
      const result = await api.invites.resend(invite.id);
      const url = `${typeof location !== "undefined" ? location.origin : ""}/invite?token=${result.invite.token}`;
      setLastLink(url);
      setCopied(false);
      await loadInvites();
    } catch (error) {
      setInviteError({
        kind: "resend",
        invite,
        message: getErrorMessage(error, "초대를 다시 발급하지 못했습니다"),
      });
    } finally {
      setInviteBusyId(null);
    }
  }

  async function cancelInvite(invite: OrganizationInvite) {
    if (!window.confirm(`${invite.email} 초대를 취소할까요?`)) return;
    setInviteBusyId(invite.id);
    setInviteError(null);
    try {
      await api.invites.cancel(invite.id);
      await loadInvites();
    } catch (error) {
      setInviteError({
        kind: "cancel",
        invite,
        message: getErrorMessage(error, "초대를 취소하지 못했습니다"),
      });
    } finally {
      setInviteBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">설정</h1>
      <section className="card space-y-4 p-4">
        <div>
          <p className="font-medium">조직 정보와 보고서 브랜딩</p>
          <p className="mt-1 text-sm text-muted">
            고객에게 전달되는 완료보고서의 회사 정보와 로고입니다.
          </p>
        </div>
        {organizationLoading && (
          <p role="status" className="py-4 text-sm text-muted">
            {org?.name ? `${org.name} 정보를 불러오는 중…` : "조직 정보를 불러오는 중…"}
          </p>
        )}
        {organizationError && (
          <RecoverableError
            title="조직 정보 작업을 완료하지 못했습니다"
            message={organizationError.message}
            nextAction={
              organizationError.kind === "logo"
                ? "이미지 형식과 용량을 확인한 뒤 로고를 다시 선택해주세요."
                : "입력 내용을 확인하고 다시 시도해주세요."
            }
            onRetry={
              organizationError.kind === "load"
                ? () => void loadOrganization()
                : organizationError.kind === "save"
                  ? () => void saveOrganization()
                  : undefined
            }
            retryLabel={organizationError.kind === "load" ? "다시 불러오기" : "저장 다시 시도"}
          />
        )}
        {organization && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <OrganizationLogoPreview organization={organization} />
              <div className="space-y-2">
                {isAdmin ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <label
                        className={`btn-primary tap-target cursor-pointer rounded-lg px-4 py-2 text-sm font-medium ${
                          logoBusy ? "pointer-events-none opacity-60" : ""
                        }`}
                      >
                        {logoBusy ? "로고 처리 중…" : organization.logoUrl ? "로고 교체" : "로고 업로드"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={logoBusy}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadLogo(file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      {organization.logoUrl && (
                        <button
                          type="button"
                          onClick={() => void deleteLogo()}
                          disabled={logoBusy}
                          className="btn-ghost tap-target rounded-lg px-4 py-2 text-sm disabled:opacity-60"
                        >
                          로고 삭제
                        </button>
                      )}
                    </div>
                    <p className="text-xs leading-5 text-muted">
                      PNG·JPG·WebP, 최대 5MB. 비공개 저장소에 보관하고 인증된 화면과 보고서 생성에서만 읽습니다.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">조직 정보 수정은 관리자만 가능합니다.</p>
                )}
              </div>
            </div>

            {isAdmin ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted">회사명</span>
                  <input
                    className="input w-full"
                    value={organizationForm.name}
                    onChange={(event) =>
                      setOrganizationForm({ ...organizationForm, name: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">사업자등록번호</span>
                  <input
                    className="input w-full"
                    value={organizationForm.businessNo}
                    onChange={(event) =>
                      setOrganizationForm({ ...organizationForm, businessNo: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted">회사 주소</span>
                  <input
                    className="input w-full"
                    value={organizationForm.address}
                    onChange={(event) =>
                      setOrganizationForm({ ...organizationForm, address: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">대표 담당자</span>
                  <input
                    className="input w-full"
                    value={organizationForm.contactName}
                    onChange={(event) =>
                      setOrganizationForm({ ...organizationForm, contactName: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">대표 연락처</span>
                  <input
                    className="input w-full"
                    inputMode="tel"
                    value={organizationForm.contactPhone}
                    onChange={(event) =>
                      setOrganizationForm({ ...organizationForm, contactPhone: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">대표 이메일</span>
                  <input
                    type="email"
                    className="input w-full"
                    value={organizationForm.contactEmail}
                    onChange={(event) =>
                      setOrganizationForm({ ...organizationForm, contactEmail: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">외부 로고 HTTPS URL (선택)</span>
                  <input
                    type="url"
                    className="input w-full"
                    placeholder="https://…"
                    value={organizationForm.externalLogoUrl}
                    onChange={(event) =>
                      setOrganizationForm({
                        ...organizationForm,
                        externalLogoUrl: event.target.value,
                      })
                    }
                  />
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => void saveOrganization()}
                    disabled={organizationBusy || !organizationForm.name.trim()}
                    className="btn-primary tap-target rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {organizationBusy ? "저장 중…" : "조직 정보 저장"}
                  </button>
                </div>
              </div>
            ) : (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">회사명</dt>
                  <dd className="font-medium">{organization.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">사업자등록번호</dt>
                  <dd>{organization.businessNo ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted">대표 담당자</dt>
                  <dd>{organization.contactName ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted">대표 연락처</dt>
                  <dd>{organization.contactPhone ?? "-"}</dd>
                </div>
              </dl>
            )}
          </>
        )}
      </section>

      <div className="card p-4">
        <div>
          <p className="font-medium">구성원</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            비활성화하면 해당 조직의 모든 세션에서 즉시 로그아웃됩니다. 기존
            작업·작성·배정 이력은 삭제되지 않습니다.
          </p>
        </div>
        {membersError && (
          <RecoverableError
            title="구성원 목록을 불러오지 못했습니다"
            message={membersError}
            className="mt-3"
            onRetry={() => void loadMembers()}
          />
        )}
        {memberActionError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {memberActionError}
          </p>
        )}
        {memberActionMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
          >
            {memberActionMessage}
          </p>
        )}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-2 py-2 font-medium">
                  이름
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  이메일
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  역할
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  상태
                </th>
                {isAdmin && (
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    관리
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isCurrentUser = member.id === user?.id;
                const isBusy = memberBusyId === member.id;
                const selfDeactivation = isCurrentUser && member.active;
                return (
                  <tr
                    key={member.id}
                    className={`border-b border-line last:border-0 ${
                      member.active ? "" : "bg-bg-2"
                    }`}
                  >
                    <td
                      className={`px-2 py-3 font-medium ${
                        member.active ? "" : "text-muted"
                      }`}
                    >
                      {member.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs font-normal text-muted">
                          본인
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-muted">{member.email}</td>
                    <td className="px-2 py-3">{ROLE_LABEL[member.role]}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          member.active
                            ? "bg-green-50 text-green-700"
                            : "bg-bg text-muted"
                        }`}
                      >
                        {member.active ? "활성" : "비활성"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-2 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void changeMemberActive(member)}
                          disabled={
                            memberBusyId !== null || selfDeactivation
                          }
                          aria-label={
                            selfDeactivation
                              ? `${member.name} 구성원은 현재 로그인한 계정이므로 비활성화할 수 없습니다`
                              : `${member.name} 구성원을 ${
                                  member.active ? "비활성화" : "활성화"
                                }`
                          }
                          aria-busy={isBusy}
                          title={
                            selfDeactivation
                              ? "현재 로그인한 계정은 비활성화할 수 없습니다"
                              : undefined
                          }
                          className={`tap-target rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                            member.active
                              ? "border-red-200 text-red-700 hover:bg-red-50"
                              : "border-line text-primary hover:border-primary hover:bg-bg-2"
                          }`}
                        >
                          {isBusy
                            ? "처리 중…"
                            : selfDeactivation
                              ? "현재 계정"
                              : member.active
                                ? "비활성화"
                                : "활성화"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {membersLoading && (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="py-4 text-center text-muted"
                  >
                    구성원을 불러오는 중…
                  </td>
                </tr>
              )}
              {!membersLoading && !membersError && members.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="py-4 text-center text-muted"
                  >
                    등록된 구성원이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="card space-y-3 p-4">
          <p className="font-medium">초대</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              placeholder="이메일"
              className="input flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
              <option value="field">현장</option>
              <option value="office">사무실</option>
              <option value="admin">관리자</option>
            </select>
            <button onClick={sendInvite} disabled={busy || !email} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium">
              {busy ? "생성 중…" : "초대 생성"}
            </button>
          </div>
          {inviteError && (
            <RecoverableError
              title="초대 작업을 완료하지 못했습니다"
              message={inviteError.message}
              nextAction={
                inviteError.kind === "copy"
                  ? "링크를 길게 누르거나 전체 선택해 직접 복사해주세요."
                  : inviteError.kind === "create"
                    ? "이메일과 역할을 확인한 뒤 초대 생성을 다시 시도해주세요."
                    : "초대 상태를 새로 불러온 뒤 작업을 다시 시도해주세요."
              }
              onRetry={
                inviteError.kind === "copy"
                  ? () => void copyInviteLink()
                  : inviteError.kind === "create"
                    ? () => void sendInvite()
                    : inviteError.kind === "resend" && inviteError.invite
                      ? () => void resendInvite(inviteError.invite!)
                      : inviteError.kind === "cancel" && inviteError.invite
                        ? () => void cancelInvite(inviteError.invite!)
                        : undefined
              }
              retryLabel={
                inviteError.kind === "copy"
                  ? "복사 다시 시도"
                  : inviteError.kind === "create"
                    ? "초대 다시 생성"
                    : inviteError.kind === "resend"
                      ? "재발송 다시 시도"
                      : "취소 다시 시도"
              }
            />
          )}
          {lastLink && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-2 p-2 text-xs">
              <code className="flex-1 truncate">{lastLink}</code>
              <button
                type="button"
                onClick={() => void copyInviteLink()}
                className="btn-ghost tap-target rounded px-2 py-1"
              >
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          )}
          <span className="sr-only" aria-live="polite">
            {copied ? "초대 링크를 클립보드에 복사했습니다." : ""}
          </span>
          {invitesError && (
            <RecoverableError
              title="초대 목록을 불러오지 못했습니다"
              message={invitesError}
              onRetry={() => void loadInvites()}
            />
          )}
          <table className="mt-2 w-full text-sm">
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b border-line last:border-0">
                  <td className="py-2">{inv.email}</td>
                  <td className="py-2">{ROLE_LABEL[inv.role]}</td>
                  <td className="py-2 text-muted">
                    {INVITE_STATUS_LABEL[inv.status]}
                    {inv.resendCount > 0 ? ` · 재발송 ${inv.resendCount}회` : ""}
                  </td>
                  <td className="py-2 text-muted">
                    {inv.status === "pending" || inv.status === "expired"
                      ? `만료 ${new Date(inv.expiresAt).toLocaleString("ko-KR")}`
                      : "-"}
                  </td>
                  <td className="py-2 text-right">
                    {(inv.status === "pending" || inv.status === "expired") && (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void resendInvite(inv)}
                          disabled={inviteBusyId === inv.id}
                          className="btn-ghost tap-target rounded px-2 py-1 text-xs disabled:opacity-50"
                        >
                          재발송
                        </button>
                        <button
                          type="button"
                          onClick={() => void cancelInvite(inv)}
                          disabled={inviteBusyId === inv.id}
                          className="btn-ghost tap-target rounded px-2 py-1 text-xs text-red-700 disabled:opacity-50"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {invitesLoading && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted">
                    초대 목록을 불러오는 중…
                  </td>
                </tr>
              )}
              {!invitesLoading && !invitesError && invites.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted">초대 이력이 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
