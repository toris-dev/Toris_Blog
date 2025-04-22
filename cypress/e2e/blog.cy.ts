describe('블로그 포스트 테스트', () => {
  it('포스트 목록 페이지 테스트', () => {
    cy.visit('/posts');

    // 페이지 제목 확인
    cy.contains('블로그').should('exist');

    // 포스트 리스트 확인
    cy.get('a[href*="/posts/"]').should('have.length.at.least', 1);

    // 카테고리 필터링 확인
    cy.get('a[href*="/categories/"]').first().click();
    cy.url().should('include', '/categories/');
    cy.go('back');

    // 태그 필터링 확인
    cy.get('a[href*="/tags/"]').first().click();
    cy.url().should('include', '/tags/');
    cy.go('back');
  });

  it('포스트 상세 페이지 테스트', () => {
    cy.visit('/posts');

    // 첫 번째 포스트 클릭
    cy.get('a[href*="/posts/"]').first().click();

    // 상세 페이지 내용 확인
    cy.get('h1').should('exist'); // 제목 확인
    cy.get('time').should('exist'); // 날짜 확인

    // 마크다운 렌더링 확인
    cy.get('article').should('exist');

    // 저자 정보 확인
    cy.contains('저자').should('exist');

    // 관련 포스트 확인
    cy.contains('관련 포스트').should('exist');

    // 다시 목록으로 이동
    cy.contains('목록으로').click();
    cy.url().should('include', '/posts');
  });

  it('포스트 페이지네이션 테스트', () => {
    cy.visit('/posts');

    // 페이지네이션 요소 확인
    cy.get('[aria-label="Pagination"]').should('exist');

    // 다음 페이지 버튼이 있는지 확인
    cy.get('[aria-label="Go to next page"]').should('exist');

    // 다음 페이지로 이동
    cy.get('[aria-label="Go to next page"]').click();
    cy.url().should('include', 'page=2');

    // 이전 페이지로 이동
    cy.get('[aria-label="Go to previous page"]').click();
    cy.url().should('include', 'page=1');
  });

  it('카테고리 페이지 테스트', () => {
    cy.visit('/categories');

    // 카테고리 목록 확인
    cy.get('a[href*="/categories/"]').should('have.length.at.least', 1);

    // 첫 번째 카테고리 클릭
    cy.get('a[href*="/categories/"]').first().click();

    // 카테고리 결과 페이지 확인
    cy.get('h1').should('exist');
    cy.get('a[href*="/posts/"]').should('exist');
  });

  it('태그 페이지 테스트', () => {
    cy.visit('/tags');

    // 태그 목록 확인
    cy.get('a[href*="/tags/"]').should('have.length.at.least', 1);

    // 첫 번째 태그 클릭
    cy.get('a[href*="/tags/"]').first().click();

    // 태그 결과 페이지 확인
    cy.get('h1').should('exist');
    cy.get('a[href*="/posts/"]').should('exist');
  });
});
