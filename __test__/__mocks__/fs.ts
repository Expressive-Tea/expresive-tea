export const readFileSync = jest.fn().mockImplementation((filename: string) => {
  return Buffer.from(filename);
});
