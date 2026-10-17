// The drawn characters, ported from the design mockups. Each one is drawn on a 64 by 64 canvas
// and clipped to a circle by the Avatar component. Generated from the mockups by gen/make_avatar_art.py.
import { ReactElement } from "react";
import { Circle, Ellipse, Line, Path, Polygon, Rect } from "react-native-svg";

export const ART: Record<string, () => ReactElement> = {
  fox: () => (
    <>
      <Polygon points="10,10 28,22 12,34" fill="#EE8A3A" />
      <Polygon points="54,10 36,22 52,34" fill="#EE8A3A" />
      <Ellipse cx="32" cy="38" rx="20" ry="17" fill="#EE8A3A" />
      <Ellipse cx="23" cy="45" rx="10" ry="8" fill="#FFF3E6" />
      <Ellipse cx="41" cy="45" rx="10" ry="8" fill="#FFF3E6" />
      <Circle cx="24" cy="34" r="3" fill="#1B2440" />
      <Circle cx="40" cy="34" r="3" fill="#1B2440" />
      <Circle cx="32" cy="46" r="3.2" fill="#1B2440" />
    </>
  ),
  owl: () => (
    <>
      <Polygon points="14,12 26,22 14,28" fill="#8C6239" />
      <Polygon points="50,12 38,22 50,28" fill="#8C6239" />
      <Ellipse cx="32" cy="37" rx="20" ry="19" fill="#A67C52" />
      <Circle cx="23" cy="33" r="9" fill="#FFFFFF" />
      <Circle cx="41" cy="33" r="9" fill="#FFFFFF" />
      <Circle cx="23" cy="34" r="4" fill="#1B2440" />
      <Circle cx="41" cy="34" r="4" fill="#1B2440" />
      <Polygon points="28,41 36,41 32,49" fill="#F2C14E" />
    </>
  ),
  bear: () => (
    <>
      <Circle cx="15" cy="19" r="8" fill="#7A4B2C" />
      <Circle cx="49" cy="19" r="8" fill="#7A4B2C" />
      <Circle cx="32" cy="37" r="20" fill="#8B5A3C" />
      <Ellipse cx="32" cy="45" rx="10" ry="8" fill="#E8C9A0" />
      <Circle cx="24" cy="34" r="3" fill="#1B2440" />
      <Circle cx="40" cy="34" r="3" fill="#1B2440" />
      <Ellipse cx="32" cy="43" rx="4" ry="3" fill="#1B2440" />
    </>
  ),
  frog: () => (
    <>
      <Ellipse cx="32" cy="40" rx="22" ry="16" fill="#5FB86B" />
      <Circle cx="20" cy="24" r="9" fill="#5FB86B" />
      <Circle cx="44" cy="24" r="9" fill="#5FB86B" />
      <Circle cx="20" cy="24" r="6" fill="#FFFFFF" />
      <Circle cx="44" cy="24" r="6" fill="#FFFFFF" />
      <Circle cx="20" cy="25" r="3" fill="#1B2440" />
      <Circle cx="44" cy="25" r="3" fill="#1B2440" />
      <Path d="M18 44 Q32 54 46 44" stroke="#1B2440" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  cat: () => (
    <>
      <Polygon points="12,10 28,22 11,34" fill="#9AA0B5" />
      <Polygon points="52,10 36,22 53,34" fill="#9AA0B5" />
      <Ellipse cx="32" cy="38" rx="21" ry="17" fill="#B4BAD0" />
      <Circle cx="24" cy="34" r="3" fill="#1B2440" />
      <Circle cx="40" cy="34" r="3" fill="#1B2440" />
      <Polygon points="29,43 35,43 32,47" fill="#E07A90" />
      <Path d="M6 42 L18 44 M6 49 L18 47 M58 42 L46 44 M58 49 L46 47" stroke="#1B2440" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  panda: () => (
    <>
      <Circle cx="15" cy="19" r="8" fill="#1B2440" />
      <Circle cx="49" cy="19" r="8" fill="#1B2440" />
      <Circle cx="32" cy="37" r="20" fill="#F4EFE6" />
      <Ellipse cx="23" cy="34" rx="6" ry="8" fill="#1B2440" rotation={20} originX={23} originY={34} />
      <Ellipse cx="41" cy="34" rx="6" ry="8" fill="#1B2440" rotation={-20} originX={41} originY={34} />
      <Circle cx="23" cy="34" r="2.4" fill="#FFFFFF" />
      <Circle cx="41" cy="34" r="2.4" fill="#FFFFFF" />
      <Ellipse cx="32" cy="45" rx="4" ry="3" fill="#1B2440" />
    </>
  ),
  penguin: () => (
    <>
      <Circle cx="32" cy="36" r="21" fill="#2A3350" />
      <Ellipse cx="32" cy="41" rx="14" ry="14" fill="#F4EFE6" />
      <Circle cx="25" cy="34" r="2.8" fill="#1B2440" />
      <Circle cx="39" cy="34" r="2.8" fill="#1B2440" />
      <Polygon points="27,40 37,40 32,48" fill="#F2A33C" />
    </>
  ),
  bunny: () => (
    <>
      <Ellipse cx="23" cy="14" rx="6" ry="14" fill="#F4EFE6" />
      <Ellipse cx="41" cy="14" rx="6" ry="14" fill="#F4EFE6" />
      <Ellipse cx="23" cy="15" rx="3" ry="9" fill="#F5B6C6" />
      <Ellipse cx="41" cy="15" rx="3" ry="9" fill="#F5B6C6" />
      <Circle cx="32" cy="40" r="19" fill="#F4EFE6" />
      <Circle cx="24" cy="34" r="3" fill="#1B2440" />
      <Circle cx="40" cy="34" r="3" fill="#1B2440" />
      <Circle cx="32" cy="43" r="2.6" fill="#E07A90" />
    </>
  ),
  lion: () => (
    <>
      <Circle cx="32" cy="34" r="27" fill="#C77B2B" />
      <Circle cx="32" cy="37" r="17" fill="#F2C14E" />
      <Circle cx="24" cy="34" r="3" fill="#1B2440" />
      <Circle cx="40" cy="34" r="3" fill="#1B2440" />
      <Ellipse cx="32" cy="44" rx="4" ry="3" fill="#8B4A1E" />
    </>
  ),
  octopus: () => (
    <>
      <Circle cx="32" cy="30" r="20" fill="#9B6BD3" />
      <Ellipse cx="16" cy="50" rx="5" ry="9" fill="#9B6BD3" />
      <Ellipse cx="27" cy="53" rx="5" ry="9" fill="#9B6BD3" />
      <Ellipse cx="38" cy="53" rx="5" ry="9" fill="#9B6BD3" />
      <Ellipse cx="49" cy="50" rx="5" ry="9" fill="#9B6BD3" />
      <Circle cx="24" cy="30" r="3.2" fill="#1B2440" />
      <Circle cx="40" cy="30" r="3.2" fill="#1B2440" />
      <Path d="M26 40 Q32 45 38 40" stroke="#1B2440" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  pig: () => (
    <>
      <Polygon points="12,12 28,18 14,30" fill="#F29BB0" />
      <Polygon points="52,12 36,18 50,30" fill="#F29BB0" />
      <Circle cx="32" cy="37" r="20" fill="#F7B4C4" />
      <Circle cx="24" cy="32" r="3" fill="#1B2440" />
      <Circle cx="40" cy="32" r="3" fill="#1B2440" />
      <Ellipse cx="32" cy="44" rx="9" ry="7" fill="#F29BB0" />
      <Circle cx="29" cy="44" r="1.8" fill="#1B2440" />
      <Circle cx="35" cy="44" r="1.8" fill="#1B2440" />
    </>
  ),
  mouse: () => (
    <>
      <Circle cx="14" cy="20" r="10" fill="#B4BAD0" />
      <Circle cx="14" cy="20" r="6" fill="#F5B6C6" />
      <Circle cx="50" cy="20" r="10" fill="#B4BAD0" />
      <Circle cx="50" cy="20" r="6" fill="#F5B6C6" />
      <Ellipse cx="32" cy="38" rx="19" ry="17" fill="#C9CEE0" />
      <Circle cx="24" cy="34" r="3" fill="#1B2440" />
      <Circle cx="40" cy="34" r="3" fill="#1B2440" />
      <Circle cx="32" cy="44" r="3" fill="#E07A90" />
    </>
  ),
  robot: () => (
    <>
      <Line x1="32" y1="6" x2="32" y2="15" stroke="#FFFFFF" strokeWidth="3" />
      <Circle cx="32" cy="6" r="3.5" fill="#F2C14E" />
      <Rect x="12" y="14" width="40" height="34" rx="8" fill="#C9D1EC" />
      <Rect x="19" y="24" width="10" height="10" rx="2" fill="#1B2440" />
      <Rect x="35" y="24" width="10" height="10" rx="2" fill="#1B2440" />
      <Rect x="23" y="40" width="18" height="4" rx="2" fill="#1B2440" />
    </>
  ),
};
