module.exports = {
	roots: [
    "<rootDir>/"
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: false,
  displayName: 'EXP-TEA:CORE',
  testTimeout: 30000,
  collectCoverage: true,
  coverageDirectory: "./coverage",
  coveragePathIgnorePatterns: [
    '__test__/integrations/helpers',
    '__test__/test-classes'
  ]
};
