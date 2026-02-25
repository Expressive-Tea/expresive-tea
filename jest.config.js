module.exports = {
  roots: ['<rootDir>/'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
        strictPropertyInitialization: false,
        skipLibCheck: true
      }
    }
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  extensionsToTreatAsEsm: [],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  verbose: false,
  displayName: 'EXP-TEA:CORE',
  testTimeout: 30000,
  collectCoverage: true,
  coverageDirectory: './coverage',
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  coveragePathIgnorePatterns: ['__test__/integrations/helpers', '__test__/test-classes'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'Expressive Tea Tests',
        outputDirectory: './reports',
        outputName: 'junit.xml',
        uniqueOutputName: false,
        classNameTemplate: '{classname}-{title}',
        titleTemplate: '{classname}-{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: 'true'
      }
    ]
  ],
  moduleNameMapper: {
    '^@classes$': '<rootDir>/classes',
    '^@classes/(.*)$': '<rootDir>/classes/$1',
    '^@decorators$': '<rootDir>/decorators',
    '^@decorators/(.*)$': '<rootDir>/decorators/$1',
    '^@engines$': '<rootDir>/engines',
    '^@engines/(.*)$': '<rootDir>/engines/$1',
    '^@exceptions$': '<rootDir>/exceptions',
    '^@exceptions/(.*)$': '<rootDir>/exceptions/$1',
    '^@helpers$': '<rootDir>/helpers',
    '^@helpers/(.*)$': '<rootDir>/helpers/$1',
    '^@interfaces$': '<rootDir>/interfaces',
    '^@interfaces/(.*)$': '<rootDir>/interfaces/$1',
    '^@libs$': '<rootDir>/libs',
    '^@libs/(.*)$': '<rootDir>/libs/$1',
    '^@services$': '<rootDir>/services',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@types$': '<rootDir>/types',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@mixins$': '<rootDir>/mixins',
    '^@mixins/(.*)$': '<rootDir>/mixins/$1',
    '^@config$': '<rootDir>/config',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@test-mocks$': '<rootDir>/__test__/__mocks__',
    '^@test-mocks/(.*)$': '<rootDir>/__test__/__mocks__/$1',
    '^@test-classes$': '<rootDir>/__test__/test-classes',
    '^@test-classes/(.*)$': '<rootDir>/__test__/test-classes/$1',
    '^@test-helpers$': '<rootDir>/__test__/integrations/helpers',
    '^@test-helpers/(.*)$': '<rootDir>/__test__/integrations/helpers/$1'
  }
};
