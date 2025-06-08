import eslintJS from '@eslint/js';
import eslintTS from 'typescript-eslint';
import eslintNG from 'angular-eslint';
import eslintStylistic from '@stylistic/eslint-plugin';

export default eslintTS.config(
  {
    files: ['**/*.ts'],
    ignores: ['.node_modules/*'],
    extends: [
      eslintJS.configs.recommended,
      ...eslintTS.configs.strictTypeChecked,
      ...eslintTS.configs.stylisticTypeChecked,
      ...eslintNG.configs.tsRecommended,
      eslintStylistic.configs['disable-legacy'],
      eslintStylistic.configs.customize({
        arrowParens: true,
        braceStyle: '1tbs',
        flat: true,
        jsx: false,
        quotes: 'single',
        quoteProps: 'as-needed',
        semi: true,
      }),
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: eslintNG.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      "@angular-eslint/no-async-lifecycle-method": "error",
      "@angular-eslint/no-conflicting-lifecycle": "error",
      "@angular-eslint/no-lifecycle-call": "error",
      "@angular-eslint/no-pipe-impure": "error",
      "@angular-eslint/prefer-inject": "off",
      "@angular-eslint/prefer-on-push-component-change-detection": "warn",
      "@angular-eslint/prefer-output-readonly": "error",
      "@angular-eslint/sort-lifecycle-methods": "error",
      "max-len": "off",
      "@stylistic/max-len": ["error", {
        code: 110,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
      }],
      "@stylistic/semi": ["error", "always", {
        omitLastInOneLineBlock: true,
      }],
      "@typescript-eslint/explicit-member-accessibility": ["error", {
        overrides: {
          constructors: 'off',
        },
      }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "max-params": "off",
      "@typescript-eslint/max-params": ["error", { max: 4 }],
      "max-statements-per-line": "off",
      "@stylistic/max-statements-per-line": ["error", { max: 2 }],
      "@typescript-eslint/member-ordering": "off",
      "@typescript-eslint/no-confusing-void-expression": ["error", {
        ignoreArrowShorthand: true,
      }],
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unused-vars": ["error", {
        caughtErrors: "none",
      }],
      "@typescript-eslint/non-nullable-type-assertion-style": "off",
      "@typescript-eslint/unbound-method": "off",
      "no-console": "warn",
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...eslintNG.configs.templateRecommended,
      ...eslintNG.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/template/alt-text": "error",
      "@angular-eslint/template/attributes-order": "error",
      "@angular-eslint/template/conditional-complexity": "error",
      "@angular-eslint/template/label-has-associated-control": "error",
      "@angular-eslint/template/no-call-expression": "off",
      "@angular-eslint/template/no-negated-async": "error",
      "@angular-eslint/template/prefer-control-flow": "error",
      "@angular-eslint/template/prefer-self-closing-tags": "error",
      "@angular-eslint/template/valid-aria": "error"
    },
  },
);
