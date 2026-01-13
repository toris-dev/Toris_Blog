/**
 * 클립보드에 텍스트를 복사합니다.
 * 최신 Clipboard API를 우선 사용하고, 실패 시 execCommand를 사용합니다.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 최신 Clipboard API 사용 (HTTPS 또는 localhost에서만 작동)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback: execCommand 사용 (구형 브라우저 지원)
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('aria-hidden', 'true');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      document.body.removeChild(textArea);
      console.error('execCommand copy failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
