describe('반응형 디자인 테스트', () => {
  const sizes = [
    { device: '모바일', width: 375, height: 667 },
    { device: '태블릿', width: 768, height: 1024 },
    { device: '랩톱', width: 1366, height: 768 },
    { device: '데스크톱', width: 1920, height: 1080 }
  ];

  context('홈페이지 반응형 테스트', () => {
    sizes.forEach((size) => {
      it(`${size.device} 뷰포트에서 홈페이지가 올바르게 보여야 함 (${size.width}x${size.height})`, () => {
        cy.viewport(size.width, size.height);
        cy.visit('/');

        // 헤더 확인
        cy.get('header').should('be.visible');

        // 모바일 메뉴 확인 (모바일 뷰포트에서만)
        if (size.width < 768) {
          cy.get('[data-cy="sidebarToggle"]').should('be.visible');
          // 모바일 메뉴가 기본적으로 숨겨져 있는지 확인
          cy.get('[data-cy="mobileSidebar"]').should('not.be.visible');
        } else {
          // 데스크톱에서는 네비게이션 링크가 보여야 함
          cy.get('header nav').should('be.visible');
        }

        // 히어로 섹션 확인
        cy.contains('Next.js').should('be.visible');

        // 푸터 확인
        cy.get('footer').should('be.visible');
      });
    });
  });

  context('블로그 페이지 반응형 테스트', () => {
    sizes.forEach((size) => {
      it(`${size.device} 뷰포트에서 블로그 페이지가 올바르게 보여야 함 (${size.width}x${size.height})`, () => {
        cy.viewport(size.width, size.height);
        cy.visit('/posts');

        // 블로그 제목 확인
        cy.contains('블로그').should('be.visible');

        // 포스트 카드가 표시되는지 확인
        cy.get('a[href*="/posts/"]').should('be.visible');

        // 그리드 레이아웃 확인
        if (size.width < 640) {
          // 모바일에서는 단일 컬럼
          cy.get('a[href*="/posts/"]').should(
            'have.css',
            'grid-column-start',
            '1'
          );
        } else if (size.width >= 640 && size.width < 1024) {
          // 태블릿에서는 2개 컬럼
          cy.get('a[href*="/posts/"]').should('have.length.at.least', 2);
        } else {
          // 데스크톱에서는 3개 컬럼
          cy.get('a[href*="/posts/"]').should('have.length.at.least', 3);
        }
      });
    });
  });

  context('포트폴리오 페이지 반응형 테스트', () => {
    sizes.forEach((size) => {
      it(`${size.device} 뷰포트에서 포트폴리오 페이지가 올바르게 보여야 함 (${size.width}x${size.height})`, () => {
        cy.viewport(size.width, size.height);
        cy.visit('/portfolio');

        // 포트폴리오 제목 확인
        cy.contains('포트폴리오').should('be.visible');

        // 프로젝트 섹션 확인
        cy.contains('프로젝트').should('be.visible');

        // 이미지 갤러리 확인
        cy.get('img').should('be.visible');
      });
    });
  });

  context('다크모드 테스트', () => {
    it('다크모드 토글 확인', () => {
      cy.visit('/');

      // 다크모드 토글 클릭
      cy.get('[data-cy="darkModeToggle"]').click();

      // HTML에 dark 클래스가 추가되었는지 확인
      cy.get('html').should('have.class', 'dark');

      // 다시 클릭하면 라이트모드로 돌아가는지 확인
      cy.get('[data-cy="darkModeToggle"]').click();
      cy.get('html').should('not.have.class', 'dark');
    });
  });
});
