import {
  validateAuthorId,
  validatePassword,
  validateContent,
  validateCommentInput,
  sanitizeContent
} from '@/utils/comment';

describe('comment utils', () => {
  describe('validateAuthorId', () => {
    it('should validate correct author ID', () => {
      const result = validateAuthorId('user123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty author ID', () => {
      const result = validateAuthorId('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject author ID longer than 50 characters', () => {
      const result = validateAuthorId('a'.repeat(51));
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject author ID with special characters', () => {
      const result = validateAuthorId('user@123');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept Korean characters', () => {
      const result = validateAuthorId('사용자123');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 4 characters', () => {
      const result = validatePassword('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject password longer than 50 characters', () => {
      const result = validatePassword('a'.repeat(51));
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateContent', () => {
    it('should validate correct content', () => {
      const result = validateContent('This is a comment');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty content', () => {
      const result = validateContent('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject content longer than 1000 characters', () => {
      const result = validateContent('a'.repeat(1001));
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCommentInput', () => {
    it('should validate correct input', () => {
      const result = validateCommentInput('user123', 'password123', 'Comment content');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const result = validateCommentInput('', '', '');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeContent', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeContent('<script>alert("xss")</script>Hello');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should escape special characters', () => {
      const result = sanitizeContent('Hello & World');
      expect(result).toContain('&amp;');
    });

    it('should preserve plain text', () => {
      const result = sanitizeContent('Hello World');
      expect(result).toBe('Hello World');
    });
  });
});
