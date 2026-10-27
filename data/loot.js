// 색은 실제 보석 기본 경험치와 연결된다. 배율은 수집할 때 한 번만 적용한다.
export const PICKUP_SIZE = 30;
export const XP_GEMS = [
  { id:'green', name:'초록', value:2, color:'#36d99a', light:'#d7fff0', dark:'#126b61' },
  { id:'blue', name:'파랑', value:5, color:'#419eff', light:'#e4f6ff', dark:'#1d4596' },
  { id:'purple', name:'보라', value:10, color:'#ad6bff', light:'#f4e8ff', dark:'#61319b' },
  { id:'gold', name:'금빛', value:25, color:'#ffbf45', light:'#fff6cc', dark:'#a66322' },
];
export function xpGem(value) {
  for(let i=XP_GEMS.length-1;i>=0;i--) if(value>=XP_GEMS[i].value) return XP_GEMS[i];
  return XP_GEMS[0];
}
export function enemyXp(base, region=0, elite=false, mini=false) {
  if (elite) return 25;
  if (mini) return 2;
  if (base >= 3) return region >= 1 ? 10 : 5;
  if (base >= 2 || region >= 3) return 5;
  return 2;
}
export const bossXp = mid => mid ? [10,10,10,10,10,10] : [25,10,10,10,10,10];
