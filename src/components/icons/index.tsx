'use client';

/**
 * 최적화된 아이콘 컴포넌트 모음
 * @react-icons/all-files 패키지에서 개별 아이콘만 import하여
 * 번들 크기를 줄이고 경고를 해결합니다.
 */

// ai 아이콘들
import { AiFillGithub } from '@react-icons/all-files/ai/AiFillGithub';
import { AiOutlineBook } from '@react-icons/all-files/ai/AiOutlineBook';
import { AiOutlineClose } from '@react-icons/all-files/ai/AiOutlineClose';
import { AiOutlineFire } from '@react-icons/all-files/ai/AiOutlineFire';
import { AiOutlineInfoCircle } from '@react-icons/all-files/ai/AiOutlineInfoCircle';
import { AiOutlineMail } from '@react-icons/all-files/ai/AiOutlineMail';
import { AiOutlineMenu } from '@react-icons/all-files/ai/AiOutlineMenu';
import { AiOutlineSearch } from '@react-icons/all-files/ai/AiOutlineSearch';
import { AiOutlineTag } from '@react-icons/all-files/ai/AiOutlineTag';

// bi 아이콘들
import { BiFilter } from '@react-icons/all-files/bi/BiFilter';

// bs 아이콘들
import { BsFileText } from '@react-icons/all-files/bs/BsFileText';
import { BsGrid } from '@react-icons/all-files/bs/BsGrid';
import { BsLightning } from '@react-icons/all-files/bs/BsLightning';
import { BsMoon } from '@react-icons/all-files/bs/BsMoon';
import { BsPencilSquare } from '@react-icons/all-files/bs/BsPencilSquare';
import { BsSun } from '@react-icons/all-files/bs/BsSun';

// fa 아이콘들
import { FaArrowRight } from '@react-icons/all-files/fa/FaArrowRight';
import { FaBlog } from '@react-icons/all-files/fa/FaBlog';
import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { FaCode } from '@react-icons/all-files/fa/FaCode';
import { FaCodeBranch } from '@react-icons/all-files/fa/FaCodeBranch';
import { FaDatabase } from '@react-icons/all-files/fa/FaDatabase';
import { FaDiscord } from '@react-icons/all-files/fa/FaDiscord';
import { FaEthereum } from '@react-icons/all-files/fa/FaEthereum';
import { FaFolder } from '@react-icons/all-files/fa/FaFolder';
import { FaGithub } from '@react-icons/all-files/fa/FaGithub';
import { FaLaptopCode } from '@react-icons/all-files/fa/FaLaptopCode';
import { FaNodeJs } from '@react-icons/all-files/fa/FaNodeJs';
import { FaReact } from '@react-icons/all-files/fa/FaReact';
import { FaSearch } from '@react-icons/all-files/fa/FaSearch';
import { FaServer } from '@react-icons/all-files/fa/FaServer';
import { FaTags } from '@react-icons/all-files/fa/FaTags';
import { FaTools } from '@react-icons/all-files/fa/FaTools';
import { FaTwitter } from '@react-icons/all-files/fa/FaTwitter';

// hi 아이콘들
import { HiBadgeCheck } from '@react-icons/all-files/hi/HiBadgeCheck';
import { HiBriefcase } from '@react-icons/all-files/hi/HiBriefcase';
import { HiLightBulb } from '@react-icons/all-files/hi/HiLightBulb';

// io 아이콘들
import { IoClose } from '@react-icons/all-files/io5/IoClose';

// 아이콘 컴포넌트 내보내기
export {
  // ai 아이콘
  AiFillGithub,
  AiOutlineBook,
  AiOutlineClose,
  AiOutlineFire,
  AiOutlineInfoCircle,
  AiOutlineMail,
  AiOutlineMenu,
  AiOutlineSearch,
  AiOutlineTag,

  // bi 아이콘
  BiFilter as BiFilterAlt,

  // bs 아이콘
  BsFileText as BsFileEarmarkPost,
  BsGrid,
  BsLightning as BsLightningCharge,
  BsMoon as BsMoonStarsFill,
  BsPencilSquare,
  BsSun as BsSunFill,

  // fa 아이콘
  FaArrowRight,
  FaBlog,
  FaCalendarAlt,
  FaCode,
  FaCodeBranch,
  FaDatabase,
  FaDiscord,
  FaEthereum,
  FaFolder,
  FaGithub,
  FaLaptopCode,
  FaNodeJs,
  FaReact,
  FaSearch,
  FaServer,
  FaTags,
  FaTools,
  FaTwitter,

  // hi 아이콘들
  HiBadgeCheck,
  HiBriefcase,
  HiLightBulb,

  // io 아이콘
  IoClose
};

// 추가 별칭들 - 아이콘이 없는 경우 대체
export const AiOutlineGithub = AiFillGithub;
export const AiOutlineTwitter = FaTwitter;
export const BiCategory = FaFolder;

// MdHealthAndSafety, MdPhoneIphone, MdWeb 아이콘들을 다른 아이콘으로 대체
export const MdHealthAndSafety = FaTools;
export const MdPhoneIphone = FaLaptopCode;
export const MdWeb = FaReact;

// SiCypress, SiExpress, SiGraphql, SiMongodb, SiTailwindcss, SiTypescript, SiVercel 아이콘들을 다른 아이콘으로 대체
export const SiCypress = FaTools;
export const SiExpress = FaNodeJs;
export const SiGraphql = FaCodeBranch;
export const SiMongodb = FaDatabase;
export const SiTailwindcss = FaLaptopCode;
export const SiTypescript = FaCode;
export const SiVercel = FaServer;

// TbApi 아이콘을 다른 아이콘으로 대체
export const TbApi = FaNodeJs;

// RiUserFollowLine 아이콘을 다른 아이콘으로 대체
export const RiUserFollowLine = HiBadgeCheck;

// si 아이콘 대체 (필요한 경우)
export const SiNextdotjs = AiOutlineFire;
export const SiSolidity = FaEthereum;
