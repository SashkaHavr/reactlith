import pc from 'picocolors';

export const format = {
  command: (name: string) =>
    `${pc.italic(pc.cyan(`'pnpx reactlith ${name}'`))}`,
};
