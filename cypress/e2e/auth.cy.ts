describe('인증 및 관리자 페이지 테스트', () => {
  context('로그인 및 인증 테스트', () => {
    beforeEach(() => {
      cy.visit('/signin');
    });

    it('로그인 페이지가 정상적으로 로드되어야 함', () => {
      cy.get('h1').contains('로그인').should('exist');
      cy.get('input[name="email"]').should('exist');
      cy.get('input[name="password"]').should('exist');
      cy.get('button[type="submit"]').contains('로그인').should('exist');
    });

    it('이메일 형식 검증이 작동해야 함', () => {
      // 유효하지 않은 이메일 입력
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      // 오류 메시지 확인
      cy.contains('유효한 이메일 주소를 입력하세요').should('exist');

      // 올바른 이메일로 수정
      cy.get('input[name="email"]').clear();
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
    });

    it('잘못된 자격 증명으로 로그인 시 오류 메시지가 표시되어야 함', () => {
      // 인터셉트 설정 - 로그인 실패
      cy.intercept('POST', '/api/signin', {
        statusCode: 401,
        body: { error: '이메일 또는 비밀번호가 잘못되었습니다' }
      }).as('loginFailed');

      // 로그인 시도
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      // 실패 요청 확인
      cy.wait('@loginFailed');

      // 오류 메시지 확인
      cy.contains('이메일 또는 비밀번호가 잘못되었습니다').should('exist');
    });

    it('성공적인 로그인 후 리디렉션이 이루어져야 함', () => {
      // 인터셉트 설정 - 로그인 성공
      cy.intercept('POST', '/api/signin', {
        statusCode: 200,
        body: {
          success: true,
          user: { email: 'test@example.com', name: 'Test User' }
        }
      }).as('loginSuccess');

      // 로그인
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      // 성공 요청 확인
      cy.wait('@loginSuccess');

      // 대시보드로 리디렉션 확인
      cy.url().should('include', '/dashboard');
    });
  });

  context('관리자 페이지 테스트', () => {
    beforeEach(() => {
      // 인증된 사용자로 세션 모의 설정
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          user: {
            name: 'Admin User',
            email: 'admin@example.com',
            image: null,
            role: 'admin'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      });

      cy.visit('/admin');
    });

    it('관리자 대시보드가 정상적으로 로드되어야 함', () => {
      cy.contains('관리자 대시보드').should('exist');
      cy.contains('게시물 관리').should('exist');
      cy.contains('새 글 작성').should('exist');
    });

    it('새 글 작성 페이지로 이동해야 함', () => {
      cy.contains('새 글 작성').click();
      cy.url().should('include', '/admin/editor');
    });

    it('마크다운 편집기가 있어야 함', () => {
      cy.contains('새 글 작성').click();

      // 마크다운 편집기 확인
      cy.get('[data-cy="markdownEditor"]').should('exist');
      cy.get('[data-cy="titleInput"]').should('exist');
      cy.get('[data-cy="categorySelect"]').should('exist');
      cy.get('[data-cy="tagsInput"]').should('exist');
      cy.get('[data-cy="submitButton"]').should('exist');
    });

    it('게시물 목록을 표시해야 함', () => {
      // 게시물 데이터 인터셉트
      cy.intercept('GET', '/api/posts*', {
        statusCode: 200,
        body: [
          {
            id: '1',
            title: '테스트 포스트 1',
            slug: 'test-post-1',
            date: new Date().toISOString(),
            category: 'Next.js'
          },
          {
            id: '2',
            title: '테스트 포스트 2',
            slug: 'test-post-2',
            date: new Date().toISOString(),
            category: 'React'
          }
        ]
      }).as('getPosts');

      // 게시물 관리 페이지 방문
      cy.contains('게시물 관리').click();
      cy.url().should('include', '/admin/posts');

      // 데이터 로드 대기
      cy.wait('@getPosts');

      // 게시물 목록 확인
      cy.contains('테스트 포스트 1').should('exist');
      cy.contains('테스트 포스트 2').should('exist');
    });

    it('게시물 편집 기능이 작동해야 함', () => {
      // 게시물 데이터 인터셉트
      cy.intercept('GET', '/api/posts*', {
        statusCode: 200,
        body: [
          {
            id: '1',
            title: '테스트 포스트 1',
            slug: 'test-post-1',
            date: new Date().toISOString(),
            category: 'Next.js'
          }
        ]
      }).as('getPosts');

      // 게시물 관리 페이지 방문
      cy.contains('게시물 관리').click();
      cy.url().should('include', '/admin/posts');

      // 데이터 로드 대기
      cy.wait('@getPosts');

      // 편집 버튼 클릭
      cy.contains('tr', '테스트 포스트 1')
        .find('button[aria-label="Edit"]')
        .click();

      // 편집 페이지로 이동 확인
      cy.url().should('include', '/admin/editor');
      cy.url().should('include', 'test-post-1');
    });
  });

  context('비인증 사용자 접근 제한 테스트', () => {
    beforeEach(() => {
      // 비인증 사용자로 세션 모의 설정
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: { user: null }
      });
    });

    it('비인증 사용자는 관리자 페이지에 접근할 수 없어야 함', () => {
      cy.visit('/admin');

      // 로그인 페이지로 리디렉션 확인
      cy.url().should('include', '/signin');
      cy.contains('로그인').should('exist');
    });

    it('비인증 사용자는 새 글 작성 페이지에 접근할 수 없어야 함', () => {
      cy.visit('/admin/editor');

      // 로그인 페이지로 리디렉션 확인
      cy.url().should('include', '/signin');
    });

    it('비인증 사용자는 게시물 관리 페이지에 접근할 수 없어야 함', () => {
      cy.visit('/admin/posts');

      // 로그인 페이지로 리디렉션 확인
      cy.url().should('include', '/signin');
    });
  });
});
