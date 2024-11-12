import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules'],
  },
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  comments.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.json'],
        },
      },
    },

    rules: {
      '@eslint-community/eslint-comments/no-unused-disable': 'error',

      '@eslint-community/eslint-comments/disable-enable-pair': [
        'error',
        {
          allowWholeFile: true,
        },
      ],
    },
  },
  {
    files: ['**/*.test.js'],

    plugins: {
      jest,
    },

    languageOptions: {
      globals: {
        ...globals.jest,
        require: false,
      },
    },

    rules: {
      ...jest.configs['flat/recommended'].rules,
      'import/no-extraneous-dependencies': 'off',
      'jest/expect-expect': 'off',
      'jest/no-standalone-expect': 'off',
    },
  },
  {
    files: ['eslint.config.mjs', 'jest.config.js'],

    rules: {
      'import/no-default-export': 'off',
    },
  },
];
