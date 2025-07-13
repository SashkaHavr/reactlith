import pc from 'picocolors';

export const format = {
  command: (name: string) => pc.bold(pc.cyan(`pnpx reactlith ${name}`)),
  path: (path: string) => pc.underline(pc.green(path)),
};
