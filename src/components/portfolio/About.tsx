'use client';

import { AiTwotoneMail } from '@react-icons/all-files/ai/AiTwotoneMail';
import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { FaSearchLocation } from '@react-icons/all-files/fa/FaSearchLocation';
import { MdCall } from '@react-icons/all-files/md/MdCall';
import { MdCast } from '@react-icons/all-files/md/MdCast';
import { MdPeople } from '@react-icons/all-files/md/MdPeople';
import AboutBox from './AboutBox';

const About = () => {
  return (
    <article
      id="about"
      className="grid size-full h-[320px] grid-cols-3 gap-6 bg-blue-400 p-10"
    >
      <AboutBox title="이름" description="유주환" icon={MdPeople} />
      <AboutBox title="생년월일" description="00.09.21" icon={FaCalendarAlt} />
      <AboutBox
        title="주소지"
        description="서울특별시 관악구"
        icon={FaSearchLocation}
      />
      <AboutBox title="연락처" description="010-3352-3921" icon={MdCall} />
      <AboutBox
        title="이메일"
        description="ironjustlikethat@gmail.com"
        type="email"
        icon={AiTwotoneMail}
      />
      <AboutBox
        title="학력"
        description="학점은행제 컴퓨터공학"
        icon={MdCast}
      />
    </article>
  );
};

export default About;
