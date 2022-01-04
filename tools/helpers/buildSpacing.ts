export function buildSpacing(str: string) {
  return str.replace(/[A-Za-z가-힣0-9]/, 'O')
}