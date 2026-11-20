/**
 * Osobný text venovania pre Rada Ceglédyho.
 * TODO: Uprav texty nižšie podľa vlastného želania pred finálnym odovzdaním darčeka.
 */

/** Krátky text venovania zobrazený strojopisom počas 256×192 cutscény odovzdania plakety. */
export const HANDOVER_DEDICATION_LINES: string[] = [
  'RADE CEGLÉDMU',
  'Z RIMAVSKEJ SOBOTY A GEMERA',
  'ZA VÁŠ microDENT, TeatrO A LÍDERSTVO',
  '1975–2026 · CELOŽIVOTNÝ MVP',
];

/** Dlhý osobný odkaz občanov v Tajnej miestnosti 1270 (odomknutej tajným kódom z plakety). */
export const SECRET_ROOM_TITLE = 'Tajná miestnosť 1270 · Rymos Zumbota';

export const SECRET_ROOM_PARAGRAPHS: string[] = [
  'Milý Rado, ak čítaš tieto riadky, rozlúštil si kód z pamätnej plakety a vstúpil si do tajnej komnaty z roku 1270 — presne v duchu dobrodružstiev z éry Didaktiku M, Towdieho a Dizzyho.',
  'Keď sme vyrastali na pások kazetách s Didaktikom M, hranie Dizzyho či Towdieho bolo rituálom pod vianočným stromčekom. Čo začalo ako hra, stalo sa vaším životným poslaním.',
  
  'Prvý CEREC laser v regióne ste dali dohromady tak, že by ste aj dnes nainštalovali nový server bez toho, aby vás chcel niekto zastaviť. TeatrO.eu spája ľudí cez optiku rýchlejšie než kedysi rýchlostná cesta cez Hnúšťu.',
  
  'A keď sme boli v RSNET e-meetingoch o 22:00, alebo čakali na faxové potvrdenia z úradu, vždy ste mali čas na každý dotaz. To je to, čo robí z technologického lídra človeka s ľudským srdcom.',
  
  'Rimavská Sobota má svoj erb s orlom, ale vy ste ten skutočný hrdina, ktorý neustále mení našu krajinu k lepšiemu. Šťastné a veselé Vianoce, Rado — nech vám táto koleda (Tichá noc nad RS) pripomenie, že vaša práca zostane zapísaná v Kronike 1270.',
  'Nech ti táto hra a magnetická kazeta pripomínajú, že tvoja práca, nadšenie pre nové technológie aj ľudský prístup zanechávajú v Rimavskej Sobote trvalú stopu. Šťastné a veselé Vianoce!',
];

/** Deterministický základ, z ktorého sa vypočíta 8-znakový tajný kód na plakete a karte. */
export const SECRET_CODE_SEED = 'RYMOS-ZUMBOTA-1270-RADO-CEGLEDY-MVP';
