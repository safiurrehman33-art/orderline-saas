/** Shared floor-plan grid math (safe for client + server). */
export function floorGridPosition(index: number) {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return { posX: 48 + col * 170, posY: 48 + row * 150 };
}
