module.exports = {
  roots: [
    '<rootDir>/'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.spec.json'
    }]
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: false,
  displayName: 'EXP-TEA:CORE',
  testTimeout: 30000,
  collectCoverage: true,
  coverageDirectory: './coverage',
  coveragePathIgnorePatterns: [
    '__test__/integrations/helpers',
    '__test__/test-classes'
  ],
  reporters: [
    'default',
    ['jest-junit', {
      suiteName: 'Expressive Tea Tests',
      outputDirectory: './reports',
      outputName: 'junit.xml',
      uniqueOutputName: false,
      classNameTemplate: '{classname}-{title}',
      titleTemplate: '{classname}-{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: 'true'
    }]
  ]
};
