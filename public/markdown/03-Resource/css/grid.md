grid-template-rows -> 가로에 해당하는 폭을 지정
-> repeat(2, 100px); 2개를 100px로 지정하고 나머지는 auto값.

grid-template-column -> 세로에 해당하는 폭을 지정
-> 100px minmax(100px, 3fr) 1fr;   

grid-gap -> 서로의 공간의 여백을 얼만큼 줄것인지.

grid-template-areas: " header header" "main aside" "footer footer"