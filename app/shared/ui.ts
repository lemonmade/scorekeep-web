export function classes(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
